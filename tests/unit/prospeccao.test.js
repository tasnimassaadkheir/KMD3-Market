// Unit tests: Prospecção — reading the IPTU register and preparing map lookups (prospeccao.js).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp({ extra: ["prospeccao.js"] });
const P = (code) => app.json(`(() => { const P = window.Prospeccao; return ${code}; })()`);

const CAB = ["NUMERO DO CONTRIBUINTE", "ANO DO EXERCICIO", "NOME DO CONTRIBUINTE 1", "CPF/CNPJ DO CONTRIBUINTE 1",
  "NUMERO DO CONDOMINIO", "NOME DE LOGRADOURO DO IMOVEL", "NUMERO DO IMOVEL", "BAIRRO DO IMOVEL", "CEP DO IMOVEL",
  "TIPO DE USO DO IMOVEL", "QUANTIDADE DE PAVIMENTOS", "ANO DA CONSTRUCAO CORRIGIDO", "TIPO DE PADRAO DA CONSTRUCAO"];

describe("reading the CSV", () => {
  test("finds the needed columns by name (accents/case ignored) and never maps owner columns", () => {
    const m = P(`P.mapearColunas(${JSON.stringify(CAB.map((h) => h.toLowerCase()))})`);
    assert.deepEqual(m.faltando, []);
    assert.equal(m.cols.contribuinte, 0);
    assert.equal(m.cols.logradouro, 5);
    assert.equal(m.cols.uso, 9);
    assert.ok(!Object.values(m.cols).includes(2) && !Object.values(m.cols).includes(3), "owner name / CPF not used");
  });
  test("reports which required columns are missing", () => {
    assert.deepEqual(P(`P.mapearColunas(["A", "B"]).faltando`), ["contribuinte", "condominio", "logradouro", "numero", "uso"]);
  });
  test("splits fields with ';' or ',' and handles quotes", () => {
    assert.equal(P(`P.detectarSeparador("a;b;c")`), ";");
    assert.equal(P(`P.detectarSeparador("a,b,c")`), ",");
    assert.deepEqual(P(`P.separarCampos('1;"R A; B";"diz ""oi""";4', ";")`), ["1", "R A; B", 'diz "oi"', "4"]);
  });
  test("units of one building share setor + quadra + condominium number", () => {
    assert.equal(P(`P.chaveCondominio("009.012.0345-1", "01-3")`), "009012-013");
    assert.equal(P(`P.chaveCondominio("009.012.0346-1", "01-3")`), "009012-013", "another apartment, same building");
    assert.equal(P(`P.chaveCondominio("009.012.0345-1", "00-0")`), "0090120345", "no condominium: its own lot");
    assert.equal(P(`P.chaveCondominio("123", "01-3")`), null);
  });
});

describe("grouping into condominiums", () => {
  // Builds rows with the CAB columns and runs them through somarLinha + resumir.
  function resumo(linhas) {
    return P(`(() => {
      const cols = P.mapearColunas(${JSON.stringify(CAB)}).cols, g = new Map();
      ${JSON.stringify(linhas)}.forEach(l => P.somarLinha(g, l, cols));
      return P.resumir(g);
    })()`);
  }
  const linha = (sql, ano, cond, rua, num, uso, extra = {}) =>
    [sql, String(ano), "FULANO DE TAL", "123.456.789-00", cond, rua, num, extra.bairro || "VILA MARIANA", extra.cep || "04111000",
      uso, extra.pav || "", extra.anoC || "", extra.padrao || ""];
  const apto = "Apartamento em condomínio", garagem = "Garagem (unidade autônoma) em edifício em condomínio";

  test("counts apartments (not garages), keeps the latest year, needs 2+ apartments, biggest first", () => {
    const rows = [];
    for (let i = 0; i < 3; i++) rows.push(linha(`0090120${300 + i}1`, 2026, "01-3", "R DOUTOR NETO DE ARAUJO", "0320", apto, { pav: "15", anoC: "1998", padrao: "Residencial vertical, padrão C" }));
    rows.push(linha("00901203101", 2026, "01-3", "R DOUTOR NETO DE ARAUJO", "0320", garagem));
    for (let i = 0; i < 5; i++) rows.push(linha(`0100200${400 + i}1`, 2026, "02-1", "AV PAULISTA", "1000", apto, { bairro: "BELA VISTA", cep: "01310100" }));
    rows.push(linha("02003004005", 2026, "00-0", "R SOZINHA", "10", apto));                       // 1 apartment: not a condo
    rows.push(linha("03003004005", 2026, "00-0", "R DAS CASAS", "5", "Residencial horizontal"));   // a house
    for (let i = 0; i < 9; i++) rows.push(linha(`0090120${300 + i}1`, 2025, "01-3", "R DOUTOR NETO DE ARAUJO", "0320", apto)); // older year
    const r = resumo(rows);
    assert.equal(r.ano, 2026);
    assert.equal(r.linhas.length, 2);
    const [a, b] = r.linhas;
    assert.equal(a.logradouro, "Av Paulista"); assert.equal(a.apartamentos, 5); assert.equal(a.bairro, "Bela Vista"); assert.equal(a.cep, "01310-100");
    assert.equal(b.logradouro, "R Doutor Neto de Araujo"); assert.equal(b.numero, "320");
    assert.equal(b.apartamentos, 3, "garage and 2025 rows not counted");
    assert.equal(b.pavimentos, 15); assert.equal(b.ano_construcao, 1998);
    assert.equal(b.id, "009012-013");
    assert.ok(!JSON.stringify(r).includes("FULANO") && !JSON.stringify(r).includes("123.456"), "no owner data kept");
  });
});

describe("text helpers", () => {
  test("titulo() and formatarCep()", () => {
    assert.equal(P(`P.titulo("R DOUTOR NETO DE ARAUJO")`), "R Doutor Neto de Araujo");
    assert.equal(P(`P.formatarCep("04111000")`), "04111-000");
  });
  test("expandirLogradouro() writes out street types and titles for the map lookup", () => {
    assert.equal(P(`P.expandirLogradouro("R Dr Neto de Araujo")`), "Rua Doutor Neto de Araujo");
    assert.equal(P(`P.expandirLogradouro("Av Brig Faria Lima")`), "Avenida Brigadeiro Faria Lima");
    assert.equal(P(`P.expandirLogradouro("Al Santos")`), "Alameda Santos");
    assert.equal(P(`P.expandirLogradouro("Pca Pan Americana")`), "Praça Pan Americana");
    assert.equal(P(`P.expandirLogradouro("Rua Dr")`), "Rua Dr", "a title at the end is a name, not expanded");
  });
  test("consultasMapa(): street + number first, then the street alone", () => {
    assert.deepEqual(P(`P.consultasMapa({logradouro:"R Dr Neto de Araujo", numero:"320", bairro:"Vila Mariana"})`), [
      { q: "Rua Doutor Neto de Araujo, 320, São Paulo, SP, Brasil", precisao: "numero" },
      { q: "Rua Doutor Neto de Araujo, Vila Mariana, São Paulo, SP, Brasil", precisao: "rua" },
    ]);
    assert.deepEqual(P(`P.consultasMapa({logradouro:"", numero:"1"})`), []);
  });
  test("enderecoCompleto() is what goes into the new card", () => {
    assert.equal(P(`P.enderecoCompleto({logradouro:"Av Paulista", numero:"1000", bairro:"Bela Vista", cep:"01310-100"})`),
      "Avenida Paulista, 1000 - Bela Vista - São Paulo - SP - 01310-100");
  });
});
