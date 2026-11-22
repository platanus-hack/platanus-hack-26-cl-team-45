// Imperative SVG drawing for the Flujo view (respuestas → frases → conceptos → temas). Mounted by Flujo.jsx.
import { esc, tono, plural } from './comun.js';

export function montar() {
  const W = 1600, H = 1000, TOP = 90, BOT = 20, MAX_CONC = 18;
  const X = { r: 0, rf: 350, f: 640, c: 960, t: 1300 }; // column anchors
  const $ = id => document.getElementById(id), svg = $('flujo'), tip = $('tip');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  let ultimo = '', primera = true;

  // null = no poll with this slug.
  function recibir(d) {
    if (!d) { $('pregunta').textContent = 'No existe esta encuesta'; return; }
    const s = JSON.stringify(d);
    if (s !== ultimo) { ultimo = s; render(d); }
  }

  // Evenly spread n items over the drawable height.
  const repartir = n => i => TOP + (H - TOP - BOT) * (i + 0.5) / Math.max(n, 1);
  const curva = (x1, y1, x2, y2) => { const m = (x1 + x2) / 2; return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`; };
  const media = xs => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const corta = (t, n) => t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
  function lineas(t, max) {
    const out = [''];
    for (const w of t.split(' ')) (out.at(-1) + ' ' + w).trim().length > max && out.at(-1) ? out.push(w) : out[out.length - 1] = (out.at(-1) + ' ' + w).trim();
    return out;
  }

  function render(d) {
    $('pregunta').textContent = d.pregunta || 'Audem';
    const frases = d.frases, total = d.total_participantes || 0;

    // Temas ordered like the report: most people first.
    const temas = d.clusters.map(c => {
      const fs = frases.filter(f => f.cluster_id === c.id);
      return { ...c, fs, personas: new Set(fs.map(f => f.respuesta_id)).size };
    }).filter(t => t.fs.length).sort((a, b) => b.personas - a.personas);
    const iTema = new Map(temas.map((t, i) => [t.id, i]));

    // Conceptos: keep the most frequent; a frase with none left links straight to its tema.
    const cuenta = new Map();
    frases.forEach(f => (f.conceptos || []).forEach(c => cuenta.set(c, (cuenta.get(c) || 0) + 1)));
    const guardados = new Set([...cuenta].sort((a, b) => b[1] - a[1]).slice(0, MAX_CONC).map(x => x[0]));
    const conc = f => (f.conceptos || []).filter(c => guardados.has(c));
    // Barycenter ordering keeps ribbons from crossing: conceptos sit near their temas, frases near their conceptos.
    const conceptos = [...guardados].map(c => {
      const fs = frases.filter(f => conc(f).includes(c));
      return { id: c, fs, k: media(fs.map(f => iTema.get(f.cluster_id))) };
    }).sort((a, b) => a.k - b.k);
    const iConc = new Map(conceptos.map((c, i) => [c.id, i]));
    const fOrden = frases.filter(f => iTema.has(f.cluster_id)).sort((a, b) =>
      iTema.get(a.cluster_id) - iTema.get(b.cluster_id) || media(conc(a).map(c => iConc.get(c))) - media(conc(b).map(c => iConc.get(c))));
    const yF = new Map(fOrden.map((f, i) => [f.id, repartir(fOrden.length)(i)]));

    const textos = new Map((d.respuestas || []).map(r => [r.id, r.texto]));
    const ids = [...new Set([...textos.keys(), ...frases.map(f => f.respuesta_id)])];
    const resp = ids.map(id => {
      const fs = fOrden.filter(f => f.respuesta_id === id);
      const texto = textos.get(id) || '', at = fs.length ? texto.indexOf(fs[0].cita) : -1;
      // Snippet starts at the first quoted frase so the row doesn't read "Hola, yo…".
      return { id, texto, inicio: at > 0 ? '…' + texto.slice(at) : texto, fs, k: fs.length ? media(fs.map(f => yF.get(f.id))) : Infinity };
    }).sort((a, b) => a.k - b.k);
    const conTexto = resp.length <= 32; // shortcut: past 32 rows the snippets overlap, so only dots show

    // Each mark carries the frase ids it represents; hover highlights everything sharing one.
    // data-tip holds HTML, so text is escaped twice: once for the tooltip, once for the attribute.
    const fids = fs => fs.map(f => f.id).join(' ');
    let s = '';
    const etapa = (x, n, nombre, anchor = 'start') => `<text class="etapa" x="${x}" y="40" text-anchor="${anchor}"><tspan>${n}</tspan> ${nombre}</text>`;
    s += etapa(X.r, resp.length, 'respuestas') + etapa(X.f, fOrden.length, 'frases', 'middle') + etapa(X.c, conceptos.length, 'conceptos', 'middle') + etapa(X.t, temas.length, 'temas');

    // Column 1: respuestas (the paragraph each person sent).
    const yR = repartir(resp.length);
    let c1 = '', l1 = '';
    resp.forEach((r, i) => {
      const y = yR(i);
      c1 += `<g class="n resp${r.fs.length ? '' : ' sin'}" data-f="${fids(r.fs)}" data-tip="${esc(esc(corta(r.texto, 280) || 'Respuesta ' + r.id))}">
        ${conTexto ? `<text x="${X.r}" y="${y}" dominant-baseline="central">${esc(r.fs.length ? corta(r.inicio || 'Respuesta ' + r.id, 34) : 'procesando…')}</text>` : ''}
        <circle cx="${X.rf}" cy="${y}" r="4"/></g>`;
      r.fs.forEach(f => l1 += `<path class="l rf" data-f="${f.id}" d="${curva(X.rf, y, X.f, yF.get(f.id))}"/>`);
    });

    // Column 3 geometry first so frase ribbons know where to land.
    const yC = repartir(conceptos.length);
    conceptos.forEach((c, i) => {
      c.y = yC(i); c.fs_ = 16 + Math.min(8, 2 * (c.fs.length - 1));
      c.w = c.id.length * c.fs_ * 0.56 + 28;
    });
    const cById = new Map(conceptos.map(c => [c.id, c]));

    // Column 4 geometry.
    const yT = repartir(temas.length), rMax = Math.min(64, (H - TOP - BOT) / temas.length / 2 - 6);
    const maxP = Math.max(...temas.map(t => t.personas), 1);
    temas.forEach((t, i) => { t.y = yT(i); t.r = rMax * Math.sqrt(t.personas / maxP); t.cx = X.t + rMax; });
    const tById = new Map(temas.map(t => [t.id, t]));

    // Column 2: frases, with ribbons to their conceptos (or straight to the tema).
    let c2 = '', l2 = '';
    fOrden.forEach(f => {
      const y = yF.get(f.id), tn = tono(f.emocion), cs = conc(f);
      c2 += `<g class="n frase" data-f="${f.id}" data-tip="${esc(`<q>${esc(f.texto)}</q><span>«${esc(f.cita)}» · ${esc(f.emocion)} · ${esc(tById.get(f.cluster_id).nombre)}</span>`)}">
        <circle cx="${X.f}" cy="${y}" r="${4 + 6 * (f.intensidad || 0)}" fill="var(--${tn})"/></g>`;
      const w = 1.2 + 2.5 * (f.intensidad || 0);
      if (cs.length) cs.forEach(c => { const k = cById.get(c); l2 += `<path class="l fc" data-f="${f.id}" stroke="var(--${tn})" stroke-width="${w}" d="${curva(X.f, y, X.c - k.w / 2, k.y)}"/>`; });
      else { const t = tById.get(f.cluster_id); l2 += `<path class="l fc" data-f="${f.id}" stroke="var(--${tn})" stroke-width="${w}" d="${curva(X.f, y, t.cx - t.r, t.y)}"/>`; }
    });

    // Column 3: conceptos, with one ribbon per tema whose width is the number of shared frases.
    let c3 = '', l3 = '';
    conceptos.forEach(c => {
      c3 += `<g class="n conc" data-f="${fids(c.fs)}" data-tip="${esc(esc(c.id))}: ${plural(c.fs.length, 'frase', 'frases')}">
        <rect x="${X.c - c.w / 2}" y="${c.y - c.fs_ * 0.85}" width="${c.w}" height="${c.fs_ * 1.7}" rx="${c.fs_ * 0.85}"/>
        <text x="${X.c}" y="${c.y}" style="font-size:${c.fs_}px">${esc(c.id)}</text></g>`;
      temas.forEach(t => {
        const fs = c.fs.filter(f => f.cluster_id === t.id);
        if (fs.length) l3 += `<path class="l ct" data-f="${fids(fs)}" stroke-width="${2 + 4 * fs.length}" d="${curva(X.c + c.w / 2, c.y, t.cx - t.r, t.y)}"/>`;
      });
    });

    // Column 4: temas as stacked rings (one per person), % of all people inside.
    let c4 = '';
    temas.forEach(t => {
      const pct = total ? Math.round(100 * t.personas / total) : 0;
      let anillos = '';
      for (let k = t.personas; k >= 1; k--) anillos += `<circle class="anillo" cx="${t.cx}" cy="${t.y}" r="${t.r * Math.sqrt(k / t.personas)}"/>`;
      const nom = lineas(t.nombre, 24).slice(0, 2);
      c4 += `<g class="n tema" data-f="${fids(t.fs)}" data-tip="${esc(`<q>${esc(t.nombre)}</q><span>${esc(t.resumen || '')}</span>`)}">
        ${anillos}<circle class="borde" cx="${t.cx}" cy="${t.y}" r="${t.r}"/>
        <text class="pct" x="${t.cx}" y="${t.y}" style="font-size:${Math.max(18, t.r * 0.55)}px">${pct}%</text>
        ${nom.map((l, j) => `<text class="nombre" x="${X.t + 2 * rMax + 20}" y="${t.y - 12 * nom.length + 22 * j + 4}">${esc(l)}</text>`).join('')}
        <text class="sub" x="${X.t + 2 * rMax + 20}" y="${t.y + 12 * nom.length + 10}">${plural(t.personas, 'persona', 'personas')} · ${plural(t.fs.length, 'frase', 'frases')}</text></g>`;
    });

    const cls = primera ? ' oculta' : '';
    svg.innerHTML = s + [l1 + c1, l2 + c2, l3 + c3, c4].map(g => `<g class="col${cls}">${g}</g>`).join('');
    if (primera) { // reveal left to right once
      primera = false;
      svg.querySelectorAll('.col').forEach((g, i) => setTimeout(() => g.classList.remove('oculta'), 80 + 220 * i));
    }
    $('metodo').textContent = `Casos: ${plural(total, 'persona', 'personas')} · frases, emoción, conceptos y temas por LLM · % sobre el total de personas`;
  }

  // Hover: highlight every mark sharing a frase with the hovered one.
  svg.addEventListener('pointerover', e => {
    const g = e.target.closest('g.n'); if (!g) return;
    const h = new Set(g.dataset.f.split(' ').filter(Boolean));
    svg.classList.add('foco');
    svg.querySelectorAll('[data-f]').forEach(el => el.classList.toggle('vecino', el.dataset.f.split(' ').some(f => h.has(f))));
    tip.innerHTML = g.dataset.tip; tip.style.opacity = 1;
  });
  svg.addEventListener('pointermove', e => { tip.style.left = Math.min(e.clientX + 14, innerWidth - 340) + 'px'; tip.style.top = e.clientY + 14 + 'px'; });
  svg.addEventListener('pointerout', e => { if (!e.relatedTarget?.closest?.('g.n')) { svg.classList.remove('foco'); tip.style.opacity = 0; } });

  return { recibir };
}
