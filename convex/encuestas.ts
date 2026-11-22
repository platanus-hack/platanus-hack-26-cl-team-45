import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Admin gate: one shared key in the Convex env (`npx convex env set ADMIN_KEY ...`). Participants never log in.
function exigirAdmin(clave: string) {
  const k = process.env.ADMIN_KEY;
  if (!k || clave !== k) throw new Error("Clave de admin incorrecta");
}

export const esAdmin = query({
  args: { clave: v.string() },
  handler: async (_ctx, { clave }) => !!process.env.ADMIN_KEY && clave === process.env.ADMIN_KEY,
});

// ---------- admin ----------

// "¿Qué te pareció la hack?" -> "que-te-parecio-la-hack". crear() adds -2, -3… if taken.
function slugDe(pregunta: string) {
  const base = pregunta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32).replace(/-+$/, "");
  return base || "encuesta";
}

export const crear = mutation({
  args: { clave: v.string(), pregunta: v.string() },
  handler: async (ctx, { clave, pregunta }) => {
    exigirAdmin(clave);
    const p = pregunta.trim();
    if (!p) throw new Error("La pregunta está vacía");
    const base = slugDe(p);
    let slug = base;
    for (let i = 2; await ctx.db.query("encuestas").withIndex("by_slug", q => q.eq("slug", slug)).first(); i++) slug = `${base}-${i}`;
    await ctx.db.insert("encuestas", { pregunta: p.slice(0, 300), slug, abierta: true });
    return slug;
  },
});

export const abrirCerrar = mutation({
  args: { clave: v.string(), encuestaId: v.id("encuestas"), abierta: v.boolean() },
  handler: async (ctx, { clave, encuestaId, abierta }) => {
    exigirAdmin(clave);
    await ctx.db.patch(encuestaId, { abierta });
  },
});

export const borrarRespuesta = mutation({
  args: { clave: v.string(), respuestaId: v.id("respuestas") },
  handler: async (ctx, { clave, respuestaId }) => {
    exigirAdmin(clave);
    const r = await ctx.db.get(respuestaId);
    if (!r) return;
    for (const f of await ctx.db.query("frases").withIndex("by_respuesta", q => q.eq("respuestaId", respuestaId)).collect()) await ctx.db.delete(f._id);
    for (const a of await ctx.db.query("analisis").withIndex("by_respuesta", q => q.eq("respuestaId", respuestaId)).collect()) await ctx.db.delete(a._id);
    if (r.audioId) await ctx.storage.delete(r.audioId);
    await ctx.db.delete(respuestaId);
    // Once converged the groups stay; an emptied group just stops showing (n = 0).
    if (!(await convergio(ctx, r.encuestaId, "frases"))) await pedirAgrupar(ctx, r.encuestaId);
    if (!(await convergio(ctx, r.encuestaId, "analisis"))) await pedirNormalizar(ctx, r.encuestaId);
  },
});

export const reprocesar = mutation({
  args: { clave: v.string(), respuestaId: v.id("respuestas") },
  handler: async (ctx, { clave, respuestaId }) => {
    exigirAdmin(clave);
    const r = await ctx.db.get(respuestaId);
    if (!r) return;
    const transcribir = !!r.audioId && !r.texto;
    await ctx.db.patch(respuestaId, { estado: transcribir ? "transcribiendo" : "procesando" });
    await ctx.scheduler.runAfter(0, transcribir ? internal.procesar.transcribir : internal.procesar.extraer, { respuestaId });
  },
});

export const listar = query({
  args: {},
  handler: async ctx => {
    const es = await ctx.db.query("encuestas").order("desc").collect();
    return Promise.all(es.map(async e => {
      const rs = await ctx.db.query("respuestas").withIndex("by_encuesta", q => q.eq("encuestaId", e._id)).collect();
      return { ...e, respuestas: rs.length, personas: new Set(rs.map(r => r.participante)).size };
    }));
  },
});

export const respuestas = query({
  args: { encuestaId: v.id("encuestas") },
  handler: async (ctx, { encuestaId }) => {
    const rs = await ctx.db.query("respuestas").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).order("desc").collect();
    return Promise.all(rs.map(async r => ({ ...r, audioUrl: r.audioId ? await ctx.storage.getUrl(r.audioId) : null })));
  },
});

// ---------- participants (anonymous) ----------

const porSlug = (ctx: QueryCtx, slug: string) => ctx.db.query("encuestas").withIndex("by_slug", q => q.eq("slug", slug)).unique();

export const actual = query({
  args: { slug: v.string() },
  handler: (ctx, { slug }) => porSlug(ctx, slug),
});

export const responder = mutation({
  args: { encuestaId: v.id("encuestas"), participante: v.string(), texto: v.string() },
  handler: async (ctx, { encuestaId, participante, texto }) => {
    const e = await ctx.db.get(encuestaId);
    if (!e || !e.abierta) throw new Error("La encuesta está cerrada");
    const t = texto.trim();
    if (t.length < 3) throw new Error("La respuesta está vacía");
    if (t.length > 6000 || participante.length > 64) throw new Error("La respuesta es demasiado larga");
    const respuestaId = await ctx.db.insert("respuestas", { encuestaId, participante, texto: t, estado: "procesando" });
    await ctx.scheduler.runAfter(0, internal.procesar.extraer, { respuestaId });
    return respuestaId;
  },
});

export const urlSubida = mutation({ args: {}, handler: ctx => ctx.storage.generateUploadUrl() });

export const responderAudio = mutation({
  args: { encuestaId: v.id("encuestas"), participante: v.string(), audioId: v.id("_storage") },
  handler: async (ctx, { encuestaId, participante, audioId }) => {
    const e = await ctx.db.get(encuestaId);
    const meta = await ctx.db.system.get(audioId);
    if (!e || !e.abierta || !meta || meta.size > 20_000_000 || participante.length > 64) {
      await ctx.storage.delete(audioId);
      throw new Error(!e || !e.abierta ? "La encuesta está cerrada" : "El audio no es válido o es demasiado largo");
    }
    const respuestaId = await ctx.db.insert("respuestas", { encuestaId, participante, texto: "", audioId, estado: "transcribiendo" });
    await ctx.scheduler.runAfter(0, internal.procesar.transcribir, { respuestaId });
    return respuestaId;
  },
});

export const mias = query({
  args: { encuestaId: v.id("encuestas"), participante: v.string() },
  handler: async (ctx, { encuestaId, participante }) =>
    (await ctx.db.query("respuestas").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect())
      .filter(r => r.participante === participante),
});

// ---------- live map: same shape the panels used to poll from /api/mapa ----------

export const mapa = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const e = await porSlug(ctx, slug);
    if (!e) return null;
    const rs = await ctx.db.query("respuestas").withIndex("by_encuesta", q => q.eq("encuestaId", e._id)).collect();
    const fs = await ctx.db.query("frases").withIndex("by_encuesta", q => q.eq("encuestaId", e._id)).collect();
    const ts = await ctx.db.query("temas").withIndex("by_encuesta", q => q.eq("encuestaId", e._id)).collect();
    const orden = new Map(rs.map((r, i) => [r._id as string, i]));
    const quien = new Map(rs.map(r => [r._id as string, r.participante]));
    const agrupadas = fs.filter(f => f.temaId && orden.has(f.respuestaId))
      .sort((a, b) => orden.get(a.respuestaId)! - orden.get(b.respuestaId)!);
    return {
      encuestaId: e._id,
      pregunta: e.pregunta,
      abierta: e.abierta,
      total_participantes: new Set(rs.map(r => r.participante)).size,
      clusters: ts.map(t => {
        const mias = agrupadas.filter(f => f.temaId === t.tid);
        return { id: t.tid, nombre: t.nombre, resumen: t.resumen, x: t.x, y: t.y, n: new Set(mias.map(f => quien.get(f.respuestaId))).size };
      }).filter(c => c.n > 0),
      frases: agrupadas.map(f => ({
        id: f._id, respuesta_id: f.respuestaId, texto: f.texto, cita: f.cita, emocion: f.emocion,
        intensidad: f.intensidad, cluster_id: f.temaId, conceptos: f.conceptos,
      })),
      respuestas: rs.filter(r => r.texto).map(r => ({ id: r._id, texto: r.texto })),
    };
  },
});

// ---------- tópicos: Haiku's analysis aggregated per neutral topic (pending a visualization, see HACK.md) ----------

const DIRECCIONES = ["positivo", "negativo", "mixto", "neutro"] as const;
// Several temas of one person in the same tópico collapse into one cell: good and bad together is mixto.
function celda(dirs: string[]) {
  const d = new Set(dirs);
  return d.has("mixto") || (d.has("positivo") && d.has("negativo")) ? "mixto" : d.has("positivo") ? "positivo" : d.has("negativo") ? "negativo" : "neutro";
}

export const topicos = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const e = await porSlug(ctx, slug);
    if (!e) return null;
    const rs = await ctx.db.query("respuestas").withIndex("by_encuesta", q => q.eq("encuestaId", e._id)).collect();
    const as = await ctx.db.query("analisis").withIndex("by_encuesta", q => q.eq("encuestaId", e._id)).collect();
    const ks = await ctx.db.query("topicos").withIndex("by_encuesta", q => q.eq("encuestaId", e._id)).collect();
    const quien = new Map(rs.map(r => [r._id as string, r.participante]));
    const emocionDe = new Map(as.map(a => [a.respuestaId as string, a.emocion]));
    return {
      pregunta: e.pregunta,
      analizadas: as.length,
      topicos: ks.map(k => {
        const celdas = as.flatMap(a => {
          const ts = a.temas.filter(t => t.topicoId === k.tid);
          if (!ts.length) return [];
          const tend = ts.map(t => t.tendencia).find(t => t !== "no_dice") ?? "no_dice";
          return [{ respuestaId: a.respuestaId, participante: quien.get(a.respuestaId) ?? "", direccion: celda(ts.map(t => t.direccion)),
            tendencia: tend, temas: ts.map(t => ({ tema: t.tema, direccion: t.direccion, intensidad: t.intensidad, cita: t.cita })) }];
        });
        const cuenta = Object.fromEntries(DIRECCIONES.map(d => [d, celdas.filter(c => c.direccion === d).length]));
        return { id: k.tid, nombre: k.nombre, descripcion: k.descripcion, personas: new Set(celdas.map(c => c.participante)).size,
          ...cuenta, mejora: celdas.filter(c => c.tendencia === "mejora").length, empeora: celdas.filter(c => c.tendencia === "empeora").length, celdas };
      }).filter(k => k.personas > 0).sort((a, b) => b.personas - a.personas),
      propuestas: as.filter(a => a.propone).map(a => ({ respuestaId: a.respuestaId, participante: quien.get(a.respuestaId) ?? "", texto: a.propone! })),
      // Arrival order with each answer's emotion, so the view can replay the poll from the first answer.
      respuestas: rs.filter(r => emocionDe.has(r._id)).map(r => ({ respuestaId: r._id, participante: r.participante, emocion: emocionDe.get(r._id)! })),
      emociones: Object.entries(as.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.emocion]: (acc[a.emocion] ?? 0) + 1 }), {}))
        .map(([emocion, n]) => ({ emocion, n })).sort((a, b) => b.n - a.n),
    };
  },
});

// ---------- pipeline internals (used by procesar.ts) ----------

// With the 25 synthetic answers from Edo, agrupar settles at ~8 temas by answer 6-8 and normalizar at ~18 tópicos by
// answer 7-8; after that a full regroup adds no groups and only reshuffles ~10% of what was already grouped
// (evals/hackaton/CONVERGENCIA.md). Up to this many answers we regroup everything; from the next one on, each answer
// only assigns its own items to the existing groups (procesar.asignar / asignarTopicos).
export const UMBRAL_CONVERGENCIA = 9; // converges at ~8, +1 margin

async function convergio(ctx: { db: any }, encuestaId: Id<"encuestas">, tabla: "frases" | "analisis") {
  const filas = await ctx.db.query(tabla).withIndex("by_encuesta", (q: any) => q.eq("encuestaId", encuestaId)).collect();
  const grupos = await ctx.db.query(tabla === "frases" ? "temas" : "topicos").withIndex("by_encuesta", (q: any) => q.eq("encuestaId", encuestaId)).first();
  return !!grupos && new Set(filas.map((f: { respuestaId: string }) => f.respuestaId)).size > UMBRAL_CONVERGENCIA;
}

export async function pedirAgrupar(ctx: { db: any; scheduler: any }, encuestaId: Id<"encuestas">) {
  const token = Date.now();
  await ctx.db.patch(encuestaId, { agruparPedido: token });
  await ctx.scheduler.runAfter(1500, internal.procesar.agrupar, { encuestaId, token });
}

export async function pedirNormalizar(ctx: { db: any; scheduler: any }, encuestaId: Id<"encuestas">) {
  const token = Date.now();
  await ctx.db.patch(encuestaId, { normalizarPedido: token });
  await ctx.scheduler.runAfter(1500, internal.procesar.normalizar, { encuestaId, token });
}

export const leerRespuesta = internalQuery({
  args: { respuestaId: v.id("respuestas") },
  handler: async (ctx, { respuestaId }) => {
    const r = await ctx.db.get(respuestaId);
    return r && { respuesta: r, encuesta: (await ctx.db.get(r.encuestaId))! };
  },
});

export const guardarFrases = internalMutation({
  args: {
    respuestaId: v.id("respuestas"),
    frases: v.array(v.object({ texto: v.string(), cita: v.string(), emocion: v.string(), intensidad: v.number(), conceptos: v.array(v.string()) })),
  },
  handler: async (ctx, { respuestaId, frases }) => {
    const r = await ctx.db.get(respuestaId);
    if (!r) return; // deleted while processing
    for (const f of await ctx.db.query("frases").withIndex("by_respuesta", q => q.eq("respuestaId", respuestaId)).collect()) await ctx.db.delete(f._id);
    for (const f of frases) await ctx.db.insert("frases", { ...f, encuestaId: r.encuestaId, respuestaId, intensidad: Math.max(0, Math.min(1, f.intensidad)) });
    await ctx.db.patch(respuestaId, { estado: "listo" });
    if (await convergio(ctx, r.encuestaId, "frases")) await ctx.scheduler.runAfter(0, internal.procesar.asignar, { encuestaId: r.encuestaId, respuestaId });
    else await pedirAgrupar(ctx, r.encuestaId);
  },
});

export const guardarTexto = internalMutation({
  args: { respuestaId: v.id("respuestas"), texto: v.string() },
  handler: async (ctx, { respuestaId, texto }) => {
    if (!(await ctx.db.get(respuestaId))) return false;
    await ctx.db.patch(respuestaId, { texto, estado: "procesando" });
    return true;
  },
});

export const marcarError = internalMutation({
  args: { respuestaId: v.id("respuestas") },
  handler: async (ctx, { respuestaId }) => { if (await ctx.db.get(respuestaId)) await ctx.db.patch(respuestaId, { estado: "error" }); },
});

export const leerParaAgrupar = internalQuery({
  args: { encuestaId: v.id("encuestas"), token: v.number() },
  handler: async (ctx, { encuestaId, token }) => {
    const e = await ctx.db.get(encuestaId);
    if (!e || e.agruparPedido !== token) return null; // a newer request superseded this one
    const frases = await ctx.db.query("frases").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect();
    const temas = await ctx.db.query("temas").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect();
    return { pregunta: e.pregunta, frases: frases.map(f => ({ id: f._id, texto: f.texto })), temas: temas.map(t => ({ id: t.tid, nombre: t.nombre })) };
  },
});

export const guardarTemas = internalMutation({
  args: {
    encuestaId: v.id("encuestas"),
    temas: v.array(v.object({ id: v.string(), nombre: v.string(), resumen: v.string(), x: v.number(), y: v.number() })),
    asignacion: v.array(v.object({ frase: v.string(), tema: v.string() })),
  },
  handler: async (ctx, { encuestaId, temas, asignacion }) => {
    for (const t of await ctx.db.query("temas").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect()) await ctx.db.delete(t._id);
    for (const t of temas) await ctx.db.insert("temas", { encuestaId, tid: t.id, nombre: t.nombre, resumen: t.resumen, x: t.x, y: t.y });
    const tids = new Set(temas.map(t => t.id));
    const a = new Map(asignacion.map(x => [x.frase, x.tema]));
    for (const f of await ctx.db.query("frases").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect()) {
      const t = a.get(f._id);
      if (t && tids.has(t)) await ctx.db.patch(f._id, { temaId: t });
      // Frases added after this grouping started keep their old tema; the regroup they scheduled will place them.
    }
    // The last full regroup can land after the poll converged: sweep whatever it left without a valid tema.
    if (await convergio(ctx, encuestaId, "frases")) await ctx.scheduler.runAfter(0, internal.procesar.asignar, { encuestaId });
  },
});

export const guardarAnalisis = internalMutation({
  args: {
    respuestaId: v.id("respuestas"),
    temas: v.array(v.object({ tema: v.string(), direccion: v.string(), intensidad: v.union(v.string(), v.null()), tendencia: v.string(), cita: v.string() })),
    emocion: v.string(),
    propone: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { respuestaId, ...a }) => {
    const r = await ctx.db.get(respuestaId);
    if (!r) return; // deleted while processing
    for (const x of await ctx.db.query("analisis").withIndex("by_respuesta", q => q.eq("respuestaId", respuestaId)).collect()) await ctx.db.delete(x._id);
    await ctx.db.insert("analisis", { encuestaId: r.encuestaId, respuestaId, ...a });
    if (await convergio(ctx, r.encuestaId, "analisis")) await ctx.scheduler.runAfter(0, internal.procesar.asignarTopicos, { encuestaId: r.encuestaId, respuestaId });
    else await pedirNormalizar(ctx, r.encuestaId);
  },
});

// Tema ids are "<analisisId>:<index>" so the LLM can refer to each one.
export const leerParaNormalizar = internalQuery({
  args: { encuestaId: v.id("encuestas"), token: v.number() },
  handler: async (ctx, { encuestaId, token }) => {
    const e = await ctx.db.get(encuestaId);
    if (!e || e.normalizarPedido !== token) return null; // a newer request superseded this one
    const as = await ctx.db.query("analisis").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect();
    const ks = await ctx.db.query("topicos").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect();
    return {
      pregunta: e.pregunta,
      topicos: ks.map(k => ({ id: k.tid, nombre: k.nombre, descripcion: k.descripcion })),
      temas: as.flatMap(a => a.temas.map((t, i) => ({ id: `${a._id}:${i}`, tema: t.tema, cita: t.cita.slice(0, 160) }))),
    };
  },
});

export const guardarTopicos = internalMutation({
  args: {
    encuestaId: v.id("encuestas"),
    topicos: v.array(v.object({ id: v.string(), nombre: v.string(), descripcion: v.string() })),
    asignacion: v.array(v.object({ tema: v.string(), topico: v.string() })),
  },
  handler: async (ctx, { encuestaId, topicos, asignacion }) => {
    for (const k of await ctx.db.query("topicos").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect()) await ctx.db.delete(k._id);
    for (const k of topicos) await ctx.db.insert("topicos", { encuestaId, tid: k.id, nombre: k.nombre, descripcion: k.descripcion });
    const tids = new Set(topicos.map(k => k.id));
    const a = new Map(asignacion.map(x => [x.tema, x.topico]));
    for (const an of await ctx.db.query("analisis").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect()) {
      // Analyses added after this run started keep their old tópico; the run they scheduled will place them.
      const temas = an.temas.map((t, i) => {
        const k = a.get(`${an._id}:${i}`);
        return k && tids.has(k) ? { ...t, topicoId: k } : t;
      });
      await ctx.db.patch(an._id, { temas });
    }
    if (await convergio(ctx, encuestaId, "analisis")) await ctx.scheduler.runAfter(0, internal.procesar.asignarTopicos, { encuestaId });
  },
});


// ---------- after convergence: assign only the new items ----------

// New groups get a server-side id so two answers assigning in parallel can't collide on the LLM's "nuevo1".
const idNuevo = (id: string) => `${id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const leerParaAsignar = internalQuery({
  args: { encuestaId: v.id("encuestas"), respuestaId: v.optional(v.id("respuestas")) },
  handler: async (ctx, { encuestaId, respuestaId }) => {
    const e = await ctx.db.get(encuestaId);
    if (!e) return null;
    const temas = await ctx.db.query("temas").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect();
    const tids = new Set(temas.map(t => t.tid));
    const fs = respuestaId
      ? await ctx.db.query("frases").withIndex("by_respuesta", q => q.eq("respuestaId", respuestaId)).collect()
      : await ctx.db.query("frases").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect();
    return {
      pregunta: e.pregunta,
      temas: temas.map(t => ({ id: t.tid, nombre: t.nombre, resumen: t.resumen, x: t.x, y: t.y })),
      frases: fs.filter(f => !f.temaId || !tids.has(f.temaId)).map(f => ({ id: f._id as string, texto: f.texto })),
    };
  },
});

export const guardarAsignacion = internalMutation({
  args: {
    encuestaId: v.id("encuestas"),
    nuevos: v.array(v.object({ id: v.string(), nombre: v.string(), resumen: v.string(), x: v.number(), y: v.number() })),
    asignacion: v.array(v.object({ frase: v.string(), tema: v.string() })),
  },
  handler: async (ctx, { encuestaId, nuevos, asignacion }) => {
    const ids = new Map<string, string>();
    for (const t of nuevos) {
      const tid = idNuevo(t.id);
      ids.set(t.id, tid);
      await ctx.db.insert("temas", { encuestaId, tid, nombre: t.nombre, resumen: t.resumen, x: t.x, y: t.y });
    }
    const tids = new Set((await ctx.db.query("temas").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect()).map(t => t.tid));
    for (const { frase, tema } of asignacion) {
      const fid = ctx.db.normalizeId("frases", frase);
      const f = fid && await ctx.db.get(fid);
      const tid = ids.get(tema) ?? tema;
      if (f && f.encuestaId === encuestaId && tids.has(tid)) await ctx.db.patch(f._id, { temaId: tid });
    }
  },
});

// Tema ids are "<analisisId>:<index>", same as leerParaNormalizar.
export const leerParaAsignarTopicos = internalQuery({
  args: { encuestaId: v.id("encuestas"), respuestaId: v.optional(v.id("respuestas")) },
  handler: async (ctx, { encuestaId, respuestaId }) => {
    const e = await ctx.db.get(encuestaId);
    if (!e) return null;
    const ks = await ctx.db.query("topicos").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect();
    const kids = new Set(ks.map(k => k.tid));
    const as = respuestaId
      ? await ctx.db.query("analisis").withIndex("by_respuesta", q => q.eq("respuestaId", respuestaId)).collect()
      : await ctx.db.query("analisis").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect();
    return {
      pregunta: e.pregunta,
      topicos: ks.map(k => ({ id: k.tid, nombre: k.nombre, descripcion: k.descripcion })),
      temas: as.flatMap(a => a.temas.flatMap((t, i) => !t.topicoId || !kids.has(t.topicoId) ? [{ id: `${a._id}:${i}`, tema: t.tema, cita: t.cita.slice(0, 160) }] : [])),
    };
  },
});

export const guardarAsignacionTopicos = internalMutation({
  args: {
    encuestaId: v.id("encuestas"),
    nuevos: v.array(v.object({ id: v.string(), nombre: v.string(), descripcion: v.string() })),
    asignacion: v.array(v.object({ tema: v.string(), topico: v.string() })),
  },
  handler: async (ctx, { encuestaId, nuevos, asignacion }) => {
    const ids = new Map<string, string>();
    for (const k of nuevos) {
      const tid = idNuevo(k.id);
      ids.set(k.id, tid);
      await ctx.db.insert("topicos", { encuestaId, tid, nombre: k.nombre, descripcion: k.descripcion });
    }
    const kids = new Set((await ctx.db.query("topicos").withIndex("by_encuesta", q => q.eq("encuestaId", encuestaId)).collect()).map(k => k.tid));
    const porAnalisis = new Map<string, Map<number, string>>();
    for (const { tema, topico } of asignacion) {
      const [aid, i] = tema.split(":");
      const k = ids.get(topico) ?? topico;
      if (!kids.has(k)) continue;
      if (!porAnalisis.has(aid)) porAnalisis.set(aid, new Map());
      porAnalisis.get(aid)!.set(Number(i), k);
    }
    for (const [aid, mapa] of porAnalisis) {
      const id = ctx.db.normalizeId("analisis", aid);
      const an = id && await ctx.db.get(id);
      if (!an || an.encuestaId !== encuestaId) continue;
      await ctx.db.patch(an._id, { temas: an.temas.map((t, i) => mapa.has(i) ? { ...t, topicoId: mapa.get(i) } : t) });
    }
  },
});
