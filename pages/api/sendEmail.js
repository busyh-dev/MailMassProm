import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { userEmail, userName } = req.body;
  if (!userEmail) {
    return res.status(400).json({ error: "Email mancante" });
  }

  try {
    // ✅ 1. Genera link di conferma ufficiale Supabase
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: userEmail,
    });

    if (error) throw error;
    const confirmUrl = data?.properties?.action_link;
    // Genera il link personalizzato per l'approvazione dell'amministratore
    const approveUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/approveUser?email=${encodeURIComponent(userEmail)}`;    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // ✅ 2. Invia mail all’amministratore tramite Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, // Usa la tua chiave API di Resend
      },
      body: JSON.stringify({
        from: "promotergroupspa@gmail.com",
        to: "giuseppebusacca@promotergroup.eu",
        subject: "Nuova Registrazione Utente",
        html: `
          <h2>Nuova registrazione utente</h2>
          <p><strong>Nome:</strong> ${userName || "Non indicato"}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p style="margin-top:20px;">Azioni disponibili:</p>
          <p>
            <a href="${approveUrl}"
               style="background:#22c55e;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">
               ✅ Approva e conferma utente
            </a>
            &nbsp;&nbsp;
            <a href="${baseUrl}/api/rejectUser?email=${encodeURIComponent(userEmail)}"
               style="background:#ef4444;color:white;padding:10px 18px;border-radius:6px;
                      text-decoration:none;display:inline-block;">
               ❌ Rifiuta utente
            </a>
          </p>
           <p style="margin-top:30px;font-size:13px;color:#666;">
          Mail automatica inviata dal sistema di registrazione MailMassProm.
        </p>
        `,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Errore nell'invio dell'email tramite Resend");
    }

    return res.status(200).json({ message: "Email inviata correttamente" });
  } catch (err) {
    console.error("❌ Errore durante l'invio dell'email:", err);
    return res.status(500).json({ error: err.message || "Errore generico" });
  }
}
