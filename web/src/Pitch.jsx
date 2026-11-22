import { useEffect, useRef, useState } from 'react';
import { arrancar } from './convex.jsx';
import { elegir } from './voces-datos.js';
import demoCamaras from '../../convex/demos/camaras.json';
import { montar } from './voces-dibujo.js';
import { Orbe, Pastilla } from './ds.js';
import './pitch.css';

// /pitch: the hackathon deck, light, on a 1920×1080 stage scaled to the window. The real Voces blob lives behind the
// stage and moves into the .hueco of the current slide (hidden when the slide has none). #0 is the waiting loop, #1 the cover. Keys: ← → space PgUp PgDn, N notes, F fullscreen, D toggles light/dark (dark by default, ?claro for light).

document.documentElement.dataset.theme = new URLSearchParams(location.search).has('claro') ? 'light' : 'dark';   // no flash before the first effect

const NOTAS_CIERRE = ['Edo · 2:30–3:00 (cierre)', 'Escuchar a grupos ya es un negocio grande', 'Hoy se paga por medir una vez al año; Audem entiende al grupo cada vez que hace falta, a costos muy bajos gracias a la IA', 'La IA sirve para más que hacer cosas rápido: permite tomar decisiones más relevantes'];

// Slide 0 loops while the room waits; the deck proper starts at #1.
const ESPERA = 'https://images-ext-1.discordapp.net/external/R0tg6w0L2xqfbXVKgrdaZMadpXDAGV3vbUXl50-sjnY/https/static.klipy.com/ii/35ccce3d852f7995dd2da910f2abd795/87/20/oX62bXI9.mp4';

const DIAPOS = [
  {
    clase: 'espera',
    notas: ['Antes de empezar', 'Loop mientras esperamos'],
    cuerpo: <>
      <p className="espera-texto">Mientras tanto esperas…<br /><span>un gato que baila</span></p>
      <video src={ESPERA} autoPlay loop muted playsInline />
    </>,
  },
  {
    clase: 'portada',
    notas: ['0:00–0:10', 'Somos Audem', 'El valor de la IA crece con cada persona que se suma'],
    cuerpo: <>
      <div className="texto">
        <Pastilla tono="coral">Platanus Hack 26</Pastilla>
        <h1 className="marca-grande">audem</h1>
        <p className="bajada">El valor de la IA crece con cada persona que se suma.</p>
      </div>
      <div className="hueco" data-zoom="2.2" />
    </>,
  },
  {
    notas: NOTAS_CIERRE,
    cuerpo: <>
      <p className="seccion-tit">Mercado</p>
      <h2 className="titular">Escuchar a grupos ya es un negocio grande…</h2>
      <div className="cifras">
        <div className="tarjeta"><p className="cifra-grande">US$150 mil M</p><p>Industria de insights en el mundo, 2024</p><p className="fuente">ESOMAR 2025</p></div>
        <div className="tarjeta"><p className="cifra-grande">US$200 M</p><p>Investigación de mercado y opinión en Chile, casi 300 empresas</p><p className="fuente">La Tercera / AIM, 2023</p></div>
      </div>
    </>,
  },
  {
    clase: 'solo-cita',
    notas: ['La cita', 'La legitimidad de una decisión colectiva viene de la calidad del razonamiento detrás'],
    cuerpo: <blockquote className="cita">
      <p>La legitimidad de una decisión colectiva viene de la calidad del razonamiento detrás.</p>
      <footer className="fuente">Micah Weinberg, Carnegie California (2026)</footer>
    </blockquote>,
  },
  {
    notas: ['El problema', 'Hoy escuchar a un grupo es escuchar de a uno', 'La encuesta lo reduce a una casilla; el chatbot conversa con una persona a la vez', 'Lo que dice uno no le sirve a nadie más'],
    cuerpo: <>
      <p className="seccion-tit">El problema</p>
      <h2 className="titular">…pero hoy se escucha de a uno</h2>
      <div className="contraste">
        <div>
          <svg viewBox="0 0 560 300" aria-hidden="true">
            {/* a whole opinion (many tones) squeezed into one box */}
            <Nube grupos={[['pos', 110, 110, 6], ['neg', 150, 175, 5], ['neu', 85, 195, 3], ['neg', 175, 95, 2]]} r={9} />
            <path d="M240 150h70" stroke="var(--linea-fuerte)" strokeWidth="4" markerEnd="url(#p-f)" />
            {[['Sí', 105, true], ['No', 195, false]].map(([t, y, ok]) => <g key={t}>
              <rect x="350" y={y - 28} width="56" height="56" rx="8" fill="var(--lienzo)" stroke="var(--linea-fuerte)" strokeWidth="3" />
              {ok && <path d={`M362 ${y}l12 12l22 -26`} fill="none" stroke="var(--coral)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />}
              <text x="428" y={y + 12} className="p-casilla">{t}</text>
            </g>)}
            <defs><marker id="p-f" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--linea-fuerte)" /></marker></defs>
          </svg>
          <p className="h-tit"><span>Las encuestas</span> reducen cada opinión a una casilla</p>
        </div>
        <div>
          <svg viewBox="0 0 560 300" aria-hidden="true">
            {/* each person alone with their own chatbot, nothing crosses between them */}
            {[0, 1, 2, 3].map(k => {
              const y = 45 + k * 70, c = ['pos', 'neg', 'neu', 'lila'][k];
              return <g key={k}>
                <circle cx="120" cy={y} r="20" fill={`var(--${c === 'lila' ? 'lila' : c})`} />
                <path d={`M152 ${y}h220`} stroke="var(--linea-fuerte)" strokeWidth="3" strokeDasharray="3 10" strokeLinecap="round" />
                <rect x="392" y={y - 22} width="56" height="44" rx="12" fill="var(--rubor-hondo)" stroke="var(--linea-fuerte)" strokeWidth="2" />
                <circle cx="410" cy={y} r="4" fill="var(--tinta-suave)" /><circle cx="430" cy={y} r="4" fill="var(--tinta-suave)" />
              </g>;
            })}
          </svg>
          <p className="h-tit"><span>La IA</span> conversa con una persona a la vez</p>
        </div>
      </div>
    </>,
  },
  {
    notas: ['Y juntar voces con IA no es trivial', 'Si le pides a un LLM que resuma al grupo, aplana a las minorías', 'Por eso leemos de a una persona y después agregamos'],
    cuerpo: <>
      <p className="seccion-tit">Desafío técnico</p>
      <h2 className="titular">Y juntar voces con IA no es trivial</h2>
      <div className="hallazgos">
        <div>
          <svg viewBox="0 0 300 200" aria-hidden="true">{Array.from({ length: 18 }, (_, k) => <circle key={k} cx={30 + (k % 6) * 48} cy={40 + Math.floor(k / 6) * 60} r="18" fill="var(--coral)" opacity={0.55 + (k % 3) * 0.15} />)}</svg>
          <p className="h-tit"><span>18 de 18</span> LLMs subrepresentan a las minorías</p><p className="fuente">Zhu et al., MIT y Stanford, 2025</p>
        </div>
        <div>
          <svg viewBox="0 0 300 200" aria-hidden="true">
            <circle cx="50" cy="130" r="30" fill="var(--linea)" /><circle cx="140" cy="115" r="46" fill="var(--turquesa)" /><circle cx="240" cy="100" r="62" fill="var(--linea)" />
            <text x="140" y="40" textAnchor="middle" className="h-marca">más justo</text>
          </svg>
          <p className="h-tit"><span>Más grande</span> no es más justo</p><p className="fuente">FairNews, ACL 2026</p>
        </div>
        <div>
          <svg viewBox="0 0 300 200" aria-hidden="true">
            {[[24, 50], [48, 92], [20, 128], [58, 150], [36, 172], [64, 30], [70, 112]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="9" fill={`var(--${['pos', 'neg', 'neu'][k % 3]})`} />)}
            <path d="M92 100h30" stroke="var(--linea-fuerte)" strokeWidth="3" markerEnd="url(#h-f)" />
            <rect x="134" y="62" width="64" height="76" rx="6" fill="var(--rubor-hondo)" />
            {[0, 1, 2].map(k => <rect key={k} x="146" y={76 + k * 18} width={[40, 28, 34][k]} height="10" rx="5" fill={`var(--${['pos', 'neg', 'neu'][k]})`} />)}
            <path d="M206 100h30" stroke="var(--linea-fuerte)" strokeWidth="3" markerEnd="url(#h-f)" />
            {[0, 1, 2, 3].map(k => <rect key={k} x="248" y={70 + k * 18} width={[44, 36, 44, 24][k]} height="8" rx="4" fill="var(--linea-fuerte)" opacity=".5" />)}
            <defs><marker id="h-f" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--linea-fuerte)" /></marker></defs>
          </svg>
          <p className="h-tit"><span>Agregar</span> antes de redactar</p><p className="fuente">Aghaebe et al., 2026</p>
        </div>
      </div>
    </>,
  },
  {
    clase: 'apuesta',
    notas: ['Nuestra apuesta', 'Cada voz que se suma afina el mapa', 'Con una persona hay una opinión; hacia la respuesta 8 aparecen las posturas; con 60 se ve el acuerdo, el desacuerdo y quién lo dice'],
    cuerpo: <>
      <p className="seccion-tit">Nuestra apuesta</p>
      <p className="enfasis gigante">Cada voz que se suma<br />afina el mapa.</p>
      <div className="escalera">
        {[
          [1, 'una opinión', [['neu', 150, 110, 1]]],
          [8, 'aparecen posturas', [['pos', 100, 90, 4], ['neg', 205, 130, 3], ['neu', 180, 55, 1]]],
          [60, 'el mapa del grupo', [['pos', 105, 90, 22], ['neg', 200, 125, 20], ['neu', 165, 52, 9], ['neg', 110, 165, 9]]],
        ].map(([n, txt, grupos]) => (
          <div key={n}>
            <svg viewBox="0 0 300 220" aria-hidden="true"><circle cx="150" cy="110" r="104" fill="var(--rubor)" /><Nube grupos={grupos} r={n === 1 ? 14 : 7} /></svg>
            <p><span className="num">{n}</span> {n === 1 ? 'voz' : 'voces'} · {txt}</p>
          </div>
        ))}
      </div>
    </>,
  },
  {
    clase: 'funcion',
    notas: ['0:40–1:20 · Video 1', 'Preguntas abiertas, cada persona responde con audio', 'Se procesa y se entiende, se analiza con grafos de frases y se clasifica', 'Todo entra a un modelo integral: la figura es el conocimiento colectivo'],
    cuerpo: <>
      <p className="seccion-tit">Cómo funciona</p>
      <h2 className="titular">De un audio a conocimiento colectivo</h2>
      <Embudo />
    </>,
  },
  {
    clase: 'demo',
    crece: true,
    notas: ['1:20–2:20 · Demo en vivo', 'A medida que llegan respuestas, la figura crece, se deforma y aborda mejor la complejidad', 'Mostrar tendencias, cómo se conectan los temas, sumar preguntas y cuestionar lo generado', 'Entre más actores, mejor representa la realidad'],
    cuerpo: ({ voces }) => <>
      <div className="texto">
        <p className="seccion-tit">Producto</p>
        <h2 className="titular">Crece con cada respuesta</h2>
        <p className="contador-vivo"><span className="num">{voces}</span> voces</p>
        <p className="leyenda">{[['pos', 'a favor'], ['neu', 'mixto'], ['neg', 'en contra']].map(([t, n]) => <span key={t}><i className="tono" style={{ background: `var(--${t})` }} />{n}</span>)}</p>
      </div>
      <div className="hueco" />
    </>,
  },
  {
    clase: 'cierre',
    notas: ['Cierre', 'Lo que viene: la encuesta itera', 'El mapa propone la siguiente pregunta: pregunta → voces → mapa → nueva pregunta', 'El valor de la IA crece con cada persona que se suma'],
    cuerpo: <>
      <div className="texto">
        <p className="seccion-tit">Lo que viene</p>
        <h2 className="titular">La encuesta itera con el grupo</h2>
        <p className="enfasis cierre-frase">El valor de la IA crece con cada persona que se suma.</p>
      </div>
      <Ciclo />
    </>,
  },
  {
    clase: 'final',
    notas: ['Demo en vivo', 'Abrir audem.vercel.app'],
    cuerpo: <>
      <p className="final-tit">Demo</p>
      <a className="final-url" href="/">audem.vercel.app</a>
    </>,
  },
];

const TOTAL = demoCamaras.respuestas.length;

// Slide "Cómo funciona": many voices enter wide on the left and narrow into one map. Quotes are real ones from the cámaras demo.
const VOCES = ['coral', 'turquesa', 'lila', 'oro', 'coral'];
const CITAS = [['neg', 'la muni no arregla la luz'], ['pos', 'Sí, que se pongan.'], ['neu', 'que no la pongan en mi poste']];
const GRUPOS = [['pos', 70, 70, 9], ['neu', 175, 60, 5], ['neg', 120, 150, 12]];   // tone, center x, y, people
// Dots in clusters, placed on a sunflower spiral so they never overlap. grupos: [tone, center x, center y, people].
function Nube({ grupos, r = 7 }) {
  return grupos.flatMap(([t, cx, cy, n]) => Array.from({ length: n }, (_, k) => {
    const a = k * 2.4, d = n === 1 ? 0 : r * 1.3 + r * 0.75 * Math.sqrt(k);
    return <circle key={t + cx + k} cx={cx + d * Math.cos(a)} cy={cy + d * Math.sin(a)} r={r} fill={`var(--${t})`} />;
  }));
}

// Slide "Lo que viene": question → voices → map → next question, with a dot running the loop.
function Ciclo() {
  return (
    <div className="ciclo">
      <svg viewBox="0 0 640 640" aria-hidden="true">
        <defs><marker id="ciclo-f" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--linea-fuerte)" /></marker></defs>
        {[[-58, 2], [62, 122], [182, 242]].map(([a, b]) => {
          const p = g => [320 + 240 * Math.cos(g * Math.PI / 180), 320 + 240 * Math.sin(g * Math.PI / 180)];
          const [x1, y1] = p(a), [x2, y2] = p(b);
          return <path key={a} d={`M${x1} ${y1}A240 240 0 0 1 ${x2} ${y2}`} fill="none" stroke="var(--linea-fuerte)" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" markerEnd="url(#ciclo-f)" />;
        })}
        <circle r="10" fill="var(--coral)"><animateMotion dur="6s" repeatCount="indefinite" path="M320 80A240 240 0 1 1 319.9 80" /></circle>
      </svg>
      <div className="nodo arriba"><div className="circulo"><span className="pregunta">?</span></div><p>Pregunta</p></div>
      <div className="nodo derecha"><div className="circulo"><div className="onda">{Array.from({ length: 9 }, (_, k) => <i key={k} style={{ background: 'var(--turquesa)', animationDelay: `${-(k * 7 % 10) / 10}s` }} />)}</div></div><p>Voces</p></div>
      <div className="nodo izquierda"><div className="circulo"><span className="mini-orbe" /></div><p>Mapa</p></div>
    </div>
  );
}

function Embudo() {
  const corte = x => [150 * x / 1200, 540 - 150 * x / 1200];
  return (
    <div className="embudo">
      <svg className="embudo-forma" viewBox="0 0 1200 540" aria-hidden="true">
        <defs><linearGradient id="embudo-g"><stop offset="0" stopColor="var(--rubor)" /><stop offset="1" stopColor="var(--rubor-hondo)" /></linearGradient></defs>
        <polygon points="0,0 1200,150 1200,390 0,540" fill="url(#embudo-g)" />
        {[300, 600, 900].map(x => <line key={x} x1={x} x2={x} y1={corte(x)[0]} y2={corte(x)[1]} stroke="var(--lienzo)" strokeWidth="6" />)}
      </svg>
      <div className="etapa voz">
        {VOCES.map((c, f) => <div key={f} className="onda">{Array.from({ length: 13 }, (_, k) => <i key={k} style={{ background: `var(--${c})`, animationDelay: `${-((k * 7 + f * 3) % 10) / 10}s` }} />)}</div>)}
      </div>
      <div className="etapa texto-etapa">{[100, 86, 94, 60].map((w, k) => <i key={k} style={{ width: w + '%' }} />)}</div>
      <div className="etapa ideas">{CITAS.map(([t, q]) => <p key={q}><i className="tono" style={{ background: `var(--${t})` }} />“{q}”</p>)}</div>
      <div className="etapa posturas">
        <svg viewBox="0 0 240 210" aria-hidden="true">
          <Nube grupos={GRUPOS} />
        </svg>
      </div>
      <div className="etapa mapa"><Orbe tamano={340} minimal descripcion="Mapa de posturas" /></div>
      <ol className="embudo-nombres">{['Voz', 'Texto', 'Ideas', 'Posturas', 'Mapa'].map(n => <li key={n}>{n}</li>)}</ol>
      <p className="embudo-tiempo"><span>≈ 15 s</span></p>
    </div>
  );
}

function Pitch() {
  const [i, setI] = useState(() => Math.min(DIAPOS.length - 1, Math.max(0, +location.hash.slice(1) || 0)));
  const [notas, setNotas] = useState(false);
  const [voces, setVoces] = useState(TOTAL);
  const [oscuro, setOscuro] = useState(() => !new URLSearchParams(location.search).has('claro'));
  const [k, setK] = useState(1);
  const dibujo = useRef(null);
  const d = DIAPOS[i];

  // Stage scale: the deck is laid out at 1920×1080 and fit to the window.
  useEffect(() => {
    const ajustar = () => setK(Math.min(innerWidth / 1920, innerHeight / 1080));
    ajustar(); addEventListener('resize', ajustar);
    return () => removeEventListener('resize', ajustar);
  }, []);

  // Before montar so the blob reads the right tokens; after it, repaint the blob on every toggle.
  useEffect(() => {
    document.documentElement.dataset.theme = oscuro ? 'dark' : 'light';
    dibujo.current?.pintar();
  }, [oscuro]);

  useEffect(() => {
    dibujo.current = montar({
      escenario: document.getElementById('escenario'), svg: document.getElementById('voces'),
      zona: () => {
        const h = document.querySelector('.diapo.activa .hueco') ?? document.querySelector('.hueco'), r = h.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, zoom: +h.dataset.zoom || 1 };
      },
    });
    dibujo.current.recibir(elegir(demoCamaras, null));
  }, []);

  useEffect(() => {
    const tecla = e => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) setI(x => Math.min(DIAPOS.length - 1, x + 1));
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) setI(x => Math.max(0, x - 1));
      else if (e.key === 'n' || e.key === 'N') setNotas(x => !x);
      else if (e.key === 'd' || e.key === 'D') setOscuro(x => !x);
      else if (e.key === 'f' || e.key === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      else return;
      e.preventDefault();
    };
    addEventListener('keydown', tecla);
    return () => removeEventListener('keydown', tecla);
  }, []);

  // On the demo slide the poll replays from its first answers, one every ~0.18 s; elsewhere it shows whole.
  useEffect(() => {
    history.replaceState(null, '', '#' + i);
    requestAnimationFrame(() => dibujo.current?.medir());
    if (!d.crece) { dibujo.current?.recibir(elegir(demoCamaras, null)); return; }
    let n = 3;
    dibujo.current?.recibir(elegir(demoCamaras, null, n)); setVoces(n);
    const t = setInterval(() => {
      n += 1;
      dibujo.current?.recibir(elegir(demoCamaras, null, n)); setVoces(n);
      if (n >= TOTAL) clearInterval(t);
    }, 180);
    return () => clearInterval(t);
  }, [i, k]);

  const conBola = !!d.clase && ['portada', 'demo'].includes(d.clase);
  return (
    <div className={`pitch ${conBola ? 'con-bola' : ''} en-${d.clase ?? 'normal'}`}>
      <div id="escenario" />
      <svg id="voces" aria-hidden="true" />
      <div className="escena" style={{ transform: `translate(-50%, -50%) scale(${k})` }}>
        {DIAPOS.map((x, j) => (
          <article key={j} className={`diapo ${x.clase ?? ''} ${j === i ? 'activa' : ''}`} aria-hidden={j !== i}>{typeof x.cuerpo === 'function' ? x.cuerpo({ voces }) : x.cuerpo}</article>
        ))}
        {i > 0 && <p className="contador num">{i} / {DIAPOS.length - 1}</p>}
      </div>
      {notas && <aside className="notas"><strong>{d.notas[0]}</strong><ul>{d.notas.slice(1).map(n => <li key={n}>{n}</li>)}</ul></aside>}
    </div>
  );
}

arrancar(Pitch);
