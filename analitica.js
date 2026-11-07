/*
 * Analítica sin cookies (GoatCounter): solo si hay un código en config.js (ANALITICA).
 * Cuenta visitas y acciones de forma agregada, sin datos personales. evento("nombre") registra
 * una acción (por ejemplo, "partido-iniciado") para medir las hipótesis del mvp.md.
 */
(function () {
  "use strict";
  const url = window.CONFIG && window.CONFIG.ANALITICA;
  window.evento = function (nombre) {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: "evento/" + nombre, title: nombre, event: true });
      }
    } catch (_) { /* la analítica nunca debe romper la página */ }
  };
  if (!url || location.protocol === "file:") return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = url;
  document.head.appendChild(s);
})();
