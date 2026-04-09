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
  const lastSignInTime = useRef(0); // ✅ useRef invece di useState
  const currentUserId = useRef(null); // ✅ traccia userId corrente
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      console.log('🔍 AuthContext: chiamata getSession');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          if (error.message?.includes('Auth session missing')) {
            setUser(null);
            setLoading(false);
            return;
          }
          console.error('❌ Errore sessione:', error);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Sessione trovata:', session.user.email);
          setUser(session.user);
          currentUserId.current = session.user.id;
        } else {
          setUser(null);
        }

        setLoading(false);
      } catch (err) {
        if (err.message?.includes('Auth session missing')) {
          console.log('ℹ️ Nessuna sessione (normale)');
        } else {
          console.error('❌ Errore getSession:', err);
        }
        setUser(null);
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isLoggingOut) {
        console.log('🚫 Evento ignorato durante logout:', event);
        return;
      }

      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_IN') {
        const now = Date.now();
        const timeSinceLastSignIn = now - lastSignInTime.current;

        // ✅ Ignora se è lo stesso utente e < 5 secondi
        if (
          timeSinceLastSignIn < 5000 &&
          session?.user?.id === currentUserId.current
        ) {
          console.log(`🚫 SIGNED_IN duplicato ignorato (${timeSinceLastSignIn}ms fa, stesso utente)`);
          return;
        }

        console.log('✅ SIGNED_IN accettato:', session?.user?.email);
        lastSignInTime.current = now;
        currentUserId.current = session?.user?.id;
        setUser(session?.user ?? null);
        return;
      }

      if (event === 'SIGNED_OUT') {
        console.log('👋 SIGNED_OUT event');
        setUser(null);
        currentUserId.current = null;
        sessionStorage.clear();
        localStorage.clear();
        if (router.pathname !== '/login' && router.pathname !== '/register') {
          router.push('/login');
        }
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed - aggiorno solo sessione, non resetto');
        // ✅ Non resettare lo stato, aggiorna solo silenziosamente
        setUser(prev => prev?.id === session?.user?.id ? prev : session?.user ?? null);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        currentUserId.current = session.user.id;
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoggingOut]); // ✅ rimosso lastSignInTime dalle dipendenze

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