# Ordering and payments

How an order is placed, who enforces what, and what to change when the business changes.

## The rule of thumb

The browser only *shows* choices. The **database decides** (`create_order` in
`supabase/migrations/20261005000100_ordering_hardening.sql`). If someone bypasses the
website, every rule below still holds.

## Slots and delivery

- **Three slots a day**, edited in Admin → Delivery and time slots: Morning 9am–12pm,
  Afternoon 12pm–4pm, Evening 4pm–7pm. Each has an optional per-day capacity.
- **No immediate delivery.** A slot can be booked only if its *start* is at least
  24 hours away (`ordering_settings.lead_hours`), on an open day (Mon–Sat), up to 60 days
  ahead. Pickup and delivery both happen inside the chosen window.
- **Delivery zones** (the `delivery_option` rows of type `delivery`): each zone has a list of
  neighbourhoods and a fee. Seeded from the areas on the Delivery page:
  Central Abeokuta (Ibara, Oke-Mosan, Kuto, Isale-Igbein, Camp), Outer Abeokuta
  (Adigbe, Obantoko) and Other Abeokuta areas (customer types their neighbourhood).
- **Fees are not invented.** Every zone starts with *Fee confirmed = No*: customers pay for
  their bakes online and you confirm the delivery fee on WhatsApp. Set a fee and switch
  *Fee confirmed* to Yes and it is added to what they pay.
- An unpaid checkout holds its slot for `hold_minutes` (30) so abandoned carts free it up.

## Payment flow

1. `create_order` validates everything and returns the **authoritative total**.
2. The browser opens Paystack for exactly that amount. A retry after closing the popup adds
   another payment attempt to the **same** order (`add_payment_attempt`).
3. After success the browser calls `verify-payment`; Paystack's webhook is the backstop.
   Both end in `confirm_payment`: one atomic transaction that checks amount and currency,
   confirms the order, consumes any discount code, and reports whether *it* made the
   change, so the customer gets exactly one confirmation email.
4. Slow methods (bank transfer, USSD) are polled for about 20 seconds before the customer
   is told to check again.

## One-time Paystack setup

In the Paystack dashboard (Settings → API Keys & Webhooks) set the **test** webhook URL to
`https://<project-ref>.supabase.co/functions/v1/paystack-webhook`. Without it the browser
call still confirms payments, but a customer who closes the tab right after paying relies
on the webhook to be confirmed.

Test mode: Paystack's popup offers *Success / Bank Authentication / Declined* buttons;
pick one, then press the green Pay button. Going live means swapping the test public key
(Vercel `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`) and secret (`supabase secrets set PAYSTACK_SECRET_KEY=...`)
for the live pair and registering the webhook in live mode.

## Changing the rules

Everything above is data: edit it in Admin → Delivery and time slots. For anything else,
add a migration (`supabase migration new <name>`); CI replays all migrations on a fresh
database before they reach production.
