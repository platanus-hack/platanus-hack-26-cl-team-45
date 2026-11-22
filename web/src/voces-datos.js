// Voces data layer: any poll → one shape the blob can draw, plus readings computed from the data.
// Pure functions, no DOM (checked by voces-datos.check.js).
import { tono, plural } from './comun.js';

const TONO_DIR = { positivo: 'pos', negativo: 'neg', mixto: 'neu', neutro: 'neu' };
const FUERZA = { leve: 0.33, moderada: 0.66, fuerte: 1 };
const contar = (celdas, t) => celdas.filter(c => c.tono === t).length;
const eje = (id, nombre, celdas) => ({ id, nombre, celdas, personas: celdas.length, pos: contar(celdas, 'pos'), neu: contar(celdas, 'neu'), neg: contar(celdas, 'neg') });

// encuestas.topicos: one axis per neutral topic, one cell per person with the stance Haiku read.
export function desdeTopicos(d) {
  return {
    pregunta: d.pregunta, casos: d.analizadas, fuente: 'topicos',
    ejes: d.topicos.map(k => eje(k.id, k.nombre, k.celdas.map(c => ({
      id: c.respuestaId, participante: c.participante, tono: TONO_DIR[c.direccion] ?? 'neu', postura: c.direccion, tendencia: c.tendencia,
      fuerza: Math.max(0.33, ...c.temas.map(t => FUERZA[t.intensidad] ?? 0.33)), citas: c.temas.map(t => t.cita),
    })))),
    propuestas: d.propuestas.map(p => p.texto),
    emociones: d.emociones,
    cerrada: cerrada(d.respuestas),
  };
}

// Synthetic demos only: what a Sí / No poll would have said.
function cerrada(rs) {
  const cs = (rs ?? []).filter(r => r.cerrada);
  return cs.length ? { si: cs.filter(r => r.cerrada === 'sí').length, total: cs.length } : null;
}

// The first n answers (arrival order) of an encuestas.topicos result, with every count recomputed. Lets the view replay a poll.
export function recortar(d, n) {
  if (!d?.respuestas?.length || n == null || n >= d.respuestas.length) return d;
  const rs = d.respuestas.slice(0, Math.max(1, n)), ids = new Set(rs.map(r => r.respuestaId));
  const emo = {};
  for (const r of rs) if (r.emocion) emo[r.emocion] = (emo[r.emocion] ?? 0) + 1;
  return {
    ...d, analizadas: rs.length, respuestas: rs,
    topicos: d.topicos.map(k => ({ ...k, celdas: k.celdas.filter(c => ids.has(c.respuestaId)) }))
      .filter(k => k.celdas.length).sort((a, b) => b.celdas.length - a.celdas.length),
    propuestas: d.propuestas.filter(p => ids.has(p.respuestaId)),
    emociones: Object.entries(emo).map(([emocion, n]) => ({ emocion, n })).sort((a, b) => b.n - a.n),
  };
}

// encuestas.mapa: one axis per stance group; a person's cell joins their phrases there (good + bad together = neu, like mixto).
export function desdeMapa(d) {
  const ejes = d.clusters.map(c => {
    const porPersona = new Map();
    for (const f of d.frases.filter(f => f.cluster_id === c.id)) {
      if (!porPersona.has(f.respuesta_id)) porPersona.set(f.respuesta_id, []);
      porPersona.get(f.respuesta_id).push(f);
    }
    return eje(c.id, c.nombre, [...porPersona].map(([id, fs]) => {
      const ts = new Set(fs.map(f => tono(f.emocion)));
      const t = ts.has('pos') && ts.has('neg') ? 'neu' : ts.has('pos') ? 'pos' : ts.has('neg') ? 'neg' : 'neu';
      return { id, tono: t, postura: { pos: 'positivo', neg: 'negativo', neu: 'neutro o mixto' }[t], tendencia: 'no_dice',
        fuerza: Math.max(...fs.map(f => f.intensidad)), citas: fs.map(f => f.cita) };
    }));
  });
  // Emotion per person (not per phrase): each answer counts each of its emotions once.
  const emo = {};
  for (const id of new Set(d.frases.map(f => f.respuesta_id)))
    for (const e of new Set(d.frases.filter(f => f.respuesta_id === id).map(f => f.emocion))) emo[e] = (emo[e] ?? 0) + 1;
  return {
    pregunta: d.pregunta, casos: d.total_participantes, fuente: 'mapa', ejes,
    propuestas: [], emociones: Object.entries(emo).map(([emocion, n]) => ({ emocion, n })).sort((a, b) => b.n - a.n),
  };
}

// Prefer tópicos (de qué se habla + postura); fall back to the map groups while tópicos is missing or empty.
// n keeps only the first n answers (tópicos only; the map has no arrival order).
export function elegir(topicos, mapa, n = null) {
  const t = topicos instanceof Error ? null : topicos, m = mapa instanceof Error ? null : mapa;
  if (t?.topicos?.length) return desdeTopicos(recortar(t, n));
  if (m?.clusters?.length) return desdeMapa(m);
  if (topicos === null || mapa === null) return null;    // a query that runs and finds no poll answers null
  return { pregunta: t?.pregunta ?? m?.pregunta, casos: 0, fuente: 'vacio', ejes: [], propuestas: [], emociones: [] };
}

export const clave = (ejeId, celdaId) => `${ejeId}|${celdaId}`;

// Readings for any question. Each one says which people to light (claves eje|persona) and which axes.
export function lecturas(v, max = 6) {
  const ejes = v.ejes.slice(0, max);
  if (!ejes.length) return [];
  const out = [];
  const de = (e, filtro = () => true) => e.celdas.filter(filtro).map(c => clave(e.id, c.id));
  const pct = n => v.casos ? ` (${Math.round(n / v.casos * 100)}%)` : '';

  // Synthetic demos carry the Sí / No a closed poll would have shown; contrast it with the most negative axes.
  if (v.cerrada) {
    const malos = ejes.filter(e => e.neg).sort((a, b) => b.neg - a.neg).slice(0, 3);
    out.push({ titulo: 'Si la pregunta fuera Sí / No', ejes: malos.map(e => e.id), claves: malos.flatMap(e => de(e, c => c.tono === 'neg')),
      texto: `${v.cerrada.si} de ${v.cerrada.total} (${Math.round(v.cerrada.si / v.cerrada.total * 100)}%) habrían marcado Sí. Al escucharlos, lo que más se repite en negativo es ${malos.map(e => `${e.nombre} (${e.neg})`).join(', ')}.` });
  }

  const top = ejes[0];
  out.push({ titulo: 'Lo más mencionado', ejes: [top.id], claves: de(top),
    texto: `${top.nombre}: ${plural(top.personas, 'persona', 'personas')} de ${v.casos}${pct(top.personas)}. ${top.pos} pos · ${top.neu} neu · ${top.neg} neg.` });

  const dividido = ejes.filter(e => e.pos && e.neg).sort((a, b) => Math.min(b.pos, b.neg) - Math.min(a.pos, a.neg))[0];
  if (dividido) out.push({ titulo: 'Donde hay división', ejes: [dividido.id], claves: de(dividido, c => c.tono !== 'neu'),
    texto: `${dividido.nombre}: ${dividido.pos} lo ven bien y ${dividido.neg} lo ven mal.` });

  const critico = ejes.filter(e => e.neg).sort((a, b) => b.neg - a.neg || b.neg / b.personas - a.neg / a.personas)[0];
  if (critico) out.push({ titulo: 'Lo que más molesta', ejes: [critico.id], claves: de(critico, c => c.tono === 'neg'),
    texto: `${critico.nombre}: ${critico.neg} de ${plural(critico.personas, 'persona', 'personas')} lo mencionan en negativo.` });

  const valorado = ejes.filter(e => e.pos).sort((a, b) => b.pos - a.pos || b.pos / b.personas - a.pos / a.personas)[0];
  if (valorado) out.push({ titulo: 'Lo mejor evaluado', ejes: [valorado.id], claves: de(valorado, c => c.tono === 'pos'),
    texto: `${valorado.nombre}: ${valorado.pos} de ${plural(valorado.personas, 'persona', 'personas')} lo mencionan en positivo.` });

  // The pair of axes that most people talk about together; those people sit between both axes.
  let par = null;
  for (let i = 0; i < ejes.length; i++) for (let j = i + 1; j < ejes.length; j++) {
    const ids = new Set(ejes[i].celdas.map(c => c.id)), comunes = ejes[j].celdas.filter(c => ids.has(c.id)).map(c => c.id);
    if (comunes.length >= 2 && (!par || comunes.length > par.comunes.length)) par = { a: ejes[i], b: ejes[j], comunes };
  }
  if (par) out.push({ titulo: 'Lo que va junto', ejes: [par.a.id, par.b.id],
    claves: par.comunes.flatMap(id => [clave(par.a.id, id), clave(par.b.id, id)]),
    texto: `${par.comunes.length} personas hablan de ${par.a.nombre} y de ${par.b.nombre} en la misma respuesta.` });

  if (v.propuestas.length) out.push({ titulo: 'Lo que proponen', ejes: [], claves: [],
    texto: `${plural(v.propuestas.length, 'propuesta', 'propuestas')}. Por ejemplo: «${v.propuestas[v.propuestas.length - 1]}».` });

  const todas = v.ejes.flatMap(e => e.celdas), n = t => contar(todas, t);
  out.push({ titulo: 'El tono general', ejes: [], claves: null,
    texto: `Sumando todas las menciones: ${n('pos')} positivas, ${n('neu')} neutras o mixtas y ${n('neg')} negativas.` });
  return out;
}

// Chart for a chat answer. The model only picks the kind and the axes; every number comes from v.
export function grafico(v, g) {
  if (!v || !g || g.tipo === 'ninguno') return null;
  if (g.tipo === 'emociones') {
    const filas = v.emociones.slice(0, 8).map(e => ({ nombre: e.emocion, n: e.n, tono: tono(e.emocion) }));
    return filas.length ? { tipo: 'barras', titulo: g.titulo, filas, max: Math.max(...filas.map(f => f.n)) } : null;
  }
  const pedidos = g.ejes?.length ? g.ejes.map(id => v.ejes.find(e => e.id === id)).filter(Boolean) : [];
  const ejes = pedidos.length ? pedidos : v.ejes.slice(0, 6);
  if (!ejes.length) return null;
  if (g.tipo === 'personas_por_eje')
    return { tipo: 'barras', titulo: g.titulo, ejes: ejes.map(e => e.id), filas: ejes.map(e => ({ nombre: e.nombre, n: e.personas })), max: Math.max(...ejes.map(e => e.personas)) };
  return { tipo: 'tono', titulo: g.titulo, ejes: ejes.map(e => e.id), filas: ejes.map(e => ({ nombre: e.nombre, pos: e.pos, neu: e.neu, neg: e.neg, n: e.personas })), max: Math.max(...ejes.map(e => e.personas)) };
}
