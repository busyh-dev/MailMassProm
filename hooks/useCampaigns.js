import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Carica tutte le campagne dell'utente
  const loadCampaigns = async () => {
    try {
      setLoading(true);
  
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Utente non autenticato');
  
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
  
      if (error) throw error;
  
      // ✅ DEBUG: Vedi i dati RAW dal database
      console.log('📦 RAW DATA FROM DATABASE:', data);
      console.log('📋 First campaign raw:', data?.[0]);
      console.log('📋 Status from DB:', data?.[0]?.status);
  
      setCampaigns(data || []);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Errore nel caricamento campagne:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Carica campagne al mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  // 💾 Salva campagna (crea o aggiorna)
  const saveCampaign = async (campaignData, isDraft = true) => {
    try {
      setSaving(true);
  
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Utente non autenticato');
  
      // ✅ DEBUG: Vedi cosa arriva
      console.log('💾 campaignData ricevuto:', campaignData);
      console.log('📧 senderEmail:', campaignData.senderEmail);
      console.log('📧 fallback localStorage:', localStorage.getItem('resend_sender_email'));
  
      // Prepara i dati della campagna
      const campaign = {
        user_id: user.id,
        campaign_name: campaignData.campaignName,
        subject: campaignData.subject,
        email_content: campaignData.emailContent || '<p></p>',
        recipient_list: campaignData.recipientList || [],
        total_recipients: campaignData.recipientList?.length || 0,
        cc: campaignData.cc || null,
        bcc: campaignData.bcc || null,
        sender_email: campaignData.senderEmail || localStorage.getItem('resend_sender_email'),
        sender_name: campaignData.senderName || null,
        attachments: campaignData.attachments || [],
        total_attachment_size: campaignData.totalAttachmentSize || 0,
        status: isDraft ? 'draft' : 'scheduled',
        scheduled_at: campaignData.scheduledAt || null,
        tracking_enabled: campaignData.trackingEnabled !== false,
        open_tracking: campaignData.openTracking !== false,
        click_tracking: campaignData.clickTracking !== false,
        tags: campaignData.tags || [],
        notes: campaignData.notes || null,
        resend_api_key: localStorage.getItem('resend_api_key') || null,
        reply_to: campaignData.replyTo || null,
      };
  
      console.log('💾 Campaign object da salvare:', campaign); // ✅ DEBUG
      console.log('📧 sender_email nel campaign:', campaign.sender_email); // ✅ DEBUG
      console.log('📋 status nel campaign:', campaign.status); // ✅ DEBUG
  
      let result;
  
      // Se ha un ID, aggiorna; altrimenti crea
      if (campaignData.id) {
        const { data, error } = await supabase
          .from('campaigns')
          .update(campaign)
          .eq('id', campaignData.id)
          .eq('user_id', user.id)
          .select()
          .single();
  
        if (error) throw error;
        result = data;
  
        // Aggiorna la lista locale
        setCampaigns(prev => 
          prev.map(c => c.id === result.id ? result : c)
        );
      } else {
        const { data, error } = await supabase
          .from('campaigns')
          .insert([campaign])
          .select()
          .single();
  
        if (error) throw error;
        result = data;
  
        // Aggiungi alla lista locale
        setCampaigns(prev => [result, ...prev]);
      }
  
      console.log('✅ Risultato salvato nel DB:', result); // ✅ DEBUG
      console.log('✅ sender_email salvato:', result.sender_email); // ✅ DEBUG
      console.log('✅ status salvato:', result.status); // ✅ DEBUG
  
      return { 
        success: true, 
        message: isDraft ? '💾 Bozza salvata con successo!' : '✅ Campagna salvata!',
        data: result 
      };
    } catch (error) {
      console.error('❌ Errore nel salvataggio campagna:', error);
      return { 
        success: false, 
        error: '❌ Errore nel salvataggio: ' + error.message 
      };
    } finally {
      setSaving(false);
    }
  };

  // 📤 Aggiorna stato campagna dopo l'invio
  const updateCampaignAfterSend = async (campaignId, stats) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Utente non autenticato');

      const { data, error } = await supabase
        .from('campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_count: stats.sentCount || 0,
          failed_count: stats.failedCount || 0,
          total_recipients: stats.totalRecipients || 0,
        })
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Aggiorna la lista locale
      setCampaigns(prev => 
        prev.map(c => c.id === data.id ? data : c)
      );

      return { success: true, data };
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento campagna:', error);
      return { success: false, error: error.message };
    }
  };

  // 📝 Carica una singola campagna
  const getCampaign = async (campaignId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Utente non autenticato');

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('❌ Errore nel caricamento campagna:', error);
      return { success: false, error: error.message };
    }
  };

 
  // 🗑️ Elimina campagna
const deleteCampaign = async (campaignId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("Utente non autenticato");
  
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId)
        .eq("user_id", user.id);
  
      if (error) throw error;
  
      // Aggiorna lo stato locale rimuovendo la campagna
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
  
      return { success: true, message: "Campagna eliminata correttamente" };
    } catch (error) {
      console.error("❌ Errore nell'eliminazione campagna:", error);
      return { success: false, error: error.message };
    }
  };
  

  // 📊 Ottieni statistiche campagne
  const getCampaignStats = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Utente non autenticato');

      const { data, error } = await supabase
        .from('campaign_stats')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('❌ Errore nel caricamento statistiche:', error);
      return { success: false, error: error.message };
    }
  };

  // 📬 Salva log di invio
  const saveCampaignLog = async (logData) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Utente non autenticato');

      const log = {
        campaign_id: logData.campaignId,
        user_id: user.id,
        recipient_email: logData.recipientEmail,
        recipient_name: logData.recipientName || null,
        status: logData.status || 'pending',
        error_message: logData.errorMessage || null,
        sent_at: logData.sentAt || null,
        resend_email_id: logData.resendEmailId || null,
      };

      const { data, error } = await supabase
        .from('campaign_logs')
        .insert([log])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('❌ Errore nel salvataggio log:', error);
      return { success: false, error: error.message };
    }
  };

  // 📊 Ottieni log di una campagna
  const getCampaignLogs = async (campaignId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Utente non autenticato');

      const { data, error } = await supabase
        .from('campaign_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('❌ Errore nel caricamento log:', error);
      return { success: false, error: error.message };
    }
  };

  // 📈 Aggiorna statistiche tracking
  const updateCampaignTracking = async (campaignId, trackingType) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Utente non autenticato');

      const updateField = 
        trackingType === 'open' ? 'opened_count' :
        trackingType === 'click' ? 'clicked_count' :
        trackingType === 'bounce' ? 'bounced_count' : null;

      if (!updateField) throw new Error('Tipo tracking non valido');

      // Incrementa il contatore
      const { data, error } = await supabase.rpc('increment_campaign_counter', {
        campaign_uuid: campaignId,
        counter_field: updateField
      });

      if (error) throw error;

      // Ricarica le campagne per aggiornare la UI
      await loadCampaigns();

      return { success: true };
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento tracking:', error);
      return { success: false, error: error.message };
    }
  };

  // 🔄 Duplica campagna
  const duplicateCampaign = async (campaignId) => {
    try {
      const { success, data: campaign } = await getCampaign(campaignId);
      
      if (!success) throw new Error('Campagna non trovata');

      // Rimuovi campi che non vanno duplicati
      const newCampaign = {
        ...campaign,
        campaign_name: `${campaign.campaign_name} (Copia)`,
        status: 'draft',
        sent_at: null,
        sent_count: 0,
        failed_count: 0,
        opened_count: 0,
        clicked_count: 0,
        bounced_count: 0,
      };

      delete newCampaign.id;
      delete newCampaign.created_at;
      delete newCampaign.updated_at;

      return await saveCampaign(newCampaign, true);
    } catch (error) {
      console.error('❌ Errore nella duplicazione campagna:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    campaigns,
    loading,
    saving,
    loadCampaigns,
    saveCampaign,
    updateCampaignAfterSend,
    deleteCampaign, // 👈 aggiungi qui
    getCampaign,
    deleteCampaign,
    getCampaignStats,
    saveCampaignLog,
    getCampaignLogs,
    updateCampaignTracking,
    duplicateCampaign,
  };
};