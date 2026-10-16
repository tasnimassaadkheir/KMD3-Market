// Unit tests: Prospecção.
//  - scripts/iptu.mjs: the GitHub robot that turns São Paulo's IPTU register into the list
//  - prospeccao.js: reading that list in the browser and preparing map lookups
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const path = require("node:path");
const { loadApp, ROOT } = require("../helpers/load-app");

let I, C;   // scripts/iptu.mjs and scripts/cnefe.mjs (ES modules)
before(async () => {
  I = await import(path.join(ROOT, "scripts", "iptu.mjs"));
  C = await import(path.join(ROOT, "scripts", "cnefe.mjs"));
});

const CAB = ["NUMERO DO CONTRIBUINTE", "ANO DO EXERCICIO", "NOME DO CONTRIBUINTE 1", "CPF/CNPJ DO CONTRIBUINTE 1",
  "NUMERO DO CONDOMINIO", "NOME DE LOGRADOURO DO IMOVEL", "NUMERO DO IMOVEL", "BAIRRO DO IMOVEL", "CEP DO IMOVEL",
  "TIPO DE USO DO IMOVEL", "QUANTIDADE DE PAVIMENTOS", "ANO DA CONSTRUCAO CORRIGIDO", "TIPO DE PADRAO DA CONSTRUCAO"];
const APTO = "Apartamento em condomínio", GARAGEM = "Garagem (unidade autônoma) em edifício em condomínio";
const linha = (sql, ano, cond, rua, num, uso, extra = {}) =>
  [sql, String(ano), "FULANO DE TAL", "123.456.789-00", cond, rua, num, extra.bairro || "VILA MARIANA", extra.cep || "04111000",
    uso, extra.pav || "", extra.anoC || "", extra.padrao || ""];
// n apartments of one building: SQLs setorQuadra + lot 1000.. + digit
const predio = (setorQuadra, n, ano, cond, rua, num, extra) =>
  Array.from({ length: n }, (_, i) => linha(`${setorQuadra}${1000 + i}1`, ano, cond, rua, num, APTO, extra));

describe("robot: reading the IPTU CSV (scripts/iptu.mjs)", () => {
  test("finds the needed columns by name (accents/case ignored) and never maps owner columns", () => {
    const m = I.mapearColunas(CAB.map((h) => h.toLowerCase()));
    assert.deepEqual(m.faltando, []);
    assert.equal(m.cols.contribuinte, 0);
    assert.equal(m.cols.logradouro, 5);
    assert.equal(m.cols.uso, 9);
    assert.ok(!Object.values(m.cols).includes(2) && !Object.values(m.cols).includes(3), "owner name / CPF not used");
    assert.deepEqual(I.mapearColunas(["A", "B"]).faltando, ["contribuinte", "condominio", "logradouro", "numero", "uso"]);
  });
  test("splits fields with ';' or ',' and handles quotes", () => {
    assert.equal(I.detectarSeparador("a;b;c"), ";");
    assert.equal(I.detectarSeparador("a,b,c"), ",");
    assert.deepEqual(I.separarCampos('1;"R A; B";"diz ""oi""";4', ";"), ["1", "R A; B", 'diz "oi"', "4"]);
  });
  test("units of one building share setor + quadra + condominium number", () => {
    assert.equal(I.chaveCondominio("009.012.0345-1", "01-3"), "009012-013");
    assert.equal(I.chaveCondominio("009.012.0346-1", "01-3"), "009012-013");
    assert.equal(I.chaveCondominio("009.012.0345-1", "00-0"), "0090120345", "no condominium: its own lot");
    assert.equal(I.chaveCondominio("123", "01-3"), null);
  });
  test("text helpers", () => {
    assert.equal(I.titulo("R DOUTOR NETO DE ARAUJO"), "R Doutor Neto de Araujo");
    assert.equal(I.formatarCep("04111000"), "04111-000");
  });
  test("download link is the one GeoSampa builds", () => {
    assert.equal(I.urlArquivo("IPTU_2026.zip"),
      "https://download.geosampa.prefeitura.sp.gov.br/PaginasPublicas/downloadArquivo.aspx?orig=DownloadCamadas&arq=12_Cadastro%5C%5CIPTU_INTER%5C%5CXLS_CSV%5C%5CIPTU_2026&arqTipo=XLS_CSV");
  });
});

describe("robot: grouping into buildings", () => {
  function resumo(linhas, minimo) {
    const cols = I.mapearColunas(CAB).cols, g = new Map();
    linhas.forEach((l) => I.somarLinha(g, l, cols));
    return I.resumir(g, minimo);
  }
  test("counts apartments (not garages), keeps the latest year, minimum size, biggest first, compact format", () => {
    const rows = [
      ...predio("009012", 12, 2026, "01-3", "R DOUTOR NETO DE ARAUJO", "0320", { pav: "15", anoC: "1998", padrao: "Residencial vertical, padrão C" }),
      linha("00901290001", 2026, "01-3", "R DOUTOR NETO DE ARAUJO", "0320", GARAGEM),
      ...predio("010020", 15, 2026, "02-1", "AV PAULISTA", "1000", { bairro: "BELA VISTA", cep: "01310100", padrao: "Residencial vertical, padrão C" }),
      ...predio("020030", 5, 2026, "03-1", "R PEQUENA", "10", {}),                        // 5 apartments: below the minimum
      linha("03003004005", 2026, "00-0", "R DAS CASAS", "5", "Residencial horizontal"),    // a house
      ...predio("009012", 40, 2025, "01-3", "R DOUTOR NETO DE ARAUJO", "0320", {}),       // older year
    ];
    const r = resumo(rows, 10);
    assert.equal(r.ano, 2026);
    assert.equal(r.total, 2);
    assert.deepEqual(r.campos, ["id", "logradouro", "numero", "bairro", "cep", "apartamentos", "pavimentos", "ano_construcao", "padrao"]);
    assert.deepEqual(r.padroes, ["Residencial vertical, padrão C"], "each standard listed once");
    assert.deepEqual(r.linhas, [
      ["010020-021", "Av Paulista", "1000", "Bela Vista", "01310-100", 15, null, null, 0],
      ["009012-013", "R Doutor Neto de Araujo", "320", "Vila Mariana", "04111-000", 12, 15, 1998, 0],
    ]);
    assert.ok(!JSON.stringify(r).includes("FULANO") && !JSON.stringify(r).includes("123.456"), "no owner data kept");
  });
  test("neighborhood = the one most apartments say, ignoring values like 'TORRE 1'", () => {
    const rows = [
      ...predio("009012", 3, 2026, "01-3", "R A", "1", { bairro: "TORRE 1" }),
      ...predio("009013", 0, 2026, "01-3", "R A", "1", {}),
    ];
    // same building (setor+quadra 009012, condominium 01-3): 3 say "TORRE 1", 8 say "VILA MARIANA", 2 say "MOEMA"
    rows.push(...Array.from({ length: 8 }, (_, i) => linha(`009012${2000 + i}1`, 2026, "01-3", "R A", "1", APTO, { bairro: "VILA MARIANA" })));
    rows.push(...Array.from({ length: 2 }, (_, i) => linha(`009012${3000 + i}1`, 2026, "01-3", "R A", "1", APTO, { bairro: "MOEMA" })));
    assert.equal(resumo(rows, 10).linhas[0][3], "Vila Mariana");
    // other junk seen in the real file is never picked, even when it's the majority
    for (const lixo of ["E 1 VAGA", "E VAGA TR.34842/13", "BLOCO B", "ED SOLAR", "2 VAGAS", "APTO 12"]) {
      const r = [...predio("009012", 11, 2026, "01-3", "R A", "1", { bairro: lixo }),
        linha("00901220001", 2026, "01-3", "R A", "1", APTO, { bairro: "PERDIZES" })];
      assert.equal(resumo(r, 10).linhas[0][3], "Perdizes", lixo);
    }
  });
  test("reads a whole Latin-1 CSV stream, as the GeoSampa file comes", async () => {
    const csv = [CAB.join(";"), ...predio("009012", 11, 2026, "01-3", "R SÃO JOÃO", "5", { bairro: "CONSOLAÇÃO" }).map((l) => l.join(";"))].join("\r\n");
    const r = await I.resumirStream(Readable.from([Buffer.from(csv, "latin1")]));
    assert.equal(r.linhasLidas, 11);
    assert.deepEqual(r.linhas.map((l) => [l[1], l[3], l[5]]), [["R São João", "Consolação", 11]]);
  });
  test("a CSV without the IPTU columns is refused", async () => {
    await assert.rejects(I.resumirStream(Readable.from([Buffer.from("nome;telefone\nAna;1199\n")])), /Colunas não encontradas/);
  });
});

describe("robot: neighboring cities from the IBGE Census (scripts/cnefe.mjs)", () => {
  const CAB = "COD_UNICO_ENDERECO;COD_UF;COD_MUNICIPIO;CEP;DSC_LOCALIDADE;NOM_TIPO_SEGLOGR;NOM_TITULO_SEGLOGR;NOM_SEGLOGR;NUM_ENDERECO;" +
    "NOM_COMP_ELEM1;VAL_COMP_ELEM1;LATITUDE;LONGITUDE;COD_ESPECIE;COD_TIPO_ESPECI";
  const ap = (i, cep, tipo, titulo, nome, num, bairro, lat, lng, esp = "103") =>
    [i, 35, 3534401, cep, bairro, tipo, titulo, nome, num, "APARTAMENTO", i, lat, lng, 1, esp].join(";");
  test("apartments at the same CEP + street + number are one building, with its mean position and most common neighborhood", async () => {
    const linhas = [CAB];
    for (let i = 0; i < 12; i++) linhas.push(ap(i, "06160180", "RUA", "", "JUAN VICENTE", "482", i < 9 ? "BANDEIRAS" : "JARDIM", -23.55 - i * 0.0001, -46.81));
    for (let i = 0; i < 11; i++) linhas.push(ap(100 + i, "06010170", "AVENIDA", "PRESIDENTE", "JOAO GOULART", "48", "UMUARAMA", -23.5567, -46.7765));
    for (let i = 0; i < 5; i++) linhas.push(ap(200 + i, "06010170", "RUA", "", "PEQUENA", "1", "CENTRO", -23.5, -46.7));      // too small
    for (let i = 0; i < 30; i++) linhas.push(ap(300 + i, "06010170", "RUA", "", "DAS CASAS", "1", "CENTRO", -23.5, -46.7, "101")); // houses
    const r = await C.resumirCnefe(Readable.from([Buffer.from(linhas.join("\r\n"), "latin1")]), "Osasco");
    assert.equal(r.linhasLidas, 58);
    assert.deepEqual(r.campos, ["id", "logradouro", "numero", "bairro", "cep", "apartamentos", "lat", "lng"]);
    assert.equal(r.total, 2);
    const [a, b] = r.linhas;
    assert.deepEqual(a.slice(0, 6), ["3534401-06160180-482-ruajuanvicente", "Rua Juan Vicente", "482", "Bandeiras", "06160-180", 12]);
    assert.ok(Math.abs(a[6] - -23.55055) < 1e-6 && a[7] === -46.81, "mean position");
    assert.equal(b[1], "Avenida Presidente Joao Goulart", "street type + title + name");
  });
  test("joins cities into one file, each row pointing to its city", () => {
    const um = (cidade, n) => ({ cidade, ano: 2022, total: 1, minimoAptos: 10, linhas: [["id-" + cidade, "Rua A", "1", "B", "06000-000", n, -23.5, -46.8]] });
    const j = C.juntar([um("Osasco", 50), um("Barueri", 80)]);
    assert.deepEqual(j.cidades.map((c) => c.nome), ["Osasco", "Barueri"]);
    assert.equal(j.campos.at(-1), "cidade");
    assert.deepEqual(j.linhas.map((l) => [l[0], l.at(-1)]), [["id-Barueri", 1], ["id-Osasco", 0]], "biggest first");
  });
});

describe("page: reading the list and preparing map lookups (prospeccao.js)", () => {
  const app = loadApp({ extra: ["prospeccao.js"] });
  const P = (code) => app.json(`(() => { const P = window.Prospeccao; return ${code}; })()`);
  test("lerLista() turns the compact file into searchable buildings", () => {
    const lista = P(`P.lerLista({ano: 2026, campos: ["id","logradouro","numero","bairro","cep","apartamentos","pavimentos","ano_construcao","padrao"],
      padroes: ["Residencial vertical, padrão C"], linhas: [["009012-013","R Dr Neto de Araujo","320","Vila Mariana","04111-000",250,20,1998,0]]})`);
    assert.equal(lista.length, 1);
    const l = lista[0];
    assert.equal(l.apartamentos, 250);
    assert.equal(l.padrao, "Residencial vertical, padrão C");
    assert.equal(l.ano_iptu, 2026);
    assert.ok(l.busca.includes("rua doutor neto de araujo") && l.busca.includes("04111000") && l.busca.includes("vila mariana"),
      "can be found by the written-out street name, CEP without dash and neighborhood");
  });
  test("lerLista() of the neighboring cities: city name, source, and the position already filled in", () => {
    const l = P(`P.lerLista({ano: 2022, cidades: [{nome: "Osasco", total: 1}], campos: ["id","logradouro","numero","bairro","cep","apartamentos","lat","lng","cidade"],
      linhas: [["3534401-x","Rua Juan Vicente","482","Bandeiras","06160-180",2641,-23.559,-46.816,0]]})[0]`);
    assert.equal(l.cidade, "Osasco");
    assert.equal(l.fonte, "Censo 2022 – IBGE");
    assert.deepEqual([l.lat, l.lng, l.geo_precisao], [-23.559, -46.816, "numero"]);
    assert.ok(l.geo_em, "marked as located, so it's never looked up");
    assert.equal(l.regiao, "", "São Paulo zones don't apply");
    assert.ok(l.busca.includes("osasco"));
    assert.equal(P(`P.enderecoCompleto(${JSON.stringify(l)})`), "Rua Juan Vicente, 482 - Bandeiras - Osasco - SP - 06160-180");
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
  test("regiaoPorCep(): region of São Paulo by CEP", () => {
    const casos = [["01310-100", "centro"], ["01451-000", "centro"], ["02011-000", "norte"], ["03015-000", "leste"],
      ["08260-000", "leste"], ["04111-000", "sul"], ["05754-070", "sul"], ["05860-000", "sul"], ["05001-000", "oeste"],
      ["05422-000", "oeste"], ["06000-000", ""], ["", ""], ["123", ""]];
    for (const [cep, reg] of casos) assert.equal(P(`P.regiaoPorCep(${JSON.stringify(cep)})`), reg, cep);
  });
  test("enderecoCompleto() is what goes into the new card", () => {
    assert.equal(P(`P.enderecoCompleto({logradouro:"Av Paulista", numero:"1000", bairro:"Bela Vista", cep:"01310-100"})`),
      "Avenida Paulista, 1000 - Bela Vista - São Paulo - SP - 01310-100");
  });
});
