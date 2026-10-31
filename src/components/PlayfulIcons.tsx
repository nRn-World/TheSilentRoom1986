import type { SVGProps } from 'react';

/** A small hand-drawn icon family for step.by.step. Shapes are deliberately asymmetric,
 * with a translucent secondary stroke so they retain their character at small sizes. */
type IconName = 'footprints' | 'activity' | 'trophy' | 'target' | 'users' | 'pin' | 'heart' | 'link' | 'share' | 'userPlus' | 'sparkles' | 'crown' | 'sun' | 'moon' | 'arrow' | 'plus' | 'settings' | 'menu' | 'shield' | 'help' | 'close' | 'check' | 'copy' | 'chevron' | 'star';
type Props = SVGProps<SVGSVGElement> & { size?: number | string };
const P = ({ children }: { children: React.ReactNode }) => <g stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none">{children}</g>;

function Artwork({ name, filled }: { name: IconName; filled?: boolean }) {
  switch (name) {
    case 'footprints': return <P><path d="M8 30c4-2 8-1 10 2l3 5c1 3-1 6-5 6H9c-3 0-5-2-5-5 0-4 1-6 4-8Z" fill="currentColor" opacity=".9" stroke="none"/><path d="M9 24c-1-3-2-6-1-8m5 8-1-11m5 13 1-10"/><path d="M27 19c2-4 6-5 9-2 4 4 6 10 6 14 0 3-2 5-5 5h-9c-3 0-5-3-4-6l3-11Z" fill="currentColor" opacity=".27" stroke="none"/><path d="M28 20c2-4 6-5 9-2 3 4 5 10 5 13 0 3-2 5-5 5h-9c-3 0-5-3-4-6l4-10Z"/><path d="M30 11V5m5 7 2-5m2 8 3-4"/></P>;
    case 'activity': return <P><path d="M5 34c4 0 5-4 9-4 5 0 5 5 10 5s6-10 11-10c3 0 4 2 8 2"/><path d="M7 23c4-8 13-12 22-10" opacity=".38"/><path d="m26 8 4 5-6 3"/><circle cx="37" cy="14" r="3" fill="currentColor" stroke="none"/><path d="M10 40h26" opacity=".38"/></P>;
    case 'trophy': return <P><path d="M13 8h22v10c0 11-4 16-11 16s-11-5-11-16V8Z" fill="currentColor" opacity=".16"/><path d="M13 9h22v10c0 10-4 15-11 15s-11-5-11-15V9Z"/><path d="M13 13H6c0 10 3 13 10 13m19-13h7c0 10-3 13-10 13"/><path d="M24 34v6m-8 3h16"/><path d="m24 14 1.9 3.8 4.1.6-3 3 .7 4.3-3.7-2-3.7 2 .7-4.3-3-3 4.1-.6Z" fill="currentColor" opacity=".85" stroke="none"/></P>;
    case 'target': return <P><path d="M39 20a16 16 0 1 1-11-11"/><path d="M32 22a9 9 0 1 1-8-7" opacity=".6"/><circle cx="24" cy="25" r="3.6" fill="currentColor" stroke="none"/><path d="m24 25 15-15m-5-3 5 3 2 5"/><path d="m8 6 1 3m-4 0 3-1" opacity=".45"/></P>;
    case 'users': return <P><circle cx="20" cy="16" r="6" fill="currentColor" opacity=".22"/><circle cx="20" cy="16" r="6"/><path d="M7 38c0-8 5-13 13-13s13 5 13 13v2H7v-2Z" fill="currentColor" opacity=".2"/><path d="M7 38c0-8 5-13 13-13s13 5 13 13v2H7v-2Z"/><path d="M31 12c4 0 7 3 7 7 0 2-1 4-3 5m3 4c3 2 5 5 5 10v2h-6"/><path d="m11 13 3-3m14 25 2-2" opacity=".6"/></P>;
    case 'pin': return <P><path d="M24 43S9 28 9 19a15 15 0 0 1 30 0c0 9-15 24-15 24Z" fill="currentColor" opacity=".16"/><path d="M24 43S9 28 9 19a15 15 0 0 1 30 0c0 9-15 24-15 24Z"/><path d="M18 21c2-4 5-5 9-3l3 2-3 5-4 2-5-3v-3Z" fill="currentColor" opacity=".85" stroke="none"/><path d="m15 7-2-3m22 3 2-3" opacity=".5"/></P>;
    case 'heart': return <P><path d="M24 40C16 34 5 27 5 17c0-6 4-10 10-10 4 0 7 2 9 6 2-4 5-6 9-6 6 0 10 4 10 10 0 10-11 17-19 23Z" fill={filled?'currentColor':'none'} strokeWidth="3.1"/><path d="m13 17 2-3m15 17 4-4" opacity={filled?'.45':'.6'} stroke={filled?'white':'currentColor'}/></P>;
    case 'link': return <P><path d="m20 17 5-5c4-4 10-4 14 0s4 10 0 14l-7 7c-4 4-10 4-14 0"/><path d="m28 31-5 5c-4 4-10 4-14 0s-4-10 0-14l7-7c4-4 10-4 14 0"/><path d="M18 29 30 17" opacity=".45"/></P>;
    case 'share': return <P><path d="M9 25v15h30V25"/><path d="M24 32V6m-8 9 8-9 8 9"/><path d="M5 16h5m28 0h5" opacity=".45"/></P>;
    case 'userPlus': return <P><circle cx="19" cy="16" r="7" fill="currentColor" opacity=".2"/><circle cx="19" cy="16" r="7"/><path d="M5 40v-3c0-7 5-12 14-12 6 0 10 2 12 6"/><path d="M37 25v15m-7-7.5h14"/><path d="m8 15-2-2" opacity=".5"/></P>;
    case 'sparkles': return <P><path d="m24 4 4 14 14 5-14 5-4 14-4-14-14-5 14-5 4-14Z" fill="currentColor" opacity=".2"/><path d="m24 4 4 14 14 5-14 5-4 14-4-14-14-5 14-5 4-14Z"/><path d="m7 5 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Zm34 31 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" fill="currentColor" stroke="none"/></P>;
    case 'crown': return <P><path d="m5 14 10 8 9-14 9 14 10-8-4 24H9L5 14Z" fill="currentColor" opacity=".24"/><path d="m5 14 10 8 9-14 9 14 10-8-4 24H9L5 14Z"/><path d="M12 41h24"/><circle cx="24" cy="27" r="3" fill="currentColor" stroke="none"/></P>;
    case 'sun': return <P><circle cx="24" cy="24" r="10" fill="currentColor" opacity=".23"/><circle cx="24" cy="24" r="10"/><path d="M24 3v6m0 30v6M3 24h6m30 0h6M9 9l4 4m22 22 4 4M39 9l-4 4M13 35l-4 4"/></P>;
    case 'moon': return <P><path d="M37 35A18 18 0 0 1 13 11a18 18 0 1 0 24 24Z" fill="currentColor" opacity=".24"/><path d="M37 35A18 18 0 0 1 13 11a18 18 0 1 0 24 24Z"/><path d="m33 6 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Zm9 12 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" fill="currentColor" stroke="none"/></P>;
    case 'arrow': return <P><path d="M7 24h33m-13-13 13 13-13 13"/></P>;
    case 'plus': return <P><path d="M24 7v34M7 24h34"/><circle cx="24" cy="24" r="17" opacity=".22"/></P>;
    case 'settings': return <P><path d="M7 12h34M7 24h34M7 36h34"/><circle cx="17" cy="12" r="4" fill="currentColor" opacity=".2"/><circle cx="32" cy="24" r="4" fill="currentColor" opacity=".2"/><circle cx="19" cy="36" r="4" fill="currentColor" opacity=".2"/></P>;
    case 'menu': return <P><path d="M8 12h32M8 24h24M8 36h32"/><circle cx="39" cy="24" r="2" fill="currentColor" stroke="none"/></P>;
    case 'shield': return <P><path d="M24 4 40 10v12c0 11-6 17-16 22C14 39 8 33 8 22V10L24 4Z" fill="currentColor" opacity=".17"/><path d="M24 4 40 10v12c0 11-6 17-16 22C14 39 8 33 8 22V10L24 4Z"/><path d="m16 24 6 6 11-12"/></P>;
    case 'help': return <P><path d="M24 43c10 0 18-8 18-18S34 7 24 7 6 15 6 25s8 18 18 18Z"/><path d="M19 19a5 5 0 0 1 10 1c0 4-5 5-5 9m0 6v1"/><path d="m11 10 2-3" opacity=".5"/></P>;
    case 'close': return <P><path d="M11 11 37 37M37 11 11 37"/></P>;
    case 'check': return <P><path d="m7 25 11 10L41 12"/><path d="m7 13 3-3" opacity=".4"/></P>;
    case 'copy': return <P><rect x="14" y="13" width="28" height="30" rx="5"/><path d="M33 13V9a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v22a4 4 0 0 0 4 4h4"/><path d="M21 23h14m-14 7h9" opacity=".45"/></P>;
    // A real five-pointed star, used wherever the landing page marks a sentence.
    case 'star': return <g fill="currentColor" stroke="none"><path d="M24 3.4 29.6 16.5 43.7 17.8 32.9 27 36.3 40.8 24 33.6 11.7 40.8 15.1 27 4.3 17.8 18.4 16.5Z"/></g>;
  }
}
function icon(name: IconName) {
  return function PlayfulIcon({ size = 24, fill, ...props }: Props) {
    return <svg {...props} className={['playful-icon', props.className].filter(Boolean).join(' ')} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg"><Artwork name={name} filled={fill === 'currentColor'}/></svg>;
  };
}
export const Footprints = icon('footprints');
export const Activity = icon('activity');
export const Trophy = icon('trophy');
export const Target = icon('target');
export const Users = icon('users');
export const MapPin = icon('pin');
export const Heart = icon('heart');
export const Link2 = icon('link');
export const Share2 = icon('share');
export const UserPlus = icon('userPlus');
export const Sparkles = icon('sparkles');
export const Crown = icon('crown');
export const Sun = icon('sun');
export const Moon = icon('moon');
export const ArrowRight = icon('arrow');
export const Plus = icon('plus');
export const Settings2 = icon('settings');
export const Menu = icon('menu');
export const ShieldCheck = icon('shield');
export const CircleHelp = icon('help');
export const X = icon('close');
export const Check = icon('check');
export const Copy = icon('copy');
export const ChevronDown = icon('chevron');
export const Star = icon('star');
