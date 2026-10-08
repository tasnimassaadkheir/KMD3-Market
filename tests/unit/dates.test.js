// Unit tests: date helpers. "Now" is frozen at 5 Oct 2026 12:00 (São Paulo) by the loader.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp();

describe("dataBR() / dataHoraBR() — Brazilian date format", () => {
  test("formats a date as DD/MM/YYYY", () => {
    assert.equal(app.run(`dataBR("2026-03-07T10:00:00")`), "07/03/2026");
  });
  test("adds the time with 'às'", () => {
    assert.equal(app.run(`dataHoraBR("2026-03-07T09:05:00")`), "07/03/2026 às 09:05");
  });
  test("shows a dash for empty or invalid dates", () => {
    assert.equal(app.run(`dataBR("")`), "—");
    assert.equal(app.run(`dataBR("not a date")`), "—");
    assert.equal(app.run(`dataHoraBR(null)`), "—");
  });
});

describe("diasDesde() / textoDias() — 'how long ago'", () => {
  test("counts whole days since a date", () => {
    assert.equal(app.run(`diasDesde("2026-10-01T12:00:00")`), 4);
  });
  test("returns null when there is no date", () => {
    assert.equal(app.run(`diasDesde("")`), null);
  });
  test("describes days in Portuguese", () => {
    assert.equal(app.run(`textoDias(0)`), "hoje");
    assert.equal(app.run(`textoDias(1)`), "ontem");
    assert.equal(app.run(`textoDias(5)`), "há 5 dias");
    assert.equal(app.run(`textoDias(null)`), "—");
  });
});

describe("dataNoIntervalo() — registration date filter", () => {
  test("accepts everything when no range is set", () => {
    assert.equal(app.run(`dataNoIntervalo("2026-01-01T10:00:00", "", "")`), true);
  });
  test("includes both edge days of the range", () => {
    assert.equal(app.run(`dataNoIntervalo("2026-10-01T23:30:00", "2026-10-01", "2026-10-05")`), true);
    assert.equal(app.run(`dataNoIntervalo("2026-10-05T08:00:00", "2026-10-01", "2026-10-05")`), true);
  });
  test("rejects dates outside the range", () => {
    assert.equal(app.run(`dataNoIntervalo("2026-09-30T12:00:00", "2026-10-01", "")`), false);
    assert.equal(app.run(`dataNoIntervalo("2026-10-06T12:00:00", "", "2026-10-05")`), false);
  });
  test("rejects condos without a date when a range is set", () => {
    assert.equal(app.run(`dataNoIntervalo("", "2026-10-01", "")`), false);
  });
});

describe("fmtAgenda() / dataLocalInput() — calendar and input formats", () => {
  test("formats for Google Calendar / .ics", () => {
    assert.equal(app.run(`fmtAgenda(new Date("2026-10-05T09:30:00"))`), "20261005T093000");
  });
  test("formats for <input type=date>", () => {
    assert.equal(app.run(`dataLocalInput(new Date("2026-02-03T15:00:00"))`), "2026-02-03");
  });
});
