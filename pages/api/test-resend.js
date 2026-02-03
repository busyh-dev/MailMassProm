// pages/api/test-resend.js
export default async function handler(req, res) {
    const { apiKey } = req.body;
  
    if (!apiKey) {
      return res.status(400).json({ success: false, message: "Chiave API mancante" });
    }
  
    try {
      const response = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
  
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ success: false, message: "Chiave API non valida o errore Resend" });
      }
  
      const data = await response.json();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Errore Resend:", err);
      return res.status(500).json({ success: false, message: "Errore di rete o CORS" });
    }
  }
  