import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const SessionTimeoutSettings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const hasLoadedRef = useRef(false); // ✅ evita reload al rimount

  useEffect(() => {
    console.log('🔴 SessionTimeoutSettings MONTATO');
    return () => console.log('🔴 SessionTimeoutSettings SMONTATO');
  }, []);

  useEffect(() => {
    console.log('🔄 loadUsers useEffect eseguito, hasLoadedRef:', hasLoadedRef.current);
  });

  useEffect(() => {
    if (hasLoadedRef.current) return; // ✅ blocca sempre dopo il primo caricamento
    hasLoadedRef.current = true;
  
    const loadUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, session_timeout_enabled, session_timeout_minutes')
          .order('full_name');
        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        toast.error('Errore nel caricamento utenti');
        hasLoadedRef.current = false; // ✅ permetti retry solo in caso di errore
      } finally {
        setLoading(false);
      }
    };
  
    loadUsers();
  }, []); // ✅ dipendenze vuote + ref = carica una sola volta

  // ✅ Gestisce il cambio finestra senza ricaricare
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Non fare nulla quando si ritorna alla finestra
      // i dati sono già in memoria
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const updateUserSession = async (userId, field, value) => {
    // ✅ Aggiorna subito lo stato locale (ottimistico)
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, [field]: value } : u
    ));

    setSaving(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId);

    if (!error) {
      toast.success('Impostazione salvata');
    } else {
      // ✅ In caso di errore ripristina il valore precedente
      toast.error('Errore nel salvataggio');
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, [field]: !value } : u
      ));
    }
    setSaving(null);
  };

  const formatTime = (minutes) => {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  if (!loading && users.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      Nessun utente trovato
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">⏱️ Gestione Timeout Sessione</h3>
        <p className="text-sm text-gray-500 mt-1">
          Configura il logout automatico per ogni utente. Se disabilitato, l'utente non verrà mai disconnesso automaticamente.
        </p>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Utente</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Auto-logout</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Timeout</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Stato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{u.full_name || '—'}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => updateUserSession(u.id, 'session_timeout_enabled', !u.session_timeout_enabled)}
                    disabled={saving === u.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      u.session_timeout_enabled !== false ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      u.session_timeout_enabled !== false ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  {u.session_timeout_enabled !== false ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex flex-col items-center px-2 py-1 bg-white">
                          <label className="text-[10px] text-gray-400 mb-0.5">Ore</label>
                          <input
                            type="number" min="0" max="24"
                            key={`${u.id}-hours`}
                            defaultValue={Math.floor((u.session_timeout_minutes || 30) / 60)}
                            onBlur={(e) => {
                              const h = parseInt(e.target.value) || 0;
                              const m = (u.session_timeout_minutes || 30) % 60;
                              updateUserSession(u.id, 'session_timeout_minutes', h * 60 + m);
                            }}
                            className="w-12 text-center text-sm font-medium focus:outline-none"
                          />
                        </div>
                        <div className="text-gray-300 text-xs self-center">:</div>
                        <div className="flex flex-col items-center px-2 py-1 bg-white">
                          <label className="text-[10px] text-gray-400 mb-0.5">Min</label>
                          <input
                            type="number" min="0" max="59"
                            key={`${u.id}-minutes`}
                            defaultValue={(u.session_timeout_minutes || 30) % 60}
                            onBlur={(e) => {
                              const h = Math.floor((u.session_timeout_minutes || 30) / 60);
                              const m = parseInt(e.target.value) || 0;
                              updateUserSession(u.id, 'session_timeout_minutes', h * 60 + m);
                            }}
                            className="w-12 text-center text-sm font-medium focus:outline-none"
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        = {formatTime(u.session_timeout_minutes || 30)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Disabilitato</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {saving === u.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500 mx-auto" />
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      u.session_timeout_enabled !== false
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.session_timeout_enabled !== false ? '✓ Attivo' : '○ Off'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        ℹ️ Le modifiche hanno effetto alla prossima sessione dell'utente. Il timeout minimo consigliato è 15 minuti.
      </p>
    </div>
  );
};

export default SessionTimeoutSettings;