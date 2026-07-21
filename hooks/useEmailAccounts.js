// hooks/useEmailAccounts.js
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { queueRequest, flushQueue } from "./queuedRequests";


const defaultOptions = {
  retry: { max: 3, baseMs: 700 }, // backoff: 700ms, 1400ms, 2800ms
  offline: {
    mock: false,
    retryOnReconnect: true,
    mockData: [
      // Esempio:
      // { id: 'mock-1', name: 'Demo', email: 'demo@example.com', is_default: true, verified: false, dkim_status: 'unknown', spf_status: 'unknown', created_at: new Date().toISOString(), user_id: 'mock' },
    ],
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isNetworkError = (err) => {
  const m = String(err?.message || err || '').toLowerCase();
  return (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('network request failed') ||
    m.includes('fetch') ||
    m.includes('net::err') ||
    m.includes('timeout') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  );
};

export const useEmailAccounts = (opts = {}) => {
  const options = {
    ...defaultOptions,
    ...opts,
    retry: { ...defaultOptions.retry, ...(opts.retry || {}) },
    offline: { ...defaultOptions.offline, ...(opts.offline || {}) },
  };

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [defaultAccount, setDefaultAccount] = useState(null);
  const mounted = useRef(true);

  const safeSetLoading = (v) => { if (mounted.current) setLoading(v); };
  const safeSetAccounts = (rows) => {
    if (!mounted.current) return;
    setAccounts(rows || []);
    const def = rows?.find((a) => a.is_default) || null;
    setDefaultAccount(def);
  };

  const withRetry = async (fn, { label = 'operazione' } = {}) => {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        if (!isNetworkError(err) || attempt > options.retry.max) throw err;
        const wait = options.retry.baseMs * Math.pow(2, attempt - 1);
        if (attempt === 1) toast('Problema di rete, ritento…');
        await sleep(wait);
      }
    }
  };

  const scheduleRetryOnReconnect = (cb, label = 'operazione') => {
    if (!options.offline.retryOnReconnect || typeof window === 'undefined') return;
    const handler = () => {
      window.removeEventListener('online', handler);
      cb();
      toast.success(`Connessione ripristinata: ritento ${label}.`);
    };
    window.addEventListener('online', handler, { once: true });
    toast.error('Sei offline. Ritenterò quando torni online.');
  };

  // 📥 Carica account
  const loadAccounts = async () => {
    try {
      safeSetLoading(true);

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (options.offline.mock) {
          toast('Offline: mostro dati locali.');
          safeSetAccounts(options.offline.mockData || []);
          return { success: true, data: options.offline.mockData || [] };
        }
        scheduleRetryOnReconnect(loadAccounts, 'caricamento account');
        return { success: false, error: 'offline' };
      }

      const { user } = await withRetry(async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return { user: data?.user || null };
      }, { label: 'autenticazione' });

      if (!user) {
        // Nessun utente autenticato: uscita silenziosa (normale su pagine pubbliche come login)
        safeSetAccounts([]);
        return { success: false, error: 'not_authenticated' };
      }

      const rows = await withRetry(async () => {
        // ✅ Check ruolo utente per SuperAdmin
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role_id, role:roles(name)')
          .eq('id', user.id)
          .maybeSingle();

        const roleName = userProfile?.role?.name || userProfile?.role || '';
        const isSuperAdminUser = ['super_admin', 'superAdmin', 'SuperAdmin'].includes(roleName) || userProfile?.role_id === 1;

        let query = supabase
          .from('email_accounts')
          .select('*');

        if (!isSuperAdminUser) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }, { label: 'caricamento account' });

      safeSetAccounts(rows);
      return { success: true, data: rows };
    } catch (err) {
      toast.error(err?.message || 'Errore nel caricamento.');
      return { success: false, error: err?.message || 'unknown' };
    } finally {
      safeSetLoading(false);
    }
  };

  // ➕ Aggiungi account
  const addAccount = async (accountData) => {
    try {
      safeSetLoading(true);

      if (!navigator.onLine) {
        scheduleRetryOnReconnect(() => addAccount(accountData), 'aggiunta account');
        return { success: false, error: 'offline' };
        
        queueRequest({ type: "addAccount", payload: accountData });
        toast("Sei offline — l'account verrà aggiunto al ritorno della connessione");
        return { success: true, queued: true };
        }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        scheduleRetryOnReconnect(() => addAccount(accountData), 'aggiunta account');
        return { success: false, error: 'offline' };
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        toast.error('Utente non autenticato.');
        return { success: false, error: authError?.message || 'not_authenticated' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(accountData.email)) {
        toast.error('Email non valida');
        return { success: false, error: 'invalid_email' };
      }

      const inserted = await withRetry(async () => {
        const { data, error } = await supabase
          .from('email_accounts')
          .insert([{
            user_id: authData.user.id,
            name: accountData.name,
            email: accountData.email,
            is_default: accountData.is_default || false,
            verified: accountData.verified || false,
            dkim_status: accountData.dkim_status || 'unknown',
            spf_status: accountData.spf_status || 'unknown',
          }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }, { label: 'inserimento account' });

      await loadAccounts();
      toast.success('Account aggiunto!');
      return { success: true, data: inserted };
    } catch (err) {
      toast.error('Errore durante l’inserimento.');
      return { success: false, error: err?.message || 'unknown' };
    } finally {
      safeSetLoading(false);
    }
  };

  // ✏️ Aggiorna account
  const updateAccount = async (accountId, updates) => {
    try {
      safeSetLoading(true);

         // 🚨 Se offline → metti in coda
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
         queueRequest({ type: "updateAccount", payload: { id: accountId, updates } });
          toast("Modifica salvata — verrà eseguita appena torni online");
         return { success: true, queued: true };
          }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        scheduleRetryOnReconnect(() => updateAccount(accountId, updates), 'aggiornamento account');
        return { success: false, error: 'offline' };
      }

      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('email_accounts')
          .update(updates)
          .eq('id', accountId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }, { label: 'aggiornamento account' });

      await loadAccounts();
      toast.success('Account aggiornato.');
      return { success: true, data };
    } catch (err) {
      toast.error('Errore durante l’aggiornamento.');
      return { success: false, error: err?.message || 'unknown' };
    } finally {
      safeSetLoading(false);
    }
  };

  // 🗑️ Elimina account
  const deleteAccount = async (accountId) => {
    try {
      safeSetLoading(true);

      if (!navigator.onLine) {
           queueRequest({ type: "deleteAccount", payload: accountId });
           toast("Azione salvata — verrà eseguita appena torni online");
           return { success: true, queued: true };
        }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        scheduleRetryOnReconnect(() => deleteAccount(accountId), 'eliminazione account');
        return { success: false, error: 'offline' };
      }

      await withRetry(async () => {
        const { error } = await supabase
          .from('email_accounts')
          .delete()
          .eq('id', accountId);
        if (error) throw error;
      }, { label: 'eliminazione account' });

      await loadAccounts();
      toast.success('Account eliminato.');
      return { success: true };
    } catch (err) {
      toast.error('Errore durante l’eliminazione.');
      return { success: false, error: err?.message || 'unknown' };
    } finally {
      safeSetLoading(false);
    }
  };

  // 📥 Carica TUTTI gli account (per la select delle campagne)
const loadAllAccounts = async () => {
  try {
    safeSetLoading(true);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (options.offline.mock) {
        toast('Offline: mostro dati locali.');
        safeSetAccounts(options.offline.mockData || []);
        return { success: true, data: options.offline.mockData || [] };
      }
      scheduleRetryOnReconnect(loadAllAccounts, 'caricamento account');
      return { success: false, error: 'offline' };
    }

    const rows = await withRetry(async () => {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        // 🔥 NON FILTRARE PER USER_ID - carica tutti
        .eq('verified', true) // Opzionale: solo account verificati
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data || [];
    }, { label: 'caricamento tutti gli account' });

    console.log('📧 TUTTI gli account caricati:', rows);
    return { success: true, data: rows };
  } catch (err) {
    toast.error(err?.message || 'Errore nel caricamento.');
    return { success: false, error: err?.message || 'unknown' };
  } finally {
    safeSetLoading(false);
  }
};

  // ⭐ Imposta account predefinito
  const setAsDefault = async (accountId) => {
    try {
      safeSetLoading(true);

        // 🚨 Se offline → metti in coda
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
         queueRequest({ type: "setAsDefault", payload: accountId });
         toast("Impostazione salvata — verrà applicata quando torni online");
          return { success: true, queued: true };
          }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        scheduleRetryOnReconnect(() => setAsDefault(accountId), 'impostazione account predefinito');
        return { success: false, error: 'offline' };
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        toast.error('Utente non autenticato.');
        return { success: false, error: authError?.message || 'not_authenticated' };
      }
      const userId = authData.user.id;

      await withRetry(async () => {
        const { error } = await supabase
          .from('email_accounts')
          .update({ is_default: false })
          .eq('user_id', userId);
        if (error) throw error;
      }, { label: 'reset default' });

      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('email_accounts')
          .update({ is_default: true })
          .eq('id', accountId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }, { label: 'impostazione default' });

      await loadAccounts();
      toast.success('Account impostato come predefinito.');
      return { success: true, data };
    } catch (err) {
      toast.error('Errore nell’impostazione del predefinito.');
      return { success: false, error: err?.message || 'unknown' };
    } finally {
      safeSetLoading(false);
    }
  };

  // 🔄 Verifica domini Resend
  const verifyDomains = async (apiKey) => {
    try {
      safeSetLoading(true);

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        scheduleRetryOnReconnect(() => verifyDomains(apiKey), 'verifica domini');
        return { success: false, error: 'offline' };
      }
      if (!apiKey) {
        toast.error('API key Resend mancante.');
        return { success: false, error: 'missing_api_key' };
      }

      const payload = await withRetry(async () => {
        const res = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) throw new Error('resend_fetch_failed');
        return res.json();
      }, { label: 'verifica domini Resend' });

      const domains = payload?.data || [];
      if (!Array.isArray(domains)) {
        toast.error('Risposta Resend non valida.');
        return { success: false, error: 'invalid_resend_response' };
      }

      const updates = accounts
        .map((acc) => {
          const senderDomain = acc.email?.split('@')?.[1];
          if (!senderDomain) return null;
          const domainInfo = domains.find((d) => d.name === senderDomain);
          if (!domainInfo) return null;
          return {
            id: acc.id,
            verified: domainInfo.status === 'verified',
            dkim_status: domainInfo.dkimStatus || 'unknown',
            spf_status: domainInfo.spfStatus || 'unknown',
          };
        })
        .filter(Boolean);

      if (updates.length === 0) {
        toast('Nessun dominio associato trovato.');
        return { success: true, updated: 0 };
      }

      await withRetry(async () => {
        await Promise.all(
          updates.map((u) =>
            supabase
              .from('email_accounts')
              .update({
                verified: u.verified,
                dkim_status: u.dkim_status,
                spf_status: u.spf_status,
              })
              .eq('id', u.id)
          )
        );
      }, { label: 'aggiornamento stati dominio' });

      await loadAccounts();
      toast.success(`Verifica completata. Aggiornati ${updates.length} account.`);
      return { success: true, updated: updates.length };
    } catch (err) {
      toast.error('Errore durante la verifica domini.');
      return { success: false, error: err?.message || 'unknown' };
    } finally {
      safeSetLoading(false);
    }
  };

  // ⤵️ Mount / Unmount
  useEffect(() => {
    mounted.current = true;

    // 🔄 Quando torni online — esegui tutto ciò che era in coda
flushQueue(async (action) => {
   if (action.type === "addAccount") await addAccount(action.payload);
   if (action.type === "deleteAccount") await deleteAccount(action.payload);
  if (action.type === "updateAccount") await updateAccount(action.payload.id, action.payload.updates);
  if (action.type === "setAsDefault") await setAsDefault(action.payload);
  });
    loadAccounts();
    return () => { mounted.current = false; };
  }, []);

  return {
    accounts,
  loading,
  defaultAccount,
  loadAccounts,
  loadAllAccounts, // 🔥 AGGIUNGI QUESTA
  addAccount,
  updateAccount,
  deleteAccount,
  setAsDefault,
  verifyDomains,
  };
};

