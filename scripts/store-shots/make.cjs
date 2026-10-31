const path = require('path');
const { slide } = require('./compose.cjs');
const { OUT } = require('./base.cjs');

const SLIDES = [
  { id: '01-start', file: 'landing', eyebrow: 'STEP.BY.STEP', title: 'Walk together.',
    sub: ['A short walk can change the whole day.', 'Walk with your group, in the way that suits you.'], accent: '#df7658' },
  { id: '02-tva-satt', file: 'choices', eyebrow: 'TWO WAYS TO WALK', title: 'Choose your way.',
    sub: ['Group walk close by, or together live.'], accent: '#df7658' },
  { id: '03-offline', file: 'offlineStart', eyebrow: 'OFFLINE · NO ACCOUNT', title: 'Close together.',
    sub: ['Steps come from the phone health store and', 'are shared directly between you. No GPS, no server.'], accent: '#7c8f6d' },
  { id: '04-din-dag', file: 'offlineStats', eyebrow: 'YOUR DAY', title: 'Your steps, your day.',
    sub: ['Steps and distance straight from the phone,', 'the goal stays only while the view is open.'], accent: '#c9744f' },
  { id: '05-narheten', file: 'nearby', eyebrow: 'CLOSE BY', title: 'Who is in?',
    sub: ['Approve each other on the spot. The group lives', 'only in memory and is gone when the view closes.'], accent: '#6f8862' },
  { id: '06-pepp', file: 'dashboard', eyebrow: 'TOGETHER · LIVE', title: 'Steps and distance.',
    sub: ['See the group steps and goals live,', 'never where anyone is.'], accent: '#8a76b5' },
  { id: '07-topplista', file: 'leaderboard', eyebrow: 'THE GROUP', title: 'The leaderboard.',
    sub: ['Everyone in the group on the same list.', 'Cheer each other all the way to the goal.'], accent: '#df7658' },
  { id: '08-mal', file: 'goals', eyebrow: 'GOALS', title: 'Group goals.',
    sub: ['Set a goal for the day, the week or the year,', 'and reach it together.'], accent: '#6f8862' },
];

const only = process.argv[2];
for (const s of SLIDES) {
  if (only && s.id !== only) continue;
  slide({ out: path.join(OUT, s.id + '.png'), eyebrow: s.eyebrow, title: s.title, sub: s.sub, screen: path.join(OUT, (s.file === 'landing' ? 'screen-landing' : s.file) + '.png'), accent: s.accent });
  console.log('slide', s.id);
}
