// pages/api/resend/verify.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Metodo non consentito" });
  }

  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ success: false, message: "Chiave API mancante" });
    }

    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || "Errore Resend",
        code: data.code || "RESEND_ERROR",
      });
    }

    return res.status(200).json({ success: true, data: data.data || [] });
  } catch (error) {
    console.error("💥 Errore API Resend:", error);
    return res.status(500).json({
      success: false,
      message: "Errore durante la comunicazione con Resend.",
      details: error.message,
    });
  }
}
