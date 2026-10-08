// =============================================================================
// Fake Leaflet (test double), injected before the page loads.
// -----------------------------------------------------------------------------
// The real Leaflet map library is downloaded from the internet, which the tests
// block. This tiny stand-in has the same functions mapa.js calls, but instead of
// drawing it RECORDS what was drawn in window.__leaflet, so tests can check e.g.
// "the route line starts at the start point and visits the stops in this order".
// =============================================================================
(function () {
  const rec = (window.__leaflet = { groups: [], opened: [] });
  const chain = (o) => { o.addTo = (target) => { if (target && target.layers) target.layers.push(o); return o; }; return o; };
  function layerGroup() {
    const g = chain({ layers: [], clearLayers() { g.layers = []; }, addLayer(l) { g.layers.push(l); } });
    rec.groups.push(g);
    return g;
  }
  function map() {
    const handlers = {};
    return {
      setView() { return this; }, invalidateSize() {}, fitBounds() {}, closePopup() {}, removeLayer() {},
      on(ev, fn) { handlers[ev] = fn; return this; }, once() { return this; },
      getBounds() { return { contains: () => true }; },
    };
  }
  window.L = {
    map,
    layerGroup,
    control: { zoom: () => chain({}) },
    tileLayer: () => chain({}),
    circleMarker: (latlng, o) => chain({ type: "circle", latlng, o, bindPopup() { return this; } }),
    polyline: (latlngs, o) => chain({ type: "polyline", latlngs, o }),
    marker: (latlng, o) => chain({ type: "marker", latlng, o }),
    divIcon: (o) => o,
    latLngBounds: (pts) => ({ pts }),
  };
})();
