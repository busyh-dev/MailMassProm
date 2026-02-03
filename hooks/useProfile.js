// hooks/useProfile.js
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

      // ✅ Carica da user_settings invece di profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profileData) {
        // ✅ Crea record default in user_settings
        const newProfile = {
          user_id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || '',
          role: 'user',
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
          notify_report_weekly: true,
          notify_new_contacts: true,
          reminder_clock_in: true,
          accept_offers: false,
          smtp_server: '',
          smtp_port: 587,
          sender_email: '',
          two_factor_enabled: false,
          auto_login: true,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('user_settings')
          .insert([newProfile])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(createdProfile);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento del profilo:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Salvataggio combinato e ottimizzato
  const saveNotificationsPrimary = async (formData) => {
    try {
      setSaving(true);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Utente non autenticato");

      // 🧠 Ottieni il profilo attuale per confronto
      const { data: currentProfile, error: fetchError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (fetchError) throw fetchError;

      // ✅ Validazioni di base
      const errors = [];

      // 🔹 Nome obbligatorio
      if (formData.name && formData.name.trim().length < 2) {
        errors.push("Il nome deve contenere almeno 2 caratteri.");
      }

      // 🔹 Email valida
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push("Inserisci un indirizzo email valido.");
      }

      // 🔹 Lingua supportata
      const supportedLanguages = ["it", "en", "es", "fr"];
      if (formData.language && !supportedLanguages.includes(formData.language)) {
        errors.push(`Lingua non supportata (${formData.language}).`);
      }

      // 🔹 Timezone supportata
      const supportedTimezones = [
        "Europe/Rome",
        "Europe/London",
        "America/New_York"
      ];
      if (formData.timezone && !supportedTimezones.includes(formData.timezone)) {
        errors.push(`Fuso orario non valido (${formData.timezone}).`);
      }

      // 🚫 Se ci sono errori, blocca il salvataggio
      if (errors.length > 0) {
        return { success: false, error: "❌ " + errors.join(" ") };
      }

      // 🧩 Campi potenzialmente aggiornabili
      const fields = [
        "notify_new_campaigns",
        "notify_campaign_results",
        "notify_report_weekly",
        "notify_new_contacts",
        "name",
        "email",
        "language",
        "timezone",
      ];

      // 🔍 Costruisci un oggetto solo con i campi modificati
      const updateData = {};
      fields.forEach((key) => {
        const newValue = formData[key];
        const oldValue = currentProfile[key];
        if (newValue !== undefined && newValue !== oldValue) {
          updateData[key] = newValue;
        }
      });

      // 💤 Se nessun campo è cambiato, interrompi
      if (Object.keys(updateData).length === 0) {
        return { success: true, message: "ℹ️ Nessuna modifica da salvare" };
      }

      console.log("🟢 Campi aggiornati:", updateData);

      // 🧾 Esegui aggiornamento su Supabase solo per i campi cambiati
      const { data, error } = await supabase
        .from("user_settings")
        .update(updateData)
        .eq("user_id", currentUser.id)
        .select()
        .single();

      if (error) throw error;

      // 🔄 Aggiorna stato locale
      setProfile(data);

      return { success: true, message: "✅ Profilo aggiornato con successo!" };
    } catch (error) {
      console.error("❌ Errore nel salvataggio profilo:", error);
      return { success: false, error: "❌ " + (error.message || "Errore generico nel salvataggio") };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Salva Notifiche
  const saveNotifications = async (notificationData) => {
    try {
      setSaving(true);

      if (!user || !user.id) {
        throw new Error('Utente non autenticato');
      }

      const { data, error } = await supabase
        .from('user_settings')
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
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { success: true, message: '✅ Notifiche salvate con successo!' };
    } catch (error) {
      console.error('❌ Errore nel salvataggio notifiche:', error);
      return { success: false, error: '❌ ' + (error.message || 'Errore nel salvataggio delle notifiche') };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Salva Lingua
  const saveLanguage = async (language) => {
    try {
      setSaving(true);

      if (!user || !user.id) {
        throw new Error('Utente non autenticato');
      }

      const { data, error } = await supabase
        .from('user_settings')
        .update({ language })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { success: true, message: '✅ Lingua salvata con successo!' };
    } catch (error) {
      console.error('❌ Errore nel salvataggio lingua:', error);
      return { success: false, error: '❌ ' + (error.message || 'Errore nel salvataggio della lingua') };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Salva Formato Data/Ora
  const saveDateTimeFormat = async (formatData) => {
    try {
      setSaving(true);

      if (!user || !user.id) {
        throw new Error('Utente non autenticato');
      }

      const { data, error } = await supabase
        .from('user_settings')
        .update({
          date_format: formatData.date_format,
          time_format: formatData.time_format,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { success: true, message: '✅ Formato data/ora salvato con successo!' };
    } catch (error) {
      console.error('❌ Errore nel salvataggio formato:', error);
      return { success: false, error: '❌ ' + (error.message || 'Errore nel salvataggio del formato') };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Salva Privacy
  const savePrivacy = async (acceptOffers) => {
    try {
      setSaving(true);

      if (!user || !user.id) {
        throw new Error('Utente non autenticato');
      }

      const { data, error } = await supabase
        .from('user_settings')
        .update({ accept_offers: acceptOffers })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { success: true, message: '✅ Preferenze privacy salvate!' };
    } catch (error) {
      console.error('❌ Errore nel salvataggio privacy:', error);
      return { success: false, error: '❌ ' + (error.message || 'Errore nel salvataggio delle preferenze') };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Cambia Password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setSaving(true);

      if (!user || !user.email) {
        throw new Error('Utente non autenticato');
      }

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
      console.error('❌ Errore nel cambio password:', error);
      return { success: false, error: '❌ ' + (error.message || 'Errore nel cambio password') };
    } finally {
      setSaving(false);
    }
  };

  // ✅ Salva Impostazioni Sistema (Admin)
  const saveSystemSettings = async (settingsData) => {
    try {
      setSaving(true);

      if (!user || !user.id) {
        throw new Error('Utente non autenticato');
      }

      const { data, error } = await supabase
        .from('user_settings')
        .update({
          smtp_server: settingsData.smtp_server,
          smtp_port: settingsData.smtp_port,
          sender_email: settingsData.sender_email,
          two_factor_enabled: settingsData.two_factor_enabled,
          auto_login: settingsData.auto_login,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { success: true, message: '✅ Impostazioni sistema salvate!' };
    } catch (error) {
      console.error('❌ Errore nel salvataggio impostazioni:', error);
      return { success: false, error: '❌ ' + (error.message || 'Errore nel salvataggio delle impostazioni') };
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
    saveNotificationsPrimary,
    saveLanguage,
    saveDateTimeFormat,
    savePrivacy,
    changePassword,
    saveSystemSettings,
    refreshProfile: loadProfile,
  };
};