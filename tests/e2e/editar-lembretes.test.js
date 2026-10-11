// E2E tests: editing reminders (date, time and text) in the condo panel and on the Lembretes page.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, localDateTime, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const salvo = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0]);
const comLembrete = (dias = 2, texto = "Ligar para o síndico") =>
  lead({ id: "c1", nome: "Aurora", lembretes: [{ id: "l1", quando: localDateTime(dias, 10), texto, feito: false }] });

describe("Editing a reminder on the Lembretes page", () => {
  test("✎ Editar opens the form with the current values; Salvar saves right away", async () => {
    const { page, context, errors } = await openApp(env, { leads: [comLembrete(2)] });
    await irPeloMenu(page, "#btnLembretes");
    await page.waitForSelector("#telaLembretes.aberta");
    await page.click('#lemPainelLista [data-lem-editar="0"]');

    const atual = localDateTime(2, 10).split("T");
    assert.equal(await page.inputValue("#lemEdData"), atual[0]);
    assert.equal(await page.inputValue("#lemEdHora"), "10:00");
    assert.equal(await page.inputValue("#lemEdTexto"), "Ligar para o síndico");
    assert.equal(await page.evaluate(() => document.activeElement.id), "lemEdTexto", "cursor in the text");

    const nova = localDateTime(5, 15).split("T")[0];
    await page.fill("#lemEdData", nova);
    await page.fill("#lemEdHora", "15:30");
    await page.fill("#lemEdTexto", "Visitar com a proposta");
    await page.click("#lemPainelLista [data-lem-salvar-ed]");

    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].lembretes[0].texto === "Visitar com a proposta");
    const l = await salvo(page);
    assert.equal(l.lembretes[0].quando, nova + "T15:30");
    assert.match(l.historico[0].o_que, /Lembrete editado/);
    assert.ok(l.lembretes[0].editadoEm, "records when it was edited");
    assert.match(await page.textContent("#lemPainelLista"), /Visitar com a proposta/);
    assert.equal(await page.locator("#lemEdData").count(), 0, "form closed");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("moving an overdue reminder to the future takes the red off the card", async () => {
    const { page, context } = await openApp(env, { leads: [comLembrete(-1)] });
    await page.waitForSelector(".cartao.lem-vencido");
    await irPeloMenu(page, "#btnLembretes");
    await page.click('#lemPainelLista [data-lem-editar="0"]');
    await page.fill("#lemEdData", localDateTime(3).split("T")[0]);
    await page.press("#lemEdTexto", "Enter");                       // Enter saves
    await page.waitForFunction(() => !document.querySelector(".cartao.lem-vencido"));
    await context.close();
  });

  test("Cancelar and Esc discard the changes (Esc doesn't close the page)", async () => {
    const { page, context } = await openApp(env, { leads: [comLembrete(2)] });
    await irPeloMenu(page, "#btnLembretes");
    await page.click('#lemPainelLista [data-lem-editar="0"]');
    await page.fill("#lemEdTexto", "texto que não deve ficar");
    await page.click("#lemPainelLista [data-lem-cancelar-ed]");
    assert.equal((await salvo(page)).lembretes[0].texto, "Ligar para o síndico");

    await page.click('#lemPainelLista [data-lem-editar="0"]');
    await page.fill("#lemEdTexto", "também não");
    await page.press("#lemEdTexto", "Escape");
    assert.equal(await page.locator("#lemEdTexto").count(), 0);
    assert.equal(await page.locator("#telaLembretes.aberta").count(), 1, "page still open");
    assert.equal((await salvo(page)).lembretes[0].texto, "Ligar para o síndico");
    await context.close();
  });

  test("an empty date is not accepted", async () => {
    const { page, context } = await openApp(env, { leads: [comLembrete(2)] });
    await irPeloMenu(page, "#btnLembretes");
    await page.click('#lemPainelLista [data-lem-editar="0"]');
    await page.fill("#lemEdData", "");
    await page.click("#lemPainelLista [data-lem-salvar-ed]");
    assert.match(await page.textContent("#aviso"), /Escolha a data/);
    assert.equal(await page.locator("#lemEdData").count(), 1, "form stays open");
    await context.close();
  });

  test("the 30-second refresh doesn't wipe what is being typed", async () => {
    const { page, context } = await openApp(env, { leads: [comLembrete(2)] });
    await irPeloMenu(page, "#btnLembretes");
    await page.click('#lemPainelLista [data-lem-editar="0"]');
    await page.fill("#lemEdTexto", "digitando...");
    await page.evaluate(() => verificarLembretes());                // what the 30s timer calls
    assert.equal(await page.inputValue("#lemEdTexto"), "digitando...");
    await context.close();
  });
});

describe("Editing a reminder inside the condo panel", () => {
  test("edits the reminder; it's saved with the panel's Salvar", async () => {
    const { page, context } = await openApp(env, { leads: [comLembrete(2)] });
    await page.click(".cartao");
    await page.click('#lemLista [data-lem-editar="0"]');
    await page.fill("#lemEdTexto", "Mandar proposta por e-mail");
    await page.fill("#lemEdHora", "08:15");
    await page.click("#lemLista [data-lem-salvar-ed]");
    assert.match(await page.textContent("#lemLista"), /Mandar proposta por e-mail/);
    assert.equal((await salvo(page)).lembretes[0].texto, "Ligar para o síndico", "not saved yet");

    await page.click("#btnSalvar");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].lembretes[0].texto === "Mandar proposta por e-mail");
    assert.match((await salvo(page)).lembretes[0].quando, /T08:15$/);
    await context.close();
  });

  test("pressing the panel's Salvar while a reminder is still in edit mode keeps the edit", async () => {
    const { page, context } = await openApp(env, { leads: [comLembrete(2)] });
    await page.click(".cartao");
    await page.click('#lemLista [data-lem-editar="0"]');
    await page.fill("#lemEdTexto", "Editado sem clicar em Salvar do lembrete");
    await page.click("#btnSalvar");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].lembretes[0].texto === "Editado sem clicar em Salvar do lembrete");
    await context.close();
  });

  test("Esc cancels the edit without closing the panel; Cancelar of the panel discards it", async () => {
    const { page, context } = await openApp(env, { leads: [comLembrete(2)] });
    await page.click(".cartao");
    await page.click('#lemLista [data-lem-editar="0"]');
    await page.fill("#lemEdTexto", "xxx");
    await page.press("#lemEdTexto", "Escape");
    assert.equal(await page.locator("#painel.aberto").count(), 1);
    assert.match(await page.textContent("#lemLista"), /Ligar para o síndico/);

    await page.click('#lemLista [data-lem-editar="0"]');
    await page.fill("#lemEdTexto", "yyy");
    await page.click("#lemLista [data-lem-salvar-ed]");
    await page.click("#btnCancelar");
    assert.equal((await salvo(page)).lembretes[0].texto, "Ligar para o síndico");
    await page.click(".cartao");
    assert.equal(await page.locator("#lemEdTexto").count(), 0, "reopens without edit mode");
    await context.close();
  });
});
