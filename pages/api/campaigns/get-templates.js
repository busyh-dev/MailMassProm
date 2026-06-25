// pages/api/campaigns/get-templates.js

import { getDatabaseConnection } from "../../../lib/db"; // Importa la connessione DB

export default async function handler(req, res) {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "User ID non fornito." });
  }

  try {
    const db = await getDatabaseConnection();
    const templates = await db
      .collection("templates")
      .find({ user_id })
      .toArray();

    res.status(200).json({ templates });
  } catch (error) {
    console.error("Errore recupero template:", error);
    res.status(500).json({ error: "Errore durante il recupero dei template." });
  }
}
