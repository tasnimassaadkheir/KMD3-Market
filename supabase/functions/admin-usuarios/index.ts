// Supabase Edge Function "admin-usuarios": creates, cancels and reactivates logins and sets
// temporary passwords, from the app's Administração screen. The logic is in logica.mjs
// (plain JavaScript, tested with Node in tests/unit/admin-usuarios.test.js).
//
// Secrets this function uses (Supabase → Edge Functions → Secrets):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY  → provided by Supabase automatically
//     (the service key stays inside Supabase: it is never sent to the browser)
//   RESEND_API_KEY  → key from resend.com, to e-mail the password (optional: without it, no e-mail)
//   EMAIL_FROM      → sender, e.g. "KMD3 Market <acesso@seudominio.com.br>" (a domain verified on Resend)
//   SITE_URL        → the app's address, e.g. https://kmd3market.vercel.app (goes in the e-mail)
import { createClient } from "npm:@supabase/supabase-js@2";
import { tratar } from "./logica.mjs";

const URL_ = Deno.env.get("SUPABASE_URL")!;
// legacy names first, then the new key names (projects using publishable / secret keys)
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY")!;

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

Deno.serve((req) => tratar(req, {
  admin,
  // the caller's own client: every database check runs with THEIR permissions
  clienteDoUsuario: (authorization: string) => createClient(URL_, ANON, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  }),
  env: {
    RESEND_API_KEY: Deno.env.get("RESEND_API_KEY") || "",
    EMAIL_FROM: Deno.env.get("EMAIL_FROM") || "",
    SITE_URL: Deno.env.get("SITE_URL") || "",
  },
  fetch,
}));
