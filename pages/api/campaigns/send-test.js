import { Resend } from "resend";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { to, subject, html } = req.body;

  try {
    await resend.emails.send({
      from: "Campaign Test <no-reply@mailmass.it>",
      to,
      subject: subject || "Test Email",
      html,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("❌ Error sending test email", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
