// E2E tests: the green SULTS toggle in the condo panel and the green "S" badge on the card.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { setup, openApp, lead } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

// A condo whose last note was written by Beatriz, so its card shows "por Beatriz".
const comNota = (over = {}) => lead({
  id: "c_aurora", nome: "Aurora",
  observacoes: [{ texto: "Ligou o síndico", quando: new Date().toISOString(), por: "Beatriz" }], ...over,
});
const salvo = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0]);

describe("SULTS", () => {
  test("turning SULTS on shows a green 'S' right after the name of who edited last", async () => {
    const { page, context, errors } = await openApp(env, { leads: [comNota()] });
    assert.equal(await page.locator(".cartao .selo-sults").count(), 0, "no badge before");

    await page.click(".cartao");
    const btn = page.locator("#btnSults");
    assert.equal(await btn.textContent(), "SULTS");
    assert.equal(await btn.getAttribute("aria-pressed"), "false");
    await btn.click();
    assert.equal(await btn.getAttribute("aria-pressed"), "true");
    assert.equal(await btn.textContent(), "✓ SULTS");
    await page.click("#btnSalvar");

    const quem = page.locator(".cartao .meta-cartao .quem");
    await quem.locator(".selo-sults").waitFor();
    assert.match(await quem.textContent(), /por Beatriz\s*S$/, "S comes right after the name");
    const cor = await quem.locator(".selo-sults").evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.equal(cor, "rgb(47, 164, 95)", "green background");
    assert.equal((await salvo(page)).sults, true, "saved");
    assert.match((await salvo(page)).historico[0].o_que, /Marcado como SULTS/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the toggle opens in the saved state, and turning it off removes the badge", async () => {
    const { page, context } = await openApp(env, { leads: [comNota({ sults: true })] });
    assert.equal(await page.locator(".cartao .selo-sults").count(), 1);
    await page.click(".cartao");
    assert.equal(await page.getAttribute("#btnSults", "aria-pressed"), "true");
    await page.click("#btnSults");
    await page.click("#btnSalvar");
    await page.waitForSelector(".cartao .selo-sults", { state: "detached" });
    assert.equal((await salvo(page)).sults, false);
    await context.close();
  });

  test("Cancel discards the change", async () => {
    const { page, context } = await openApp(env, { leads: [comNota()] });
    await page.click(".cartao");
    await page.click("#btnSults");
    await page.click("#btnCancelar");
    assert.equal(await page.locator(".cartao .selo-sults").count(), 0);
    await page.click(".cartao");
    assert.equal(await page.getAttribute("#btnSults", "aria-pressed"), "false", "starts off again");
    await context.close();
  });

  test("a condo without notes still shows the badge", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Sem notas", sults: true })] });
    assert.equal(await page.locator(".cartao .meta-cartao .selo-sults").count(), 1);
    await context.close();
  });

  test("works when creating a new condo, and the CSV export has a SULTS column", async () => {
    const { page, context } = await openApp(env);
    await page.click("#btnNovo");
    assert.equal(await page.getAttribute("#btnSults", "aria-pressed"), "false", "new condo starts off");
    await page.fill("#f_nome", "Novo SULTS");
    await page.click("#btnSults");
    await page.click("#btnSalvar");
    await page.waitForSelector(".cartao .selo-sults");

    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#btnExportar")]);
    const linhas = fs.readFileSync(await download.path(), "utf8").slice(1).split("\r\n");
    assert.match(linhas[0], /"SULTS"$/);
    assert.match(linhas[1], /"Sim"$/);
    await context.close();
  });
});
