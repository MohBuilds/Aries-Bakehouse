-- Ordering hardening: delivery zones, three daily time slots, and every
-- ordering rule enforced by the database instead of the browser.
--
-- Closes (all verified against the live schema before writing this):
--   * Customers could INSERT straight into "order" / order_item (RLS policy
--     "owner insert"), skipping create_order() and every price check.
--   * create_order() trusted the client's `status`, so an order could be
--     created already "confirmed".
--   * Delivery orders with no zone paid a ₦0 fee; nothing loaded zones.
--   * No server-side date / slot / notice rules (24 h was browser-only).
--   * Negative or absurd quantities were accepted.
--   * discount_code was publicly readable (every code listable), expired
--     codes still worked via create_order, usage was consumed on "Apply".
--   * Paystack confirmation was non-atomic and only the webhook sent email.
--
-- Backward compatible for data: nothing is dropped except two INSERT policies
-- and the public discount_code read. Existing orders are untouched.

-- ============================================================
-- 1. Ordering settings (single row, admin-editable)
-- ============================================================
create table if not exists ordering_settings (
  id boolean primary key default true check (id),
  lead_hours integer not null default 24 check (lead_hours >= 0),
  max_advance_days integer not null default 60 check (max_advance_days between 1 and 365),
  open_weekdays integer[] not null default '{1,2,3,4,5,6}',   -- 0 = Sunday; Mon–Sat per the footer
  hold_minutes integer not null default 30 check (hold_minutes >= 0), -- unpaid orders hold a slot this long
  timezone text not null default 'Africa/Lagos'
);
insert into ordering_settings (id) values (true) on conflict (id) do nothing;

alter table ordering_settings enable row level security;
drop policy if exists "ordering_settings public read" on ordering_settings;
create policy "ordering_settings public read" on ordering_settings for select using (true);
drop policy if exists "ordering_settings admin write" on ordering_settings;
create policy "ordering_settings admin write" on ordering_settings for all using (is_admin()) with check (is_admin());

-- ============================================================
-- 2. The three daily slots
-- ============================================================
create table if not exists delivery_slot (
  code text primary key check (code in ('morning','afternoon','evening')),
  label text not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  capacity integer check (capacity is null or capacity > 0),   -- null = unlimited
  active boolean not null default true,
  sort_order integer not null default 0
);
insert into delivery_slot (code, label, start_time, end_time, sort_order) values
  ('morning',   'Morning',   '09:00', '12:00', 1),
  ('afternoon', 'Afternoon', '12:00', '16:00', 2),
  ('evening',   'Evening',   '16:00', '19:00', 3)
on conflict (code) do nothing;

alter table delivery_slot enable row level security;
drop policy if exists "delivery_slot public read" on delivery_slot;
create policy "delivery_slot public read" on delivery_slot for select using (true);
drop policy if exists "delivery_slot admin write" on delivery_slot;
create policy "delivery_slot admin write" on delivery_slot for all using (is_admin()) with check (is_admin());

-- ============================================================
-- 3. Delivery zones (address categories) on delivery_option
-- ============================================================
alter table delivery_option add column if not exists areas text[] not null default '{}';
alter table delivery_option add column if not exists description text;
alter table delivery_option add column if not exists sort_order integer not null default 0;
-- false = fee not set yet: customer pays for the bakes online and the team
-- confirms the delivery fee on WhatsApp (the existing policy in PRODUCT.md).
alter table delivery_option add column if not exists fee_confirmed boolean not null default true;

alter table "order" add column if not exists delivery_area text;
alter table "order" add column if not exists delivery_fee_pending boolean not null default false;
alter table "order" add column if not exists scheduled_start timestamptz;

-- Seed zones from the areas already published on the Delivery page. Fees are
-- deliberately NOT invented: fee_confirmed = false until the owner sets them.
update delivery_option set active = false where name = 'Delivery — Abeokuta';

insert into delivery_option (name, type, zone, fee, active, areas, description, sort_order, fee_confirmed) values
  ('Central Abeokuta', 'delivery', 'Central', 0, true,
     array['Ibara','Oke-Mosan','Kuto','Isale-Igbein','Camp'],
     'Ibara, Oke-Mosan, Kuto, Isale-Igbein and Camp', 10, false),
  ('Outer Abeokuta', 'delivery', 'Outer', 0, true,
     array['Adigbe','Obantoko'],
     'Adigbe and Obantoko', 20, false),
  ('Other Abeokuta areas', 'delivery', 'Other', 0, true,
     '{}',
     'Anywhere else in Abeokuta. We confirm availability and the fee on WhatsApp.', 30, false)
on conflict (name) do nothing;

create index if not exists order_slot_idx on "order" (preferred_date, preferred_time);

-- ============================================================
-- 4. Schedule helpers
-- ============================================================
create or replace function slot_start(p_date date, p_code text) returns timestamptz
language sql stable set search_path = public as $$
  select ((p_date + s.start_time) at time zone st.timezone)
  from delivery_slot s, ordering_settings st
  where s.code = p_code;
$$;

-- Orders that currently hold capacity in a slot: anything paid/in progress,
-- plus unpaid orders for a short hold window (so abandoned carts free up).
create or replace function slot_load(p_date date, p_code text) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::integer from "order" o, ordering_settings st
  where o.preferred_date = p_date and o.preferred_time = p_code
    and (o.status in ('confirmed','preparing','ready_or_out','completed')
         or (o.status = 'pending' and o.created_at > now() - make_interval(mins => st.hold_minutes)));
$$;

-- What the checkout shows: every slot for the next N days with whether it can
-- be booked and why not. Computed from the SERVER clock, never the browser's.
create or replace function get_slot_availability(p_days integer default 21)
returns table (slot_date date, code text, label text, start_time time, end_time time,
               available boolean, reason text, remaining integer)
language plpgsql stable security definer set search_path = public as $$
declare
  st ordering_settings;
  d date;
  s delivery_slot;
  v_today date;
  v_load integer;
begin
  select * into st from ordering_settings;
  v_today := (now() at time zone st.timezone)::date;
  for d in select generate_series(v_today, v_today + least(greatest(p_days, 1), st.max_advance_days), interval '1 day')::date loop
    for s in select * from delivery_slot where active order by sort_order loop
      slot_date := d; code := s.code; label := s.label;
      start_time := s.start_time; end_time := s.end_time;
      remaining := null;
      v_load := slot_load(d, s.code);
      if s.capacity is not null then remaining := greatest(0, s.capacity - v_load); end if;
      if not (extract(dow from d)::integer = any (st.open_weekdays)) then
        available := false; reason := 'closed';
      elsif slot_start(d, s.code) < now() + make_interval(hours => st.lead_hours) then
        available := false; reason := 'notice';
      elsif s.capacity is not null and v_load >= s.capacity then
        available := false; reason := 'full';
      else
        available := true; reason := null;
      end if;
      return next;
    end loop;
  end loop;
end;
$$;
grant execute on function get_slot_availability(integer) to anon, authenticated;

-- ============================================================
-- 5. Discounts: validate without consuming; stop leaking the table
-- ============================================================
drop policy if exists "discount_code public read" on discount_code;
-- admins keep full access through "discount_code admin write" (FOR ALL).

create or replace function redeem_discount_code(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_row discount_code;
begin
  select * into v_row from discount_code where code = p_code;
  if not found or not v_row.active then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;
  if v_row.usage_limit is not null and v_row.times_used >= v_row.usage_limit then
    return jsonb_build_object('valid', false, 'reason', 'usage_limit_reached');
  end if;
  -- Usage is consumed when the order is PAID (confirm_payment), not on "Apply".
  return jsonb_build_object('valid', true, 'id', v_row.id, 'type', v_row.type, 'value', v_row.value);
end;
$$;

-- ============================================================
-- 6. Close the direct-insert bypass
-- ============================================================
-- create_order() is SECURITY DEFINER and writes these tables itself.
drop policy if exists "order owner insert" on "order";
drop policy if exists "order_item owner insert" on order_item;

-- ============================================================
-- 7. create_order(): every rule enforced here
-- ============================================================
create or replace function create_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  st ordering_settings;
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product product;
  v_selections jsonb;
  v_qty integer;
  v_unit_price integer;
  v_line_total integer;
  v_subtotal integer := 0;
  v_has_unpriced boolean := false;
  v_priced_items jsonb[] := '{}';
  v_slot delivery_slot;
  v_date date;
  v_zone delivery_option;
  v_area text;
  v_address text;
  v_delivery_fee integer := 0;
  v_fee_pending boolean := false;
  v_discount discount_code;
  v_discount_amount integer := 0;
  v_total integer;
  v_fulfilment text;
  v_reference text;
  v_existing record;
  v_name text;
  v_phone text;
begin
  select * into st from ordering_settings;

  select id into v_customer_id from customer where auth_user_id = auth.uid();
  if v_customer_id is null then
    raise exception 'ORDER_ERROR:no_customer';
  end if;

  -- Idempotent retry: the same payment reference returns the same order
  -- instead of creating a duplicate.
  v_reference := nullif(payload->>'payment_reference', '');
  if v_reference is not null then
    select o.id, o.order_number, o.subtotal, o.delivery_fee, o.discount_amount, o.total, o.delivery_fee_pending, o.customer_id
      into v_existing
      from payment p join "order" o on o.id = p.order_id where p.reference = v_reference;
    if found then
      if v_existing.customer_id <> v_customer_id then raise exception 'ORDER_ERROR:reference_taken'; end if;
      return jsonb_build_object('id', v_existing.id, 'order_number', v_existing.order_number,
        'subtotal', v_existing.subtotal, 'delivery_fee', v_existing.delivery_fee,
        'discount_amount', v_existing.discount_amount, 'total', v_existing.total,
        'delivery_fee_pending', v_existing.delivery_fee_pending);
    end if;
  end if;

  -- Throttle order spam (each unpaid order also holds a slot for a while).
  if (select count(*) from "order" where customer_id = v_customer_id and status = 'pending'
        and created_at > now() - interval '1 hour') >= 8 then
    raise exception 'ORDER_ERROR:too_many_pending';
  end if;

  v_fulfilment := payload->>'fulfilment_type';
  if v_fulfilment is null or v_fulfilment not in ('pickup','delivery') then
    raise exception 'ORDER_ERROR:fulfilment_invalid';
  end if;

  v_name := btrim(coalesce(payload->>'customer_name', ''));
  v_phone := btrim(coalesce(payload->>'customer_phone', ''));
  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'ORDER_ERROR:name_invalid'; end if;
  if v_phone !~ '^[0-9+()\-\s]{7,20}$' then raise exception 'ORDER_ERROR:phone_invalid'; end if;

  -- ---- schedule: the date must be a bookable slot (notice, open day, capacity)
  select * into v_slot from delivery_slot where code = payload->>'preferred_time' and active;
  if v_slot is null then raise exception 'ORDER_ERROR:slot_invalid'; end if;
  begin
    v_date := (payload->>'preferred_date')::date;
  exception when others then
    raise exception 'ORDER_ERROR:date_invalid';
  end;
  if v_date is null then raise exception 'ORDER_ERROR:date_invalid'; end if;
  if not (extract(dow from v_date)::integer = any (st.open_weekdays)) then
    raise exception 'ORDER_ERROR:closed_day';
  end if;
  if slot_start(v_date, v_slot.code) < now() + make_interval(hours => st.lead_hours) then
    raise exception 'ORDER_ERROR:notice_required';
  end if;
  if v_date > (now() at time zone st.timezone)::date + st.max_advance_days then
    raise exception 'ORDER_ERROR:too_far_ahead';
  end if;
  -- Serialise bookings for this exact slot so two customers can't both take the last place.
  perform pg_advisory_xact_lock(hashtextextended(v_date::text || ':' || v_slot.code, 0));
  if v_slot.capacity is not null and slot_load(v_date, v_slot.code) >= v_slot.capacity then
    raise exception 'ORDER_ERROR:slot_full';
  end if;

  -- ---- delivery zone, area, address
  if v_fulfilment = 'delivery' then
    select * into v_zone from delivery_option
      where id = nullif(payload->>'delivery_option_id','')::uuid and type = 'delivery' and active;
    if v_zone is null then raise exception 'ORDER_ERROR:zone_required'; end if;
    v_area := btrim(coalesce(payload->>'delivery_area', ''));
    if cardinality(v_zone.areas) > 0 then
      if not (v_area = any (v_zone.areas)) then raise exception 'ORDER_ERROR:area_invalid'; end if;
    elsif char_length(v_area) < 2 then
      raise exception 'ORDER_ERROR:area_required';
    end if;
    v_address := btrim(coalesce(payload->>'address_text', ''));
    if char_length(v_address) < 10 then raise exception 'ORDER_ERROR:address_required'; end if;
    if v_zone.fee_confirmed then v_delivery_fee := v_zone.fee; else v_fee_pending := true; end if;
  end if;

  -- ---- discount: must be currently valid
  if nullif(payload->>'discount_code_id','') is not null then
    select * into v_discount from discount_code where id = (payload->>'discount_code_id')::uuid and active;
    if v_discount is null
       or (v_discount.expires_at is not null and v_discount.expires_at < now())
       or (v_discount.usage_limit is not null and v_discount.times_used >= v_discount.usage_limit) then
      raise exception 'ORDER_ERROR:discount_invalid';
    end if;
  end if;

  -- ---- items
  if jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items') = 0
     or jsonb_array_length(payload->'items') > 40 then
    raise exception 'ORDER_ERROR:items_invalid';
  end if;
  for v_item in select * from jsonb_array_elements(payload->'items') loop
    if nullif(v_item->>'product_id','') is null then raise exception 'ORDER_ERROR:items_invalid'; end if;
    select * into v_product from product where id = (v_item->>'product_id')::uuid and is_active;
    if v_product is null or v_product.availability = 'unavailable' then raise exception 'ORDER_ERROR:product_unavailable'; end if;

    begin
      v_qty := (v_item->>'quantity')::integer;
    exception when others then
      raise exception 'ORDER_ERROR:quantity_invalid';
    end;
    if v_qty is null or v_qty < 1 or v_qty > 50 then raise exception 'ORDER_ERROR:quantity_invalid'; end if;

    v_selections := coalesce(v_item->'variant_selections', '{}'::jsonb);
    v_unit_price := price_order_item(v_product, v_selections);
    v_line_total := case when v_unit_price is null then null else v_unit_price * v_qty end;
    if v_line_total is null then v_has_unpriced := true; else v_subtotal := v_subtotal + v_line_total; end if;

    v_priced_items := v_priced_items || jsonb_build_object(
      'product_id', v_item->>'product_id', 'name', v_product.name,
      'variant_selections', v_selections, 'quantity', v_qty,
      'unit_price', v_unit_price, 'line_total', v_line_total, 'image_url', v_item->>'image_url');
  end loop;

  if v_discount.id is not null then
    v_discount_amount := case
      when v_discount.type = 'percentage' then least(v_subtotal, round(v_subtotal * v_discount.value / 100.0)::integer)
      else least(v_subtotal, v_discount.value) end;
  end if;
  v_total := greatest(0, v_subtotal + v_delivery_fee - v_discount_amount);

  v_order_number := 'A11-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into "order" (
    order_number, customer_id, status, fulfilment_type, delivery_option_id, delivery_area,
    address_text, preferred_date, preferred_time, scheduled_start, customer_name, customer_phone,
    customer_email, special_instructions, discount_code_id,
    subtotal, delivery_fee, delivery_fee_pending, discount_amount, total, has_unpriced_items, fallback_channel
  ) values (
    v_order_number, v_customer_id,
    'pending',                                         -- never client-controlled
    v_fulfilment, v_zone.id, v_area,
    v_address, v_date, v_slot.code, slot_start(v_date, v_slot.code), v_name, v_phone,
    nullif(btrim(coalesce(payload->>'customer_email','')), ''),
    nullif(left(btrim(coalesce(payload->>'special_instructions','')), 1000), ''),
    v_discount.id,
    v_subtotal, v_delivery_fee, v_fee_pending, v_discount_amount, v_total, v_has_unpriced,
    case when payload->>'fallback_channel' = 'whatsapp' then 'whatsapp' else null end
  ) returning id into v_order_id;

  for v_item in select * from unnest(v_priced_items) loop
    insert into order_item (order_id, product_id, product_name_snapshot, variant_selections, quantity, unit_price, line_total, image_url)
    values (v_order_id, nullif(v_item->>'product_id','')::uuid, v_item->>'name', v_item->'variant_selections',
            (v_item->>'quantity')::integer, nullif(v_item->>'unit_price','')::integer,
            nullif(v_item->>'line_total','')::integer, v_item->>'image_url');
  end loop;

  if v_reference is not null then
    insert into payment (order_id, reference, amount, status) values (v_order_id, v_reference, v_total, 'pending');
  end if;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number,
    'subtotal', v_subtotal, 'delivery_fee', v_delivery_fee, 'discount_amount', v_discount_amount,
    'total', v_total, 'delivery_fee_pending', v_fee_pending);
end;
$$;

-- ============================================================
-- 8. Payment attempts: retry on the SAME order (no duplicate orders)
-- ============================================================
create or replace function add_payment_attempt(p_order_id uuid, p_reference text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order "order";
begin
  if p_reference is null or char_length(p_reference) < 8 or char_length(p_reference) > 100 then
    raise exception 'ORDER_ERROR:reference_invalid';
  end if;
  select * into v_order from "order" where id = p_order_id for update;
  if not found or not owns_customer(v_order.customer_id) then raise exception 'ORDER_ERROR:order_not_found'; end if;
  if v_order.status <> 'pending' then raise exception 'ORDER_ERROR:order_not_payable'; end if;
  if exists (select 1 from payment where order_id = p_order_id and status = 'success') then
    raise exception 'ORDER_ERROR:already_paid';
  end if;
  if (select count(*) from payment where order_id = p_order_id) >= 10 then
    raise exception 'ORDER_ERROR:too_many_attempts';
  end if;
  insert into payment (order_id, reference, amount, status) values (p_order_id, p_reference, v_order.total, 'pending');
  return jsonb_build_object('amount', v_order.total, 'order_number', v_order.order_number);
end;
$$;

-- ============================================================
-- 9. Atomic payment confirmation (called ONLY by the edge functions)
-- ============================================================
create or replace function confirm_payment(p_reference text, p_amount_kobo bigint, p_currency text, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_payment payment;
  v_order "order";
  v_transitioned boolean := false;
  v_duplicate boolean := false;
  v_slot delivery_slot;
  v_zone_name text;
begin
  select * into v_payment from payment where reference = p_reference for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'unknown_reference'); end if;

  select * into v_order from "order" where id = v_payment.order_id for update;

  if v_payment.status = 'success' then
    return jsonb_build_object('ok', true, 'already', true, 'transitioned', false,
      'order_id', v_order.id, 'order_number', v_order.order_number);
  end if;

  if coalesce(upper(p_currency), '') <> upper(v_payment.currency) or v_payment.amount::bigint * 100 <> p_amount_kobo then
    update payment set raw_webhook_payload = jsonb_build_object('rejected', 'amount_or_currency_mismatch',
      'expected_kobo', v_payment.amount::bigint * 100, 'got_kobo', p_amount_kobo, 'currency', p_currency, 'event', p_payload)
    where id = v_payment.id;
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch');
  end if;

  update payment set status = 'success', verified_at = now(), raw_webhook_payload = p_payload where id = v_payment.id;

  if v_order.status = 'pending' then
    update "order" set status = 'confirmed', updated_at = now() where id = v_order.id;
    v_transitioned := true;
    if v_order.discount_code_id is not null then
      update discount_code set times_used = times_used + 1 where id = v_order.discount_code_id;
    end if;
  elsif exists (select 1 from payment where order_id = v_order.id and status = 'success' and id <> v_payment.id) then
    v_duplicate := true;    -- paid twice: needs a refund
  elsif v_order.status = 'cancelled' then
    return jsonb_build_object('ok', false, 'reason', 'order_cancelled', 'order_id', v_order.id, 'order_number', v_order.order_number);
  end if;

  select * into v_slot from delivery_slot where code = v_order.preferred_time;
  select name into v_zone_name from delivery_option where id = v_order.delivery_option_id;

  return jsonb_build_object('ok', true, 'transitioned', v_transitioned, 'duplicate_payment', v_duplicate,
    'order_id', v_order.id, 'order_number', v_order.order_number, 'total', v_order.total,
    'customer_name', v_order.customer_name, 'customer_email', v_order.customer_email,
    'fulfilment', v_order.fulfilment_type, 'delivery_area', v_order.delivery_area, 'zone', v_zone_name,
    'fee_pending', v_order.delivery_fee_pending, 'date', v_order.preferred_date,
    'slot_label', v_slot.label, 'slot_start', v_slot.start_time, 'slot_end', v_slot.end_time);
end;
$$;

revoke all on function confirm_payment(text, bigint, text, jsonb) from public, anon, authenticated;
grant execute on function confirm_payment(text, bigint, text, jsonb) to service_role;
grant execute on function add_payment_attempt(uuid, text) to authenticated;
grant execute on function create_order(jsonb) to authenticated;
