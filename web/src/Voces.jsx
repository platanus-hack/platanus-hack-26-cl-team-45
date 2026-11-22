import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useQueries } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { arrancar, SLUG } from './convex.jsx';
import { NOMBRE_TONO, tono, plural } from './comun.js';
import { elegir, lecturas, clave } from './voces-datos.js';
import demoCamaras from '../../convex/demos/camaras.json';
import { Chat } from './Chat.jsx';
import { montar } from './voces-dibujo.js';
import { Boton, Marca, Pastilla } from './ds.js';
import './voces.css';

const TENDENCIA = { mejora: 'dice que mejoró', empeora: 'dice que empeoró', igual: 'dice que sigue igual' };
const FUENTE = {
  topicos: 'ejes = tópicos de qué se habla, normalizados por Claude a partir de los temas de cada respuesta',
  mapa: 'ejes = grupos de postura del mapa (los tópicos todavía no están disponibles)',
};

// Synthetic polls processed offline with the app's pipeline (evals/camaras/procesar.ts); their slug skips Convex.
const DEMO = { camaras: demoCamaras }[SLUG];

function Voces() {
  // useQueries returns an Error instead of throwing, so a deployment without encuestas.topicos falls back to the map.
  // The request object must be stable or useQueries re-subscribes on every render.
  const pedido = useMemo(() => DEMO ? {} : ({ t: { query: api.encuestas.topicos, args: { slug: SLUG } }, m: { query: api.encuestas.mapa, args: { slug: SLUG } } }), []);
  const r = useQueries(pedido);
  const cargando = !DEMO && (r.t === undefined || r.m === undefined);
  // Replay: n = how many answers to show, in arrival order (null = all, and keeps following new ones).
  const [n, setN] = useState(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const total = (DEMO ?? (r.t instanceof Error ? null : r.t))?.respuestas?.length ?? 0;
  const v = useMemo(() => DEMO ? elegir(DEMO, null, n) : cargando ? undefined : elegir(r.t, r.m, n), [r.t, r.m, cargando, n]);
  const ls = useMemo(() => v ? lecturas(v) : [], [v]);
  const [sel, setSel] = useState(null);
  const [modo, setModo] = useState('chat');                // chat: talk about what people think · lecturas: the statistics
  const [paso, setPaso] = useState(0);
  const [auto, setAuto] = useState(true);
  const [focoChat, setFocoChat] = useState(null);         // { ejes, personas } of the chat's latest answer, lit on the blob
  const dibujo = useRef(null);

  useEffect(() => {
    dibujo.current = montar({ escenario: document.getElementById('escenario'), svg: document.getElementById('voces'), onSelect: setSel });
  }, []);
  useEffect(() => { if (v !== undefined) dibujo.current.recibir(v); }, [v]);
  const lectura = modo === 'lecturas' && ls.length ? ls[paso % ls.length] : null;
  useEffect(() => {
    const ps = new Set(focoChat?.personas ?? []);
    const chat = modo === 'chat' && focoChat && v ? { ejes: focoChat.ejes, claves: v.ejes.flatMap(e => e.celdas.filter(c => ps.has(c.id)).map(c => clave(e.id, c.id))) } : null;
    dibujo.current.resaltar(lectura ?? chat);
  }, [lectura, modo, focoChat, v]);
  useEffect(() => {                                       // play: one more answer every 0.6 s until all are in
    if (!reproduciendo) return;
    const id = setInterval(() => setN(x => {
      const sig = (x ?? total) >= total ? 1 : (x ?? total) + 1;
      if (sig >= total) { setReproduciendo(false); return null; }
      return sig;
    }), 600);
    return () => clearInterval(id);
  }, [reproduciendo, total]);
  useEffect(() => {                                       // readings advance on their own until someone steps manually
    if (modo !== 'lecturas' || !auto || !ls.length) return;
    const id = setInterval(() => setPaso(p => (p + 1) % ls.length), 8000);
    return () => clearInterval(id);
  }, [modo, auto, ls.length]);

  const cambiar = m => { setModo(m); setPaso(0); setAuto(true); };
  const mover = d => { setAuto(false); setPaso(p => (p + d + ls.length) % ls.length); };
  const hay = v && v.ejes.length > 0;

  return (
    <>
      <Lienzo />
      <header className="barra-sup">
        <a href="/" aria-label="Inicio"><Marca tamano={28} /></a>
        <h1>{v === null ? 'No existe esta encuesta' : v?.pregunta ?? 'Audem'}</h1>
        {hay && <div className="total"><span className="num">{v.casos}</span><span>{v.casos === 1 ? 'persona' : 'personas'}</span></div>}
        <nav>
          {hay && <div className="modos au-sel au-sel--tinta" role="group" aria-label="Vista">
            <button className="au-sel-op" aria-pressed={modo === 'chat'} onClick={() => cambiar('chat')}>Conversar</button>
            <button className="au-sel-op" aria-pressed={modo === 'lecturas'} onClick={() => cambiar('lecturas')}>Lecturas</button>
          </div>}
          {!DEMO && <a className="au-btn au-btn--contorno" href={`/${SLUG}/flujo`}>Flujo</a>}
        </nav>
        {hay && <p className="clave-fila">
          {DEMO && <Pastilla tono="neutro">Datos sintéticos</Pastilla>}
          {['pos', 'neu', 'neg'].map(t => <span key={t} className="clave"><i className="tono" style={{ background: `var(--${t})` }}></i>{t === 'neu' ? 'neutro o mixto' : NOMBRE_TONO[t]}</span>)}
          <span className="clave">punto = una persona, ubicada entre los temas de los que habla · más lejos = dijo más y con más fuerza · arrastra para girar</span>
        </p>}
        {total > 1 && <div className="replay">
          <Boton variante="contorno" onClick={() => setReproduciendo(x => !x)} aria-label={reproduciendo ? 'Pausar' : 'Ver cómo se formó, respuesta a respuesta'}>{reproduciendo ? 'Pausar' : '▶ Ver cómo se formó'}</Boton>
          <input type="range" min="1" max={total} value={n ?? total} aria-label="Respuestas que se muestran"
            onChange={e => { setReproduciendo(false); const x = +e.target.value; setN(x >= total ? null : x); }} />
          <span className="num">{n ?? total} de {total}</span>
        </div>}
      </header>

      <aside id="tarjeta" aria-live="polite">
        {cargando && <p className="vacio">Cargando…</p>}
        {v && !hay && <div className="bloque">
          <h2>Todavía no hay respuestas analizadas</h2>
          <p className="vacio">Cada respuesta aparece aquí unos 15 segundos después de enviarse.</p>
          <a className="au-btn au-btn--primario" href={`/${SLUG}`}>Responder</a>
        </div>}

        {lectura && <div className="bloque lectura">
          <h2>Lectura <span className="num">{(paso % ls.length) + 1}/{ls.length}</span></h2>
          <p className="titulo">{lectura.titulo}</p>
          <p>{lectura.texto}</p>
          <div className="pasos">
            <Boton variante="contorno" onClick={() => mover(-1)} aria-label="Lectura anterior">‹</Boton>
            <div className="barra"><i style={{ width: `${((paso % ls.length) + 1) / ls.length * 100}%` }}></i></div>
            <Boton variante="contorno" onClick={() => mover(1)} aria-label="Lectura siguiente">›</Boton>
          </div>
        </div>}

        {hay && sel && <Persona {...sel} cerrar={() => dibujo.current.deseleccionar()} />}

        {/* Always mounted so the conversation survives a trip to Lecturas. */}
        {hay && <div className="chat-caja" hidden={modo !== 'chat'}><Chat v={v} onFoco={setFocoChat} onVer={id => dibujo.current.seleccionar(id)} /></div>}

        {hay && modo === 'lecturas' && v.propuestas.length > 0 && <div className="bloque">
          <h2>Propuestas <span className="num">{v.propuestas.length}</span></h2>
          <ul className="propuestas">{v.propuestas.slice().reverse().map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>}
        {hay && modo === 'lecturas' && v.emociones.length > 0 && <div className="bloque">
          <h2>{v.fuente === 'topicos' ? 'Emoción que domina' : 'Emociones'} <span className="num">· n.º de personas</span></h2>
          <ul className="emociones">{v.emociones.map(e => <li key={e.emocion}><i className="tono" style={{ background: `var(--${tono(e.emocion)})` }}></i>{e.emocion} <span className="num">{e.n}</span></li>)}</ul>
        </div>}
        {hay && modo === 'lecturas' && <p className="metodo">Casos: {plural(v.casos, 'persona', 'personas')} · {plural(v.ejes.length, 'eje', 'ejes')}{v.ejes.length > 6 ? ', se muestran los 6 con más personas' : ''} · {FUENTE[v.fuente]}</p>}
      </aside>
    </>
  );
}

// One person: everything they said, one block per axis they talk about (that is what places their dot).
function Persona({ celdas, cerrar }) {
  return (
    <div className="bloque persona">
      {celdas[0].celda.participante && <p className="quien">{celdas[0].celda.participante}</p>}
      {celdas.map(({ eje, celda }) => <div key={eje.id} className="tema">
        <h2><i className="tono" style={{ background: `var(--${celda.tono})` }}></i>{eje.nombre} · {celda.postura}{TENDENCIA[celda.tendencia] ? ` · ${TENDENCIA[celda.tendencia]}` : ''}</h2>
        {celda.citas.map((c, i) => <q key={i}>{c}</q>)}
      </div>)}
      <Boton variante="contorno" onClick={cerrar}>Cerrar</Boton>
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
