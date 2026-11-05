// E2E tests: "Zona" in the condo panel is a dropdown with a fixed list
// (Norte, Sul, Leste, Oeste, Centro, Oeste de São Paulo). A value saved before the list existed stays
// as an extra "(antiga)" option, so opening and saving the condo never changes or loses it.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, criarNuvem } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const salvo = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0]);
const LISTA = ["Selecione…", "Norte", "Sul", "Leste", "Oeste", "Centro", "Oeste de São Paulo"];
const opcoes = (page) => page.locator("#f_zona option").allTextContents();

describe("Zona dropdown", () => {
  test("a new condo: the list, empty by default; the chosen zone is saved and shows on the card", async () => {
    const { page, context, errors } = await openApp(env);
    await page.click("#btnNovo");
    assert.equal(await page.evaluate(() => document.querySelector("#f_zona").tagName), "SELECT");
    assert.deepEqual(await opcoes(page), LISTA);
    assert.equal(await page.inputValue("#f_zona"), "");
    await page.fill("#f_nome", "Residencial Aurora");
    await page.selectOption("#f_zona", "Oeste de São Paulo");
    await page.click("#btnSalvar");
    await page.waitForSelector(".cartao");
    assert.equal((await salvo(page)).zona, "Oeste de São Paulo");
    assert.match(await page.textContent(".cartao .cartao-info"), /Oeste de São Paulo/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("an existing condo opens with its zone selected; changing it is logged in the history", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora", zona: "Norte" })] });
    await page.click(".cartao");
    assert.equal(await page.inputValue("#f_zona"), "Norte");
    assert.deepEqual(await opcoes(page), LISTA, "no extra option");
    await page.selectOption("#f_zona", "Centro");
    await page.click("#btnSalvar");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].zona === "Centro");
    assert.match((await salvo(page)).historico[0].o_que, /Zona/);
    await context.close();
  });

  test("a zone typed before the list existed is kept as '(antiga)', and saving other things doesn't change it", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora", zona: "Zona Oeste" })] });
    await page.click(".cartao");
    assert.deepEqual(await opcoes(page), [...LISTA, "Zona Oeste (antiga)"]);
    assert.equal(await page.inputValue("#f_zona"), "Zona Oeste");
    await page.fill("#f_aptos", "200");
    await page.click("#btnSalvar");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].aptos == 200);
    assert.equal((await salvo(page)).zona, "Zona Oeste", "kept");
    assert.doesNotMatch((await salvo(page)).historico[0].o_que, /Zona/, "not reported as a change");
    // the extra option belongs only to that condo: a new one shows just the list
    await page.click("#btnNovo");
    assert.deepEqual(await opcoes(page), LISTA);
    await context.close();
  });

  test("a read-only user can't change it", async () => {
    const n = criarNuvem(undefined, { leitor: true });
    const agora = new Date().toISOString();
    n.tabelas.condominios = [{ id: "c1", nome: "Aurora", endereco: "", aptos: 0, fase: "cadastro", status: "nenhum", ordem: 0, zona: "Sul",
      contatos: [], lembretes: [], observacoes: [], historico: [], sults: false, visitar: false, criado_em: agora, atualizado_em: agora }];
    const { page, context } = await openApp(env, { nuvem: n });
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    assert.equal(await page.inputValue("#f_zona"), "Sul");
    assert.equal(await page.locator("#f_zona").isDisabled(), true);
    await context.close();
  });
});
