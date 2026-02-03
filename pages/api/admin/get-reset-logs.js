import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { email, success, startDate, endDate } = req.body;

  let query = supabaseAdmin
    .from("password_reset_logs")
    .select("*")
    .order("requested_at", { ascending: false });

  if (email) query = query.ilike("email", `%${email}%`);
  if (success !== undefined) query = query.eq("success", success);
  if (startDate) query = query.gte("requested_at", startDate);
  if (endDate) query = query.lte("requested_at", endDate);

  const { data, error } = await query;

  if (error) {
    console.error("Errore logs:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ logs: data });
}
