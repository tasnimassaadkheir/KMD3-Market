// E2E tests: Lembretes page, "Só os meus leads" shows ONLY the reminders of condos where the logged-in
// person is the Responsável. A reminder they created on someone else's condo doesn't count.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, criarNuvem, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const amanha = (h) => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(h, 0, 0, 0);
  const p = (n) => String(n).padStart(2, "0"); return { data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, hora: `${p(h)}:00` }; };
const agora = new Date().toISOString();
const condo = (id, nome, responsavel, lembretes) => ({ id, nome, endereco: "", aptos: 0, fase: "cadastro", status: "nenhum", ordem: 0,
  responsavel, contatos: [], observacoes: [], historico: [], lembretes, sults: false, visitar: false, criado_em: agora, atualizado_em: agora });
const lem = (id, texto, por, h) => ({ id, texto, por, feito: false, ...amanha(h) });

function nuvem() {
  const n = criarNuvem();                                   // logged in as tasnim@kmd3.com.br
  n.tabelas.equipe = [{ id: 1, nome: "Tasnim Kheir", email: "tasnim@kmd3.com.br" }, { id: 2, nome: "Karen", email: "karen@kmd3.com.br" }];
  n.tabelas.condominios = [
    condo("c1", "Aurora (minha)", "Tasnim Kheir", [lem("l1", "Ligar síndico", "Karen", 9)]),
    condo("c2", "Bosque (da Karen)", "Karen", [lem("l2", "Lembrete que eu criei", "Tasnim Kheir", 10)]),
    condo("c3", "Cedro (sem responsável)", "", [lem("l3", "Visitar", "Tasnim Kheir", 11)]),
    condo("c4", "Dália (minha, nome diferente)", " tasnim kheir ", [lem("l4", "Proposta", "Karen", 12)]),
  ];
  return n;
}
const nomes = (page) => page.locator("#lemPainelLista .lemr").evaluateAll((rs) => rs.map((r) => r.textContent));

describe("Lembretes: 'Só os meus leads'", () => {
  test("shows only condos where I'm the Responsável (not ones where I only created the reminder)", async () => {
    const { page, context, errors } = await openApp(env, { nuvem: nuvem() });
    await page.waitForSelector(".cartao");
    await irPeloMenu(page, "#btnLembretes");
    await page.waitForSelector("#telaLembretes.aberta");
    await page.waitForSelector("#lemPainelLista .lemr");                // "Todos pendentes" tab
    const antes = (await nomes(page)).join(" | ");
    for (const c of ["Aurora", "Bosque", "Cedro", "Dália"]) assert.match(antes, new RegExp(c), "all before filtering: " + c);

    await page.click("#lemSoMeus");
    await page.waitForFunction(() => !/Bosque/.test(document.querySelector("#lemPainelLista").textContent));
    const depois = (await nomes(page)).join(" | ");
    assert.match(depois, /Aurora/);
    assert.match(depois, /Dália/, "same name with other case/spaces counts as me");
    assert.doesNotMatch(depois, /Bosque/, "Karen's condo, even with a reminder I created");
    assert.doesNotMatch(depois, /Cedro/, "a condo with no responsável isn't mine");
    // the calendar follows the same filter
    assert.doesNotMatch(await page.textContent("#lemCal"), /Bosque|Cedro/);

    await page.click("#lemSoMeus");
    await page.waitForFunction(() => /Bosque/.test(document.querySelector("#lemPainelLista").textContent));
    assert.deepEqual(errors, []);
    await context.close();
  });
});
