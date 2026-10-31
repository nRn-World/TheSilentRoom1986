const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');
const OUT = process.env.STORE_OUT || '/tmp/store';
const FONT_DIR = process.env.STORE_FONTS || '/tmp/fonts';

const React = require(path.join(ROOT, 'node_modules/react'));
// Tooling-only dependencies: resolved from the app's node_modules, or from a tool dir (STORE_DEPS).
const DEPS = process.env.STORE_DEPS || '/tmp/pw/node_modules';
const load = (name) => { try { return require(name); } catch { return require(path.join(DEPS, name)); } };
const satori = load('satori').default;
const { Resvg } = load('@resvg/resvg-js');

const F = (n) => path.join(FONT_DIR, `${n}.ttf`);
const fonts = [
  ['DM Sans', 'DMSans-400', 400], ['DM Sans', 'DMSans-500', 500], ['DM Sans', 'DMSans-700', 700], ['DM Sans', 'DMSans-800', 800],
  ['Outfit', 'Outfit-400', 400], ['Outfit', 'Outfit-500', 500], ['Outfit', 'Outfit-600', 600], ['Outfit', 'Outfit-700', 700], ['Outfit', 'Outfit-800', 800],
].map(([name, file, weight]) => ({ name, weight, style: 'normal', data: fs.readFileSync(F(file)) }));

const b64 = (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
const LOGO = b64(path.join(ROOT, 'public/brand-logo.png'));
const SCENE = b64(path.join(ROOT, 'art/illustration-4-people.png'));
const ICONS = require('./icons.json');

const C = {
  ink: '#29283b', ink2: '#29263e', muted: '#8b847d', body: '#716c6d', paper: '#f9f7f0', white: '#ffffff',
  coral: '#df7658', coralSoft: '#e89179', coralWarm: '#f77e53', lavender: '#eae5fb', lavenderDeep: '#836ca5',
  green: '#9eb899', greenDeep: '#485d48', dark: '#292840', cream: '#f3eee2', line: '#33304418',
};

// tiny hyperscript so every helper stays plain (satori cannot run components)
const h = (type, props, ...children) => React.createElement(type, props || {}, ...children);
const t = (text, style) => h('div', { style }, text);
const box = (style, ...children) => h('div', { style }, ...children);

module.exports = { h, t, box, satori, fonts, Resvg, fs, path, b64, LOGO, SCENE, ICONS, C, React, ROOT, OUT };
