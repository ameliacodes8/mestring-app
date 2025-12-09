import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

type Ctx = {
  supabase: SupabaseClient;
  session: Session | null;
};

const SupabaseCtx = createContext<Ctx | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL!;
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;
    return createClient(url, anon);
  }, []);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  return <SupabaseCtx.Provider value={{ supabase, session }}>{children}</SupabaseCtx.Provider>;
}

export function useSupabase() {
  const ctx = useContext(SupabaseCtx);
  if (!ctx) throw new Error('SupabaseProvider missing');
  return ctx;
}