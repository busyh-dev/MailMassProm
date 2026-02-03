import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // attenzione: solo server-side
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Metodo non consentito" });
  }

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ success: false, message: "user_id mancante" });
  }

  try {
    const { data, error } = await supabase
      .from("tags")
      .select("id, value, label, color")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("💥 Errore caricamento tag:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
