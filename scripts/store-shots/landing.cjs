const { h, box, satori, fonts, Resvg, fs, path, LOGO, SCENE, C, OUT } = require('./base.cjs');
const { icon, flag, star, arrowRight, arrowUpRight, arrowDown, scribble } = require('./assets.cjs');

const T = (text, style) => h('div', { style }, text);
const img = (src, style) => h('div', { style: { backgroundImage: `url(${src})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', ...style } });

const pill = (label, code, active) => box({ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 7, background: active ? '#fff' : 'transparent', border: active ? '1px solid #e0d9d0' : '1px solid transparent' },
  img(flag(code), { width: 15, height: 10, borderRadius: 2 }),
  T(label, { fontFamily: 'DM Sans', fontWeight: 700, fontSize: 11, color: active ? C.ink : '#7b7475' }));

const statusBar = box({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 26px', background: '#fff' },
  T('9:41', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 13, color: C.ink }),
  box({ display: 'flex', alignItems: 'center', gap: 6 },
    box({ display: 'flex', alignItems: 'flex-end', gap: 2 },
      ...[4, 6, 8, 10].map((hh) => h('div', { style: { width: 3, height: hh, borderRadius: 1, background: C.ink } }))),
    img('data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 12"><path d="M1 8a10 10 0 0 1 14 0M3.5 9.5a6.4 6.4 0 0 1 9 0" fill="none" stroke="#29283b" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11" r="1.1" fill="#29283b"/></svg>').toString('base64'), { width: 14, height: 10 }),
    box({ display: 'flex', alignItems: 'center', width: 22, height: 11, border: '1px solid #29283b', borderRadius: 3, padding: 1 },
      h('div', { style: { width: 14, height: 7, background: C.ink, borderRadius: 1.5 } }))));

const nav = box({ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #3330441b', padding: '0 22px' },
  box({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 57 },
    box({ display: 'flex', alignItems: 'center', gap: 8 },
      img(LOGO, { width: 34, height: 34, borderRadius: 11 }),
      T('step.by.step', { fontFamily: 'Outfit', fontWeight: 800, fontSize: 21, letterSpacing: '-1.4px', color: C.ink })
    ),
    box({ display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid #c8bdb5', paddingBottom: 3 },
      T('Your privacy', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 10.5, color: '#38364a' }),
      img(arrowUpRight('#e07153'), { width: 9, height: 9 }))
  ),
  box({ display: 'flex', gap: 3, marginBottom: 8, padding: 3, background: '#efece5', border: '1px solid #e3dfd5', borderRadius: 9, alignSelf: 'flex-start' },
    pill('Svenska', 'sv', false), pill('Dansk', 'da', false), pill('English', 'en', true)),
  T('A BETTER WAY FORWARD.', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 9.5, letterSpacing: '1.3px', color: '#9d968e', paddingBottom: 11 })
);

const hero = box({ display: 'flex', flexDirection: 'column', padding: '28px 26px 0' },
  box({ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
    img(star('#dda63c'), { width: 15, height: 15 }),
    T('WELCOME TO STEP.BY.STEP', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 9.5, letterSpacing: '2px', color: '#9f6d57' })),
  T('It starts', { fontFamily: 'Outfit', fontWeight: 700, fontSize: 46, lineHeight: '1', letterSpacing: '-3.2px', color: C.ink }),
  box({ display: 'flex', alignItems: 'flex-end' },
    T('with', { fontFamily: 'Outfit', fontWeight: 700, fontSize: 46, lineHeight: '1.05', letterSpacing: '-3.2px', color: C.ink, marginRight: 9 }),
    T('one step.', { fontFamily: 'Outfit', fontWeight: 700, fontSize: 46, lineHeight: '1.05', letterSpacing: '-3.2px', color: C.coral })),
  T('A short walk can change the whole day. Walk with your group, in the way that suits you.',
    { fontFamily: 'DM Sans', fontWeight: 500, fontSize: 13.5, lineHeight: '1.7', color: C.body, marginTop: 12, maxWidth: 320 }),
  box({ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, paddingBottom: 2, borderBottom: '1px solid #b7a1c4', alignSelf: 'flex-start' },
    T('Choose your mode', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 12, color: '#755b91' }),
    img(arrowDown('#755b91'), { width: 13, height: 13 })));

const art = box({ display: 'flex', position: 'relative', height: 236, marginTop: 16, overflow: 'hidden' },
  img(SCENE, { position: 'absolute', left: 0, top: 0, width: 390, height: 236 }),
  box({ position: 'absolute', left: 25, top: 12, width: 84, height: 84, borderRadius: 42, border: '1.5px dashed #c07f6a', background: '#faf7ef', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 },
    T('OUT & ABOUT', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 7.5, letterSpacing: '.9px', color: '#936c60' }),
    img(star('#dda63c'), { width: 17, height: 17 }),
    T('AT YOUR PACE', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 7.5, letterSpacing: '.9px', color: '#936c60' }))
);

const modeCard = (local) => box({ display: 'flex', flexDirection: 'column', background: local ? '#fff' : '#f1edf6', border: `1px solid ${local ? '#e8e4de' : '#e4dceb'}`, borderRadius: 13, padding: '15px 17px 0', boxShadow: '3px 5px 0 #3830440b' },
  box({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
    T(local ? '01' : '02', { fontFamily: 'DM Sans', fontWeight: 700, fontSize: 12, color: '#a5998e' }),
    box({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: local ? '#dce8d5' : '#e2d9ee' },
      img(icon(local ? 'Footprints' : 'Users', local ? '#647f60' : '#836ca5'), { width: 22, height: 22 }))),
  box({ display: 'flex', alignItems: 'center', gap: 5, marginTop: -4 },
    T(local ? 'Close by' : 'Together live', { fontFamily: 'Outfit', fontWeight: 700, fontSize: 21, letterSpacing: '-.6px', color: C.ink }),
    img(star('#dda63c'), { width: 12, height: 12 })),
  T(local ? 'Group walk without an account, GPS or server storage. The phones share steps right nearby.' : 'Share steps, goals and cheers with the group. See how many are out right now, never where they are.',
    { fontFamily: 'DM Sans', fontWeight: 500, fontSize: 11.5, lineHeight: '1.48', color: '#777377', marginTop: 6, marginBottom: 14 }),
  box({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #29283b16', padding: '11px 0' },
    T(local ? 'Offline · no GPS' : 'Together · live', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 10.5, color: local ? '#5f715d' : '#786493' }),
    box({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 13, background: local ? '#e9eee5' : '#e6ddef' },
      img(arrowRight(local ? '#5f715d' : '#786493'), { width: 13, height: 13 })))
);

const choices = box({ display: 'flex', flexDirection: 'column', padding: '26px 22px 30px' },
  box({ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
    h('div', { style: { width: 22, height: 2, background: '#d97158' } }),
    T('01 / 02', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 9.5, letterSpacing: '1.6px', color: '#bd7c62' })),
  T('How do you want to walk?', { fontFamily: 'Outfit', fontWeight: 700, fontSize: 26, letterSpacing: '-1px', color: C.ink }),
  T('Two roads. The same feeling of getting somewhere.', { fontFamily: 'DM Sans', fontWeight: 500, fontSize: 11, lineHeight: '1.5', color: '#938b88', marginTop: 4, marginBottom: 12 }),
  modeCard(true),
  box({ height: 11 }),
  modeCard(false)
);

const footer = box({ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 22px 22px', borderTop: '1px solid #33304418' },
  box({ display: 'flex', alignItems: 'center', gap: 7 },
    img(star('#dda63c', 10), { width: 10, height: 10 }),
    box({ display: 'flex', flexDirection: 'column', alignItems: 'center' },
      T('ONE STEP AT A TIME,', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 9.5, letterSpacing: '1.1px', color: '#9b918b', lineHeight: '1.55' }),
      T('TOGETHER.', { fontFamily: 'DM Sans', fontWeight: 800, fontSize: 9.5, letterSpacing: '1.1px', color: '#9b918b', lineHeight: '1.55' }))),
  T('Created by nrnworld.one / bynrnworld@gmail.com', { fontFamily: 'DM Sans', fontWeight: 500, fontSize: 10.5, color: '#8d887f' }),
  T('Made for movement. Built with care.', { fontFamily: 'DM Sans', fontWeight: 500, fontSize: 10.5, color: '#9b918b' })
);

const screen = box({ display: 'flex', flexDirection: 'column', width: 390, background: C.paper }, statusBar, nav, hero, art, choices, footer);

(async () => {
  const svg = await satori(screen, { width: 390, fonts });
  const height = Number(/height="(\d+)"/.exec(svg)[1]);
  fs.writeFileSync(path.join(OUT, 'svg-landing.svg'), svg);
  fs.writeFileSync(path.join(OUT, 'screen-landing.png'), new Resvg(svg, { fitTo: { mode: 'width', value: 1170 }, background: C.paper }).render().asPng());
  console.log('landing height', height);
})();
