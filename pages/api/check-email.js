import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { email } = req.body;

  // Controlla se l'utente esiste
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) return res.status(500).json({ error: error.message });

  const userExists = data.users.find(u => u.email === email);

  if (!userExists) {
    return res.status(404).json({ error: "Email non trovata" });
  }

  return res.status(200).json({ ok: true });
}
