// Routes: / landing · /admin · /<slug> answer · /<slug>/voces · /<slug>/flujo.
// Dynamic imports so each page only loads its own CSS.
const [a, b] = location.pathname.split('/').filter(Boolean);
if (a === 'admin') { document.title = 'Audem admin'; import('./Admin.jsx'); }
else if (!a) { document.title = 'Audem'; import('./Portada.jsx'); }
else if (b === 'flujo') { document.title = 'Audem flujo'; import('./Flujo.jsx'); }
else if (b === 'voces') { document.title = 'Audem tópicos'; import('./Voces.jsx'); }
else { document.title = 'Responder Audem'; import('./Responder.jsx'); }
