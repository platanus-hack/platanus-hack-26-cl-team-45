import { memo, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { arrancar, SLUG } from './convex.jsx';
import { plural } from './comun.js';
import { Marca, Onda, Orbe, Pastilla } from './ds.js';
import { montar } from './panel-dibujo.js';
import './panel.css';

// Landing (/): the brand with a quiet Orbe, then the latest polls, newest first.
function Portada() {
  const encuestas = useQuery(api.encuestas.listar);
  return (
    <div className="portada">
      <header>
        <div className="presenta">
          <Marca tamano={88} segunda="escucha" simbolo={false} />
          <p>Cada voz que se suma afina el mapa.</p>
        </div>
        <Orbe tamano={360} minimal descripcion="Orbe de audem, decorativo" />
      </header>
      <Onda />
      <main>
        {encuestas?.slice(0, 12).map(e => (
          <section key={e._id}>
            <Pastilla tono={e.abierta ? 'turquesa' : 'neutro'}>{e.abierta ? 'Abierta' : 'Cerrada'}</Pastilla>
            <h2>{e.pregunta}</h2>
            <p className="meta"><span className="num">{plural(e.personas, 'persona', 'personas')}</span> · {new Date(e._creationTime).toLocaleDateString('es-CL')}</p>
            <div className="acciones">
              <a className="au-btn au-btn--primario" href={`/${e.slug}/panel`}>Ver el mapa</a>
              {e.abierta && <a className="au-btn au-btn--contorno" href={`/${e.slug}`}>Responder</a>}
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
      <header className="barra-sup">
        <a href="/" aria-label="Inicio"><Marca tamano={28} /></a>
        <div className="total"><span className="num" id="total">0</span><span>personas</span></div>
        <nav>
          <a className="au-btn au-btn--contorno" href={`/${SLUG}/flujo`}>Ver flujo</a>
          <a className="au-btn au-btn--contorno" href={`/${SLUG}/voces`}>Ver tópicos</a>
        </nav>
        <h1 id="pregunta">Audem</h1>
      </header>
      <main>
        <section id="mapa">
          <div className="barra-ctl">
            <div className="tiempo">
              <button id="play" className="au-btn au-btn--contorno" aria-label="Reproducir"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path id="icono" d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg></button>
              <input id="cursor" type="range" min="0" max="0" defaultValue="0" aria-label="Respuestas mostradas" />
              <span className="num" id="posicion">0 de 0</span>
              <button id="vivo" className="au-btn au-btn--contorno" aria-pressed="false"><i></i>En vivo</button>
            </div>
            <div className="filtro au-sel au-sel--tinta" role="group" aria-label="Filtrar por tono">
              {['pos', 'neu', 'neg'].map(t => (
                <button key={t} className="au-sel-op" data-tono={t} aria-pressed="true"><i className="tono" style={{ background: `var(--${t})` }}></i>{{ pos: 'positivo', neu: 'neutro', neg: 'negativo' }[t]}</button>
              ))}
            </div>
          </div>
          <figure id="figura">
            <svg id="svg" role="img" aria-label="Mapa de temas: cada círculo es un tema y cada punto una frase. Clic en un tema para ver sus frases."></svg>
            <figcaption>
              <span className="clave"><svg width="30" height="14" aria-hidden="true"><circle cx="4" cy="7" r="3.5" fill="var(--tinta-suave)" /><circle cx="21" cy="7" r="7" fill="var(--tinta-suave)" /></svg>frase: color = tono, tamaño = intensidad</span>
              <span className="clave">área del círculo = n.º de frases</span>
              <span className="clave"><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--tinta)" strokeWidth="2" /></svg>últimas 2 frases</span>
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
