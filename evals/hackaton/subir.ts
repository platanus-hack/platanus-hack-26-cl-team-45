// Sube respuestas sintéticas de a una a una encuesta del deployment, para ver el panel evolucionar en vivo.
// Usa la mutación pública `responder` (no necesita clave de admin). Participante: sintetico-NN.
//
//   node evals/hackaton/subir.ts <slug> [edo|hackaton] [segundos entre respuestas]
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [slug, fuente = "edo", pausa = "30"] = process.argv.slice(2);
if (!slug) throw new Error("Falta el slug de la encuesta");
const aqui = new URL(".", import.meta.url).pathname;
const textos: string[] = fuente === "edo"
  ? JSON.parse(execSync("git show 673330f:data/respuestas-sinteticas.json", { encoding: "utf8" })).map((r: { texto: string }) => r.texto)
  : JSON.parse(readFileSync(aqui + "respuestas.json", "utf8")).map((r: { respuesta: string }) => r.respuesta);

const cvx = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "https://intent-ox-498.convex.cloud");
const e = await cvx.query(anyApi.encuestas.actual, { slug });
if (!e) throw new Error(`No existe la encuesta ${slug}`);
console.log(`"${e.pregunta}": ${textos.length} respuestas cada ${pausa} s`);
for (let i = 0; i < textos.length; i++) {
  await cvx.mutation(anyApi.encuestas.responder, { encuestaId: e._id, participante: `sintetico-${String(i + 1).padStart(2, "0")}`, texto: textos[i] });
  console.log(`${new Date().toLocaleTimeString("es-CL")} subida ${i + 1}/${textos.length}`);
  if (i < textos.length - 1) await new Promise(r => setTimeout(r, Number(pausa) * 1000));
}
