import { Resend } from "resend";

// Crea una nuova istanza di Resend
const resend = new Resend(process.env.RESEND_API_KEY);  // Usa la tua API key di Resend

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito, usa POST." });
  }

  const { to, subject, html, cc, bcc, attachments } = req.body;

  // Verifica che siano presenti i dati necessari
  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Dati insufficienti. Inserisci destinatario, oggetto e corpo del messaggio." });
  }

  // Prepara il payload per inviare l'email
  const payload = {
    from: "noreply@tuaazienda.it",  // Email del mittente
    to,  // Lista dei destinatari
    subject,  // Oggetto dell'email
    html,  // Corpo HTML dell'email
    cc: cc ? cc.split(",").map(email => email.trim()) : [],  // CC (opzionale)
    bcc: bcc ? bcc.split(",").map(email => email.trim()) : [],  // BCC (opzionale)
    attachments: attachments || [],  // Allegati (opzionali)
  };

  try {
    // Invia l'email utilizzando Resend API
    const result = await resend.emails.send(payload);

    // Restituisci il risultato
    return res.status(200).json({ success: true, message: "Email inviata correttamente!", data: result });
  } catch (error) {
    // Gestisci l'errore se l'invio fallisce
    console.error("Errore durante l'invio dell'email:", error);
    return res.status(500).json({ error: error.message || "Errore sconosciuto nell'invio dell'email." });
  }
}
