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

// Deduplica chiamate concorrenti a getSession + gestione silenziosa Auth session missing
const originalGetSession = supabase.auth.getSession.bind(supabase.auth);

if (typeof window !== 'undefined') {
  let pendingGetSession = null;

  supabase.auth.getSession = (...args) => {
    if (pendingGetSession) {
      return pendingGetSession;
    }

    pendingGetSession = originalGetSession(...args)
      .then((result) => {
        // Gestisci anche l'errore restituito nel campo .error (non solo eccezioni)
        if (result?.error?.message?.includes('Auth session missing')) {
          return { data: { session: null }, error: null };
        }
        return result;
      })
      .catch((error) => {
        if (
          error.message?.includes('Auth session missing') ||
          error.name === 'AuthSessionMissingError'
        ) {
          return { data: { session: null }, error: null };
        }
        throw error;
      })
      .finally(() => {
        pendingGetSession = null;
      });

    return pendingGetSession;
  };
} else {
  // Lato server: wrap semplice senza dedup
  supabase.auth.getSession = async (...args) => {
    try {
      const result = await originalGetSession(...args);
      if (result?.error?.message?.includes('Auth session missing')) {
        return { data: { session: null }, error: null };
      }
      return result;
    } catch (error) {
      if (
        error.message?.includes('Auth session missing') ||
        error.name === 'AuthSessionMissingError'
      ) {
        return { data: { session: null }, error: null };
      }
      throw error;
    }
  };
}

// 🔒 Intercetta gli errori auth in getUser globalmente
const originalGetUser = supabase.auth.getUser.bind(supabase.auth);

supabase.auth.getUser = async (...args) => {
  try {
    const result = await originalGetUser(...args);
    // Gestisci errore nel campo .error
    if (result?.error?.message?.includes('Auth session missing')) {
      return { data: { user: null }, error: null };
    }
    return result;
  } catch (error) {
    if (
      error.message?.includes('Auth session missing') ||
      error.name === 'AuthSessionMissingError'
    ) {
      return { data: { user: null }, error: null };
    }
    throw error;
  }
};
