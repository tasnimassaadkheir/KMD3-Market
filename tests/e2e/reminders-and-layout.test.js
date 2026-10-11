// E2E tests: reminders (lembretes) and layout regressions (bugs that were fixed and must not return).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, localDateTime, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

describe("Reminders", () => {
  test("an overdue reminder turns the card red and shows a badge on the toolbar", async () => {
    const { page, context } = await openApp(env, {
      leads: [
        lead({ nome: "Atrasado", lembretes: [{ id: "l1", quando: localDateTime(-1), texto: "Ligar", feito: false }] }),
        lead({ nome: "Em dia", lembretes: [{ id: "l2", quando: localDateTime(3), texto: "Visitar", feito: false }] }),
      ],
    });
    await page.waitForSelector(".cartao.lem-vencido");
    assert.equal(await page.locator(".cartao.lem-vencido h3").textContent(), "Atrasado");
    assert.equal(await page.locator(".cartao.lem-vencido").count(), 1, "the card with a future reminder stays normal");
    assert.equal((await page.textContent("#lemBadge")).trim(), "1");
    assert.equal((await page.textContent("#menuBadge")).trim(), "1", "same count on the ☰ button");
    assert.match(await page.getAttribute("#menuBadge", "class"), /atraso/, "red, because it's overdue");
    await context.close();
  });

  test("the reminders page lists overdue reminders and 'Concluir' marks them done", async () => {
    const { page, context } = await openApp(env, {
      leads: [lead({ nome: "Atrasado", lembretes: [{ id: "l1", quando: localDateTime(-1), texto: "Ligar para o síndico", feito: false }] })],
    });
    await irPeloMenu(page, "#btnLembretes");
    await page.waitForSelector("#telaLembretes.aberta");
    assert.match(await page.textContent("#telaLembretes"), /Ligar para o síndico/);

    await page.locator("#telaLembretes [data-lem-feito]").first().click();
    await page.waitForFunction(() => !document.querySelector(".cartao.lem-vencido"));
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].lembretes[0].feito === true);
    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios")));
    assert.equal(salvo[0].lembretes[0].feito, true);
    await context.close();
  });
});

describe("Layout regressions", () => {
  test("the reminders count fits inside the 'Lembretes' menu item", async () => {
    // (Before the side menu, a bug made this number spill out of the toolbar button on laptops.)
    const { page, context } = await openApp(env, {
      viewport: { width: 1400, height: 900 },
      leads: [lead({ lembretes: [{ id: "l1", quando: localDateTime(-1), texto: "x", feito: false }] })],
    });
    await page.click("#btnMenu");
    await page.waitForSelector("#menuLateral.aberto #lemBadge:not([hidden])");
    await page.waitForTimeout(250);                       // let the slide-in animation finish
    const item = await page.locator("#btnLembretes").boundingBox();
    const badge = await page.locator("#lemBadge").boundingBox();
    assert.ok(badge.x >= item.x && badge.x + badge.width <= item.x + item.width + 0.5,
      `badge (${badge.x}-${badge.x + badge.width}) outside the item (${item.x}-${item.x + item.width})`);
    await context.close();
  });

  test("the map legend scrolls sideways with a normal mouse wheel on a wide screen", async () => {
    // Bug fixed: on big laptops with a mouse, competitors on the right were unreachable.
    const { page, context } = await openApp(env, { viewport: { width: 1900, height: 900 } });
    await page.evaluate(() => {
      document.body.classList.add("vista-mapa");
      document.querySelector("#vistaMapa").hidden = false;
      document.querySelector("#mpLegenda").innerHTML = Array.from({ length: 20 },
        (_, i) => `<button class="mp-chip"><i></i>Concorrente ${i + 1} <b>3</b></button>`).join("");
    });
    const box = await page.locator("#mpLegenda").boundingBox();
    await page.mouse.move(box.x + 100, box.y + box.height / 2);
    await page.mouse.wheel(0, 500);
    await page.waitForFunction(() => document.querySelector("#mpLegenda").scrollLeft > 0);
    await context.close();
  });

  test("on a phone the page itself never scrolls sideways", async () => {
    const { page, context } = await openApp(env, { viewport: { width: 390, height: 844 } });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `page is ${overflow}px wider than the screen`);
    await context.close();
  });
});
