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

// 🔥 INTERCETTA l'errore "Auth session missing" globalmente
// 🔥 Flag globale per evitare errori multipli
if (typeof window !== 'undefined') {
  let sessionCheckInProgress = false;
  
  const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
  
  supabase.auth.getSession = async (...args) => {
    if (sessionCheckInProgress) {
      console.log('⏳ getSession già in corso, skip');
      return { data: { session: null }, error: null };
    }
    
    try {
      sessionCheckInProgress = true;
      return await originalGetSession(...args);
    } catch (error) {
      if (error.message?.includes('Auth session missing')) {
        console.log('ℹ️ getSession: nessuna sessione (normale)');
        return { data: { session: null }, error: null };
      }
      throw error;
    } finally {
      sessionCheckInProgress = false;
    }
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
