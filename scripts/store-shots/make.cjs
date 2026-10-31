const path = require('path');
const { slide } = require('./compose.cjs');
const { OUT } = require('./base.cjs');

const SLIDES = [
  { id: '01-start', file: 'landing', eyebrow: 'STEP.BY.STEP', title: 'Gå tillsammans.',
    sub: ['En liten promenad kan förändra en hel dag.', 'Gå med din grupp, på det sätt som passar er.'], accent: '#df7658' },
  { id: '02-tva-satt', file: 'choices', eyebrow: 'TVÅ SÄTT ATT GÅ', title: 'Välj er väg.',
    sub: ['Gruppromenad i närheten eller tillsammans live.'], accent: '#df7658' },
  { id: '03-offline', file: 'offlineStart', eyebrow: 'OFFLINE · UTAN KONTO', title: 'Nära varandra.',
    sub: ['Stegen kommer från telefonens hälsotjänst och', 'delas direkt mellan er. Ingen GPS, ingen server.'], accent: '#7c8f6d' },
  { id: '04-din-dag', file: 'offlineStats', eyebrow: 'DIN DAG', title: 'Dina steg, din dag.',
    sub: ['Steg och sträcka direkt från telefonen,', 'målet finns bara kvar så länge vyn är öppen.'], accent: '#c9744f' },
  { id: '05-narheten', file: 'nearby', eyebrow: 'NÄRHETEN', title: 'Vem är med?',
    sub: ['Godkänn varandra på plats. Gruppen lever bara', 'i minnet och försvinner när vyn stängs.'], accent: '#6f8862' },
  { id: '06-pepp', file: 'dashboard', eyebrow: 'TILLSAMMANS · LIVE', title: 'Steg och sträcka.',
    sub: ['Se gruppens steg och mål i realtid,', 'aldrig var någon är.'], accent: '#8a76b5' },
  { id: '07-topplista', file: 'leaderboard', eyebrow: 'GRUPPEN', title: 'Topplistan.',
    sub: ['Alla i gruppen på samma lista.', 'Peppa varandra hela vägen in i mål.'], accent: '#df7658' },
  { id: '08-mal', file: 'goals', eyebrow: 'MÅL', title: 'Gruppens mål.',
    sub: ['Sätt ett mål för dagen, veckan eller året,', 'och nå det tillsammans.'], accent: '#6f8862' },
];

const only = process.argv[2];
for (const s of SLIDES) {
  if (only && s.id !== only) continue;
  slide({ out: path.join(OUT, s.id + '.png'), eyebrow: s.eyebrow, title: s.title, sub: s.sub, screen: path.join(OUT, (s.file === 'landing' ? 'screen-landing' : s.file) + '.png'), accent: s.accent });
  console.log('slide', s.id);
}
