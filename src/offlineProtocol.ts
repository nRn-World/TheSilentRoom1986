/** Temporary BLE-only protocol. No coordinates, routes, emails or permanent identifiers. */
export type WalkMember = { id: string; name: string; steps: number };
export type WalkPacket = { v: 1; kind: 'step'; member: WalkMember };
export type WalkRoster = { v: 1; kind: 'roster'; name: string; members: WalkMember[] };
export type WalkGroupName = { v: 1; kind: 'group'; name: string };
export const MAX_WALKERS = 6;
export const cleanWalkName = (value: string) => value.trim().replace(/\s+/g,' ').slice(0,24);
const validMember = (value: unknown): value is WalkMember => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<WalkMember>;
  return typeof v.id==='string' && /^[a-f0-9]{12}$/.test(v.id) && typeof v.name==='string' && v.name===cleanWalkName(v.name) && v.name.length>=3 && Number.isInteger(v.steps) && (v.steps??-1)>=0 && (v.steps??Infinity)<=200000;
};
export const bytes = (value: WalkPacket|WalkRoster) => [...new TextEncoder().encode(JSON.stringify(value))];
export function readPacket(value: number[]): WalkPacket|null {
  try { if(value.length>240) return null; const parsed=JSON.parse(new TextDecoder().decode(new Uint8Array(value)));
    return parsed?.v===1 && parsed.kind==='step' && validMember(parsed.member) ? parsed as WalkPacket : null;
  } catch { return null; }
}
export function readRoster(value: number[]): WalkRoster|null {
  try { if(value.length>510) return null; const parsed=JSON.parse(new TextDecoder().decode(new Uint8Array(value)));
    return parsed?.v===1 && parsed.kind==='roster' && typeof parsed.name==='string' && parsed.name===cleanWalkName(parsed.name) && parsed.name.length>=3 && Array.isArray(parsed.members) && parsed.members.length<=MAX_WALKERS && parsed.members.every(validMember) && new Set(parsed.members.map((m:WalkMember)=>m.id)).size===parsed.members.length ? parsed as WalkRoster : null;
  } catch { return null; }
}
export function newWalkId() { return [...crypto.getRandomValues(new Uint8Array(6))].map(n=>n.toString(16).padStart(2,'0')).join(''); }
/** The host may announce the group name before anyone is approved; no member data is included. */
export function readGroupName(value: number[]): string|null {
  try { if(value.length>240) return null; const parsed=JSON.parse(new TextDecoder().decode(new Uint8Array(value)));
    return parsed?.v===1 && parsed.kind==='group' && typeof parsed.name==='string' && parsed.name===cleanWalkName(parsed.name) && parsed.name.length>=3 ? parsed.name : null;
  } catch { return null; }
}
