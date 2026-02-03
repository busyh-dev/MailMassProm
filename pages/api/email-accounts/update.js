import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Metodo non consentito. Usa POST.",
    });
  }

  try {
    const { user_id, account } = req.body;

    if (!user_id || !account?.email) {
      return res.status(400).json({
        success: false,
        message: "❌ Parametri mancanti: user_id o account.email non specificati.",
      });
    }

    console.log("🟢 API update.js chiamata!");
    console.log("Body ricevuto:", req.body);

    // 🔍 Prima controlla se l'account esiste
    const { data: existing, error: checkError } = await supabase
      .from("email_accounts")
      .select('*')
      .eq("user_id", user_id)
      .eq("email", account.email)
      .single();

    console.log("🔍 Account esistente:", existing);
    console.log("🔍 Errore check:", checkError);

    // Se l'account NON esiste, crealo
    if (!existing || checkError?.code === 'PGRST116') {
      console.log("➕ Account non trovato, creazione nuovo...");

      const newAccountData = {
        id: crypto.randomUUID(),
        user_id: user_id,
        name: account.name,
        email: account.email,
        is_default: !!account.is_default,
        verified: !!account.verified,
        dkim_status: account.dkimStatus || account.dkim_status || "unknown",
        spf_status: account.spfStatus || account.spf_status || "unknown",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (account.smtp) {
        newAccountData.smtp = account.smtp;
      }

      if (account.provider) {
        newAccountData.provider = account.provider;
      }

      const { data: newAccount, error: insertError } = await supabase
        .from("email_accounts")
        .insert(newAccountData)
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(200).json({
        success: true,
        message: "✅ Nuovo mittente creato con successo.",
        data: newAccount,
      });
    }

    // Se l'account esiste, aggiornalo
    console.log("✏️ Account trovato, aggiornamento...");

    const updateData = {
      name: account.name || existing.name,
      verified: !!account.verified,
      dkim_status: account.dkimStatus || account.dkim_status || existing.dkim_status,
      spf_status: account.spfStatus || account.spf_status || existing.spf_status,
      is_default: !!account.is_default,
      updated_at: new Date().toISOString(),
    };

    if (account.smtp !== undefined) {
      updateData.smtp = account.smtp;
    }

    if (account.provider !== undefined) {
      updateData.provider = account.provider;
    }

    console.log("📤 Dati da aggiornare:", updateData);

    const { data, error } = await supabase
      .from("email_accounts")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single();

    console.log("📥 Risultato update:", { data, error });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "✅ Mittente aggiornato correttamente.",
      data: data,
    });

  } catch (err) {
    console.error("💥 Errore durante l'aggiornamento del mittente:", err);
    return res.status(500).json({
      success: false,
      message: "Errore durante l'aggiornamento del mittente.",
      details: err.message,
    });
  }
}