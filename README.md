# Qué piden

**Lo que piden las ofertas de informática, convertido en tu ruta de aprendizaje.**

Eliges el puesto al que quieres llegar, pegas las ofertas que te interesan y la web te dice qué
aprender, en qué orden y cuánto tiempo te llevará. Proyecto abierto para la comunidad y sin ánimo
de lucro: gratis, sin anuncios y sin cursos patrocinados.

## Qué hace

- **Qué piden de verdad:** cuenta cuántas de tus ofertas piden cada cosa. Reconoce 47 habilidades.
- **En qué orden:** primero los fundamentos que hacen falta para lo demás (JavaScript antes que
  React), luego lo imprescindible y lo importante. Lo extra va aparte.
- **Cuánto tiempo:** según las horas por semana que le dediques y si ya trabajas en informática.
- **Lo que ya sabes** se quita de la ruta. Puedes copiarla o imprimirla, y cada paso trae un enlace
  para empezar.

Tiene 12 puestos: frontend, backend Java, backend .NET, full stack JavaScript, PHP, análisis de
datos, ciencia de datos e IA, DevOps, Android, QA, sistemas y ciberseguridad. Si no pegas ninguna
oferta, enseña una ruta base del puesto, hecha a mano y solo orientativa.

## Privacidad

Todo se queda en tu navegador. De cada oferta solo se guardan la primera línea y las habilidades
detectadas. El recuento que puedes descargar no lleva ningún texto de las ofertas.

## Cómo colaborar

- **Comparte tu recuento.** Usa «Descargar el recuento» en la web y súbelo en un *issue*. Con los
  recuentos de muchas personas, las rutas base dejan de ser una estimación.
- **Mejora las rutas y los tiempos.** Si contratas o trabajas en uno de estos puestos, dinos qué
  sobra, qué falta y cuánto se tarda de verdad.
- **Añade habilidades.** Van en `HABILIDADES` de `ruta.js`, siempre después de todo lo que
  requieren, con un patrón que no confunda nombres parecidos (Java y JavaScript, SQL y NoSQL) y su
  caso en las pruebas. Las normas completas están en `AGENTS.md`.

No se aceptan anuncios, enlaces de afiliación ni recursos de pago patrocinados.

## Desarrollo

HTML, CSS y JavaScript sin dependencias ni compilación: abre `index.html` en el navegador o sírvelo
con cualquier servidor estático. La lógica está en `ruta.js` y sus pruebas se ejecutan con Node:

```bash
node tests/ruta.test.js
```

## Licencia

MIT. Las fuentes de `fuentes/` (JetBrains Mono y Public Sans) tienen licencia SIL OFL.
