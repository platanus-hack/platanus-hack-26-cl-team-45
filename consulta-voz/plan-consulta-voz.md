# Consulta por voz con agentes: plan de borde

21-nov-2026. Idea de Edo: una pregunta de opinión, un enlace personal y anónimo, 2 minutos de audio, un modelo que contrasta todas las opiniones, un informe por grupo de edad contra la mirada general, y una devolución personal con fuentes que apoyan o contradicen. Envío periódico.

Este plan la lleva al borde técnico y la vuelve multiplayer de verdad: el sistema tiene que mejorar con cada persona que participa (tesis de `moonshot-principio.md`). Lo marcado con [n] sale de `informe.md`; lo demás tiene fuente al pie o es diseño propio.

---

## 1. El salto: de encuesta a red de representantes

Tal como está, la idea es una multitud que alimenta a un modelo central. El salto es que **cada participante tenga un agente propio que lo representa**, y que el trabajo pase entre esos agentes:

- **Representante.** Nace del primer audio y se afina con cada respuesta. Guarda la postura, las razones y los límites de la persona, en privado. Nunca habla en público por ella sin que ella lo confirme.
- **Mediador.** Busca posturas que acepten personas de grupos distintos. No promedia.
- **Verificador.** Saca las afirmaciones de hecho de cada audio y las contrasta con fuentes.
- **Pregunta siguiente.** Decide qué preguntarle a quién en la próxima ronda.

Lo que cambia: las personas hablan 2 minutos, y entre una ronda y la otra sus representantes negocian, prueban posturas y detectan dónde está el desacuerdo real. La persona vuelve solo para confirmar o corregir.

## 2. El ciclo de una ronda

| Paso | Qué pasa | Técnica de borde |
|---|---|---|
| 1. Enlace | Llega por WhatsApp o correo, personal y de un solo uso. Lo que se sabe de la persona es solo el tramo de edad y lo que ella declare | Token firmado sin nombre; el tramo se guarda separado del contenido |
| 2. Voz | Graba hasta 2 minutos. Puede regrabar | Transcripción en el momento. El audio se borra apenas existe el texto |
| 3. Desarme | Del texto salen la postura, las razones, los valores y las afirmaciones verificables, cada cosa con su cita textual | Extracción con cita obligatoria, como Talk to the City, donde cada tema remite a frases reales de los participantes ¹ |
| 4. Representante | Se crea o se actualiza el agente de la persona | Modelo de preferencias personal: predice qué postura aceptaría ella |
| 5. Negociación | Los representantes votan miles de borradores de postura común; el mediador los reescribe hasta encontrar los que cruzan grupos | Habermas Machine de DeepMind: un modelo genera borradores y otro predice cuánto los aprobaría cada persona. Con 5.734 personas, los preferidos a los de mediadores humanos ² |
| 6. Filtro puente | Una postura solo vale como "común" si la apoyan representantes de grupos que normalmente discrepan | Algoritmo puente al estilo Community Notes (diseño propio aplicado acá) |
| 7. Verificación | Cada afirmación de hecho se cruza con fuentes con su enlace: respalda, contradice o sin evidencia | Recuperación con cita y nivel de confianza. Las opiniones y los valores no se verifican |
| 8. Informe general | Mapa de posturas, cuánto apoyo tiene cada una, contraste por tramo de edad, citas anónimas y lo que quedó sin acuerdo | Tramos con un mínimo de respuestas; ruido estadístico en los conteos chicos |
| 9. Devolución personal | Dónde quedas tú frente al resto y frente a tu tramo, qué fuentes respaldan o contradicen lo que dijiste, y la postura puente con su pregunta: "¿la firmarías?" | Mensaje generado por persona, con fuentes que respaldan y que contradicen siempre juntas |
| 10. Confirmación | En 30 segundos confirma, corrige o rechaza a su representante y a la postura puente | Esa corrección entrena a su representante y al mediador |

La ronda siguiente no repite la pregunta: sale del punto con más desacuerdo o con menos información.

## 3. Por qué explota con más personas

| Motor | Qué mejora con cada persona |
|---|---|
| **Mediación** | El modelo que predice aprobaciones aprende de cada confirmación. En la Habermas Machine, que mejoraba con rondas de datos humanos, sumar ronda de críticas subió la aprobación ² |
| **Puentes** | Una postura común es más valiosa cuantos más grupos distintos la cruzan. Mil personas del mismo grupo no suman; una del grupo que falta sí |
| **Verificación** | Cada audio trae afirmaciones nuevas, y las verificaciones se reutilizan para todos los que dijeron lo mismo |
| **Pregunta siguiente** | Más respuestas permiten ubicar mejor dónde está la incertidumbre real y preguntar justo eso |
| **Representantes** | Con más historial, el representante predice mejor a su persona y ella necesita confirmar menos |
| **Precisión por grupo** | Más personas por tramo significa tramos más finos que superan el mínimo |

**La prueba de que funciona:** graficar la calidad contra el número de participantes (10, 30, 100, 1.000). Calidad: porcentaje de personas que firma la postura puente, fracción de afirmaciones verificadas y aciertos del representante al predecir a su persona. Si la curva se aplana pronto, es una encuesta con IA.

## 4. Lo que va a romperse (y el diseño contra eso)

| Riesgo | Evidencia | Diseño |
|---|---|---|
| **Homogenizar** | Mostrar el razonamiento de la IA hace que la gente use menos su propio conocimiento [104]. En la Habermas Machine los grupos convergieron después de deliberar ² | Primero cada uno habla solo. El informe muestra también lo que quedó sin acuerdo y por qué. Medir la diversidad de posturas ronda a ronda y alertar si colapsa |
| **Minorías mal pesadas** | En la Habermas Machine, después de las críticas el sistema sobreponderaba a la minoría ³ | Mostrar el peso real de cada postura, no solo el texto puente |
| **Persuasión encubierta** | Una devolución personalizada puede volverse propaganda | Fuentes a favor y en contra siempre juntas. Nunca decir "estás equivocado" sobre un valor. Registro público de cómo se eligen las fuentes |
| **Reidentificación** | La voz identifica. Pocas respuestas en un tramo delatan | Borrar el audio, mínimo por tramo, quitar nombres y lugares del texto citado |
| **Bots y personas con varios enlaces** | Ningún sistema abierto aguantó el troleo: AI Village cerró el chat público [59] | Enlaces de un solo uso entregados por un canal con identidad (lista del gremio, colegio, municipio). Anónimo para el análisis, no para el acceso |
| **Muestra sesgada** | Responde quien quiere | El informe lo dice. Si hay datos del padrón, se repondera por edad |
| **Agente que habla por ti** | El representante puede equivocarse | Nunca firma por la persona. Lo predicho y lo confirmado se reportan aparte |

## 5. Marco legal en Chile

- La voz es dato biométrico y los biométricos son sensibles en la Ley 21.719 (art. 16 ter), con consentimiento expreso e información específica sobre finalidad y plazo ⁴. Las convicciones ideológicas y políticas también son datos sensibles.
- Vigencia: el texto actual dice 1-dic-2026. El 17-nov-2026 el Congreso despachó la postergación al 15-oct-2027; falta publicarla ⁵. Conviene diseñar como si ya rigiera.
- En la práctica: consentimiento al grabar, borrado del audio en minutos, texto seudonimizado, tramo de edad separado y derecho a borrar todo lo de la persona.

## 6. Plan por fases

### Fase 0: demo en 48 horas (hackathon)
- Página con contador de 2 minutos, transcripción y extracción con citas.
- Representante simple por persona, con un prompt y su historial.
- Mediador que genera 20 borradores y los vota con los representantes.
- Informe general y devolución personal en pantalla.
- **Demo en vivo:** el público responde una pregunta en sala, se ve la postura puente cambiar a medida que entran personas, y cada uno recibe su devolución.

### Fase 1: piloto (4 a 6 semanas)
- 30 a 50 personas, tres rondas sobre una pregunta real.
- WhatsApp como canal, verificación con fuentes reales y mínimo por tramo.
- Medir: tasa de respuesta en la ronda 2 y 3, firmas a la postura puente, aciertos del representante y diversidad de posturas.
- Criterio para seguir: que más de la mitad vuelva a la ronda 2 y que el representante acierte en la mayoría de las confirmaciones.

### Fase 2: escala (3 a 6 meses)
- Entre 300 y 3.000 personas.
- Modelo de preferencias entrenado con las confirmaciones acumuladas.
- Preguntas adaptativas y verificación con caché compartido.
- Reporte abierto con citas, al estilo Talk to the City.

### Fase 3: red permanente
- Panel que vive en el tiempo: el representante de cada persona sigue activo entre consultas y puede responder una pregunta nueva como predicción, que la persona confirma.
- Varias organizaciones consultando sobre el mismo panel, con permisos.

## 7. Qué lo distingue de lo existente

| | Pol.is / Remesh | Talk to the City | Habermas Machine | Este plan |
|---|---|---|---|---|
| Voz corta | No | Puede procesar audio y WhatsApp ¹ | No | Sí |
| Representante por persona | No | No | Modelo de preferencias, sin agente persistente | Sí, persistente y corregible |
| Postura puente entre grupos | Pol.is agrupa | Agrupa temas | Sí | Sí, con filtro puente |
| Verificación con fuentes | No | No | No | Sí |
| Devolución personal | No | No | No | Sí |
| Rondas en el tiempo | Limitado | No | 2 rondas | Continuo |

(Columnas de Pol.is y Remesh de memoria; no las verifiqué hoy.)

## 8. Decisiones abiertas

1. Primer piloto: un grupo con canal de identidad propio (socios del gremio, un colegio, la subgerencia).
2. Primera pregunta: real y con desacuerdo, porque sin desacuerdo el mediador no tiene trabajo.
3. Qué se publica: solo el informe general o también las posturas puente con su apoyo.

---

## Fuentes externas usadas en este plan
1. Talk to the City, AI Objectives Institute: talktothe.city
2. Tessler, Bakker y otros, "AI can help humans find common ground in democratic deliberation", Science (2024): science.org/doi/10.1126/science.adq2852 · MIT Technology Review, 17-oct-2024
3. Knight First Amendment Institute, "Can AI Mediation Improve Democratic Deliberation?": knightcolumbia.org
4. Ley 21.719, BCN (art. 2 letra g y art. 16 ter, texto consolidado de LegalDatos)
5. Datos Protegidos, "El Congreso aprobó postergar la Ley 21.719 al 15 de octubre de 2027" (actualizado 17-nov-2026)
