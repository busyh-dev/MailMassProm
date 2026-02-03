// pages/api/campaigns/get-templates.js

import { getDatabaseConnection } from "../../../lib/db"; // Importa la connessione DB

export default async function handler(req, res) {
      const { user_id } = req.query;
    
      const { data, error } = await supabase
        .from("campaign_templates") // 💡 CAMBIA "campaign_blocks" con "campaign_templates" (o il nome corretto)
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });
    
      if (error) return res.status(400).json({ success: false, error });
    
      // Assicurati che il payload corrisponda a quello previsto dal frontend: { templates: [...] }
      // Il frontend in DragDropEmailEditor.jsx si aspetta { templates: data }
      res.status(200).json({ success: true, templates: data }); // 💡 AGGIUNGI templates:
    }