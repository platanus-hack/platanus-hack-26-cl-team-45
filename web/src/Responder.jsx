import { useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { arrancar, SLUG } from './convex.jsx';
import { Marca, Microfono } from './ds.js';
import './responder.css';

const MAX_S = 180;
// Anonymous participant id, kept in this browser only.
const YO = (() => { try { return (localStorage.audem_id ||= crypto.randomUUID()); } catch { return crypto.randomUUID(); } })();
const reloj = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// The design system's Microfono owns the screen and its states; this file records, measures the voice and uploads.
function Responder() {
  const encuesta = useQuery(api.encuestas.actual, { slug: SLUG });
  const mias = useQuery(api.encuestas.mias, encuesta ? { encuestaId: encuesta._id, participante: YO } : 'skip');
  const urlSubida = useMutation(api.encuestas.urlSubida);
  const responderAudio = useMutation(api.encuestas.responderAudio);
  const responder = useMutation(api.encuestas.responder);
  const [estado, setEstado] = useState('reposo');
  const [nivel, setNivel] = useState(0);
  const grab = useRef(null);                              // { rec, stream, trozos, cerrarOido }

  if (encuesta === undefined || (encuesta && mias === undefined)) return null;
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

  async function terminar(segundos) {
    const g = grab.current; grab.current = null;
    if (!g) throw new Error('sin grabación');
    const blob = await new Promise(ok => { g.rec.onstop = () => ok(new Blob(g.trozos, { type: g.rec.mimeType })); g.rec.stop(); });
    g.cerrarOido(); g.stream.getTracks().forEach(t => t.stop());
    if (blob.size < 2000) throw new Error('grabación vacía');
    const r = await fetch(await urlSubida(), { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
    if (!r.ok) throw new Error('No se pudo subir el audio');
    const { storageId } = await r.json();
    await responderAudio({ encuestaId: encuesta._id, participante: YO, audioId: storageId });
    return { texto: `Audio de ${reloj(segundos)}` };
  }

  async function enviarTexto(texto) {
    await responder({ encuestaId: encuesta._id, participante: YO, texto });
    return { texto };
  }

  return (
    <Microfono pregunta={encuesta.pregunta} limite={MAX_S} estado={estado} onEstado={setEstado} nivel={estado === 'grabando' ? nivel : null}
      onGrabar={grabar} onTerminar={terminar} onEnviarTexto={enviarTexto}
      voces={mias.map(r => r.texto ? (r.texto.length > 140 ? r.texto.slice(0, 140) + '…' : r.texto) : 'Audio')} />
  );
}

arrancar(Responder);
