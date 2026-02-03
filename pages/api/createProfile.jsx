import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // chiave server privata
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { id, email, name } = req.body;

  const { error } = await supabase.from("profiles").insert([
    { id, email, name, status: "pending" },
  ]);

  if (error) {
    console.error("Errore inserimento profilo:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: "Profilo creato correttamente" });
}
