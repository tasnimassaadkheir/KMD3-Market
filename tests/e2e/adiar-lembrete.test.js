// E2E tests: "Adiar 1 dia" and "Adiar 1 semana" on reminders: on the Lembretes page (saved right away)
// and inside the condo panel (saved with "Salvar").
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, localDateTime, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const dados = () => [lead({ id: "c1", nome: "Aurora",
  lembretes: [{ id: "l1", quando: localDateTime(1, 14), texto: "Ligar para o síndico", feito: false }] })];
const salvo = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].lembretes[0]);

describe("Postpone a reminder", () => {
  test("Lembretes page: 'Adiar 1 semana' sits next to 'Adiar 1 dia' and moves it 7 days, same time, saved", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados() });
    await irPeloMenu(page, "#btnLembretes");
    await page.waitForSelector("#telaLembretes.aberta");
    const dia = page.locator('#lemPainelLista [data-lem-adiar="0"]'), semana = page.locator('#lemPainelLista [data-lem-semana="0"]');
    assert.equal((await semana.textContent()).trim(), "Adiar 1 semana");
    const a = await dia.boundingBox(), b = await semana.boundingBox();
    assert.ok(b.x > a.x || b.y > a.y, "right after 'Adiar 1 dia'");

    await semana.click();
    await page.waitForFunction(() => /Adiado para/.test(document.querySelector("#aviso").textContent));
    const l = await salvo(page);
    assert.equal(l.quando, await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 8);
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + "T14:00"; }));
    const hist = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].historico[0].o_que);
    assert.match(hist, /Lembrete adiado para/);

    await page.click('#lemPainelLista [data-lem-adiar="0"]');            // + 1 day still works
    await page.waitForFunction((q) => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].lembretes[0].quando !== q, l.quando);
    const l2 = await salvo(page);
    assert.equal(new Date(l2.quando) - new Date(l.quando), 86400000, "one more day");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("condo panel: 'Adiar 1 semana' changes the date in the form; saved only with Salvar", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    const antes = (await salvo(page)).quando;
    await page.click('#lemLista [data-lem-semana="0"]');
    assert.equal((await salvo(page)).quando, antes, "not saved yet");
    await page.click("#btnSalvar");
    await page.waitForTimeout(300);
    const depois = (await salvo(page)).quando;
    assert.equal(new Date(depois) - new Date(antes), 7 * 86400000);
    assert.equal(depois.slice(11), "14:00", "same time");
    await context.close();
  });

  test("a done reminder has no 'Adiar' buttons; on a phone the buttons still fit the card", async () => {
    const { page, context } = await openApp(env, { viewport: { width: 360, height: 780 },
      leads: [lead({ id: "c1", nome: "Aurora", lembretes: [
        { id: "l1", quando: localDateTime(1), texto: "Aberto", feito: false },
        { id: "l2", quando: localDateTime(-1), texto: "Feito", feito: true, feitoEm: new Date().toISOString() }] })] });
    await irPeloMenu(page, "#btnLembretes");
    await page.waitForSelector("#telaLembretes.aberta");
    const fora = await page.evaluate(() => [...document.querySelectorAll(".lemr")].some((c) => {
      const r = c.getBoundingClientRect();
      return [...c.querySelectorAll("button, a")].some((b) => { const q = b.getBoundingClientRect(); return q.right > r.right + 0.5 || q.left < r.left - 0.5; });
    }));
    assert.equal(fora, false);
    assert.equal(await page.locator('#lemPainelLista [data-lem-semana]').count(), 1, "only the open one");
    await context.close();
  });
});
