// pages/api/admin/contacts-all.js
// Restituisce tutti i contatti per il SuperAdmin, con info account
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
    // Carica i contatti (con filtro account opzionale e paginazione per superare il limite di 1000)
    let contacts = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabaseAdmin
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (filter_user_id) {
        query = query.eq('user_id', filter_user_id);
      }

      const { data: chunk, error } = await query;
      if (error) throw error;

      if (chunk && chunk.length > 0) {
        contacts = contacts.concat(chunk);
        from += limit;
      }
      
      if (!chunk || chunk.length < limit) {
        hasMore = false;
      }
    }

    // Recupera i profili degli account coinvolti per arricchire i dati
    const userIds = [...new Set((contacts || []).map(c => c.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, name')
        .in('id', userIds);
      profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    }

    const enriched = (contacts || []).map(c => ({
      ...c,
      account: profileMap[c.user_id] || { email: c.user_id },
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    console.error('❌ contacts-all error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
