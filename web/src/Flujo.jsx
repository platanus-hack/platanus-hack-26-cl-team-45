import { memo, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { arrancar, SLUG } from './convex.jsx';
import { NOMBRE_TONO } from './comun.js';
import { Marca } from './ds.js';
import { montar } from './flujo-dibujo.js';
import './flujo.css';

function Flujo() {
  const d = useQuery(api.encuestas.mapa, { slug: SLUG });
  const dibujo = useRef(null);
  useEffect(() => { dibujo.current = montar(); }, []);
  useEffect(() => { if (d !== undefined) dibujo.current.recibir(d); }, [d]);
  return <Lienzo />;
}

// Static skeleton rendered once; flujo-dibujo.js owns the SVG contents.
const Lienzo = memo(() => (
  <>
    <header className="barra-sup">
      <a href="/" aria-label="Inicio"><Marca tamano={28} /></a>
      <nav><a className="au-btn au-btn--contorno" href={`/${SLUG}/panel`}>Ver panel</a></nav>
      <h1 id="pregunta">Audem</h1>
    </header>
    <main>
      <section>
        <figure>
          <svg id="flujo" role="img" aria-label="Flujo: cada respuesta se divide en frases, cada frase se une a sus conceptos y cada concepto a los temas donde aparece. Pasa el cursor por cualquier nodo para seguir su camino."></svg>
          <figcaption>
            <span className="clave"><svg width="30" height="14" aria-hidden="true"><circle cx="4" cy="7" r="3.5" fill="var(--tinta-suave)" /><circle cx="21" cy="7" r="7" fill="var(--tinta-suave)" /></svg>frase: color = tono, tamaño = intensidad</span>
            {['pos', 'neu', 'neg'].map(t => <span key={t} className="clave"><i className="tono" style={{ background: `var(--${t})` }}></i>{NOMBRE_TONO[t]}</span>)}
            <span className="clave">grosor concepto → tema = n.º de frases</span>
            <span className="clave">tema: área = % de personas, un anillo por persona</span>
            <span className="clave">pasa el cursor para seguir un camino</span>
            <span className="metodo" id="metodo"></span>
          </figcaption>
        </figure>
      </section>
    </main>
    <div id="tip" role="tooltip"></div>
  </>
));

arrancar(Flujo);
