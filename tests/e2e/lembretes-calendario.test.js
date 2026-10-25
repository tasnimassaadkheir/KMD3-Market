// E2E tests: the reminders page as a calendar, and the team notepad (Bloco de notas) beside it.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, localDateTime, irPeloMenu, criarNuvem } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const chave = (dias) => { const d = new Date(); d.setDate(d.getDate() + dias);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const dados = () => [
  lead({ id: "a", nome: "Residencial Acácias", responsavel: "Karen", lembretes: [
    { id: "1", quando: localDateTime(0, 9), texto: "Ligar para o síndico", feito: false },
    { id: "2", quando: localDateTime(0, 23), texto: "Mandar proposta", feito: false }] }),
  lead({ id: "b", nome: "Edifício Sol", responsavel: "Bia", lembretes: [
    { id: "3", quando: localDateTime(0, 15), texto: "Visita", feito: false },
    { id: "4", quando: localDateTime(0, 16), texto: "Café", feito: false },
    { id: "5", quando: localDateTime(35, 10), texto: "Daqui a um mês", feito: false }] }),
];
async function abrirLembretes(page) {
  await irPeloMenu(page, "#btnLembretes");
  await page.waitForSelector("#telaLembretes.aberta #lemCal .lem-cal-dia");
}
const dia = (page, k) => page.locator(`.lem-cal-dia[data-lem-dia="${k}"]`);

describe("Reminders calendar", () => {
  test("opens on this month; today is marked and shows its reminders (time + condo, by status), '+N mais' when many", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados() });
    await abrirLembretes(page);
    const mes = await page.evaluate(() => { const t = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); return t.charAt(0).toUpperCase() + t.slice(1); });
    assert.equal(await page.textContent(".lem-cal-titulo"), mes);
    assert.deepEqual(await page.locator(".lem-cal-sem").allTextContents(), ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]);
    const hoje = dia(page, chave(0));
    assert.match(await hoje.getAttribute("class"), /\bhoje\b/);
    const chips = await hoje.locator(".lem-cal-chip").allTextContents();
    assert.deepEqual(chips, ["09:00 Residencial Acácias", "15:00 Edifício Sol", "16:00 Edifício Sol"], "first 3, by time");
    assert.equal((await hoje.locator(".lem-cal-mais").textContent()).trim(), "+1 mais");
    assert.match(await hoje.getAttribute("aria-label"), /4 lembretes/);
    assert.match(await hoje.locator(".lem-cal-chip").first().getAttribute("class"), /c-(atrasado|hoje)/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("clicking a day lists only that day's reminders (no tabs); clicking again or 'Ver todos' brings the list back", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await abrirLembretes(page);
    await dia(page, chave(0)).click();
    assert.equal(await page.locator("#lemAbas").isHidden(), true);
    assert.match(await page.textContent("#lemDiaCab"), /4 lembretes/);
    assert.equal(await page.locator("#lemPainelLista .lemr").count(), 4);
    assert.equal(await dia(page, chave(0)).getAttribute("aria-pressed"), "true");
    // the usual buttons work in the day list
    await page.locator("#lemPainelLista .lemr").first().locator("[data-lem-feito]").click();
    await page.waitForFunction(() => document.querySelectorAll("#lemPainelLista .lemr.feito").length === 1);
    assert.equal(await page.locator("#lemPainelLista .lemr").count(), 4, "done ones stay in the day list");

    await page.click("[data-lem-dia-limpar]");
    assert.equal(await page.locator("#lemAbas").isVisible(), true);
    assert.equal(await page.locator("#lemDiaCab").isHidden(), true);
    await dia(page, chave(0)).click();
    await dia(page, chave(0)).click();                                 // same day again = back to all
    assert.equal(await page.locator("#lemAbas").isVisible(), true);
    await context.close();
  });

  test("‹ › change the month; 'Hoje' comes back and selects today; 'Só os meus leads' also filters the calendar", async () => {
    const { page, context } = await openApp(env, { leads: dados(), equipe: [{ id: 1, nome: "Karen", email: "" }] });
    await abrirLembretes(page);
    const futuro = chave(35);
    if (!(await dia(page, futuro).count())) {
      await page.click('[data-lem-mes="1"]');
      if (!(await dia(page, futuro).count())) await page.click('[data-lem-mes="1"]');
    }
    assert.deepEqual(await dia(page, futuro).locator(".lem-cal-chip").allTextContents(), ["10:00 Edifício Sol"]);
    await page.click('[data-lem-mes="0"]');
    assert.equal(await dia(page, chave(0)).getAttribute("aria-pressed"), "true", "today selected");
    assert.match(await page.textContent("#lemDiaCab"), /4 lembretes/);
    await page.click("[data-lem-dia-limpar]");
    // only my leads (meuNome = "" in local mode -> everything is mine): checking still keeps the page working
    await page.check("#lemSoMeus");
    assert.ok(await dia(page, chave(0)).locator(".lem-cal-chip").count() >= 1);
    await context.close();
  });

  test("on a phone the days show colored dots instead of text, and nothing sticks out", async () => {
    const { page, context } = await openApp(env, { leads: dados(), viewport: { width: 360, height: 780 } });
    await abrirLembretes(page);
    const hoje = dia(page, chave(0));
    assert.equal(await hoje.locator(".lem-cal-chip").first().isVisible(), false);
    assert.equal(await hoje.locator(".lem-cal-pontos i").count(), 4);
    assert.equal(await page.locator("#telaLembretes .tela-lem-corpo").evaluate((e) => e.scrollWidth <= e.clientWidth + 1), true);
    const c = await page.locator("#lemCal").boundingBox();
    assert.ok(c.x >= 0 && c.x + c.width <= 360);
    await context.close();
  });
});

describe("Team notepad (Bloco de notas)", () => {
  test("local mode: add (button or Ctrl+Enter), newest first with author and time; edit and delete", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados() });
    await abrirLembretes(page);
    assert.match(await page.textContent("#notasLista"), /Nenhuma nota ainda/);
    await page.fill("#notaTexto", "Levar material novo para o Acácias");
    await page.click("#notaAdd");
    await page.waitForSelector("#notasLista .nota");
    await page.fill("#notaTexto", "Reunião sexta\nàs 9h");
    await page.focus("#notaTexto"); await page.keyboard.press("Control+Enter");
    await page.waitForFunction(() => document.querySelectorAll("#notasLista .nota").length === 2);
    assert.deepEqual(await page.locator("#notasLista .nota-texto").allTextContents(), ["Reunião sexta\nàs 9h", "Levar material novo para o Acácias"]);
    assert.equal(await page.inputValue("#notaTexto"), "", "box cleared");
    // edit
    await page.locator("#notasLista .nota").nth(1).locator("[data-nota-editar]").click();
    await page.fill("#notaEditarTexto", "Levar material novo (2 caixas)");
    await page.click("[data-nota-salvar]");
    await page.waitForFunction(() => /2 caixas/.test(document.querySelector("#notasLista").textContent));
    assert.match(await page.locator("#notasLista .nota").nth(1).locator(".nota-meta").textContent(), /\(editada\)/);
    // delete
    page.once("dialog", (d) => d.accept());
    await page.locator("#notasLista .nota").first().locator("[data-nota-excluir]").click();
    await page.waitForFunction(() => document.querySelectorAll("#notasLista .nota").length === 1);
    // kept after closing and opening the page
    await page.click("#btnFecharLembretes");
    await abrirLembretes(page);
    await page.waitForFunction(() => document.querySelectorAll("#notasLista .nota").length === 1);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("cloud: notes are shared; only the author edits; another user can't edit or delete it (unless admin); read-only users only read", async () => {
    const agora = new Date().toISOString();
    const n = criarNuvem();
    n.tabelas.notas_equipe = [{ id: "n-karen", texto: "Nota da Karen", por: "Karen", por_id: "u-karen", criado_em: agora }];
    const { page, context } = await openApp(env, { nuvem: n });
    await abrirLembretes(page);
    await page.waitForSelector("#notasLista .nota");
    assert.equal(await page.locator('[data-nota="n-karen"] [data-nota-editar]').count(), 0, "not my note: no edit");
    assert.equal(await page.locator('[data-nota="n-karen"] [data-nota-excluir]').count(), 0, "not admin: no delete");
    await page.fill("#notaTexto", "Minha nota"); await page.click("#notaAdd");
    await page.waitForFunction(() => document.querySelectorAll("#notasLista .nota").length === 2);
    const minha = n.tabelas.notas_equipe.find((x) => x.texto === "Minha nota");
    assert.equal(minha.por_id, "u-tasnim"); assert.equal(minha.por, "tasnim");
    assert.equal(await page.locator(`[data-nota="${minha.id}"] [data-nota-editar]`).count(), 1, "my note: edit");
    assert.equal(await page.locator("#notasAviso").isHidden(), true);
    await context.close();

    // an admin can delete anyone's note
    const adm = criarNuvem(undefined, { rpc: { sou_admin: true, sou_super: false, admin_organizacoes: [], admin_membros: [] } });
    adm.tabelas.notas_equipe = [{ id: "n-karen", texto: "Nota da Karen", por: "Karen", por_id: "u-karen", criado_em: agora }];
    const a = await openApp(env, { nuvem: adm });
    await a.page.waitForSelector("#btnAdmin:not([hidden])", { state: "attached" });
    await abrirLembretes(a.page);
    await a.page.waitForSelector('[data-nota="n-karen"] [data-nota-excluir]');
    assert.equal(await a.page.locator('[data-nota="n-karen"] [data-nota-editar]').count(), 0, "…but not edit it");
    await a.context.close();

    // read-only: reads, no form, no buttons
    const lt = criarNuvem(undefined, { leitor: true });
    lt.tabelas.notas_equipe = [{ id: "n1", texto: "Leia isto", por: "Karen", por_id: "u-tasnim", criado_em: agora }];
    const r = await openApp(env, { nuvem: lt });
    await abrirLembretes(r.page);
    await r.page.waitForSelector("#notasLista .nota");
    assert.equal(await r.page.locator("#notaForm").isHidden(), true);
    assert.equal(await r.page.locator("#notasLista button").count(), 0);
    await r.context.close();
  });

  test("cloud without the table yet: notes are kept in this browser and the page says what's missing", async () => {
    const n = criarNuvem(undefined, { semTabela: ["notas_equipe"] });
    const { page, context, errors } = await openApp(env, { nuvem: n });
    await abrirLembretes(page);
    await page.waitForSelector("#notasAviso:not([hidden])");
    assert.match(await page.textContent("#notasAviso"), /notas_equipe\.sql/);
    await page.fill("#notaTexto", "Nota local"); await page.click("#notaAdd");
    await page.waitForSelector("#notasLista .nota");
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:notas")).length), 1);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
