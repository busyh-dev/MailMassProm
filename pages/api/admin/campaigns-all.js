// pages/api/admin/campaigns-all.js
// Restituisce tutte le campagne per il SuperAdmin, con info account
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

async function isSuperAdmin(userId) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role:roles(name), role_id')
    .eq('id', userId)
    .maybeSingle();
  const roleName = data?.role?.name || '';
  return ['super_admin', 'superAdmin', 'SuperAdmin'].includes(roleName) || data?.role_id === 1;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Metodo non consentito' });
  }

  const { user_id, filter_user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id obbligatorio' });
  }

  if (!(await isSuperAdmin(user_id))) {
    return res.status(403).json({ success: false, message: 'Accesso negato' });
  }

  try {
    let query = supabaseAdmin
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter_user_id) {
      query = query.eq('user_id', filter_user_id);
    }

    const { data: campaigns, error } = await query;
    if (error) throw error;

    // Arricchisce con info account
    const userIds = [...new Set((campaigns || []).map(c => c.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, name')
        .in('id', userIds);
      profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    }

    const enriched = (campaigns || []).map(c => ({
      ...c,
      account: profileMap[c.user_id] || { email: c.user_id },
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    console.error('❌ campaigns-all error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
