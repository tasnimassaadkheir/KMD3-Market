// E2E tests: Terms of Use and Privacy Policy (LGPD).
// - termos.html / privacidade.html: public pages with the company's data, an index and links between them;
// - links on the login screen and at the bottom of the ☰ menu;
// - in cloud mode, everyone accepts the current version once (saved in the login's user_metadata).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { setup, openApp, criarNuvem } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const VERSAO = fs.readFileSync(path.join(__dirname, "..", "..", "app.js"), "utf8").match(/const TERMOS_VERSAO = "([^"]+)"/)[1];
const EMPRESA = [/KMD3 MARKET COMERCIO LTDA/, /69\.659\.467\/0001-44/, /Rua Manoel Gomes Gonçalves, 605/, /Osasco\/SP/, /CEP 06162-200/, /brt3market@gmail\.com/];

describe("Legal pages", () => {
  for (const [arquivo, titulo, outro] of [["termos.html", "Termos de Uso", "privacidade.html"], ["privacidade.html", "Política de Privacidade", "termos.html"]]) {
    test(`${arquivo}: opens without logging in, with the company's data, version, a working index and links`, async () => {
      const { page, context, errors } = await openApp(env, {});
      await page.goto(env.url + arquivo);
      assert.equal(await page.textContent("h1"), titulo);
      assert.match(await page.title(), new RegExp(titulo));
      assert.match(await page.textContent(".versao"), /Versão 1\.0 · vigente desde 1º de novembro de 2026/);
      const texto = await page.textContent("main");
      for (const r of EMPRESA) assert.match(texto, r);
      // every index link points to a section on the page
      const alvos = await page.locator("nav.indice a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      assert.ok(alvos.length >= 14);
      for (const h of alvos) assert.equal(await page.locator(h).count(), 1, h);
      assert.equal(await page.getAttribute(".voltar", "href"), "./");
      assert.equal(await page.getAttribute(".topo .troca", "href"), outro);
      // no personal data of the partners (CPF / home addresses) on a public page
      assert.doesNotMatch(texto, /CPF n|36612679816|10954349180|35609667879|Hilario|Eugenia/i);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  test("the Privacy Policy names what the app really uses: providers, public data without owners, rights, small-business channel", async () => {
    const { page, context } = await openApp(env, {});
    await page.goto(env.url + "privacidade.html");
    const t = await page.textContent("main");
    for (const r of [/Supabase/, /Vercel/, /Nominatim/, /ViaCEP/, /CARTO/, /Resend/, /IPTU/, /IBGE/, /Nomes de proprietários, CPF e CNPJ nunca são lidos/,
      /art\. 18/, /15 dias/, /Resolução CD\/ANPD nº 2\/2022/, /Marco Civil/, /6 meses/, /ANPD/])
      assert.match(t, r);
    await context.close();
  });

  test("on a phone the pages fit (tables turn into cards, no sideways scroll)", async () => {
    const { page, context } = await openApp(env, { viewport: { width: 360, height: 780 } });
    for (const a of ["termos.html", "privacidade.html"]) {
      await page.goto(env.url + a);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= 361), true, a);
    }
    // the index jumps to a section without hiding its title under the fixed top bar
    await page.click('nav.indice a[href="#dados"]');
    await page.waitForTimeout(800);
    const [topo, titulo] = await page.evaluate(() => [document.querySelector(".topo").getBoundingClientRect().bottom,
      document.querySelector("#dados h2").getBoundingClientRect().top]);
    assert.ok(titulo >= topo - 1, "title visible below the top bar");
    await context.close();
  });

  test("links on the login screen and at the bottom of the ☰ menu", async () => {
    const { page, context } = await openApp(env, { nuvem: criarNuvem() });
    await page.evaluate(() => mostrarEntrada());
    assert.deepEqual(await page.locator(".entrada-legal a").evaluateAll((as) => as.map((a) => a.getAttribute("href"))), ["termos.html", "privacidade.html"]);
    await page.evaluate(() => document.querySelector("#entrada").classList.remove("aberta"));
    await page.click("#btnMenu");
    await page.waitForSelector("#menuLateral.aberto");
    const links = page.locator("#menuLateral .menu-legal-link");
    assert.deepEqual(await links.allTextContents(), ["Termos de Uso", "Política de Privacidade"]);
    assert.equal(await links.first().isVisible(), true);
    await links.first().click();
    await page.waitForURL(/termos\.html$/);
    await context.close();
  });
});

describe("Accepting the terms (cloud mode)", () => {
  test("not accepted yet: the dialog opens; 'Aceitar' only works after ticking; Esc doesn't close it; the acceptance is saved", async () => {
    const n = criarNuvem(undefined, { termosPendentes: true });
    const { page, context, errors } = await openApp(env, { nuvem: n });
    await page.waitForSelector("#termosDlg:not([hidden])");
    assert.deepEqual(await page.locator("#termosTexto a").evaluateAll((as) => as.map((a) => [a.getAttribute("href"), a.target])),
      [["termos.html", "_blank"], ["privacidade.html", "_blank"]]);
    assert.equal(await page.locator("#termosAceitar").isDisabled(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#termosDlg").isVisible(), true, "Esc doesn't close it");
    await page.click("#termosCk");
    assert.equal(await page.locator("#termosAceitar").isDisabled(), false);
    await page.click("#termosAceitar");
    await page.waitForSelector("#termosDlg", { state: "hidden" });
    assert.match(await page.textContent("#aviso"), /Termos aceitos/);
    const salvo = (n.tabelas._auth || []).find((x) => x.acao === "updateUser");
    assert.equal(salvo.data.termos_versao, VERSAO);
    assert.ok(Math.abs(Date.now() - Date.parse(salvo.data.termos_aceito_em)) < 60000, "with the date and time");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("accepted an older version: asks again; already accepted the current one: doesn't ask; local mode: doesn't ask", async () => {
    const antigo = criarNuvem({ id: "u-tasnim", email: "tasnim@kmd3.com.br", user_metadata: { termos_versao: "2020-01-01" } }, { termosPendentes: true });
    const a = await openApp(env, { nuvem: antigo });
    await a.page.waitForSelector("#termosDlg:not([hidden])");
    await a.context.close();

    const ok = await openApp(env, { nuvem: criarNuvem() });
    await ok.page.waitForSelector(".cartao, .coluna");
    await ok.page.waitForTimeout(300);
    assert.equal(await ok.page.locator("#termosDlg").isHidden(), true);
    await ok.context.close();

    const local = await openApp(env, {});
    await local.page.waitForTimeout(300);
    assert.equal(await local.page.locator("#termosDlg").isHidden(), true);
    await local.context.close();
  });

  test("if saving fails it says so and lets you try again; 'Sair' logs out", async () => {
    const n = criarNuvem(undefined, { termosPendentes: true });
    const { page, context } = await openApp(env, { nuvem: n });
    await page.waitForSelector("#termosDlg:not([hidden])");
    await page.evaluate(() => { window.__fakeAuthErro = "network"; });
    await page.click("#termosCk");
    await page.click("#termosAceitar");
    await page.waitForSelector("#termosErro:not([hidden])");
    assert.match(await page.textContent("#termosErro"), /Não consegui salvar o aceite/);
    assert.equal(await page.locator("#termosAceitar").isDisabled(), false, "can try again");
    assert.equal(await page.locator("#termosDlg").isVisible(), true);
    const recarregou = page.waitForEvent("load");
    await page.click("#termosSair");
    await recarregou;
    await context.close();
  });

  test("with a temporary password too: 'Crie sua senha' comes first (on top), then the terms", async () => {
    const n = criarNuvem({ id: "u-tasnim", email: "tasnim@kmd3.com.br", user_metadata: { trocar_senha: true } }, { termosPendentes: true });
    const { page, context } = await openApp(env, { nuvem: n });
    await page.waitForSelector("#senhaDlg:not([hidden])");
    await page.waitForSelector("#termosDlg:not([hidden])");
    const z = (s) => page.locator(s).evaluate((e) => Number(getComputedStyle(e).zIndex));
    assert.ok(await z("#senhaDlg") > await z("#termosDlg"), "password dialog on top");
    await context.close();
  });
});
