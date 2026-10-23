// Unit tests: the Edge Function "admin-usuarios" (supabase/functions/admin-usuarios/logica.mjs).
// Runs the real logic with fake Supabase clients: one acting as the caller (their permissions)
// and one "admin" (the secret key). Nothing goes to the internet.
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

let L;
before(async () => { L = await import(path.join(__dirname, "..", "..", "supabase", "functions", "admin-usuarios", "logica.mjs")); });

const ORG = { id: "o1", nome: "KMD3 Market", ativa: true };
const OUTRA = { id: "o2", nome: "Cliente Novo", ativa: false };
const membro = (o) => ({ user_id: "u-karen", email: "karen@kmd3.com.br", usuario: "Karen", papel: "vendedor", ativo: true,
  ver_todos: false, pode_criar: true, pode_editar: true, pode_excluir: false, ...o });

// builds a scenario; returns {deps, chamadas}
function cenario({ superAdmin = false, admin = true, orgs = [ORG], membros = [membro()], usuarioExiste = false,
  erroMembro = null, eu = "u-tasnim", resend = true, resendOk = true } = {}) {
  const chamadas = { rpc: [], admin: [], email: [] };
  const cliente = {
    auth: { getUser: async (t) => (t === "bom" ? { data: { user: { id: eu } }, error: null } : { data: null, error: { message: "jwt" } }) },
    rpc: async (nome, args) => {
      chamadas.rpc.push([nome, args]);
      if (nome === "sou_super") return { data: superAdmin, error: null };
      if (nome === "sou_admin") return { data: admin || superAdmin, error: null };
      if (nome === "admin_organizacoes") return { data: orgs, error: null };
      if (nome === "admin_membros") return { data: membros, error: null };
      if (nome === "adicionar_membro") return { data: "ok", error: erroMembro };
      if (nome === "admin_definir_acesso") return { data: null, error: null };
      return { data: null, error: { message: "rpc desconhecida " + nome } };
    },
  };
  const adminCli = { auth: { admin: {
    createUser: async (o) => { chamadas.admin.push(["createUser", o]);
      return usuarioExiste ? { data: null, error: { code: "email_exists", message: "A user with this email address has already been registered" } }
                           : { data: { user: { id: "u-novo" } }, error: null }; },
    deleteUser: async (id) => { chamadas.admin.push(["deleteUser", id]); return { error: null }; },
    updateUserById: async (id, o) => { chamadas.admin.push(["updateUserById", id, o]); return { data: {}, error: null }; },
    getUserById: async (id) => ({ data: { user: { id, user_metadata: { nome: "Karen", org_id: "o1" } } }, error: null }),
  } } };
  const fetchFalso = async (url, o) => { chamadas.email.push({ url, ...JSON.parse(o.body), auth: o.headers.Authorization });
    return { ok: resendOk, text: async () => "bad from" }; };
  const deps = { clienteDoUsuario: () => cliente, admin: adminCli, fetch: fetchFalso,
    env: resend ? { RESEND_API_KEY: "re_x", EMAIL_FROM: "KMD3 <acesso@kmd3.com.br>", SITE_URL: "https://kmd3market.vercel.app" } : { SITE_URL: "https://x" } };
  return { deps, chamadas };
}
async function chamar(corpo, deps, token = "bom") {
  const req = new Request("https://f/admin-usuarios", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(corpo) });
  const r = await L.tratar(req, deps);
  return { status: r.status, corpo: await r.json(), headers: r.headers };
}
const NOVO = { acao: "criar", org: "o1", nome: "Bia Lima", email: " Bia@Cliente.com.br ", papel: "editor", senha: "Temp-1234" };

describe("admin-usuarios: creating a user", () => {
  test("creates a confirmed login with the typed password, asks for a new one on first login, adds to the org, e-mails it", async () => {
    const { deps, chamadas } = cenario();
    const r = await chamar(NOVO, deps);
    assert.equal(r.status, 200, JSON.stringify(r.corpo));
    assert.deepEqual(r.corpo, { ok: true, jaExistia: false, userId: "u-novo", emailEnviado: true, motivoEmail: null });
    const [, o] = chamadas.admin.find((c) => c[0] === "createUser");
    assert.equal(o.email, "bia@cliente.com.br", "trimmed, lowercase");
    assert.equal(o.password, "Temp-1234");
    assert.equal(o.email_confirm, true, "can log in right away");
    assert.deepEqual(o.user_metadata, { nome: "Bia Lima", org_id: "o1", trocar_senha: true });
    assert.deepEqual(chamadas.rpc.find((c) => c[0] === "adicionar_membro")[1], { p_email: "bia@cliente.com.br", p_papel: "editor", p_org: "KMD3 Market" });
    const m = chamadas.email[0];
    assert.equal(m.url, "https://api.resend.com/emails");
    assert.equal(m.auth, "Bearer re_x");
    assert.deepEqual(m.to, ["bia@cliente.com.br"]);
    assert.match(m.text, /Senha temporária: Temp-1234/);
    assert.match(m.text, /https:\/\/kmd3market\.vercel\.app/);
    assert.match(m.html, /Temp-1234/);
    assert.match(m.subject, /acesso/i);
  });
  test("e-mail not configured / not wanted / failed: the user is still created, and the app is told why", async () => {
    let r = await chamar(NOVO, cenario({ resend: false }).deps);
    assert.equal(r.corpo.ok, true); assert.equal(r.corpo.emailEnviado, false); assert.equal(r.corpo.motivoEmail, "sem_config");
    const c = cenario();
    r = await chamar({ ...NOVO, enviarEmail: false }, c.deps);
    assert.equal(r.corpo.motivoEmail, "nao_pedido"); assert.equal(c.chamadas.email.length, 0);
    r = await chamar(NOVO, cenario({ resendOk: false }).deps);
    assert.equal(r.corpo.ok, true); assert.equal(r.corpo.motivoEmail, "erro_envio");
  });
  test("an e-mail that already has a login is only added to the org (its password is kept, nothing e-mailed)", async () => {
    const { deps, chamadas } = cenario({ usuarioExiste: true });
    const r = await chamar(NOVO, deps);
    assert.equal(r.corpo.ok, true); assert.equal(r.corpo.jaExistia, true);
    assert.equal(r.corpo.motivoEmail, "ja_existia");
    assert.equal(chamadas.email.length, 0);
    assert.ok(chamadas.rpc.some((c) => c[0] === "adicionar_membro"));
  });
  test("if adding to the org fails, the new login is deleted again (no orphan logins)", async () => {
    const { deps, chamadas } = cenario({ erroMembro: { message: "permissão negada" } });
    const r = await chamar(NOVO, deps);
    assert.equal(r.status, 400); assert.match(r.corpo.erro, /permissão negada/);
    assert.deepEqual(chamadas.admin.find((c) => c[0] === "deleteUser"), ["deleteUser", "u-novo"]);
    assert.equal(chamadas.email.length, 0);
  });
  test("checks the input: name, e-mail, role, password of 8+ characters", async () => {
    const casos = [[{ nome: " " }, /nome/], [{ email: "bia@" }, /E-mail inválido/], [{ papel: "dono" }, /Papel/], [{ senha: "123" }, /8 caracteres/]];
    for (const [o, msg] of casos) {
      const { deps, chamadas } = cenario();
      const r = await chamar({ ...NOVO, ...o }, deps);
      assert.equal(r.status, 400); assert.match(r.corpo.erro, msg);
      assert.equal(chamadas.admin.length, 0, "no login touched");
    }
  });
});

describe("admin-usuarios: who may do it", () => {
  test("not logged in, or an expired session -> 401; nobody touched", async () => {
    const { deps, chamadas } = cenario();
    const r = await chamar(NOVO, deps, "ruim");
    assert.equal(r.status, 401);
    const sem = await L.tratar(new Request("https://f", { method: "POST", body: "{}" }), deps);
    assert.equal(sem.status, 401);
    assert.equal(chamadas.admin.length, 0);
  });
  test("a non-admin can't; an org admin can't touch another organization; the super-admin can", async () => {
    let c = cenario({ admin: false });
    assert.equal((await chamar(NOVO, c.deps)).status, 403);
    c = cenario({ orgs: [ORG] });
    const r = await chamar({ ...NOVO, org: "o2" }, c.deps);
    assert.equal(r.status, 403); assert.match(r.corpo.erro, /não administra/);
    assert.equal(c.chamadas.admin.length, 0);
    // even if the list shows another organization, an admin only manages the one they're in
    c = cenario({ orgs: [ORG, OUTRA] });
    assert.equal((await chamar({ ...NOVO, org: "o2" }, c.deps)).status, 403);
    c = cenario({ superAdmin: true, orgs: [ORG, OUTRA] });
    assert.equal((await chamar({ ...NOVO, org: "o2" }, c.deps)).status, 200);
  });
  test("CORS preflight and wrong method", async () => {
    const r = await L.tratar(new Request("https://f", { method: "OPTIONS" }), cenario().deps);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("Access-Control-Allow-Headers"), /authorization/);
    assert.equal((await L.tratar(new Request("https://f", { method: "GET" }), cenario().deps)).status, 405);
    assert.equal((await chamar({ acao: "apagar_tudo", org: "o1" }, cenario().deps)).status, 400);
  });
});

describe("admin-usuarios: cancel, reactivate, new password", () => {
  test("cancel blocks the login (ban) and marks the member inactive, keeping role and permissions", async () => {
    const { deps, chamadas } = cenario();
    const r = await chamar({ acao: "cancelar", org: "o1", user: "u-karen" }, deps);
    assert.equal(r.status, 200, JSON.stringify(r.corpo));
    assert.deepEqual(chamadas.admin[0], ["updateUserById", "u-karen", { ban_duration: "876000h" }]);
    assert.deepEqual(chamadas.rpc.find((c) => c[0] === "admin_definir_acesso")[1],
      { p_user: "u-karen", p_papel: "vendedor", p_ativo: false, p_ver: false, p_criar: true, p_editar: true, p_excluir: false });
  });
  test("reactivate removes the block and marks active", async () => {
    const { deps, chamadas } = cenario({ membros: [membro({ ativo: false })] });
    await chamar({ acao: "reativar", org: "o1", user: "u-karen" }, deps);
    assert.deepEqual(chamadas.admin[0], ["updateUserById", "u-karen", { ban_duration: "none" }]);
    assert.equal(chamadas.rpc.find((c) => c[0] === "admin_definir_acesso")[1].p_ativo, true);
  });
  test("you can't cancel yourself; an org admin can't cancel another admin; someone outside the org -> 404", async () => {
    let r = await chamar({ acao: "cancelar", org: "o1", user: "u-tasnim" }, cenario({ membros: [membro({ user_id: "u-tasnim", papel: "admin" })] }).deps);
    assert.equal(r.status, 400); assert.match(r.corpo.erro, /próprio/);
    r = await chamar({ acao: "cancelar", org: "o1", user: "u-karen" }, cenario({ membros: [membro({ papel: "admin" })] }).deps);
    assert.equal(r.status, 403);
    r = await chamar({ acao: "cancelar", org: "o1", user: "u-karen" }, cenario({ superAdmin: true, membros: [membro({ papel: "admin" })] }).deps);
    assert.equal(r.status, 200, "the super-admin can");
    r = await chamar({ acao: "cancelar", org: "o1", user: "u-x" }, cenario().deps);
    assert.equal(r.status, 404);
  });
  test("new password: set as temporary (must be changed at next login), metadata kept, e-mailed", async () => {
    const { deps, chamadas } = cenario();
    const r = await chamar({ acao: "nova_senha", org: "o1", user: "u-karen", senha: "Outra-9876" }, deps);
    assert.equal(r.status, 200); assert.equal(r.corpo.emailEnviado, true);
    assert.deepEqual(chamadas.admin[0], ["updateUserById", "u-karen",
      { password: "Outra-9876", user_metadata: { nome: "Karen", org_id: "o1", trocar_senha: true } }]);
    assert.match(chamadas.email[0].subject, /nova senha/i);
    assert.match(chamadas.email[0].text, /redefinida/);
    assert.equal((await chamar({ acao: "nova_senha", org: "o1", user: "u-karen", senha: "1" }, cenario().deps)).status, 400);
  });
});

describe("e-mail text", () => {
  test("HTML is escaped (a name can't inject markup)", () => {
    const m = L.montarEmail({ nome: "<b>x</b>", email: "a@b.co", senha: "S<1>", org: "Org & Cia", site: "https://s" });
    assert.ok(!m.html.includes("<b>x</b>"));
    assert.match(m.html, /&lt;b&gt;x&lt;\/b&gt;/);
    assert.match(m.html, /S&lt;1&gt;/);
    assert.match(m.texto, /Org & Cia/);
  });
});

describe("para-colar.ts (single file for Supabase's web editor)", () => {
  test("is up to date with index.ts + logica.mjs (run: node scripts/funcao-colar.mjs)", async () => {
    const fs = require("node:fs");
    const { montarArquivoUnico } = await import(path.join(__dirname, "..", "..", "scripts", "funcao-colar.mjs"));
    const atual = fs.readFileSync(path.join(__dirname, "..", "..", "supabase", "functions", "admin-usuarios", "para-colar.ts"), "utf8");
    assert.equal(atual, montarArquivoUnico());
    assert.ok(!/from "\.\/logica\.mjs"/.test(atual), "no import of the other file");
    assert.match(atual, /async function tratar\(/);
    assert.match(atual, /Deno\.serve\(\(req\) => tratar/);
  });
});
