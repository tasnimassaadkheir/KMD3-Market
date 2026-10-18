// E2E tests: Administração → click a member's e-mail → see what that person has been doing.
// Cloud mode with the fake Supabase (helpers.js criarNuvem). The admin functions (sou_admin,
// admin_organizacoes, admin_membros) are answered with {rpc: ...}; the "atividades" table is
// pre-loaded like the database trigger (database/atividades.sql) would have filled it.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, criarNuvem, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const H = 3600000, D = 24 * H;
const ha = (ms) => new Date(Date.now() - ms).toISOString();
const agora = new Date().toISOString();
const MEMBROS = [
  { user_id: "u-tasnim", email: "tasnim@kmd3.com.br", usuario: "Tasnim", papel: "admin", ativo: true, ver_todos: true, pode_criar: true, pode_editar: true, pode_excluir: true },
  { user_id: "u-karen", email: "karen@kmd3.com.br", usuario: "Karen Souza", papel: "vendedor", ativo: true, ver_todos: false, pode_criar: true, pode_editar: true, pode_excluir: false },
];
const RPC = { sou_admin: true, sou_super: false, admin_membros: MEMBROS,
  admin_organizacoes: [{ id: "org1", nome: "KMD3 Market", ativa: true, membros: 2, condominios: 2 }] };

function condo(id, nome, historico) {
  return { id, nome, endereco: "Av Manoel Pedro Pimentel, 155", aptos: 120, fase: "contato", status: "nenhum", ordem: 0,
    contatos: [], lembretes: [], observacoes: [], historico, sults: false, visitar: false, criado_em: agora, atualizado_em: agora };
}
function nuvem(opcoes = {}) {
  const n = criarNuvem(undefined, { rpc: RPC, ...opcoes });
  n.tabelas.equipe = [{ id: 1, nome: "Karen Souza", email: "karen@kmd3.com.br" }, { id: 2, nome: "Tasnim", email: "tasnim@kmd3.com.br" }];
  n.tabelas.condominios = [
    condo("c1", "Residencial Acácias", [
      { quando: ha(2 * H), o_que: "Movido para Proposta enviada", por: "Karen Souza" },
      { quando: ha(20 * D), o_que: "Condomínio cadastrado", por: "Karen Souza" }]),
    condo("c2", "Edifício Sol", [{ quando: ha(3 * H), o_que: "Marcado para visitar", por: "Tasnim" }]),
  ];
  return n;
}
// what the database trigger + the app's login line would have written for Karen
const ATIV_KAREN = [
  { id: 1, usuario: "u-karen", email: "karen@kmd3.com.br", quando: ha(1 * H), acao: "entrou", tipo: "app" },
  { id: 2, usuario: "u-karen", quando: ha(2 * H), acao: "alterou", tipo: "condominio", alvo_id: "c1", alvo: "Residencial Acácias", detalhe: "Movido para Proposta enviada" },
  { id: 3, usuario: "u-karen", quando: ha(26 * H), acao: "excluiu", tipo: "condominio", alvo_id: "c9", alvo: "Condomínio Velho" },
  { id: 4, usuario: "u-karen", quando: ha(5 * D), acao: "criou", tipo: "template", alvo_id: "t1", alvo: "Apresentação" },
  { id: 5, usuario: "u-tasnim", quando: ha(1 * H), acao: "excluiu", tipo: "condominio", alvo_id: "c8", alvo: "De outra pessoa" },
];
async function abrirAdmin(page) {
  await page.waitForSelector("#btnAdmin:not([hidden])", { state: "attached" });
  await irPeloMenu(page, "#btnAdmin");
  await page.waitForSelector("#admCorpo tr[data-u]");
}
async function abrirPessoa(page, email) {
  await page.click(`.adm-pessoa:has-text("${email}")`);
  await page.waitForSelector("#admAtiv:not([hidden])");
  await page.waitForFunction(() => !/Carregando/.test(document.querySelector("#admAtivLista").textContent));
}
const linhas = (page) => page.locator("#admAtivLista li").allTextContents();

describe("Administração: a member's activity", () => {
  test("clicking an e-mail shows that person's logins, changes and deletions, by day, with a summary", async () => {
    const n = nuvem(); n.tabelas.atividades = ATIV_KAREN.map((a) => ({ ...a }));
    const { page, context, errors } = await openApp(env, { nuvem: n });
    await abrirAdmin(page);
    await abrirPessoa(page, "karen@kmd3.com.br");

    assert.equal(await page.textContent("#admAtivNome"), "Karen Souza");
    assert.match(await page.textContent("#admAtivSub"), /karen@kmd3\.com\.br, vendedor/);
    const l = await linhas(page);
    // only Karen's lines; the change in the table isn't repeated from the condo's history,
    // and the history older than the table ("cadastrado" 20 days ago) fills in the past
    assert.equal(l.length, 5, l.join(" | "));
    assert.match(l[0], /Entrou no app/);
    assert.match(l[1], /Movido para Proposta enviada, Residencial Acácias/);
    assert.match(l[2], /Excluiu o condomínio, Condomínio Velho/);
    assert.match(l[3], /Criou o template, Apresentação/);
    assert.match(l[4], /Condomínio cadastrado, Residencial Acácias/);
    assert.ok(!l.some((x) => /De outra pessoa|Marcado para visitar/.test(x)), "nothing from other people");
    const dias = await page.locator("#admAtivLista h4").allTextContents();
    assert.equal(dias[0], "Hoje");
    // 30 days: 4 actions (the login doesn't count), 2 condos touched (Acácias twice + the deleted one), 1 created
    assert.match(await page.textContent("#admAtivResumo"), /4ações2condomínios mexidos1cadastrado/);
    assert.match(await page.textContent("#admAtivResumo"), /Última atividade: .* \(hoje\)/);
    assert.equal(await page.locator("#admAtivAviso").isHidden(), true, "no 'run atividades.sql' note: the table exists");
    assert.equal(await page.locator(".adm-ativ-alvo", { hasText: "Condomínio Velho" }).evaluate((e) => e.tagName), "SPAN",
      "a deleted condo is just text, not a link");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("period and search filter the list; Esc closes the drawer, then a condo name opens its card", async () => {
    const n = nuvem(); n.tabelas.atividades = ATIV_KAREN.map((a) => ({ ...a }));
    const { page, context } = await openApp(env, { nuvem: n });
    await abrirAdmin(page);
    await abrirPessoa(page, "karen@kmd3.com.br");
    await page.selectOption("#admAtivPeriodo", "7");
    assert.equal((await linhas(page)).length, 4, "the 20-day-old line is out");
    await page.selectOption("#admAtivPeriodo", "0");
    await page.fill("#admAtivBusca", "acacias");
    assert.equal((await linhas(page)).length, 2, "search ignores accents");
    await page.fill("#admAtivBusca", "zzz");
    assert.match(await page.textContent("#admAtivLista"), /Nada neste período/);
    await page.fill("#admAtivBusca", "");

    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#admAtiv").isHidden(), true);
    assert.equal(await page.locator("#admTela").isVisible(), true, "the admin screen stays open");

    await abrirPessoa(page, "karen@kmd3.com.br");
    await page.click('button.adm-ativ-alvo:has-text("Residencial Acácias")');
    await page.waitForSelector("#painel.aberto");
    assert.equal(await page.inputValue("#f_nome"), "Residencial Acácias");
    assert.equal(await page.locator("#admTela").isHidden(), true);
    await context.close();
  });

  test("opening the app writes 'Abriu o app' once (not again on a reload within 30 minutes)", async () => {
    const n = nuvem(); n.tabelas.atividades = [];
    const { page, context } = await openApp(env, { nuvem: n });
    const esperar = async (fn) => { for (let i = 0; i < 100 && !fn(); i++) await page.waitForTimeout(50); };
    await esperar(() => n.tabelas.atividades.length === 1);
    assert.deepEqual(n.tabelas.atividades.map((a) => [a.acao, a.tipo, a.usuario]), [["abriu", "app", "u-tasnim"]]);
    await page.reload(); await page.waitForSelector(".coluna");
    await page.waitForTimeout(800);
    assert.equal(n.tabelas.atividades.length, 1);
    await context.close();
  });

  test("before atividades.sql is run: shows the condos' history for that person and explains what's missing", async () => {
    const n = nuvem({ semTabela: ["atividades"] });
    const { page, context, errors } = await openApp(env, { nuvem: n });
    await abrirAdmin(page);
    await abrirPessoa(page, "karen@kmd3.com.br");
    assert.equal(await page.locator("#admAtivAviso").isVisible(), true);
    assert.match(await page.textContent("#admAtivAviso"), /atividades\.sql/);
    await page.selectOption("#admAtivPeriodo", "0");
    const l = await linhas(page);
    assert.equal(l.length, 2);
    assert.match(l[0], /Movido para Proposta enviada, Residencial Acácias/);
    assert.match(l[1], /Condomínio cadastrado/);
    // a person with nothing recorded
    await page.click("#admAtivFechar");
    await abrirPessoa(page, "tasnim@kmd3.com.br");
    await page.selectOption("#admAtivPeriodo", "0");
    const t = await linhas(page);
    assert.equal(t.length, 1);
    assert.match(t[0], /Marcado para visitar, Edifício Sol/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("on a phone the drawer takes the whole width without sideways scrolling", async () => {
    const n = nuvem(); n.tabelas.atividades = ATIV_KAREN.map((a) => ({ ...a }));
    const { page, context } = await openApp(env, { nuvem: n, viewport: { width: 390, height: 844 } });
    await abrirAdmin(page);
    await abrirPessoa(page, "karen@kmd3.com.br");
    const caixa = await page.locator("#admAtiv").boundingBox();
    assert.equal(Math.round(caixa.width), 390);
    assert.equal(await page.locator("#admAtiv").evaluate((e) => e.scrollWidth <= e.clientWidth), true);
    await context.close();
  });
});
