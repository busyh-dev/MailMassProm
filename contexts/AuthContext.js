// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router"; // per App Router: usa "next/navigation"
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // ← Aggiungi questo
  const [lastSignInTime, setLastSignInTime] = useState(0); // 🔥 AGGIUNGI QUESTO
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      console.log('🔍 AuthContext: chiamata getSession');
      
      try {
        let session = null;
        let error = null;
        
        try {
          const result = await supabase.auth.getSession();
          session = result.data?.session;
          error = result.error;
        } catch (sessionError) {
          if (
            sessionError.message?.includes('Auth session missing') ||
            sessionError.name === 'AuthSessionMissingError'
          ) {
            console.log('ℹ️ AuthContext: Nessuna sessione (normale dopo logout)');
            setUser(null);
            setLoading(false);
            return;
          }
          throw sessionError;
        }
  
        if (error) {
          if (
            error.message?.includes('Auth session missing') ||
            error.message?.includes('session_not_found') ||
            error.name === 'AuthSessionMissingError'
          ) {
            console.log('ℹ️ AuthContext: Nessuna sessione attiva (normale)');
            setUser(null);
            setLoading(false);
            return;
          }
          console.error('❌ Errore recupero sessione:', error);
          setUser(null);
          setLoading(false);
          return;
        }
  
        if (session?.user) {
          console.log('✅ Sessione trovata:', session.user.email);
          setUser(session.user);
        } else {
          console.log('ℹ️ Nessuna sessione utente');
          setUser(null);
        }
  
        setLoading(false);
      } catch (err) {
        if (
          err.message?.includes('Auth session missing') ||
          err.name === 'AuthSessionMissingError'
        ) {
          console.log('ℹ️ AuthContext catch: Nessuna sessione (normale)');
        } else {
          console.error('❌ Errore getSession:', err);
        }
        setUser(null);
        setLoading(false);
      }
    };
  
    getSession();
  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignora eventi durante logout
      if (isLoggingOut) {
        console.log('🚫 Evento ignorato durante logout:', event);
        return;
      }

      // 🔥 PREVIENI SIGNED_IN DUPLICATI
      if (event === 'SIGNED_IN') {
        const now = Date.now();
        const timeSinceLastSignIn = now - lastSignInTime;
        
        if (timeSinceLastSignIn < 2000) {
          console.log(`🚫 SIGNED_IN duplicato ignorato (${timeSinceLastSignIn}ms fa)`);
          return;
        }
        
        console.log('✅ SIGNED_IN accettato');
        setLastSignInTime(now);
      }
      
      console.log('🔐 Auth event:', event);
      
      if (event === 'INITIAL_SESSION') {
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 SIGNED_OUT event');
        setUser(null);
        sessionStorage.clear();
        localStorage.clear();
        
        if (router.pathname !== '/login' && router.pathname !== '/register') {
          router.push('/login');
        }
      } else if (event === 'SIGNED_IN') {
        console.log('✅ User signed in:', session?.user?.email);
        setUser(session?.user ?? null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
        setUser(session?.user ?? null);
      } else if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });
  
    return () => {
      subscription.unsubscribe();
    };
  }, [isLoggingOut, router, lastSignInTime]); // 🔥 AGGIUNGI lastSignInTime
  

  // 🔑 Login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    setUser(data.user);
    router.push("/dashboard");

    return { success: true, user: data.user };
  };

  // 🔑 Registrazione
  const register = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // metadata personalizzato
      },
    });

    if (error) throw new Error(error.message);

    setUser(data.user);
    router.push("/dashboard");

    return { success: true, user: data.user };
  };

// 🔒 Logout
// In AuthContext.js
const logout = async () => {
  try {
    console.log('🚪 Inizio logout...');
    
    setIsLoggingOut(true);
    
    // Pulisci storage PRIMA
    sessionStorage.clear();
    localStorage.clear();
    
    // Reset user state
    setUser(null);
    
    // SignOut in background (ignora errori)
    supabase.auth.signOut({ scope: 'local' }).catch((err) => {
      console.log('ℹ️ SignOut error ignorato:', err.message);
    });
    
    console.log('✅ Logout completato, redirect...');
    
    // Redirect
    router.push('/login');
    
  } catch (error) {
    console.warn('⚠️ Errore logout:', error.message);
    sessionStorage.clear();
    localStorage.clear();
    setUser(null);
    router.push('/login');
  } finally {
    setTimeout(() => {
      setIsLoggingOut(false);
    }, 1000);
  }
};

const value = {
  user,
  loading,
  login,
  register,
  logout,
  isAuthenticated: !!user,
};

return (
  <AuthContext.Provider value={value}>
    {!loading && children}
  </AuthContext.Provider>
);
};