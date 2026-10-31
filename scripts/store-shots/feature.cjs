const { h, box, satori, fonts, Resvg, fs, path, LOGO, SCENE, C, OUT } = require('./base.cjs');
const { star } = require('./assets.cjs');

const T = (text, style) => h('div', { style }, text);
const img = (src, style) => h('div', { style: { backgroundImage: `url(${src})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', ...style } });

const W = 1024, H = 500;

const scene = box({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 504, height: 500 },
  box({ display: 'flex', position: 'relative', width: 470, height: 312, background: '#fff', borderRadius: 28, padding: 12, boxShadow: '0 24px 60px #29283b1f', overflow: 'hidden' },
    box({ display: 'flex', position: 'relative', width: 446, height: 270, borderRadius: 20, overflow: 'hidden' },
      img(SCENE, { position: 'absolute', left: 0, top: 0, width: 446, height: 270 }),
      box({ position: 'absolute', left: 18, top: 16, width: 86, height: 86, borderRadius: 43, border: '1.5px dashed #b88471', background: '#fbf4e5d9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 },
        T('OUT & ABOUT', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 8, letterSpacing: '.9px', color: '#936c60' }),
        img(star('#dda63c'), { width: 17, height: 17 }),
        T('AT YOUR PACE', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 8, letterSpacing: '.9px', color: '#936c60' })))));

const left = box({ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: 554, padding: '0 0 0 56px' },
  box({ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 },
    img(LOGO, { width: 62, height: 62, borderRadius: 18 }),
    T('step.by.step', { fontFamily: 'Outfit', fontWeight: 800, fontSize: 38, letterSpacing: '-2px', color: C.ink })),
  box({ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
    img(star('#dda63c'), { width: 15, height: 15 }),
    T('GROUP WALK · OFFLINE AND LIVE', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 12, letterSpacing: '2.2px', color: '#9f6d57' })),
  T('One step at a time,', { fontFamily: 'Outfit', fontWeight: 700, fontSize: 50, lineHeight: '1', letterSpacing: '-3px', color: C.ink }),
  T('together.', { fontFamily: 'Outfit', fontWeight: 700, fontSize: 50, lineHeight: '1.06', letterSpacing: '-3px', color: C.coral }),
  T('Steps, distance and goals with your group, no account and no GPS tracking.', { fontFamily: 'DM Sans', fontWeight: 500, fontSize: 19, lineHeight: '1.5', color: C.body, marginTop: 14, maxWidth: 430 }));

const page = box({ display: 'flex', width: W, height: H, background: 'linear-gradient(115deg, #fcfaf5 0%, #f8f4ea 55%, #f1ece1 100%)', position: 'relative', overflow: 'hidden' },
  box({ position: 'absolute', left: 640, top: -160, width: 520, height: 520, borderRadius: 260, background: '#e9eddd', opacity: 0.75 }),
  box({ position: 'absolute', left: -120, top: 300, width: 420, height: 420, borderRadius: 210, background: '#f7e2d8', opacity: 0.6 }),
  left, scene);

(async () => {
  const svg = await satori(page, { width: W, height: H, fonts });
  fs.writeFileSync(path.join(OUT, '09-feature.svg'), svg);
  fs.writeFileSync(path.join(OUT, '09-feature.png'), new Resvg(svg, { fitTo: { mode: 'width', value: W }, background: '#fbf9f3' }).render().asPng());
  console.log('feature graphic ok');
})();
