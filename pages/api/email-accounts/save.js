// pages/api/email-accounts/save.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Metodo non consentito" });
  }

  try {
    const { accounts, user_id } = req.body;

    console.log("🟢 API save.js chiamata!");
    console.log("📥 user_id:", user_id);
    console.log("📥 accounts:", accounts);

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        message: "user_id mancante" 
      });
    }

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Nessun account da salvare" 
      });
    }

    if (!accounts || !Array.isArray(accounts)) {
      return res.status(400).json({ 
        success: false, 
        message: "Dati mittenti mancanti o non validi" 
      });
    }

    console.log("🟢 API save.js chiamata!");
    console.log("Accounts ricevuti:", accounts.length);

    // ✅ Prepara i dati per l'upsert
    const accountsToSave = accounts.map(acc => {
      const accountData = {
        id: acc.id || undefined, // Se esiste usa l'ID, altrimenti Supabase ne genera uno
        user_id,
        name: acc.name,
        email: acc.email,
        is_default: !!acc.is_default,
        verified: !!acc.verified,
        dkim_status: acc.dkimStatus || acc.dkim_status || "unknown",
        spf_status: acc.spfStatus || acc.spf_status || "unknown",
        updated_at: new Date().toISOString(),
      };

       // Aggiungi id solo se esiste (per update)
       if (acc.id) {
        accountData.id = acc.id;
      }

      // Aggiungi created_at solo per nuovi record
      if (acc.id) accountData.id = acc.id;
  if (!acc.id) accountData.created_at = new Date().toISOString();
  if (acc.smtp && typeof acc.smtp === 'object') accountData.smtp = acc.smtp;
  if (acc.provider) accountData.provider = acc.provider;
  
  // ✅ AGGIUNGI - salva api_key
  if (acc.api_key) accountData.api_key = acc.api_key;

      return accountData;
    });

    console.log("📤 Dati da salvare:", JSON.stringify(accountsToSave, null, 2));

    // 🔄 Upsert nel database
    const { data, error } = await supabase
      .from("email_accounts")
      .upsert(accountsToSave, {
        // onConflict: "user_id,email",
        onConflict: 'id', // 🔥 Cambiato da "user_id,email" a solo "id"
        ignoreDuplicates: false,
      })
      .select();

      console.log("📥 Risultato upsert data:", data);
      console.log("📥 Risultato upsert error:", error);

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      message: "✅ Mittenti salvati con successo",
      data 
    });
  } catch (err) {
    console.error("❌ Errore salvataggio mittenti:", err);
    return res.status(500).json({
      success: false,
      message: "Errore durante il salvataggio nel database.",
      error: err.message,
      details: err.hint || err.details || "Nessun dettaglio disponibile"
    });
  }
}