# HACK.md

## Deadline
Entrega: POR CONFIRMAR (¿domingo 22-nov en la mañana?) · Formato del pitch: POR CONFIRMAR (min, demo en vivo, Q&A)

## Equipo
- Kaina: Kapso (webhook entrante, descarga de audio, respuestas por WhatsApp)
- Gonzalo: STT + Jev/LLMs para extraer frases, emoción y clusters
- Diego: visualizaciones, deploy y ronda 2 (mensaje desde el cluster opuesto)
- Edo: datos sintéticos (rotulados como sintéticos en la demo)
- Josefa: ausente por ahora

## Stack
Todo el backend vive en Convex (`convex/`): queries y mutaciones en `encuestas.ts`, acciones que llaman a modelos en `procesar.ts`, prompts y schemas en `extraccion.ts`. Front en React + Vite (`web/src/`), deploy en Vercel (audem.vercel.app) contra Convex dev. Paquetes con pnpm (`pnpm dev` levanta Convex y Vite). STT con Whisper y análisis con Claude. Hoy se responde desde la web; `whatsapp/` es el webhook de Kapso. El recorrido de una respuesta está en `PIPELINE.md` y el diseño en `DESIGN.md`.

## Idea
One-liner: Encuestas de opinión que se responden con un audio y muestran lo que piensa la gente en un mapa, no en un porcentaje.

Problema: encuestas como Cadem o Criteria reducen cada opinión a sí, no o una alternativa cerrada. Una opinión rara vez cabe en una casilla: apoya una parte, le preocupa otra y propone algo distinto.

Demo en 3 frases:
1. La sala escanea el QR y responde una pregunta abierta con un audio, como en WhatsApp (hoy se responde en la web con micrófono o texto).
2. En segundos su respuesta aparece en el mapa en vivo, agrupada por postura, con su cita, emoción e intensidad.
3. Con cada respuesta los temas y posturas se reordenan: las categorías salen de lo que dice la gente, no de alternativas fijadas de antemano.

Por qué es peor con una sola persona: no hay mapa ni posturas que comparar. Cada respuesta cambia cómo se agrupan las demás, así que el retrato se vuelve más fino con cada voz.
Elemento técnico difícil: pipeline audio → texto → posturas por tema (dirección, intensidad, tendencia, propuesta) → mapa en vivo con categorías que emergen de las respuestas.
Diferencia vs lo que ya existe: Cadem y Criteria miden con respuestas discretas; Pol.is y Talk to the City son texto y web. Audem mide opinión continua desde la voz.
Proyección (solo pitch, por decidir): que el sistema también elija la mejor forma de visualizar las posturas a medida que crecen las respuestas. No va en la descripción de la entrega.

## Estado compartido
Las tablas están en `convex/schema.ts`: `encuestas`, `respuestas`, `frases` y `temas` (mapa por postura), `analisis` y `topicos` (conteo por tópico neutro).

## Scorecard
| Criterio | Peso | Score | Pero | Acción |
|---|---|---|---|---|
| Técnico | 25 | | | |
| Ambición | 20 | | | |
| Ejecución | 20 | | | |
| Impacto | 20 | | | |
| Original | 15 | | | |

## Riesgos
- Kapso: plantillas de envío masivo requieren aprobación de Meta → que la gente escriba primero (QR/wa.me) para abrir la ventana de 24 h.
- Descargar el audio entrante desde Kapso y transcribirlo rápido (spike de 1 h).
- README dice "Track: Hardware": confirmar con organización que competimos en Multiplayer (no editar README).

## Decisiones (con hora)
- 21-nov 23:00: propuesta de giro multiplayer (ronda 2 cruzada + pantalla en vivo). Pendiente de confirmar por el equipo.
- 21-nov 23:15: sin QR; el link wa.me se comparte por el Discord del hackatón. Lanes asignadas (Kaina, Gonzalo, Diego).
- 21-nov ~23:45: datos sintéticos de Edo en `data/respuestas-sinteticas.json` (25 respuestas sobre la experiencia en la hackathon, campos id/participante/texto; `texto` = transcripción ronda 1). Rotular como sintéticos en la demo.
- 21-nov 23:30: nombre Audem (Cadem + audio). jsonc y project-description.md llenos; deploy-url pendiente (Diego).
- 22-nov: el análisis lo hace Claude leyendo la respuesta completa, sin Jev ni grillas fijas. Evals, técnicas descartadas y costo por respuesta en `evals/README.md`.
- 22-nov: al lado de extraer (Opus low) y agrupar corre `analizar` (Haiku medium, una fila en `analisis` por respuesta con temas libres, dirección, intensidad, tendencia, emoción y propuesta) y `normalizar` (junta esos temas en `topicos` neutros de la encuesta). Cuesta ~0,3 ¢ más por respuesta.
- 22-nov: agrupar y normalizar pasan a Haiku low para que el mapa se actualice más rápido (~15 s desde que entra un texto, antes ~22 s). Sin eval de calidad, solo tiempos (`evals/hackaton/latencia.ts`).
- 22-nov: pitch y descripción de la entrega reenfocados en encuestas de opinión con respuestas continuas, como alternativa a Cadem y Criteria. La ronda 2 cruzada sale de la descripción y del pitch. Se dice "un audio, como en WhatsApp", porque hoy se responde en la web.
- 22-nov: pantalla de tópicos en `/<slug>/voces` para cualquier pregunta: lee `encuestas.topicos` y, mientras esa query no esté desplegada o venga vacía, usa los grupos de `encuestas.mapa`. Las lecturas se calculan de los datos (sin texto escrito a mano). Se quitó la página estática `/voces.html`.
- 22-nov: chat «Preguntar» al lado del blob (`convex/chat.ts`, acción pública `chat.preguntar`, Haiku low). El modelo elige el gráfico y los ejes; los números los calcula la web. Necesita desplegar Convex para funcionar.
- 22-nov: los grupos convergen hacia la respuesta 8 (`evals/hackaton/CONVERGENCIA.md`). Hasta la 9 se reagrupa todo; desde la 10 cada respuesta solo se asigna a los grupos existentes, sin espera y en paralelo. El proxy de la hackatón da 429 con muchas llamadas concurrentes: el cliente reintenta hasta 6 veces.
- 22-nov: datos sintéticos de la demo sobre cámaras de televigilancia en el barrio (`data/camaras.json`, 60 respuestas). Con Sí / No, 50 de 60 dirían que sí; en el texto aparecen luz, respuesta policial, plaza tomada, privacidad, mantención, organización vecinal y desconfianza de las encuestas. `ADMIN_KEY=... node data/sembrar.ts` crea la encuesta y la responde de a una (4 s por defecto) para ver el mapa llenarse en `/<slug>/voces`.
- 22-nov: `/camaras/voces` dibuja la bola sin Convex desde `web/src/demo-camaras.json`, que sale de `evals/camaras/procesar.ts` (mismo análisis y normalización que la app). Con 25 respuestas cada idea tenía 2 a 5 personas y salían 22 tópicos, la mitad de una persona; por eso se subió a 60. El script reagrupa todo cada 5 respuestas en vez de cortar en la 9 como la app: con el corte, el tema de la pregunta quedó partido en dos tópicos y la patrulla que no llega cayó en reclamos municipales.

## Pendientes

## Lo que dijeron mentores/jueces
