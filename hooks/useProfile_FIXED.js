import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  // Carica il profilo dell'utente loggato
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!currentUser) throw new Error('Utente non autenticato');

      setUser(currentUser);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profileData) {
        const newProfile = {
          id: currentUser.id,
          email: currentUser.email,
          status: 'pending',
          full_name: currentUser.user_metadata?.full_name || '',
          language: 'it',
          timezone: 'Europe/Rome',
          date_format: 'DD/MM/YYYY',
          time_format: '24h',
          notify_new_campaigns: true,
          notify_campaign_results: true,
          notify_urgent_updates: true,
          notify_push_new_tasks: true,
          notify_push_mentions: true,
          notify_push_reminders: true,
          reminder_weekly_review: true,
          reminder_clock_in: true,
          accept_offers: false,
          two_factor_enabled: false,
          auto_login: true,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(createdProfile);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Errore nel caricamento del profilo:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Salva Notifiche (notifiche2)
  const saveNotifications = async (notificationData) => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          notify_new_campaigns: notificationData.notify_new_campaigns,
          notify_campaign_results: notificationData.notify_campaign_results,
          notify_urgent_updates: notificationData.notify_urgent_updates,
          notify_push_new_tasks: notificationData.notify_push_new_tasks,
          notify_push_mentions: notificationData.notify_push_mentions,
          notify_push_reminders: notificationData.notify_push_reminders,
          reminder_weekly_review: notificationData.reminder_weekly_review,
          reminder_clock_in: notificationData.reminder_clock_in,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { success: true, message: '✅ Notifiche salvate con successo!' };
    } catch (error) {
      console.error('Errore nel salvataggio notifiche:', error);
      return { success: false, error: '❌ Errore nel salvataggio delle notifiche' };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Salva Lingua
  const saveLanguage = async (language) => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('profiles')
        .update({ language })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { success: true, message: '✅ Lingua salvata con successo!' };
    } catch (error) {
      console.error('Errore nel salvataggio lingua:', error);
      return { success: false, error: '❌ Errore nel salvataggio della lingua' };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Salva Formato Data/Ora
  const saveDateTimeFormat = async (formatData) => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          date_format: formatData.date_format,
          time_format: formatData.time_format,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { success: true, message: '✅ Formato data/ora salvato con successo!' };
    } catch (error) {
      console.error('Errore nel salvataggio formato:', error);
      return { success: false, error: '❌ Errore nel salvataggio del formato' };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Salva Privacy
  const savePrivacy = async (acceptOffers) => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('profiles')
        .update({ accept_offers: acceptOffers })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { success: true, message: '✅ Preferenze privacy salvate!' };
    } catch (error) {
      console.error('Errore nel salvataggio privacy:', error);
      return { success: false, error: '❌ Errore nel salvataggio delle preferenze' };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Cambia Password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setSaving(true);

      // Verifica la password attuale
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        return { success: false, error: '❌ Password attuale non corretta' };
      }

      // Aggiorna la password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      return { success: true, message: '✅ Password aggiornata con successo!' };
    } catch (error) {
      console.error('Errore nel cambio password:', error);
      return { success: false, error: '❌ ' + error.message };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Salva Impostazioni Sistema (Admin)
  const saveSystemSettings = async (settingsData) => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          smtp_server: settingsData.smtp_server,
          smtp_port: settingsData.smtp_port,
          sender_email: settingsData.sender_email,
          two_factor_enabled: settingsData.two_factor_enabled,
          auto_login: settingsData.auto_login,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { success: true, message: '✅ Impostazioni sistema salvate!' };
    } catch (error) {
      console.error('Errore nel salvataggio impostazioni:', error);
      return { success: false, error: '❌ Errore nel salvataggio delle impostazioni' };
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    user,
    loading,
    saving,
    saveNotifications,
    saveLanguage,
    saveDateTimeFormat,
    savePrivacy,
    changePassword,
    saveSystemSettings,
    refreshProfile: loadProfile,
  };
};