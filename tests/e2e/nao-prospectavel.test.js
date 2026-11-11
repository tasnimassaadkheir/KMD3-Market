// E2E tests: the "Não prospectável" situation. Choosing it in the panel takes the condo off the board
// (and the map); it only shows again when the situation filter is "Não prospectáveis".
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const dados = () => [
  lead({ id: "a", nome: "Aurora", status: "amarelo", responsavel: "Karen" }),
  lead({ id: "b", nome: "Bosque", status: "naoprospectavel", responsavel: "Bia", ordem: 1 }),
  lead({ id: "c", nome: "Cedro", status: "nenhum", ordem: 2 }),
];
const naTela = async (page) => (await page.locator(".cartao").allTextContents()).map((t) => (t.match(/Aurora|Bosque|Cedro/) || [""])[0]).filter(Boolean).sort();

describe("Situação: Não prospectável", () => {
  test("hidden from the board; the 'Não prospectáveis (N)' filter shows only them; back to all hides them again", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados() });
    await page.waitForSelector(".cartao");
    assert.deepEqual(await naTela(page), ["Aurora", "Cedro"]);
    assert.equal(await page.textContent('#filtroStatus option[value="naoprospectavel"]'), "Não prospectáveis (1)");
    await page.selectOption("#filtroStatus", "naoprospectavel");
    assert.deepEqual(await naTela(page), ["Bosque"]);
    assert.match(await page.getAttribute('.cartao', "class"), /st-naoprospectavel/);
    // the other filters still apply on top of it
    await page.fill("#busca", "aurora");
    assert.deepEqual(await naTela(page), []);
    await page.fill("#busca", "");
    // other situation filters don't show it either
    await page.selectOption("#filtroStatus", "nenhum");
    assert.deepEqual(await naTela(page), ["Cedro"]);
    await page.selectOption("#filtroStatus", "");
    assert.deepEqual(await naTela(page), ["Aurora", "Cedro"]);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("choosing it in the panel takes the card off the board, says where it went, and logs it; choosing another situation brings it back", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await page.click('.cartao:has-text("Aurora")');
    await page.waitForSelector("#painel.aberto");
    await page.check('#semaforo input[value="naoprospectavel"]');
    await page.click("#btnSalvar");
    await page.waitForFunction(() => !/Aurora/.test(document.querySelector("#quadro").textContent));
    assert.match(await page.textContent("#aviso"), /não prospectável.*Não prospectáveis/i);
    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios")).find((l) => l.id === "a"));
    assert.equal(salvo.status, "naoprospectavel");
    assert.match(salvo.historico[0].o_que, /Situação: Em andamento → Não prospectável/);
    assert.equal(await page.textContent('#filtroStatus option[value="naoprospectavel"]'), "Não prospectáveis (2)");

    // find it with the filter and make it prospectable again
    await page.selectOption("#filtroStatus", "naoprospectavel");
    await page.click('.cartao:has-text("Aurora")');
    await page.check('#semaforo input[value="amarelo"]');
    await page.click("#btnSalvar");
    await page.waitForFunction(() => !/Aurora/.test(document.querySelector("#quadro").textContent), "leaves the filtered view");
    await page.selectOption("#filtroStatus", "");
    await page.waitForSelector('.cartao:has-text("Aurora")');
    await context.close();
  });

  test("the Dashboard counts it in Situação, and its number opens the list", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await irPeloMenu(page, "#btnDashboard");
    await page.waitForSelector("#telaDashboard.aberta");
    const barra = page.locator('[data-db-grupo="status:naoprospectavel"]');
    assert.match(await barra.textContent(), /Não prospectável[\s\S]*1/);
    await barra.click();
    await page.waitForFunction(() => /Bosque/.test(document.body.textContent) && /Situação: Não prospectável/.test(document.body.textContent));
    await context.close();
  });

  test("the map doesn't show it either", async () => {
    const { page, context } = await openApp(env, { leads: dados(), fakeLeaflet: true });
    assert.deepEqual(await page.evaluate(() => filtrar().map((l) => l.nome).sort()), ["Aurora", "Cedro"]);
    await context.close();
  });
});
