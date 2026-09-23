// pages/api/admin/logs-all.js
// Restituisce tutti gli storico invii (email_logs) per il SuperAdmin
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

async function checkSuperAdmin(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role:roles(name), role_id, email')
    .eq('id', userId)
    .maybeSingle();
  if (error) return { authorized: false, details: `Errore DB: ${error.message}` };
  if (!data) return { authorized: false, details: 'Nessun profilo trovato' };
  const roleName = data?.role?.name || '';
  const ok = ['super_admin', 'superAdmin', 'SuperAdmin'].includes(roleName) || data?.role_id === 1;
  return { 
    authorized: ok, 
    details: ok ? null : `Il tuo utente (${data.email}) ha il ruolo '${roleName}' (ID: ${data?.role_id}), che non dispone di permessi SuperAdmin.` 
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Metodo non consentito' });
  }

  const { user_id, filter_user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id obbligatorio' });
  }

  const authCheck = await checkSuperAdmin(user_id);
  if (!authCheck.authorized) {
    return res.status(403).json({ success: false, message: 'Accesso negato', details: authCheck.details });
  }

  try {
    // 1. Recupera i log da email_logs
    let logsQuery = supabaseAdmin
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false });

    if (filter_user_id) {
      logsQuery = logsQuery.eq('user_id', filter_user_id);
    }
    const { data: logsData } = await logsQuery;

    // 2. Recupera le campagne inviate dalla tabella campaigns
    let campaignsQuery = supabaseAdmin
      .from('campaigns')
      .select('*')
      .or('status.eq.sent,sent_at.not.is.null')
      .order('sent_at', { ascending: false });

    if (filter_user_id) {
      campaignsQuery = campaignsQuery.eq('user_id', filter_user_id);
    }
    const { data: campaignsData } = await campaignsQuery;

    // Set di campagne già presenti in email_logs per evitare duplicati
    const loggedCampaignIds = new Set((logsData || []).map(l => l.campaign_id).filter(Boolean));

    // Mappa le campagne inviate non ancora presenti in email_logs
    const campaignLogs = (campaignsData || [])
      .filter(c => !loggedCampaignIds.has(c.id))
      .map(c => ({
        id: `camp-${c.id}`,
        campaign_id: c.id,
        user_id: c.user_id,
        subject: c.campaign_name || c.subject || 'Campagna Email',
        campaign_name: c.campaign_name || c.subject || 'Campagna Email',
        sender_email: c.sender_email || c.sender_name || '',
        sent_at: c.sent_at || c.created_at,
        status: c.status || 'sent',
        opened_count: c.opened_count || 0,
        total_recipients: typeof c.sent_count === 'number' && c.sent_count > 0 
          ? c.sent_count 
          : (typeof c.total_recipients === 'number' ? c.total_recipients : (Array.isArray(c.recipients) ? c.recipients.length : 1)),
        recipients: c.recipients || [],
      }));

    const allLogs = [...(logsData || []), ...campaignLogs].sort((a, b) => {
      const dateA = new Date(a.sent_at || a.created_at || 0);
      const dateB = new Date(b.sent_at || b.created_at || 0);
      return dateB - dateA;
    });

    // Arricchisce con info account
    const userIds = [...new Set(allLogs.map(l => l.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, name')
        .in('id', userIds);
      profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    }

    const enriched = allLogs.map(l => ({
      ...l,
      account: profileMap[l.user_id] || { email: l.user_id },
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    console.error('❌ logs-all error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
