// pages/api/email-accounts/get.js
import { createClient } from "@supabase/supabase-js";
// const SUPABASE_URL = "https://qvgpbxjzvkbetxmmapfq.supabase.co"; // ← Inserisci il tuo URL
// const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2Z3BieGp6dmtiZXR4bW1hcGZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI4MTk4NiwiZXhwIjoyMDczODU3OTg2fQ.QYNA4jbr57MTiTyAXOhE5IpIsp4iu9J9Z1Z68H4tzBQ"; // ← Inserisci la tua service_role key

// const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ← CORRETTO: _ROLE_KEY

 
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Metodo non consentito." });
  }

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ success: false, message: "Parametro 'user_id' mancante." });
  }

  try {
    console.log('📡 Fetching accounts for user:', user_id); // ← Log utile

    const { data, error } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Accounts found:', data?.length || 0); // ← Log utile

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("💥 Errore API GET:", err);
    return res.status(500).json({
      success: false,
      message: "Errore durante il recupero dei mittenti.",
      details: err.message,
    });
  }
}
