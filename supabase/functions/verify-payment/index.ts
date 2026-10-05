// Supabase Edge Function (Deno). Deploy with:
//   supabase functions deploy verify-payment
// Called from Checkout right after Paystack's inline popup reports success, so
// the customer sees "Confirmed" immediately instead of waiting for the webhook.
// The paystack-webhook function remains the backstop (tab closed, etc).
//
// Required secrets: PAYSTACK_SECRET_KEY, RESEND_API_KEY (optional),
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (provided automatically).

import { confirmPayment, recordPaid, sendConfirmationEmail, slimPayload } from '../_shared/confirm.ts';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;

// Called straight from the browser, so every response (including the
// preflight) needs CORS headers.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}

// Paystack states that mean "not finished yet": the client should ask again.
const IN_PROGRESS = new Set(['ongoing', 'pending', 'processing', 'queued']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let reference = '';
  try {
    ({ reference } = await req.json());
  } catch {
    return json({ error: 'invalid body' }, 400);
  }
  if (typeof reference !== 'string' || !/^[A-Za-z0-9._=-]{8,100}$/.test(reference)) {
    return json({ error: 'reference required' }, 400);
  }

  let paystack: { status?: boolean; data?: Record<string, unknown> };
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    paystack = await res.json();
  } catch (err) {
    console.error('verify-payment: Paystack unreachable', err);
    return json({ confirmed: false, retry: true }, 502);
  }

  const data = paystack.data;
  if (!paystack.status || !data) return json({ confirmed: false });
  if (data.reference !== reference) return json({ confirmed: false, error: 'reference mismatch' });
  if (IN_PROGRESS.has(String(data.status))) return json({ confirmed: false, pending: true });
  if (data.status !== 'success') return json({ confirmed: false, failed: true });

  try {
    const result = await confirmPayment(reference, Number(data.amount), String(data.currency), slimPayload(data));
    if (!result.ok) {
      console.error('verify-payment: not confirmed', reference, result.reason);
      return json({ confirmed: false, error: result.reason });
    }
    if (result.transitioned) {
      await Promise.allSettled([sendConfirmationEmail(result), recordPaid(result, reference, 'verify')]);
    }
    return json({ confirmed: true, order_number: result.order_number });
  } catch (err) {
    console.error('verify-payment: database error', err);
    return json({ confirmed: false, retry: true }, 500);
  }
});
