// pages/api/contacts/[action].js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // ✅ Sposta i log QUI dentro
  console.log("📥 API contatti chiamata!");
  console.log("➡️ action:", req.query.action);
  console.log("➡️ method:", req.method);
  console.log("➡️ body:", req.body);

  const { action } = req.query;
  const { user_id } = req.body || req.query;

  try {
    // ✅ GET - Elenco contatti
    if (req.method === "GET" && action === "get") {
      if (!user_id)
        return res.status(400).json({ success: false, message: "user_id mancante" });

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    // ... (le altre azioni rimangono uguali)
  } catch (err) {
    console.error("💥 Errore API contatti:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
