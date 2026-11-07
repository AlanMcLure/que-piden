/* Interfaz: objetivo, ofertas pegadas, lo que ya sabes y la ruta como una línea de metro. */
(function () {
  "use strict";
  const R = window.Ruta;
  const $ = (id) => document.getElementById(id);
  const CLAVE = "ruta-empleo-v1";
  const EJEMPLO = "Desarrollador/a backend Java (ejemplo)\nBuscamos una persona con experiencia en Java y Spring Boot, bases de datos SQL (PostgreSQL), APIs REST y Git. Se valorará Docker, Kubernetes y AWS. Trabajamos con metodologías ágiles (Scrum). Inglés B2.";
  const MENSAJES = { vacia: "Pega primero el texto de una oferta.", repetida: "Esa oferta ya está en la lista.", llena: `Ya tienes ${R.MAX_OFERTAS} ofertas: quita alguna para añadir más.` };
  const NIVEL_TEXTO = { imprescindible: "Imprescindible", importante: "Importante", base: "Fundamento", extra: "Extra" };

  let estado = R.validarEstado({});
  let ruta = null;

  const ofertas = () => estado.ofertas[estado.rol] || [];
  const rolNombre = () => R.ROLES.find((r) => r.id === estado.rol).nombre;
  function hoy() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function el(etiqueta, clase, texto) {
    const e = document.createElement(etiqueta);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (_) { /* modo privado */ } }
  function cargar() {
    try { estado = R.validarEstado(JSON.parse(localStorage.getItem(CLAVE) || "null")); } catch (_) { /* modo privado */ }
  }

  function pintarObjetivo() {
    $("rol").replaceChildren(...R.ROLES.map((r) => Object.assign(document.createElement("option"), { value: r.id, textContent: r.nombre })));
    $("rol").value = estado.rol;
    $("horas").value = String(estado.horas);
    for (const r of document.querySelectorAll('input[name="experiencia"]')) r.checked = r.value === estado.experiencia;
  }

  function pintarOfertas() {
    $("ofertas").replaceChildren(...ofertas().map((o) => {
      const li = el("li", "oferta");
      const texto = el("div", "oferta__texto");
      texto.append(el("strong", "", o.titulo), el("span", "oferta__pide", o.habilidades.length ? o.habilidades.map(R.nombre).join(" · ") : "No hemos reconocido ninguna habilidad"));
      const quitar = el("button", "quitar", "×");
      quitar.type = "button";
      quitar.setAttribute("aria-label", "Quitar la oferta " + o.titulo);
      quitar.addEventListener("click", () => {
        estado.ofertas[estado.rol] = ofertas().filter((x) => x.id !== o.id);
        guardar();
        pintarTodo();
      });
      li.append(texto, quitar);
      return li;
    }));
  }

  function pintarSabe() {
    const sabe = new Set(estado.sabe);
    $("sabe").replaceChildren(...R.relevantes(estado.rol, ofertas()).map((id) => {
      const b = el("button", "chip-sabe", R.nombre(id));
      b.type = "button";
      b.setAttribute("aria-pressed", String(sabe.has(id)));
      b.addEventListener("click", () => alternarSabe(id));
      return b;
    }));
  }

  function alternarSabe(id) {
    if (estado.sabe.includes(id)) estado.sabe = estado.sabe.filter((x) => x !== id);
    else { estado.sabe = estado.sabe.concat(id); window.evento("ya-lo-se"); }
    guardar();
    pintarSabe();
    pintarRuta();
  }

  function parada(s, i) {
    const li = el("li", `parada parada--${s.extra && s.nivel === "base" ? "extra" : s.nivel}`);
    li.append(el("span", "parada__punto", s.extra ? "" : String(i + 1)));
    const cuerpo = el("div", "parada__cuerpo");
    const titulo = el("div", "parada__titulo");
    titulo.append(el("strong", "", s.nombre), el("span", "chip chip--" + s.nivel, NIVEL_TEXTO[s.nivel]));
    const meta = el("p", "parada__meta");
    meta.append(el("span", "semanas", R.semanasTexto(s.semanas)), document.createTextNode(" · " + s.motivo));
    const pie = el("div", "parada__pie");
    if (s.recurso) {
      const a = Object.assign(el("a", "recurso", "Por dónde empezar ↗"), { href: s.recurso, target: "_blank", rel: "noopener" });
      a.addEventListener("click", () => window.evento("recurso"));
      pie.append(a);
    }
    const ya = el("button", "boton boton--mini", "Ya lo sé");
    ya.type = "button";
    ya.addEventListener("click", () => alternarSabe(s.id));
    pie.append(ya);
    cuerpo.append(titulo, meta, pie);
    li.append(cuerpo);
    return li;
  }

  function pintarRuta() {
    ruta = R.ruta({ rol: estado.rol, ofertas: ofertas(), sabe: estado.sabe, horas: estado.horas, experiencia: estado.experiencia });
    $("pasos").replaceChildren(...ruta.pasos.map(parada));
    $("extras").replaceChildren(...ruta.extras.map(parada));
    $("bloque-extras").hidden = !ruta.extras.length;
    $("resumen").textContent = ruta.pasos.length
      ? `${ruta.pasos.length} ${ruta.pasos.length === 1 ? "parada" : "paradas"} · ${R.semanasTexto(ruta.semanas)} a ${estado.horas} h por semana`
      : "Ya tienes lo que piden 🎉";
    $("fuente").textContent = ruta.fuente === "ofertas"
      ? `Según ${ruta.ofertas} ${ruta.ofertas === 1 ? "oferta que has pegado" : "ofertas que has pegado"}${ruta.ofertas < 5 ? ". Con 5 o más será más fiable." : "."}`
      : "Ruta base orientativa. Pega ofertas reales para que salga del mercado.";
    $("fuente").classList.toggle("fuente--datos", ruta.fuente === "ofertas");
    const fin = ruta.pasos.length ? `Destino: optar a un puesto de ${rolNombre()}.` : `Ya puedes optar a ${rolNombre()}: prepara un proyecto propio que lo demuestre.`;
    $("fin").textContent = ruta.sabidas.length ? `${fin} Ya sabes: ${ruta.sabidas.map((s) => s.nombre).join(", ")}.` : fin;
    $("descargar").hidden = !ofertas().length;
  }

  function pintarTodo() { pintarOfertas(); pintarSabe(); pintarRuta(); }

  function anadir(texto) {
    const r = R.añadirOferta(ofertas(), texto);
    if (!r.añadida) { $("estado-oferta").textContent = MENSAJES[r.motivo]; return; }
    estado.ofertas[estado.rol] = r.lista;
    guardar();
    $("texto-oferta").value = "";
    $("estado-oferta").textContent = r.oferta.habilidades.length
      ? `Añadida: pide ${r.oferta.habilidades.length} ${r.oferta.habilidades.length === 1 ? "habilidad" : "habilidades"} que conocemos.`
      : "Añadida, pero no hemos reconocido ninguna habilidad. ¿Es de informática?";
    window.evento("oferta");
    pintarTodo();
  }

  $("form").addEventListener("change", () => {
    const exp = document.querySelector('input[name="experiencia"]:checked');
    estado = R.validarEstado({ ...estado, rol: $("rol").value, horas: $("horas").value, experiencia: exp ? exp.value : "cero" });
    guardar();
    $("estado-oferta").textContent = "";
    pintarTodo();
    window.evento("objetivo-" + estado.rol);
  });
  $("anadir").addEventListener("click", () => anadir($("texto-oferta").value));
  $("ejemplo").addEventListener("click", () => { $("texto-oferta").value = EJEMPLO; anadir(EJEMPLO); window.evento("ejemplo"); });

  $("copiar").addEventListener("click", async () => {
    const texto = R.aTexto(ruta, rolNombre(), estado.horas);
    try { await navigator.clipboard.writeText(texto); $("estado-ruta").textContent = "Ruta copiada. Pégala donde quieras."; }
    catch (_) { $("estado-ruta").textContent = "No se ha podido copiar: usa «Imprimir»."; }
    window.evento("copiar");
  });
  $("imprimir").addEventListener("click", () => { window.evento("imprimir"); window.print(); });
  $("descargar").addEventListener("click", () => {
    const datos = JSON.stringify(R.exportarRecuento(estado.rol, ofertas(), hoy()), null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([datos], { type: "application/json" }));
    a.download = `recuento-${estado.rol}-${hoy()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    window.evento("recuento");
  });
  $("reiniciar").addEventListener("click", () => {
    if (!confirm("¿Borrar tus ofertas, lo que has marcado y tu objetivo?")) return;
    estado = R.validarEstado({});
    guardar();
    $("estado-oferta").textContent = "";
    $("estado-ruta").textContent = "";
    pintarObjetivo();
    pintarTodo();
  });

  const repo = window.CONFIG && window.CONFIG.REPO;
  if (repo) { $("repo").href = repo; $("enlace-repo").hidden = false; }

  $("form-lista").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.consentimiento.checked) return ($("estado-lista").textContent = "Acepta la política de privacidad.");
    const endpoint = (window.CONFIG && window.CONFIG.FORM_ENDPOINT) || "";
    if (!endpoint) return ($("estado-lista").textContent = "Modo demo: falta configurar el envío (config.js).");
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email: f.email.value, rol: estado.rol, experiencia: estado.experiencia }) });
      if (!r.ok) throw new Error();
      $("estado-lista").textContent = "¡Gracias! Te avisaremos de las novedades.";
      window.evento("lista-espera");
      f.reset();
    } catch (_) {
      $("estado-lista").textContent = "No se ha podido enviar. Inténtalo más tarde.";
    }
  });

  cargar();
  pintarObjetivo();
  pintarTodo();
})();
