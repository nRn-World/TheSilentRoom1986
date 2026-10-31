/** Exports the app's own icon SVGs (and flags) to JSON so the store-image script can reuse them. */
import { writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import * as Icons from '../src/components/PlayfulIcons';

const names = ['Footprints','Activity','Trophy','Target','Users','MapPin','Heart','Link2','Share2','UserPlus','Sparkles','Crown','Sun','Moon','ArrowRight','Plus','Settings2','Menu','ShieldCheck','CircleHelp','X','Check','Copy','ChevronDown'];
const out: Record<string,string> = {};
for (const name of names) {
  const Component = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
  if (Component) out[name] = renderToStaticMarkup(<Component size={48} />);
}
writeFileSync('scripts/store-shots/icons.json', JSON.stringify(out, null, 1));
console.log('icons:', Object.keys(out).join(', '));
