# Sistema visual de Audem (propuesta)

> **Propuesta, no estándar.** El estándar vigente del repo sigue siendo [`DESIGN.md`](../DESIGN.md). Esta carpeta propone una identidad visual completa para Audem a partir de la atmósfera de *Motion: Harmonic* (Excite Audio). Antes de usarla en `web/`, hay que resolver los choques que se listan abajo y, si se adopta, actualizar `DESIGN.md` primero.

Versión navegable, con vistas en vivo: https://claude.ai/artifact/2T9s87Ro77sCAU76B2eccP (privada hasta que se comparta).

## Qué hay en esta carpeta

| Archivo | Qué es |
|---|---|
| `tokens.json` | Todos los tokens: color (temas Claro y Noche), tipografía, espaciado, radios, sombras |
| `tokens.css` | Los mismos tokens como variables CSS, generados desde `tokens.json` |
| `audem-ds.css` | Estilos de los componentes (carga Outfit y Poppins desde Google Fonts) |
| `audem-ds.js` | Los 9 componentes como script clásico de React 18: expone `window.Audem` |
| `audem-ds.d.ts` | Las props de cada componente |
| `audem-simbolo.svg` | El símbolo de la marca |
| `demo.html` | Todos los componentes en una página, con botón Claro/Noche |

Para verlo: abre `demo.html` en el navegador (necesita internet para React y las fuentes).

## Choques con `DESIGN.md`

| Tema | `DESIGN.md` (vigente) | Esta propuesta | Qué decidir |
|---|---|---|---|
| Significado del color | Coral `#ec5449` = tono negativo, cian `#16a8c0` = positivo, crema `#eab54e` = neutro. Es el único canal de color con datos. | Coral `#d94a3d` = acción y valor (botón de grabar, barras, arcos). Estados de rama en turquesa y lila. | En las vistas de datos, coral no puede significar «acción» y «negativo» a la vez. O el tono cambia de colores, o la acción deja de ser coral ahí. |
| Tipografía | Poppins + IBM Plex Mono para números | Outfit (títulos, cifras) + Poppins (texto) | Elegir la familia de las cifras. |
| Temas | Solo claro, fondo blanco | Claro + Noche, superficie rosada `rubor` | Si se mantiene un solo tema. |
| Botones y relieve | Píldoras con relieve 3D (`--raised`, `--sunk`) | Rectángulos negros rectos, sin relieve; paneles sin sombra | Un solo lenguaje de botón. |
| Degradados | Banda `--iris` arriba de cada página y `h1` con degradado | Degradado solo dentro del Orbe | Dónde vive la iridiscencia. |
| Movimiento | «Nada pulsa ni se repite» | El Orbe gira (26 s) y respira (7 s) | Si el Orbe es la excepción. |

Lo que sí calza: base de espaciado de 4 px, Poppins para el texto, el color nunca va solo (siempre con palabra), `prefers-reduced-motion` respetado, sin bordes laterales de acento.

## Guía de marca

Audem es escucha ciudadana por WhatsApp: cada persona habla dos minutos y su voz se suma a un mapa que se afina con cada voz nueva. La identidad lo muestra con un objeto vivo, el **Orbe**, una forma iridiscente que cambia con lo que dice la gente, puesto sobre superficies rosadas muy calmas, con controles de trazo fino y tipografía liviana. La referencia de tono es un instrumento de audio: preciso, suave y para tocar. Toda la pantalla está en calma para que lo único que se mueva sea la voz de la gente.

## Contenido

- **Español de Chile, tuteando.** «Hablas dos minutos», «¿Te entendí bien?», «Tu voz se suma al mapa». Nunca «usted» ni «el usuario».
- **Frases cortas, en minúscula inicial normal.** Títulos sin punto final. Botones con un verbo: «Pruébalo», «Corregir», «Ver el mapa».
- **El nombre siempre en minúscula: audem.** En texto corrido se escribe Audem, con mayúscula inicial.
- **Cifras a la chilena:** `1.240 voces`, `±4,5 pts`, `38 %`. El margen de error se dice siempre que aparece un porcentaje.
- **Palabras propias del producto:** *voz* (lo que deja una persona), *rama* (una postura que comparten varias voces), *mapa* (todas las ramas de una consulta), *validada*, *provisional*, *minoritaria*. No digas «encuesta» si puedes decir «consulta», ni «respuesta» si puedes decir «voz».
- **Sin emoji** en la interfaz ni en las láminas. En WhatsApp, como mucho uno al cerrar.
- **Datos de ejemplo, marcados.** Toda cifra inventada para una demo lleva «datos de ejemplo» a la vista.

## Fundamentos visuales

### Color

- La página es `lienzo`; la marca vive en `rubor`. Pon el mapa, los paneles y todo lo que se toca sobre `rubor`, y usa `rubor-hondo` para el panel lateral y las pistas.
- El texto va en `tinta`; rótulos y metadatos en `tinta-suave`. Los dos pasan 4,5:1 sobre las tres superficies, en ambos temas.
- `coral` es el color del valor y de la acción: el arco de una Perilla, la barra de una Rama, el borde de los tiradores, el botón de grabar. Cuando coral es texto, usa `coral-texto`.
- `turquesa`, `oro` y `lila` existen **solo dentro del Orbe**. Fuera de él, el estado «validada» usa `turquesa-texto` y «minoritaria» usa `lila-texto`, siempre con la palabra escrita en una Pastilla.
- `halo` es el resplandor difuso: alrededor del Orbe y como banda de margen de error en Rama.
- `linea` es decorativa (órbitas, radios, separadores). El borde de un control que hay que ver usa `linea-fuerte`.
- Hay dos temas: Claro (`light`) y Noche (`dark`). En Noche, `coral` se aclara y el ícono sobre coral pasa a `on-coral` oscuro.

### Tipografía

- Dos familias: **Outfit** (`display`) para el nombre, los títulos y las cifras; **Poppins** (`texto`) para todo lo demás.
- El bloque de marca apila `marca` (800) y `marca-ligera` (300) al mismo tamaño. Ese contraste de peso es la firma: repítelo en portadas, nunca en títulos de sección.
- Los títulos van en `titulo` o `subtitulo` (500). Los párrafos en `cuerpo`: Poppins 300, interlineado amplio, máximo 65 caracteres por línea.
- Las cifras grandes van en `cifra`, en peso liviano. Una cifra en negrita grita; Audem escucha.
- Los rótulos de controles van en `etiqueta` (11px) y los estados en `pastilla` (10px, mayúsculas, tracking amplio).

### Espacio y forma

- Espaciado en pasos de `esp-1` a `esp-16`. Mucho aire: entre secciones `esp-12`; alrededor del Orbe `esp-16`.
- Tres formas, nada más: **rectángulos rectos** (`radio-0`) para los botones, **esquinas apenas suaves** (`radio-sm`) para paneles y la ventana del mapa, y **píldoras y círculos** (`radio-pildora`) para todo lo que es un valor o un estado.
- Sin bordes de tarjeta: lo que separa es el cambio de `lienzo` a `rubor`. Un panel no lleva sombra.
- Una sola sombra fuerte por pantalla, `sombra-flota`, cuando la ventana del mapa flota sobre el halo. Los tiradores y el botón de grabar usan `sombra-tirador`.
- La Onda separa la presentación del detalle, una vez por página.

### Movimiento

- Lo único que se mueve solo es el Orbe: un giro lento del color (26 s) y una respiración (7 s, ida y vuelta). Todo lo demás se mueve solo cuando alguien lo toca: 200 ms, `ease-out`.
- Cuando entra una voz nueva, el Orbe cambia de forma hacia la rama que creció. No hay confeti ni contadores que saltan.
- Con `prefers-reduced-motion`, el Orbe queda quieto.

### Estados e interacción

- Foco de teclado: anillo sólido de 2px en `foco`, separado 3px.
- Hover del botón primario: de `tinta` a `coral-texto`. Hover del contorno: fondo `rubor-hondo`.
- Opción elegida en un Selector: trazo `coral` y texto `coral-texto`.
- Deshabilitado: 45 % de opacidad, sin cambiar de color.

### Composición

- Una idea por pantalla, centrada en el Orbe o en una cifra. El texto acompaña a un costado, alineado a la izquierda.
- En el mapa: el Orbe a la izquierda sobre `rubor`, y a la derecha un Panel `hondo` con las Perillas de margen y la lista de Ramas.
- En láminas: fondo `lienzo`, el bloque de marca o una cifra grande, y el Orbe o el halo como imagen. Menos de veinte palabras por lámina.

## Iconografía

Audem no tiene un set de íconos propio. Usa íconos de línea de 1,5px, con puntas redondeadas, en `tinta-suave`, a 16 o 20px; [Lucide](https://lucide.dev) con `stroke-width="1.5"` es el reemplazo provisorio más cercano. Los íconos solo acompañan a controles (reproducir, ajustes, flecha de un Panel); nunca encabezan una sección. El símbolo de la marca está en Logos y en el componente Marca.

## Lo que no hacemos

- Degradados fuera del Orbe, y en especial degradados azul-violeta.
- Texto en coral claro (`coral`) o sobre el Orbe.
- Tarjetas con borde de color a un lado, sombras en todo, esquinas muy redondeadas en botones.
- Gráficos de torta para posturas: una postura es una Rama.
- Copiar el logo, la interfaz o los nombres de producto de Excite Audio. Su sitio de *Motion: Harmonic* es la referencia de atmósfera (superficie rosada, objeto iridiscente, controles finos), no un modelo para calcar.

## Componentes

Todos viven en `window.Audem` después de cargar React 18, `tokens.css`, `audem-ds.css` y `audem-ds.js`. También exporta `margen(voces)` (margen de error en puntos, 95 %) y `cifra(n, decimales)` (formato chileno).

### Marca

El nombre de Audem en minúscula, con su símbolo de cinco ondas que se juntan en un punto coral.

- `tamano`: tamaño del nombre en px (48 por defecto).
- `segunda`: una palabra en peso liviano apilada bajo el nombre, al mismo tamaño (`escucha`, `mapa`, `voces`). Úsala en portadas y en el inicio del mapa; en barras y pies, sin ella.
- `simbolo={false}`: solo el nombre, cuando el símbolo ya está cerca.

Hereda el color del texto que la rodea (`tinta` por defecto); el punto siempre es `coral`. No le cambies el peso, no le pongas mayúscula inicial y no la pongas sobre el Orbe.

### Onda

Una línea ondulada de lado a lado que separa dos momentos de una página.

Ocupa todo el ancho de su contenedor; `alto` cambia su altura en px (64 por defecto). El trazo queda en 1,5px de `tinta` aunque se estire. Úsala una vez por página, entre la presentación y el detalle, con `esp-16` de aire arriba y abajo. No la uses como borde de tarjeta ni dentro de un Panel.

### Botón

Botones rectos, sin redondeo: un bloque de `tinta` para la acción principal y un contorno para la secundaria.

- `variante`: `primario` (por defecto), `contorno` o `grabar`.
- `grabar` es el círculo coral con un punto; con `activo` el punto pasa a cuadrado y la etiqueta accesible cambia a «Detener». Úsalo solo para capturar voz.
- Acepta cualquier atributo de `<button>` (`onClick`, `disabled`, `type`).

Un solo `primario` por vista. El texto es un verbo en tú: «Pruébalo», «Ver el mapa», «Enviar». El hover del primario pasa a `coral-texto`.

### Selector

Un grupo de opciones en forma de píldora; la elegida se marca con trazo y texto coral.

- `opciones`: textos, o `{ valor, etiqueta }`.
- `valor` + `onChange` para controlarlo; `valorInicial` para dejarlo suelto.
- `etiqueta`: el rótulo que va debajo, en `etiqueta` y `tinta-suave` (también nombra el grupo para lectores de pantalla).

De dos a cuatro opciones cortas. Si son más, usa una lista.

### Pastilla

Una etiqueta de estado en mayúsculas, con borde fino del mismo color del texto.

- `tono`: `coral` (por defecto, para «En vivo» o una acción), `turquesa` (validada), `lila` (minoritaria), `neutro` (provisional).
- `children`: una o dos palabras.

El estado siempre va escrito: el color acompaña, no reemplaza a la palabra.

### Perilla

Un indicador circular de trazo fino: el arco coral muestra el valor y la cifra va al centro en peso liviano.

- `valor`, `min` (0), `max` (100).
- `texto`: lo que se lee al centro si no es el número tal cual (`±3`).
- `etiqueta`: el rótulo de abajo y el nombre accesible.
- `tamano`: diámetro en px (64).

Es una medida, no un control: no se arrastra. Úsala para el margen de error, la confianza o el avance de una consulta. Agrúpalas dentro de un Panel, en filas de tres o cuatro.

### Rama

Una postura de la consulta, con cuánta gente la respalda y el margen de error dibujado como un halo alrededor del final de la barra.

- `texto`: la postura, en palabras de la gente.
- `porcentaje` (0–100) y `voces`.
- `margen`: en puntos; si falta, se calcula de `voces` (95 % de confianza).
- `estado`: `provisional` (por defecto), `validada` o `minoritaria`.

Ordénalas de mayor a menor respaldo. Muestra siempre las minoritarias: es parte de la promesa de Audem. Escribe las cifras a la chilena (`1.240 voces`, `±4,5 pts`).

### Orbe

La voz colectiva como un objeto vivo: una forma iridiscente que cada rama empuja hacia afuera según cuánta gente la respalda, con un tirador por rama.

- `ramas`: `{ etiqueta, detalle, peso, estado }`. `peso` va de 0 a 1 (normalmente el respaldo de esa rama dividido por el de la mayor); `detalle` es la cifra corta bajo la etiqueta; `estado` cambia el tirador (relleno coral = validada, trazo lila = minoritaria).
- `tamano`: ancho de la forma en px (360); el SVG se adapta al ancho de su contenedor.
- `animado={false}`: lo deja quieto (para capturas). También se detiene solo con `prefers-reduced-motion`.
- `descripcion`: lo que debe oír un lector de pantalla; escribe la conclusión, no la forma.

Funciona mejor con seis ramas, en `rubor`, con `esp-16` de aire. Uno por pantalla. Es el único lugar donde viven `turquesa`, `oro`, `lila` y el degradado: no los saques de aquí.

### Panel

Una superficie `rubor` con cabecera, flecha y separador fino, para agrupar controles y medidas.

- `titulo`: la cabecera en `seccion`; `flecha={false}` quita la flecha.
- `accion`: una Pastilla coral a la derecha («En vivo», «Post»).
- `hondo`: usa `rubor-hondo`, para el panel lateral junto al Orbe.
- `children`: se ordenan en fila y bajan de línea cuando no caben.

Sin sombra y sin borde: el color de fondo ya lo separa. No metas un Panel dentro de otro.

## Logo

`audem-simbolo.svg`: el símbolo, cinco ondas en `tinta` (#1e1719) que se juntan en un punto `coral` (#d94a3d). Es de dos tintas y no hereda color: sobre fondos oscuros usa el componente Marca, que toma el color del texto. Aire mínimo alrededor: un cuarto de su alto. Tamaño mínimo: 16px.
