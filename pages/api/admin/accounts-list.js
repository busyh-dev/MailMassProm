// pages/api/admin/accounts-list.js
// Restituisce la lista di tutti i profili (per il dropdown filtro del SuperAdmin)
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

  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id obbligatorio' });
  }

  const authCheck = await checkSuperAdmin(user_id);
  if (!authCheck.authorized) {
    return res.status(403).json({ success: false, message: 'Accesso negato', details: authCheck.details });
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
