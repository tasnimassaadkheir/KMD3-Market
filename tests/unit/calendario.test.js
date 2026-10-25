// Unit tests: the reminders calendar (diasDoCalendario, agruparLembretesPorDia, chaveDia).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp();

describe("diasDoCalendario()", () => {
  test("whole weeks from Sunday: October 2026 starts on a Thursday -> 5 rows, 27 Sep to 31 Oct", () => {
    const d = app.json(`diasDoCalendario(2026, 9).map(chaveDia)`);
    assert.equal(d.length, 35);
    assert.equal(d[0], "2026-09-27");
    assert.equal(d[4], "2026-10-01", "1st of October on Thursday");
    assert.equal(d[34], "2026-10-31");
  });
  test("6 rows when the month needs them (May 2026: starts Friday, 31 days)", () => {
    const d = app.json(`diasDoCalendario(2026, 4).map(chaveDia)`);
    assert.equal(d.length, 42);
    assert.equal(d[0], "2026-04-26");
    assert.equal(d[41], "2026-06-06");
  });
  test("February 2026 (starts Sunday, 28 days) fits exactly in 4 rows", () => {
    const d = app.json(`diasDoCalendario(2026, 1).map(chaveDia)`);
    assert.equal(d.length, 28);
    assert.equal(d[0], "2026-02-01"); assert.equal(d[27], "2026-02-28");
  });
});

describe("agruparLembretesPorDia()", () => {
  test("groups by local day and sorts each day by time; ignores invalid dates", () => {
    const r = app.json(`(() => {
      const t = (q, n) => ({ l: { nome: n }, lem: { quando: q }, idx: 0, c: "proximo" });
      const m = agruparLembretesPorDia([t("2026-10-25T16:00", "B"), t("2026-10-25T09:30", "A"), t("2026-10-28T10:00", "C"), t("lixo", "X")]);
      return [...m.entries()].map(([k, v]) => [k, v.map(x => x.l.nome)]);
    })()`);
    assert.deepEqual(r, [["2026-10-25", ["A", "B"]], ["2026-10-28", ["C"]]]);
  });
});
