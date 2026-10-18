// E2E tests: read-only users (role "leitor") can open and see everything but can't change anything.
// Cloud mode with the fake Supabase (helpers.js criarNuvem): {leitor: true} makes the database
// answer "no" to create / edit / delete, like the real "posso" function does for a leitor.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, criarNuvem, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const agora = new Date().toISOString();
function nuvem(leitor) {
  const n = criarNuvem(undefined, { leitor });
  n.tabelas.condominios = [{ id: "c1", nome: "Residencial Acácias", endereco: "Av Manoel Pedro Pimentel, 155", aptos: 120,
    fase: "contato", status: "amarelo", ordem: 0, sults: true, visitar: false, perfil: "Famílias com crianças",
    contatos: [{ nome: "Paulo", telefone: "11999990000", email: "", tipo: "Síndico" }],
    observacoes: [{ texto: "Visitamos o síndico", quando: agora, por: "Karen" }],
    lembretes: [{ id: "l1", quando: "2026-12-01T10:00", texto: "Ligar de novo", feito: false }],
    historico: [], criado_em: agora, atualizado_em: agora }];
  n.tabelas.templates = [{ id: "t1", titulo: "Apresentação", texto: "Olá! Sou da KMD3 Market.", criado_em: agora, atualizado_em: agora }];
  return n;
}
const visivel = (page, sel) => page.locator(sel).first().isVisible().catch(() => false);

describe("Read-only users (leitor)", () => {
  test("the board shows everything, without buttons to add or move cards", async () => {
    const n = nuvem(true);
    const { page, context, errors } = await openApp(env, { nuvem: n });
    assert.equal(await page.locator(".cartao").count(), 1);
    assert.equal(await page.evaluate(() => document.body.classList.contains("somente-leitura")), true);
    assert.equal(await visivel(page, "#btnNovo"), false, "no 'Novo condomínio'");
    assert.equal(await visivel(page, ".add-coluna"), false, "no '+ Adicionar condomínio'");
    assert.equal(await page.getAttribute(".cartao", "draggable"), "false", "cards can't be dragged");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("a card opens with all its information, but every field is locked and nothing can be saved", async () => {
    const n = nuvem(true);
    const { page, context } = await openApp(env, { nuvem: n });
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    // everything can be read
    assert.equal(await page.inputValue("#f_nome"), "Residencial Acácias");
    assert.match(await page.textContent("#obsLista"), /Visitamos o síndico/);
    assert.match(await page.textContent("#lemLista"), /Ligar de novo/);
    assert.equal(await page.locator(".selo-leitura").isVisible(), true, "says 'Somente leitura'");
    assert.equal(await page.locator(".obs-copiar").first().isVisible(), true, "notes can still be copied");
    assert.equal((await page.textContent("#btnCancelar")).trim(), "Fechar");
    // nothing can be changed
    for (const sel of ["#btnSalvar", "#btnExcluir", "#btnAddContato", ".obs-nova", ".lem-novo", "#btnRotaLead", ".obs-editar", ".lem-ok"])
      assert.equal(await visivel(page, sel), false, sel + " hidden");
    assert.equal(await page.locator("#btnSults").isVisible(), true, "SULTS shows (it's on) …");
    assert.equal(await page.locator("#btnSults").evaluate((b) => getComputedStyle(b).pointerEvents), "none", "… but can't be clicked");
    assert.equal(await visivel(page, "#btnVisitarLead"), false, "Visitar hidden (it's off)");
    assert.equal(await page.locator("#f_nome").evaluate((e) => e.readOnly), true);
    assert.equal(await page.locator("#f_fase").evaluate((e) => e.disabled), true);
    assert.equal(await page.locator(".contato-item input").first().evaluate((e) => e.readOnly || e.disabled), true, "contacts locked too");
    await page.click("#f_nome");
    await page.keyboard.type(" XYZ");
    assert.equal(await page.inputValue("#f_nome"), "Residencial Acácias", "typing does nothing");
    // even calling the save code directly writes nothing
    const antes = JSON.stringify(n.tabelas.condominios);
    await page.evaluate(() => { salvar(); adicionarObservacao(); alternarRotaLead(); });
    await page.waitForTimeout(500);
    assert.equal(JSON.stringify(n.tabelas.condominios), antes, "database unchanged");
    assert.equal((n.tabelas.rotas || []).length, 0);
    await page.click("#btnCancelar");
    assert.equal(await page.locator("#painel.aberto").count(), 0);
    await context.close();
  });

  test("Contatos, Templates and Prospecção: reading, copying and searching only", async () => {
    const n = nuvem(true);
    const { page, context } = await openApp(env, { nuvem: n });
    await irPeloMenu(page, "#btnContatos");
    await page.waitForSelector("#telaContatos.aberta");
    assert.match(await page.textContent("#ctCorpo"), /Paulo/);
    assert.equal(await visivel(page, "#btnNovoContato"), false);
    await page.click("#btnFecharContatos");

    await irPeloMenu(page, "#btnTemplates");
    await page.waitForSelector(".tp-cartao");
    assert.equal(await visivel(page, "#btnNovoTemplate"), false);
    assert.equal(await visivel(page, "[data-tp-editar]"), false);
    assert.equal(await page.locator(".tp-copiar").isVisible(), true, "copying a text is still allowed");
    await page.click("#btnFecharTemplates");

    await irPeloMenu(page, "#btnEquipe");
    await page.waitForSelector("#painelEquipe.aberto");
    assert.equal(await visivel(page, "#btnAddEquipe"), false);
    await context.close();
  });

  test("an editor (not read-only) still has every button", async () => {
    const { page, context } = await openApp(env, { nuvem: nuvem(false) });
    assert.equal(await page.evaluate(() => document.body.classList.contains("somente-leitura")), false);
    assert.equal(await page.locator("#btnNovo").isVisible(), true);
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    assert.equal(await page.locator("#btnSalvar").isVisible(), true);
    assert.equal(await page.locator("#f_nome").evaluate((e) => e.readOnly), false);
    assert.equal((await page.textContent("#btnCancelar")).trim(), "Cancelar");
    await context.close();
  });
});
