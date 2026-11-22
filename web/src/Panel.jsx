import { memo, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { arrancar, SLUG } from './convex.jsx';
import { plural } from './comun.js';
import { montar } from './panel-dibujo.js';
import './panel.css';

// Landing (/): the latest polls, newest first.
function Portada() {
  const encuestas = useQuery(api.encuestas.listar);
  return (
    <div className="portada">
      <header><h1>audem</h1><p className="bajada">Cada voz que se suma afina el mapa.</p></header>
      <main>
        {encuestas?.slice(0, 12).map(e => (
          <section key={e._id}>
            <h2>{e.pregunta}</h2>
            <p className="meta">{e.abierta ? 'abierta' : 'cerrada'} · {plural(e.personas, 'persona', 'personas')} · {new Date(e._creationTime).toLocaleDateString('es-CL')}</p>
            <div className="acciones">
              <a className="boton" href={`/${e.slug}/panel`}>Panel en vivo</a>
              {e.abierta && <a className="boton" href={`/${e.slug}`}>Responder</a>}
            </div>
          </section>
        ))}
        {encuestas?.length === 0 && <p className="meta">Todavía no hay encuestas.</p>}
      </main>
    </div>
  );
}

function Panel() {
  const d = useQuery(api.encuestas.mapa, { slug: SLUG });
  const dibujo = useRef(null);
  useEffect(() => { dibujo.current = montar(); return () => dibujo.current.desmontar(); }, []);
  useEffect(() => { if (d !== undefined) dibujo.current.recibir(d); }, [d]);
  return <Lienzo />;
}

// Static skeleton rendered once; panel-dibujo.js owns everything inside it.
const Lienzo = memo(() => (
  <>
    <div className="app">
      <header>
        <h1 id="pregunta">Audem</h1>
        <div className="total"><span className="num" id="total">0</span><span>personas</span></div>
        <a className="boton" href={`/${SLUG}/flujo`}>Ver flujo</a>
        <a className="boton" href={`/${SLUG}/voces`}>Ver tópicos</a>
      </header>
      <main>
        <section id="mapa">
          <div className="barra-ctl">
            <div className="tiempo">
              <button id="play" aria-label="Reproducir"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path id="icono" d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg></button>
              <input id="cursor" type="range" min="0" max="0" defaultValue="0" aria-label="Respuestas mostradas" />
              <span className="num" id="posicion">0 de 0</span>
              <button id="vivo" aria-pressed="false"><i></i>En vivo</button>
            </div>
            <div className="vista" role="group" aria-label="Vista">
              <button data-vista="red" aria-pressed="true">Red</button>
              <button data-vista="temas" aria-pressed="false">Temas</button>
            </div>
            <div className="filtro" role="group" aria-label="Filtrar por tono">
              {['pos', 'neu', 'neg'].map(t => (
                <button key={t} data-tono={t} aria-pressed="true"><i className="tono" style={{ background: `var(--${t})` }}></i>{{ pos: 'positivo', neu: 'neutro', neg: 'negativo' }[t]}</button>
              ))}
            </div>
          </div>
          <figure id="figura" data-vista="red">
            <svg id="svg" role="img" aria-label="Mapa de temas: cada círculo es un tema y cada punto una frase. Clic en un tema para ver sus frases."></svg>
            <svg id="red" role="img" aria-label="Red: cada persona se une a sus frases y cada frase a su tema. Clic en un tema para ver sus frases."></svg>
            <figcaption>
              <span className="clave solo-red"><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.5" /></svg>persona</span>
              <span className="clave solo-red"><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="var(--ink)" /></svg>persona que une 2 o más temas</span>
              <span className="clave solo-red"><svg width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="url(#g-perla)" stroke="var(--accent)" strokeWidth="2" /></svg>tema (número = personas)</span>
              <span className="clave"><svg width="30" height="14" aria-hidden="true"><circle cx="4" cy="7" r="3.5" fill="var(--muted)" /><circle cx="21" cy="7" r="7" fill="var(--muted)" /></svg>frase: color = tono, tamaño = intensidad</span>
              <span className="clave solo-temas">área del círculo = n.º de frases</span>
              <span className="clave"><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--ink)" strokeWidth="2" /></svg>últimas 2 frases</span>
              <span className="metodo" id="metodo"></span>
            </figcaption>
          </figure>
        </section>
        <aside>
          <section>
            <h2>Temas</h2>
            <div id="temas"></div>
          </section>
          <section id="detalle"></section>
        </aside>
      </main>
    </div>
    <div id="tip" role="tooltip"></div>
  </>
));

arrancar(SLUG ? Panel : Portada);
