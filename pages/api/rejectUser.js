import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send(`
      <h2 style="color:red;">❌ Errore</h2>
      <p>Email mancante nella richiesta.</p>
    `);
  }

  // ✅ Aggiorna lo stato del profilo in Supabase
  const { error } = await supabase
    .from("profiles")
    .update({ status: "rejected" })
    .eq("email", email);

  if (error) {
    console.error("Errore aggiornamento stato:", error);
    return res.status(500).send(`
      <h2 style="color:red;">❌ Errore interno</h2>
      <p>Impossibile rifiutare l'account per <strong>${email}</strong>.</p>
    `);
  }

  // ✅ Pagina di risposta HTML elegante
  return res.status(200).send(`
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
      <h2 style="color:#ef4444;">❌ Account rifiutato</h2>
      <p>L'utente <strong>${email}</strong> è stato rifiutato.</p>
      <p style="margin-top: 20px; color: #555;">
        L'account non potrà accedere alla piattaforma MailMassProm.
      </p>
    </div>
  `);
}
