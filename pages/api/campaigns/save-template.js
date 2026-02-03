// pages/api/campaigns/save-template.js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id, name, html } = req.body;

  if (!user_id || !html) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { data, error } = await supabase
    .from("campaign_templates")
    .insert([{ user_id, name, html }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ success: true, data });
}
