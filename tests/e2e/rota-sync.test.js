// E2E tests: the visit route follows the user between devices (cloud mode, table "rotas").
// Two browser windows — a "laptop" and a "phone" — are logged in as the same person and share
// one fake Supabase database (see criarNuvem in helpers.js and fake-supabase.js).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, criarNuvem } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const agora = new Date().toISOString();
const condo = (id, nome) => ({ id, nome, endereco: "Av Manoel Pedro Pimentel, 155 - Osasco - SP", aptos: 120, fase: "cadastro",
  status: "nenhum", ordem: 0, contatos: [], lembretes: [], observacoes: [], historico: [], sults: false, visitar: false,
  criado_em: agora, atualizado_em: agora });
function nuvemCom2Condos() {
  const n = criarNuvem();
  n.tabelas.condominios = [condo("c1", "Residencial Acácias"), condo("c2", "Edifício Sol")];
  return n;
}
const LAPTOP = { width: 1400, height: 900 }, CELULAR = { width: 390, height: 844 };
const rotaLocal = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:rota") || "[]"));
// waits until something in the shared database (Node side) is true
async function esperar(fn, ms = 5000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) { if (fn()) return; await new Promise((r) => setTimeout(r, 50)); }
  throw new Error("timeout waiting for the database");
}
async function botaoRota(page, nome) {
  await page.click(`.cartao:has-text("${nome}")`);
  await page.waitForSelector("#painel.aberto");
  return page.locator("#btnRotaLead");
}

describe("Visit route synced between devices", () => {
  test("added on the laptop -> saved to the account and appears on the phone already open", async () => {
    const nuvem = nuvemCom2Condos();
    const laptop = await openApp(env, { nuvem, viewport: LAPTOP });
    const celular = await openApp(env, { nuvem, viewport: CELULAR });
    assert.deepEqual(await rotaLocal(celular.page), []);

    await (await botaoRota(laptop.page, "Residencial Acácias")).click();
    await esperar(() => (nuvem.tabelas.rotas || []).some((r) => r.rota.includes("c1")));
    const linha = nuvem.tabelas.rotas[0];
    assert.equal(linha.usuario, "u-tasnim", "saved under the logged-in person");
    assert.deepEqual(linha.rota, ["c1"]);

    // the phone gets it by itself (Realtime) and its panel shows it
    await celular.page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:rota") || "[]").includes("c1"));
    const btn = await botaoRota(celular.page, "Residencial Acácias");
    assert.match(await btn.textContent(), /Na rota, parada 1 de 1/);
    assert.deepEqual(laptop.errors.concat(celular.errors), []);
    await laptop.context.close(); await celular.context.close();
  });

  test("a phone opened later starts with the route; removing it there removes it on the laptop", async () => {
    const nuvem = nuvemCom2Condos();
    const laptop = await openApp(env, { nuvem, viewport: LAPTOP });
    await (await botaoRota(laptop.page, "Residencial Acácias")).click();
    await laptop.page.keyboard.press("Escape");
    await (await botaoRota(laptop.page, "Edifício Sol")).click();
    await esperar(() => (nuvem.tabelas.rotas || [])[0]?.rota.length === 2);

    const celular = await openApp(env, { nuvem, viewport: CELULAR });
    await celular.page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:rota") || "[]").length === 2);
    assert.deepEqual(await rotaLocal(celular.page), ["c1", "c2"], "same stops, same order");

    const btn = await botaoRota(celular.page, "Residencial Acácias");
    assert.match(await btn.textContent(), /parada 1 de 2/);
    await btn.click();                                                     // remove it on the phone
    await esperar(() => nuvem.tabelas.rotas[0].rota.length === 1);
    await laptop.page.waitForFunction(() => JSON.stringify(JSON.parse(localStorage.getItem("quitandinha:rota"))) === '["c2"]');
    await laptop.context.close(); await celular.context.close();
  });

  test("the newest change wins: an old route left on a device doesn't overwrite a newer one, and vice versa", async () => {
    // database: newer route [c1]; phone: an older local route [c2]
    const nuvem = nuvemCom2Condos();
    nuvem.tabelas.rotas = [{ usuario: "u-tasnim", rota: ["c1"], extras: {}, inicio: null, atualizado_em: "2026-10-17T12:00:00.000+00:00" }];
    const antigo = await openApp(env, { nuvem, viewport: CELULAR, initScript: () => {
      localStorage.setItem("quitandinha:rota", '["c2"]');
      localStorage.setItem("quitandinha:rotaAtualizadaEm", "2026-10-16T08:00:00.000Z");
    } });
    await antigo.page.waitForFunction(() => localStorage.getItem("quitandinha:rota") === '["c1"]');
    assert.deepEqual(nuvem.tabelas.rotas[0].rota, ["c1"], "database untouched");
    await antigo.context.close();

    // device with a NEWER local route than the database: the database gets it
    const nuvem2 = nuvemCom2Condos();
    nuvem2.tabelas.rotas = [{ usuario: "u-tasnim", rota: ["c1"], extras: {}, inicio: null, atualizado_em: "2026-10-17T12:00:00.000+00:00" }];
    const novo = await openApp(env, { nuvem: nuvem2, viewport: LAPTOP, initScript: () => {
      localStorage.setItem("quitandinha:rota", '["c2","c1"]');
      localStorage.setItem("quitandinha:rotaAtualizadaEm", "2026-10-17T13:00:00.000Z");
    } });
    await esperar(() => nuvem2.tabelas.rotas[0].rota.length === 2);
    assert.deepEqual(nuvem2.tabelas.rotas[0].rota, ["c2", "c1"]);
    await novo.context.close();
  });

  test("local mode (no database) still keeps the route in the browser, as before", async () => {
    const { page, context, errors } = await openApp(env, { leads: [{ ...condo("c1", "Residencial Acácias"), criadoEm: agora }] });
    await (await botaoRota(page, "Residencial Acácias")).click();
    assert.deepEqual(await rotaLocal(page), ["c1"]);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
