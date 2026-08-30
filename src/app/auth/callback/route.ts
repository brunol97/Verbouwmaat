import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Auth callback handler voor OAuth en Magic Link login.
 *
 * BELANGRIJK: Supabase Dashboard → Authentication → URL Configuration
 * moet de Vercel URL(s) bevatten als redirect URL:
 *   - https://verbouwmaat-xxx.vercel.app/auth/callback
 *   - https://localhost:3000/auth/callback (voor lokaal)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/projecten";

  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  console.log("[auth/callback] Received callback at:", request.url);
  console.log("[auth/callback] Code present:", !!code);

  if (!code) {
    console.error("[auth/callback] No code in URL — magic link may have expired or redirect URL mismatch");
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Geen auth code ontvangen. De link is mogelijk verlopen of de redirect URL staat niet goed in Supabase ingesteld.")}`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Exchange error:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  if (data.session) {
    console.log("[auth/callback] Session created for:", data.session.user.email);
    return NextResponse.redirect(`${origin}${next}`);
  }

  console.error("[auth/callback] No session created after exchange");
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Sessie kon niet worden aangemaakt. Probeer opnieuw in te loggen.")}`
  );
}
