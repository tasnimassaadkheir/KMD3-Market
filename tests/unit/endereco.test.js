// Unit tests: the address in separate fields (separarEndereco, montarEndereco, formatarCep,
// termoRua, cepCombinaNumero).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp();
const sep = (t) => app.json(`separarEndereco(${JSON.stringify(t)})`);
const mont = (p) => app.run(`montarEndereco(${JSON.stringify(p)})`);
const vazio = { cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" };

describe("separarEndereco() — one line -> fields", () => {
  test("the app's own format, with every part", () => {
    assert.deepEqual(sep("Avenida Manoel Pedro Pimentel, 155, Bloco B - Continental - Osasco - SP - 06018-180"),
      { cep: "06018-180", rua: "Avenida Manoel Pedro Pimentel", numero: "155", complemento: "Bloco B", bairro: "Continental", cidade: "Osasco", uf: "SP" });
  });
  test("Prospecção's format and older hand-typed ones", () => {
    assert.deepEqual(sep("Rua Jaracatiá, 355 - Santo Amaro - São Paulo - SP - 05754-070"),
      { ...vazio, cep: "05754-070", rua: "Rua Jaracatiá", numero: "355", bairro: "Santo Amaro", cidade: "São Paulo", uf: "SP" });
    assert.deepEqual(sep("Av Manoel Pedro Pimentel, 155 - Osasco - SP"),
      { ...vazio, rua: "Av Manoel Pedro Pimentel", numero: "155", cidade: "Osasco", uf: "SP" });
    assert.deepEqual(sep("Rua Augusta, 100"), { ...vazio, rua: "Rua Augusta", numero: "100" });
    assert.deepEqual(sep("Rua Augusta, 100, Consolação, São Paulo, SP"),
      { ...vazio, rua: "Rua Augusta", numero: "100", bairro: "Consolação", cidade: "São Paulo", uf: "SP" });
    assert.deepEqual(sep("Rua Augusta, 100 - Consolação, São Paulo/SP, CEP 01305-000"),
      { ...vazio, cep: "01305-000", rua: "Rua Augusta", numero: "100", bairro: "Consolação", cidade: "São Paulo", uf: "SP" });
  });
  test("a lone last part is the city only when it's a known city (else the neighborhood); s/n is a number", () => {
    assert.equal(sep("Rua X, 10 - Osasco").cidade, "Osasco");
    assert.equal(sep("Rua X, 10 - Moema").bairro, "Moema");
    assert.equal(sep("Rua X, s/n - Moema").numero, "s/n");
    assert.equal(sep("Rua X, 10 - 01234567").cep, "01234-567", "CEP without the dash");
  });
  test("empty or free text: nothing breaks, the text stays in the street", () => {
    assert.deepEqual(sep(""), vazio);
    assert.deepEqual(sep(null), vazio);
    assert.equal(sep("perto do mercado").rua, "perto do mercado");
  });
});

describe("montarEndereco() — fields -> one line", () => {
  test("skips empty parts, uppercases the UF, and only writes a complete CEP", () => {
    assert.equal(mont({ rua: "Rua Augusta", numero: "100", bairro: "Consolação", cidade: "São Paulo", uf: "sp", cep: "01305000" }),
      "Rua Augusta, 100 - Consolação - São Paulo - SP - 01305-000");
    assert.equal(mont({ rua: "Rua Augusta", numero: "100" }), "Rua Augusta, 100");
    assert.equal(mont({ rua: "Rua Augusta", cep: "0130" }), "Rua Augusta", "half-typed CEP left out");
    assert.equal(mont({}), "");
  });
  test("round trip: what montarEndereco writes, separarEndereco reads back the same", () => {
    const casos = [
      { cep: "06018-180", rua: "Avenida Manoel Pedro Pimentel", numero: "155", complemento: "Torre 2", bairro: "Continental", cidade: "Osasco", uf: "SP" },
      { ...vazio, rua: "Rua Augusta", numero: "100", cidade: "São Paulo", uf: "SP" },
      { ...vazio, rua: "Rua Augusta", numero: "100", bairro: "Consolação" },
      { ...vazio, rua: "Rua Augusta", bairro: "Consolação", cidade: "São Paulo", uf: "SP", cep: "01305-000" },
    ];
    for (const p of casos) assert.deepEqual(sep(mont(p)), p, mont(p));
  });
});

describe("CEP helpers", () => {
  test("formatarCep keeps only 8 digits with the dash", () => {
    assert.equal(app.run(`formatarCep("01310100")`), "01310-100");
    assert.equal(app.run(`formatarCep("013")`), "013");
    assert.equal(app.run(`formatarCep("01310-1009999")`), "01310-100");
  });
  test("termoRua drops the street type before searching", () => {
    assert.equal(app.run(`termoRua("Rua Augusta")`), "Augusta");
    assert.equal(app.run(`termoRua("Av. Paulista")`), "Paulista");
    assert.equal(app.run(`termoRua("Avenida Manoel Pedro")`), "Manoel Pedro");
    assert.equal(app.run(`termoRua("Augusta")`), "Augusta");
  });
  test("cepCombinaNumero reads ViaCEP's number ranges", () => {
    const c = (comp, n) => app.json(`cepCombinaNumero(${JSON.stringify(comp)}, ${JSON.stringify(n)})`);
    assert.equal(c("até 600/601", "155"), true);
    assert.equal(c("até 600/601", "800"), false);
    assert.equal(c("de 602/603 ao fim", "800"), true);
    assert.equal(c("de 602/603 ao fim", "10"), false);
    assert.equal(c("de 1 a 99 - lado ímpar", "51"), true);
    assert.equal(c("de 1 a 99 - lado ímpar", "50"), false);
    assert.equal(c("lado par", "50"), true);
    assert.equal(c("de 602/603 a 1200/1201", "1201"), true, "both sides of the street");
    assert.equal(c("até 600/601", "601"), true);
    assert.equal(c("até 600/601", "603"), false);
    assert.equal(c("", "50"), null, "the CEP covers the whole street");
    assert.equal(c("até 600", ""), null, "no number typed");
  });
});
