// E2E tests: the ☰ side menu with Mapa, Administração, Lembretes and Equipe.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, localDateTime } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const menuAberto = (page) => page.locator("#menuLateral").evaluate((m) => m.classList.contains("aberto"));
async function abrir(page) {
  await page.click("#btnMenu");
  await page.waitForSelector("#menuLateral.aberto");
  await page.waitForTimeout(250);   // slide-in animation
}

describe("Side menu (☰)", () => {
  test("the ☰ button is the first thing in the top bar, and the 4 buttons left the toolbar", async () => {
    const { page, context, errors } = await openApp(env);
    const menu = await page.locator("#btnMenu").boundingBox();
    const logo = await page.locator(".marca").boundingBox();
    assert.ok(menu.x < logo.x, "☰ is left of the logo");
    for (const id of ["btnVista", "btnAdmin", "btnLembretes", "btnEquipe"]) {
      assert.equal(await page.locator(`.ferramentas #${id}`).count(), 0, `${id} is no longer in the toolbar`);
      assert.equal(await page.locator(`#menuLateral #${id}`).count(), 1, `${id} is in the menu`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("opens with the items in order: Mapa, Lembretes, Equipe (Administração only for admins)", async () => {
    const { page, context } = await openApp(env);
    assert.equal(await page.getAttribute("#btnMenu", "aria-expanded"), "false");
    await abrir(page);
    assert.equal(await page.getAttribute("#btnMenu", "aria-expanded"), "true");
    const visiveis = await page.locator("#menuLateral .menu-item:visible .menu-rot").allTextContents();
    assert.deepEqual(visiveis, ["Mapa", "Lembretes", "Equipe"]);
    // order in the page, including the admin item that only admins see
    const todos = await page.locator("#menuLateral .menu-item .menu-rot").allTextContents();
    assert.deepEqual(todos, ["Mapa", "Administração", "Lembretes", "Equipe"]);
    await context.close();
  });

  test("an admin sees 'Administração' in the menu", async () => {
    const { page, context } = await openApp(env);
    await page.evaluate(() => { document.querySelector("#btnAdmin").hidden = false; });   // what verificarAdmin() does
    await abrir(page);
    assert.deepEqual(await page.locator("#menuLateral .menu-item:visible .menu-rot").allTextContents(),
      ["Mapa", "Administração", "Lembretes", "Equipe"]);
    await context.close();
  });

  test("closes with ✕, with a click outside, and with Esc (focus goes back to ☰)", async () => {
    const { page, context } = await openApp(env);
    await abrir(page); await page.click("#btnFecharMenu");
    assert.equal(await menuAberto(page), false);

    await abrir(page); await page.mouse.click(1300, 500);   // on the dark background
    assert.equal(await menuAberto(page), false);

    await abrir(page); await page.keyboard.press("Escape");
    assert.equal(await menuAberto(page), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), "btnMenu");
    await context.close();
  });

  test("while closed, the keyboard can't reach the hidden menu items", async () => {
    const { page, context } = await openApp(env);
    assert.equal(await page.locator("#menuLateral").evaluate((m) => m.inert), true);
    await abrir(page);
    assert.equal(await page.locator("#menuLateral").evaluate((m) => m.inert), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), "btnVista", "focus moves into the menu");
    await context.close();
  });

  test("'Equipe' opens the team panel and closes the menu", async () => {
    const { page, context } = await openApp(env);
    await abrir(page); await page.click("#btnEquipe");
    await page.waitForSelector("#painelEquipe.aberto");
    assert.equal(await menuAberto(page), false);
    await context.close();
  });

  test("'Lembretes' opens the reminders page; the ☰ shows the count with the menu closed", async () => {
    const { page, context } = await openApp(env, {
      leads: [lead({ lembretes: [{ id: "l1", quando: localDateTime(-1), texto: "Ligar", feito: false }] })],
    });
    await page.waitForSelector("#menuBadge:not([hidden])");
    assert.equal((await page.textContent("#menuBadge")).trim(), "1");
    await abrir(page); await page.click("#btnLembretes");
    await page.waitForSelector("#telaLembretes.aberta");
    assert.equal(await menuAberto(page), false);
    await context.close();
  });

  test("'Mapa' switches to the map, and the same item turns into 'Quadro' to go back", async () => {
    const { page, context } = await openApp(env, { fakeLeaflet: true });
    await abrir(page); await page.click("#btnVista");
    await page.waitForSelector("body.vista-mapa");
    await abrir(page);
    assert.equal(await page.textContent("#rotVista"), "Quadro");
    await page.click("#btnVista");
    await page.waitForFunction(() => !document.body.classList.contains("vista-mapa"));
    assert.equal(await page.locator(".coluna").count(), 8);
    await context.close();
  });

  test("on a phone the menu fits the screen and the page doesn't scroll sideways", async () => {
    const { page, context } = await openApp(env, { viewport: { width: 390, height: 844 } });
    await abrir(page);
    const m = await page.locator("#menuLateral").boundingBox();
    assert.ok(m.x >= 0 && m.width <= 390 * 0.85 + 1, `menu ${m.width}px wide`);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(sobra <= 1);
    await context.close();
  });
});
