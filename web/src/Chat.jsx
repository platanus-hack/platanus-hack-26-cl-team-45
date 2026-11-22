// Chat beside the blob: ask about the poll, get an answer, a chart computed from the real data and the quotes behind it.
import { useEffect, useRef, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SLUG, mensaje } from './convex.jsx';
import { grafico } from './voces-datos.js';
import { Entrada, Simbolo } from './ds.js';

const SUGERENCIAS = ['¿Qué es lo que más molesta?', 'Compara el tono de los temas principales', '¿Qué emociones predominan?', '¿Qué propone la gente?'];

export function Chat({ v, visible, onFoco }) {
  const preguntar = useAction(api.chat.preguntar);
  const [mensajes, setMensajes] = useState([]);           // { rol, texto, grafico?, citas?, error? }
  const [esperando, setEsperando] = useState(false);
  const fin = useRef(null);
  useEffect(() => { fin.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [mensajes, esperando]);

  // The newest answer's axes light up on the blob while the chat is open.
  const ultimo = [...mensajes].reverse().find(m => m.rol === 'assistant' && m.grafico);
  useEffect(() => { onFoco(visible && ultimo ? grafico(v, ultimo.grafico)?.ejes ?? null : null); }, [visible, ultimo, v]);

  async function enviar(p) {
    const q = p.trim();
    if (!q || esperando) return;
    const historial = mensajes.filter(m => !m.error).map(m => ({ rol: m.rol, texto: m.texto }));
    setMensajes(ms => [...ms, { rol: 'user', texto: q }]);
    setEsperando(true);
    try {
      const r = await preguntar({ slug: SLUG, pregunta: q, historial });
      setMensajes(ms => [...ms, { rol: 'assistant', texto: r.respuesta, grafico: r.grafico, citas: r.citas }]);
    } catch (e) {
      // Say what happened in plain words; the raw message stays in the console.
      console.error(e);
      const txt = /Could not find public function/.test(e.message) ? 'El chat todavía no está desplegado en Convex (npx convex deploy).'
        : /authentication|api[_ ]?key|401/i.test(e.message) ? 'No pude leer las voces: falta la clave de Anthropic en Convex (npx convex env set ANTHROPIC_API_KEY …).'
        : `No pude responder ahora. Intenta de nuevo. (${mensaje(e)})`;
      setMensajes(ms => [...ms, { rol: 'assistant', texto: txt, error: true }]);
    } finally { setEsperando(false); }
  }

  // A conversation: your question on the right, the answer in a bubble on the left with the Orbe, chart and quotes inside it.
  // Suggestions stay under the thread (minus the ones already asked); Entrada is the design system's input.
  const pendientes = SUGERENCIAS.filter(s => !mensajes.some(m => m.rol === 'user' && m.texto === s));
  return (
    <div className="chat" hidden={!visible}>
      <div className="chat-cab">
        <h2>Pregúntale a las voces</h2>
        {mensajes.length > 0 && <button type="button" className="chat-nueva" onClick={() => setMensajes([])} disabled={esperando}>Nueva conversación</button>}
      </div>
      <div className="chat-hilo" role="log" aria-live="polite">
        {!mensajes.length && <>
          <p className="chat-vacio">Respondo con lo que dijeron las {v.casos} personas y armo un gráfico con los conteos reales. Prueba con una de estas:</p>
          <div className="chat-inicio">{SUGERENCIAS.map(s => <button key={s} type="button" className="au-sug-chip" onClick={() => enviar(s)}>{s}</button>)}</div>
        </>}
        {mensajes.map((m, i) => m.rol === 'user'
          ? <p key={i} className="chat-yo">{m.texto}</p>
          : <div key={i} className="chat-turno">
              <Simbolo alto={24} />
              <div className={`chat-burbuja${m.error ? ' es-error' : ''}`}>
                <p className="chat-texto">{m.texto}</p>
                <Grafico g={grafico(v, m.grafico)} casos={v.casos} />
                {m.citas?.length > 0 && <div className="chat-citas">{m.citas.slice(0, 3).map((c, j) => <blockquote key={j}>«{c}»</blockquote>)}</div>}
                {!m.error && <p className="chat-base">Basado en {v.casos} {v.casos === 1 ? 'persona' : 'personas'} de esta consulta</p>}
              </div>
            </div>)}
        {esperando && <div className="chat-turno"><Simbolo alto={24} /><div className="chat-burbuja chat-escribiendo" aria-label="Leyendo las voces"><i></i><i></i><i></i></div></div>}
        <div ref={fin}></div>
      </div>
      {!esperando && mensajes.length > 0 && pendientes.length > 0 && <div className="au-sug chat-sug" role="group" aria-label="Preguntas sugeridas">{pendientes.map(s => <button key={s} type="button" className="au-sug-chip" onClick={() => enviar(s)}>{s}</button>)}</div>}
      <Entrada onEnviar={enviar} deshabilitado={esperando} pensando={esperando} placeholder="Pregunta sobre lo que dijo la gente…" />
    </div>
  );
}

// Horizontal bars in SVG: stacked by tone, or plain counts. Every value is from the data, with its n.
function Grafico({ g, casos }) {
  if (!g) return null;
  const fila = 26, izq = 118, ancho = 200, alto = g.filas.length * fila + 4;
  const corto = s => s.length > 17 ? s.slice(0, 16) + '…' : s;
  return (
    <figure className="grafico">
      <figcaption>{g.titulo}</figcaption>
      <svg viewBox={`0 0 ${izq + ancho + 40} ${alto}`} role="img" aria-label={`${g.titulo}: ${g.filas.map(f => `${f.nombre} ${f.n}`).join(', ')}`}>
        {g.filas.map((f, i) => {
          const y = i * fila + 4, esc = ancho / Math.max(1, g.max);
          let x = izq;
          return (
            <g key={f.nombre}>
              <text x={izq - 8} y={y + 13} textAnchor="end"><title>{f.nombre}</title>{corto(f.nombre)}</text>
              {g.tipo === 'tono'
                ? ['pos', 'neu', 'neg'].map(t => { const w = f[t] * esc, r = <rect key={t} x={x} y={y} width={w} height={16} rx={3} fill={`var(--${t})`} />; x += w; return r; })
                : <rect x={izq} y={y} width={f.n * esc} height={16} rx={3} fill={f.tono ? `var(--${f.tono})` : 'var(--tinta-suave)'} opacity={f.tono ? 1 : 0.55} />}
              <text className="num" x={izq + f.n * esc + 6} y={y + 13}>{g.tipo === 'tono' ? `${f.pos}·${f.neu}·${f.neg}` : f.n}</text>
            </g>
          );
        })}
      </svg>
      <p className="metodo-mini num">{g.tipo === 'tono' ? 'pos · neu · neg, en personas' : 'personas'} · Casos: {casos}</p>
    </figure>
  );
}
