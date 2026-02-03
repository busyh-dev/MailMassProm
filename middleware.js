// middleware.js
import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Nessun utente → login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Controllo ruolo nel DB
  const { data: profile } = await supabase
    .from("employees")
    .select("role")
    .eq("email", session.user.email)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
