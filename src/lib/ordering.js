// Client side of the ordering rules. The DATABASE is the authority for every
// rule here (create_order enforces them); this module only fetches the same
// truth so the checkout can show it, and turns the server's error codes into
// plain language.

import { supabase } from './supabaseClient.js';

// Fallback copy if the slot table cannot be read (offline, or an outage), so
// confirmation pages still render something sensible.
export const DEFAULT_SLOTS = [
  { code: 'morning', label: 'Morning', start: '09:00', end: '12:00' },
  { code: 'afternoon', label: 'Afternoon', start: '12:00', end: '16:00' },
  { code: 'evening', label: 'Evening', start: '16:00', end: '19:00' },
];

function clock(value) {
  const [h, m] = String(value).split(':').map(Number);
  const hour = ((h + 11) % 12) + 1;
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function slotWindow(slot) {
  return `${clock(slot.start)} – ${clock(slot.end)}`;
}

let slotsPromise = null;

// All active slots, cached for the session (they change rarely).
export function loadSlots() {
  slotsPromise ||= supabase
    .from('delivery_slot')
    .select('code, label, start_time, end_time, sort_order, active')
    .eq('active', true)
    .order('sort_order')
    .then(({ data, error }) => {
      if (error || !data?.length) return DEFAULT_SLOTS;
      return data.map((row) => ({ code: row.code, label: row.label, start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5) }));
    })
    .catch(() => DEFAULT_SLOTS);
  return slotsPromise;
}

export function describeSlot(slots, code) {
  const slot = (slots || DEFAULT_SLOTS).find((entry) => entry.code === code);
  return slot ? `${slot.label} (${slotWindow(slot)})` : code;
}

// The next `days` days with each slot's availability, computed on the SERVER
// clock so a wrong phone clock can't offer a slot the server will refuse.
export async function fetchSlotAvailability(days = 21) {
  const { data, error } = await supabase.rpc('get_slot_availability', { p_days: days });
  if (error) throw error;
  const byDate = new Map();
  for (const row of data) {
    if (!byDate.has(row.slot_date)) byDate.set(row.slot_date, []);
    byDate.get(row.slot_date).push({
      code: row.code,
      label: row.label,
      start: row.start_time.slice(0, 5),
      end: row.end_time.slice(0, 5),
      available: row.available,
      reason: row.reason,
      remaining: row.remaining,
    });
  }
  return [...byDate.entries()].map(([date, slots]) => ({
    date,
    slots,
    open: slots.some((slot) => slot.available),
    closed: slots.every((slot) => slot.reason === 'closed'),
  }));
}

export async function fetchDeliveryZones() {
  const { data, error } = await supabase
    .from('delivery_option')
    .select('id, name, zone, fee, fee_confirmed, areas, description, sort_order')
    .eq('type', 'delivery')
    .eq('active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export const SLOT_REASON_TEXT = {
  notice: 'Needs 24 hours’ notice',
  full: 'Fully booked',
  closed: 'Closed',
};

const ORDER_ERRORS = {
  slot_full: 'That time slot has just filled up. Please choose another.',
  notice_required: 'That slot is too soon. We need 24 hours’ notice, so please pick a later one.',
  closed_day: 'We are closed that day. Please choose another date.',
  too_far_ahead: 'That date is too far ahead. Please choose an earlier one.',
  slot_invalid: 'Please choose one of the time slots.',
  date_invalid: 'Please choose a valid date.',
  zone_required: 'Please choose your delivery area.',
  area_invalid: 'Please choose your neighbourhood from the list.',
  area_required: 'Please tell us your neighbourhood.',
  address_required: 'Please enter a complete delivery address with a landmark.',
  quantity_invalid: 'One of the items has an invalid quantity. Please review your cart.',
  items_invalid: 'Your cart looks empty or invalid. Please review it.',
  product_unavailable: 'One of the items is no longer available. Please review your cart.',
  discount_invalid: 'That discount code is no longer valid. Remove it and try again.',
  too_many_pending: 'You have several unpaid orders open. Please complete one, or wait a few minutes.',
  phone_invalid: 'Please enter a valid phone number.',
  name_invalid: 'Please enter your full name.',
  no_customer: 'We could not start your session. Please refresh and try again.',
  order_not_payable: 'This order can no longer be paid. Please start a new order.',
  already_paid: 'This order is already paid.',
};

// Codes that mean "the schedule you picked is stale, refresh availability".
export const SCHEDULE_ERRORS = new Set(['slot_full', 'notice_required', 'closed_day', 'too_far_ahead', 'slot_invalid', 'date_invalid']);

export function orderErrorCode(error) {
  const match = /ORDER_ERROR:([a-z_]+)/.exec(error?.message || '');
  return match ? match[1] : null;
}

export function friendlyOrderError(error) {
  const code = orderErrorCode(error);
  return (code && ORDER_ERRORS[code]) || 'We could not place your order. Your details are still here, so please try again.';
}
