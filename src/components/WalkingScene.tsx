/** Hand-drawn scene made for step.by.step. All shapes are local SVG, not a third-party image. */
const LINE = '#3a4152';
const SHOE = '#2b3346';
const TROUSER = '#f2e8d3';
const BAG = '#f0e5d1';
const FACE = '#3a3547';

const TORSO = 'M-25 244C-31 256-32 292-31 316-31 327-17 333 0 333 17 333 31 327 31 316 32 292 31 256 25 244 16 239-16 239-25 244Z';
const ARMS = 'M-24 250C-33 262-39 274-38 285-38 293-41 298-45 301M24 250C33 262 39 274 38 287 38 295 41 301 45 305';
const HANDS_BACK = { cx: -47, cy: 303 };
const HANDS_FRONT = { cx: 47, cy: 307 };

const splitPaths = (d: string) => d.split(' M').map((part, i) => (i ? `M${part}` : part));
const FRINGE_BOB = 'M-44 206C-44 176-22 152 2 153 22 154 38 168 37 190 30 183 21 181 13 185 4 189-6 191-15 192-24 193-34 194-40 199-42 202-43 205-44 206Z';
const FRINGE_CURLY = 'M-45 202C-45 172-22 150 2 151 22 152 38 166 37 188 29 181 21 179 13 183 4 187-6 189-15 190-24 191-35 192-41 196-43 198-44 200-45 202Z';
const FRINGE_SHORT = 'M-40 200C-40 174-20 154 2 155 21 156 36 168 35 186 27 180 19 178 11 182 3 186-6 188-14 189-22 190-33 190-38 195-39 197-40 199-40 200Z';

function Legs() {
  return <>
    <path d="M-8 328C-19 352-27 372-30 388M8 328C19 352 27 372 30 388" fill="none" stroke={LINE} strokeWidth="23" strokeLinecap="round"/>
    <path d="M-8 328C-19 352-27 372-30 388M8 328C19 352 27 372 30 388" fill="none" stroke={TROUSER} strokeWidth="19" strokeLinecap="round"/>
    <path d="M-44 386c-6 1-10 4-9 8 1 4 5 6 11 5l19-3c6-1 9-4 8-8-1-4-6-6-11-5Z" fill={SHOE} stroke={LINE} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M44 386c6 1 10 4 9 8-1 4-5 6-11 5l-19-3c-6-1-9-4-8-8 1-4 6-6 11-5Z" fill={SHOE} stroke={LINE} strokeWidth="2" strokeLinejoin="round"/>
  </>;
}

function Arms({ color }: { color: string }) {
  return <>
    <path d={ARMS} fill="none" stroke={LINE} strokeWidth="19" strokeLinecap="round"/>
    <path d={ARMS} fill="none" stroke={color} strokeWidth="15" strokeLinecap="round"/>
    <path d="M-41 294q4 5 8 4M41 296q4 5 8 4" fill="none" stroke={LINE} strokeWidth="1.8" strokeLinecap="round"/>
  </>;
}

function Collar({ color }: { color: string }) {
  return <>
    <path d="M-19 238-4 247-17 258ZM19 238 4 247 17 258Z" fill={color} stroke={LINE} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M-4 247 0 252 4 247" fill="none" stroke={LINE} strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M0 252v66" fill="none" stroke={LINE} strokeWidth="1.8"/>
    <path d="M0 314v8" fill="none" stroke={LINE} strokeWidth="2"/>
  </>;
}

function Features({ mouth }: { mouth: string }) {
  return <>
    <circle cx="-13" cy="202" r="2.6" fill={FACE}/><circle cx="13" cy="202" r="2.6" fill={FACE}/>
    <path d="M-8 215q8 7 16 0" fill="none" stroke={mouth} strokeWidth="2.1" strokeLinecap="round"/>
  </>;
}

function Hand({ skin, x, y }: { skin: string; x: number; y: number }) {
  return <ellipse cx={x} cy={y} rx="6" ry="7" fill={skin} transform={`rotate(${x < 0 ? -10 : 10} ${x} ${y})`}/>;
}

type WalkerProps = {
  className: string;
  cx: number;
  skin: string;
  shirt: string;
  hair: string;
  mouth: string;
  hairMass: [number, number, number][];
  fringe: string[];
  curls?: React.ReactNode;
  children?: React.ReactNode;
  overHair?: React.ReactNode;
};

function Walker({ className, cx, skin, shirt, hair, mouth, hairMass, fringe, curls, children, overHair }: WalkerProps) {
  return <g className={`scene-person scene-person-${className}`}>
    <g transform={`translate(${cx} 0)`}>
      <Legs/>
      <path d={TORSO} fill={shirt} stroke={LINE} strokeWidth="2.2" strokeLinejoin="round"/>
      <Arms color={shirt}/>
      <rect x="-8" y="218" width="16" height="32" fill={skin}/>
      {children}
      <Collar color={shirt}/>
      <g fill={hair}><ellipse cx="0" cy="190" rx="38" ry="40"/>{hairMass.map(([hx, hy, r]) => <circle key={`${hx}:${hy}`} cx={hx} cy={hy} r={r}/>)}</g>
      <ellipse cx="0" cy="200" rx="34" ry="35" fill={skin}/>
      {fringe.map((d) => <path key={d.slice(0, 14)} d={d} fill={hair}/>)}
      {curls}
      <Features mouth={mouth}/>
      {overHair}
      <Hand skin={skin} x={HANDS_BACK.cx} y={HANDS_BACK.cy}/>
      <Hand skin={skin} x={HANDS_FRONT.cx} y={HANDS_FRONT.cy}/>
    </g>
  </g>;
}

export default function WalkingScene() {
  return <svg className="walking-scene" viewBox="0 0 760 460" role="img" aria-label="Fyra vänner promenerar genom en park medan en liten hund hälsar på var och en av dem" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="scene-grain" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".7" fill="#7c695e" opacity=".12"/><circle cx="9" cy="10" r=".5" fill="#7c695e" opacity=".1"/></pattern>
      <filter id="scene-shadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="10"/></filter>
      <clipPath id="scene-torso"><path d={TORSO}/></clipPath>
    </defs>
    <path d="M37 324C116 244 217 262 278 297c76 43 135-15 227-35 110-23 174 22 225 64v134H37Z" fill="#e2e9d2"/>
    <path d="M31 362c92-63 178-49 262-17 84 31 131 26 219-8 84-32 155-23 218 18v105H31Z" fill="#c9dbba"/>
    <path d="M-9 418c82-11 130-40 217-33 102 7 140 53 275 35 90-13 146-55 285-21v61H-9Z" fill="#f6dfbc" stroke="#a98976" strokeWidth="2"/>
    <path d="M35 411c132-44 230-9 319 17 109 31 225-34 372-26" fill="none" stroke="#fbefda" strokeWidth="28" strokeLinecap="round"/>
    <path d="M35 411c132-44 230-9 319 17 109 31 225-34 372-26" fill="none" stroke="#c8aa91" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 17" opacity=".6"/>
    <circle cx="628" cy="92" r="52" fill="#f4c477"/><circle cx="628" cy="92" r="66" fill="none" stroke="#e9b268" strokeWidth="2" strokeDasharray="4 10"/>
    <path d="M118 308q-45-85 4-148 37-34 65 0 30 34-12 77-29 24-57 71Z" fill="#96a986" stroke="#455b55" strokeWidth="2.5"/>
    <path d="M113 282q-17-49-1-79m10 103q34-64 52-99" fill="none" stroke="#567262" strokeWidth="3" strokeLinecap="round"/>
    <path d="M674 305q-58-102-3-156 38-21 60 8 24 37-15 80-28 28-42 68Z" fill="#abbd9a" stroke="#455b55" strokeWidth="2.5"/>
    <path d="M677 302q26-66 44-94m-47 80q-19-64-7-91" fill="none" stroke="#5b7966" strokeWidth="3" strokeLinecap="round"/>
    <path d="M50 353q-2-38 13-56m8 51q4-23 18-33m-37 29q-16-18-26-17M705 359q-4-42 14-63m-10 59q20-23 35-21" fill="none" stroke="#59775c" strokeWidth="4" strokeLinecap="round"/>
    <g fill="#db876f"><circle cx="67" cy="319" r="6"/><circle cx="735" cy="323" r="6"/><circle cx="61" cy="309" r="3"/></g>
    <path d="M52 358q18-9 35 0m603 1q16-9 35 0" fill="none" stroke="#4d6658" strokeWidth="2"/>
    <ellipse cx="372" cy="402" rx="207" ry="18" fill="#8c7966" opacity=".13" filter="url(#scene-shadow)"/>

    {/* Friend in coral shirt with a dark bob. */}
    <Walker className="one" cx={252} skin="#dcae90" shirt="#e89179" hair="#3d3546" mouth="#8f5a56" hairMass={[[0,186,34],[-26,202,22],[26,202,22],[-30,226,17],[30,226,17]]} fringe={splitPaths(FRINGE_BOB)}>
      <path d="M-64 288h15a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3v-21a3 3 0 0 1 3-3Z" fill="#b4a2cb" stroke={LINE} strokeWidth="2" transform="rotate(-12 -54 301)"/>
      <path d="M-61 296h8" fill="none" stroke="#8f7fa5" strokeWidth="2"/>
    </Walker>

    {/* Center friend in a striped shirt with curly hair. */}
    <Walker className="two" cx={385} skin="#b98264" shirt="#ece0bd" hair="#342f37" mouth="#7d4a48" hairMass={[[0,182,34],[-26,198,22],[26,198,22],[-31,222,18],[31,222,18],[-15,164,15],[15,164,15]]} fringe={splitPaths(FRINGE_CURLY)}
      curls={<g fill="#342f37"><circle cx="-32" cy="188" r="8"/><circle cx="-16" cy="162" r="9"/><circle cx="8" cy="160" r="9"/><circle cx="28" cy="172" r="8"/></g>}>
      <g clipPath="url(#scene-torso)"><path d="M-32 272h64m-64 17h64m-64 17h64" fill="none" stroke="#cfc092" strokeWidth="6"/></g>
    </Walker>

    {/* The first friend: green coat, bucket hat and dark trousers, kept exactly as drawn first. */}
    <g className="scene-person scene-person-three">
      <g transform="translate(492 405) scale(1.1) translate(-492 -405)" stroke="#493f45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M489 349q-21 22-25 51m43-46q9 25 23 43" fill="none" stroke="#55526b" strokeWidth="17"/>
        <path d="m453 403 24 2m44-3 22-5" fill="none" stroke="#353447" strokeWidth="10"/>
        <path d="M480 265q-28 16-29 42l4 62q38 12 72-1l-9-81q-13-24-38-22Z" fill="#9eb899"/>
        <path d="M489 277q2 47 5 82m-32-40 18-5" fill="none" stroke="#6d9074" strokeWidth="2"/>
        <path d="M457 289q-18 17-21 35m82-34q13 15 18 27" fill="none" stroke="#9eb899" strokeWidth="15"/>
        <path d="M439 323q-3 11 4 14m96-20q11 6 6 17" fill="none" stroke="#a77f69" strokeWidth="8"/>
        <ellipse cx="495" cy="230" rx="30" ry="37" fill="#d3a587"/>
        <path d="M467 227q-5-30 22-37 29-3 36 32-18-6-25-22-13 18-33 27Z" fill="#544748"/>
        <path d="M456 198q26-19 70-4l11 20q-35 13-80-2Z" fill="#a49ab0"/>
        <path d="M465 210q30 11 61 1" fill="none" stroke="#736a86" strokeWidth="3"/>
        <circle cx="483" cy="232" r="2" fill="#493f45" stroke="none"/><circle cx="504" cy="232" r="2" fill="#493f45" stroke="none"/>
          <path d="M485 245q9 6 17-2" fill="none" stroke="#a66d65" strokeWidth="2"/>
      </g>
    </g>

    {/* Front friend: sandy hair, slate blue shirt with a canvas tote. */}
    <Walker className="four" cx={183} skin="#f0c8a6" shirt="#6f8fac" hair="#e3b365" mouth="#a4615c" hairMass={[[0,186,34],[-26,202,22],[26,202,22],[-30,226,17],[30,226,17]]} fringe={splitPaths(FRINGE_BOB)}
      children={<>
        <path d="M-16 241-7 238-38 302-46 297Z" fill={BAG} stroke={LINE} strokeWidth="2" strokeLinejoin="round"/>
        <path d="M-60 298h24c4 0 6 2 6 6v34c0 6-4 9-9 9h-20c-5 0-9-3-9-9v-34c0-4 2-6 8-6Z" fill={BAG} stroke={LINE} strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M-56 324q9-4 18 0" fill="none" stroke={LINE} strokeWidth="2" strokeLinecap="round"/>
      </>}/>
    {/* The dog walks up to each friend, then back to its own spot. */}
    <g className="scene-dog-track"><g className="scene-dog-turn"><g className="scene-dog-gait">
      <g className="scene-dog" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M560 367q25-6 38 6 12 10 3 20l-31 1-20-10Z" fill="#f1e3cf"/>
        <path d="M601 376q19-18 12-26" fill="none" strokeWidth="5"/>
        <path d="M552 373q-17-16-22-2l13 20 16-4Z" fill="#c89481"/>
        <path d="M568 395l-2 14m25-15 4 13" fill="none" strokeWidth="5"/>
        <circle cx="549" cy="378" r="2.5" fill={FACE}/><circle cx="540" cy="386" r="2.5" fill={FACE}/>
      </g>
    </g></g></g>
    <path d="M42 277q14-18 29 0m566-15q14-17 29-1M84 124q10-13 22 0" fill="none" stroke="#c68570" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="177" cy="101" r="5" fill="#ce9a6f"/><circle cx="190" cy="91" r="2" fill="#ce9a6f"/>
    <rect width="760" height="460" fill="url(#scene-grain)" pointerEvents="none"/>
  </svg>;
}
