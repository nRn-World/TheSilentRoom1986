import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Footprints, MapPin, Moon, Sun, Trophy, Users } from './components/PlayfulIcons';

type Period = 'day' | 'week' | 'weekend' | 'month' | 'year';
type Scope = 'each' | 'together';
type Scene = Period | 'together';

const palettes: Record<Scene, string[]> = {
  day: ['#f7bd5a', '#f38b62', '#a4dd68'],
  week: ['#8d76d8', '#f2b25f', '#a4dd68'],
  weekend: ['#f7bd5a', '#8ec4d8', '#f38b62'],
  month: ['#8d76d4', '#b9a7e5', '#f7d58a'],
  year: ['#e88b6a', '#f7bd5a', '#8fc46e', '#a98bd8'],
  together: ['#85bd6d', '#aa96ed', '#ff865f', '#f7bd5a'],
};

function SceneArt({ scene }: { scene: Scene }) {
  if (scene === 'day') return <div className="c-scene day"><span className="c-orb"><Sun size={30} /></span><span className="c-hill" /><span className="c-step s1"><Footprints size={21} /></span><span className="c-step s2"><Footprints size={21} /></span><span className="c-step s3"><Footprints size={21} /></span></div>;
  if (scene === 'week') return <div className="c-scene week">{[0, 1, 2, 3, 4, 5, 6].map(i => <i key={i} className="c-bar" style={{ animationDelay: `${i * 110}ms`, height: `${22 + i * 6}px` }} />)}<span className="c-trophy"><Trophy size={28} /></span></div>;
  if (scene === 'weekend') return <div className="c-scene weekend"><span className="c-orb small"><Sun size={26} /></span><span className="c-cloud c1" /><span className="c-cloud c2" /><span className="c-walker w1"><Footprints size={22} /></span><span className="c-walker w2"><Footprints size={22} /></span></div>;
  if (scene === 'month') return <div className="c-scene month"><span className="c-moon"><Moon size={32} /></span>{[0, 1, 2, 3, 4, 5].map(i => <i key={i} className={'c-star star-' + i} />)}<span className="c-shoot" /></div>;
  if (scene === 'year') return <div className="c-scene year"><span className="c-trophy big"><Trophy size={38} /></span>{[0, 1, 2].map(i => <span key={i} className={'c-fire fw-' + i}>{[0, 1, 2, 3, 4, 5, 6, 7].map(j => <i key={j} style={{ transform: `rotate(${j * 45}deg) translateY(-26px)` }} />)}</span>)}</div>;
  return <div className="c-scene together"><span className="c-flag"><MapPin size={26} fill="currentColor" /></span><span className="c-march m1"><Users size={15} /></span><span className="c-march m2"><Users size={15} /></span><span className="c-march m3"><Users size={15} /></span><span className="c-march m4"><Users size={15} /></span><span className="c-ground" /></div>;
}

export default function Celebration({ period, scope, eyebrow, title, message, detail, closeLabel, onClose }: {
  period: Period; scope: Scope; eyebrow: string; title: string; message: string; detail: string; closeLabel: string; onClose: () => void;
}) {
  const scene: Scene = scope === 'each' ? period : 'together';
  useEffect(() => {
    try {
      confetti({ particleCount: 120, spread: 90, startVelocity: 42, origin: { y: 0.6 }, colors: palettes[scene] });
      const timer = window.setTimeout(() => {
        try { confetti({ particleCount: 60, spread: 120, origin: { x: 0.2, y: 0.4 }, colors: palettes[scene] }); } catch { /* Decoration only. */ }
      }, 420);
      return () => window.clearTimeout(timer);
    } catch { return undefined; }
  }, [scene]);

  return (
    <div className="celebration-backdrop">
      <div className="celebration-card" role="dialog" aria-modal="true" aria-labelledby="celebration-title" data-testid="celebration" data-scene={scene}>
        <div className={'c-scene-wrap scene-' + scene} aria-hidden="true"><SceneArt scene={scene} /></div>
        <p className="c-eyebrow">{eyebrow}</p>
        <h2 id="celebration-title">{title}</h2>
        <p className="c-message">{message}</p>
        <p className="c-detail">{detail}</p>
        <button className="modal-primary" type="button" onClick={onClose} autoFocus>{closeLabel}</button>
      </div>
    </div>
  );
}
