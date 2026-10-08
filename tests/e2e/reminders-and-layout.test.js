// E2E tests: reminders (lembretes) and layout regressions (bugs that were fixed and must not return).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, localDateTime } = require("./helpers");

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
    await context.close();
  });

  test("the reminders page lists overdue reminders and 'Concluir' marks them done", async () => {
    const { page, context } = await openApp(env, {
      leads: [lead({ nome: "Atrasado", lembretes: [{ id: "l1", quando: localDateTime(-1), texto: "Ligar para o síndico", feito: false }] })],
    });
    await page.click("#btnLembretes");
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
  test("the reminder badge stays INSIDE the bell button on a laptop screen", async () => {
    // Bug fixed: below 1560px the button had a fixed width and the number spilled out.
    const { page, context } = await openApp(env, {
      viewport: { width: 1400, height: 900 },
      leads: [lead({ lembretes: [{ id: "l1", quando: localDateTime(-1), texto: "x", feito: false }] })],
    });
    await page.waitForSelector("#lemBadge:not([hidden])");
    const btn = await page.locator("#btnLembretes").boundingBox();
    const badge = await page.locator("#lemBadge").boundingBox();
    assert.ok(badge.x >= btn.x && badge.x + badge.width <= btn.x + btn.width + 0.5,
      `badge (${badge.x}-${badge.x + badge.width}) outside button (${btn.x}-${btn.x + btn.width})`);
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
