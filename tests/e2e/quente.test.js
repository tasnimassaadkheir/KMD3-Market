// E2E tests: "Quente" (hot contact): the orange flame toggle next to SULTS in the condo panel,
// the flame next to the condo's name on the card, the board filter, and the Dashboard number.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { setup, openApp, lead, criarNuvem, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const salvo = (page, id) => page.evaluate((i) => JSON.parse(localStorage.getItem("quitandinha:condominios")).find((l) => l.id === i), id);
const nomes = async (page) => (await page.locator(".cartao h3").allTextContents()).map((t) => t.trim()).sort();
const dados = () => [lead({ id: "a", nome: "Aurora", quente: true }), lead({ id: "b", nome: "Bosque Verde" }), lead({ id: "c", nome: "Mirante" })];

describe("Contato quente (flame)", () => {
  test("the toggle sits next to SULTS; turning it on and saving puts a flame next to the name on the card", async () => {
    const { page, context, errors } = await openApp(env, { leads: [lead({ id: "b", nome: "Bosque Verde" })] });
    assert.equal(await page.locator(".cartao .selo-quente").count(), 0);
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    await page.waitForTimeout(300);                                   // panel slide-in animation
    const btn = page.locator("#btnQuente");
    const s = await page.locator("#btnSults").boundingBox(), q = await btn.boundingBox();
    assert.ok(Math.abs(s.y - q.y) < 3 && q.x > s.x, "same row, right after SULTS");
    assert.equal((await btn.textContent()).trim(), "Quente");
    assert.equal(await btn.locator("svg").count(), 1, "flame icon");
    assert.equal(await btn.getAttribute("aria-pressed"), "false");
    await btn.click();
    assert.equal(await btn.getAttribute("aria-pressed"), "true");
    await page.mouse.move(5, 700);                                    // not hovering, to read the real color
    assert.equal(await btn.evaluate((e) => getComputedStyle(e).backgroundColor), "rgb(226, 97, 27)", "solid orange when on");
    await page.click("#btnSalvar");

    const fogo = page.locator(".cartao h3 .selo-quente");
    await fogo.waitFor();
    assert.equal(await fogo.getAttribute("title"), "Contato quente");
    const h3 = await page.locator(".cartao h3").boundingBox(), f = await fogo.boundingBox();
    assert.ok(f.y >= h3.y - 2 && f.y + f.height <= h3.y + h3.height + 4, "on the name's line");
    const v = await salvo(page, "b");
    assert.equal(v.quente, true, "saved");
    assert.match(v.historico[0].o_que, /Marcado como contato quente/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("opens in the saved state; turning it off removes the flame; Cancel discards", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ id: "a", nome: "Aurora", quente: true })] });
    assert.equal(await page.locator(".cartao .selo-quente").count(), 1);
    await page.click(".cartao");
    assert.equal(await page.getAttribute("#btnQuente", "aria-pressed"), "true");
    await page.click("#btnQuente");
    await page.click("#btnCancelar");
    assert.equal(await page.locator(".cartao .selo-quente").count(), 1, "Cancel keeps it");
    await page.click(".cartao");
    await page.click("#btnQuente");
    await page.click("#btnSalvar");
    await page.waitForSelector(".cartao .selo-quente", { state: "detached" });
    assert.equal((await salvo(page, "a")).quente, false);
    await context.close();
  });

  test("the board filter has 'Contatos quentes' and 'Não quentes'; the CSV has a 'Contato quente' column", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await page.selectOption("#filtroStatus", "quente:sim");
    assert.deepEqual(await nomes(page), ["Aurora"]);
    await page.selectOption("#filtroStatus", "quente:nao");
    assert.deepEqual(await nomes(page), ["Bosque Verde", "Mirante"]);
    await page.selectOption("#filtroStatus", "");
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#btnExportar")]);
    const csv = fs.readFileSync(await download.path(), "utf8");
    assert.match(csv.split("\n")[0], /"Contato quente"/);
    await context.close();
  });

  test("the Dashboard counts hot contacts, lists them, and 'Ver no quadro' applies the filter", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await irPeloMenu(page, "#btnDashboard");
    const b = page.locator('[data-db-grupo="quente"]');
    assert.match(await b.textContent(), /1\s*contato quente/);
    await b.click();
    await page.waitForSelector("#dbDetalhe:not([hidden])");
    assert.equal(await page.locator("#dbDetLista li").count(), 1);
    await page.click("#dbDetQuadro");
    assert.equal(await page.inputValue("#filtroStatus"), "quente:sim");
    assert.deepEqual(await nomes(page), ["Aurora"]);
    await context.close();
  });

  test("read-only users see the flame (and the toggle only when it's on) but can't change it", async () => {
    const agora = new Date().toISOString();
    const n = criarNuvem(undefined, { leitor: true });
    n.tabelas.condominios = ["a", "b"].map((id) => ({ id, nome: id === "a" ? "Aurora" : "Bosque", fase: "cadastro", status: "nenhum",
      ordem: 0, contatos: [], lembretes: [], observacoes: [], historico: [], sults: false, visitar: false, quente: id === "a",
      criado_em: agora, atualizado_em: agora }));
    const { page, context } = await openApp(env, { nuvem: n });
    assert.equal(await page.locator(".cartao .selo-quente").count(), 1);
    await page.click('.cartao:has-text("Aurora")');
    await page.waitForSelector("#painel.aberto");
    assert.equal(await page.locator("#btnQuente").isVisible(), true);
    assert.equal(await page.locator("#btnQuente").evaluate((e) => getComputedStyle(e).pointerEvents), "none");
    await page.click("#btnCancelar");
    await page.click('.cartao:has-text("Bosque")');
    await page.waitForSelector("#painel.aberto");
    assert.equal(await page.locator("#btnQuente").isVisible(), false, "hidden when off");
    await context.close();
  });

  test("on a phone the panel header fits SULTS, Quente and the close button", async () => {
    const { page, context } = await openApp(env, { leads: dados(), viewport: { width: 360, height: 780 } });
    await page.click('.cartao:has-text("Aurora")');
    await page.waitForSelector("#painel.aberto");
    await page.waitForTimeout(300);
    for (const sel of ["#btnSults", "#btnQuente", "#btnFechar"]) {
      const b = await page.locator(sel).boundingBox();
      assert.ok(b.x >= 0 && b.x + b.width <= 360, sel + " inside the screen");
    }
    assert.equal(await page.locator("#painel").evaluate((e) => e.scrollWidth <= e.clientWidth), true);
    await context.close();
  });
});
