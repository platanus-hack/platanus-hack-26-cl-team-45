// Runs the app's tópicos pipeline offline over data/camaras.json and writes what encuestas.topicos would return,
// so /camaras/voces can draw the blob without a live poll. Same functions and models as the app (convex/extraccion.ts):
// Haiku reads each answer, then every tema is regrouped into tópicos as answers come in, like evals/hackaton/normalizar.ts.
// The live app stops regrouping after UMBRAL_CONVERGENCIA answers and only assigns; here that split the question's own
// subject into two tópicos and filed police response under municipal complaints, so the demo regroups to the end.
//
//   set -a; . ./.env; set +a; node evals/camaras/procesar.ts
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { analizarRespuesta, normalizarTemas } from "../../convex/extraccion.ts";

const raiz = new URL("../../", import.meta.url).pathname;
const SALIDA = raiz + "web/src/demo-camaras.json";
const { pregunta, respuestas }: { pregunta: string; respuestas: { id: number; participante: string; cerrada: string; texto: string }[] } =
  JSON.parse(readFileSync(raiz + "data/camaras.json", "utf8"));
const claude = new Anthropic({ maxRetries: 6 });

// Analyze every answer, 5 at a time (the hack proxy answers 429 to many concurrent calls).
type Analisis = Awaited<ReturnType<typeof analizarRespuesta>>;
const analisis: Analisis[] = [];
for (let i = 0; i < respuestas.length; i += 5)
  analisis.push(...await Promise.all(respuestas.slice(i, i + 5).map(r => analizarRespuesta(claude, pregunta, r.texto))));
console.log(`analizadas ${analisis.length}`);

// Tópicos, regrouping every tema each CADA answers (and at the end) so ids stay stable without 60 growing calls.
const CADA = 5;
const temaId = (i: number, k: number) => `r${respuestas[i].id}_t${k + 1}`;
const temasDe = (i: number) => analisis[i].temas.map((t, k) => ({ id: temaId(i, k), tema: t.tema, cita: t.cita.slice(0, 160) }));
let topicos: { id: string; nombre: string; descripcion: string }[] = [];
const topicoDe = new Map<string, string>();
for (let n = Math.min(CADA, respuestas.length); ; n = Math.min(n + CADA, respuestas.length)) {
  const out = await normalizarTemas(claude, pregunta, topicos, respuestas.slice(0, n).flatMap((_, j) => temasDe(j)));
  topicos = out.topicos;
  topicoDe.clear();
  for (const a of out.asignacion) topicoDe.set(a.tema, a.topico);
  console.log(`respuesta ${n}: ${topicos.length} tópicos`);
  if (n === respuestas.length) break;
}

// Same shape and rules as encuestas.topicos.
const DIRECCIONES = ["positivo", "negativo", "mixto", "neutro"] as const;
const celda = (dirs: string[]) => {
  const d = new Set(dirs);
  return d.has("mixto") || (d.has("positivo") && d.has("negativo")) ? "mixto" : d.has("positivo") ? "positivo" : d.has("negativo") ? "negativo" : "neutro";
};
const salida = {
  pregunta,
  analizadas: analisis.length,
  topicos: topicos.map(k => {
    const celdas = analisis.flatMap((a, i) => {
      const ts = a.temas.filter((_, j) => topicoDe.get(temaId(i, j)) === k.id);
      if (!ts.length) return [];
      const tend = ts.map(t => t.tendencia).find(t => t !== "no_dice") ?? "no_dice";
      return [{ respuestaId: `r${respuestas[i].id}`, participante: respuestas[i].participante, direccion: celda(ts.map(t => t.direccion)),
        tendencia: tend, temas: ts.map(t => ({ tema: t.tema, direccion: t.direccion, intensidad: t.intensidad, cita: t.cita })) }];
    });
    const cuenta = Object.fromEntries(DIRECCIONES.map(d => [d, celdas.filter(c => c.direccion === d).length]));
    return { id: k.id, nombre: k.nombre, descripcion: k.descripcion, personas: celdas.length, ...cuenta,
      mejora: celdas.filter(c => c.tendencia === "mejora").length, empeora: celdas.filter(c => c.tendencia === "empeora").length, celdas };
  }).filter(k => k.personas > 0).sort((a, b) => b.personas - a.personas),
  propuestas: analisis.flatMap((a, i) => a.propone ? [{ respuestaId: `r${respuestas[i].id}`, participante: respuestas[i].participante, texto: a.propone }] : []),
  emociones: Object.entries(analisis.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.emocion]: (acc[a.emocion] ?? 0) + 1 }), {}))
    .map(([emocion, n]) => ({ emocion, n })).sort((a, b) => b.n - a.n),
};
writeFileSync(SALIDA, JSON.stringify(salida, null, 2) + "\n");
const sinTopico = analisis.reduce((n, a, i) => n + a.temas.filter((_, j) => !topicoDe.has(temaId(i, j))).length, 0);
console.log(`${salida.topicos.length} tópicos, ${salida.propuestas.length} propuestas, ${sinTopico} temas sin tópico → ${SALIDA}`);
for (const k of salida.topicos) console.log(`  ${k.personas.toString().padStart(2)} ${k.nombre} (+${k.positivo} −${k.negativo} ±${k.mixto} 0${k.neutro})`);
