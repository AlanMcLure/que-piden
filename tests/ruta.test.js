// Pruebas de la lógica: node tests/ruta.test.js
const assert = require("assert");
const R = require("../ruta.js");

let pasadas = 0;
function prueba(nombre, fn) { fn(); pasadas++; console.log("ok", nombre); }
const ids = (l) => l.map((s) => s.id);
const OFERTA_JAVA = "Desarrollador/a backend\nBuscamos perfil con Java y Spring Boot, bases de datos SQL (PostgreSQL), APIs REST y Git. Valorable Docker y AWS. Metodologías ágiles (Scrum). Inglés B2.";

prueba("las habilidades y los roles están bien definidos", () => {
  const vistos = new Set();
  for (const h of R.HABILIDADES) {
    assert.ok(!vistos.has(h.id), "id repetido " + h.id);
    vistos.add(h.id);
    assert.ok(h.nombre && h.semanas > 0 && h.patron instanceof RegExp, h.id);
    if (h.recurso) assert.match(h.recurso, /^https:\/\//, h.id);
  }
  // Los requisitos existen y aparecen antes en la lista: así no puede haber ciclos.
  R.HABILIDADES.forEach((h, i) => h.requiere.forEach((r) => assert.ok(R.HABILIDADES.findIndex((x) => x.id === r) < i, h.id + " → " + r)));
  for (const rol of R.ROLES) {
    const todas = [...rol.imprescindible, ...rol.importante, ...rol.extra];
    assert.strictEqual(new Set(todas).size, todas.length, rol.id + " repite habilidades");
    for (const id of todas) assert.ok(vistos.has(id), rol.id + ": " + id);
  }
});

prueba("detecta lo que pide una oferta, con tildes y sin confundir parecidos", () => {
  assert.deepStrictEqual(R.detectar(OFERTA_JAVA).sort(), ["agile", "aws", "docker", "git", "ingles", "java", "rest", "spring", "sql"]);
  // JavaScript no es Java, «excelente» no es Excel, «servicios» no es iOS y NoSQL no es SQL.
  assert.deepStrictEqual(R.detectar("Equipo excelente busca experto en JavaScript y servicios NoSQL").sort(), ["javascript", "nosql"]);
  assert.deepStrictEqual(R.detectar("Se valora C#, ASP.NET Core y CI/CD con Azure DevOps").sort(), ["azure", "cicd", "csharp", "dotnet"]);
  assert.deepStrictEqual(R.detectar("Node.js y React Native").sort(), ["javascript", "node", "react", "reactnative"]);
  assert.deepStrictEqual(R.detectar("INGLÉS alto, Python y Power BI").sort(), ["bi", "ingles", "python"]);
  assert.deepStrictEqual(R.detectar(""), []);
});

prueba("una oferta guarda su primera línea y lo que pide, no el texto entero", () => {
  const o = R.crearOferta(OFERTA_JAVA);
  assert.strictEqual(o.titulo, "Desarrollador/a backend");
  assert.ok(!JSON.stringify(o).includes("PostgreSQL"));
  assert.ok(o.habilidades.includes("spring"));
  assert.ok(R.crearOferta("x".repeat(200)).titulo.length <= 80);
});

prueba("no se cuenta dos veces la misma oferta ni se pasa del máximo", () => {
  let r = R.añadirOferta([], OFERTA_JAVA);
  assert.ok(r.añadida);
  const repetida = R.añadirOferta(r.lista, "  " + OFERTA_JAVA.toUpperCase() + "  ");
  assert.strictEqual(repetida.añadida, false);
  assert.strictEqual(repetida.motivo, "repetida");
  assert.strictEqual(R.añadirOferta(r.lista, "   ").motivo, "vacia");
  let lista = [];
  for (let i = 0; i < R.MAX_OFERTAS; i++) lista = R.añadirOferta(lista, "Oferta " + i + " con Java").lista;
  assert.strictEqual(R.añadirOferta(lista, "Una más con Python").motivo, "llena");
});

prueba("con ofertas, el nivel sale de cuántas lo piden", () => {
  let lista = [];
  for (const t of ["Java, Spring y SQL", "Java, Spring y Docker", "Java y SQL", "Java, Kotlin y Git", "Java y Spring"]) lista = R.añadirOferta(lista, t).lista;
  const d = R.demanda("frontend", lista); // el rol no cuenta cuando hay ofertas
  assert.deepStrictEqual(d.java, { nivel: "imprescindible", veces: 5, total: 5, porcentaje: 100 });
  assert.strictEqual(d.spring.nivel, "imprescindible"); // 3 de 5
  assert.strictEqual(d.sql.nivel, "importante"); // 2 de 5
  assert.strictEqual(d.docker.nivel, "importante"); // 1 de 5 = 20 %
  assert.strictEqual(d.html, undefined);
});

prueba("la ruta pone antes los fundamentos y después lo más pedido", () => {
  const r = R.ruta({ rol: "frontend" });
  assert.strictEqual(r.fuente, "base");
  const orden = ids(r.pasos);
  for (const [antes, despues] of [["html", "css"], ["javascript", "typescript"], ["javascript", "react"]]) assert.ok(orden.indexOf(antes) < orden.indexOf(despues), antes + " antes de " + despues);
  // Todo lo imprescindible va antes que lo importante.
  const ultimoImprescindible = Math.max(...["html", "css", "javascript", "git"].map((id) => orden.indexOf(id)));
  assert.ok(ultimoImprescindible < orden.indexOf("typescript"));
  // Angular necesita TypeScript, que ya está en la ruta principal; los extras van aparte.
  assert.ok(ids(r.extras).includes("angular"));
  assert.ok(!orden.includes("angular"));
});

prueba("añade lo que hace falta aunque no lo pidan, y explica para qué", () => {
  const r = R.ruta({ rol: "frontend", ofertas: R.añadirOferta([], "Buscamos React y Angular").lista });
  const js = r.pasos.find((s) => s.id === "javascript");
  assert.strictEqual(js.nivel, "base");
  assert.match(js.motivo, /Hace falta para React/);
  const ts = r.pasos.find((s) => s.id === "typescript");
  assert.match(ts.motivo, /Angular/);
  assert.match(r.pasos.find((s) => s.id === "react").motivo, /La piden 1 de 1 ofertas \(100 %\)/);
  assert.ok(ids(r.pasos).indexOf("javascript") < ids(r.pasos).indexOf("typescript"));
});

prueba("un fundamento que solo sirve para un extra va con los extras", () => {
  // Docker en 1 de 6 ofertas (17 %) es extra; Linux solo hace falta para Docker, así que también.
  let lista = [];
  for (let i = 0; i < 5; i++) lista = R.añadirOferta(lista, "React " + i).lista;
  lista = R.añadirOferta(lista, "React y Docker").lista;
  const r = R.ruta({ rol: "frontend", ofertas: lista });
  assert.ok(ids(r.extras).includes("docker") && ids(r.extras).includes("linux"));
  assert.ok(ids(r.pasos).includes("javascript") && !ids(r.pasos).includes("linux"));
  // Si Docker lo piden 1 de cada 5 (importante), Linux pasa a la ruta principal.
  const r2 = R.ruta({ rol: "frontend", ofertas: lista.slice(1) });
  assert.ok(ids(r2.pasos).includes("linux"));
});

prueba("lo que ya sabes sale de la ruta y no arrastra sus fundamentos", () => {
  const r = R.ruta({ rol: "frontend", sabe: ["react", "html"] });
  assert.ok(!ids(r.pasos).includes("react"));
  assert.ok(!ids(r.pasos).includes("html"));
  assert.ok(ids(r.pasos).includes("css")); // saber HTML no quita CSS
  assert.deepStrictEqual(r.sabidas.map((s) => s.id).sort(), ["html", "react"]);
  // Si sabes React, ya no hace falta JavaScript como fundamento para él.
  const r2 = R.ruta({ rol: "frontend", ofertas: R.añadirOferta([], "Buscamos React").lista, sabe: ["react"] });
  assert.deepStrictEqual(ids(r2.pasos), []);
});

prueba("el tiempo depende de las horas y de la experiencia", () => {
  const base = R.ruta({ rol: "backend-java", horas: 10 });
  const java = (r) => r.pasos.find((s) => s.id === "java").semanas;
  assert.strictEqual(java(base), 8);
  assert.strictEqual(java(R.ruta({ rol: "backend-java", horas: 20 })), 4);
  assert.strictEqual(java(R.ruta({ rol: "backend-java", horas: 20, experiencia: "trabajo" })), 2);
  assert.strictEqual(R.ruta({ rol: "backend-java", horas: 30, experiencia: "trabajo" }).pasos.find((s) => s.id === "git").semanas, 1); // nunca menos de una
  assert.strictEqual(base.semanas, base.pasos.reduce((t, s) => t + s.semanas, 0));
  assert.ok(base.semanasConExtras > base.semanas);
  assert.strictEqual(R.semanasTexto(1), "1 semana");
  assert.strictEqual(R.semanasTexto(26), "26 semanas (unos 6 meses)");
});

prueba("habilidades relevantes: lo pedido y sus fundamentos", () => {
  const rel = R.relevantes("frontend", R.añadirOferta([], "Angular").lista);
  assert.deepStrictEqual(rel, ["javascript", "typescript", "angular"]);
});

prueba("el estado guardado se valida", () => {
  const e = R.validarEstado({ rol: "astronauta", horas: "7", experiencia: "jefe", sabe: ["java", "java", "cobol"], ofertas: { frontend: [{ id: "a", titulo: "x", habilidades: ["react", "inventada"] }, null], raro: [{}] } });
  assert.strictEqual(e.rol, "frontend");
  assert.strictEqual(e.horas, 10);
  assert.strictEqual(e.experiencia, "cero");
  assert.deepStrictEqual(e.sabe, ["java"]);
  assert.deepStrictEqual(e.ofertas.frontend, [{ id: "a", titulo: "x", habilidades: ["react"] }]);
  assert.strictEqual(e.ofertas.raro, undefined);
  assert.deepStrictEqual(R.validarEstado(null).ofertas, {});
});

prueba("texto para copiar y recuento para compartir sin datos de las ofertas", () => {
  const lista = R.añadirOferta(R.añadirOferta([], OFERTA_JAVA).lista, "Java y Kotlin").lista;
  const r = R.ruta({ rol: "backend-java", ofertas: lista });
  const t = R.aTexto(r, "Backend Java", 10);
  assert.match(t, /^Mi ruta para Backend Java \(10 h por semana\)/);
  assert.match(t, /1\. Java · /);
  assert.match(t, /Según 2 ofertas reales\./);
  const c = R.exportarRecuento("backend-java", lista, "2026-10-31");
  assert.deepStrictEqual(Object.keys(c), ["version", "rol", "fecha", "ofertas", "habilidades"]);
  assert.strictEqual(c.ofertas, 2);
  assert.strictEqual(c.habilidades.java, 2);
  assert.ok(!JSON.stringify(c).includes("Desarrollador"));
});

console.log(`\n${pasadas} pruebas en verde`);
