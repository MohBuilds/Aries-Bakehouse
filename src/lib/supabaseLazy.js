// Loads the Supabase client on first use instead of at page load, so the
// ~60 KB SDK stays off the critical path for always-mounted UI (auth state,
// cart, header). Screens that query on render can keep the eager import.
let clientPromise;

export function getSupabase() {
  clientPromise ||= import('./supabaseClient.js').then((m) => m.supabase);
  return clientPromise;
}
