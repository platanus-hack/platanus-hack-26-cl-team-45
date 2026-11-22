# Sistema visual de Audem (propuesta)

> **Propuesta, no estándar.** El estándar vigente del repo sigue siendo [`DESIGN.md`](../DESIGN.md). Esta carpeta propone una identidad visual completa para Audem a partir de la atmósfera de *Motion: Harmonic* (Excite Audio). Antes de usarla en `web/`, hay que resolver los choques que se listan abajo y, si se adopta, actualizar `DESIGN.md` primero.

Versión navegable, con vistas en vivo: https://claude.ai/artifact/2T9s87Ro77sCAU76B2eccP (privada hasta que se comparta).

## Qué hay en esta carpeta

| Archivo | Qué es |
|---|---|
| `tokens.json` | Todos los tokens: color (temas Claro y Noche), tipografía, espaciado, radios, sombras |
| `tokens.css` | Los mismos tokens como variables CSS, generados desde `tokens.json` |
| `audem-ds.css` | Estilos de los componentes (carga Outfit y Poppins desde Google Fonts) |
| `audem-ds.js` | Los 13 componentes (más `Entrada`) como script clásico de React 18: expone `window.Audem` |
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
- `turquesa`, `oro` y `lila` existen **solo dentro del Orbe** (y del BotonVoz, que es un Orbe). Fuera de él, el estado «validada» usa `turquesa-texto` y «minoritaria» usa `lila-texto`, siempre con la palabra escrita en una Pastilla.
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
- Una sola sombra fuerte por pantalla, `sombra-flota`, cuando la ventana del mapa flota sobre el halo. Los tiradores y el botón de grabar usan `sombra-tirador`. La barra para preguntar usa `sombra-suave`.
- La Onda separa la presentación del detalle, una vez por página.

### Movimiento

- Lo único que se mueve solo es el Orbe: un giro lento del color (26 s) y una respiración (7 s, ida y vuelta). Todo lo demás se mueve solo cuando alguien lo toca: 200 ms, `ease-out`. La excepción es la Escena: al preguntar, el Orbe se corre en 500 ms y la conversación sube en 450 ms. Mientras el agente responde, el Orbe gira más rápido.
- Cuando entra una voz nueva, el Orbe cambia de forma hacia la rama que creció. No hay confeti ni contadores que saltan.
- El BotonVoz es el otro objeto vivo: sus rayos giran en 60 s y, al grabar, laten con el volumen real de la voz; el arco coral marca cuánto de los dos minutos se usó; al terminar, un eco turquesa confirma que la voz llegó al mapa.
- Con `prefers-reduced-motion`, el Orbe y el BotonVoz quedan quietos y solo cambian íconos y textos.

### Estados e interacción

- Foco de teclado: anillo sólido de 2px en `foco`, separado 3px.
- Hover del botón primario: de `tinta` a `coral-texto`. Hover del contorno: fondo `rubor-hondo`.
- Opción elegida en un Selector: trazo `coral` y texto `coral-texto`.
- Deshabilitado: 45 % de opacidad, sin cambiar de color.

### Composición

- Una idea por pantalla, centrada en el Orbe o en una cifra. El texto acompaña a un costado, alineado a la izquierda.
- En el mapa: el Orbe a la izquierda sobre `rubor`, y a la derecha un Panel `hondo` con las Perillas de margen y la lista de Ramas.
- Para preguntarle al mapa: la Escena, minimalista. En reposo, el Orbe al centro, un saludo en dos tonos y una sola barra para preguntar. Al preguntar, el Orbe se corre a la izquierda y la conversación aparece a la derecha, sin panel ni caja. Nada más en pantalla: ni etiquetas alrededor del Orbe ni menús.
- Para responder una consulta: Microfono. La pregunta arriba, el BotonVoz al centro con su anillo de vidrio y sus rayos, el estado escrito debajo («Te escucho · 0:12») y «Prefiero escribir» como enlace. Debajo, solo «Tus voces». Nada más.
- En láminas: fondo `lienzo`, el bloque de marca o una cifra grande, y el Orbe o el halo como imagen. Menos de veinte palabras por lámina.

## El agente

El agente sirve para consultar y diagnosticar lo que dijo la gente. No es un clon de nadie ni opina: lee las voces y las devuelve ordenadas.

- **Responde solo con voces reales.** Cada respuesta dice con cuántas voces cuenta y de qué rama salen (`Basado en 183 voces de la rama «Más árboles y sombra»`).
- **Cita textual.** Las palabras de la gente van entre comillas angulares («…»), sin corregirlas, con su fuente: `Voz 214 · audio · Villa Los Aromos`. Nunca el nombre ni el teléfono.
- **Si no sabe, lo dice y ofrece preguntar:** «Nadie habló de estacionamientos todavía, así que no lo voy a adivinar», con el botón «Preguntarlo por WhatsApp».
- **Dos modos.** *Consultar* habla de lo que opina la gente. *Diagnosticar* habla de la muestra: quién falta frente al Censo, qué audios se transcribieron con baja confianza, qué rama tiene un margen demasiado grande. Los hallazgos llevan Pastilla «Bien», «Revisar» o «Dato».
- **Tono:** el mismo tuteo corto del resto. Frases de una idea. Sin «¡Excelente pregunta!» ni emoji.
- **Forma:** minimalista. La pregunta de quien consulta va en una burbuja `rubor-hondo` a la derecha; la respuesta va sin burbuja, en `display` liviano a 22px, y las citas son texto plano con su fuente debajo. Sin paneles ni tarjetas. La barra para preguntar es una píldora con un Orbe en miniatura, el único otro lugar donde aparece el degradado.

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
- `minimal`: solo la forma y su órbita, sin radios, tiradores ni etiquetas. Es el Orbe de la Escena.
- `pensando`: el color gira más rápido (5 s) mientras el agente responde.
- `descripcion`: lo que debe oír un lector de pantalla; escribe la conclusión, no la forma.

Funciona mejor con seis ramas, en `rubor`, con `esp-16` de aire. Uno por pantalla. Es el único lugar donde viven `turquesa`, `oro`, `lila` y el degradado: no los saques de aquí.

### Panel

Una superficie `rubor` con cabecera, flecha y separador fino, para agrupar controles y medidas.

- `titulo`: la cabecera en `seccion`; `flecha={false}` quita la flecha.
- `accion`: una Pastilla coral a la derecha («En vivo», «Post»).
- `hondo`: usa `rubor-hondo`, para el panel lateral junto al Orbe.
- `children`: se ordenan en fila y bajan de línea cuando no caben.

Sin sombra y sin borde: el color de fondo ya lo separa. No metas un Panel dentro de otro.

### Agente

La conversación con el agente, sin caja: texto sobre el fondo, para consultar y diagnosticar lo que dijo la gente. Responde solo con voces reales, las cita y dice con cuántas cuenta.

- `mensajes`: la conversación. Cada uno es `{ de: 'persona', texto }` o `{ de: 'agente', texto, citas, ramas, diagnostico, accion, base }`.
  - `texto`: la respuesta, en `display` liviano a 22px. Una o dos frases.
  - `citas`: `{ texto, fuente }`, palabras textuales de una voz (`Voz 214 · audio · Villa Los Aromos`).
  - `ramas`: props de Rama, para mostrar respaldo y margen.
  - `diagnostico`: `{ etiqueta, valor, estado }` con estado `ok` («Bien»), `alerta` («Revisar») o `info` («Dato»).
  - `accion`: `{ etiqueta, onClick }`, un enlace coral (por ejemplo «Preguntarlo por WhatsApp»).
  - `base`: de dónde sale la respuesta, en una línea al pie.
- `onEnviar(texto, modo)`: se llama al enviar; el modo es `consultar` o `diagnosticar`.
- `pensando`: `true` o un texto («Leyendo 482 voces…») mientras llega la respuesta. Bloquea el envío.
- `sugerencias`: una lista, o `{ consultar: [...], diagnosticar: [...] }`. Van en una fila sobre la barra.
- `onCerrar`: muestra la píldora «× Cerrar». `modos={false}` quita los modos. `avatar={false}` quita el mini Orbe de la barra.

Ocupa el alto de su contenedor: dale un alto fijo. Va directo sobre `lienzo`, sin panel ni borde. La persona pregunta en una burbuja `rubor-hondo` a la derecha; el agente responde a la izquierda sin burbuja.

Reglas del agente: no inventa. Si nadie habló de algo, lo dice y ofrece preguntarlo por WhatsApp. Cada afirmación lleva su número de voces, y una cifra lleva su margen. Cita textual, sin corregir a la gente. En modo diagnóstico habla de la muestra (quién falta, qué audios se entendieron mal, qué rama tiene poco respaldo), no de las opiniones.

`Entrada` (la barra para preguntar) también se exporta sola: `onEnviar(texto)`, `placeholder`, `deshabilitado`, `pensando`, `avatar`.

### Escena

La pantalla del agente en web, minimalista: en reposo, el Orbe al centro con un saludo, una sola barra para preguntar y unas pocas sugerencias. Al preguntar, el Orbe se corre a la izquierda y la conversación aparece a la derecha.

- `ramas`, `descripcion`, `animado`: van al Orbe, que aquí se dibuja en modo `minimal` (solo la forma y su órbita, sin etiquetas).
- `saludo` y `pregunta`: el título en dos tonos. `saludo` va liviano en `tinta-suave` («Hola, equipo de Ñuñoa»); `pregunta`, en `tinta` («¿Qué quieres saber de lo que dijo la gente?»).
- `pie`: una línea con la base de datos («482 voces sobre la plaza»). Bajo el título en reposo, bajo el Orbe al conversar.
- `responder(texto, modo)`: devuelve (o promete) el mensaje del agente, con la forma de un mensaje de Agente sin `de`. Mientras responde, el Orbe gira más rápido. Si falla, la Escena muestra «No pude leer las voces ahora».
- `agente`: props extra para el Agente (`sugerencias`, `modoInicial`). Las sugerencias de `consultar` también se muestran en reposo.
- `mensajes`, `abierto`, `alto` (680), `etiquetaActivar` (el texto de la barra).

Sin paneles, sin bordes de caja, sin etiquetas alrededor del Orbe: el fondo es `lienzo` con el halo del Orbe, y lo único que se toca es la barra. Bajo 760px, la conversación baja y el Orbe queda chico arriba. Las transiciones duran 450–500 ms y no ocurren con `prefers-reduced-motion`.

### Botón de voz

El botón para hablar: un Orbe iridiscente dentro de un anillo de vidrio, rodeado de rayos finos que giran despacio y crecen con la voz.

- `estado`: `reposo`, `grabando`, `procesando`, `listo` o `error`. Cambia el ícono (micrófono, cuadrado para terminar, check), el nombre accesible y el movimiento.
- `nivel`: el volumen de la voz de 0 a 1, actualizado unas 10 veces por segundo mientras graba. Agranda los rayos, el halo y el Orbe.
- `progreso`: de 0 a 1, cuánto del tiempo máximo ya se usó. Se dibuja como un arco coral sobre el anillo.
- `onClick`, `tamano` (diámetro del Orbe en px, 200), `etiqueta` (nombre accesible propio).

Movimiento: en reposo los rayos giran en 60 s y el color del Orbe en 14 s; grabando, los rayos laten con `nivel`; procesando, el color gira en 3 s y los rayos se apagan; listo, sale un eco turquesa una vez. Con `prefers-reduced-motion` todo queda quieto y solo cambian ícono y textos.

El ícono va en `on-coral`. No pongas texto encima del Orbe: el estado se escribe debajo, como hace Microfono.

### Micrófono

La pantalla donde una persona responde la consulta: la pregunta arriba, el BotonVoz al centro, el estado escrito debajo, la opción de escribir y la lista de sus voces que ya están en el mapa.

- `pregunta`: la pregunta de la consulta, en `display` a 36px. `tema`: la línea de arriba en coral («Consulta · Plaza y espacio público»).
- `limite`: segundos máximos de audio (120). Al llegar, termina solo.
- `onGrabar()`: empieza a grabar (ahí se pide el micrófono). `onTerminar(segundos)`: devuelve una promesa; al resolverse con `{ texto }`, esa frase aparece en «Tus voces». Si se rechaza, la pantalla pasa a `error`.
- `onEnviarTexto(texto)`: lo mismo para quien prefiere escribir.
- `nivel`: el volumen real del micrófono (0–1). Si no llega, la pantalla simula uno para la demo.
- `voces`: las voces previas de esta persona, como textos o `{ texto }`.
- `estado` + `onEstado`: para controlar el flujo desde afuera; `estadoInicial` para dejarlo suelto.

Textos por estado: «Toca para hablar» · «Te escucho · 0:12» · «Leyendo tu voz…» · «Tu voz está en el mapa» · «No pudimos usar tu micrófono». Siempre en tuteo y sin emoji.

Una por pantalla, sobre `lienzo` con el halo `rubor` detrás del Orbe. Sin tarjetas ni menús: lo único que se toca es el Orbe, «Prefiero escribir» y la barra de texto.

## Logo

`audem-simbolo.svg`: el símbolo, cinco ondas en `tinta` (#1e1719) que se juntan en un punto `coral` (#d94a3d). Es de dos tintas y no hereda color: sobre fondos oscuros usa el componente Marca, que toma el color del texto. Aire mínimo alrededor: un cuarto de su alto. Tamaño mínimo: 16px.
