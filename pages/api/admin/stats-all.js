// pages/api/admin/stats-all.js
// Restituisce statistiche globali per il SuperAdmin

export default async function handler(req, res) {
  try {
    const { supabaseAdmin } = await import('../../../lib/supabaseAdmin');

    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Metodo non consentito' });
    }

    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id obbligatorio' });
    }

    // Verifica super_admin
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('role:roles(name), role_id')
      .eq('id', user_id)
      .maybeSingle();
    const roleName = data?.role?.name || '';
    const isSuperAdmin = ['super_admin', 'superAdmin', 'SuperAdmin'].includes(roleName) || data?.role_id === 1;

    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }

    // Conta accounts (profili registrati) paginando
    let accountsCount = 0;
    let fromAcc = 0;
    while (true) {
      const { data, error } = await supabaseAdmin.from('profiles').select('id').range(fromAcc, fromAcc + 999);
      if (error) throw error;
      accountsCount += data.length;
      if (data.length < 1000) break;
      fromAcc += 1000;
    }

    // Conta contatti totali paginando
    let contactsCount = 0;
    let fromCont = 0;
    while (true) {
      const { data, error } = await supabaseAdmin.from('contacts').select('id').range(fromCont, fromCont + 999);
      if (error) throw error;
      contactsCount += data.length;
      if (data.length < 1000) break;
      fromCont += 1000;
    }

    // Conta campagne totali paginando
    let campaignsCount = 0;
    let fromCamp = 0;
    while (true) {
      const { data, error } = await supabaseAdmin.from('campaigns').select('id').range(fromCamp, fromCamp + 999);
      if (error) throw error;
      campaignsCount += data.length;
      if (data.length < 1000) break;
      fromCamp += 1000;
    }

    // Somma email inviate totali (da email_logs) e account attivi
    const { data: logsData, error: err4 } = await supabaseAdmin
      .from('email_logs')
      .select('total_recipients, user_id');
    if (err4) throw err4;

    const totalEmailsSent = (logsData || []).reduce((acc, l) => acc + (l.total_recipients || 0), 0);
    const activeAccountsSet = new Set((logsData || []).filter(l => l.user_id).map(l => l.user_id));
    const activeAccountsCount = activeAccountsSet.size;

    // Campagne inviate (status = sent) paginando
    let sentCampaignsCount = 0;
    let fromSent = 0;
    while (true) {
      const { data, error } = await supabaseAdmin
        .from('campaigns')
        .select('id')
        .eq('status', 'sent')
        .range(fromSent, fromSent + 999);
      if (error) throw error;
      sentCampaignsCount += data.length;
      if (data.length < 1000) break;
      fromSent += 1000;
    }

    return res.status(200).json({
      success: true,
      data: {
        accountsCount: accountsCount || 0,
        contactsCount: contactsCount || 0,
        campaignsCount: campaignsCount || 0,
        sentCampaignsCount: sentCampaignsCount || 0,
        totalEmailsSent,
        activeAccountsCount
      },
    });
  } catch (err) {
    console.error('❌ stats-all error:', err);
    return res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
}
