// pages/api/resend/test.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "Chiave API mancante" });
    }

    // 🔍 Test connessione Resend — tentiamo di leggere i domini associati
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    // Se la chiave non è valida o la connessione fallisce
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Errore test Resend:", errorText);
      return res
        .status(401)
        .json({ success: false, error: "Chiave API non valida o dominio non autorizzato." });
    }

    const data = await response.json();

    // ✅ Se arriviamo qui, la chiave è valida
    return res.status(200).json({
      success: true,
      message: "Connessione a Resend riuscita.",
      domains: data.data || [],
    });
  } catch (err) {
    console.error("❌ Errore server durante il test:", err);
    return res.status(500).json({
      success: false,
      error: "Errore interno durante il test connessione.",
    });
  }
}


  