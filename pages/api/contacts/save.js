import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ usare solo lato server!
);


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Metodo non consentito. Usa POST.",
    });
  }

  try {
    const { user_id, contacts } = req.body;

    if (!user_id || !contacts || !Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        message: "❌ Parametri mancanti o formato non valido. Attesi user_id e contacts[].",
      });
    }

    // 🔄 Prepara i dati da inserire/aggiornare
    const preparedContacts = contacts.map((c) => ({
      id: c.id || crypto.randomUUID(),
      user_id,
      name: c.name.trim(),
      email: c.email.trim(),
      status: c.status || "active",
      tags: Array.isArray(c.tags) ? c.tags : [],
      created_at: c.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // 🔁 upsert (inserisce nuovi contatti o aggiorna quelli già presenti)
    const { data, error } = await supabase
      .from("contacts")
      .upsert(preparedContacts, { onConflict: ["email", "user_id"] })
      .select();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Contatti salvati/aggiornati con successo.",
      data,
    });
  } catch (err) {
    console.error("💥 Errore salvataggio contatti:", err);
    return res.status(500).json({
      success: false,
      message: "Errore durante il salvataggio dei contatti.",
      details: err.message,
    });
  }
}
