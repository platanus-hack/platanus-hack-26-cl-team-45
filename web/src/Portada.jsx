import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { arrancar } from './convex.jsx';
import { plural } from './comun.js';
import { Marca, Onda, Orbe, Pastilla } from './ds.js';
import './portada.css';

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
              <a className="au-btn au-btn--primario" href={`/${e.slug}/voces`}>Ver el mapa</a>
              {e.abierta && <a className="au-btn au-btn--contorno" href={`/${e.slug}`}>Responder</a>}
            </div>
          </section>
        ))}
        {encuestas?.length === 0 && <p className="meta">Todavía no hay encuestas.</p>}
      </main>
    </div>
  );
}

arrancar(Portada);
