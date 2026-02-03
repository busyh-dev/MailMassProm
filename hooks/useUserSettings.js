// hooks/useUserSettings.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carica impostazioni al mount
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    loadSettings();
  }, [user]);

  // Carica impostazioni dal database
  const loadSettings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Se non esistono impostazioni, crea record con valori default
        if (error.code === 'PGRST116') {
          await createDefaultSettings();
          return;
        }
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('❌ Errore caricamento impostazioni:', error);
      toast.error('Errore nel caricamento delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  // Crea impostazioni default
  const createDefaultSettings = async () => {
    try {
      const defaultSettings = {
        user_id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: user.email,
        role: 'user',
        language: 'it',
        timezone: 'Europe/Rome',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
        notify_new_campaigns: true,
        notify_report_weekly: false,
        notify_campaign_results: true,
        notify_new_contacts: false,
        accept_offers: false,
        two_factor_enabled: false,
        auto_login: false,
      };

      const { data, error } = await supabase
        .from('user_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      console.log('✅ Impostazioni default create');
    } catch (error) {
      console.error('❌ Errore creazione impostazioni default:', error);
    }
  };

  // Salva impostazioni
  const saveSettings = async (updates) => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast.success('✅ Impostazioni salvate con successo!');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Errore salvataggio impostazioni:', error);
      toast.error('❌ Errore nel salvataggio delle impostazioni');
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  // Aggiorna password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setSaving(true);

      // Verifica password corrente (opzionale, Supabase lo fa automaticamente)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('✅ Password aggiornata con successo!');
      return { success: true };
    } catch (error) {
      console.error('❌ Errore aggiornamento password:', error);
      toast.error('❌ Errore nell\'aggiornamento della password');
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    loadSettings,
    saveSettings,
    updatePassword,
  };
};