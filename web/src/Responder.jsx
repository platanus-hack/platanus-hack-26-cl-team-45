import { useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { arrancar, SLUG } from './convex.jsx';
import { Marca, Microfono } from './ds.js';
import './responder.css';

const MAX_S = 180;
// Anonymous participant id for this page load only: nothing about the voice is stored in the browser.
const YO = crypto.randomUUID();
const reloj = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// The design system's Microfono owns the screen and its states; this file records, measures the voice and uploads.
function Responder() {
  const encuesta = useQuery(api.encuestas.actual, { slug: SLUG });
  const urlSubida = useMutation(api.encuestas.urlSubida);
  const responderAudio = useMutation(api.encuestas.responderAudio);
  const responder = useMutation(api.encuestas.responder);
  const [estado, setEstado] = useState('reposo');
  const [nivel, setNivel] = useState(0);
  const grab = useRef(null);                              // { rec, stream, trozos, cerrarOido }
  const [previa, setPrevia] = useState(null);             // the recorded voice, in memory until sent or discarded: { blob, url }

  if (encuesta === undefined) return null;
  if (!encuesta || !encuesta.abierta) return (
    <main className="cerrada">
      <a href="/" aria-label="Inicio"><Marca tamano={26} /></a>
      <h1>{encuesta ? encuesta.pregunta : 'No existe esta encuesta'}</h1>
      <p>{encuesta ? 'Esta consulta ya cerró. Gracias por tu interés.' : 'Revisa el link que te mandaron.'}</p>
    </main>
  );

  // Live voice level for the BotonVoz rays, about 10 times a second.
  function escuchar(stream) {
    try {
      const ctx = new AudioContext(), an = ctx.createAnalyser(), datos = new Uint8Array(256);
      an.fftSize = 512; ctx.createMediaStreamSource(stream).connect(an);
      let v = 0;
      const id = setInterval(() => {
        an.getByteTimeDomainData(datos);
        let s = 0; for (const d of datos) s += ((d - 128) / 128) ** 2;
        v = v * 0.5 + Math.min(1, Math.sqrt(s / datos.length) * 4) * 0.5;
        setNivel(v);
      }, 100);
      return () => { clearInterval(id); ctx.close(); setNivel(0); };
    } catch { return () => {}; }
  }

  // Record in the browser; the server transcribes the upload (OpenRouter Whisper).
  async function grabar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const trozos = [], rec = new MediaRecorder(stream);
      rec.ondataavailable = e => e.data.size && trozos.push(e.data);
      rec.start();
      grab.current = { rec, stream, trozos, cerrarOido: escuchar(stream) };
    } catch { setEstado('error'); }
  }

  async function detener() {
    const g = grab.current; grab.current = null;
    if (!g) throw new Error('sin grabación');
    const blob = await new Promise(ok => { g.rec.onstop = () => ok(new Blob(g.trozos, { type: g.rec.mimeType })); g.rec.stop(); });
    g.cerrarOido(); g.stream.getTracks().forEach(t => t.stop());
    if (blob.size < 2000) throw new Error('grabación vacía');
    setPrevia({ blob, url: URL.createObjectURL(blob) });
  }

  function descartar() {
    if (previa) URL.revokeObjectURL(previa.url);
    setPrevia(null);
  }

  async function enviar() {
    const r = await fetch(await urlSubida(), { method: 'POST', headers: { 'Content-Type': previa.blob.type }, body: previa.blob });
    if (!r.ok) throw new Error('No se pudo subir el audio');
    const { storageId } = await r.json();
    await responderAudio({ encuestaId: encuesta._id, participante: YO, audioId: storageId });
    descartar();
  }

  async function enviarTexto(texto) {
    await responder({ encuestaId: encuesta._id, participante: YO, texto });
  }

  return (<>
    <a className="au-btn au-btn--contorno volver" href="/">← Volver</a>
    <Microfono pregunta={encuesta.pregunta} limite={MAX_S} estado={estado} onEstado={setEstado} nivel={estado === 'grabando' ? nivel : null}
      onGrabar={grabar} onDetener={detener} previa={previa?.url} onEnviar={enviar} onDescartar={descartar} onEnviarTexto={enviarTexto} />
  </>);
}

arrancar(Responder);
