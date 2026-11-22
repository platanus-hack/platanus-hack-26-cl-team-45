// Chat beside the blob: ask what people think and why. Answers come from the same analysis the blob draws: each one
// names the people behind it, who light up on the blob, and their quotes open their dot.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SLUG, mensaje } from './convex.jsx';
import { Entrada, Simbolo } from './ds.js';

const SUGERENCIAS = ['¿Qué es lo que más le preocupa a la gente?', '¿En qué no se ponen de acuerdo?', '¿Qué piensan quienes están en contra?', '¿Qué propone la gente?'];

export function Chat({ v, onFoco, onVer }) {
  const preguntar = useAction(api.chat.preguntar);
  const [mensajes, setMensajes] = useState([]);           // { rol, texto, voces?: [{ persona, cita }], ejes?, error? }
  const [esperando, setEsperando] = useState(false);
  const hilo = useRef(null), turno = useRef(null);
  // Keep the latest question at the top of the thread, so a long answer reads from its start.
  useEffect(() => {
    const h = hilo.current, t = turno.current;
    if (h && t) h.scrollTo({ top: t.offsetTop - h.offsetTop - 8, behavior: 'smooth' });
  }, [mensajes.length, esperando]);
  const ultimaPregunta = mensajes.map(m => m.rol).lastIndexOf('user');

  // Who is who: the person ids the answers name, against the people on screen.
  const quien = useMemo(() => new Map(v.ejes.flatMap(e => e.celdas.map(c => [c.id, c.participante]))), [v]);
  // The newest answer lights its people and axes on the blob.
  const ultimo = [...mensajes].reverse().find(m => m.rol === 'assistant' && !m.error);
  useEffect(() => { onFoco(ultimo ? { ejes: ultimo.ejes ?? [], personas: (ultimo.voces ?? []).map(x => x.persona) } : null); }, [ultimo]);

  async function enviar(p) {
    const q = p.trim();
    if (!q || esperando) return;
    const historial = mensajes.filter(m => !m.error).map(m => ({ rol: m.rol, texto: m.texto }));
    setMensajes(ms => [...ms, { rol: 'user', texto: q }]);
    setEsperando(true);
    try {
      const r = await preguntar({ slug: SLUG, pregunta: q, historial });
      setMensajes(ms => [...ms, { rol: 'assistant', texto: r.respuesta, voces: r.voces.filter(x => quien.has(x.persona)), ejes: r.ejes }]);
    } catch (e) {
      // Say what happened in plain words; the raw message stays in the console.
      console.error(e);
      const txt = /Could not find public function/.test(e.message) ? 'El chat todavía no está desplegado en Convex (npx convex deploy).'
        : /authentication|api[_ ]?key|401/i.test(e.message) ? 'No pude leer las voces: falta la clave de Anthropic en Convex (npx convex env set ANTHROPIC_API_KEY …).'
        : `No pude responder ahora. Intenta de nuevo. (${mensaje(e)})`;
      setMensajes(ms => [...ms, { rol: 'assistant', texto: txt, error: true }]);
    } finally { setEsperando(false); }
  }

  const pendientes = SUGERENCIAS.filter(s => !mensajes.some(m => m.rol === 'user' && m.texto === s));
  return (
    <div className="chat">
      <div className="chat-cab">
        <h2>Pregúntale a las voces</h2>
        {mensajes.length > 0 && <button type="button" className="chat-nueva" onClick={() => setMensajes([])} disabled={esperando}>Nueva conversación</button>}
      </div>
      <div className="chat-hilo" ref={hilo} role="log" aria-live="polite">
        {!mensajes.length && <>
          <p className="chat-vacio">Pregunta qué piensa la gente y por qué. Respondo desde lo que dijeron las {v.casos} personas de la bola, con sus palabras, y te marco en la bola quiénes lo dicen.</p>
          <div className="chat-inicio">{SUGERENCIAS.map(s => <button key={s} type="button" className="au-sug-chip" onClick={() => enviar(s)}>{s}</button>)}</div>
        </>}
        {mensajes.map((m, i) => m.rol === 'user'
          ? <p key={i} ref={i === ultimaPregunta ? turno : null} className="chat-yo">{m.texto}</p>
          : <div key={i} className="chat-turno">
              <Simbolo alto={24} />
              <div className={`chat-burbuja${m.error ? ' es-error' : ''}`}>
                <p className="chat-texto">{m.texto}</p>
                {m.voces?.length > 0 && <div className="chat-voces">{m.voces.map((x, j) =>
                  <button key={j} type="button" className="chat-voz" onClick={() => onVer(x.persona)}>
                    <q>{x.cita}</q><span>{quien.get(x.persona) || 'Una persona'}</span>
                  </button>)}</div>}
              </div>
            </div>)}
        {esperando && <div className="chat-turno"><Simbolo alto={24} /><div className="chat-burbuja chat-escribiendo" aria-label="Leyendo las voces"><i></i><i></i><i></i></div></div>}
      </div>
      {!esperando && mensajes.length > 0 && pendientes.length > 0 && <div className="au-sug chat-sug" role="group" aria-label="Preguntas sugeridas">{pendientes.map(s => <button key={s} type="button" className="au-sug-chip" onClick={() => enviar(s)}>{s}</button>)}</div>}
      <Entrada onEnviar={enviar} deshabilitado={esperando} pensando={esperando} placeholder="¿Qué piensa la gente de…?" />
    </div>
  );
}
