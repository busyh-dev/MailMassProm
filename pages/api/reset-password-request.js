// pages/api/reset-password-request.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email mancante" });
  }

  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown";
    const ua = req.headers["user-agent"] || "unknown";

    // 1️⃣ Recupero utente usando listUsers (compatibile Supabase v1)
    const { data: userList, error: userErr } =
      await supabaseAdmin.auth.admin.listUsers();

    if (userErr) {
      console.error("Errore listUsers:", userErr);
      return res.status(500).json({ error: "Errore nel recupero utenti" });
    }

    const user = userList.users.find((u) => u.email === email);

    if (!user) {
      return res.status(404).json({
        error: "Nessun account associato a questa email",
      });
    }

    // 2️⃣ Rate limit
    const { data: logs } = await supabaseAdmin
      .from("password_reset_logs")
      .select("*")
      .eq("email", email)
      .order("requested_at", { ascending: false })
      .limit(1);

    if (logs?.length) {
      const last = logs[0];
      const diff =
        (Date.now() - new Date(last.requested_at).getTime()) / 1000;
      if (diff < 120) {
        return res.status(429).json({
          error: "Hai già richiesto un reset. Attendi 2 minuti.",
        });
      }
    }

    // 3️⃣ Redirect sicuro
    const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`;

    const { error: resetErr } =
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

    // 4️⃣ Log
    await supabaseAdmin.from("password_reset_logs").insert({
      email,
      ip_address: ip,
      user_agent: ua,
      success: !resetErr,
      internal_user_id: user.id,
      internal_role: user.user_metadata?.role || null,
    });

    if (resetErr) {
      console.error("Errore invio email reset:", resetErr);
      return res
        .status(500)
        .json({ error: "Errore durante l'invio dell'email di reset" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Errore generale reset-password-request:", err);
    return res
      .status(500)
      .json({ error: "Errore interno durante la richiesta di reset" });
  }
}
