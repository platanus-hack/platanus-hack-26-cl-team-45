import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { agruparFrases, analizarRespuesta, asignarFrases, asignarTemas, extraerFrases, normalizarTemas } from "./extraccion";

// maxRetries: the hack proxy caps concurrent requests (429) and asignar runs one call per answer in parallel.
const claude = () => new Anthropic({ maxRetries: 6 }); // reads ANTHROPIC_API_KEY (+ ANTHROPIC_BASE_URL for the hack proxy) from the Convex env

// Server-side STT through OpenRouter (OPENROUTER_API_KEY in the Convex env), then the usual extraction.
const STT_MODEL = "openai/whisper-large-v3-turbo"; // ~$0.0002/min
export const transcribir = internalAction({
  args: { respuestaId: v.id("respuestas") },
  handler: async (ctx, { respuestaId }) => {
    const d = await ctx.runQuery(internal.encuestas.leerRespuesta, { respuestaId });
    if (!d?.respuesta.audioId) return;
    try {
      const audio = await ctx.storage.get(d.respuesta.audioId);
      if (!audio) throw new Error("audio no encontrado");
      // OpenRouter derives the format from the filename; Safari records mp4 (sent as m4a), Chrome/Firefox webm.
      const ext = audio.type.includes("mp4") ? "m4a" : audio.type.includes("ogg") ? "ogg" : "webm";
      const form = new FormData();
      form.append("file", audio, `respuesta.${ext}`);
      form.append("model", STT_MODEL);
      form.append("language", "es");
      const res = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
        body: form,
      });
      if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const texto = ((await res.json()).text ?? "").trim();
      if (texto.length < 3) throw new Error("transcripción vacía");
      if (await ctx.runMutation(internal.encuestas.guardarTexto, { respuestaId, texto: texto.slice(0, 6000) }))
        await ctx.scheduler.runAfter(0, internal.procesar.extraer, { respuestaId });
    } catch (e) {
      console.error("transcribir", respuestaId, e);
      await ctx.runMutation(internal.encuestas.marcarError, { respuestaId });
    }
  },
});

export const extraer = internalAction({
  args: { respuestaId: v.id("respuestas") },
  handler: async (ctx, { respuestaId }) => {
    const d = await ctx.runQuery(internal.encuestas.leerRespuesta, { respuestaId });
    if (!d) return;
    await ctx.scheduler.runAfter(0, internal.procesar.analizar, { respuestaId }); // every path with text goes through here
    try {
      const frases = await extraerFrases(claude(), d.encuesta.pregunta, d.respuesta.texto);
      await ctx.runMutation(internal.encuestas.guardarFrases, { respuestaId, frases });
    } catch (e) {
      console.error("extraer", respuestaId, e);
      await ctx.runMutation(internal.encuestas.marcarError, { respuestaId });
    }
  },
});

// shortcut: one LLM call regroups every frase of the poll, fine up to a few hundred frases; switch to embeddings + k-means beyond that.
export const agrupar = internalAction({
  args: { encuestaId: v.id("encuestas"), token: v.number() },
  handler: async (ctx, { encuestaId, token }) => {
    const d = await ctx.runQuery(internal.encuestas.leerParaAgrupar, { encuestaId, token });
    if (!d || !d.frases.length) return;
    const out = await agruparFrases(claude(), d.pregunta, d.temas, d.frases);
    await ctx.runMutation(internal.encuestas.guardarTemas, { encuestaId, ...out });
  },
});

// Haiku reads the whole answer (temas libres with direction, intensity, trend). Runs beside extraer;
// a failure here only logs, so the live map never shows an error because of it.
export const analizar = internalAction({
  args: { respuestaId: v.id("respuestas") },
  handler: async (ctx, { respuestaId }) => {
    const d = await ctx.runQuery(internal.encuestas.leerRespuesta, { respuestaId });
    if (!d?.respuesta.texto) return;
    try {
      const a = await analizarRespuesta(claude(), d.encuesta.pregunta, d.respuesta.texto);
      await ctx.runMutation(internal.encuestas.guardarAnalisis, { respuestaId, ...a });
    } catch (e) {
      console.error("analizar", respuestaId, e);
    }
  },
});

// Haiku copies long Convex ids ("jd7f...:3") back wrong often enough that whole answers lost their tópicos;
// it only ever sees t0, t1, ... and we map them back here.
function idsCortos<T extends { id: string }>(items: T[]): [T[], (corto: string) => string] {
  const largos = items.map(i => i.id);
  return [items.map((i, n) => ({ ...i, id: `t${n}` })), corto => largos[Number(corto.slice(1))] ?? corto];
}

// Same pattern as agrupar: one call regroups every tema of the poll into neutral tópicos.
export const normalizar = internalAction({
  args: { encuestaId: v.id("encuestas"), token: v.number() },
  handler: async (ctx, { encuestaId, token }) => {
    const d = await ctx.runQuery(internal.encuestas.leerParaNormalizar, { encuestaId, token });
    if (!d || !d.temas.length) return;
    const [temas, largo] = idsCortos(d.temas);
    const out = await normalizarTemas(claude(), d.pregunta, d.topicos, temas);
    await ctx.runMutation(internal.encuestas.guardarTopicos, { encuestaId, topicos: out.topicos, asignacion: out.asignacion.map(x => ({ ...x, tema: largo(x.tema) })) });
  },
});

// After the poll converges (see UMBRAL_CONVERGENCIA in encuestas.ts) each answer only assigns its own items to the
// existing groups: no debounce, and answers run in parallel. Without respuestaId it sweeps every pending item.
export const asignar = internalAction({
  args: { encuestaId: v.id("encuestas"), respuestaId: v.optional(v.id("respuestas")) },
  handler: async (ctx, args) => {
    const d = await ctx.runQuery(internal.encuestas.leerParaAsignar, args);
    if (!d || !d.frases.length) return;
    const out = await asignarFrases(claude(), d.pregunta, d.temas, d.frases);
    await ctx.runMutation(internal.encuestas.guardarAsignacion, { encuestaId: args.encuestaId, ...out });
  },
});

export const asignarTopicos = internalAction({
  args: { encuestaId: v.id("encuestas"), respuestaId: v.optional(v.id("respuestas")) },
  handler: async (ctx, args) => {
    const d = await ctx.runQuery(internal.encuestas.leerParaAsignarTopicos, args);
    if (!d || !d.temas.length) return;
    const [temas, largo] = idsCortos(d.temas);
    const out = await asignarTemas(claude(), d.pregunta, d.topicos, temas);
    await ctx.runMutation(internal.encuestas.guardarAsignacionTopicos, { encuestaId: args.encuestaId, nuevos: out.nuevos, asignacion: out.asignacion.map(x => ({ ...x, tema: largo(x.tema) })) });
  },
});
