// pages/api/campaigns/save-block.js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id, name, description, html } = req.body;

  if (!user_id || !name || !html) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { error } = await supabase
    .from("campaign_blocks")
    .insert([{ user_id, name, description, html }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
