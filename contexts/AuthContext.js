// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const lastSignInTime = useRef(0);
  const currentUserId = useRef(null);
  const router = useRouter();

    // ✅ AGGIUNGI QUESTO useEffect
    useEffect(() => {
      const handleUnhandledRejection = (event) => {
        if (
          event.reason?.name === 'AuthSessionMissingError' ||
          event.reason?.message?.includes('Auth session missing')
        ) {
          console.log('ℹ️ AuthSessionMissingError ignorato');
          event.preventDefault();
        }
      };
  
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }, []);

  useEffect(() => {
    const getSession = async (retryCount = 0) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
    
        if (error) {
          // ✅ Se è un errore di rete, riprova fino a 3 volte
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('fetch') ||
              error.name === 'AuthRetryableFetchError') {
            if (retryCount < 3) {
              console.log(`⏳ Retry getSession ${retryCount + 1}/3...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              return getSession(retryCount + 1);
            }
          }
    
          if (error.message?.includes('Auth session missing')) {
            setUser(null);
            setLoading(false);
            return;
          }
    
          setUser(null);
          setLoading(false);
          return;
        }
    
        if (session?.user) {
          setUser(session.user);
          currentUserId.current = session.user.id;
        } else {
          setUser(null);
        }
    
        setLoading(false);
      } catch (err) {
        // ✅ Gestisci errore di rete con retry
        if (err.name === 'AuthRetryableFetchError' || 
            err.message?.includes('Failed to fetch')) {
          if (retryCount < 3) {
            console.log(`⏳ Retry getSession dopo errore rete ${retryCount + 1}/3...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return getSession(retryCount + 1);
          }
          console.warn('⚠️ Connessione non disponibile dopo 3 tentativi');
          setUser(null);
          setLoading(false);
          return;
        }
    
        if (!err.message?.includes('Auth session missing')) {
          console.error('❌ Errore getSession:', err);
        }
        setUser(null);
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // ✅ Ignora durante logout
      if (isLoggingOut) return;

      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
        if (session?.user) {
          setUser(prev => prev?.id === session.user.id ? prev : session.user);
          currentUserId.current = session.user.id;
        }
        return;
      }

      // ✅ Ignora INITIAL_SESSION
      if (event === 'INITIAL_SESSION') return;

      // ✅ SIGNED_IN
      if (event === 'SIGNED_IN') {
        const now = Date.now();
        const timeSinceLastSignIn = now - lastSignInTime.current;
      
        // ✅ Ignora tab switch su pagina login SOLO se c'è già un utente attivo
        // e NON è un nuovo login (window.__currentLoginUserId è null = nuovo login)
        if (
          typeof window !== 'undefined' &&
          window.__loginPageActive === true
        ) {
          // ✅ Se è un nuovo login (nessun utente precedente) accetta sempre
          if (window.__currentLoginUserId === null) {
            console.log('✅ SIGNED_IN accettato - nuovo login dalla pagina login');
            lastSignInTime.current = now;
            currentUserId.current = session?.user?.id;
            // ✅ Aggiorna il flag così i prossimi tab switch vengono ignorati
            window.__currentLoginUserId = session?.user?.id;
            setUser(session?.user ?? null);
            return;
          }
          
          // ✅ Tab switch con utente già loggato - ignora
          if (session?.user?.id === window.__currentLoginUserId) {
            console.log('🚫 SIGNED_IN ignorato - tab switch su pagina login');
            lastSignInTime.current = now;
            return;
          }
        }
      
        // ✅ Ignora duplicati fuori dalla pagina di login
        if (
          timeSinceLastSignIn < 5000 &&
          session?.user?.id === currentUserId.current &&
          (typeof window === 'undefined' || window.__loginPageActive !== true)
        ) {
          console.log(`🚫 SIGNED_IN duplicato ignorato (${timeSinceLastSignIn}ms fa)`);
          return;
        }
      
        console.log('✅ SIGNED_IN accettato:', session?.user?.email);
        lastSignInTime.current = now;
        currentUserId.current = session?.user?.id;
        setUser(session?.user ?? null);
        return;
      }
      // ✅ SIGNED_OUT
     // ✅ In AuthContext, nel SIGNED_OUT aggiungi anche il reset al navigare su login
if (event === 'SIGNED_OUT') {
  console.log('👋 SIGNED_OUT event');
  setUser(null);
  currentUserId.current = null; // ✅ già presente
  lastSignInTime.current = 0;   // ✅ AGGIUNGI - resetta anche il timer
  sessionStorage.clear();
  localStorage.clear();
  if (router.pathname !== '/login' && router.pathname !== '/register') {
    router.push('/login');
  }
  return;
}

      // ✅ TOKEN_REFRESHED - aggiorna silenziosamente senza reset
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
        setUser(prev => prev?.id === session?.user?.id ? prev : session?.user ?? null);
        return;
      }

      // ✅ Altri eventi
      if (session?.user) {
        setUser(session.user);
        currentUserId.current = session.user.id;
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoggingOut]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    setUser(data.user);
    currentUserId.current = data.user.id;
    router.push("/dashboard");
    return { success: true, user: data.user };
  };

  const register = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    setUser(data.user);
    router.push("/dashboard");
    return { success: true, user: data.user };
  };

  const logout = async () => {
    try {
      console.log('🚪 Inizio logout...');
      setIsLoggingOut(true);
      sessionStorage.clear();
      localStorage.clear();
      setUser(null);
      currentUserId.current = null;
      supabase.auth.signOut({ scope: 'local' }).catch(err => {
        console.log('ℹ️ SignOut error ignorato:', err.message);
      });
      router.push('/login');
    } catch (error) {
      console.warn('⚠️ Errore logout:', error.message);
      setUser(null);
      router.push('/login');
    } finally {
      setTimeout(() => setIsLoggingOut(false), 1000);
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