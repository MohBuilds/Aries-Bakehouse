// Shared by verify-payment and paystack-webhook.
//
// Both functions end in the same place: ask Postgres to confirm the payment
// (confirm_payment: one atomic, row-locked transaction that checks amount and
// currency, flips payment + order, and consumes any discount). Whichever
// function gets there first sends the confirmation email; the other sees
// `transitioned: false` and stays quiet, so the customer is emailed once.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

export type Confirmation = {
  ok: boolean;
  reason?: string;
  already?: boolean;
  transitioned?: boolean;
  duplicate_payment?: boolean;
  order_id?: string;
  order_number?: string;
  total?: number;
  customer_name?: string;
  customer_email?: string | null;
  fulfilment?: 'pickup' | 'delivery';
  delivery_area?: string | null;
  zone?: string | null;
  fee_pending?: boolean;
  date?: string;
  slot_label?: string;
  slot_start?: string;
  slot_end?: string;
};

// Only what we need later, never the card/authorization block Paystack returns.
export function slimPayload(data: Record<string, unknown>) {
  const { id, status, reference, amount, currency, channel, paid_at, gateway_response } = data;
  return { id, status, reference, amount, currency, channel, paid_at, gateway_response };
}

export async function confirmPayment(reference: string, amountKobo: number, currency: string, payload: unknown) {
  const { data, error } = await supabase.rpc('confirm_payment', {
    p_reference: reference,
    p_amount_kobo: amountKobo,
    p_currency: currency,
    p_payload: payload,
  });
  if (error) throw new Error(`confirm_payment failed: ${error.message}`);
  return data as Confirmation;
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

function clock(value?: string) {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function longDate(value?: string) {
  if (!value) return '';
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Best-effort: an email problem must never undo or delay a confirmed order.
export async function sendConfirmationEmail(order: Confirmation) {
  if (!RESEND_API_KEY || !order.customer_email) return;
  const when = `${longDate(order.date)}, ${order.slot_label} (${clock(order.slot_start)} to ${clock(order.slot_end)})`;
  const where =
    order.fulfilment === 'delivery'
      ? `Delivery to ${esc(order.delivery_area)}${order.zone ? `, ${esc(order.zone)}` : ''}`
      : 'Pickup from the Aries 11 kitchen in Abeokuta (we will confirm the exact address)';
  const fee =
    order.fulfilment === 'delivery' && order.fee_pending
      ? '<p>We will confirm your delivery fee with you on WhatsApp before the day.</p>'
      : '';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // No verified sending domain yet: Resend's shared sandbox sender only
        // delivers to the Resend account owner. Verify a domain in Resend and
        // change `from` to e.g. "Aries 11 Bakehouse <orders@yourdomain.com>".
        from: 'Aries 11 Bakehouse <onboarding@resend.dev>',
        to: order.customer_email,
        subject: `Order ${order.order_number} confirmed`,
        html: `<p>Hi ${esc(order.customer_name)},</p>
               <p>Thank you. Your order <strong>${esc(order.order_number)}</strong> is confirmed (₦${Number(order.total).toLocaleString('en-NG')}).</p>
               <p><strong>When:</strong> ${esc(when)}<br><strong>How:</strong> ${where}</p>
               ${fee}
               <p>Every bake is made fresh for your order. Questions? Message us on WhatsApp +234 812 114 5785.</p>`,
      }),
    });
  } catch (err) {
    console.error('Resend email failed (non-fatal):', err);
  }
}

export async function recordPaid(order: Confirmation, reference: string, via: string) {
  await supabase.from('analytics_event').insert({
    event_name: 'payment_completed',
    payload: { reference, order_id: order.order_id, via, duplicate: Boolean(order.duplicate_payment) },
  });
}
