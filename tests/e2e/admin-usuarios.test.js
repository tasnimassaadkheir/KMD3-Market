// E2E tests: managing users from Administração (through the Edge Function "admin-usuarios", faked here),
// and changing your own password (temporary password at first login, ☰ → Minha senha, "Esqueci minha senha").
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, criarNuvem, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const EU = { id: "u-tasnim", email: "tasnim@kmd3.com.br" };
const membros = () => [
  { user_id: "u-tasnim", email: "tasnim@kmd3.com.br", usuario: "Tasnim", papel: "admin", ativo: true, ver_todos: true, pode_criar: true, pode_editar: true, pode_excluir: true },
  { user_id: "u-karen", email: "karen@kmd3.com.br", usuario: "Karen", papel: "vendedor", ativo: true, ver_todos: false, pode_criar: true, pode_editar: true, pode_excluir: false },
  { user_id: "u-leo", email: "leo@kmd3.com.br", usuario: "Leo", papel: "leitor", ativo: false, ver_todos: true, pode_criar: false, pode_editar: false, pode_excluir: false },
];
const ORGS = [{ id: "o1", nome: "KMD3 Market", ativa: true, membros: 3, condominios: 0 }];
// a fake "admin-usuarios" function; 'resposta' decides the answer for each call
function nuvem({ resposta, usuario = EU, extra = {} } = {}) {
  return criarNuvem(usuario, { rpc: { sou_admin: true, sou_super: true, admin_membros: membros(), admin_organizacoes: ORGS, criar_organizacao: null },
    funcoes: { "admin-usuarios": async (c) => (resposta ? resposta(c)
      : { status: 200, json: { ok: true, jaExistia: false, emailEnviado: c.enviarEmail !== false, motivoEmail: c.enviarEmail === false ? "nao_pedido" : null } }) },
    ...extra });
}
async function abrirAdmin(page) {
  await page.waitForSelector("#btnAdmin:not([hidden])", { state: "attached" });
  await irPeloMenu(page, "#btnAdmin");
  await page.waitForSelector("#admCorpo tr[data-u]");
}
const linha = (page, email) => page.locator(`#admCorpo tr[data-u]:has-text("${email}")`);

describe("Administração: users", () => {
  test("'Novo usuário' sends name, e-mail, role, the temporary password and 'send e-mail' to the function, and confirms", async () => {
    const n = nuvem();
    const { page, context, errors } = await openApp(env, { nuvem: n });
    await abrirAdmin(page);
    const senha = await page.inputValue("#admSenha");
    assert.ok(senha.length >= 12, "a password is already generated");
    assert.match(senha, /[A-Z]/); assert.match(senha, /[a-z]/); assert.match(senha, /[2-9]/);
    await page.click("#admGerarSenha");
    assert.notEqual(await page.inputValue("#admSenha"), senha, "'Gerar' makes a new one");
    await page.fill("#admNovoNome", "Bia Lima");
    await page.fill("#admEmail", "Bia@Cliente.com.br");
    await page.selectOption("#admPapelNovo", "vendedor");
    await page.fill("#admSenha", "Temp-1234x");
    await page.click("#admAdd");
    await page.waitForSelector("#admResultado:not([hidden])");
    assert.deepEqual(n.funcoesChamadas[0], { nome: "admin-usuarios", corpo: { acao: "criar", org: "o1", nome: "Bia Lima",
      email: "bia@cliente.com.br", papel: "vendedor", senha: "Temp-1234x", enviarEmail: true } });
    assert.match(await page.textContent("#admResultado"), /Usuário criado\. Enviamos a senha para bia@cliente\.com\.br/);
    assert.equal(await page.inputValue("#admNovoNome"), "", "form cleared for the next one");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("when the e-mail can't go out, the password is shown with a 'Copiar' button to pass it on", async () => {
    const n = nuvem({ resposta: () => ({ status: 200, json: { ok: true, jaExistia: false, emailEnviado: false, motivoEmail: "sem_config" } }) });
    const { page, context } = await openApp(env, { nuvem: n });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await abrirAdmin(page);
    await page.fill("#admNovoNome", "Bia"); await page.fill("#admEmail", "bia@c.com"); await page.fill("#admSenha", "Temp-1234x");
    await page.click("#admAdd");
    await page.waitForSelector("#admResultado.atencao");
    const txt = await page.textContent("#admResultado");
    assert.match(txt, /não foi enviado/); assert.match(txt, /RESEND_API_KEY/); assert.match(txt, /Temp-1234x/);
    await page.click("[data-copiar-acesso]");
    const area = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(area, /E-mail: bia@c\.com\nSenha temporária: Temp-1234x\nEndereço: http/);
    await context.close();
  });

  test("checks the form before calling (name, e-mail, 8+ characters) and shows the function's own error", async () => {
    const n = nuvem({ resposta: () => ({ status: 403, json: { ok: false, codigo: "sem_permissao", erro: "Você não administra esta organização." } }) });
    const { page, context } = await openApp(env, { nuvem: n });
    await abrirAdmin(page);
    await page.fill("#admNovoNome", "Bia"); await page.fill("#admEmail", "bia@"); await page.click("#admAdd");
    assert.match(await page.textContent("#aviso"), /E-mail inválido/);
    await page.fill("#admEmail", "bia@c.com"); await page.fill("#admSenha", "123"); await page.click("#admAdd");
    assert.match(await page.textContent("#aviso"), /8 caracteres/);
    assert.equal(n.funcoesChamadas.length, 0, "nothing sent yet");
    await page.fill("#admSenha", "Temp-1234x"); await page.click("#admAdd");
    await page.waitForFunction(() => /não administra/.test(document.querySelector("#aviso").textContent));
    assert.equal(await page.locator("#admResultado").isHidden(), true);
    await context.close();
  });

  test("if the function isn't published in Supabase yet, a clear message says so", async () => {
    const n = criarNuvem(EU, { rpc: { sou_admin: true, sou_super: true, admin_membros: membros(), admin_organizacoes: ORGS } });   // no functions
    const { page, context } = await openApp(env, { nuvem: n });
    await abrirAdmin(page);
    await page.fill("#admNovoNome", "Bia"); await page.fill("#admEmail", "bia@c.com"); await page.click("#admAdd");
    await page.waitForFunction(() => /ainda não está publicada/.test(document.querySelector("#aviso").textContent));
    await context.close();
  });

  test("cancel (after confirming) and reactivate a member; you can't cancel yourself; a cancelled one is labeled", async () => {
    const n = nuvem();
    const { page, context } = await openApp(env, { nuvem: n });
    await abrirAdmin(page);
    assert.equal(await linha(page, "tasnim@").locator(".admCancelar").count(), 0, "no cancel button on your own row");
    assert.match(await linha(page, "leo@").textContent(), /Acesso cancelado/);
    assert.equal(await linha(page, "leo@").locator(".admReativar").count(), 1);

    let pergunta = "";
    page.once("dialog", (d) => { pergunta = d.message(); d.dismiss(); });
    await linha(page, "karen@").locator(".admCancelar").click();
    assert.match(pergunta, /Cancelar o acesso de Karen/);
    assert.equal(n.funcoesChamadas.length, 0, "said no: nothing happens");
    page.once("dialog", (d) => d.accept());
    await linha(page, "karen@").locator(".admCancelar").click();
    await page.waitForFunction(() => /cancelado/.test(document.querySelector("#aviso").textContent));
    assert.deepEqual(n.funcoesChamadas[0].corpo, { acao: "cancelar", org: "o1", user: "u-karen" });

    await linha(page, "leo@").locator(".admReativar").click();
    await page.waitForFunction(() => /reativado/.test(document.querySelector("#aviso").textContent));
    assert.deepEqual(n.funcoesChamadas[1].corpo, { acao: "reativar", org: "o1", user: "u-leo" });
    await context.close();
  });

  test("'Nova senha' opens a dialog with a generated password and sends it", async () => {
    const n = nuvem();
    const { page, context } = await openApp(env, { nuvem: n });
    await abrirAdmin(page);
    await linha(page, "karen@").locator(".admNovaSenha").click();
    await page.waitForSelector("#admSenhaDlg:not([hidden])");
    assert.match(await page.textContent("#admSenhaQuem"), /karen@kmd3\.com\.br/);
    assert.ok((await page.inputValue("#admSenhaNova")).length >= 12);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#admSenhaDlg").isHidden(), true, "Esc closes it");
    assert.equal(await page.locator("#admTela").isVisible(), true, "…but not the admin screen");
    await linha(page, "karen@").locator(".admNovaSenha").click();
    await page.fill("#admSenhaNova", "Nova-5678x");
    await page.uncheck("#admSenhaEmail");
    await page.click("#admSenhaForm .btn-salvar");
    await page.waitForSelector("#admSenhaDlg", { state: "hidden" });
    assert.deepEqual(n.funcoesChamadas[0].corpo, { acao: "nova_senha", org: "o1", user: "u-karen", senha: "Nova-5678x", enviarEmail: false });
    assert.match(await page.textContent("#admResultado"), /Nova-5678x/, "not e-mailed: the password is shown to pass on");
    await context.close();
  });

  test("creating an organization selects it, ready to create its users", async () => {
    const n = nuvem();
    const { page, context } = await openApp(env, { nuvem: n });
    await abrirAdmin(page);
    await page.evaluate(() => { window.__fakeRpc.admin_organizacoes = [...window.__fakeRpc.admin_organizacoes, { id: "o9", nome: "Condomínios Sul", ativa: false, membros: 0, condominios: 0 }];
      window.__fakeRpc.admin_membros = []; });
    await page.fill("#admNomeOrg", "Condomínios Sul");
    await page.click("#admCriarOrg");
    await page.waitForFunction(() => document.querySelector("#admTitulo").textContent === "Membros de Condomínios Sul");
    assert.equal(await page.evaluate(() => document.activeElement.id), "admNovoNome");
    await page.fill("#admNovoNome", "Ana"); await page.fill("#admEmail", "ana@sul.com"); await page.click("#admAdd");
    await page.waitForSelector("#admResultado:not([hidden])");
    assert.equal(n.funcoesChamadas[0].corpo.org, "o9", "the user goes to the new organization");
    await context.close();
  });

  test("on a phone the new-user form and the dialog fit the screen", async () => {
    const { page, context } = await openApp(env, { nuvem: nuvem(), viewport: { width: 360, height: 780 } });
    await abrirAdmin(page);
    for (const sel of ["#admNovoNome", "#admEmail", "#admPapelNovo", "#admSenha", "#admGerarSenha", "#admAdd"]) {
      const b = await page.locator(sel).boundingBox();
      assert.ok(b.x >= 0 && b.x + b.width <= 360, sel + " inside the screen");
    }
    await linha(page, "karen@").locator(".admNovaSenha").click();
    const d = await page.locator("#admSenhaForm").boundingBox();
    assert.ok(d.x >= 0 && d.x + d.width <= 360);
    await context.close();
  });
});

describe("My password", () => {
  test("logged in with a temporary password: must create a new one before using the app (no way to skip)", async () => {
    const n = nuvem({ usuario: { ...EU, user_metadata: { nome: "Tasnim", trocar_senha: true } } });
    const { page, context, errors } = await openApp(env, { nuvem: n });
    await page.waitForSelector("#senhaDlg:not([hidden])");
    assert.equal(await page.textContent("#senhaTitulo"), "Crie sua senha");
    assert.equal(await page.locator("#senhaCancelar").isVisible(), false, "no Cancel");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#senhaDlg").isVisible(), true, "Esc doesn't close it");
    await page.fill("#senhaNova", "minhaSenha9"); await page.fill("#senhaRepete", "minhaSenha8");
    await page.click("#senhaSalvar");
    assert.match(await page.textContent("#senhaErro"), /não são iguais/);
    await page.fill("#senhaNova", "curta"); await page.fill("#senhaRepete", "curta"); await page.click("#senhaSalvar");
    assert.match(await page.textContent("#senhaErro"), /8 caracteres/);
    await page.evaluate(() => { window.__fakeAuthErro = "New password should be different from the old password."; });
    await page.fill("#senhaNova", "Temp-1234x"); await page.fill("#senhaRepete", "Temp-1234x"); await page.click("#senhaSalvar");
    await page.waitForFunction(() => /diferente da anterior/.test(document.querySelector("#senhaErro").textContent));
    await page.evaluate(() => { window.__fakeAuthErro = null; });
    await page.fill("#senhaNova", "minhaSenha9"); await page.fill("#senhaRepete", "minhaSenha9");
    await page.click("#senhaSalvar");
    await page.waitForSelector("#senhaDlg", { state: "hidden" });
    assert.deepEqual(n.tabelas._auth, [{ acao: "updateUser", password: "minhaSenha9", data: { trocar_senha: false } }]);
    assert.match(await page.textContent("#aviso"), /Senha alterada/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("☰ → Minha senha: anyone can change their password; Cancel closes it; hidden in local mode", async () => {
    const n = nuvem();
    const { page, context } = await openApp(env, { nuvem: n });
    await irPeloMenu(page, "#btnMinhaSenha");
    await page.waitForSelector("#senhaDlg:not([hidden])");
    assert.equal(await page.textContent("#senhaTitulo"), "Minha senha");
    await page.click("#senhaMostrar");
    assert.equal(await page.getAttribute("#senhaNova", "type"), "text", "'Mostrar senha' shows it");
    await page.click("#senhaCancelar");
    assert.equal(await page.locator("#senhaDlg").isHidden(), true);
    await irPeloMenu(page, "#btnMinhaSenha");
    await page.fill("#senhaNova", "outraSenha7"); await page.fill("#senhaRepete", "outraSenha7"); await page.click("#senhaSalvar");
    await page.waitForSelector("#senhaDlg", { state: "hidden" });
    assert.equal(n.tabelas._auth[0].password, "outraSenha7");
    await context.close();

    const local = await openApp(env, {});
    assert.equal(await local.page.locator("#btnMinhaSenha").isHidden(), true);
    await local.context.close();
  });

  test("'Esqueci minha senha' sends the reset link back to this site; opening the link asks for a new password", async () => {
    const n = nuvem();
    const { page, context } = await openApp(env, { nuvem: n });
    await page.evaluate(() => mostrarEntrada());
    await page.click("#btnEsqueci");
    assert.match(await page.textContent("#erroEntrada"), /Escreva seu e-mail/);
    await page.fill("#in_email", "karen@kmd3.com.br");
    await page.click("#btnEsqueci");
    await page.waitForFunction(() => /enviamos um link/.test(document.querySelector("#aviso").textContent));
    assert.equal(n.tabelas._auth[0].email, "karen@kmd3.com.br");
    assert.match(n.tabelas._auth[0].redirectTo, /^http:\/\/(127\.0\.0\.1|localhost):\d+\/$/);
    await context.close();

    const n2 = nuvem({ extra: { recuperacao: true } });
    const r = await openApp(env, { nuvem: n2 });
    await r.page.waitForSelector("#senhaDlg:not([hidden])");
    assert.equal(await r.page.textContent("#senhaTitulo"), "Crie sua senha");
    assert.match(await r.page.textContent("#senhaTexto"), /senha nova para entrar/);
    await r.context.close();
  });
});
