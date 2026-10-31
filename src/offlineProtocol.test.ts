import {describe,it,expect} from 'vitest';
import {bytes,readGroupName,readPacket,readRoster,cleanWalkName,MAX_WALKERS} from './offlineProtocol';
const member={id:'aabbccddeeff',name:'Alex',steps:1723};
describe('ephemeral nearby step exchange',()=>{
 it('exchanges only member totals and never positions',()=>{
  const encoded=bytes({v:1,kind:'step',member});
  expect(readPacket(encoded)?.member).toEqual(member);
  expect(JSON.stringify(readPacket(encoded))).not.toMatch(/lat|lon|route|email/);
 });
 it('rejects invalid member names, step totals and oversized rosters',()=>{
  expect(readPacket(bytes({v:1,kind:'step',member:{...member,steps:-2}}))).toBeNull();
  expect(readPacket(bytes({v:1,kind:'step',member:{...member,name:'A'}}))).toBeNull();
  expect(readRoster(bytes({v:1,kind:'roster',name:'Lunch',members:Array.from({length:MAX_WALKERS+1},(_,i)=>({...member,id:i.toString(16).padStart(12,'0')}))}))).toBeNull();
  expect(cleanWalkName('  Min    grupp  ')).toBe('Min grupp');
  const groupName=[...new TextEncoder().encode(JSON.stringify({v:1,kind:'group',name:'Lunch'}))];
  expect(readGroupName(groupName)).toBe('Lunch');
  expect(readGroupName([...new TextEncoder().encode(JSON.stringify({v:1,kind:'group',name:'A'}))])).toBeNull();
 });
});
