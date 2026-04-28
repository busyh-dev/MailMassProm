// src/contexts/PermissionsContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions deve essere usato dentro PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const isInitialized = useRef(false);
  const lastSignInRef = useRef(0);      // ✅ traccia ultimo SIGNED_IN
  const currentUserIdRef = useRef(null); // ✅ traccia utente già caricato

  useEffect(() => {
    if (!isInitialized.current) {
      checkSession();
      isInitialized.current = true;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event in PermissionsContext:', event);
        
        if (event === 'INITIAL_SESSION') return;
        
        // ✅ Ignora SIGNED_IN duplicati entro 10 secondi
        if (event === 'SIGNED_IN') {
          const now = Date.now();
          if (now - lastSignInRef.current < 10000) {
            console.log('🚫 SIGNED_IN duplicato ignorato in PermissionsContext');
            return;
          }
          lastSignInRef.current = now;
        }

        // ✅ Ignora TOKEN_REFRESHED — non ricaricare permessi
        if (event === 'TOKEN_REFRESHED') {
          console.log('⏭️ TOKEN_REFRESHED ignorato');
          return;
        }

        if (session?.user) {
          // ✅ Se è lo stesso utente già caricato, non ricaricare
          if (currentUserIdRef.current === session.user.id && profile !== null) {
            console.log('⏭️ Stesso utente già caricato, skip');
            return;
          }
          await fetchProfileAndPermissions(session.user.id);
        } else {
          currentUserIdRef.current = null;
          clearPermissions();
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfileAndPermissions(session.user.id);
      } else {
        clearPermissions();
      }
    } catch (error) {
      console.error('❌ Errore controllo sessione:', error);
      clearPermissions();
    }
  };

  const fetchProfileAndPermissions = async (userId) => {
    try {
      // ✅ Non mostrare loading se abbiamo già i dati per questo utente
      if (currentUserIdRef.current !== userId) {
        setLoading(true);
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`*, role:roles (id, name, description)`)
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        clearPermissions();
        return;
      }

      // ✅ Aggiorna ref utente corrente
      currentUserIdRef.current = userId;

      setProfile(profileData);
      setRole(profileData.role);

      if (!profileData.role_id) {
        setPermissions([]);
        return;
      }

      const { data: permissionsData, error: permissionsError } = await supabase
        .from('role_permissions')
        .select(`permission:permissions (id, name, description, module, action)`)
        .eq('role_id', profileData.role_id);

      if (permissionsError) {
        setPermissions([]);
        return;
      }

      const perms = permissionsData.map(item => item.permission).filter(Boolean);
      setPermissions(perms);

      console.log('✅ Permessi caricati:', {
        profile: profileData.full_name || profileData.email,
        role: profileData.role?.name,
        permissions_count: perms.length
      });

    } catch (error) {
      console.error('❌ Errore caricamento permessi:', error);
      clearPermissions();
    } finally {
      setLoading(false);
    }
  };

  const clearPermissions = () => {
    setProfile(null);
    setPermissions([]);
    setRole(null);
    setLoading(false);
    currentUserIdRef.current = null;
  };

  const hasPermission = (permissionName) => {
    if (!profile || !permissions.length) return false;
    if (role?.name === 'super_admin') return true;
    return permissions.some(p => p.name === permissionName);
  };

  const hasAnyPermission = (permissionNames) => {
    if (!Array.isArray(permissionNames)) return false;
    return permissionNames.some(name => hasPermission(name));
  };

  const hasAllPermissions = (permissionNames) => {
    if (!Array.isArray(permissionNames)) return false;
    return permissionNames.every(name => hasPermission(name));
  };

  const canAccessModule = (moduleName) => {
    if (!profile || !permissions.length) return false;
    if (role?.name === 'super_admin') return true;
    return permissions.some(p => p.module === moduleName);
  };

  const canPerformAction = (moduleName, action) => {
    return hasPermission(`${moduleName}.${action}`);
  };

  const canAccessResource = (resourceType, resourceId, action = 'read') => {
    if (role?.name === 'super_admin') return true;
    return hasPermission(`${resourceType}.${action}`);
  };

  const refreshPermissions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      currentUserIdRef.current = null; // ✅ forza ricaricamento
      await fetchProfileAndPermissions(session.user.id);
    }
  };

  const value = {
    profile, permissions, role, loading,
    hasPermission, hasAnyPermission, hasAllPermissions,
    canAccessModule, canPerformAction, canAccessResource,
    isSuperAdmin: role?.name === 'super_admin',
    isAdmin: role?.name === 'admin' || role?.name === 'super_admin',
    isEditor: role?.name === 'editor',
    isViewer: role?.name === 'viewer',
    isUser: role?.name === 'user',
    refreshPermissions, clearPermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};