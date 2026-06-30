// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Deduplica chiamate concorrenti a getSession (attende la stessa promise, non restituisce null)
if (typeof window !== 'undefined') {
  let pendingGetSession = null;

  const originalGetSession = supabase.auth.getSession.bind(supabase.auth);

  supabase.auth.getSession = (...args) => {
    if (pendingGetSession) {
      return pendingGetSession;
    }

    pendingGetSession = originalGetSession(...args)
      .catch((error) => {
        if (error.message?.includes('Auth session missing')) {
          return { data: { session: null }, error: null };
        }
        throw error;
      })
      .finally(() => {
        pendingGetSession = null;
      });

    return pendingGetSession;
  };
}
// 🔥 Intercetta gli errori auth globalmente
const originalGetUser = supabase.auth.getUser.bind(supabase.auth);

supabase.auth.getUser = async (...args) => {
  try {
    return await originalGetUser(...args);
  } catch (error) {
    if (error.message?.includes('Auth session missing')) {
      console.log('⚠️ Sessione mancante (normale dopo logout)');
      return { data: { user: null }, error: null };
    }
    throw error;
  }
};
