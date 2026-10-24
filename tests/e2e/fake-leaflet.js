// =============================================================================
// Fake Leaflet (test double), injected before the page loads.
// -----------------------------------------------------------------------------
// The real Leaflet map library is downloaded from the internet, which the tests
// block. This tiny stand-in has the same functions mapa.js calls, but instead of
// drawing it RECORDS what was drawn in window.__leaflet, so tests can check e.g.
// "the route line starts at the start point and visits the stops in this order".
// =============================================================================
(function () {
  const rec = (window.__leaflet = { groups: [], opened: [], mapas: {},
    // opens a popup like Leaflet does: its HTML goes into the page, then the map's "popupopen" runs.
    // __leaflet.abrirPopup("prMapa", html) -> the popup element (closed again by map.closePopup()).
    abrirPopup(idMapa, html) {
      const m = rec.mapas[idMapa]; const el = document.createElement("div");
      el.className = "fake-popup"; el.innerHTML = html; m.popupAberto = el;
      el.style.cssText = "position:fixed;top:120px;left:420px;z-index:9999;background:#fff;padding:12px 18px;width:300px";
      document.body.appendChild(el);
      if (m.handlers.popupopen) m.handlers.popupopen({ popup: { getElement: () => el } });
      return el;
    } });
  const chain = (o) => { o.addTo = (target) => { if (target && target.layers) target.layers.push(o); return o; }; return o; };
  function layerGroup() {
    const g = chain({ layers: [], clearLayers() { g.layers = []; }, addLayer(l) { g.layers.push(l); } });
    rec.groups.push(g);
    return g;
  }
  function map(id) {
    const handlers = {};
    const reg = (rec.mapas[typeof id === "string" ? id : (id && id.id) || "mapa"] = { handlers, popupAberto: null });
    return {
      setView() { return this; }, invalidateSize() {}, fitBounds() {}, removeLayer() {},
      closePopup() { if (reg.popupAberto) { reg.popupAberto.remove(); reg.popupAberto = null; } },
      on(ev, fn) { handlers[ev] = fn; return this; }, once() { return this; },
      getBounds() { return { contains: () => true, ...(rec.bounds || { getSouth: () => -90, getNorth: () => 90, getWest: () => -180, getEast: () => 180 }) }; },
    };
  }
  window.L = {
    map,
    layerGroup,
    control: { zoom: () => chain({}) },
    tileLayer: () => chain({}),
    circleMarker: (latlng, o) => chain({ type: "circle", latlng, o,
      bindPopup(html) { this.popup = html; return this; }, openPopup() { rec.opened.push(this); return this; } }),
    polyline: (latlngs, o) => chain({ type: "polyline", latlngs, o }),
    marker: (latlng, o) => chain({ type: "marker", latlng, o }),
    divIcon: (o) => o,
    latLngBounds: (pts) => ({ pts }),
  };
})();
