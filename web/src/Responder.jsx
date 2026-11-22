import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { arrancar, mensaje, SLUG } from './convex.jsx';
import './responder.css';

const MAX_S = 180;
const ESTADO = { transcribiendo: 'transcribiendo…', procesando: 'procesando…', listo: 'en el mapa', error: 'no se pudo procesar' };
// Anonymous participant id, kept in this browser only.
const YO = (() => { try { return (localStorage.audem_id ||= crypto.randomUUID()); } catch { return crypto.randomUUID(); } })();
const reloj = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const GRACIAS = <>¡Gracias! <a href={`/${SLUG}/panel`}>Mira lo que dijo el grupo</a></>;

// The voice button (design-system/ BotonVoz): rays around a glass ring, fixed lengths so they never jump between renders.
const RAYOS = Array.from({ length: 96 }, (_, i) => {
  const x = Math.sin((i + 1) * 12.9898) * 43758.5453, largo = 10 + 26 * (x - Math.floor(x));
  const a = (i * 3.75 - 90) * Math.PI / 180, r1 = 118, r2 = r1 + largo;
  return <line key={i} className={`r${i % 3}`} x1={150 + r1 * Math.cos(a)} y1={150 + r1 * Math.sin(a)} x2={150 + r2 * Math.cos(a)} y2={150 + r2 * Math.sin(a)} />;
});
const ARCO = 2 * Math.PI * 112;

function Responder() {
  const encuesta = useQuery(api.encuestas.actual, { slug: SLUG });
  const mias = useQuery(api.encuestas.mias, encuesta ? { encuestaId: encuesta._id, participante: YO } : 'skip') ?? [];
  const urlSubida = useMutation(api.encuestas.urlSubida);
  const responderAudio = useMutation(api.encuestas.responderAudio);
  const responder = useMutation(api.encuestas.responder);

  const [texto, setTexto] = useState('');
  const [escribir, setEscribir] = useState(false);
  const [estado, setEstado] = useState('');
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const rec = useRef(null), voz = useRef(null), oido = useRef(null);

  const abierta = !!encuesta?.abierta;
  const puedeGrabar = abierta && !!navigator.mediaDevices?.getUserMedia;

  // Live voice level → --nivel on the button, without re-rendering React.
  function escuchar(stream) {
    try {
      const ctx = new AudioContext(), an = ctx.createAnalyser(), datos = new Uint8Array(256);
      an.fftSize = 512; ctx.createMediaStreamSource(stream).connect(an);
      let v = 0, id;
      const paso = () => {
        an.getByteTimeDomainData(datos);
        let s = 0; for (const d of datos) s += ((d - 128) / 128) ** 2;
        v = v * 0.6 + Math.min(1, Math.sqrt(s / datos.length) * 4) * 0.4;
        voz.current?.style.setProperty('--nivel', v.toFixed(3));
        id = requestAnimationFrame(paso);
      };
      paso();
      oido.current = () => { cancelAnimationFrame(id); ctx.close(); voz.current?.style.setProperty('--nivel', '0'); };
    } catch { oido.current = null; }
  }

  // Record in the browser, upload to Convex storage; the server transcribes it (OpenRouter Whisper).
  async function grabar() {
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setEstado('No pudimos usar tu micrófono. Revisa el permiso o escribe tu respuesta.'); return; }
    const trozos = [], r = new MediaRecorder(stream);
    r.ondataavailable = e => e.data.size && trozos.push(e.data);
    r.onstop = () => { oido.current?.(); stream.getTracks().forEach(t => t.stop()); enviarAudio(new Blob(trozos, { type: r.mimeType })); };
    r.start();
    escuchar(stream);
    rec.current = r; setSegundos(0); setEstado(''); setGrabando(true);
  }
  const parar = () => { setGrabando(false); rec.current?.state === 'recording' && rec.current.stop(); };

  useEffect(() => {
    if (!grabando) return;
    const t0 = Date.now(), id = setInterval(() => setSegundos(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(id);
  }, [grabando]);
  useEffect(() => { if (grabando && segundos >= MAX_S) parar(); }, [grabando, segundos]);

  async function enviarAudio(blob) {
    if (blob.size < 2000) { setEstado('La grabación quedó vacía, intenta de nuevo.'); return; }
    setOcupado(true); setEstado('Subiendo tu voz…');
    try {
      const r = await fetch(await urlSubida(), { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
      if (!r.ok) throw new Error('Error: No se pudo subir el audio');
      const { storageId } = await r.json();
      await responderAudio({ encuestaId: encuesta._id, participante: YO, audioId: storageId });
      setEstado(GRACIAS);
    } catch (e) { setEstado(mensaje(e)); }
    setOcupado(false);
  }

  async function enviarTexto() {
    setOcupado(true); setEstado('Enviando…');
    try { await responder({ encuestaId: encuesta._id, participante: YO, texto }); setTexto(''); setEstado(GRACIAS); }
    catch (e) { setEstado(mensaje(e)); }
    setOcupado(false);
  }

  const fase = grabando ? 'grabando' : ocupado ? 'procesando' : 'reposo';
  return (
    <main>
      <a className="marca" href="/">audem</a>
      <h1>{encuesta === undefined ? 'Cargando pregunta…' : encuesta ? encuesta.pregunta : 'No existe esta encuesta'}</h1>
      <div className={`voz ${fase}`} ref={voz}>
        <div className="voz-halo" aria-hidden="true"></div>
        <svg className="voz-rayos" viewBox="0 0 300 300" aria-hidden="true"><g className="pulso"><g className="giro">{RAYOS}</g></g></svg>
        <div className="voz-anillo" aria-hidden="true"></div>
        {grabando && <svg className="voz-progreso" viewBox="0 0 300 300" aria-hidden="true">
          <circle cx="150" cy="150" r="112" strokeDasharray={ARCO} strokeDashoffset={ARCO * (1 - Math.min(1, segundos / MAX_S))} transform="rotate(-90 150 150)" />
        </svg>}
        <button id="mic" aria-pressed={grabando} aria-label={grabando ? 'Enviar audio' : 'Hablar'} disabled={!puedeGrabar || (!grabando && ocupado)} onClick={grabando ? parar : grabar}>
          {grabando
            ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="7.5" width="9" height="9" rx="2" className="lleno" /></svg>
            : <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" /></svg>}
        </button>
      </div>
      <div className="voz-texto" aria-live="polite">
        <p className="voz-titulo">{grabando ? <>Te escucho · <span className="num">{reloj(segundos)}</span></> : ocupado ? 'Leyendo tu voz…' : 'Toca para hablar'}</p>
        <p className="voz-sub">{grabando ? 'Toca de nuevo para enviar.' : `Hasta ${reloj(MAX_S)}, como un audio de WhatsApp.`}</p>
      </div>
      <button id="escribir" aria-expanded={escribir} aria-controls="texto" onClick={() => setEscribir(!escribir)}>{escribir ? 'Prefiero hablar' : 'Prefiero escribir'}</button>
      {escribir && <>
        <textarea id="texto" autoFocus value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escribe lo que piensas…" aria-label="Tu respuesta" />
        <button id="enviar" disabled={!abierta || grabando || ocupado || texto.trim().length < 3} onClick={enviarTexto}>Enviar respuesta</button>
      </>}
      <p id="estado" role="status">{encuesta && !encuesta.abierta ? 'Esta encuesta ya cerró.' : estado}</p>
      {mias.length > 0 && <section className="mias">
        <h2>Tus voces</h2>
        <ul aria-label="Tus respuestas">
          {mias.map(r => (
            <li key={r._id}><b className={`estado-${r.estado}`}>{ESTADO[r.estado]}</b><span>{r.texto ? r.texto.slice(0, 140) + (r.texto.length > 140 ? '…' : '') : 'audio'}</span></li>
          ))}
        </ul>
      </section>}
    </main>
  );
}

arrancar(Responder);
