# DESIGN.md: estándar de visualización de Audem

Toda pantalla o gráfico de Audem sigue esto. Si algo nuevo no calza, se cambia este archivo primero.

## Dirección
**Instrumento de medición, minimalista.** La pantalla se lee como una figura de paper: fondo blanco con un solo halo suave, mucho aire, un solo canal de color con significado, cada codificación tiene su clave y cada número tiene su n. Nada decorativo. La identidad viene del sistema visual en `design-system/` (tokens en `design-system/tokens.json`, tema Claro); `web/src/comun.css` los copia como variables.

## Tipografía
- Outfit para títulos y números; Poppins (300) para el texto y las notas de método (Google Fonts). No hay más familias.
- Títulos grandes en peso 400, nunca en negrita; las cifras en Outfit liviano.
- Escala modular 1.2 con base 16 px: 13 · 16 · 19 · 23 · 28 · 33 · 40 (`--t-1` … `--t5`). Nada bajo 13 px.
- Títulos de sección en minúscula normal (sentence case), nunca en mayúsculas.
- Números con `tabular-nums` (clase `.num`).

## Color
- **Tono** (positivo/neutro/negativo) es el único canal de color con datos. La emoción concreta va en texto, nunca en color.
  - Los tres colores del Orbe del sistema, solo modo claro y fondo blanco: pos turquesa `#3db5c4`, neu oro `#f2c46d`, neg coral `#d94a3d`. Coral significa «negativo», así que la selección y el acento de interfaz son monocromos: tinta `#1e1719`.
  - Los puntos se dibujan como esferas iluminadas (`url(#g-pos|neu|neg)` en `web/index.html`). Botones y tarjetas son planos: sin relieve ni sombras.
  - Pendiente: volver a pasar el validador de daltonismo con estos tres colores.
- El tono se deriva de la emoción con una lista cerrada (ver `POS`/`NEG` en `web/src/comun.js`). Lo que no está en la lista cuenta como neutro.
- Neutros: tinta `#1e1719` y tinta suave `#6b585b` sobre `lienzo` blanco; las superficies que agrupan van en `rubor` `#fcedea`.
- El color nunca va solo: siempre lo acompaña una etiqueta, una leyenda o un conteo.

## Codificaciones (siempre con clave visible)
| Marca | Canal | Significa |
|---|---|---|
| Punto | color | tono de la frase |
| Punto | tamaño (radio) | intensidad 0–1 |
| Círculo de tema | área | número de frases del tema |
| Anillo de tinta | presencia | una de las 2 frases más recientes (las mismas del panel «Lo último») |
| Nodo tema (vista Red) | número dentro | personas del tema; el nodo queda fijo en su celda de la grilla |
| Nodo persona (vista Red) | relleno | hueco = habló de un tema; lleno = une 2 o más temas |
| Línea (vista Red) | color | persona→frase en gris; frase→tema con el tono de la frase |
| Cinta (vista Flujo) | color · grosor | respuesta→frase en gris; frase→concepto con el tono y grosor por intensidad; concepto→tema en gris con grosor = n.º de frases |
| Píldora de concepto (vista Flujo) | tamaño de letra | n.º de frases que lo mencionan |
| Burbuja de tema (vista Flujo) | área · anillos | área = % de personas; un anillo concéntrico por persona (el centro queda más oscuro) |

- Porcentajes solo sobre el total de personas (como una encuesta), siempre con «Casos: n» al pie. Dentro de un tema se muestran conteos (`1 pos · 0 neu · 5 neg`): con n chico los porcentajes engañan.
- Personas ≠ frases. Una persona aporta 1 a 5 frases. Cada número dice cuál de las dos cuenta.
- Debajo de cada figura va una nota de método con el n total y cómo se agrupó.

## Dos vistas, mismos datos
- **Panel en vivo** (`web/src/Panel.jsx` + `panel-dibujo.js`): para la pantalla grande. Controlable con línea de tiempo, filtro de tono y detalle por tema. Dos vistas: **Red** (personas → frases → temas, con física; por defecto) y **Temas** (grilla de círculos, la más fácil de leer).
- **Flujo** (`web/src/Flujo.jsx` + `flujo-dibujo.js`): el camino completo en 4 columnas, respuestas → frases → conceptos → temas, con cintas curvas. Pasar el cursor por cualquier nodo ilumina todo lo que comparte frases con él. Los temas van ordenados por personas; el resto se ordena por baricentro para que las cintas se crucen poco.
- Los tokens y las reglas de tono son compartidos (`web/src/comun.css`, `web/src/comun.js`). Ninguna vista define sus propios colores.
- **Tópicos** (`/<slug>/voces`: `web/src/Voces.jsx` + `voces-dibujo.js` + `voces-datos.js`): sirve para cualquier pregunta. `voces-datos.js` lleva `encuestas.topicos` (o, si esa query falta o viene vacía, los grupos de `encuestas.mapa`) a una sola forma: ejes con una celda por persona (tono, intensidad, citas). Un blob 3D (Three.js desde cdnjs) tiene un eje por cada uno de los 6 con más personas y crece hacia el más mencionado; cada punto es una persona, con color = tono (mixto cuenta como neu) y tamaño = intensidad, y junto al nombre van los conteos `pos · neu · neg`. Modo **En vivo**: la tarjeta muestra la cita de quien acaba de llegar o del punto tocado, las propuestas y las emociones. Modo **Lecturas**: frases calculadas de los datos (lo más mencionado, dónde hay división, lo que más molesta, lo mejor evaluado, lo que va junto con hilos entre los puntos de una misma persona, propuestas, tono general); atenúa lo demás. El blob se centra en el espacio libre entre el header y la tarjeta, y cada nombre se recorta según el ancho que tiene. `node web/src/voces-datos.check.js` revisa la capa de datos.
- **Preguntar** (modo de Tópicos, `web/src/Chat.jsx` + `convex/chat.ts`): un chat en la tarjeta para consultar los datos. Claude Haiku recibe los ejes con sus conteos y citas, y responde con texto, hasta 3 citas textuales y **qué** gráfico mostrar (tono por eje, personas por eje o emociones) y con qué ejes. Los números del gráfico nunca vienen del modelo: los calcula `grafico()` en `voces-datos.js` desde los mismos datos de la pantalla, y los ejes de la última respuesta se iluminan en el blob. Cada gráfico lleva su unidad y «Casos: n».
- **Excepción de movimiento en Tópicos:** el blob respira lento y rebota cuando un eje gana una persona; con `prefers-reduced-motion` casi se detiene.

## Layout y espaciado
- Base de 4 px: 4 · 8 · 12 · 16 · 24 · 32 · 48. Estrecho dentro de un grupo, amplio entre grupos.
- Contenedores sin borde ni sombra: se separan por el cambio de `lienzo` a `rubor`, con radio de 4 px. Sin bordes laterales de acento.
- Botones: píldoras `rubor` para navegar y alternar; la opción activa se rellena en tinta. La acción principal (`.primario`) es un rectángulo tinta, una por pantalla.
- Cada página tiene un solo halo `rubor` arriba, detrás del contenido.
- En pantallas angostas el layout se apila; nunca se aplasta.

## Movimiento
- Solo `transform` y `opacity`, de 300 ms o menos, con ease-out. Nada pulsa ni se repite, salvo el botón de voz al responder: sus rayos giran despacio y laten con el volumen real del micrófono mientras graba. Se respeta `prefers-reduced-motion`.
- Lo nuevo se marca con un estado estático (el anillo), no con una animación.
