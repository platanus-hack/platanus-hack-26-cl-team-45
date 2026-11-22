// Creates a poll from a synthetic data file and answers it one response at a time, so the map fills live.
//   ADMIN_KEY=... node data/sembrar.ts [archivo.json] [segundos entre respuestas]
//   ADMIN_KEY=... node data/sembrar.ts data/camaras.json 4
// Reads VITE_CONVEX_URL from .env.local (or the environment). Prints the slug: open /<slug>/voces to watch.
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { existsSync, readFileSync } from "node:fs";

const [archivo = "data/camaras.json", pausa = "4"] = process.argv.slice(2);
const local = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const url = process.env.VITE_CONVEX_URL ?? local.match(/^VITE_CONVEX_URL=(.+)$/m)?.[1]?.trim();
const clave = process.env.ADMIN_KEY;
if (!url || !clave) throw new Error("Faltan VITE_CONVEX_URL (en .env.local) o ADMIN_KEY (en el entorno)");

const { pregunta, respuestas } = JSON.parse(readFileSync(archivo, "utf8")) as
  { pregunta: string; respuestas: { participante: string; texto: string }[] };
const convex = new ConvexHttpClient(url);
const slug: string = await convex.mutation(anyApi.encuestas.crear, { clave, pregunta });
const { _id: encuestaId } = await convex.query(anyApi.encuestas.actual, { slug });
console.log(`Encuesta /${slug} · mira /${slug}/voces`);

for (const [i, r] of respuestas.entries()) {
  await convex.mutation(anyApi.encuestas.responder, { encuestaId, participante: r.participante, texto: r.texto });
  console.log(`${i + 1}/${respuestas.length} ${r.participante}`);
  if (i < respuestas.length - 1) await new Promise(ok => setTimeout(ok, Number(pausa) * 1000));
}
