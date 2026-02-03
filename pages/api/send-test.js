import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });

  const { to, subject, html } = req.body;

  try {
    const data = await resend.emails.send({
      from: "Test Template <noreply@tuaazienda.it>",
      to,
      subject,
      html,
    });

    res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error("Errore Resend:", error);
    res.status(500).json({ error: error.message || "Errore durante l'invio" });
  }
}

