// Voces: any poll as a 3D blob (Three.js), one axis per tópico or map group and one dot per person, placed as a vector.
// Vanilla on purpose, like flujo-dibujo.js: React owns the card, this file owns canvas + SVG.
// Three.js comes from cdnjs like qrcode in index.html, so it adds nothing to the bundle or the lockfiles.

const EJES = 6;                                          // the 6 tópicos with most people get an axis
const BOLA = 0.7;                                        // blob radius in scene units: people float between 1.3 and 2.1
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

function cargarThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => ok(window.THREE); s.onerror = mal;
    document.head.appendChild(s);
  });
}

// Simplex noise 3D (Ashima Arts / Stefan Gustavson, MIT)
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VERT = NOISE + `
uniform float uTime; uniform vec3 uDirs[6]; uniform float uVals[6]; uniform float uPulse[6]; uniform float uAmp; uniform float uTono[6];
varying vec3 vN; varying float vD; varying vec3 vView; varying float vTono; varying float vPeso;
float disp(vec3 p){
  float d = snoise(p * 1.2 + uTime * 0.08) * uAmp + snoise(p * 2.2 - uTime * 0.1) * uAmp * 0.2;
  for(int i=0;i<6;i++){
    float k = pow(max(dot(p, uDirs[i]), 0.), 5.);
    d += k * (uVals[i] * (0.6 + 0.08 * snoise(p * 2.5 + float(i) + uTime * 0.15)) + uPulse[i] * 0.12);
  }
  return d;
}
vec3 move(vec3 p){ return p * (1. + disp(p)); }
void main(){
  vec3 p = normalize(position);
  vec3 t = normalize(cross(p, abs(p.y) < .99 ? vec3(0,1,0) : vec3(1,0,0)));
  vec3 b = cross(p, t);
  vec3 P = move(p), A = move(normalize(p + t*.01)), B = move(normalize(p + b*.01));
  vN = normalize(normalMatrix * cross(A - P, B - P));
  vD = disp(p);
  // Each lobe takes its axis' net tone (-1 neg … +1 pos); between lobes the surface stays neutral.
  float w = 0., tn = 0.;
  for(int i=0;i<6;i++){ float k = pow(max(dot(p, uDirs[i]), 0.), 4.) * step(0.001, uVals[i]); w += k; tn += k * uTono[i]; }
  vTono = tn / (w + 1e-4); vPeso = clamp(w * 1.6, 0., 1.);
  vec4 mv = modelViewMatrix * vec4(P, 1.);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

// Tone tokens from comun.css (read at mount). A lobe is --pos or --neg by its axis' net tone and --neu when mixed, like the dots' legend.
const FRAG = `
varying vec3 vN; varying float vD; varying vec3 vView; varying float vTono; varying float vPeso;
uniform vec3 neg; uniform vec3 pos; uniform vec3 neu; uniform vec3 base; uniform vec3 luz;
void main(){
  float fres = pow(1. - max(dot(vN, vView), 0.), 2.);
  float diff = max(dot(vN, normalize(vec3(-.4,.6,.7))), 0.);
  vec3 tono = vTono >= 0. ? mix(neu, pos, smoothstep(0., .6, vTono)) : mix(neu, neg, smoothstep(0., .6, -vTono));
  vec3 col = mix(base, tono, vPeso);
  col = mix(col, luz, fres * 0.25);
  col *= 0.65 + 0.45 * diff;
  gl_FragColor = vec4(mix(col, luz, pow(diff, 24.) * 0.6), 1.);
}`;

// The 6 axes alternate toward and away from the viewer (an octahedron seen down its diagonal): on screen they read as
// a hexagon, axis 0 up, but each is a real 3D direction shared by the blob's bulges and the people's positions.
const DIRS = [...Array(EJES)].map((_, i) => {
  const a = Math.PI / 2 + i * Math.PI / 3, z = i % 2 ? -0.7 : 0.7, n = Math.hypot(1, z);
  return [Math.cos(a) / n, Math.sin(a) / n, z / n];
});
const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };

// recibir(v) takes the shape from voces-datos.js; resaltar(lectura) dims everything but the people in the lectura.
// One dot per person, placed as a vector: the sum of the directions of the axes they talk about, weighted by intensity.
// Someone who only talks about one tópico sits off that axis; someone who talks about two sits between them; the
// stronger and the more they say, the farther from the blob. Drag to turn it.
export function montar({ escenario, svg, onSelect = () => {}, zona = null }) {
  let THREE, renderer, camera, scene, blob, uniforms, clock;
  let W, H, cx, cy, U, ancho, izquierda, derecha;                  // U = px per scene unit at depth 0 (blob radius = 1 unit)
  const ejeDe = new Map();                               // eje id → axis index, stable while it stays in the top 6
  const datoDe = Array(EJES).fill(null);                 // axis → eje
  const personas = new Map();                            // persona id → { g, pos:[x,y,z], nacio, celdas:[{eje, celda}], claves:Set }
  const objetivo = Array(EJES).fill(0), tonoDe = Array(EJES).fill(0), pulsoEn = Array(EJES).fill(-99);
  let ampObjetivo = 0.03, primera = true, seleccion = null, foco = null;
  let giroX = 0, giroY = 0, arrastre = null;
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ahora = () => clock ? clock.getElapsedTime() : performance.now() / 1000;

  const ejes = [], nombres = [], cuentas = [];
  for (let i = 0; i < EJES; i++) {
    ejes.push(svg.appendChild(el('line', { class: 'eje' })));
    nombres.push(svg.appendChild(el('text', { class: 'nombre' })));
    cuentas.push(svg.appendChild(el('text', { class: 'cuenta num' })));
  }
  const capaPuntos = svg.appendChild(el('g'));

  // The scene is centered in zona() (a screen rect); by default the free area between the header and the card.
  function zonaVoces() {
    const cab = document.querySelector('header')?.getBoundingClientRect(), tar = document.getElementById('tarjeta')?.getBoundingClientRect();
    return { left: 0, top: (cab?.bottom ?? 0) + 8, bottom: ancho || !tar ? H - 8 : tar.top - 8, right: ancho && tar ? tar.left - 8 : W };
  }
  function medir() {
    W = innerWidth; H = innerHeight;
    ancho = W >= 1000;                                   // wide: card on the right; narrow: card at the bottom
    const z = (zona ?? zonaVoces)();
    izquierda = z.left; derecha = z.right;
    const alto = Math.max(160, z.bottom - z.top);
    cx = (izquierda + derecha) / 2; cy = (z.top + z.bottom) / 2;
    // Labels sit at 2.45 units; leave ~40 px for a label above/below and ~150 px beside (less on phones).
    U = Math.max(30, Math.min((alto / 2 - 44) / 2.45, ((derecha - izquierda) / 2 - (ancho ? 150 : 60)) / (0.87 * 2.45)));
    U *= z.zoom ?? 1;                                    // a zona without labels (the pitch cover) can ask for a bigger blob
    if (!renderer) return;
    // setSize reallocates the WebGL buffer even at the same size, and recibir calls medir on every new answer.
    const t = renderer.getSize(new THREE.Vector2());
    if (t.x !== W || t.y !== H) { renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); }
    camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
    blob.scale.setScalar(BOLA * 3.784 * U / H);          // 1 unit = H / 3.784 px at depth 0 (fov 35, camera z 6)
  }
  addEventListener('resize', medir); medir();

  // Same rotation as the blob (Euler XYZ: y first, then x) and the same perspective as the camera, by hand.
  function proyectar([x, y, z]) {
    const cY = Math.cos(giroY), sY = Math.sin(giroY), cX = Math.cos(giroX), sX = Math.sin(giroX);
    const x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
    const y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
    const k = 3.784 * U / H, f = 6 / (6 - z2 * k);       // world depth = z2 * k; camera at z = 6
    return [cx + x1 * U * f, cy - y2 * U * f, z2, f];
  }

  escenario.style.touchAction = 'none';
  escenario.addEventListener('pointerdown', e => { arrastre = [e.clientX, e.clientY, giroX, giroY]; escenario.setPointerCapture(e.pointerId); });
  escenario.addEventListener('pointermove', e => {
    if (!arrastre) return;
    giroY = arrastre[3] + (e.clientX - arrastre[0]) * 0.008;
    giroX = Math.max(-1.2, Math.min(1.2, arrastre[2] + (e.clientY - arrastre[1]) * 0.008));
  });
  escenario.addEventListener('pointerup', () => { arrastre = null; });

  function seleccionar(k) {
    seleccion = k;
    for (const [kk, p] of personas) p.g.classList.toggle('sel', kk === k);
    const p = personas.get(k);
    onSelect(p ? { celdas: p.celdas } : null);
  }

  function nuevoPunto(k) {
    const g = capaPuntos.appendChild(el('g', { class: 'punto', tabindex: 0, role: 'button' }));
    g.appendChild(el('circle', { class: 'toque', r: 12 }));   // bigger invisible hit area for fingers
    g.appendChild(el('circle', { class: 'bola' }));
    g.addEventListener('click', () => seleccionar(k));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); seleccionar(k); } });
    return g;
  }

  function recibir(v) {
    const tops = v?.ejes?.slice(0, EJES) ?? [];
    const ids = new Set(tops.map(e => e.id));
    for (const [id, i] of ejeDe) if (!ids.has(id)) { ejeDe.delete(id); datoDe[i] = null; }
    for (const e of tops) {
      if (!ejeDe.has(e.id)) ejeDe.set(e.id, datoDe.indexOf(null));   // first free axis
      datoDe[ejeDe.get(e.id)] = e;
    }
    // Stretch the range so the most mentioned axis clearly wins: min → 0.2, max → 1 (counts are always written next to each name).
    const ns = tops.map(e => e.personas), max = Math.max(1, ...ns), min = Math.min(max, ...ns);
    const porPersona = new Map();
    for (const e of tops) {
      const i = ejeDe.get(e.id), antes = objetivo[i];
      objetivo[i] = max === min ? 1 : 0.2 + 0.8 * (e.personas - min) / (max - min);
      tonoDe[i] = e.personas ? (e.pos - e.neg) / e.personas : 0;
      if (!primera && objetivo[i] > antes && pulsoEn[i] < ahora() - 0.1) pulsoEn[i] = ahora();
      for (const c of e.celdas) {
        if (!porPersona.has(c.id)) porPersona.set(c.id, []);
        porPersona.get(c.id).push({ eje: e, i, celda: c });
      }
    }
    for (let i = 0; i < EJES; i++) if (!datoDe[i]) objetivo[i] = 0;

    let nuevo = null;
    for (const [id, cs] of porPersona) {
      // The vector: sum of axis directions weighted by intensity. Its direction says what they talk about, its length how much.
      const s = [0, 0, 0];
      for (const { i, celda } of cs) for (let d = 0; d < 3; d++) s[d] += DIRS[i][d] * celda.fuerza;
      const largo = Math.hypot(...s) || 1, h1 = hash(id), h2 = hash(id + '·');
      // A little deterministic scatter so people who said the same thing don't land on one pixel.
      const dir = s.map((x, d) => x / largo + (d === 0 ? h1 - 0.5 : d === 1 ? h2 - 0.5 : (h1 + h2) / 2 - 0.5) * 0.35);
      const n = Math.hypot(...dir), r = 1.3 + 0.7 * Math.min(1, largo / 1.6) + (h2 - 0.5) * 0.15;
      let p = personas.get(id);
      if (!p) {
        p = { g: nuevoPunto(id), nacio: ahora() + (primera ? personas.size * 0.03 : 0) };
        personas.set(id, p);
        if (!primera) nuevo = id;
      }
      // Color = their balance: each stance weighted by intensity (cameras yes, but furious about the dark = negative).
      const saldo = cs.reduce((a, { celda: c }) => a + (c.tono === 'pos' ? 1 : c.tono === 'neg' ? -1 : 0) * c.fuerza, 0);
      const tono = saldo > 0.2 ? 'pos' : saldo < -0.2 ? 'neg' : 'neu';
      Object.assign(p, { pos: dir.map(x => x / n * r), celdas: cs.map(({ eje, celda }) => ({ eje, celda })), claves: new Set(cs.map(c => `${c.eje.id}|${id}`)) });
      const bola = p.g.lastChild;
      p.radio = 3 + Math.max(...cs.map(c => c.celda.fuerza)) * 2.5 + Math.min(cs.length - 1, 3);
      bola.setAttribute('fill', `var(--${tono})`);
      p.g.setAttribute('aria-label', `${cs.map(c => `${c.eje.nombre}, ${c.celda.postura}`).join('; ')}: ${cs[0].celda.citas[0] ?? ''}`);
    }
    for (const [k, p] of personas) if (!porPersona.has(k)) { p.g.remove(); personas.delete(k); }
    requestAnimationFrame(medir);                        // header and card may have changed size with the data
    ampObjetivo = 0.03 + Math.min((v?.casos ?? 0) / 40, 1) * 0.07;    // more answers = livelier surface
    if (nuevo) seleccionar(nuevo);                                     // the newest person shows in the card
    else if (seleccion && !personas.has(seleccion)) seleccionar(null);
    aplicarFoco();
    if (v) primera = false;
  }

  function aplicarFoco() {
    const lit = foco?.claves ? new Set(foco.claves) : null;
    for (const p of personas.values()) p.g.classList.toggle('dim', !!lit && ![...p.claves].some(k => lit.has(k)));
  }
  function resaltar(lectura) { foco = lectura; aplicarFoco(); }

  let orden = 0;
  function cuadro() {
    const t = ahora(), lento = t * (reducir ? 0.2 : 1);
    if (!arrastre && !reducir) giroY += Math.sin(lento * 0.25) * 0.0015;   // a slow sway so depth reads without touching
    if (uniforms) {
      uniforms.uTime.value = lento;
      const u = uniforms.uVals.value;
      for (let i = 0; i < EJES; i++) {
        u[i] += (objetivo[i] - u[i]) * 0.04;
        uniforms.uTono.value[i] += (tonoDe[i] - uniforms.uTono.value[i]) * 0.04;
        const edad = t - pulsoEn[i];
        uniforms.uPulse.value[i] = reducir ? 0 : Math.exp(-edad * 3) * Math.sin(edad * 14);
      }
      uniforms.uAmp.value += (ampObjetivo - uniforms.uAmp.value) * 0.02;
      blob.rotation.set(giroX, giroY, 0);
    }
    const ejesFoco = new Set(foco?.ejes ?? []);
    for (let i = 0; i < EJES; i++) {
      const e = datoDe[i];
      [ejes[i], nombres[i], cuentas[i]].forEach(n => n.setAttribute('visibility', e ? 'visible' : 'hidden'));
      if (!e) continue;
      const [x1, y1, z1] = proyectar(DIRS[i].map(d => d * BOLA * 1.1)), [x2, y2] = proyectar(DIRS[i].map(d => d * 2.15));
      const [x, y0, z] = proyectar(DIRS[i].map(d => d * 2.45));
      ejes[i].setAttribute('x1', x1); ejes[i].setAttribute('y1', y1); ejes[i].setAttribute('x2', x2); ejes[i].setAttribute('y2', y2);
      ejes[i].style.opacity = z1 < 0 ? 0.35 : 1;
      const dx = x - cx, dy = y0 - cy, y = y0 + (dy < -U * 0.8 ? -14 : dy > U * 0.8 ? 12 : -4);
      const ancla = dx > U * 0.3 ? 'start' : dx < -U * 0.3 ? 'end' : 'middle';
      // Cut the name to the room it has before the card or the screen edge (~7 px per character at 15 px Outfit).
      const sitio = ancla === 'start' ? derecha - x - 8 : ancla === 'end' ? x - izquierda - 8 : Math.min(x - izquierda, derecha - x) * 2 - 16;
      const caben = Math.max(6, Math.floor(sitio / 7.4) - String(e.personas).length - 3);
      const nombre = e.nombre.length > caben ? e.nombre.slice(0, caben - 1) + '…' : e.nombre;
      nombres[i].setAttribute('x', x); nombres[i].setAttribute('y', y); nombres[i].setAttribute('text-anchor', ancla);
      nombres[i].textContent = `${nombre} · ${e.personas}`;
      nombres[i].classList.toggle('on', t - pulsoEn[i] < 1.5 || ejesFoco.has(e.id));
      nombres[i].classList.toggle('dim', !!foco && !ejesFoco.has(e.id) && foco.ejes.length > 0);
      nombres[i].style.opacity = z < -0.8 ? 0.6 : '';
      cuentas[i].setAttribute('x', x); cuentas[i].setAttribute('y', y + 17); cuentas[i].setAttribute('text-anchor', ancla);
      cuentas[i].textContent = W < 700 ? '' : `${e.pos} pos · ${e.neu} neu · ${e.neg} neg`;
    }
    const lista = [];
    for (const p of personas.values()) {                 // people fly out of the blob to their vector
      const k = reducir ? 1 : Math.max(0, Math.min(1, (t - p.nacio) / 0.9)), q = 1 - Math.pow(1 - k, 3);
      const [x, y, z, f] = proyectar(p.pos.map(c => c * q));
      const tapado = z < 0 && Math.hypot(x - cx, y - cy) < U * BOLA * 1.1;  // behind the blob
      p.g.setAttribute('transform', `translate(${x},${y})`);
      p.g.lastChild.setAttribute('r', p.radio * f);
      // Depth fades the far ones; a reading or a chat answer dims everyone outside it (inline opacity would override .dim).
      const base = k > 0 ? (tapado ? 0.12 : 0.55 + 0.45 * Math.min(1, Math.max(0, (z + 1.8) / 2.4))) : 0;
      p.g.style.opacity = p.g.classList.contains('dim') ? base * 0.15 : base;
      lista.push([z, p.g]);
    }
    if (++orden % 15 === 0) {                            // paint far dots first so near ones stay on top
      lista.sort((a, b) => a[0] - b[0]);
      for (const [, g] of lista) if (capaPuntos.lastChild !== g) capaPuntos.appendChild(g);
    }
    if (renderer) renderer.render(scene, camera);
    requestAnimationFrame(cuadro);
  }

  // Tone tokens from the page (comun.css); call again after a theme change.
  function pintar() {
    if (!uniforms) return;
    const css = getComputedStyle(document.documentElement);
    for (const [u, v] of [['neg', '--neg'], ['pos', '--pos'], ['neu', '--neu'], ['base', '--linea-fuerte'], ['luz', '--tinta']]) uniforms[u].value.set(css.getPropertyValue(v).trim());
  }

  cargarThree().then(T => {
    THREE = T; clock = new THREE.Clock();
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    escenario.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 6;
    const dirs = DIRS.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    uniforms = { uTime: { value: 0 }, uDirs: { value: dirs }, uVals: { value: Array(EJES).fill(0) }, uPulse: { value: Array(EJES).fill(0) }, uAmp: { value: 0.03 }, uTono: { value: Array(EJES).fill(0) } };
    Object.assign(uniforms, { neg: { value: new THREE.Color() }, pos: { value: new THREE.Color() }, neu: { value: new THREE.Color() }, base: { value: new THREE.Color() }, luz: { value: new THREE.Color() } });
    pintar();
    blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 64), new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG }));
    scene.add(blob);
    const antes = performance.now() / 1000;            // switch dot clocks to the Three clock
    for (const p of personas.values()) p.nacio -= antes;
    pulsoEn.fill(-99);
    medir();
  }).catch(() => {});                                    // without Three.js the axes and dots still work
  requestAnimationFrame(cuadro);

  return { recibir, resaltar, medir, pintar, seleccionar: k => seleccionar(personas.has(k) ? k : null), deseleccionar: () => seleccionar(null) };
}
