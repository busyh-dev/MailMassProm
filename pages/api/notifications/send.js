import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { to, subject, html, apiKey } = req.body;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'info@promotergroup.eu', // ← cambia con il tuo dominio verificato
      to,
      subject,
      html,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}