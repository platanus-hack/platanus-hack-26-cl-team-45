# DESIGN.md: estándar de visualización de Audem

Toda pantalla o gráfico de Audem sigue esto. Si algo nuevo no calza, se cambia este archivo primero.

## Fuente de verdad
El sistema visual vive en [`design-system/`](design-system/README.md): tokens (`tokens.css`), componentes (`audem-ds.js` + `audem-ds.css`) y guía de marca. `web/` lo carga con `web/src/ds.js` y no define colores, fuentes, radios ni sombras propios: todo sale de `var(--…)` del sistema y de sus componentes. Si algo nuevo no calza, se cambia `design-system/` primero y después este archivo.

## Dirección
**Instrumento de medición en modo Noche.** Toda la web usa el tema Noche (`<html data-theme="dark">` en `web/index.html`); no hay tema claro. Superficies calmas (`lienzo` → `rubor` → `rubor-hondo`), un solo canal de color con datos, cada codificación con su clave y cada número con su n.

## Tipografía
- Outfit (`--font-display`) para la marca, los títulos y las cifras; Poppins (`--font-texto`) para todo lo demás. No hay más familias.
- Tamaños de la escala del sistema: 13 · 16 · 28 · 40 (y 64/96 solo para marca y cifras de portada). En `web/` nada baja de 13 px, salvo los rótulos propios de los componentes.
- Cifras en Outfit 300 con `tabular-nums` (clase `.num`). Títulos en minúscula normal.

## Color
- **Tono** (positivo/neutro/negativo) es el único canal de color con datos: `--pos` = `turquesa`, `--neu` = `oro`, `--neg` = `coral` (en `web/src/comun.css`). Es la excepción a la regla de que turquesa, oro y lila viven solo en el Orbe: el mapa toma los colores del Orbe para que se lean como una sola cosa.
- Por eso, **en las vistas de datos coral solo significa negativo**. Ahí la opción elegida de un Selector se marca en `tinta` (variante `au-sel--tinta`) y el botón primario es `tinta`. Coral como acción solo aparece donde no hay datos: el BotonVoz de Responder.
- Los puntos son círculos planos del color de su tono. Sin degradados fuera del Orbe y del BotonVoz.
- El tono se deriva de la emoción con una lista cerrada (`POS`/`NEG` en `web/src/comun.js`). Lo que no está en la lista cuenta como neutro.
- El color nunca va solo: siempre lo acompaña una etiqueta, una leyenda o un conteo.

## Componentes en uso
- **Marca**: arriba a la izquierda de cada página (vuelve al inicio). En la portada, a 88 px con `segunda="escucha"` y sin símbolo, porque al lado va el Orbe.
- **Orbe** (`minimal`) y **Onda**: solo en la portada, uno de cada uno.
- **Microfono** (con su BotonVoz): toda la pantalla de Responder.
- **Entrada** y las piezas del **Agente** (`au-ag-*`, `au-sug-chip`): el modo Preguntar de Tópicos. El gráfico de la respuesta es nuestro, porque el Agente no tiene dónde ponerlo.
- **Botón**: `au-btn--primario` para la acción principal (uno por vista), `au-btn--contorno` para el resto, también en enlaces.
- **Selector**: grupos de opciones (filtro de tono, En vivo/Lecturas/Preguntar), siempre con `au-sel--tinta`.
- **Pastilla**: estado de una encuesta en la portada y «Datos sintéticos» en las demos.
- Filas elegibles (un tema, una encuesta) usan `.opcion`: planas, `rubor` al pasar el cursor y trazo `tinta` cuando están elegidas.

## Codificaciones (siempre con clave visible)
| Marca | Canal | Significa |
|---|---|---|
| Punto | color | tono de la frase |
| Punto | tamaño (radio) | intensidad 0–1 |
| Círculo de tema | área | número de frases del tema |
| Anillo de tinta | presencia | una de las 2 frases más recientes (las mismas del panel «Lo último») |
| Cinta (vista Flujo) | color · grosor | respuesta→frase en gris; frase→concepto con el tono y grosor por intensidad; concepto→tema en gris con grosor = n.º de frases |
| Píldora de concepto (vista Flujo) | tamaño de letra | n.º de frases que lo mencionan |
| Burbuja de tema (vista Flujo) | área · anillos | área = % de personas; un anillo concéntrico por persona (el centro queda más oscuro) |

- Porcentajes solo sobre el total de personas (como una encuesta), siempre con «Casos: n» al pie. Dentro de un tema se muestran conteos (`1 pos · 0 neu · 5 neg`): con n chico los porcentajes engañan.
- Personas ≠ frases. Una persona aporta 1 a 5 frases. Cada número dice cuál de las dos cuenta.
- Debajo de cada figura va una nota de método con el n total y cómo se agrupó.

## Dos vistas, mismos datos
- **Panel en vivo** (`web/src/Panel.jsx` + `panel-dibujo.js`): para la pantalla grande. Controlable con línea de tiempo, filtro de tono y detalle por tema. Una sola vista: **Temas**, una grilla de círculos con una frase por punto.
- **Flujo** (`web/src/Flujo.jsx` + `flujo-dibujo.js`): el camino completo en 4 columnas, respuestas → frases → conceptos → temas, con cintas curvas. Pasar el cursor por cualquier nodo ilumina todo lo que comparte frases con él. Los temas van ordenados por personas; el resto se ordena por baricentro para que las cintas se crucen poco.
- Los tokens y las reglas de tono son compartidos (`web/src/comun.css`, `web/src/comun.js`). Ninguna vista define sus propios colores.
- **Tópicos** (`/<slug>/voces`: `web/src/Voces.jsx` + `voces-dibujo.js` + `voces-datos.js`): sirve para cualquier pregunta. `voces-datos.js` lleva `encuestas.topicos` (o, si esa query falta o viene vacía, los grupos de `encuestas.mapa`) a una sola forma: ejes con una celda por persona (tono, intensidad, citas). Un blob 3D (Three.js desde cdnjs) tiene un eje por cada uno de los 6 con más personas y crece hacia el más mencionado (el tamaño se estira entre el eje con menos personas y el con más, así que se compara con los conteos escritos, no con el volumen); cada lóbulo toma el tono neto de su eje (`(pos − neg) / personas`): turquesa si domina lo positivo, coral si domina lo negativo y oro si está mezclado; cada punto es una persona, con color = tono (mixto cuenta como neu) y tamaño = intensidad, y junto al nombre van los conteos `pos · neu · neg`. Modo **En vivo**: la tarjeta muestra la cita de quien acaba de llegar o del punto tocado, las propuestas y las emociones. Modo **Lecturas**: frases calculadas de los datos (lo más mencionado, dónde hay división, lo que más molesta, lo mejor evaluado, lo que va junto con hilos entre los puntos de una misma persona, propuestas, tono general); atenúa lo demás. El blob se centra en el espacio libre entre el header y la tarjeta, y cada nombre se recorta según el ancho que tiene. `node web/src/voces-datos.check.js` revisa la capa de datos.
- **Preguntar** (modo de Tópicos, `web/src/Chat.jsx` + `convex/chat.ts`): un chat en la tarjeta para consultar los datos. Claude Haiku recibe los ejes con sus conteos y citas, y responde con texto, hasta 3 citas textuales y **qué** gráfico mostrar (tono por eje, personas por eje o emociones) y con qué ejes. Los números del gráfico nunca vienen del modelo: los calcula `grafico()` en `voces-datos.js` desde los mismos datos de la pantalla, y los ejes de la última respuesta se iluminan en el blob. Cada gráfico lleva su unidad y «Casos: n».
- **Excepción de movimiento en Tópicos:** el blob respira lento y rebota cuando un eje gana una persona; con `prefers-reduced-motion` casi se detiene.

## Layout y espaciado
- Espaciado con `--esp-1` … `--esp-16` (base de 4 px). Estrecho dentro de un grupo, amplio entre grupos.
- Paneles sin borde y sin sombra: los separa el paso de `lienzo` a `rubor` (`rubor-hondo` para el panel lateral). Radio `radio-sm`; botones y campos rectos (`radio-0`); valores y estados en píldora.
- Una sola sombra fuerte por pantalla (`sombra-flota`): la tarjeta de Tópicos que flota sobre el blob. Sin bordes laterales de acento.
- En pantallas angostas el layout se apila; nunca se aplasta.

## Movimiento
- Solo `transform` y `opacity`, de 300 ms o menos, con ease-out. Se respeta `prefers-reduced-motion`.
- Lo único que se mueve solo es el Orbe de la portada, el BotonVoz al responder y el blob de Tópicos. En las vistas de datos nada pulsa ni se repite: lo nuevo se marca con un estado estático (el anillo).
