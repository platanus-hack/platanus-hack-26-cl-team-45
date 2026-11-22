# Consulta por voz al borde de la IA

21-nov-2026. Tercera capa sobre `plan-consulta-voz.md` (el qué) y `stack-tecnico-consulta-voz.md` (la base que no se rompe). Este documento reúne lo más avanzado que hay hoy en IA para esta idea, con la evidencia de cada técnica y su versión para la hackathon.

**Fuentes.** Las fuentes al pie se revisaron hoy. Donde dice "de memoria" no se verificó.

---

## La tensión que define el diseño

La literatura reciente trae dos resultados opuestos sobre "agentes que representan a una persona":

- **Funciona con mucho contexto.** Los agentes de Stanford, construidos con **entrevistas de dos horas** a 1.052 personas, replicaron las respuestas de la Encuesta Social General con 85% de la precisión con que esas mismas personas se replican a sí mismas dos semanas después ¹.
- **Falla con contexto pobre.** En 19 estudios preregistrados, gemelos digitales construidos con más de 500 respuestas de encuesta por persona correlacionaron apenas 0,20 con lo que la persona respondió de verdad. Además mostraron cinco distorsiones: poca individualidad, estereotipos, sesgo de representación, sesgo ideológico y exceso de racionalidad ².

Con 2 minutos de audio, un gemelo que "habla por ti" va a estereotiparte. **La solución de borde no es un gemelo mejor, sino un representante que sabe cuándo no sabe y te pregunta justo eso.** Todo el diseño sale de ahí.

---

## Las 8 mejoras de borde

### 1. Entrevistador de voz adaptativo (en vez de monólogo)
- **Qué es.** Los 2 minutos pasan a ser una conversación por voz en tiempo real. El agente escucha y hace una o dos repreguntas del tipo "¿por qué?" o "¿qué te haría cambiar de opinión?", técnica que en investigación cualitativa se llama *laddering*.
- **Evidencia.** El estudio de Stanford usó justamente un entrevistador de voz con IA, y la riqueza de la entrevista es lo que hizo funcionar a los agentes ¹.
- **Qué gana.** Más razones y valores por minuto, y la repregunta "qué te haría cambiar" es oro para encontrar puentes.
- **Versión hack.** Un modelo de voz en tiempo real (de memoria: OpenAI Realtime o Gemini Live) con un guion de dos repreguntas. Si falla, se vuelve al monólogo grabado del stack base.

### 2. Señales de la voz (con cuidado)
- **Qué es.** Los modelos de voz recientes captan prosodia, emoción y titubeos, no solo palabras ³. Sirve para estimar la certeza: "dijo que sí, pero dudando".
- **Riesgo.** Inferir emoción de la voz es frágil y usa datos biométricos sensibles (Ley 21.719, art. 16 ter).
- **Versión hack.** Que sea opcional y explícito, con un campo de certeza que solo se informa agregado y nunca por persona. Se puede omitir sin perder nada central.

### 3. Representante calibrado con incertidumbre (en vez de gemelo)
- **Qué es.** El representante de cada persona predice qué aceptaría, **con un intervalo de confianza**. Cuando el intervalo es ancho, no adivina: le pregunta a la persona.
- **Técnica.** **Predicción conforme** (conformal prediction) sobre las predicciones del representante, calibrada con las confirmaciones de las personas, para que "90% seguro" signifique de verdad 90%. Es aprendizaje activo: se pregunta donde más se aprende.
- **Por qué es borde.** Ataca directo las cinco distorsiones de los gemelos ²: lo que el representante no sabe se convierte en una pregunta y no en un estereotipo.
- **Versión hack.** Similitud y filtrado colaborativo del stack base, más un umbral simple. Si la predicción está entre 0,4 y 0,6, se pregunta.

### 4. Elección social generativa: una lista proporcional y no un solo consenso
- **Qué es.** En vez de un único texto común, el sistema genera **una lista corta de posturas que representa proporcionalmente a todos**, de modo que cada persona se vea reflejada en al menos una. Combina garantías de teoría de elección social con generación por LLM ⁴.
- **Por qué importa.** Un trabajo de ETH de este mes mostró que cuando el mediador busca *acuerdo*, cubre mucho menos las posturas minoritarias que cuando se le pide *describir diferencias* ⁵.
- **Diseño.** Dos salidas, siempre juntas: la **lista proporcional** (describe diferencias) y la **postura puente** (busca acuerdo, elegida con Schulze como en la Habermas Machine ⁶).
- **Versión hack.** Lista de 3 a 5 posturas con una regla voraz: agregar la postura que más personas no representadas cubre. Cada persona tiene que quedar cubierta por alguna.

### 5. Mediador estable y auditable (contra la lotería del LLM)
- **El problema.** Con las mismas 30 opiniones, mediadores LLM redactaron propuestas distintas en 17% a 20% de las corridas. Cambiar el orden de las opiniones alteró las propuestas casi tanto como reemplazarlas por las de otras personas, y la variación siguió aunque se usara temperatura 0 ⁵.
- **Técnica de borde.**
  - Correr el mediador **varias veces con el orden de las opiniones permutado**.
  - Agrupar los borradores y quedarse con el que aparece en la mayoría de las corridas.
  - **Mostrar las alternativas** cuando no hay mayoría clara.
  - Publicar el objetivo del mediador junto a cada propuesta, como recomienda el mismo trabajo ⁵.
- **Versión hack.** Cinco corridas con orden aleatorio. El panel muestra un "índice de estabilidad" de la postura puente. Para el jurado es un detalle muy fuerte.

### 6. Verificación con agentes, con humanos al mando
- **Qué es.** Un agente investigador busca evidencia para cada afirmación y redacta la nota. **Las personas** del panel la califican, y la nota solo se muestra si la aprueban personas que suelen discrepar.
- **Evidencia.** X abrió en 2025 la API de "AI Note Writers": la IA escribe notas y estas se muestran solo si las encuentra útiles gente que normalmente discrepa. Los escritores con IA ganan o pierden capacidades según cómo las califica esa gente ⁷. Un paper con el equipo de Community Notes propone usar esas calificaciones humanas para seguir entrenando al modelo ⁸ (de memoria: lo llaman aprendizaje por refuerzo con retroalimentación de la comunidad).
- **Qué gana.** La verificación deja de ser "lo que dice la IA" y pasa a ser "lo que la IA encontró y validaron personas de grupos distintos". Ahí está lo multiplayer.
- **Versión hack.** Corpus precargado más inferencia de lenguaje natural del stack base. La calificación entre grupos se muestra con los votos de la sala.

### 7. Devolución personal que no manipula
- **Evidencia a favor.** Conversaciones con IA basadas en hechos redujeron de forma durable creencias conspirativas, incluso en personas muy convencidas ⁹.
- **Evidencia en contra.** El mismo grupo mostró que la IA es **igual de efectiva para convencer de lo falso**. La IA que promovía la conspiración fue mejor evaluada, y las barreras estándar del modelo casi no lo impidieron. Instruirla para usar solo información precisa redujo mucho ese efecto ¹⁰.
- **Diseño.**
  - La devolución solo usa afirmaciones verificadas con fuente enlazada.
  - Trae siempre una fuente a favor y una en contra.
  - Nunca discute valores.
  - Un segundo modelo audita cada devolución antes de enviarla: ¿hay algo sin fuente?, ¿empuja hacia una postura?
  - Registro público de qué se le dijo a cada grupo.
- **Versión hack.** Plantilla fija donde el LLM solo rellena con citas validadas, más el auditor.

### 8. Simulación como herramienta de diseño, nunca como reemplazo
- **Qué es.** Antes de lanzar una pregunta, se prueban con una población sintética para detectar ambigüedades o preguntas que no generan desacuerdo.
- **Límite duro.** Por la evidencia de distorsiones ², **los resultados simulados nunca se reportan como opinión**. Sirven para diseñar la pregunta y para tener datos de respaldo en la demo.

---

## Por qué con esto el sistema mejora con cada persona

| Mejora de borde | Qué aporta la persona N+1 |
|---|---|
| Entrevistador adaptativo | Sus respuestas mejoran las repreguntas para los siguientes (qué "por qué" abre más) |
| Representante con incertidumbre | Sus confirmaciones calibran a todos los representantes parecidos a ella |
| Lista proporcional | Si trae una postura nueva, la lista se amplía; si no, refuerza una existente |
| Postura puente | Si es de otro grupo, la postura gana legitimidad |
| Mediador estable | Más opiniones hacen más estable la postura puente frente al orden |
| Verificación entre grupos | Califica notas y entrena al agente verificador |
| Devolución | Su reacción indica si la devolución se percibe como justa o como empuje |

El insumo escaso es el juicio humano, y el diseño lo pide solo donde la IA tiene menos certeza. Por eso el valor de cada persona no se diluye al crecer.

---

## Qué mostrar al jurado (lo que nadie más va a tener)

1. **Entrevista de voz** de 2 minutos con una repregunta inteligente, en vivo con un voluntario.
2. **El representante dudando:** "con 62% de probabilidad aceptarías esto, así que te pregunto". Muestra que la IA sabe lo que no sabe.
3. **Índice de estabilidad del mediador:** la misma postura puente sale en 5 de 5 corridas con orden permutado, o el panel muestra las alternativas si no.
4. **Lista proporcional junto a la postura puente**, con cada persona de la sala viendo cuál la representa.
5. **Nota verificada aprobada entre grupos**, calificada por la sala.
6. **Curva de calidad contra número de personas** subiendo en vivo.

## Prioridad si el tiempo no alcanza

1. Mediador estable con permutaciones (barato y con mucho impacto).
2. Lista proporcional junto a la postura puente.
3. Representante con umbral de incertidumbre.
4. Entrevistador de voz adaptativo.
5. Verificación calificada entre grupos.
6. Señales de voz (la más prescindible).

Todo se monta sobre el stack base: si una mejora de borde falla en el escenario, se apaga con una variable y queda la versión determinista.

---

## Fuentes
1. Park y otros, "Generative Agent Simulations of 1,000 People" (arXiv 2411.10109, Stanford, 2024).
2. Peng y otros, "Digital twins are funhouse mirrors: Five systematic distortions", *Science Advances* (2-sep-2026).
3. Kim y otros, "Aligning Paralinguistic Understanding and Generation in Speech LLMs via Multi-Task RL" (arXiv 2603.15981; EACL 2026 Industry).
4. Fish, Procaccia y otros, "Generative Social Choice" (arXiv 2309.01291; ACM EC 2024).
5. Mahajan y otros (ETH Zürich), "From Opinions to Commitments: Unstable Assignments and Silent Choices in AI-Mediated Proposals" (arXiv 2611.05135, 3-nov-2026).
6. Tessler, Bakker y otros, "AI can help humans find common ground in democratic deliberation", *Science* (2024).
7. X Community Notes, documentación de la AI Note Writer API (GitHub twitter/communitynotes).
8. Li, De, Revel, Haupt, Miller, Coleman, Baxter, Saveski y otros, "Scaling human judgment in Community Notes with LLMs" (arXiv 2506.24118).
9. Costello, Pennycook y Rand, "Durably reducing conspiracy beliefs through dialogues with AI", *Science* (2024).
10. Costello y otros, "Large language models can effectively convince people to believe conspiracies" (arXiv 2601.05050, N = 2.724).
