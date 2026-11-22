# Cómo llevar la consulta por voz a 100 en Platanus Hack (track Multiplayer)

21-nov-2026. Ola 3 de la investigación: 4 subagentes, 138 hallazgos nuevos con cita literal (sub-8 a sub-11). El ledger total quedó en 382 hallazgos y 205 fuentes, con 5 citas sin verificar. Los puntajes son juicio mío; lo demás lleva su fuente.

**Respuesta corta.** 100 no se puede garantizar: no hay descriptores oficiales de la rúbrica ni se conoce al jurado de Santiago 2026. Lo que sí se puede hacer es quitar cada "pero" conocido. La investigación encontró tres cosas que cambian el plan:

1. **La idea de "un agente por persona + Schulze + devolución + tiempo" ya existe.** Se llama Habermolt (arXiv 2605.24413, mayo 2026). No se puede presentar como novedad.
2. **Habermolt documenta sus propias fallas**, y ahí está el espacio para ser original y técnico a la vez.
3. **En Platanus gana la demo que funciona y el problema concreto**, según los ganadores de 2025 y el organizador.

---

## 1. El antecedente que hay que enfrentar: Habermolt

Qué ya hace (https://arxiv.org/html/2605.24413v3):
- Agente representante persistente por usuario, con entrevista y actuación en ausencia de la persona.
- Candidatos escritos por agentes y ganador elegido con Schulze.
- Correo semanal para que la persona revise las acciones con más riesgo de mala representación.
- Consenso continuo en el tiempo.

Qué le falla, según el mismo paper:
- Las opiniones que el agente genera solo son **menos diversas** que las que salen de una entrevista sobre el tema.
- **Casi nadie corrige a su agente:** 8 de 91 usuarios revisaron una opinión.
- **Las correcciones no reparan lo que el agente ya hizo** en deliberaciones anteriores.
- Produce un consenso único, sin lista proporcional de posturas.
- Pide como trabajo futuro entrevistas que detecten lagunas o contradicciones con la memoria.

Otros riesgos medidos en trabajos cercanos:
- Agentes más verbosos o menos cooperativos ganan influencia (Google Research, 746 personas, preprint nov-2026: https://arxiv.org/abs/2611.16028).
- La deliberación con LLM puede borrar hasta 72% de los hechos críticos en las condiciones del estudio DelibTrace (https://arxiv.org/abs/2606.03032).

Tampoco son novedad: voz, entrevista adaptativa con repreguntas, rondas encadenadas y resúmenes anclados en citas. Ya los tienen Jigsaw, Remesh, Harmonica, Cortico y Go Vocal (documentación de los proveedores).

## 2. El giro: delegación auditable

El núcleo deja de ser "agentes que conversan" y pasa a ser **un agente que sabe cuándo no representarte, y una corrección que se propaga**. Cuatro mecanismos, cada uno atado a una falla documentada:

| Mecanismo | Falla que ataca | Cómo se ve en la demo |
|---|---|---|
| **Abstención calibrada.** El representante no vota donde no tiene base; pregunta | Opiniones autónomas menos diversas; gemelos que estereotipan | "Tu agente se abstuvo en 4 de 20 votos y te pregunta por 1" |
| **Corrección retroactiva.** Cada voto del agente guarda de qué frase tuya salió. Si corriges una, se recalculan todos sus votos derivados y la postura puente | Las correcciones no reparan lo pasado | Una persona corrige a su agente en el teléfono y la postura puente cambia en todas las pantallas |
| **Corrección de 10 segundos.** Una sola pregunta, la de mayor incertidumbre, con tres botones: me representa, me tergiversa, cambié de idea | Solo 8 de 91 corrigen | La sala completa responde y se muestra la tasa de corrección en vivo |
| **Influencia pareja.** Cada agente pesa lo mismo: tope de largo y un voto por persona | Verbosos y no cooperativos ganan influencia | Lámina con el antes y después de un agente "gritón" sembrado |

Junto con eso, dos salidas siempre visibles: la **postura puente** y la **lista proporcional** de 3 a 5 posturas, donde cada persona ve cuál la representa. Schulze elige un ganador pero no garantiza proporcionalidad, y ninguna regla domina todos los criterios (https://arxiv.org/abs/2602.15439; ICML 2025: https://proceedings.mlr.press/v267/revel25a.html).

**La frase de diferencia:** "Habermolt mostró que los agentes representantes aplanan las opiniones y que nadie los corrige. Nosotros construimos el representante que se abstiene cuando no sabe y que repara todo lo que hizo cuando lo corriges."

No encontramos esa combinación documentada. Eso no prueba que no exista.

## 3. Qué da un 5 en cada criterio

| Criterio | Qué pide la evidencia | Acción | Horas |
|---|---|---|---|
| **Técnico 25** | Mecanismo propio y explicable, no un wrapper | Grafo de procedencia con recálculo retroactivo. Factorización puente más lista proporcional. Índice de estabilidad con 5 corridas permutadas. Una lámina de arquitectura | 12 |
| **Ambición 20** | Interacción que suena irrazonable y es real | El jurado entra por QR y es parte de la asamblea. Postura puente firmada por grupos que discrepan en 5 minutos | 4 |
| **Ejecución 20** | Funciona al primer intento con la sala | Ver sección 4. Ensayo con 200 conexiones en la red del recinto | 8 |
| **Impacto 20** | Un grupo, una decisión, un número, quién paga | Ver sección 5. Un grupo real de afuera lo usa durante el hack | 4 |
| **Original 15** | No lo han visto, y se nota que conocen lo que existe | Nombrar a Habermolt en el pitch y mostrar las dos fallas resueltas | 1 |

Mi estimación con todo esto: Técnico 5, Ambición 4,5 a 5, Ejecución 4,5 a 5, Impacto 4,5, Original 4,5. Total entre 93 y 97. Los últimos puntos dependen de cosas que no se controlan: el gusto del jurado y que la demo salga limpia.

## 4. Ejecución: los números que deciden

Lo que dijeron los ganadores: Safeline (2025) atribuye el triunfo a que su demo funcionó cuando otras fallaron, y a haber acotado una primera idea inabordable (entrevista en spoilerbuk.com; relato de participantes, no acta del jurado). Un participante cuenta que su prototipo funcionó antes y después, pero no en el escenario, y no ganó (hack.platan.us/tour/sponsor). El pitch de 2025 fue de 3 minutos; el formato 2026 no está confirmado.

Tiempo real (docs oficiales, consultadas el 21-nov-2026):
- **Supabase Free:** 200 conexiones y 100 mensajes por segundo. El envío a cada suscriptor cuenta: actualizar 200 teléfonos una vez por segundo ya son 200 eventos por segundo. Free no alcanza. Pro da 500 y 500.
- **Ably Free:** 500 conexiones y 500 mensajes por segundo, con tope de 50 conexiones nuevas por segundo. Ojo con el momento en que toda la sala escanea el QR.
- **Liveblocks:** 10 conexiones por sala en Free y Pro. No sirve para una sala única.
- **Firebase Realtime Database gratis:** 100 conexiones.
- **Cloudflare Durable Objects:** hasta 32.768 WebSockets por objeto, sujeto a CPU y memoria.

Decisión: enviar instantáneas chicas y versionadas cada 3 a 5 segundos, sin presencia granular ni eventos por token.

Voz:
- **No usar 200 entrevistadores de voz en vivo.** Deepgram Voice Agent admite 45 sesiones en pago por uso, y hay un reporte de usuario de rechazos al séptimo socket en Gemini Live (no confirmado como límite general).
- **Grabar en el teléfono y subir a una cola.** Deepgram Nova-3 admite 50 archivos concurrentes y cuesta USD 0,0058 por minuto: 400 minutos son unos USD 2,3.
- La entrevista de voz en vivo queda para **un voluntario en el escenario**.
- La ficha de gpt-4o-transcribe aparece marcada como obsoleta: probar acceso antes de elegirlo.
- En iPhone: detectar el formato con `isTypeSupported`, conservar el tipo real del archivo y probar en Safari real. Si la pantalla se bloquea, la grabación se pausa.

LLM: cola central con concurrencia acotada, reintento con espera, guardar la respuesta antes de llamar a la IA y conservar siempre el último resultado válido.

Algoritmos: el código de puntaje de Community Notes está publicado en Python. red-dwarf reproduce el pipeline de Polis en Python, pero no garantiza equivalencia sobre 100 participantes.

## 5. Impacto: un grupo, una decisión

Lo que dice el organizador (Rafael Fernández, citado en DF): buscan algo que pueda volverse gigante, pero el producto del hack tiene que ser ante todo la solución a un problema. Los ganadores conocidos tenían un usuario reconocible: niños y hábitos financieros en 2024, estafas telefónicas en 2025.

Números para el pitch:
- **Bowling Green, EE.UU.:** 7.890 residentes y 3.940 ideas en 33 días, encargado por el gobierno del condado (autorreporte del proyecto).
- **California:** el programa de consultas quedó permanente por ley; más de 900 afectados por incendios y 1.400 empleados públicos consultados. Usó Ethelo, no Polis.
- **Chile:** 29 municipios usaron Evoting en la consulta de 2019, con más de dos millones de participantes (evento extraordinario). Las Condes reunió a más de 1.600 vecinos para su política de IA en 2024.
- **Precio de referencia:** Go Vocal ofrece su licencia anual entre £12.500 y £36.500 en el catálogo de compras británico (oferta, no contrato).
- **El dolor real:** practicantes de RRHH dicen que la fatiga de encuestas viene de que después no pasa nada (opinión individual en Reddit). Buk ya resume comentarios con IA, así que resumir no diferencia.

Qué hacer:
- Elegir **un grupo y una decisión concreta**. No "consultas ciudadanas" en general.
- Conseguir que **quien decide se comprometa a responder** qué adopta y qué rechaza. Eso ataca el dolor de "después no pasa nada".
- Correrlo con ese grupo durante el hack y mostrar el resultado: cuántos participaron, qué porcentaje firmó la postura puente y cuántos corrigieron a su agente.
- Por qué tiene que ser multiplayer: sin grupos que discrepan evaluando las mismas propuestas no hay puente que validar.

## 6. Guion de 3 minutos

1. **0:00 a 0:20.** El problema del grupo real y su número.
2. **0:20 a 1:30.** La sala y el jurado entran por QR y responden. El mapa crece. Aparece la postura puente con su índice de estabilidad.
3. **1:30 a 2:10.** Un voluntario corrige a su agente. La postura cambia en todas las pantallas.
4. **2:10 a 2:40.** Lámina de arquitectura y la frase sobre Habermolt.
5. **2:40 a 3:00.** Resultado del grupo real y quién paga.

Respaldo: 60 respuestas sintéticas rotuladas como tales, video grabado y botón para congelar el último estado bueno.

## 7. Lo que baja puntaje

- Presentar como nuevo lo que ya existe. Un juez que conozca Habermolt o Polis lo nota.
- Prometer que los agentes deliberando mejoran el resultado. Un proyecto premiado en otra hackathon midió que el debate entre agentes no mejoró la exactitud.
- Mostrar cifras por edad con pocas respuestas.
- Depender del wifi del recinto sin haberlo probado.

## Lo que no se encontró

- Descriptores oficiales de 0 a 5 y reglas públicas del track.
- Jurado de Santiago 2026 y sus criterios. Según el subagente, Santiago termina el 22-nov; no lo verifiqué.
- Latencias medidas y prueba de carga de esta arquitectura. Nada de esto se ejecutó.
- Calidad comparada de transcripción en español chileno.
- Montos adjudicados en Chile y tasas de participación municipal típicas.
- Un caso de mediación con IA en Chile en 2025 o 2026.
- Las secciones de Jigsaw sobre acuerdo predictivo y de Polis sobre voz quedaron truncadas; no se citan.
