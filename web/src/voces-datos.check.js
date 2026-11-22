// node web/src/voces-datos.check.js — fails loudly if the Voces data layer breaks.
import assert from 'node:assert/strict';
import { elegir, lecturas, clave, grafico, recortar } from './voces-datos.js';

const celda = (id, direccion, intensidad = 'moderada') => ({ respuestaId: id, participante: id, direccion, tendencia: 'no_dice', temas: [{ tema: 'x', direccion, intensidad, cita: `cita ${id}` }] });
const topicos = {
  pregunta: '¿Qué tal?', analizadas: 4,
  topicos: [
    { id: 'a', nombre: 'Comida', personas: 3, celdas: [celda('r1', 'positivo'), celda('r2', 'negativo', 'fuerte'), celda('r3', 'mixto')] },
    { id: 'b', nombre: 'Sueño', personas: 2, celdas: [celda('r1', 'negativo'), celda('r2', 'negativo')] },
  ],
  propuestas: [{ respuestaId: 'r2', participante: 'r2', texto: 'Sala para dormir' }], emociones: [{ emocion: 'cansancio', n: 2 }],
};
const mapa = {
  pregunta: '¿Qué tal?', total_participantes: 2,
  clusters: [{ id: 't1', nombre: 'Comida bien', n: 2 }],
  frases: [
    { respuesta_id: 'r1', cluster_id: 't1', emocion: 'alegria', intensidad: 0.8, cita: 'rica' },
    { respuesta_id: 'r1', cluster_id: 't1', emocion: 'frustracion', intensidad: 0.4, cita: 'poca' },
    { respuesta_id: 'r2', cluster_id: 't1', emocion: 'gratitud', intensidad: 0.5, cita: 'gracias' },
  ],
};

// Source choice: tópicos wins; missing query (Error) or empty tópicos falls back to the map; nothing = null.
assert.equal(elegir(topicos, mapa).fuente, 'topicos');
assert.equal(elegir(new Error('no query'), mapa).fuente, 'mapa');
assert.equal(elegir({ ...topicos, topicos: [] }, mapa).fuente, 'mapa');
assert.equal(elegir(null, null), null);
assert.equal(elegir(new Error('no query'), null), null);
assert.equal(elegir(new Error('x'), { ...mapa, clusters: [] }).fuente, 'vacio');

// Tópicos cells: mixto counts as neu, intensity maps to 0..1.
const v = elegir(topicos, mapa);
assert.deepEqual([v.ejes[0].pos, v.ejes[0].neu, v.ejes[0].neg], [1, 1, 1]);
assert.equal(v.ejes[0].celdas[1].fuerza, 1);

// Map cells: one per person, good + bad emotions in one person = neu.
const m = elegir(new Error('x'), mapa);
assert.equal(m.ejes[0].personas, 2);
assert.deepEqual(m.ejes[0].celdas.map(c => c.tono), ['neu', 'pos']);
assert.deepEqual(m.emociones.find(e => e.emocion === 'alegria'), { emocion: 'alegria', n: 1 });

// Readings: division found in Comida, Sueño is what bothers most, r1 + r2 link both axes.
const ls = lecturas(v), por = t => ls.find(l => l.titulo === t);
assert.match(por('Donde hay división').texto, /Comida: 1 lo ven bien y 1 lo ven mal/);
assert.match(por('Lo que más molesta').texto, /^Sueño: 2/);
assert.deepEqual(por('Lo que va junto').claves, [clave('a', 'r1'), clave('b', 'r1'), clave('a', 'r2'), clave('b', 'r2')]);
assert.ok(por('Lo que proponen'));
assert.equal(lecturas({ ...v, ejes: [] }).length, 0);
// Chat charts: numbers always come from the data; unknown axis ids fall back to the main axes.
const g = grafico(v, { tipo: 'tono_por_eje', ejes: ['b'], titulo: 'tono' });
assert.deepEqual(g.filas, [{ nombre: 'Sueño', pos: 0, neu: 0, neg: 2, n: 2 }]);
assert.equal(grafico(v, { tipo: 'personas_por_eje', ejes: ['inventado'], titulo: 'x' }).filas.length, 2);
assert.equal(grafico(v, { tipo: 'emociones', ejes: [], titulo: 'x' }).filas[0].tono, 'neg');
assert.equal(grafico(v, { tipo: 'ninguno', ejes: [], titulo: 'x' }), null);
// Replay: the first n answers, counts recomputed; without arrival order nothing is cut.
const conOrden = { ...topicos, respuestas: ['r1', 'r2', 'r3'].map(id => ({ respuestaId: id, participante: id, emocion: id === 'r1' ? 'alegria' : 'cansancio', cerrada: 'sí' })) };
const uno = elegir(conOrden, mapa, 1);
assert.equal(uno.casos, 1);
assert.deepEqual(uno.ejes.map(e => [e.id, e.personas]), [['a', 1], ['b', 1]]);
assert.deepEqual(uno.emociones, [{ emocion: 'alegria', n: 1 }]);
assert.equal(uno.propuestas.length, 0);
assert.deepEqual(uno.cerrada, { si: 1, total: 1 });
assert.equal(recortar(topicos, 1), topicos);
assert.equal(elegir(conOrden, mapa, 2).ejes[0].personas, 2);
console.log('voces-datos ok');
