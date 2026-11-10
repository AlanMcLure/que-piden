# AGENTS.md

Guía para agentes de código que trabajen en **Qué piden** (idea 19, ronda 5). El nombre es provisional. Producto, enfoque e hipótesis en **`mvp.md`**.

**Estado:** hecha (31/10/2026). Es un proyecto **abierto para la comunidad, sin ánimo de lucro**: no añadas anuncios, afiliación ni enlaces patrocinados. Repositorio público: https://github.com/AlanMcLure/que-piden (separado el 10/11/2026 del repositorio de proyectos, con su historial). Falta publicar y revisar las rutas base con gente del sector.

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html`, `styles.css`, `app.js` | Objetivo (puesto, punto de partida, horas), ofertas pegadas, «lo que ya sabes», la ruta como línea de metro, copiar, imprimir, descargar el recuento y el formulario de novedades |
| `ruta.js` | Lógica pura: `HABILIDADES` (id, nombre, semanas a 10 h, `requiere`, `patron`, `recurso`), `ROLES` (rutas base), `detectar`, `crearOferta`, `añadirOferta`, `demanda`, `ruta`, `relevantes`, `validarEstado`, `aTexto`, `exportarRecuento` |
| `tests/ruta.test.js` | 13 pruebas de la lógica |
| `config.js` | Lo habitual y `REPO` (vacío = no se enseña el enlace para colaborar) |
| `fuentes/` | JetBrains Mono y Public Sans (OFL) |

## Cómo funciona la ruta

- **Con ofertas** (las del puesto elegido): el nivel sale del porcentaje de ofertas que piden cada cosa (≥ 50 % imprescindible, ≥ 20 % importante, el resto extra). El rol no cuenta.
- **Sin ofertas**: la ruta base del rol (`ROLES`), hecha a mano y **orientativa**. No la presentes como datos.
- Se añaden los fundamentos (`requiere`) aunque no los pidan, y se para en lo que ya sabes. El orden es topológico; entre lo que ya se puede aprender va primero lo más importante (un fundamento vale tanto como lo que desbloquea), luego lo más pedido. Lo extra, y los fundamentos que solo sirven para extras, van aparte al final.

## Diseño

Plano de metro: cada habilidad es una parada y el color de la línea es la prioridad (rojo imprescindible, azul importante, verde fundamento, ocre extra con línea discontinua). Titulares en JetBrains Mono y texto en Public Sans.

## Normas

- **HTML, CSS y JS sin dependencias ni compilación.** Tiene que funcionar abriendo `index.html` con doble clic (`file://`) y servida. Nada de frameworks, bundlers ni CDN.
- **Lógica pura aparte** (`ruta.js`): sin DOM, exporta con `module.exports` en Node y como objeto global en el navegador. Cualquier cálculo nuevo va ahí y con su prueba en `tests/` (Node a pelo, sin framework).
- **Todo en español**: textos, variables, funciones y comentarios. Comenta el porqué, no el qué.
- **Datos solo en el navegador** (`localStorage`, siempre dentro de `try/catch`). Lo único que sale es el formulario de novedades, con casilla de consentimiento, hacia `CONFIG.FORM_ENDPOINT` (vacío = modo demo).
- **Analítica**: `analitica.js` (GoatCounter, sin cookies) solo se activa con `CONFIG.ANALITICA`; las acciones se registran con `window.evento("nombre")` para medir las hipótesis de `mvp.md`.
- **Diseño**: fuentes en `fuentes/` (woff2, OFL), sin pedir nada a Google y sin `<link rel=preload>` (da error de CORS en `file://`). Colores como variables en `:root`, modo oscuro con `prefers-color-scheme` y respeto a `prefers-reduced-motion`.
- **Móvil primero**: a 390 px no puede haber scroll horizontal (para recortar, `overflow-x: clip`, no `overflow: hidden`).
- `privacidad.html` es una plantilla: los datos del responsable están marcados con `.pendiente`.
- **Privacidad de las ofertas**: de cada oferta solo se guarda la primera línea y las habilidades detectadas; el recuento que se descarga no lleva ningún texto. Las pruebas lo comprueban.

- **Habilidad nueva**: va en `HABILIDADES` **después de todo lo que requiere** (así no puede haber ciclos; lo comprueba la prueba), con un `patron` que no confunda parecidos (Java/JavaScript, SQL/NoSQL, Excel/excelente) y su caso en la prueba de `detectar`.
- **No inventes URL** en `recurso`: solo documentación oficial o gratuita que conozcas seguro; si dudas, sin recurso.
- Sin scraping de LinkedIn ni de otros portales: va contra sus condiciones. Las ofertas las pega el usuario.

```bash
node tests/ruta.test.js
```

## Pendiente del usuario

Nombre y dominio; publicar; Formspree y GoatCounter en `config.js`; rellenar `privacidad.html`; revisar las rutas base y los tiempos con gente que contrate o trabaje en cada puesto; difundirla (apartado «Validación» de `mvp.md`).
