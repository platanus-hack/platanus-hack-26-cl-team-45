// Voces: any poll as a 3D blob (Three.js), one axis per tópico or map group and one dot per person.
// Vanilla on purpose, like flujo-dibujo.js: React owns the card, this file owns canvas + SVG.
// Three.js comes from cdnjs like qrcode in index.html, so it adds nothing to the bundle or the lockfiles.

const EJES = 6;                                          // the 6 tópicos with most people get an axis
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

// recibir(v) takes the shape from voces-datos.js; resaltar(lectura) dims everything but the lectura's dots and draws its threads.
export function montar({ escenario, svg, onSelect }) {
  let THREE, renderer, camera, scene, blob, uniforms, clock;
  let W, H, cx, cy, R;
  const ejeDe = new Map();                               // eje id → axis index, stable while it stays in the top 6
  const datoDe = Array(EJES).fill(null);                 // axis → eje
  const puntos = new Map();                              // clave → { g, eje, j, n, nacio, celda }
  const objetivo = Array(EJES).fill(0), tonoDe = Array(EJES).fill(0), pulsoEn = Array(EJES).fill(-99);
  let ampObjetivo = 0.03, primera = true, seleccion = null, foco = null, hilos = [];
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ahora = () => clock ? clock.getElapsedTime() : performance.now() / 1000;

  const anillo = svg.appendChild(el('circle', { class: 'anillo' }));
  const ejes = [], nodos = [], nombres = [], cuentas = [];
  for (let i = 0; i < EJES; i++) {
    ejes.push(svg.appendChild(el('line', { class: 'eje' })));
    nodos.push(svg.appendChild(el('circle', { r: 6, class: 'nodo' })));
    nombres.push(svg.appendChild(el('text', { class: 'nombre' })));
    cuentas.push(svg.appendChild(el('text', { class: 'cuenta num' })));
  }
  const capaHilos = svg.appendChild(el('g'));
  const capaPuntos = svg.appendChild(el('g'));
  const angulo = i => -(Math.PI / 2 + i * Math.PI / 3);  // screen angle, y down; axis 0 points up

  // The blob is centered in the free area between the header and the card, whatever their size.
  function medir() {
    W = innerWidth; H = innerHeight;
    const cab = document.querySelector('header')?.getBoundingClientRect(), tar = document.getElementById('tarjeta')?.getBoundingClientRect();
    const ancho = W >= 1000;                             // wide: card on the right; narrow: card at the bottom
    const arriba = (cab?.bottom ?? 0) + 8, abajo = ancho || !tar ? H : tar.top - 8, derecha = ancho && tar ? tar.left : W;
    const alto = Math.max(160, abajo - arriba);
    cx = derecha / 2; cy = arriba + alto / 2;
    R = Math.min(derecha * 0.2, alto / 2 - 52);
    anillo.setAttribute('cx', cx); anillo.setAttribute('cy', cy); anillo.setAttribute('r', R * 0.45);
    if (!renderer) return;
    renderer.setSize(W, H);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
    blob.scale.setScalar(1.63 * R / H);                  // blob radius ≈ inner ring (1 unit = H / 3.784 px at fov 35, z 6)
  }
  addEventListener('resize', medir); medir();

  function lugar(p) {                                    // arc of dots at the end of the axis, 7 per row
    const fila = Math.floor(p.j / 7), enFila = Math.min(7, p.n - fila * 7), col = p.j % 7;
    const a = angulo(p.eje) + (col - (enFila - 1) / 2) * 0.13, r = R * (1.04 + fila * 0.1);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }

  function seleccionar(k) {
    seleccion = k;
    for (const [kk, p] of puntos) p.g.classList.toggle('sel', kk === k);
    const p = puntos.get(k);
    onSelect(p ? { eje: datoDe[p.eje], celda: p.celda } : null);
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
    const vivos = new Set();
    let nuevo = null;
    for (const e of tops) {
      const i = ejeDe.get(e.id), antes = objetivo[i];
      objetivo[i] = max === min ? 1 : 0.2 + 0.8 * (e.personas - min) / (max - min);
      tonoDe[i] = e.personas ? (e.pos - e.neg) / e.personas : 0;
      e.celdas.forEach((c, j) => {
        const k = `${e.id}|${c.id}`;
        vivos.add(k);
        let p = puntos.get(k);
        if (!p) {
          p = { g: nuevoPunto(k), nacio: ahora() + (primera ? j * 0.06 : 0) };
          puntos.set(k, p);
          if (!primera) { pulsoEn[i] = ahora(); nuevo = k; }
        }
        Object.assign(p, { eje: i, j, n: e.celdas.length, celda: c });
        const bola = p.g.lastChild;
        bola.setAttribute('r', 3.5 + c.fuerza * 3);
        bola.setAttribute('fill', `var(--${c.tono})`);
        p.g.setAttribute('aria-label', `${e.nombre}, ${c.postura}: ${c.citas[0] ?? ''}`);
      });
      if (!primera && objetivo[i] > antes && pulsoEn[i] < ahora() - 0.1) pulsoEn[i] = ahora();
    }
    for (let i = 0; i < EJES; i++) if (!datoDe[i]) objetivo[i] = 0;
    for (const [k, p] of puntos) if (!vivos.has(k)) { p.g.remove(); puntos.delete(k); }
    requestAnimationFrame(medir);                        // header and card may have changed size with the data
    ampObjetivo = 0.03 + Math.min((v?.casos ?? 0) / 40, 1) * 0.07;    // more answers = livelier surface
    if (nuevo) seleccionar(nuevo);                                     // the newest person shows in the card
    else if (seleccion && !puntos.has(seleccion)) seleccionar(null);
    aplicarFoco();
    if (v) primera = false;
  }

  function aplicarFoco() {
    const lit = foco?.claves ? new Set(foco.claves) : null;
    for (const [k, p] of puntos) p.g.classList.toggle('dim', !!lit && !lit.has(k));
    capaHilos.replaceChildren();
    hilos = (foco?.hilos ?? []).filter(([a, b]) => puntos.has(a) && puntos.has(b)).map(([a, b], n) => {
      const path = capaHilos.appendChild(el('path', { class: 'hilo', pathLength: 1 }));
      path.style.animationDelay = `${n * 0.2}s`;
      return [a, b, path];
    });
  }
  function resaltar(lectura) { foco = lectura; aplicarFoco(); }

  function cuadro() {
    const t = ahora(), lento = t * (reducir ? 0.2 : 1);
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
      blob.rotation.y = Math.sin(lento * 0.08) * 0.1;
    }
    const u = uniforms ? uniforms.uVals.value : objetivo, angosto = W < 700, ejesFoco = new Set(foco?.ejes ?? []);
    for (let i = 0; i < EJES; i++) {
      const e = datoDe[i], a = angulo(i), c = Math.cos(a), s = Math.sin(a), r = R * (0.45 + 0.55 * u[i]);
      [ejes[i], nodos[i], nombres[i], cuentas[i]].forEach(n => n.setAttribute('visibility', e ? 'visible' : 'hidden'));
      nodos[i].setAttribute('cx', cx + c * r); nodos[i].setAttribute('cy', cy + s * r);
      ejes[i].setAttribute('x1', cx + c * R * 0.45); ejes[i].setAttribute('y1', cy + s * R * 0.45);
      ejes[i].setAttribute('x2', cx + c * R); ejes[i].setAttribute('y2', cy + s * R);
      if (!e) continue;
      const filas = Math.ceil(e.celdas.length / 7), lr = R * (1.04 + (filas - 1) * 0.1) + 22;
      const x = cx + c * lr, y = cy + s * lr + (s < -0.5 ? -20 : s > 0.5 ? 14 : -4);
      const ancla = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
      // Cut the name to the room it has on screen (~7 px per character at 13 px Poppins).
      const sitio = ancla === 'start' ? W - x - 8 : ancla === 'end' ? x - 8 : Math.min(x, W - x) * 2 - 16;
      const caben = Math.max(6, Math.floor(sitio / 7.2) - String(e.personas).length - 3);
      const nombre = e.nombre.length > caben ? e.nombre.slice(0, caben - 1) + '…' : e.nombre;
      nombres[i].setAttribute('x', x); nombres[i].setAttribute('y', y); nombres[i].setAttribute('text-anchor', ancla);
      nombres[i].textContent = `${nombre} · ${e.personas}`;
      nombres[i].classList.toggle('on', t - pulsoEn[i] < 1.5 || ejesFoco.has(e.id));
      nombres[i].classList.toggle('dim', !!foco && !ejesFoco.has(e.id) && foco.ejes.length > 0);
      cuentas[i].setAttribute('x', x); cuentas[i].setAttribute('y', y + 17); cuentas[i].setAttribute('text-anchor', ancla);
      cuentas[i].textContent = angosto ? '' : `${e.pos} pos · ${e.neu} neu · ${e.neg} neg`;
    }
    for (const p of puntos.values()) {                   // dots fly out of the blob to their place
      const k = reducir ? 1 : Math.max(0, Math.min(1, (t - p.nacio) / 0.9)), q = 1 - Math.pow(1 - k, 3), [tx, ty] = lugar(p);
      p.g.setAttribute('transform', `translate(${cx + (tx - cx) * q},${cy + (ty - cy) * q})`);
      p.g.style.opacity = k > 0 ? '' : 0;
    }
    for (const [a, b, path] of hilos) {                  // curves between two dots, pulled toward the center
      const [ax, ay] = lugar(puntos.get(a)), [bx, by] = lugar(puntos.get(b));
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      path.setAttribute('d', `M${ax},${ay} Q${mx + (cx - mx) * 0.7},${my + (cy - my) * 0.7} ${bx},${by}`);
    }
    if (renderer) renderer.render(scene, camera);
    requestAnimationFrame(cuadro);
  }

  cargarThree().then(T => {
    THREE = T; clock = new THREE.Clock();
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    escenario.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 6;
    const dirs = [...Array(EJES)].map((_, i) => { const a = Math.PI / 2 + i * Math.PI / 3; return new THREE.Vector3(Math.cos(a), Math.sin(a), 0.35).normalize(); });
    uniforms = { uTime: { value: 0 }, uDirs: { value: dirs }, uVals: { value: Array(EJES).fill(0) }, uPulse: { value: Array(EJES).fill(0) }, uAmp: { value: 0.03 }, uTono: { value: Array(EJES).fill(0) } };
    const css = getComputedStyle(document.documentElement), color = v => ({ value: new THREE.Color(css.getPropertyValue(v).trim()) });
    Object.assign(uniforms, { neg: color('--neg'), pos: color('--pos'), neu: color('--neu'), base: color('--linea-fuerte'), luz: color('--tinta') });
    blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 64), new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG }));
    scene.add(blob);
    const antes = performance.now() / 1000;            // switch dot clocks to the Three clock
    for (const p of puntos.values()) p.nacio -= antes;
    pulsoEn.fill(-99);
    medir();
  }).catch(() => {});                                    // without Three.js the axes and dots still work
  requestAnimationFrame(cuadro);

  return { recibir, resaltar, deseleccionar: () => seleccionar(null) };
}
