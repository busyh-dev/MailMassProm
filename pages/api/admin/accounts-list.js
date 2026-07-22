// pages/api/admin/accounts-list.js
// Restituisce la lista di tutti i profili (per il dropdown filtro del SuperAdmin)
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

  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id obbligatorio' });
  }

  if (!(await isSuperAdmin(user_id))) {
    return res.status(403).json({ success: false, message: 'Accesso negato' });
  }

  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, name, role:roles(name)')
      .order('full_name', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ success: true, data: profiles || [] });
  } catch (err) {
    console.error('❌ accounts-list error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
