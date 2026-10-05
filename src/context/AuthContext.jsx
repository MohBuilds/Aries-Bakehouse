import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabaseLazy.js';

const AuthContext = createContext(null);

// Wraps supabase.auth.onAuthStateChange and the matching `customer` row
// (created automatically by the handle_new_user() trigger — see
// supabase/schema.sql). `customer` is null only while the very first
// session check is in flight; after that it's always set once the app has
// signed in anonymously at least once (see CartContext's lazy sign-in).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = not checked yet, null = signed out
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    getSupabase().then((supabase) => {
      if (cancelled) return;
      supabase.auth.getSession().then(({ data }) => !cancelled && setSession(data.session ?? null));
      const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still checking
    let cancelled = false;
    const loadCustomer = async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (!session) {
        setCustomer(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const supabase = await getSupabase();
      const { data } = await supabase
        .from('customer')
        .select('id, name, email, phone, role, is_guest')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();
      if (!cancelled) {
        setCustomer(data);
        setLoading(false);
      }
    };
    loadCustomer();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const value = {
    session,
    customer,
    isSignedIn: !!session,
    isRealAccount: !!customer && !customer.is_guest,
    isAdmin: customer?.role === 'admin',
    loading,
    signOut: () => getSupabase().then((supabase) => supabase.auth.signOut()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

// Ensures a Supabase session exists (anonymous if nothing else), returning
// the session. Called lazily by CartContext on first cart mutation rather
// than eagerly on every page load, per the plan (avoids creating a throwaway
// auth.users row for visitors who never interact with the cart).
export async function ensureSession() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: signInData, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signInData.session;
}
