/*
 * Lógica de la ruta, sin DOM: qué habilidades aparecen en una oferta, cuánto se piden en un
 * conjunto de ofertas y en qué orden aprenderlas (primero lo que hace falta para lo demás,
 * después lo más pedido). Las rutas base están hechas a mano y son orientativas: la gracia
 * es pegar ofertas reales para que la ruta salga de los datos.
 */
(function () {
  "use strict";

  // El patrón se busca en el texto normalizado (minúsculas, sin tildes). Los límites se comprueban
  // a mano porque \b no sirve con «c#», «.net» o «ci/cd».
  const p = (s) => new RegExp("(?<![a-z0-9])(?:" + s + ")(?![a-z0-9])");

  // semanas: estimación para alguien que empieza, a 10 horas por semana. requiere: lo que conviene
  // saber antes. recurso: documentación oficial o gratuita (no inventes URL: si dudas, sin recurso).
  const HABILIDADES = [
    { id: "git", nombre: "Git", area: "Base", semanas: 1, requiere: [], patron: p("git|github|gitlab|bitbucket"), recurso: "https://git-scm.com/book/es/v2" },
    { id: "html", nombre: "HTML", area: "Web", semanas: 2, requiere: [], patron: p("html5?"), recurso: "https://developer.mozilla.org/es/" },
    { id: "css", nombre: "CSS", area: "Web", semanas: 3, requiere: ["html"], patron: p("css3?|sass|scss|tailwind(?:css)?|bootstrap"), recurso: "https://developer.mozilla.org/es/" },
    { id: "javascript", nombre: "JavaScript", area: "Web", semanas: 6, requiere: [], patron: p("javascript|js|ecmascript|es6"), recurso: "https://es.javascript.info/" },
    { id: "typescript", nombre: "TypeScript", area: "Web", semanas: 2, requiere: ["javascript"], patron: p("typescript"), recurso: "https://www.typescriptlang.org/docs/" },
    { id: "react", nombre: "React", area: "Web", semanas: 4, requiere: ["javascript"], patron: p("react(?:\\.?js)?"), recurso: "https://es.react.dev/learn" },
    { id: "angular", nombre: "Angular", area: "Web", semanas: 5, requiere: ["typescript"], patron: p("angular(?:js)?"), recurso: "https://angular.dev/tutorials" },
    { id: "vue", nombre: "Vue", area: "Web", semanas: 4, requiere: ["javascript"], patron: p("vue(?:\\.?js)?"), recurso: "https://vuejs.org/guide/introduction.html" },
    { id: "node", nombre: "Node.js", area: "Backend", semanas: 4, requiere: ["javascript"], patron: p("node(?:\\.?js)?|express(?:\\.?js)?|nest\\.?js"), recurso: "https://nodejs.org/en/learn" },
    { id: "java", nombre: "Java", area: "Backend", semanas: 8, requiere: [], patron: p("java|j2ee|jakarta ee"), recurso: "https://dev.java/learn/" },
    { id: "spring", nombre: "Spring Boot", area: "Backend", semanas: 5, requiere: ["java"], patron: p("spring(?: ?boot| framework)?"), recurso: "https://spring.io/guides" },
    { id: "csharp", nombre: "C#", area: "Backend", semanas: 8, requiere: [], patron: p("c#|csharp"), recurso: "https://learn.microsoft.com/es-es/dotnet/" },
    { id: "dotnet", nombre: ".NET", area: "Backend", semanas: 5, requiere: ["csharp"], patron: p("\\.net|dotnet|asp\\.net|net core"), recurso: "https://learn.microsoft.com/es-es/dotnet/" },
    { id: "php", nombre: "PHP", area: "Backend", semanas: 6, requiere: [], patron: p("php"), recurso: "https://www.php.net/manual/es/" },
    { id: "laravel", nombre: "Laravel o Symfony", area: "Backend", semanas: 4, requiere: ["php"], patron: p("laravel|symfony"), recurso: "https://laravel.com/docs" },
    { id: "python", nombre: "Python", area: "Backend", semanas: 6, requiere: [], patron: p("python"), recurso: "https://docs.python.org/es/3/tutorial/" },
    { id: "django", nombre: "Django, Flask o FastAPI", area: "Backend", semanas: 4, requiere: ["python"], patron: p("django|flask|fastapi"), recurso: "https://docs.djangoproject.com/es/" },
    { id: "sql", nombre: "SQL y bases de datos", area: "Datos", semanas: 4, requiere: [], patron: p("sql|mysql|postgres(?:ql)?|oracle|sql server|mariadb|bases? de datos relacional(?:es)?"), recurso: "https://www.postgresql.org/docs/current/tutorial.html" },
    { id: "nosql", nombre: "NoSQL (MongoDB, Redis)", area: "Datos", semanas: 2, requiere: [], patron: p("nosql|mongo(?:db)?|redis|cassandra|dynamodb") },
    { id: "rest", nombre: "APIs REST", area: "Backend", semanas: 2, requiere: [], patron: p("apis? rest(?:ful)?|rest(?:ful)? apis?|restful|servicios rest|graphql") },
    { id: "testing", nombre: "Pruebas unitarias", area: "Calidad", semanas: 3, requiere: [], patron: p("testing|tests? unitarios?|pruebas unitarias|junit|jest|mockito|tdd|vitest|pytest|xunit|nunit") },
    { id: "e2e", nombre: "Pruebas automáticas (Selenium, Cypress, Playwright)", area: "Calidad", semanas: 4, requiere: ["testing"], patron: p("selenium|cypress|playwright|e2e|end to end|automatizacion de pruebas|pruebas automatizadas"), recurso: "https://playwright.dev/docs/intro" },
    { id: "linux", nombre: "Linux y terminal", area: "Sistemas", semanas: 3, requiere: [], patron: p("linux|bash|shell scripting|unix") },
    { id: "docker", nombre: "Docker", area: "DevOps", semanas: 2, requiere: ["linux"], patron: p("docker|contenedores"), recurso: "https://docs.docker.com/get-started/" },
    { id: "microservicios", nombre: "Microservicios", area: "Backend", semanas: 3, requiere: ["rest", "docker"], patron: p("microservicios?|microservices") },
    { id: "kubernetes", nombre: "Kubernetes", area: "DevOps", semanas: 4, requiere: ["docker"], patron: p("kubernetes|k8s|openshift"), recurso: "https://kubernetes.io/es/docs/tutorials/" },
    { id: "cicd", nombre: "Integración continua (CI/CD)", area: "DevOps", semanas: 2, requiere: ["git"], patron: p("ci/cd|ci cd|jenkins|github actions|gitlab ci|integracion continua|despliegue continuo|azure devops") },
    { id: "aws", nombre: "AWS", area: "Cloud", semanas: 6, requiere: ["linux"], patron: p("aws|amazon web services") },
    { id: "azure", nombre: "Azure", area: "Cloud", semanas: 6, requiere: [], patron: p("azure"), recurso: "https://learn.microsoft.com/es-es/training/azure/" },
    { id: "gcp", nombre: "Google Cloud", area: "Cloud", semanas: 6, requiere: ["linux"], patron: p("gcp|google cloud") },
    { id: "terraform", nombre: "Infraestructura como código (Terraform, Ansible)", area: "DevOps", semanas: 3, requiere: ["linux"], patron: p("terraform|ansible|infraestructura como codigo|iac"), recurso: "https://developer.hashicorp.com/terraform/tutorials" },
    { id: "redes", nombre: "Redes", area: "Sistemas", semanas: 6, requiere: [], patron: p("redes|networking|tcp/ip|cisco|ccna|vpn|firewalls?") },
    { id: "windows", nombre: "Windows Server y Active Directory", area: "Sistemas", semanas: 4, requiere: [], patron: p("windows server|active directory|directorio activo") },
    { id: "seguridad", nombre: "Ciberseguridad", area: "Sistemas", semanas: 6, requiere: ["redes", "linux"], patron: p("ciberseguridad|seguridad informatica|owasp|pentesting|siem") },
    { id: "kotlin", nombre: "Kotlin", area: "Móvil", semanas: 5, requiere: [], patron: p("kotlin"), recurso: "https://kotlinlang.org/docs/getting-started.html" },
    { id: "android", nombre: "Android", area: "Móvil", semanas: 6, requiere: ["kotlin"], patron: p("android"), recurso: "https://developer.android.com/courses" },
    { id: "compose", nombre: "Jetpack Compose", area: "Móvil", semanas: 3, requiere: ["android"], patron: p("jetpack compose"), recurso: "https://developer.android.com/jetpack/compose" },
    { id: "swift", nombre: "Swift e iOS", area: "Móvil", semanas: 8, requiere: [], patron: p("swift(?:ui)?|ios") },
    { id: "flutter", nombre: "Flutter", area: "Móvil", semanas: 6, requiere: [], patron: p("flutter|dart"), recurso: "https://docs.flutter.dev/get-started" },
    { id: "reactnative", nombre: "React Native", area: "Móvil", semanas: 4, requiere: ["react"], patron: p("react native") },
    { id: "excel", nombre: "Excel avanzado", area: "Datos", semanas: 2, requiere: [], patron: p("excel") },
    { id: "pandas", nombre: "Pandas y Jupyter", area: "Datos", semanas: 3, requiere: ["python"], patron: p("pandas|numpy|jupyter"), recurso: "https://pandas.pydata.org/docs/getting_started/index.html" },
    { id: "bi", nombre: "Power BI o Tableau", area: "Datos", semanas: 3, requiere: ["sql"], patron: p("power ?bi|tableau|looker|qlik") },
    { id: "spark", nombre: "Big data (Spark, Databricks)", area: "Datos", semanas: 5, requiere: ["python", "sql"], patron: p("spark|pyspark|databricks|hadoop|airflow") },
    { id: "ml", nombre: "Machine learning e IA", area: "Datos", semanas: 8, requiere: ["pandas"], patron: p("machine learning|aprendizaje automatico|scikit-learn|sklearn|tensorflow|pytorch|deep learning|inteligencia artificial|llms?|ia generativa"), recurso: "https://scikit-learn.org/stable/getting_started.html" },
    { id: "agile", nombre: "Scrum y metodologías ágiles", area: "Equipo", semanas: 1, requiere: [], patron: p("scrum|agile|agil(?:es)?|metodologias? agiles?|kanban|jira") },
    { id: "ingles", nombre: "Inglés técnico", area: "Equipo", semanas: 12, requiere: [], patron: p("ingles|english") },
  ];
  const POR_ID = Object.fromEntries(HABILIDADES.map((h, i) => [h.id, { ...h, orden: i }]));

  // Rutas base hechas a mano a partir de lo que se suele pedir: orientativas, no son datos.
  const ROLES = [
    { id: "frontend", nombre: "Frontend", imprescindible: ["html", "css", "javascript", "git"], importante: ["typescript", "react", "rest", "testing", "ingles"], extra: ["angular", "vue", "agile", "e2e", "cicd"] },
    { id: "backend-java", nombre: "Backend Java", imprescindible: ["java", "spring", "sql", "git", "rest"], importante: ["testing", "docker", "microservicios", "agile", "ingles"], extra: ["kubernetes", "aws", "cicd", "nosql"] },
    { id: "backend-net", nombre: "Backend .NET", imprescindible: ["csharp", "dotnet", "sql", "git", "rest"], importante: ["testing", "azure", "agile", "ingles"], extra: ["docker", "microservicios", "cicd", "angular"] },
    { id: "fullstack-js", nombre: "Full stack JavaScript", imprescindible: ["html", "css", "javascript", "node", "git", "sql"], importante: ["typescript", "react", "rest", "nosql", "testing"], extra: ["docker", "aws", "cicd", "ingles"] },
    { id: "php", nombre: "Web con PHP", imprescindible: ["html", "css", "php", "sql", "git"], importante: ["laravel", "javascript", "rest"], extra: ["docker", "vue", "testing"] },
    { id: "datos", nombre: "Análisis de datos", imprescindible: ["sql", "excel", "bi", "python"], importante: ["pandas", "ingles"], extra: ["ml", "spark", "azure"] },
    { id: "ia", nombre: "Ciencia de datos e IA", imprescindible: ["python", "sql", "pandas", "ml"], importante: ["git", "spark", "ingles"], extra: ["docker", "aws", "azure"] },
    { id: "devops", nombre: "DevOps y cloud", imprescindible: ["linux", "git", "docker", "cicd"], importante: ["kubernetes", "aws", "terraform", "python", "ingles"], extra: ["azure", "gcp", "redes"] },
    { id: "android", nombre: "Android", imprescindible: ["kotlin", "android", "git"], importante: ["compose", "rest", "testing", "ingles"], extra: ["flutter", "cicd", "agile"] },
    { id: "qa", nombre: "QA y testing", imprescindible: ["testing", "e2e", "git", "agile"], importante: ["javascript", "sql", "rest", "ingles"], extra: ["java", "python", "cicd"] },
    { id: "sistemas", nombre: "Sistemas y redes", imprescindible: ["linux", "redes", "windows"], importante: ["azure", "docker", "seguridad", "ingles"], extra: ["aws", "terraform", "python"] },
    { id: "seguridad", nombre: "Ciberseguridad", imprescindible: ["redes", "linux", "seguridad"], importante: ["python", "windows", "ingles"], extra: ["aws", "azure", "docker"] },
  ];
  const ROL_POR_ID = Object.fromEntries(ROLES.map((r) => [r.id, r]));

  const NIVELES = ["imprescindible", "importante", "base", "extra"];
  // Con ofertas reales: lo que pide la mitad o más es imprescindible; una de cada cinco, importante.
  const UMBRAL_IMPRESCINDIBLE = 0.5;
  const UMBRAL_IMPORTANTE = 0.2;
  const HORAS = [5, 10, 20, 30];
  const MAX_OFERTAS = 50;

  function normalizar(texto) {
    return String(texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
  }

  function detectar(texto) {
    const t = normalizar(texto);
    return HABILIDADES.filter((h) => h.patron.test(t)).map((h) => h.id);
  }

  // Huella sencilla para no contar dos veces la misma oferta pegada.
  function huella(texto) {
    let h = 0;
    for (const c of normalizar(texto).trim()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h.toString(36);
  }

  // Del texto solo se guarda la primera línea (para reconocerla) y lo que pide, nunca la oferta entera.
  function crearOferta(texto) {
    const primera = String(texto || "").split(/\r?\n/).map((l) => l.trim()).find(Boolean) || "Oferta";
    return { id: huella(texto), titulo: primera.length > 80 ? primera.slice(0, 77) + "…" : primera, habilidades: detectar(texto) };
  }

  function recuento(ofertas) {
    const por = {};
    for (const o of ofertas) for (const id of new Set(o.habilidades)) por[id] = (por[id] || 0) + 1;
    return { total: ofertas.length, por };
  }

  // Qué pide el puesto: de las ofertas si las hay, si no de la ruta base del rol.
  function demanda(rolId, ofertas) {
    const d = {};
    if (ofertas && ofertas.length) {
      const r = recuento(ofertas);
      for (const [id, veces] of Object.entries(r.por)) {
        const parte = veces / r.total;
        d[id] = { nivel: parte >= UMBRAL_IMPRESCINDIBLE ? "imprescindible" : parte >= UMBRAL_IMPORTANTE ? "importante" : "extra", veces, total: r.total, porcentaje: Math.round(parte * 100) };
      }
      return d;
    }
    const rol = ROL_POR_ID[rolId] || ROLES[0];
    for (const nivel of ["imprescindible", "importante", "extra"]) for (const id of rol[nivel]) d[id] = { nivel };
    return d;
  }

  function semanasPara(id, horas, experiencia) {
    // Quien ya trabaja en informática aprende antes una tecnología parecida a las que conoce.
    const factor = experiencia === "trabajo" ? 0.6 : 1;
    return Math.max(1, Math.round((POR_ID[id].semanas * 10 / horas) * factor));
  }

  function ruta({ rol, ofertas = [], sabe = [], horas = 10, experiencia = "cero" }) {
    const sabidas = new Set(sabe);
    const d = demanda(rol, ofertas);
    const pendientes = {};
    // Lo que pide el puesto y lo que hace falta para ello, parando en lo que ya sabes.
    const añadir = (id, motivoDe) => {
      if (sabidas.has(id) || !POR_ID[id]) return;
      if (!pendientes[id]) {
        pendientes[id] = d[id] ? { ...d[id], para: [] } : { nivel: "base", para: [] };
        for (const r of POR_ID[id].requiere) añadir(r, id);
      }
      if (motivoDe && !pendientes[id].para.includes(motivoDe)) pendientes[id].para.push(motivoDe);
    };
    for (const id of Object.keys(d)) añadir(id, null);

    // Un fundamento vale tanto como lo más importante que desbloquea.
    const rango = (id, visto = new Set()) => {
      if (visto.has(id)) return 9;
      visto.add(id);
      const propio = pendientes[id].nivel === "base" ? 9 : NIVELES.indexOf(pendientes[id].nivel);
      return Math.min(propio, ...pendientes[id].para.map((x) => rango(x, new Set(visto))));
    };
    const clave = (id) => [rango(id), -(pendientes[id].porcentaje || 0), POR_ID[id].orden];
    const menor = (a, b) => { const ka = clave(a), kb = clave(b); for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] < kb[i]; return false; };

    // Orden topológico: en cada paso, lo más importante de lo que ya se puede aprender.
    const orden = [];
    const quedan = new Set(Object.keys(pendientes));
    while (quedan.size) {
      let mejor = null;
      for (const id of quedan) {
        const listo = POR_ID[id].requiere.every((r) => !quedan.has(r));
        if (listo && (mejor === null || menor(id, mejor))) mejor = id;
      }
      orden.push(mejor);
      quedan.delete(mejor);
    }

    const pasos = orden.map((id) => {
      const x = pendientes[id];
      const h = POR_ID[id];
      let motivo;
      if (x.veces) motivo = `La piden ${x.veces} de ${x.total} ofertas (${x.porcentaje} %)`;
      else if (x.nivel === "base") motivo = "Hace falta para " + x.para.map((o) => POR_ID[o].nombre).join(", ");
      else motivo = { imprescindible: "Casi todas las ofertas lo piden", importante: "Lo piden muchas ofertas", extra: "Suma puntos, pero no es lo primero" }[x.nivel];
      // Un fundamento que solo sirve para extras también es extra.
      const extra = x.nivel === "extra" || (x.nivel === "base" && rango(id) >= NIVELES.indexOf("extra"));
      return { id, nombre: h.nombre, area: h.area, nivel: x.nivel, extra, motivo, semanas: semanasPara(id, horas, experiencia), recurso: h.recurso || "", porcentaje: x.porcentaje || 0 };
    });
    // Los extras van al final aunque se puedan aprender antes: primero lo que te permite optar.
    const principales = pasos.filter((s) => !s.extra);
    const extras = pasos.filter((s) => s.extra);
    const suma = (l) => l.reduce((t, s) => t + s.semanas, 0);
    const pedidas = Object.keys(d).filter((id) => POR_ID[id]);
    return {
      fuente: ofertas.length ? "ofertas" : "base",
      ofertas: ofertas.length,
      pasos: principales,
      extras,
      sabidas: pedidas.filter((id) => sabidas.has(id)).concat([...sabidas].filter((id) => POR_ID[id] && !d[id])).map((id) => ({ id, nombre: POR_ID[id].nombre })),
      semanas: suma(principales),
      semanasConExtras: suma(principales) + suma(extras),
    };
  }

  // Habilidades que tiene sentido preguntar si ya sabes: lo que pide el puesto y sus fundamentos.
  function relevantes(rolId, ofertas) {
    const vistas = new Set();
    const añadir = (id) => { if (vistas.has(id) || !POR_ID[id]) return; vistas.add(id); POR_ID[id].requiere.forEach(añadir); };
    Object.keys(demanda(rolId, ofertas)).forEach(añadir);
    return [...vistas].sort((a, b) => POR_ID[a].orden - POR_ID[b].orden);
  }

  function validarEstado(e) {
    e = e && typeof e === "object" ? e : {};
    const ofertas = {};
    if (e.ofertas && typeof e.ofertas === "object") {
      for (const r of ROLES) {
        const lista = Array.isArray(e.ofertas[r.id]) ? e.ofertas[r.id] : [];
        ofertas[r.id] = lista.filter((o) => o && typeof o.id === "string").slice(0, MAX_OFERTAS).map((o) => ({
          id: o.id, titulo: String(o.titulo || "Oferta").slice(0, 80), habilidades: (Array.isArray(o.habilidades) ? o.habilidades : []).filter((h) => POR_ID[h]),
        }));
      }
    }
    return {
      rol: ROL_POR_ID[e.rol] ? e.rol : ROLES[0].id,
      experiencia: e.experiencia === "trabajo" ? "trabajo" : "cero",
      horas: HORAS.includes(Number(e.horas)) ? Number(e.horas) : 10,
      sabe: Array.isArray(e.sabe) ? [...new Set(e.sabe.filter((h) => POR_ID[h]))] : [],
      ofertas,
    };
  }

  // Añade una oferta a la lista del rol sin repetirla. Devuelve la lista nueva y si se ha añadido.
  function añadirOferta(lista, texto) {
    if (!String(texto || "").trim()) return { lista, añadida: false, motivo: "vacia" };
    const o = crearOferta(texto);
    if (lista.some((x) => x.id === o.id)) return { lista, añadida: false, motivo: "repetida" };
    if (lista.length >= MAX_OFERTAS) return { lista, añadida: false, motivo: "llena" };
    return { lista: lista.concat(o), añadida: true, oferta: o };
  }

  function semanasTexto(n) {
    if (n < 9) return `${n} ${n === 1 ? "semana" : "semanas"}`;
    const meses = Math.round(n / 4.345);
    return `${n} semanas (unos ${meses} ${meses === 1 ? "mes" : "meses"})`;
  }

  function aTexto(r, rolNombre, horas) {
    const lineas = [`Mi ruta para ${rolNombre} (${horas} h por semana)`, ""];
    r.pasos.forEach((s, i) => lineas.push(`${i + 1}. ${s.nombre} · ${semanasTexto(s.semanas)} · ${s.motivo}`));
    if (r.extras.length) {
      lineas.push("", "Si te sobra tiempo:");
      for (const s of r.extras) lineas.push(`- ${s.nombre} · ${semanasTexto(s.semanas)}`);
    }
    lineas.push("", `Total para optar: ${semanasTexto(r.semanas)}.`);
    lineas.push(r.fuente === "ofertas" ? `Según ${r.ofertas} ofertas reales.` : "Ruta base orientativa.");
    return lineas.join("\n");
  }

  // Lo que se puede compartir con el proyecto: cuántas ofertas piden cada cosa, sin ningún texto.
  function exportarRecuento(rolId, ofertas, fecha) {
    const r = recuento(ofertas);
    return { version: 1, rol: rolId, fecha, ofertas: r.total, habilidades: r.por };
  }

  const api = { HABILIDADES, ROLES, NIVELES, HORAS, MAX_OFERTAS, normalizar, detectar, crearOferta, recuento, demanda, ruta, relevantes, validarEstado, añadirOferta, semanasTexto, aTexto, exportarRecuento, nombre: (id) => (POR_ID[id] ? POR_ID[id].nombre : id) };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else window.Ruta = api;
})();
