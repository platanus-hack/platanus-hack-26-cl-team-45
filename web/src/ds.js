// Audem's design system (design-system/) ships as a classic script that reads window.React, so demo.html runs it without a build.
// Here it runs once against the app's React and its components come back as ES exports.
import React from 'react';
import '../../design-system/tokens.css';
import '../../design-system/audem-ds.css';

window.React = React;
await import('../../design-system/audem-ds.js');

export const { Marca, Onda, Boton, Selector, Pastilla, Perilla, Rama, Orbe, Panel, Agente, Escena, Entrada, BotonVoz, Microfono, Simbolo, margen, cifra } = window.Audem;
