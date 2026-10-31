import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const deps = process.env.STORE_DEPS || '/tmp/pw/node_modules';
const requireDeps = createRequire(deps.endsWith('/') ? deps : deps + '/');
const { Resvg } = requireDeps('@resvg/resvg-js');
import WalkingScene from '../src/components/WalkingScene';

const html = renderToStaticMarkup(<WalkingScene />).replace(/<!-- -->/g, '');
const svg = html.slice(html.indexOf('<svg'), html.lastIndexOf('</svg>') + 6);
const width = Number(process.argv[2] || 900);
writeFileSync('/tmp/scene.svg', svg);
writeFileSync('/tmp/scene.png', new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng());
console.log('ok', width, svg.length);
