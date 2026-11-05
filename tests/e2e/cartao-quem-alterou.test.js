// E2E tests: the card's footer ("Atualizado <date> por <name>") shows who made the LAST change of any
// kind — an edit saved in the panel, a move to another column, a note… — not only who wrote the last note.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, criarNuvem } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const ontem = new Date(Date.now() - 86400000).toISOString();
// A condo whose last note (yesterday) was written by Beatriz. Database format.
const condo = (over = {}) => ({ id: "c1", nome: "Residencial Aurora", endereco: "Rua A, 1 - São Paulo - SP", aptos: 120, fase: "cadastro",
  status: "nenhum", ordem: 0, contatos: [], lembretes: [], historico: [{ quando: ontem, o_que: "Condomínio cadastrado", por: "Beatriz" }],
  observacoes: [{ texto: "Ligou o síndico", quando: ontem, por: "Beatriz" }], sults: false, visitar: false,
  criado_por: "Beatriz", criado_em: ontem, atualizado_em: ontem, ...over });
const rodape = (page) => page.textContent(".cartao .meta-cartao");

describe("Card: who changed it last", () => {
  test("an edit saved in the panel (not a note) puts the editor's name on the card", async () => {
    const n = criarNuvem();                                   // logged in as tasnim
    n.tabelas.condominios = [condo()];
    const { page, context, errors } = await openApp(env, { nuvem: n });
    await page.waitForSelector(".cartao");
    assert.match(await rodape(page), /por Beatriz/, "before: the note's author");
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    await page.selectOption("#f_zona", "Oeste");
    await page.click("#btnSalvar");
    await page.waitForFunction(() => /por tasnim/.test(document.querySelector(".cartao .meta-cartao").textContent));
    assert.match(await rodape(page), /^Atualizado \d{2}\/\d{2}/);
    assert.equal(await page.textContent(".cartao .meta-cartao .inicial"), "T", "avatar with the initial");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("moving the card to another column also counts", async () => {
    const n = criarNuvem();
    n.tabelas.condominios = [condo()];
    const { page, context } = await openApp(env, { nuvem: n });
    await page.waitForSelector(".cartao");
    // drag with the real mouse (like board.test.js) to "Contato Realizado"
    const de = await page.locator(".cartao").boundingBox();
    const para = await page.locator('.coluna[data-fase="contato"] .lista').boundingBox();
    await page.mouse.move(de.x + 20, de.y + 10);
    await page.mouse.down();
    await page.mouse.move(para.x + 30, para.y + 20, { steps: 10 });
    await page.mouse.move(para.x + 40, para.y + 25, { steps: 5 });
    await page.mouse.up();
    await page.waitForSelector('.coluna[data-fase="contato"] .cartao');
    await page.waitForFunction(() => /por tasnim/.test(document.querySelector(".cartao .meta-cartao").textContent));
    await context.close();
  });

  test("a change made by someone else (history from the database) shows their name, even after an older note", async () => {
    const n = criarNuvem();
    const agora = new Date().toISOString();
    n.tabelas.condominios = [condo({ historico: [{ quando: agora, o_que: "Movido para Reunião", por: "Karen" },
      { quando: ontem, o_que: "Condomínio cadastrado", por: "Beatriz" }] })];
    const { page, context } = await openApp(env, { nuvem: n });
    await page.waitForSelector(".cartao");
    assert.match(await rodape(page), /por Karen/);
    await context.close();
  });

  test("a new note is still the last change when it's the newest", async () => {
    const n = criarNuvem();
    n.tabelas.condominios = [condo({ observacoes: [{ texto: "Agora", quando: new Date().toISOString(), por: "Bruna" }] })];
    const { page, context } = await openApp(env, { nuvem: n });
    await page.waitForSelector(".cartao");
    assert.match(await rodape(page), /por Bruna/);
    await context.close();
  });
});
