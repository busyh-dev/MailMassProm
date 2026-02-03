import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role Key
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Errore conferma email:', error);
    res.status(500).json({ error: error.message });
  }
}