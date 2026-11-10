// E2E tests: Contatos page, "Anotação" — a notepad for each contact registered on the page (avulso),
// shown only after clicking "Anotação" on its row. Saved in contatos_avulsos (anotacao columns), or in
// this browser while those columns don't exist yet.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { setup, openApp, lead, irPeloMenu, criarNuvem } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const agora = new Date().toISOString();
const avulso = (over = {}) => ({ id: "11111111-1111-4111-8111-111111111111", nome: "Rita Síndica", telefone: "11 90000-0001", email: "", tipo: "Síndico",
  criado_por: "Karen", criado_em: agora, anotacao: null, anotacao_em: null, anotacao_por: null, ...over });
const condoComContato = () => [{ id: "c1", nome: "Aurora", endereco: "", aptos: 0, fase: "cadastro", status: "nenhum", ordem: 0,
  contatos: [{ nome: "Paulo", telefone: "11 9999", email: "", tipo: "Síndico" }], observacoes: [], historico: [], lembretes: [],
  sults: false, visitar: false, criado_em: agora, atualizado_em: agora }];
async function abrir(opts) {
  const app = await openApp(env, opts);
  await irPeloMenu(app.page, "#btnContatos");
  await app.page.waitForSelector("#telaContatos.aberta #ctCorpo tr");
  return app;
}
const ID = "11111111-1111-4111-8111-111111111111";
const botao = (page) => page.locator(`[data-ct-anotacao="${ID}"]`);

describe("Contatos: 'Anotação' of a standalone contact", () => {
  test("hidden until 'Anotação' is clicked; write, save (author + time), close; a dot marks contacts with a note", async () => {
    const n = criarNuvem();
    n.tabelas.condominios = condoComContato();
    n.tabelas.contatos_avulsos = [avulso()];
    const { page, context, errors } = await abrir({ nuvem: n });
    assert.equal(await page.locator(".ct-nota-linha").count(), 0, "hidden at first");
    assert.equal(await page.locator('#ctCorpo tr:has-text("Paulo") [data-ct-anotacao]').count(), 0, "condo contacts don't have it (their notes are in the condo)");
    assert.equal(await botao(page).getAttribute("aria-expanded"), "false");

    await botao(page).click();
    await page.waitForSelector(`#ctNota-${ID}`);
    assert.equal(await botao(page).getAttribute("aria-expanded"), "true");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("ct-nota-txt")), true, "cursor in the box");
    assert.match(await page.textContent(".ct-nota-meta"), /Ainda sem anotação/);
    await page.fill(".ct-nota-txt", "Prefere WhatsApp depois das 18h.\nAssembleia em março.");
    await page.click(`[data-ct-nota-salvar="${ID}"]`);
    await page.waitForFunction(() => /Atualizada/.test(document.querySelector(".ct-nota-meta").textContent));
    assert.match(await page.textContent(".ct-nota-meta"), /por tasnim/);
    const r = n.tabelas.contatos_avulsos[0];
    assert.equal(r.anotacao, "Prefere WhatsApp depois das 18h.\nAssembleia em março.");
    assert.equal(r.anotacao_por, "tasnim");
    assert.ok(r.anotacao_em);
    assert.equal(r.nome, "Rita Síndica", "the rest of the contact is untouched");

    await page.click(`[data-ct-nota-fechar="${ID}"]`);
    assert.equal(await page.locator(".ct-nota-linha").count(), 0);
    assert.equal(await botao(page).locator(".ct-anot-ponto").count(), 1, "dot: has a note");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.ctAnotacao), ID, "focus back on the button");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("Ctrl+Enter saves; a draft survives the search redrawing the table; the search finds text in notes; editing the contact keeps the note", async () => {
    const n = criarNuvem();
    n.tabelas.contatos_avulsos = [avulso({ anotacao: "Gosta de café", anotacao_em: agora, anotacao_por: "Karen" })];
    const { page, context } = await abrir({ nuvem: n });
    await page.fill("#ctBusca", "café");
    assert.equal(await page.locator("#ctCorpo tr:has-text('Rita')").count(), 1, "found by the note's text");
    await page.fill("#ctBusca", "");
    await botao(page).click();
    assert.equal(await page.inputValue(".ct-nota-txt"), "Gosta de café");
    assert.match(await page.textContent(".ct-nota-meta"), /por Karen/);
    await page.fill(".ct-nota-txt", "Gosta de café e pão de queijo");
    await page.fill("#ctBusca", "rita");                      // redraws the table
    assert.equal(await page.inputValue(".ct-nota-txt"), "Gosta de café e pão de queijo", "draft kept");
    await page.focus(".ct-nota-txt");
    await page.keyboard.press("Control+Enter");
    await page.waitForFunction(() => /por tasnim/.test(document.querySelector(".ct-nota-meta").textContent));
    assert.equal(n.tabelas.contatos_avulsos[0].anotacao, "Gosta de café e pão de queijo");
    // edit the contact (name) in the form: the note stays
    await page.click(`[data-ct-editar="${ID}"]`);
    await page.fill("#ct_nome", "Rita Souza");
    await page.click("#ctForm button[type=submit]");
    await page.waitForFunction(() => /Rita Souza/.test(document.querySelector("#ctCorpo").textContent));
    assert.equal(n.tabelas.contatos_avulsos[0].anotacao, "Gosta de café e pão de queijo");
    // the CSV has it
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#btnExportarContatos")]);
    assert.match(fs.readFileSync(await dl.path(), "utf8"), /"Anotação"[\s\S]*"Gosta de café e pão de queijo"/);
    await context.close();
  });

  test("erasing the text removes the note", async () => {
    const n = criarNuvem();
    n.tabelas.contatos_avulsos = [avulso({ anotacao: "Algo", anotacao_em: agora, anotacao_por: "Karen" })];
    const { page, context } = await abrir({ nuvem: n });
    await botao(page).click();
    await page.fill(".ct-nota-txt", "   ");
    await page.click(`[data-ct-nota-salvar="${ID}"]`);
    await page.waitForFunction(() => /Anotação apagada/.test(document.querySelector("#aviso").textContent));
    assert.equal(n.tabelas.contatos_avulsos[0].anotacao, null);
    assert.equal(await botao(page).locator(".ct-anot-ponto").count(), 0);
    await context.close();
  });

  test("read-only users can open and read it, but not edit", async () => {
    const n = criarNuvem(undefined, { leitor: true });
    n.tabelas.contatos_avulsos = [avulso({ anotacao: "Só leitura", anotacao_em: agora, anotacao_por: "Karen" })];
    const { page, context } = await abrir({ nuvem: n });
    assert.equal(await page.locator("[data-ct-editar], [data-ct-excluir]").count(), 0);
    await botao(page).click();
    assert.equal(await page.textContent(".ct-nota-leitura"), "Só leitura");
    assert.equal(await page.locator(".ct-nota-txt, [data-ct-nota-salvar]").count(), 0);
    await context.close();
  });

  test("before contatos_anotacao.sql is run: the contact still saves, the note stays in this browser and the page says so", async () => {
    const n = criarNuvem(undefined, { semColuna: { contatos_avulsos: ["anotacao"] } });
    const sem = avulso(); delete sem.anotacao; delete sem.anotacao_em; delete sem.anotacao_por;
    n.tabelas.contatos_avulsos = [sem];
    const { page, context, errors } = await abrir({ nuvem: n });
    await botao(page).click();
    await page.fill(".ct-nota-txt", "Nota local");
    await page.click(`[data-ct-nota-salvar="${ID}"]`);
    await page.waitForFunction(() => /contatos_anotacao\.sql/.test(document.querySelector("#aviso").textContent));
    assert.equal(n.tabelas.contatos_avulsos[0].anotacao, undefined, "nothing sent to the missing column");
    const local = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:ctAnotacoes")));
    assert.equal(Object.values(local)[0].anotacao, "Nota local");
    // still there after reloading the page
    await page.reload();
    await irPeloMenu(page, "#btnContatos").catch(() => {});
    await page.waitForSelector(`[data-ct-anotacao="${ID}"] .ct-anot-ponto`);
    // and editing the contact itself still works
    await page.click(`[data-ct-editar="${ID}"]`);
    await page.fill("#ct_nome", "Rita Nova");
    await page.click("#ctForm button[type=submit]");
    await page.waitForFunction(() => /Rita Nova/.test(document.querySelector("#ctCorpo").textContent));
    assert.equal(n.tabelas.contatos_avulsos[0].nome, "Rita Nova");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("local mode and phone layout: the notepad opens under the card and fits", async () => {
    const init = `localStorage.setItem("quitandinha:contatosAvulsos", JSON.stringify([{id:"${ID}", nome:"Rita", telefone:"11 9", email:"", tipo:"Síndico"}]));`;
    const { page, context } = await abrir({ initScript: init, viewport: { width: 360, height: 780 } });
    await botao(page).click();
    await page.fill(".ct-nota-txt", "Nota no celular");
    await page.click(`[data-ct-nota-salvar="${ID}"]`);
    await page.waitForFunction(() => /Atualizada/.test(document.querySelector(".ct-nota-meta").textContent));
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:contatosAvulsos"))[0].anotacao), "Nota no celular");
    const caixa = await page.locator(".ct-nota").boundingBox();
    assert.ok(caixa.x >= 0 && caixa.x + caixa.width <= 360, "fits the phone");
    // the name isn't covered by the buttons' cell (it used to cover it on a hovered card)
    await page.hover(`[data-ct-anotacao="${ID}"]`);
    assert.equal(await page.evaluate(() => { const b = document.querySelector('#ctCorpo td[data-label="Nome"] b'), r = b.getBoundingClientRect();
      return document.elementFromPoint(r.x + 5, r.y + r.height / 2) === b; }), true, "name visible");
    assert.equal(await page.locator("#telaContatos .tela-lem-corpo").evaluate((e) => e.scrollWidth <= e.clientWidth + 1), true);
    await context.close();
  });
});
