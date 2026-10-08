// E2E tests: the Kanban board, the condo panel, drag and drop, filters and CSV export,
// running the real app in a real browser (Chromium) in local mode.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { setup, openApp, lead } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const coluna = (page, fase) => page.locator(`.coluna[data-fase="${fase}"]`);

describe("Board", () => {
  test("loads in local mode with the 8 funnel stages and no JavaScript errors", async () => {
    const { page, context, errors } = await openApp(env);
    assert.equal(await page.locator(".coluna").count(), 8);
    const titulos = await page.locator(".coluna h2").allTextContents();
    assert.equal(titulos[0], "Possui Concorrência");
    assert.equal(titulos[7], "Assinatura de Contrato");
    assert.match(await page.textContent("#nomeUsuario"), /Modo local/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("shows saved condos in the right column with the right counter", async () => {
    const { page, context } = await openApp(env, {
      leads: [lead({ nome: "Aurora", fase: "reuniao" }), lead({ nome: "Mirante", fase: "reuniao", ordem: 1 }), lead({ nome: "Bosque", fase: "contrato" })],
    });
    assert.equal(await coluna(page, "reuniao").locator(".contagem").textContent(), "2");
    assert.deepEqual(await coluna(page, "reuniao").locator(".cartao h3").allTextContents(), ["Aurora", "Mirante"]);
    assert.equal(await coluna(page, "contrato").locator(".cartao").count(), 1);
    await context.close();
  });
});

describe("Condo panel", () => {
  test("creates a new condo and keeps it after reloading the page", async () => {
    const { page, context, errors } = await openApp(env);
    await page.click("#btnNovo");
    await page.fill("#f_nome", "Residencial Novo Horizonte");
    await page.fill("#f_endereco", "Av. Paulista, 1000");
    await page.click("#btnSalvar");
    await page.waitForSelector("#aviso.on");
    assert.match(await page.textContent("#aviso"), /cadastrado/i);
    assert.equal(await coluna(page, "cadastro").locator(".cartao h3").textContent(), "Residencial Novo Horizonte");

    await page.reload();
    await page.waitForSelector(".cartao");
    assert.equal(await page.locator(".cartao h3").textContent(), "Residencial Novo Horizonte", "saved in localStorage");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("warns about a possible duplicate while typing a similar name", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Condomínio Jardim das Flores" })] });
    await page.click("#btnNovo");
    await page.fill("#f_nome", "Jardim Flores");
    await page.waitForSelector("#avisoNomeDuplicado:not([hidden])");
    assert.match(await page.textContent("#avisoNomeDuplicado"), /Jardim das Flores/);
    await context.close();
  });

  test("editing the status recolors the card", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora" })] });
    await page.click(".cartao");
    await page.click('label:has(input[name="status"][value="verde"])');
    await page.click("#btnSalvar");
    await page.waitForSelector(".cartao.st-verde");
    await context.close();
  });

  test("deletes a condo after confirmation", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Para Excluir" })] });
    page.on("dialog", (d) => d.accept());           // answers "OK" to the confirm() popup
    await page.click(".cartao");
    await page.click("#btnExcluir");
    await page.waitForSelector(".cartao", { state: "detached" });
    assert.equal(await page.locator(".cartao").count(), 0);
    await context.close();
  });

  test("text typed by users is shown as text, never executed (XSS protection)", async () => {
    const { page, context } = await openApp(env, {
      leads: [lead({ nome: '<img src=x onerror="window.__xss=1">', importante: "<script>window.__xss=2</script>" })],
    });
    assert.equal(await page.evaluate(() => window.__xss), undefined, "injected code must not run");
    assert.match(await page.locator(".cartao h3").textContent(), /<img src=x/);
    await context.close();
  });
});

describe("Drag and drop", () => {
  test("dragging a card to another column changes its stage and is saved", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Arrastar", fase: "cadastro" })] });
    // Drag with the real mouse: press on the card, move in small steps over the target column, release.
    const de = await page.locator(".cartao").boundingBox();
    const para = await coluna(page, "reuniao").locator(".lista").boundingBox();
    await page.mouse.move(de.x + 20, de.y + 10);
    await page.mouse.down();
    await page.mouse.move(para.x + 30, para.y + 20, { steps: 10 });
    await page.mouse.move(para.x + 40, para.y + 25, { steps: 5 });
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('.coluna[data-fase="reuniao"] .cartao'));
    assert.equal(await coluna(page, "cadastro").locator(".cartao").count(), 0);

    // Saving is asynchronous: wait until localStorage has the new stage.
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].fase === "reuniao");
    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios")));
    assert.equal(salvo[0].fase, "reuniao");
    assert.match(salvo[0].historico[0].o_que, /Reunião/, "the move is written in the history");
    await context.close();
  });
});

describe("Filters", () => {
  const dados = () => [
    lead({ nome: "Aurora", status: "verde", responsavel: "Ana" }),
    lead({ nome: "Bosque Verde", status: "amarelo", responsavel: "Bia", zona: "Moema" }),
    lead({ nome: "Mirante", responsavel: "Ana" }),
  ];

  test("search hides cards that don't match", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await page.fill("#busca", "moema");
    assert.deepEqual(await page.locator(".cartao h3").allTextContents(), ["Bosque Verde"]);
    await page.fill("#busca", "");
    assert.equal(await page.locator(".cartao").count(), 3);
    await context.close();
  });

  test("status and person responsible filters combine", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await page.selectOption("#filtroResp", "Ana");
    assert.equal(await page.locator(".cartao").count(), 2);
    await page.selectOption("#filtroStatus", "verde");
    assert.deepEqual(await page.locator(".cartao h3").allTextContents(), ["Aurora"]);
    await context.close();
  });
});

describe("CSV export", () => {
  test("downloads a CSV (Excel-friendly) with every condo", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora" }), lead({ nome: "Mirante" })] });
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#btnExportar")]);
    assert.match(download.suggestedFilename(), /\.csv$/);
    const csv = fs.readFileSync(await download.path(), "utf8");
    assert.ok(csv.startsWith("\uFEFF"), "starts with a BOM so Excel reads accents");
    assert.ok(csv.includes(";"), "uses ; as separator (Brazilian Excel)");
    assert.ok(csv.includes('"Aurora"') && csv.includes('"Mirante"'));
    await context.close();
  });
});
