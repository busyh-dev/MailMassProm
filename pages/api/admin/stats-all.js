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

    // Conta accounts (profili registrati)
    const { count: accountsCount, error: err1 } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    if (err1) throw err1;

    // Conta contatti totali
    const { count: contactsCount, error: err2 } = await supabaseAdmin
      .from('contacts')
      .select('id', { count: 'exact', head: true });
    if (err2) throw err2;

    // Conta campagne totali
    const { count: campaignsCount, error: err3 } = await supabaseAdmin
      .from('campaigns')
      .select('id', { count: 'exact', head: true });
    if (err3) throw err3;

    // Somma email inviate totali (da email_logs)
    const { data: logsData, error: err4 } = await supabaseAdmin
      .from('email_logs')
      .select('total_recipients');
    if (err4) throw err4;

    const totalEmailsSent = (logsData || []).reduce((acc, l) => acc + (l.total_recipients || 0), 0);

    // Campagne inviate (status = sent)
    const { count: sentCampaignsCount, error: err5 } = await supabaseAdmin
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent');
    if (err5) throw err5;

    return res.status(200).json({
      success: true,
      data: {
        accountsCount: accountsCount || 0,
        contactsCount: contactsCount || 0,
        campaignsCount: campaignsCount || 0,
        sentCampaignsCount: sentCampaignsCount || 0,
        totalEmailsSent,
      },
    });
  } catch (err) {
    console.error('❌ stats-all error:', err);
    return res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
}
