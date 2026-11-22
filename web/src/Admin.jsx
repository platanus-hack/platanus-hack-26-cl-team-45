import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { arrancar, mensaje } from './convex.jsx';
import { plural } from './comun.js';
import { Boton, Marca } from './ds.js';
import './admin.css';

const guardar = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
const leer = k => { try { return localStorage.getItem(k); } catch { return null; } };
const urlDe = (slug, vista = '') => `${location.origin}/${slug}${vista && '/' + vista}`;
const fallo = e => alert(mensaje(e));

function Admin() {
  const [clave, setClave] = useState(leer('audem_admin') || '');
  const ok = useQuery(api.encuestas.esAdmin, clave ? { clave } : 'skip');
  if (!clave || ok === false) return <Login error={ok === false} entrar={k => { guardar('audem_admin', k); setClave(k); }} />;
  if (ok === undefined) return null;
  return <Tablero clave={clave} salir={() => { guardar('audem_admin', null); setClave(''); }} />;
}

function Login({ error, entrar }) {
  const [k, setK] = useState('');
  return (
    <section id="login">
      <Marca tamano={48} segunda="admin" />
      <form onSubmit={e => { e.preventDefault(); entrar(k); }}>
        <input type="password" placeholder="Clave de admin" autoComplete="current-password" required value={k} onChange={e => setK(e.target.value)} />
        <Boton type="submit">Entrar</Boton>
      </form>
      <p id="error" role="alert">{error ? 'Clave incorrecta.' : ''}</p>
    </section>
  );
}

function Tablero({ clave, salir }) {
  const encuestas = useQuery(api.encuestas.listar) ?? [];
  const crear = useMutation(api.encuestas.crear);
  const [sel, setSel] = useState(leer('audem_sel'));
  const [pregunta, setPregunta] = useState('');
  const elegir = id => { setSel(id); guardar('audem_sel', id); };
  const e = encuestas.find(x => x.slug === sel);

  return (
    <div id="app">
      <header>
        <Marca tamano={28} />
        <h1>Admin</h1>
        <Boton variante="contorno" onClick={salir}>Salir</Boton>
      </header>
      <main>
        <aside>
          <section>
            <h2>Nueva encuesta</h2>
            <form onSubmit={async ev => {
              ev.preventDefault();
              try { elegir(await crear({ clave, pregunta })); setPregunta(''); } catch (err) { fallo(err); }
            }}>
              <input placeholder="¿Qué le quieres preguntar al grupo?" required maxLength={300} value={pregunta} onChange={ev => setPregunta(ev.target.value)} />
              <Boton type="submit">Crear</Boton>
            </form>
          </section>
          <section style={{ marginTop: 'var(--esp-4)' }}>
            <h2>Encuestas</h2>
            <ul>
              {encuestas.map(x => (
                <li key={x._id}>
                  <button className="enc opcion" aria-current={x.slug === sel} onClick={() => elegir(x.slug)}>
                    <span>{x.pregunta}</span>
                    <span className="meta">{x.abierta ? 'abierta' : 'cerrada'} · {plural(x.personas, 'persona', 'personas')} · {plural(x.respuestas, 'respuesta', 'respuestas')}</span>
                  </button>
                </li>
              ))}
              {!encuestas.length && <li className="meta">Todavía no hay encuestas.</li>}
            </ul>
          </section>
        </aside>
        <section id="detalle">{e ? <Detalle key={e._id} e={e} clave={clave} /> : <p className="meta">Crea o elige una encuesta.</p>}</section>
      </main>
    </div>
  );
}

function Detalle({ e, clave }) {
  const respuestas = useQuery(api.encuestas.respuestas, { encuestaId: e._id }) ?? [];
  const abrirCerrar = useMutation(api.encuestas.abrirCerrar);
  const reprocesar = useMutation(api.encuestas.reprocesar);
  const borrar = useMutation(api.encuestas.borrarRespuesta);
  const [copiado, setCopiado] = useState(false);
  const qr = useRef(null);
  const link = urlDe(e.slug);
  // QRCode is the qrcodejs global loaded in index.html.
  useEffect(() => { qr.current.innerHTML = ''; new window.QRCode(qr.current, { text: link, width: 180, height: 180 }); }, [link]);

  const ESTADO = { transcribiendo: 'transcribiendo…', procesando: 'procesando…', listo: 'procesada', error: 'error al procesar' };
  return (
    <>
      <h2>{e.pregunta}</h2>
      <div className="acciones">
        <Boton variante="contorno" onClick={() => abrirCerrar({ clave, encuestaId: e._id, abierta: !e.abierta }).catch(fallo)}>{e.abierta ? 'Cerrar encuesta' : 'Reabrir encuesta'}</Boton>
        <a className="au-btn au-btn--contorno" href={urlDe(e.slug, 'panel')} target="_blank">Panel en vivo</a>
        <a className="au-btn au-btn--contorno" href={urlDe(e.slug, 'flujo')} target="_blank">Flujo</a>
      </div>
      <div className="qr">
        <div id="qr" ref={qr}></div>
        <div>
          <a id="link" href={link} target="_blank">{link}</a>
          <Boton variante="contorno" onClick={() => navigator.clipboard.writeText(link).then(() => setCopiado(true))}>{copiado ? 'Copiado' : 'Copiar link'}</Boton>
        </div>
      </div>
      <h2>Respuestas <span className="meta">{respuestas.length}</span></h2>
      <ul>
        {respuestas.map(r => (
          <li key={r._id} className="resp">
            {r.audioUrl && <audio controls preload="none" src={r.audioUrl}></audio>}
            {r.texto && <p>{r.texto}</p>}
            <div className="fila">
              <span className={`meta estado-${r.estado}`}>{ESTADO[r.estado]} · {new Date(r._creationTime).toLocaleTimeString('es-CL')}</span>
              <Boton variante="contorno" onClick={() => reprocesar({ clave, respuestaId: r._id }).catch(fallo)}>Reprocesar</Boton>
              <Boton variante="contorno" onClick={() => borrar({ clave, respuestaId: r._id }).catch(fallo)}>Borrar</Boton>
            </div>
          </li>
        ))}
        {!respuestas.length && <li className="meta">Aún no llegan respuestas.</li>}
      </ul>
    </>
  );
}

arrancar(Admin);
