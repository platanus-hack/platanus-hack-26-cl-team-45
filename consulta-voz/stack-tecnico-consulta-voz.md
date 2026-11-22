# Consulta por voz: stack técnico que no se rompe en la hackathon

21-nov-2026. Complementa `plan-consulta-voz.md`. Este documento define las piezas técnicas: los modelos, las estructuras matemáticas y los marcos de lenguaje y de antropología.

**Fuentes.** La Habermas Machine con Schulze, las 5.734 personas y la Ley 21.719 se verificaron hoy. El resto de las técnicas es de memoria: son métodos conocidos y publicados (Pol.is, Community Notes, Haidt, Schwartz, Toulmin), pero conviene revisar sus detalles antes de citarlos en público.

## Principio rector: el LLM entiende, la matemática decide

Lo que se rompe en una hackathon es siempre lo mismo: un LLM que improvisa en vivo, un JSON mal formado, una API lenta o un resultado que cambia cada vez que se recarga.

La regla es que el LLM hace solo una cosa: **convertir voz y texto en datos estructurados**, con un esquema fijo. Todo lo que decide (grupos, puentes, ranking, conteo por edad, privacidad) es matemática determinista: se puede reproducir, es rápida y no alucina. Si el LLM falla, se cae una respuesta y no la demo.

```
audio → [STT] → texto → [LLM con esquema] → JSON (postura, razones, hechos, valores)
                                   ↓
         [matemática determinista: embeddings, matriz, factorización, Schulze, k-anon]
                                   ↓
              [LLM solo para redactar] → informe y devolución (con citas obligatorias)
```

---

## 1. Voz a texto

| Opción | Uso | Por qué |
|---|---|---|
| **Principal:** transcripción por API (OpenAI gpt-4o-transcribe o Deepgram Nova, con español) | En la hackathon | Rápida, sin GPU y aguanta el español chileno razonablemente |
| **Respaldo:** Whisper large-v3 o faster-whisper local | Si la API cae o hay datos sensibles | Corre en una GPU o en CPU más lento |
| **Último recurso:** caja de texto | Siempre visible | Si el micrófono falla, la persona escribe |

Detalles que evitan caídas:
- Grabar en el navegador con MediaRecorder en webm/opus y cortar a los 120 s en el cliente.
- Subir el archivo completo, no streaming: un corte de red se reintenta y no se pierde la respuesta.
- Borrar el audio apenas existe el texto (dato biométrico, Ley 21.719 art. 16 ter).
- Glosario chileno en el prompt de transcripción (Metro, Fonasa, Isapre, permiso de circulación).

## 2. Extracción estructurada (único lugar donde el LLM "piensa")

Un LLM con salida en esquema JSON estricto (structured outputs) devuelve, por respuesta:

```json
{
  "postura": {"texto": "...", "a_favor_en_contra": -1.0..1.0, "cita": "..."},
  "razones": [{"texto": "...", "tipo_toulmin": "dato|garantia|respaldo|refutacion", "cita": "..."}],
  "afirmaciones_hecho": [{"texto": "...", "verificable": true, "cita": "..."}],
  "valores": {"cuidado": 0..1, "justicia": 0..1, "lealtad": 0..1, "autoridad": 0..1, "pureza": 0..1, "libertad": 0..1},
  "marco": "economico|moral|seguridad|identidad|practico",
  "emocion": "...",
  "certeza": 0..1
}
```

Reglas de robustez:
- **Cita obligatoria.** Cada campo trae el fragmento textual de donde sale. Un validador revisa que la cita exista literalmente en la transcripción; si no está, el campo se descarta. Así se mata la alucinación.
- **Temperatura 0** y esquema validado con Pydantic o Zod. Un error se reintenta una vez y luego se marca como "sin procesar", sin bloquear nada.
- **Dos modelos de proveedores distintos** detrás de una misma función, para cambiar de proveedor con una variable si uno se cae.
- **Caché por hash del texto**, para no repetir llamadas al refrescar la demo.

## 3. Marcos de lenguaje y antropología (qué extraer y por qué)

Sirven para que el informe explique *por qué* la gente piensa distinto, no solo *qué* piensa.

| Marco | Qué aporta | Cómo se usa |
|---|---|---|
| **Teoría de los fundamentos morales** (Haidt y Graham) | Dos personas pueden discrepar porque pesan valores distintos (cuidado, justicia, lealtad, autoridad, pureza, libertad), no por los hechos | Vector de valores por persona. El informe dice "los mayores de 60 apelan más a seguridad y autoridad; los menores de 30 a justicia" |
| **Valores básicos de Schwartz** | Versión más fina y validada entre culturas | Alternativa o complemento de Haidt. Elegir uno para la demo |
| **Modelo argumentativo de Toulmin** | Separa el dato, la regla que lo conecta con la conclusión y la refutación | Así se distingue qué parte de una opinión es verificable (el dato) y qué es juicio (la garantía) |
| **Encuadres (framing)**, Entman y Lakoff | El mismo tema visto como económico, moral, de seguridad o de identidad | Explica por qué dos grupos "hablan de cosas distintas" con la misma pregunta |
| **Cognición cultural** (Kahan) | La gente evalúa la evidencia según su grupo | Justifica mostrar fuentes a favor y en contra juntas, y no "corregir" |
| **Detección de postura** (stance detection) | A favor, en contra o neutral respecto de la pregunta | Eje principal del mapa |

Con estos marcos, la postura puente se puede escribir en el lenguaje de valores de cada grupo y no solo en el del promedio.

## 4. Estructuras matemáticas (el corazón determinista)

### 4.1 Representación
- **Embeddings** de cada razón y cada postura (por ejemplo text-embedding-3-large o un modelo multilingüe abierto como bge-m3 o multilingual-e5).
- **Matriz persona × enunciado:** cada persona vota o es predicha sobre cada enunciado (+1, 0, −1). Es la estructura de Pol.is.

### 4.2 Grupos de opinión
- **PCA + k-means** sobre la matriz de votos, como Pol.is. Es simple, estable y explicable; para la demo, k entre 2 y 4 elegido con silhouette.
- **Alternativa con texto:** UMAP + HDBSCAN sobre embeddings. Encuentra grupos con forma rara, pero es más frágil con pocos datos. Con menos de 100 personas, mejor PCA + k-means.
- **Semilla fija** en todo, para que el mapa no salte al recargar.

### 4.3 Puentes: factorización matricial al estilo Community Notes
Se modela cada voto como:

  voto(u, n) ≈ μ + i_u + i_n + f_u · f_n

donde f es la posición en el eje de polarización e **i_n es el apoyo que un enunciado recibe más allá de la polarización**. Un enunciado con i_n alto es apoyado por gente de ambos lados: esa es la postura puente. Es un mínimo cuadrados regularizado que se resuelve en milisegundos para miles de votos.

### 4.4 Elegir la postura común: elección social
- El LLM genera N borradores de postura común (por ejemplo 16).
- Cada representante (o cada persona, en la ronda de confirmación) los ordena.
- Se elige el ganador con el **método de Schulze**, que es el que usó la Habermas Machine ([Science 2024](https://www.science.org/doi/10.1126/science.adq2852)). Siempre da un ganador de Condorcet si existe y se programa en 40 líneas.
- Si se vota por pares en vivo, se usa **Bradley-Terry** (o Elo) para convertir comparaciones en un ranking.

### 4.5 Representante por persona (modelo de preferencias)
Para la hackathon no se entrena nada:
- El representante es el **vector de la persona**: postura, valores, embedding de sus razones y sus votos confirmados.
- Predecir si aceptaría un borrador = similitud coseno entre el borrador y sus razones, más el ajuste de sus votos anteriores (filtrado colaborativo: gente parecida votó así).
- Como respaldo, un juez LLM con su historial que puntúa del 1 al 7, solo si hay tiempo.

Más adelante se reemplaza por un modelo de recompensa personalizado entrenado con las confirmaciones, como la Habermas Machine.

### 4.6 Grupos de edad sin ruido ni delación
- **Contracción bayesiana (empirical Bayes):** la proporción de un tramo chico se acerca al promedio general en proporción a su tamaño. Evita titulares como "el 100% de los mayores de 70 piensa X" con tres respuestas.
- **Intervalos de confianza** (Wilson o beta-binomial) en cada barra del informe.
- **k-anonimato:** un tramo con menos de k respuestas (k = 5 en la demo) no se muestra y se fusiona con el vecino.
- **Ruido de Laplace** (privacidad diferencial) en los conteos chicos. Opcional, pero es un buen detalle para el jurado.
- Para la etapa de escala: **reponderación por edad** (raking contra el padrón o el censo), y si hay datos, MRP.

### 4.7 Elegir la siguiente pregunta
- **Entropía o varianza** de la postura por enunciado: se pregunta donde hay más incertidumbre o desacuerdo.
- **Muestreo de Thompson** para repartir preguntas entre personas sin preguntarle lo mismo a todos.

### 4.8 Medir que no homogeniza
- **Diversidad de posturas** por ronda: entropía de los grupos y dispersión de los embeddings.
- Si cae más de lo esperado entre rondas, alerta en el panel. Es un indicador propio, y pocos sistemas lo miden.

## 5. Verificación de hechos

1. Solo se verifican las afirmaciones marcadas como `verificable: true`. Las de valor se dejan fuera.
2. **Recuperación** desde una lista blanca de fuentes cargada antes (INE, BCN, Banco Central, medios con verificación, papers). En la hackathon, un **corpus precargado e indexado** para la pregunta de la demo. Sin búsqueda en vivo, para no depender de internet.
3. **Inferencia de lenguaje natural (NLI):** para cada par afirmación–fragmento, un modelo dice si lo respalda, lo contradice o no tiene relación. Puede ser un clasificador NLI multilingüe (familia mDeBERTa-XNLI) o un LLM con esquema. Se guarda el fragmento exacto.
4. La devolución muestra siempre **una fuente que respalda y una que contradice** cuando existen, con su enlace.
5. **Caché:** las afirmaciones parecidas (similitud > umbral) reutilizan la verificación. Así mejora con más personas.

## 6. Arquitectura para la hackathon

| Pieza | Elección | Por qué no se rompe |
|---|---|---|
| Front | Next.js o una página estática con MediaRecorder | Una sola página por enlace |
| Back | FastAPI (Python, porque toda la matemática vive en numpy/scipy/sklearn) | Un solo lenguaje para el análisis |
| Base | SQLite o Postgres (Supabase si se quiere tiempo real) | Sin infraestructura extra |
| Cola | Tabla de trabajos con estado + un worker | Si algo falla, se reintenta y la página no espera |
| Tiempo real | Polling cada 2 s o canal en tiempo real de Supabase | Más simple que websockets propios |
| Enlaces | Token firmado (HMAC) con id de consulta y tramo de edad, de un solo uso | Sin cuentas ni login |
| LLM | Envoltorio con dos proveedores, esquema y caché | Se cambia de proveedor con una variable |
| Despliegue | Un VPS o Railway/Fly, con todo en un contenedor | Una sola URL |

## 7. Plan anticaídas para la demo

1. **Datos de respaldo:** 60 respuestas sintéticas realistas precargadas (generadas antes, distintas por tramo y valores). Si en la sala responden pocos, se suman a las reales; si responden muchos, se apagan.
2. **Modo sin internet:** corpus de verificación local, embeddings precalculados para las respuestas de respaldo y el último informe guardado en caché.
3. **Timeouts:** voz a texto en 20 s; extracción en 15 s. Si vence, se marca la respuesta "pendiente" y la demo sigue.
4. **Informe incremental:** el mapa se recalcula cada N respuestas nuevas, no con cada una, para que el jurado lo vea crecer sin parpadeos.
5. **Semillas fijas y versiones fijadas** de modelos y librerías.
6. **Un botón de "congelar"** que fija el último estado bueno si algo se rompe en el escenario.
7. **Ensayo con 100 respuestas sintéticas** concurrentes antes de presentar.

## 8. Lo que se ve en la demo (y prueba que es multiplayer)

- Un mapa en vivo con los grupos de opinión, que se reordena a medida que entra gente.
- Una postura puente cuyo "apoyo entre grupos" (i_n) sube con cada persona de un grupo distinto.
- Barras por tramo de edad con intervalos, y tramos ocultos hasta pasar k.
- La devolución personal en el teléfono de un voluntario: dónde queda, qué fuentes la apoyan y contradicen, y "¿firmarías esto?".
- Un gráfico de calidad contra número de personas: firma de la postura puente y precisión de los representantes.

## 9. Orden de construcción (48 horas)

| Horas | Qué |
|---|---|
| 0–6 | Enlace con token, grabación, transcripción y caja de texto |
| 6–14 | Extracción con esquema y validador de citas; datos sintéticos |
| 14–22 | Embeddings, matriz, PCA + k-means, factorización puente |
| 22–30 | Borradores de postura común y Schulze con representantes |
| 30–36 | Verificación con corpus local y NLI |
| 36–42 | Informe por edad (contracción, k-anonimato) y devolución personal |
| 42–48 | Panel en vivo, modo de respaldo, ensayo de carga y pitch |

Si hay que recortar, se corta en este orden: verificación de hechos (queda un enlace fijo), siguiente pregunta adaptativa y representantes (se vota directo). El mapa, la postura puente y la devolución personal no se cortan.
