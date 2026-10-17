// Unit tests: which copy of the visit route wins when two devices disagree (mapa.js).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp({ extra: ["mapa.js"] });
const decidir = (a, b) => app.run(`window.__rota.decidir(${JSON.stringify(a)}, ${JSON.stringify(b)})`);

describe("route sync: the most recent change wins", () => {
  test("the database copy is newer -> use it", () => {
    assert.equal(decidir("2026-10-17T10:00:00.000Z", "2026-10-17T10:05:00.000+00:00"), "remota");
  });
  test("this device changed it later -> send it", () => {
    assert.equal(decidir("2026-10-17T10:06:00.000Z", "2026-10-17T10:05:00.000+00:00"), "local");
  });
  test("same moment written in different formats (what the database returns) -> nothing to do", () => {
    assert.equal(decidir("2026-10-17T10:05:00.123Z", "2026-10-17T10:05:00.123+00:00"), "igual");
  });
  test("a device that never had a route takes the database one", () => {
    assert.equal(decidir("", "2026-10-17T10:05:00.000+00:00"), "remota");
    assert.equal(decidir("", ""), "igual");
  });
});
