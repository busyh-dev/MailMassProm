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
  const isInitialized = useRef(false); // 🔥 Traccia se già inizializzato

  useEffect(() => {
    // 🔥 Controlla la sessione corrente solo una volta
    if (!isInitialized.current) {
      checkSession();
      isInitialized.current = true;
    }

    // Listener per cambiamenti di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event in PermissionsContext:', event);
        
        // 🔥 Ignora INITIAL_SESSION perché già gestito da checkSession
        if (event === 'INITIAL_SESSION') {
          console.log('⏭️ INITIAL_SESSION ignorato (già gestito)');
          return;
        }
        
        if (session?.user) {
          await fetchProfileAndPermissions(session.user.id);
        } else {
          clearPermissions();
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
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
      setLoading(true);

      // 1️⃣ Recupera il profilo dell'utente con il ruolo
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          role:roles (
            id,
            name,
            description
          )
        `)
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Errore recupero profilo:', profileError);
        clearPermissions();
        return;
      }

      if (!profileData) {
        console.warn('⚠️ Profilo non trovato');
        clearPermissions();
        return;
      }

      setProfile(profileData);
      setRole(profileData.role);

      // 2️⃣ Se non ha ruolo, non ha permessi
      if (!profileData.role_id) {
        console.warn('⚠️ Profilo senza ruolo assegnato');
        setPermissions([]);
        return;
      }

      // 3️⃣ Recupera i permessi del ruolo
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('role_permissions')
        .select(`
          permission:permissions (
            id,
            name,
            description,
            module,
            action
          )
        `)
        .eq('role_id', profileData.role_id);

      if (permissionsError) {
        console.error('❌ Errore recupero permessi:', permissionsError);
        setPermissions([]);
        return;
      }

      // Estrae solo gli oggetti permission dall'array
      const perms = permissionsData
        .map(item => item.permission)
        .filter(Boolean);

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
  };

  // ============================================
  // METODI DI VERIFICA PERMESSI
  // ============================================

  const hasPermission = (permissionName) => {
    if (!profile || !permissions.length) return false;
    
    // Super admin ha tutti i permessi
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
    const permissionName = `${moduleName}.${action}`;
    return hasPermission(permissionName);
  };

  const canAccessResource = (resourceType, resourceId, action = 'read') => {
    if (role?.name === 'super_admin') return true;
    const basePermission = `${resourceType}.${action}`;
    if (!hasPermission(basePermission)) return false;
    return true;
  };

  const refreshPermissions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfileAndPermissions(session.user.id);
    }
  };

  const value = {
    profile,
    permissions,
    role,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    canPerformAction,
    canAccessResource,
    isSuperAdmin: role?.name === 'super_admin',
    isAdmin: role?.name === 'admin' || role?.name === 'super_admin',
    isEditor: role?.name === 'editor',
    isViewer: role?.name === 'viewer',
    isUser: role?.name === 'user',
    refreshPermissions,
    clearPermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};