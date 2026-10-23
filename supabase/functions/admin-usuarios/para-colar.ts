// @ts-nocheck
// GERADO por scripts/funcao-colar.mjs — não edite aqui; edite index.ts e logica.mjs.
// Para colar no editor do Supabase: Edge Functions → Deploy a new function → Via editor → nome: admin-usuarios

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

const URL_ = Deno.env.get("SUPABASE_URL")!;
// legacy names first, then the new key names (projects using publishable / secret keys)
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY")!;

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

// =============================================================================
// admin-usuarios — the logic of the Edge Function (plain JavaScript, no Deno APIs,
// so the same file runs in Supabase (Deno) and in the Node tests).
// -----------------------------------------------------------------------------
// Creating, banning and changing the password of a LOGIN needs Supabase's secret
// (service role) key, which must never reach the browser. So the browser calls this
// function with the person's own login token; the function:
//   1. checks, AS THAT PERSON (their token), that they are a super-admin, or an admin
//      of the organization in question (the same database functions the admin screen uses:
//      sou_super, sou_admin, admin_organizacoes, admin_membros);
//   2. does the login part with the secret key (auth.admin.*);
//   3. does the membership part AS THAT PERSON (adicionar_membro, admin_definir_acesso),
//      so the database's own rules still apply;
//   4. e-mails the temporary password (Resend), when configured.
//
// Actions (POST body {acao, ...}):
//   criar      {org, nome, email, papel, senha, enviarEmail}  new login + member of the org
//                (if the e-mail already has a login, it is only added to the org; its password is kept)
//   cancelar   {org, user}   blocks the login (ban) and marks the member inactive
//   reativar   {org, user}   unblocks and marks active again
//   nova_senha {org, user, senha, enviarEmail}   sets a new temporary password
// The new password must be changed by the person at the next login (user_metadata.trocar_senha).
// =============================================================================

const PAPEIS = ["admin", "editor", "vendedor", "leitor"];
const SENHA_MINIMA = 8;
const BANIDO = "876000h";            // ~100 years = cancelled until someone reactivates

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function resposta(status, corpo){
  return new Response(JSON.stringify(corpo), {status, headers: {...CORS, "Content-Type": "application/json"}});
}
// An error the person can read (in Portuguese) + a short code for the app.
class Falha extends Error {
  constructor(status, codigo, mensagem){ super(mensagem); this.status = status; this.codigo = codigo; }
}
const ehEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || ""));
function escaparHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// Calls a database function as the person; turns an error into a Falha.
async function rpc(cliente, nome, args){
  const {data, error} = await cliente.rpc(nome, args || {});
  if(error) throw new Falha(400, "banco", error.message || "Erro no banco de dados");
  return data;
}

// Is the caller allowed to manage this organization? Returns {org, superAdmin}.
async function autorizar(cliente, orgId){
  const [sup, adm] = await Promise.all([cliente.rpc("sou_super"), cliente.rpc("sou_admin")]);
  const superAdmin = !!(sup && sup.data), admin = !!(adm && adm.data);
  if(!superAdmin && !admin) throw new Falha(403, "sem_permissao", "Só administradores podem gerenciar usuários.");
  const orgs = await rpc(cliente, "admin_organizacoes");
  const org = (orgs || []).find(o => String(o.id) === String(orgId));
  if(!org) throw new Falha(403, "sem_permissao", "Você não administra esta organização.");
  // extra lock: an admin who isn't super-admin only manages the organization they are in right now
  if(!superAdmin && org.ativa === false) throw new Falha(403, "sem_permissao", "Você não administra esta organização.");
  return {org, superAdmin};
}
// The member being changed, from the organization's member list (as the caller sees it).
async function membroDaOrg(cliente, org, userId){
  const ms = await rpc(cliente, "admin_membros", {p_org: org.id});
  const m = (ms || []).find(x => String(x.user_id) === String(userId));
  if(!m) throw new Falha(404, "nao_encontrado", "Essa pessoa não é membro desta organização.");
  return m;
}
function validarSenha(senha){
  if(typeof senha !== "string" || senha.length < SENHA_MINIMA)
    throw new Falha(400, "senha_curta", "A senha precisa ter pelo menos " + SENHA_MINIMA + " caracteres.");
}
// Saves role + permissions, changing only "ativo".
async function definirAtivo(cliente, m, ativo){
  await rpc(cliente, "admin_definir_acesso", {p_user: m.user_id, p_papel: m.papel, p_ativo: ativo,
    p_ver: !!m.ver_todos, p_criar: !!m.pode_criar, p_editar: !!m.pode_editar, p_excluir: !!m.pode_excluir});
}

// ---- e-mail with the temporary password ----
function montarEmail({nome, email, senha, org, site, nova}){
  const ola = nome ? "Olá, " + nome + "!" : "Olá!";
  const intro = nova
    ? "Sua senha do KMD3 Market (" + org + ") foi redefinida por um administrador."
    : "Você recebeu acesso ao KMD3 Market, na organização " + org + ".";
  const texto = [ola, "", intro, "", "Endereço: " + site, "E-mail: " + email, "Senha temporária: " + senha, "",
    "No primeiro acesso o sistema vai pedir para você criar uma senha nova, só sua.",
    "Se você não esperava este e-mail, pode ignorá-lo."].join("\n");
  const e = escaparHtml;
  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1d2b2f;line-height:1.5;max-width:520px">'+
    '<p>'+e(ola)+'</p><p>'+e(intro)+'</p>'+
    '<table style="border-collapse:collapse;margin:14px 0">'+
      '<tr><td style="padding:4px 12px 4px 0;color:#5b6b70">Endereço</td><td><a href="'+e(site)+'">'+e(site)+'</a></td></tr>'+
      '<tr><td style="padding:4px 12px 4px 0;color:#5b6b70">E-mail</td><td>'+e(email)+'</td></tr>'+
      '<tr><td style="padding:4px 12px 4px 0;color:#5b6b70">Senha temporária</td><td><b style="font-family:monospace;font-size:16px">'+e(senha)+'</b></td></tr>'+
    '</table>'+
    '<p>No primeiro acesso o sistema vai pedir para você criar uma senha nova, só sua.</p>'+
    '<p style="color:#5b6b70;font-size:13px">Se você não esperava este e-mail, pode ignorá-lo.</p></div>';
  return {assunto: nova ? "Sua nova senha do KMD3 Market" : "Seu acesso ao KMD3 Market", texto, html};
}
// Sends through Resend (https://resend.com). Returns {enviado, motivo}.
async function enviarEmail(env, fetchFn, para, msg){
  if(!env.RESEND_API_KEY || !env.EMAIL_FROM) return {enviado: false, motivo: "sem_config"};
  try{
    const r = await fetchFn("https://api.resend.com/emails", {
      method: "POST",
      headers: {"Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json"},
      body: JSON.stringify({from: env.EMAIL_FROM, to: [para], subject: msg.assunto, html: msg.html, text: msg.texto}),
    });
    if(!r.ok) return {enviado: false, motivo: "erro_envio", detalhe: (await r.text().catch(() => "")).slice(0, 300)};
    return {enviado: true};
  }catch(e){
    return {enviado: false, motivo: "erro_envio", detalhe: String(e && e.message || e)};
  }
}

// ---- the actions ----
async function criar(cliente, admin, corpo, ctx){
  const {org} = await autorizar(cliente, corpo.org);
  const nome = String(corpo.nome || "").trim(), email = String(corpo.email || "").trim().toLowerCase();
  const papel = String(corpo.papel || "");
  if(!nome) throw new Falha(400, "sem_nome", "Escreva o nome da pessoa.");
  if(!ehEmail(email)) throw new Falha(400, "email_invalido", "E-mail inválido.");
  if(!PAPEIS.includes(papel)) throw new Falha(400, "papel_invalido", "Papel inválido.");
  validarSenha(corpo.senha);

  let criadoId = null, jaExistia = false;
  const {data, error} = await admin.auth.admin.createUser({
    email, password: corpo.senha, email_confirm: true,
    user_metadata: {nome, org_id: org.id, trocar_senha: true},
  });
  if(error){
    const msg = String(error.message || "");
    if(error.code === "email_exists" || /already (been )?registered|already exists/i.test(msg)) jaExistia = true;
    else throw new Falha(400, "criar_login", "Não foi possível criar o login: " + msg);
  } else criadoId = data && data.user && data.user.id;

  // membership, as the caller (the database checks they're allowed)
  const {error: erroMembro} = await cliente.rpc("adicionar_membro", {p_email: email, p_papel: papel, p_org: org.nome});
  if(erroMembro){
    if(criadoId) await admin.auth.admin.deleteUser(criadoId).catch(() => {});   // don't leave a login with no organization
    throw new Falha(400, "membro", "O login não foi adicionado à organização: " + erroMembro.message);
  }
  let email_ = {enviado: false, motivo: jaExistia ? "ja_existia" : "nao_pedido"};
  if(!jaExistia && corpo.enviarEmail !== false)
    email_ = await enviarEmail(ctx.env, ctx.fetch, email, montarEmail({nome, email, senha: corpo.senha, org: org.nome, site: ctx.env.SITE_URL || ""}));
  return {ok: true, jaExistia, userId: criadoId, emailEnviado: email_.enviado, motivoEmail: email_.motivo || null};
}

async function cancelarOuReativar(cliente, admin, corpo, ativo, quem){
  const {org, superAdmin} = await autorizar(cliente, corpo.org);
  const m = await membroDaOrg(cliente, org, corpo.user);
  if(String(m.user_id) === String(quem)) throw new Falha(400, "voce_mesmo", "Você não pode cancelar o seu próprio acesso.");
  if(m.papel === "admin" && !superAdmin) throw new Falha(403, "sem_permissao", "Só o super-admin pode cancelar ou reativar um administrador.");
  const {error} = await admin.auth.admin.updateUserById(m.user_id, {ban_duration: ativo ? "none" : BANIDO});
  if(error) throw new Falha(400, "login", "Não foi possível " + (ativo ? "reativar" : "bloquear") + " o login: " + error.message);
  await definirAtivo(cliente, m, ativo);
  return {ok: true};
}

async function novaSenha(cliente, admin, corpo, ctx){
  const {org, superAdmin} = await autorizar(cliente, corpo.org);
  const m = await membroDaOrg(cliente, org, corpo.user);
  if(m.papel === "admin" && !superAdmin && String(m.user_id) !== String(ctx.quem))
    throw new Falha(403, "sem_permissao", "Só o super-admin pode trocar a senha de outro administrador.");
  validarSenha(corpo.senha);
  const atual = await admin.auth.admin.getUserById(m.user_id);
  const meta = (atual && atual.data && atual.data.user && atual.data.user.user_metadata) || {};
  const {error} = await admin.auth.admin.updateUserById(m.user_id, {password: corpo.senha, user_metadata: {...meta, trocar_senha: true}});
  if(error) throw new Falha(400, "login", "Não foi possível trocar a senha: " + error.message);
  let email_ = {enviado: false, motivo: "nao_pedido"};
  if(corpo.enviarEmail !== false)
    email_ = await enviarEmail(ctx.env, ctx.fetch, m.email,
      montarEmail({nome: meta.nome || m.usuario || "", email: m.email, senha: corpo.senha, org: org.nome, site: ctx.env.SITE_URL || "", nova: true}));
  return {ok: true, emailEnviado: email_.enviado, motivoEmail: email_.motivo || null};
}

// deps = {clienteDoUsuario(authorizationHeader) -> supabase client as the caller,
//         admin -> supabase client with the secret key, env, fetch}
async function tratar(req, deps){
  if(req.method === "OPTIONS") return new Response("ok", {headers: CORS});
  if(req.method !== "POST") return resposta(405, {ok: false, codigo: "metodo", erro: "Use POST."});
  try{
    const auth = req.headers.get("Authorization") || "";
    if(!/^Bearer\s+\S+/.test(auth)) throw new Falha(401, "sem_login", "Faça login de novo.");
    const cliente = deps.clienteDoUsuario(auth);
    const {data: eu, error: erroEu} = await cliente.auth.getUser(auth.replace(/^Bearer\s+/, ""));
    if(erroEu || !eu || !eu.user) throw new Falha(401, "sem_login", "Sua sessão expirou. Faça login de novo.");
    let corpo;
    try{ corpo = await req.json(); }catch(e){ throw new Falha(400, "corpo", "Pedido inválido."); }
    const ctx = {env: deps.env || {}, fetch: deps.fetch || fetch, quem: eu.user.id};
    let r;
    switch(corpo && corpo.acao){
      case "criar":      r = await criar(cliente, deps.admin, corpo, ctx); break;
      case "cancelar":   r = await cancelarOuReativar(cliente, deps.admin, corpo, false, ctx.quem); break;
      case "reativar":   r = await cancelarOuReativar(cliente, deps.admin, corpo, true, ctx.quem); break;
      case "nova_senha": r = await novaSenha(cliente, deps.admin, corpo, ctx); break;
      default: throw new Falha(400, "acao", "Ação desconhecida.");
    }
    return resposta(200, r);
  }catch(e){
    if(e instanceof Falha) return resposta(e.status, {ok: false, codigo: e.codigo, erro: e.message});
    return resposta(500, {ok: false, codigo: "interno", erro: "Erro inesperado: " + String(e && e.message || e)});
  }
}

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
