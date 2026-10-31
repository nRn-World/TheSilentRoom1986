const fs = require('fs');
const path = require('path');
const { OUT, ROOT } = require('./base.cjs');
const DEPS = process.env.STORE_DEPS || '/tmp/pw/node_modules';
const load = (name) => { try { return require(name); } catch { return require(path.join(DEPS, name)); } };
const { Resvg } = load('@resvg/resvg-js');
const { PNG } = load('pngjs');

const W = 1080, H = 1920;

/** Trim fully-background rows from the bottom of a rendered screen so the page keeps its real height. */
function trimBottom(file, bg = [249, 247, 240]) {
  const png = PNG.sync.read(fs.readFileSync(file));
  let last = 0;
  for (let y = png.height - 1; y >= 0 && last === 0; y--) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) << 2;
      const diff = Math.abs(png.data[i] - bg[0]) + Math.abs(png.data[i + 1] - bg[1]) + Math.abs(png.data[i + 2] - bg[2]);
      if (diff > 12) { last = y + 1; break; }
    }
  }
  const out = new PNG({ width: png.width, height: last });
  PNG.bitblt(png, out, 0, 0, png.width, last, 0, 0);
  fs.writeFileSync(file.replace('.png', '-trim.png'), PNG.sync.write(out));
  return { width: png.width, height: last };
}

const dataUri = (file) => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');

/**
 * One store slide: brand background, headline and a phone showing a real app screen.
 * The phone screen always has the shape of a 390x844 viewport; long pages are cropped by the frame.
 * offsetCss scrolls the page inside the phone (in screen CSS pixels).
 */
function slide({ out, eyebrow, title, sub, screen, offsetCss = 0, accent = '#df7658', phoneY = 470, phoneW = 800 }) {
  const raw = PNG.sync.read(fs.readFileSync(screen));
  const phoneX = (W - phoneW) / 2;
  const bezel = 14, radius = 66;
  const screenW = phoneW - bezel * 2;
  const s = screenW / raw.width;                 // device px per screen px
  const screenH = Math.round((844 / 390) * screenW);
  // a long page is cropped to one viewport, exactly like the phone would show it
  const viewportH = Math.min(raw.height, Math.round((844 / 390) * raw.width));
  let src = screen;
  if (viewportH < raw.height) {
    const cut = new PNG({ width: raw.width, height: viewportH });
    PNG.bitblt(raw, cut, 0, 0, raw.width, viewportH, 0, 0);
    src = path.join(OUT, '_crop.png');
    fs.writeFileSync(src, PNG.sync.write(cut));
  }
  const imgH = screenH;
  const subY = () => (eyebrow ? (sub && sub.length > 1 ? 372 : 352) : 300);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fcfaf5"/><stop offset="0.55" stop-color="#f8f5ed"/><stop offset="1" stop-color="#f1ece1"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.22"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="38"/></filter>
    <clipPath id="screenClip"><rect x="${phoneX + bezel}" y="${phoneY + bezel}" width="${screenW}" height="${screenH}" rx="${radius - 18}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#paper)"/>
  <circle cx="930" cy="250" r="340" fill="${accent}" opacity="0.11"/>
  <circle cx="120" cy="1520" r="320" fill="#9eb899" opacity="0.18"/>
  <path d="M0 1600 C 240 1480, 420 1740, 700 1620 S 980 1540, 1080 1600 L1080 1920 L0 1920Z" fill="#edf0e2" opacity="0.75"/>
  ${eyebrow ? `<text x="${W / 2}" y="196" text-anchor="middle" font-family="DM Sans" font-weight="800" font-size="27" letter-spacing="7" fill="${accent}">${escapeXml(eyebrow)}</text>` : ''}
  <text x="${W / 2}" y="${eyebrow ? 310 : 250}" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="64" letter-spacing="-2.2" fill="#29283b">${escapeXml(title)}</text>
  ${sub ? `<text x="${W / 2}" y="${subY()}" text-anchor="middle" font-family="DM Sans" font-weight="500" font-size="31" fill="#7b7570">${sub.map((line, i) => `<tspan x="${W / 2}" dy="${i === 0 ? 0 : 44}">${escapeXml(line)}</tspan>`).join('')}</text>` : ''}
  <ellipse cx="${W / 2}" cy="${phoneY + screenH + 60}" rx="${phoneW * 0.46}" ry="46" fill="#4c3f38" opacity="0.16" filter="url(#soft)"/>
  <rect x="${phoneX}" y="${phoneY}" width="${phoneW}" height="${screenH + bezel * 2}" rx="${radius}" fill="#26243a"/>
  <rect x="${phoneX + 4}" y="${phoneY + 4}" width="${phoneW - 8}" height="${screenH + bezel * 2 - 8}" rx="${radius - 4}" fill="#15141f"/>
  <g clip-path="url(#screenClip)">
    <image x="${phoneX + bezel}" y="${phoneY + bezel - offsetCss * s}" width="${screenW}" height="${imgH}" preserveAspectRatio="none" xlink:href="${dataUri(src)}"/>
  </g>
  <rect x="${phoneX + phoneW / 2 - 62}" y="${phoneY + 20}" width="124" height="32" rx="16" fill="#15141f"/>
  <rect x="${phoneX}" y="${phoneY}" width="${phoneW}" height="${screenH + bezel * 2}" rx="${radius}" fill="none" stroke="#3a3752" stroke-width="3"/>
</svg>`;
  fs.writeFileSync(out.replace('.png', '.svg'), svg);
  fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { fontFiles: ['DMSans-400','DMSans-500','DMSans-800','Outfit-700'].map(n => path.join(process.env.STORE_FONTS || '/tmp/fonts', n + '.ttf')), loadSystemFonts: false, defaultFontFamily: 'DM Sans' } }).render().asPng());
  return { out, screenH, imgH };
}

const escapeXml = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

module.exports = { slide, trimBottom, W, H };
