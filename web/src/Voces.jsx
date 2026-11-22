import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useQueries } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { arrancar, SLUG } from './convex.jsx';
import { NOMBRE_TONO, tono, plural } from './comun.js';
import { elegir, lecturas, clave } from './voces-datos.js';
import { Chat } from './Chat.jsx';
import { montar } from './voces-dibujo.js';
import './voces.css';

const TENDENCIA = { mejora: 'dice que mejoró', empeora: 'dice que empeoró', igual: 'dice que sigue igual' };
const FUENTE = {
  topicos: 'ejes = tópicos de qué se habla, normalizados por Claude a partir de los temas de cada respuesta',
  mapa: 'ejes = grupos de postura del mapa (los tópicos todavía no están disponibles)',
};

function Voces() {
  // useQueries returns an Error instead of throwing, so a deployment without encuestas.topicos falls back to the map.
  // The request object must be stable or useQueries re-subscribes on every render.
  const pedido = useMemo(() => ({ t: { query: api.encuestas.topicos, args: { slug: SLUG } }, m: { query: api.encuestas.mapa, args: { slug: SLUG } } }), []);
  const r = useQueries(pedido);
  const cargando = r.t === undefined || r.m === undefined;
  const v = useMemo(() => cargando ? undefined : elegir(r.t, r.m), [r.t, r.m, cargando]);
  const ls = useMemo(() => v ? lecturas(v) : [], [v]);
  const [sel, setSel] = useState(null);
  const [modo, setModo] = useState('vivo');
  const [paso, setPaso] = useState(0);
  const [auto, setAuto] = useState(true);
  const [ejesChat, setEjesChat] = useState(null);         // axes of the chat's latest chart, lit on the blob
  const dibujo = useRef(null);

  useEffect(() => {
    dibujo.current = montar({ escenario: document.getElementById('escenario'), svg: document.getElementById('voces'), onSelect: setSel });
  }, []);
  useEffect(() => { if (v !== undefined) dibujo.current.recibir(v); }, [v]);
  const lectura = modo === 'lecturas' && ls.length ? ls[paso % ls.length] : null;
  useEffect(() => {
    const chat = modo === 'chat' && ejesChat && v ? { ejes: ejesChat, claves: v.ejes.filter(e => ejesChat.includes(e.id)).flatMap(e => e.celdas.map(c => clave(e.id, c.id))) } : null;
    dibujo.current.resaltar(lectura ?? chat);
  }, [lectura, modo, ejesChat, v]);
  useEffect(() => {                                       // readings advance on their own until someone steps manually
    if (modo !== 'lecturas' || !auto || !ls.length) return;
    const id = setInterval(() => setPaso(p => (p + 1) % ls.length), 8000);
    return () => clearInterval(id);
  }, [modo, auto, ls.length]);

  const cambiar = m => { setModo(m); setPaso(0); setAuto(true); if (m !== 'vivo') dibujo.current.deseleccionar(); };
  const mover = d => { setAuto(false); setPaso(p => (p + d + ls.length) % ls.length); };
  const hay = v && v.ejes.length > 0;

  return (
    <>
      <Lienzo />
      <header>
        <h1>{v === null ? 'No existe esta encuesta' : v?.pregunta ?? 'Audem'}</h1>
        {hay && <div className="total"><span className="num">{v.casos}</span><span>{v.casos === 1 ? 'persona' : 'personas'}</span></div>}
        <nav>
          {hay && <div className="modos" role="group" aria-label="Vista">
            <button aria-pressed={modo === 'vivo'} onClick={() => cambiar('vivo')}>En vivo</button>
            <button aria-pressed={modo === 'lecturas'} onClick={() => cambiar('lecturas')}>Lecturas</button>
            <button aria-pressed={modo === 'chat'} onClick={() => cambiar('chat')}>Preguntar</button>
          </div>}
          <a className="boton" href={`/${SLUG}/panel`}>Mapa</a>
          <a className="boton" href={`/${SLUG}/flujo`}>Flujo</a>
        </nav>
        {hay && <p className="clave-fila">
          {['pos', 'neu', 'neg'].map(t => <span key={t} className="clave"><i className="tono" style={{ background: `var(--${t})` }}></i>{t === 'neu' ? 'neutro o mixto' : NOMBRE_TONO[t]}</span>)}
          <span className="clave">punto = una persona · tamaño = intensidad · el blob crece hacia lo más mencionado</span>
        </p>}
      </header>

      <aside id="tarjeta" aria-live="polite">
        {cargando && <p className="vacio">Cargando…</p>}
        {v && !hay && <div className="bloque">
          <h2>Todavía no hay respuestas analizadas</h2>
          <p className="vacio">Cada respuesta aparece aquí unos 15 segundos después de enviarse.</p>
          <a className="boton primario" href={`/${SLUG}`}>Responder</a>
        </div>}

        {lectura && <div className="bloque lectura">
          <h2>Lectura <span className="num">{(paso % ls.length) + 1}/{ls.length}</span></h2>
          <p className="titulo">{lectura.titulo}</p>
          <p>{lectura.texto}</p>
          <div className="pasos">
            <button onClick={() => mover(-1)} aria-label="Lectura anterior">‹</button>
            <div className="barra"><i style={{ width: `${((paso % ls.length) + 1) / ls.length * 100}%` }}></i></div>
            <button onClick={() => mover(1)} aria-label="Lectura siguiente">›</button>
          </div>
        </div>}

        {hay && modo === 'vivo' && (sel
          ? <Persona {...sel} cerrar={() => dibujo.current.deseleccionar()} />
          : <p className="vacio">Toca un punto para leer lo que dijo esa persona.</p>)}

        {hay && <Chat v={v} visible={modo === 'chat'} onFoco={setEjesChat} />}

        {hay && modo !== 'chat' && v.propuestas.length > 0 && <div className="bloque">
          <h2>Propuestas <span className="num">{v.propuestas.length}</span></h2>
          <ul className="propuestas">{v.propuestas.slice().reverse().map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>}
        {hay && modo !== 'chat' && v.emociones.length > 0 && <div className="bloque">
          <h2>{v.fuente === 'topicos' ? 'Emoción que domina' : 'Emociones'} <span className="num">· n.º de personas</span></h2>
          <ul className="emociones">{v.emociones.map(e => <li key={e.emocion}><i className="tono" style={{ background: `var(--${tono(e.emocion)})` }}></i>{e.emocion} <span className="num">{e.n}</span></li>)}</ul>
        </div>}
        {hay && modo !== 'chat' && <p className="metodo">Casos: {plural(v.casos, 'persona', 'personas')} · {plural(v.ejes.length, 'eje', 'ejes')}{v.ejes.length > 6 ? ', se muestran los 6 con más personas' : ''} · {FUENTE[v.fuente]}</p>}
      </aside>
    </>
  );
}

function Persona({ eje, celda, cerrar }) {
  return (
    <div className="bloque persona">
      <h2><i className="tono" style={{ background: `var(--${celda.tono})` }}></i>{eje.nombre} · {celda.postura}{TENDENCIA[celda.tendencia] ? ` · ${TENDENCIA[celda.tendencia]}` : ''}</h2>
      {celda.citas.map((c, i) => <q key={i}>{c}</q>)}
      <p className="cuenta num">En este eje: {plural(eje.personas, 'persona', 'personas')} · {eje.pos} pos · {eje.neu} neu · {eje.neg} neg</p>
      <button onClick={cerrar}>Cerrar</button>
    </div>
  );
}

// Static skeleton rendered once; voces-dibujo.js owns the canvas and the SVG contents.
const Lienzo = memo(() => (
  <>
    <div id="escenario"></div>
    <svg id="voces" role="img" aria-label="Un eje por tema, un punto por persona coloreado por su postura. Toca un punto o usa Tab y Enter para leer su cita."></svg>
  </>
));

arrancar(Voces);
