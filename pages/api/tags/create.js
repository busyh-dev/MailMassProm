import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ solo lato server
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Metodo non consentito. Usa POST.",
    });
  }

  try {
    const { user_id, label, value, color } = req.body;

    if (!user_id || !label || !value) {
      return res.status(400).json({
        success: false,
        message: "❌ Parametri mancanti: user_id, label o value obbligatori.",
      });
    }

    // 🔄 Controlla se esiste già un tag con lo stesso valore per l'utente
    const { data: existing, error: checkError } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user_id)
      .eq("value", value)
      .single();

    if (checkError && checkError.code !== "PGRST116") throw checkError;

    // 🔥 Se esiste già, restituisci il tag esistente (non errore)
    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyExists: true,
        message: "ℹ️ Il tag esiste già",
        data: existing,
      });
    }

    // ✅ Inserisce il nuovo tag
    const { data, error } = await supabase
      .from("tags")
      .insert([
        {
          id: crypto.randomUUID(),
          user_id,
          label,
          value,
          color: color || "#3b82f6",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      alreadyExists: false,
      message: "✅ Tag creato con successo!",
      data,
    });
  } catch (err) {
    console.error("💥 Errore creazione tag:", err);
    return res.status(500).json({
      success: false,
      message: "Errore durante la creazione del tag.",
      details: err.message,
    });
  }
}