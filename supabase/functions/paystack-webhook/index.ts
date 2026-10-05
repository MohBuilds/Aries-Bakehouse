// Supabase Edge Function (Deno). Deploy with:
//   supabase functions deploy paystack-webhook --no-verify-jwt
// (--no-verify-jwt because Paystack calls this anonymously; the HMAC
// signature check below is what actually authenticates the caller.)
//
// In the Paystack dashboard (Settings > API Keys & Webhooks) set the webhook
// URL to:  https://<project-ref>.supabase.co/functions/v1/paystack-webhook
//
// Required secrets: PAYSTACK_SECRET_KEY, RESEND_API_KEY (optional),
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (provided automatically).

import { confirmPayment, recordPaid, sendConfirmationEmail, slimPayload } from '../_shared/confirm.ts';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;

async function hmacSha512Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time comparison so the signature can't be guessed byte by byte.
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature') ?? '';
  const expected = await hmacSha512Hex(PAYSTACK_SECRET_KEY, rawBody);
  if (!signature || !safeEqual(signature, expected)) return new Response('Invalid signature', { status: 401 });

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('bad json', { status: 400 });
  }
  if (event.event !== 'charge.success' || !event.data || event.data.status !== 'success') {
    return new Response('ignored', { status: 200 });
  }

  const reference = String(event.data.reference ?? '');
  try {
    const result = await confirmPayment(reference, Number(event.data.amount), String(event.data.currency), slimPayload(event.data));
    if (!result.ok) {
      // Unknown reference / amount mismatch: acknowledge so Paystack does not
      // retry forever, but leave a loud trail in the function logs.
      console.error('paystack-webhook: not confirmed', reference, result.reason);
      return new Response('ok', { status: 200 });
    }
    if (result.transitioned) {
      await Promise.allSettled([sendConfirmationEmail(result), recordPaid(result, reference, 'webhook')]);
    }
    return new Response('ok', { status: 200 });
  } catch (err) {
    // A database error is NOT acknowledged: a 5xx makes Paystack retry later.
    console.error('paystack-webhook: database error', err);
    return new Response('error', { status: 500 });
  }
});
