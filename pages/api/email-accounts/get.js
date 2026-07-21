// pages/api/email-accounts/get.js
import { supabaseAdmin as supabase } from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Metodo non consentito." });
  }

  const { user_id } = req.query;

  try {
    let query = supabase.from("email_accounts").select("*");

    if (user_id) {
      // Check se l'utente è SuperAdmin per permettere la visione globale
      let isSuperAdmin = false;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role_id, role:roles(name)')
          .eq('id', user_id)
          .maybeSingle();

        const roleName = profile?.role?.name || profile?.role || '';
        isSuperAdmin = ['super_admin', 'superAdmin', 'SuperAdmin'].includes(roleName) || profile?.role_id === 1;
      } catch (profileErr) {
        console.warn('⚠️ Impossibile verificare profilo SuperAdmin in get.js:', profileErr?.message);
      }

      if (!isSuperAdmin) {
        query = query.eq("user_id", user_id);
      }
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error('❌ Supabase error in email-accounts/get:', error);
      throw error;
    }

    return res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error("💥 Errore API GET email-accounts:", err);
    return res.status(500).json({
      success: false,
      message: "Errore durante il recupero dei mittenti.",
      details: err.message,
    });
  }
}
