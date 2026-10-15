// E2E tests: the Dashboard page (☰ → Dashboard): numbers of the whole funnel.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const diaISO = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
const LEADS = () => [
  lead({ id: "a", nome: "Aurora", aptos: 150, fase: "contato", status: "amarelo", responsavel: "Tasnim",
    contatos: [{ nome: "Paulo", telefone: "11999990000", tipo: "Síndico" }], concorrente: "Market4u", fimContrato: diaISO(40) }),
  lead({ id: "b", nome: "Mirante", aptos: 220, fase: "reuniao", status: "amarelo", responsavel: "Karen", concorrente: "market4U" }),
  lead({ id: "c", nome: "Jardins", aptos: 420, fase: "contrato", status: "verde", responsavel: "Tasnim" }),
  lead({ id: "d", nome: "Sem Nada", aptos: "", fase: "futura", status: "nenhum" }),
];
async function abrir(page) {
  await irPeloMenu(page, "#btnDashboard");
  await page.waitForSelector("#telaDashboard.aberta");
}
const linha = (page, rotulo) => page.locator(".db-barra", { hasText: rotulo }).first();

describe("Dashboard page", () => {
  test("shows the totals: condos, stages, size, contacts, competitors", async () => {
    const { page, context, errors } = await openApp(env, { leads: LEADS() });
    await abrir(page);
    const kpis = await page.locator(".db-kpi").allInnerTexts();
    assert.match(kpis[0], /^4\s+condomínios/);
    assert.match(kpis[1], /790\s+apartamentos no funil/);
    assert.ok(kpis.some((k) => /^1\s+com contato/.test(k)), "only Aurora has a phone/e-mail");
    assert.ok(kpis.some((k) => /^1\s+sem nenhuma informação/.test(k)));
    assert.match(await linha(page, "Contato Realizado").innerText(), /1\s+25%/);
    assert.match(await linha(page, "Assembleia").innerText(), /0\s+0%/);
    const tam = await page.locator(".db-tam strong").allTextContents();
    assert.deepEqual(tam, ["1", "1", "1", "1"], "P, M (220 counts as M), G, sem nº");
    assert.match(await linha(page, "Market4u").innerText(), /2\s+50%/, "grouped ignoring case");
    assert.match(await linha(page, "Sem concorrente").innerText(), /2\s+50%/);
    assert.match(await page.locator(".db-lista", { hasText: "Aurora" }).innerText(), /Market4u · vence em 40d/);
    assert.match(await page.locator(".db-lista", { hasText: "Sem Nada" }).innerText(), /Sem Nada/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("clicking a situation, a person or a competitor closes the page and filters the board", async () => {
    const { page, context } = await openApp(env, { leads: LEADS() });
    await abrir(page);
    await linha(page, "Em andamento").click();
    assert.equal(await page.locator("#telaDashboard.aberta").count(), 0);
    assert.equal(await page.inputValue("#filtroStatus"), "amarelo");
    assert.equal(await page.locator(".cartao").count(), 2);

    await page.selectOption("#filtroStatus", "");
    await abrir(page);
    await linha(page, "Karen").click();
    assert.equal(await page.inputValue("#filtroResp"), "Karen");
    assert.equal(await page.locator(".cartao").count(), 1);

    await page.selectOption("#filtroResp", "");
    await abrir(page);
    await linha(page, "Market4u").click();
    assert.equal(await page.inputValue("#busca"), "Market4u");
    assert.equal(await page.locator(".cartao").count(), 2);
    await context.close();
  });

  test("clicking a condo name opens its panel on top; Esc closes the panel, then the page", async () => {
    const { page, context } = await openApp(env, { leads: LEADS() });
    await abrir(page);
    await page.click('.db-lista button:has-text("Sem Nada")');
    await page.waitForSelector("#painel.aberto");
    assert.equal(await page.inputValue("#f_nome"), "Sem Nada");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#painel.aberto").count(), 0);
    assert.equal(await page.locator("#telaDashboard.aberta").count(), 1, "still on the dashboard");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#telaDashboard.aberta").count(), 0);
    await context.close();
  });

  test("updates when a condo changes, and '← Voltar ao quadro' closes it", async () => {
    const { page, context } = await openApp(env, { leads: LEADS() });
    await abrir(page);
    await page.click('.db-lista button:has-text("Sem Nada")');
    await page.waitForSelector("#painel.aberto");
    await page.fill("#f_aptos", "500");
    await page.click("#btnSalvar");
    await page.waitForFunction(() => !document.querySelector("#painel").classList.contains("aberto"));
    assert.deepEqual(await page.locator(".db-tam strong").allTextContents(), ["1", "1", "2", "0"]);
    await page.click("#btnFecharDashboard");
    assert.equal(await page.locator("#telaDashboard.aberta").count(), 0);
    await context.close();
  });

  test("empty funnel shows a hint, and the page fits a phone screen", async () => {
    const vazio = await openApp(env, { leads: [] });
    await abrir(vazio.page);
    assert.match(await vazio.page.textContent("#dbConteudo"), /Nenhum condomínio cadastrado ainda/);
    await vazio.context.close();

    const { page, context } = await openApp(env, { leads: LEADS(), viewport: { width: 390, height: 844 } });
    await abrir(page);
    const larguras = await page.locator("#telaDashboard .tela-lem-corpo").evaluate((e) => [e.scrollWidth, e.clientWidth]);
    assert.ok(larguras[0] <= larguras[1], "no sideways scroll");
    await context.close();
  });
});
