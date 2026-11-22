// Imperative SVG drawing for the live panel (grid of themes + force-directed network). Mounted by Panel.jsx.
import { esc, tono, plural, NOMBRE_TONO } from './comun.js';

export function montar() {
  const W = 1100, H = 780, PLAY_MS = 1200, N_ULTIMAS = 2;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const svg = $('svg'), tip = $('tip');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // View state. `cursor` = how many respuestas are shown, in arrival order.
  const st = { datos: null, orden: [], cursor: 0, jugando: false, envivo: true, tonos: new Set(['pos', 'neu', 'neg']), sel: null };
  const visto = new Set();
  // Convex data arrives from the React component; null = no poll with this slug.
  function recibir(d) {
    if (d) cargar(d); else $('pregunta').textContent = 'No existe esta encuesta';
  }

  function cargar(d) {
    st.datos = d;
    st.orden = [...new Set(d.frases.map(f => f.respuesta_id))];
    if (st.envivo) st.cursor = st.orden.length;
    st.cursor = Math.min(st.cursor, st.orden.length);
    render();
  }

  function avanzar() {
    if (!st.jugando) return;
    st.cursor = Math.min(st.cursor + 1, st.orden.length);
    if (st.cursor === st.orden.length) { st.jugando = false; st.envivo = true; }
    render();
  }

  // Grid layout: each cluster takes the free cell nearest to its backend x/y, so similar themes sit close
  // and nothing overlaps. A partial last row is centered. Circle area is proportional to the number of frases.
  const LABEL_H = 74;
  function layout(grupos) {
    const n = grupos.length, cols = Math.ceil(Math.sqrt(n * W / H)), rows = Math.ceil(n / cols);
    const cw = W / cols, ch = H / rows;
    const rmax = Math.max(40, Math.min(cw / 2 - 14, (ch - LABEL_H) / 2 - 8));
    const maxF = Math.max(12, ...grupos.map(g => g.frases.length)); // floor keeps early clusters small so they visibly grow
    const xs = grupos.map(g => g.x), ys = grupos.map(g => g.y);
    const nx = v => (v - Math.min(...xs)) / ((Math.max(...xs) - Math.min(...xs)) || 1);
    const ny = v => (Math.max(...ys) - v) / ((Math.max(...ys) - Math.min(...ys)) || 1);
    const libres = [];
    for (let r = 0; r < rows; r++) {
      const enFila = r === rows - 1 ? n - cols * (rows - 1) : cols, off = (cols - enFila) * cw / 2;
      for (let c = 0; c < enFila; c++) libres.push({ x: off + (c + 0.5) * cw, y: r * ch + (ch - LABEL_H) / 2 });
    }
    // Fixed order by id keeps cells stable while counts change.
    for (const g of grupos.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
      const tx = nx(g.x) * W, ty = ny(g.y) * H;
      libres.sort((a, b) => Math.hypot(a.x - tx, a.y - ty) - Math.hypot(b.x - tx, b.y - ty));
      const cell = libres.shift();
      g.r = rmax * Math.sqrt(g.frases.length / maxF); // area ∝ frases, no floor so the encoding stays honest
      g.cx = cell.x; g.cy = cell.y;
    }
    return Math.min(26, 0.78 * rmax / Math.sqrt(maxF)); // dot spacing shared by all clusters
  }

  function lineas(t, max = 22) {
    const out = [''];
    for (const w of t.split(' ')) (out[out.length - 1] + ' ' + w).trim().length > max && out[out.length - 1] ? out.push(w) : out[out.length - 1] = (out[out.length - 1] + ' ' + w).trim();
    return out.length > 2 ? [out[0], out.slice(1).join(' ')] : out;
  }

  function el(tag, attrs, parent) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; }
  function mostrarTip(ev, html) { tip.innerHTML = html; tip.style.opacity = 1; tip.style.left = Math.min(ev.clientX + 14, innerWidth - 330) + 'px'; tip.style.top = (ev.clientY + 14) + 'px'; }
  function ocultarTip() { tip.style.opacity = 0; }
  const cita = (f, extra, nueva) => `<blockquote class="cita${nueva ? ' nueva' : ''}"><q>${esc(f.cita || f.texto)}</q><p><i class="tono" style="background:var(--${tono(f.emocion)})"></i>${esc(f.emocion)}${extra ? ' · ' + esc(extra) : ''}</p></blockquote>`;

  function seleccionar(id) { st.sel = st.sel === id ? null : id; render(); }

  function render() {
    const d = st.datos;
    if (!d) return;
    if (d.pregunta) $('pregunta').textContent = d.pregunta;
    const mostradas = new Set(st.orden.slice(0, st.cursor));
    const frases = d.frases.filter(f => mostradas.has(f.respuesta_id));
    const porCluster = new Map(d.clusters.map(c => [c.id, { ...c, frases: [] }]));
    frases.forEach(f => porCluster.get(f.cluster_id)?.frases.push(f));
    const grupos = [...porCluster.values()].filter(g => g.frases.length);
    grupos.forEach(g => {
      g.personas = new Set(g.frases.map(f => f.respuesta_id)).size;
      g.tonos = { pos: 0, neu: 0, neg: 0 }; g.frases.forEach(f => g.tonos[tono(f.emocion)]++);
    });
    if (st.sel && !grupos.some(g => g.id === st.sel)) st.sel = null;
    const esp = layout(grupos);
    const personas = mostradas.size;

    // Controls
    $('total').textContent = personas;
    $('cursor').max = st.orden.length; $('cursor').value = st.cursor;
    $('posicion').textContent = `${st.cursor} de ${plural(st.orden.length, 'respuesta', 'respuestas')}`;
    $('vivo').setAttribute('aria-pressed', st.envivo);
    $('play').setAttribute('aria-label', st.jugando ? 'Pausar' : 'Reproducir');
    $('icono').setAttribute('d', st.jugando ? 'M3 1.5h3v11H3zM8 1.5h3v11H8z' : 'M3 1.5v11l9-5.5z');
    document.querySelectorAll('.filtro button').forEach(b => b.setAttribute('aria-pressed', st.tonos.has(b.dataset.tono)));
    $('metodo').textContent = `n = ${plural(frases.length, 'frase', 'frases')} · frases, temas y tono por LLM`;
    const recientes = new Set(frases.slice(-N_ULTIMAS).map(f => f.id));

    // Map: one <g> per cluster, keyed by id so CSS transitions animate moves instead of redrawing.
    const vivos = new Set();
    for (const g of grupos) {
      vivos.add('g' + g.id);
      let n = svg.querySelector(`[data-k="g${CSS.escape(g.id)}"]`);
      if (!n) {
        n = el('g', { class: 'grupo', 'data-k': 'g' + g.id }, svg);
        el('circle', { class: 'fondo', cx: 0, cy: 0 }, n);
        el('text', { class: 'nombre' }, n); el('text', { class: 'sub' }, n);
        el('g', { class: 'puntos' }, n);
        n.addEventListener('click', () => seleccionar(g.id));
      }
      n.classList.toggle('elegido', st.sel === g.id);
      n.classList.toggle('atenuado', !!st.sel && st.sel !== g.id);
      n.style.transform = `translate(${g.cx}px, ${g.cy}px)`;
      n.querySelector('.fondo').setAttribute('r', g.r);
      const [tn, ts] = n.querySelectorAll('text');
      const ls = lineas(g.nombre);
      tn.innerHTML = ls.map((l, i) => `<tspan x="0" dy="${i ? 23 : 0}">${esc(l)}</tspan>`).join('');
      tn.setAttribute('y', g.r + 27);
      ts.textContent = `${plural(g.personas, 'persona', 'personas')} · ${plural(g.frases.length, 'frase', 'frases')}`;
      ts.setAttribute('y', g.r + 27 + 23 * ls.length);
      const pts = n.querySelector('.puntos');
      g.frases.forEach((f, i) => {
        // Sunflower packing: even spacing inside the circle with no physics.
        const rad = esp * Math.sqrt(i + 0.5), ang = i * 2.39996;
        const x = rad * Math.cos(ang), y = rad * Math.sin(ang), t = tono(f.emocion);
        let p = pts.querySelector(`[data-k="${CSS.escape(f.id)}"]`);
        if (!p) {
          p = el('g', { class: 'punto', 'data-k': f.id }, pts);
          const r = esp * (0.24 + 0.2 * Math.max(0, Math.min(1, f.intensidad ?? 0.5)));
          if (visto.size) p.classList.add('nuevo');
          el('circle', { class: 'hit', r: r + 6 }, p);
          el('circle', { class: 'anillo', r: r + 4 }, p);
          el('circle', { class: 'dato', r, fill: `var(--${t})` }, p);
          p.addEventListener('mousemove', ev => mostrarTip(ev, `<q>${esc(f.cita || f.texto)}</q><span>${esc(f.emocion)} (${NOMBRE_TONO[t]}) · intensidad <span class="num">${(f.intensidad ?? 0).toFixed(2)}</span> · ${esc(g.nombre)}</span>`));
          p.addEventListener('mouseleave', ocultarTip);
          visto.add(f.id);
        }
        p.classList.toggle('reciente', recientes.has(f.id));
        p.classList.toggle('filtrado', !st.tonos.has(t));
        p.style.transform = `translate(${x}px, ${y}px)`;
      });
    }
    svg.querySelectorAll('.grupo').forEach(n => vivos.has(n.dataset.k) || n.remove());
    const ids = new Set(frases.map(f => f.id));
    svg.querySelectorAll('.punto').forEach(p => ids.has(p.dataset.k) || (visto.delete(p.dataset.k), p.remove()));


    // Ranking: themes by people, each with its tone split and raw counts. Rows are buttons that select the theme.
    $('temas').innerHTML = grupos.slice().sort((a, b) => b.personas - a.personas).map(g => {
      const tot = g.frases.length;
      const seg = ['pos', 'neu', 'neg'].filter(t => g.tonos[t]).map(t => `<div style="flex-grow:${g.tonos[t]};background:var(--${t})" data-t="${t}" data-n="${g.tonos[t]}" data-tot="${tot}"></div>`).join('');
      return `<button class="tema opcion" data-id="${esc(g.id)}" aria-pressed="${st.sel === g.id}"><span class="fila"><b>${esc(g.nombre)}</b><span class="num">${plural(g.personas, 'persona', 'personas')}</span></span><span class="barra">${seg}</span><span class="conteo num">${g.tonos.pos} pos · ${g.tonos.neu} neu · ${g.tonos.neg} neg</span></button>`;
    }).join('') || '<p class="vacio">Todavía no hay respuestas.</p>';

    // Detail panel: the selected theme's frases, or the latest ones.
    const det = $('detalle');
    det.classList.toggle('abierto', !!st.sel);
    if (st.sel) {
      const g = porCluster.get(st.sel);
      const lista = g.frases.filter(f => st.tonos.has(tono(f.emocion))).reverse();
      det.innerHTML = `<div class="cabeza"><h2>${esc(g.nombre)}</h2><button id="cerrar" class="au-btn au-btn--contorno">Cerrar</button></div><p class="resumen">${esc(g.resumen)}</p>` +
        (lista.map(f => cita(f)).join('') || '<p class="vacio">Ninguna frase con los tonos elegidos.</p>');
      det.dataset.ultima = '';
    } else {
      const ultimas = frases.slice(-N_ULTIMAS).reverse();
      det.innerHTML = '<h2>Lo último que se dijo</h2>' + (ultimas.map((f, i) => cita(f, porCluster.get(f.cluster_id)?.nombre, i === 0 && f.id !== det.dataset.ultima)).join('') || '<p class="vacio">Todavía no hay frases.</p>');
      det.dataset.ultima = ultimas[0]?.id ?? '';
    }
  }

  // Controls
  $('play').addEventListener('click', () => {
    if (!st.jugando && st.cursor >= st.orden.length) st.cursor = 0;
    st.jugando = !st.jugando; st.envivo = false; render();
  });
  $('cursor').addEventListener('input', e => { st.cursor = +e.target.value; st.jugando = false; st.envivo = st.cursor === st.orden.length; render(); });
  $('vivo').addEventListener('click', () => { st.cursor = st.orden.length; st.jugando = false; st.envivo = true; render(); });
  document.querySelector('.filtro').addEventListener('click', e => {
    const b = e.target.closest('[data-tono]'); if (!b) return;
    st.tonos.has(b.dataset.tono) ? st.tonos.delete(b.dataset.tono) : st.tonos.add(b.dataset.tono); render();
  });
  $('temas').addEventListener('click', e => { const b = e.target.closest('.tema'); if (b) seleccionar(st.datos.clusters.find(c => String(c.id) === b.dataset.id)?.id); });
  $('detalle').addEventListener('click', e => { if (e.target.id === 'cerrar') seleccionar(st.sel); });
  $('temas').addEventListener('mousemove', ev => {
    const s = ev.target.closest('[data-t]');
    if (!s) return ocultarTip();
    mostrarTip(ev, `<b class="num">${s.dataset.n} de ${s.dataset.tot}</b> frases con tono ${NOMBRE_TONO[s.dataset.t]}`);
  });
  $('temas').addEventListener('mouseleave', ocultarTip);
  const teclas = e => {
    if (e.target.closest('input, button')) return;
    if (e.key === ' ') { e.preventDefault(); $('play').click(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { st.cursor = Math.max(0, Math.min(st.orden.length, st.cursor + (e.key === 'ArrowRight' ? 1 : -1))); st.jugando = false; st.envivo = st.cursor === st.orden.length; render(); }
    else if (e.key === 'Escape' && st.sel) seleccionar(st.sel);
  };
  document.addEventListener('keydown', teclas);

  const reloj = setInterval(avanzar, PLAY_MS);
  return { recibir, desmontar() { clearInterval(reloj); document.removeEventListener('keydown', teclas); } };
}
