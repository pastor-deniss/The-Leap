import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for links in Supabase auth emails (sign-up confirmation and
// password reset). Accepts
// both link shapes Supabase can send:
//  - ?code=…            the default {{ .ConfirmationURL }} template (PKCE);
//                       only works in the browser that requested the email
//  - ?token_hash=…&type= a custom template; works in any browser, which
//                       matters when the mail app opens links elsewhere
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/";
  // Only same-site paths — never bounce to an attacker-supplied URL.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) {
    return NextResponse.redirect(new URL(next, origin));
  }

  // A failed sign-up confirmation is usually a second tap on a link that
  // already worked — e.g. the mail app first opened it in another browser
  // (Gmail on iPhone hands links to Chrome/the Google app), confirming the
  // account there. The account is fine, so point at sign-in, not at a
  // password reset.
  const failure =
    type === "recovery" ? "/forgot-password?error=link" : "/sign-in?error=confirm-link";
  return NextResponse.redirect(new URL(failure, origin));
}
