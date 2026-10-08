// Unit tests: the board filters (search, status, person responsible, date range).
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp();

// Sets the filter inputs (fake DOM elements) and returns the names of the condos that pass.
function filtrarCom({ busca = "", status = "", resp = "", de = "", ate = "" } = {}) {
  app.run(`$("#busca").value = ${JSON.stringify(busca)};
           $("#filtroStatus").value = ${JSON.stringify(status)};
           $("#filtroResp").value = ${JSON.stringify(resp)};
           $("#filtroDataDe").value = ${JSON.stringify(de)};
           $("#filtroDataAte").value = ${JSON.stringify(ate)};`);
  return app.json(`filtrar().map(l => l.nome)`);
}

beforeEach(() => {
  app.run(`leads = [
    {id:"1", nome:"Aurora", status:"verde", responsavel:"Ana", criadoEm:"2026-09-10T10:00:00",
     contatos:[{nome:"Paulo Síndico", telefone:"11999990000"}]},
    {id:"2", nome:"Bosque Verde", status:"amarelo", responsavel:"Bia", criadoEm:"2026-10-02T10:00:00", concorrente:"Hirota"},
    {id:"3", nome:"Mirante", responsavel:"Ana", criadoEm:"2026-10-04T10:00:00", zona:"Moema"}
  ];`);
});

describe("filtrar()", () => {
  test("no filters -> every condo", () => {
    assert.deepEqual(filtrarCom(), ["Aurora", "Bosque Verde", "Mirante"]);
  });
  test("status filter (a condo without status counts as 'nenhum')", () => {
    assert.deepEqual(filtrarCom({ status: "verde" }), ["Aurora"]);
    assert.deepEqual(filtrarCom({ status: "nenhum" }), ["Mirante"]);
  });
  test("person responsible filter", () => {
    assert.deepEqual(filtrarCom({ resp: "Ana" }), ["Aurora", "Mirante"]);
  });
  test("search is case-insensitive and looks inside contacts, zone and competitor", () => {
    assert.deepEqual(filtrarCom({ busca: "PAULO" }), ["Aurora"]);
    assert.deepEqual(filtrarCom({ busca: "moema" }), ["Mirante"]);
    assert.deepEqual(filtrarCom({ busca: "hirota" }), ["Bosque Verde"]);
  });
  test("date range filter", () => {
    assert.deepEqual(filtrarCom({ de: "2026-10-01" }), ["Bosque Verde", "Mirante"]);
    assert.deepEqual(filtrarCom({ ate: "2026-09-30" }), ["Aurora"]);
  });
  test("filters combine (AND)", () => {
    assert.deepEqual(filtrarCom({ resp: "Ana", de: "2026-10-01" }), ["Mirante"]);
  });
  test("no match -> empty list", () => {
    assert.deepEqual(filtrarCom({ busca: "does not exist" }), []);
  });
});
