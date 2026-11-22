// Chat beside the blob: ask about the poll, get an answer, a chart computed from the real data and the quotes behind it.
import { useEffect, useRef, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SLUG, mensaje } from './convex.jsx';
import { grafico } from './voces-datos.js';
import { Entrada } from './ds.js';

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
      const m = mensaje(e);   // the missing-function detail is on the second line of e.message
      const txt = /Could not find public function/.test(e.message) ? 'El chat todavía no está desplegado en Convex. Hay que correr npx convex deploy (o npx convex dev).' : m;
      setMensajes(ms => [...ms, { rol: 'assistant', texto: txt, error: true }]);
    } finally { setEsperando(false); }
  }

  // The design system's Agente pieces (au-ag-*, Entrada); the chart stays ours because Agente has no chart slot.
  return (
    <div className="chat au-ag" hidden={!visible}>
      <div className="au-ag-lista" aria-live="polite">
        {!mensajes.length && <p className="au-ag-vacio">Pregunta qué dijo la gente. Respondo con lo que dijeron las {v.casos} personas y armo un gráfico con los conteos reales.</p>}
        {mensajes.map((m, i) => m.rol === 'user'
          ? <p key={i} className="au-ag-yo">{m.texto}</p>
          : <div key={i} className="au-ag-msg">
              <p className={`au-ag-texto${m.error ? ' es-error' : ''}`}>{m.texto}</p>
              <Grafico g={grafico(v, m.grafico)} casos={v.casos} />
              {m.citas?.length > 0 && <div className="au-ag-citas">{m.citas.slice(0, 3).map((c, j) => <figure key={j} className="au-ag-cita"><blockquote>«{c}»</blockquote></figure>)}</div>}
              {!m.error && <p className="au-ag-base">Basado en {v.casos} {v.casos === 1 ? 'persona' : 'personas'} de esta consulta</p>}
            </div>)}
        {esperando && <p className="au-ag-pensando">Leyendo las voces…</p>}
        <div ref={fin}></div>
      </div>
      {!esperando && !mensajes.length && <div className="au-sug" role="group" aria-label="Preguntas sugeridas">{SUGERENCIAS.map(s => <button key={s} type="button" className="au-sug-chip" onClick={() => enviar(s)}>{s}</button>)}</div>}
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
