// pages/api/email-accounts/get.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://khvtqienmkobtadtmgsg.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnRxaWVubWtvYnRhZHRtZ3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTUyMzUsImV4cCI6MjA5Nzk3MTIzNX0.0f-lHX73wiSjwQJe2Pe_cIx1GUWyDzIFmpYr41Jf1NY";

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Metodo non consentito." });
  }

  const { user_id } = req.query;

  try {
    let query = supabase.from("email_accounts").select("*");

    if (user_id) {
      // Check se l'utente è SuperAdmin per permettere la visione globale
      const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, role:roles(name)')
        .eq('user_id', user_id)
        .maybeSingle();

      const roleName = profile?.role?.name || profile?.role || '';
      const isSuperAdmin = ['super_admin', 'superAdmin', 'SuperAdmin'].includes(roleName) || profile?.role_id === 1;

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
