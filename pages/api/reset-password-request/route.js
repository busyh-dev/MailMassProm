import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email mancante" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";

    const { data: userList, error: userErr } =
      await supabaseAdmin.auth.admin.listUsers();

    if (userErr) {
      console.error("Errore listUsers:", userErr);
      return NextResponse.json(
        { error: "Errore nel recupero utenti" },
        { status: 500 }
      );
    }

    const user = userList.users?.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: "Nessun account associato a questa email" },
        { status: 404 }
      );
    }

    // RATE LIMIT
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
        return NextResponse.json(
          { error: "Hai già richiesto un reset. Attendi 2 minuti." },
          { status: 429 }
        );
      }
    }

    // REDIRECT
    const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`;

    const { error: resetErr } =
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

    // LOG
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
      return NextResponse.json(
        { error: "Errore durante l'invio dell'email di reset" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Errore generale reset-password-request:", err);
    return NextResponse.json(
      { error: "Errore interno durante la richiesta di reset" },
      { status: 500 }
    );
  }
}
