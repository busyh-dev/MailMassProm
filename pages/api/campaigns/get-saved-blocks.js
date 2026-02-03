import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  const { user_id } = req.query;

  const { data, error } = await supabase
    .from("campaign_blocks")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ success: false, error });

  res.status(200).json({ success: true, data });
}
