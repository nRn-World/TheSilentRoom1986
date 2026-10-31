const { b64, ICONS } = require('./base.cjs');
const icons = ICONS;

// satori cannot paint text glyphs like ✳ or →; draw them with the app's own SVG icons instead.
const icon = (name, color) => {
  const svg = (icons[name] || icons.sparkles).replace(/stroke="currentColor"/g, `stroke="${color}"`).replace(/fill="currentColor"/g, `fill="${color}"`);
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
};
const raw = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

const flag = (code) => {
  if (code === 'sv') return raw('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#2165ab"/><path d="M0 6h24v4H0zm7-6h4v16H7z" fill="#f4cf44"/></svg>');
  if (code === 'da') return raw('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#c42d3b"/><path d="M0 6h24v4H0zM7 0h4v16H7z" fill="#fff"/></svg>');
  return raw('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#233a78"/><path d="M0 0 24 16M24 0 0 16" stroke="#fff" stroke-width="4"/><path d="M0 0 24 16M24 0 0 16" stroke="#ce3446" stroke-width="1.7"/><path d="M0 6h24v4H0zM10 0h4v16h-4z" fill="#fff"/><path d="M0 7h24v2H0zM11 0h2v16h-2z" fill="#ce3446"/></svg>');
};

// the app's own star (src/components/PlayfulIcons.tsx) – satori cannot paint ✳ glyphs
const star = (color, size = 14) => raw(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}"><path d="M24 3.4 29.6 16.5 43.7 17.8 32.9 27 36.3 40.8 24 33.6 11.7 40.8 15.1 27 4.3 17.8 18.4 16.5Z" fill="${color}"/></svg>`);
const arrowRight = (color) => raw(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
const arrowUpRight = (color) => raw(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 17 17 7m0 0H8m9 0v9" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
const scribble = () => raw('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 20c6-2 10-7 12-13m0 0-5 1m5-1 2 5" fill="none" stroke="#91a082" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>');

const arrowLeft = (color) => raw(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 12H5m6-6-6 6 6 6" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
const arrowDown = (color) => raw(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4v15m-6-6 6 6 6-6" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
module.exports = { icon, flag, star, arrowRight, arrowUpRight, arrowLeft, arrowDown, scribble, raw, b64 };
