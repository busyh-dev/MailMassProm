import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { adminId, userId, fullName, email, password, roleName } = req.body;

  if (!adminId || !userId) {
    return res.status(400).json({ error: 'Mancano parametri essenziali' });
  }

  try {
    // 1. Verifica che l'adminId fornito sia effettivamente un super_admin
    const { data: adminProfile, error: adminErr } = await supabaseAdmin
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', adminId)
      .single();

    if (adminErr || !adminProfile) {
      return res.status(403).json({ error: 'Profilo admin non trovato' });
    }

    const isAdminName = adminProfile.role?.name?.toLowerCase();
    if (isAdminName !== 'super_admin' && isAdminName !== 'superadmin') {
      return res.status(403).json({ error: 'Non hai i permessi per modificare gli utenti' });
    }

    // 2. Prepara l'oggetto di aggiornamento Auth
    const authUpdates = {
      email: email,
      user_metadata: {
        full_name: fullName
      }
    };

    if (password && password.length >= 6) {
      authUpdates.password = password;
    }

    // 3. Esegui aggiornamento in auth.users (richiede service_role)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      authUpdates
    );

    if (authError) {
      console.error('Errore Supabase Admin Update User:', authError);
      return res.status(400).json({ error: authError.message });
    }

    // 4. Determina il role_id basandosi sul nome passato dal frontend
    let roleIdToSet = 3; // Default 'user'
    if (roleName === 'super_admin' || roleName === 'SuperAdmin') roleIdToSet = 1;
    else if (roleName === 'superUser') roleIdToSet = 2;

    // 5. Aggiorna la tabella profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        email: email, // Manteniamo la sincronizzazione
        role_id: roleIdToSet
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Errore aggiornamento profile:', profileError);
      return res.status(400).json({ error: 'Auth aggiornata, ma errore aggiornamento profilo' });
    }

    return res.status(200).json({ success: true, message: 'Utente aggiornato con successo' });

  } catch (error) {
    console.error('Server error update-user:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
