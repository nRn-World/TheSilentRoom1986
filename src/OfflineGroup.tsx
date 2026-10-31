import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { BluetoothLowEnergy } from '@capgo/capacitor-bluetooth-low-energy';
import type { PluginListenerHandle } from '@capacitor/core';
import { ArrowRight, Footprints, Users, X, Check } from './components/PlayfulIcons';
import { bytes, cleanWalkName, MAX_WALKERS, newWalkId, readGroupName, readPacket, type WalkMember, type WalkRoster } from './offlineProtocol';
import { modeText, type ModeLanguage } from './modeText';
import { suggestNickname } from './nicknames';
import { formatSteps } from './format';

const SERVICE='e672a300-c4be-429e-89ec-df1477a51101';
const CHANNEL='e672a301-c4be-429e-89ec-df1477a51101';
const props={read:false,write:true,notify:true,writeWithoutResponse:false,broadcast:false,indicate:false,authenticatedSignedWrites:false,extendedProperties:false};
type Peer={id:string;name:string};
export default function OfflineGroup({steps,language,accountName}:{steps:number;language:ModeLanguage;accountName?:string}) {
  const t=modeText[language];
  const [nickname,setNickname]=useState(()=>accountName||suggestNickname(language));
  const [walkName,setWalkName]=useState('');
  const [role,setRole]=useState<'idle'|'host'|'searching'|'joining'|'member'>('idle');
  const [code,setCode]=useState('');
  const [peers,setPeers]=useState<Peer[]>([]);
  const [pending,setPending]=useState<WalkMember[]>([]);
  const [roster,setRoster]=useState<WalkRoster|null>(null);
  const [error,setError]=useState('');
  const listeners=useRef<PluginListenerHandle[]>([]);
  const peerId=useRef<string|null>(null);
  const me=useRef(newWalkId());
  const latest=useRef(steps);latest.current=steps;
  const accepted=useRef<WalkMember[]>([]);
  const pendingRef=useRef<{member:WalkMember;deviceId:string}[]>([]);
  const approvedPeers=useRef<Record<string,string>>({});
  const modeRef=useRef(role);modeRef.current=role;
  const hostName=useRef(walkName);hostName.current=walkName;
  const rosterRef=useRef<WalkRoster|null>(null);
  const publish=async (members:WalkMember[])=>{
    const next:WalkRoster={v:1,kind:'roster',name:hostName.current,members};
    if(bytes(next).length>510){setError(t.limited);return;}
    rosterRef.current=next;setRoster(next);
    // GATT is not readable. Send the roster ONLY to approved, subscribed peers.
    // Each message is small enough for common BLE MTUs; no nearby stranger can read a public roster.
    for(const deviceId of Object.values(approvedPeers.current)){
      await BluetoothLowEnergy.notifyGattCharacteristicChanged({service:SERVICE,characteristic:CHANNEL,deviceId,value:[...new TextEncoder().encode(JSON.stringify({v:1,kind:'group',name:next.name}))]});
      for(const member of members)await BluetoothLowEnergy.notifyGattCharacteristicChanged({service:SERVICE,characteristic:CHANNEL,deviceId,value:bytes({v:1,kind:'step',member})});
    }
  };
  const dispose=async()=>{
    const handles=listeners.current.splice(0);await Promise.allSettled(handles.map(h=>h.remove()));
    await Promise.allSettled([BluetoothLowEnergy.stopScan(),BluetoothLowEnergy.stopAdvertising(),...(peerId.current?[BluetoothLowEnergy.disconnect({deviceId:peerId.current})]:[])]);
    await BluetoothLowEnergy.removeGattService({service:SERVICE}).catch(()=>{});
    peerId.current=null;accepted.current=[];pendingRef.current=[];approvedPeers.current={};
  };
  useEffect(()=>()=>{void dispose()},[]);
  const stop=async()=>{
    if(!window.confirm(t.confirmEnd))return;
    await dispose();setRole('idle');setPeers([]);setPending([]);setRoster(null);setCode('');setNickname('');setWalkName('');setError('');
  };
  const prepare=async(mode:'central'|'peripheral')=>{
    if(!Capacitor.isNativePlatform())throw Error(t.offlineOnly);
    const available=await BluetoothLowEnergy.isAvailable();if(!available.available)throw Error(t.unavailable);
    await BluetoothLowEnergy.initialize({mode});
    await BluetoothLowEnergy.requestPermissions();
  };
  const start=async()=>{
    if(cleanWalkName(nickname).length<3||cleanWalkName(walkName).length<3)return;
    setError('');
    try{
      await prepare('peripheral');
      const walkCode=Array.from(crypto.getRandomValues(new Uint8Array(2))).map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
      const owner:WalkMember={id:me.current,name:cleanWalkName(nickname),steps:latest.current};
      accepted.current=[owner];hostName.current=cleanWalkName(walkName);
      await BluetoothLowEnergy.addGattService({service:SERVICE,characteristics:[{uuid:CHANNEL,properties:props,value:[]}]});
      listeners.current.push(await BluetoothLowEnergy.addListener('centralDisconnected',({deviceId})=>{
        const memberId=Object.keys(approvedPeers.current).find(id=>approvedPeers.current[id]===deviceId);
        if(!memberId)return;
        delete approvedPeers.current[memberId];accepted.current=accepted.current.filter(m=>m.id!==memberId);
        void publish(accepted.current).catch(()=>setError(t.bluetoothError));
      }));
      listeners.current.push(await BluetoothLowEnergy.addListener('gattCharacteristicWriteRequest',event=>{
        if(event.characteristic.toLowerCase()!==CHANNEL)return;
        const packet=readPacket(event.value);if(!packet)return;
        const member=packet.member;
        if(member.id===me.current)return;
        if(!accepted.current.some(m=>m.id===member.id)){
          if(!pendingRef.current.some(p=>p.member.id===member.id)){
            pendingRef.current=[...pendingRef.current,{member,deviceId:event.deviceId}];setPending(pendingRef.current.map(p=>p.member));
          }return;
        }
        if(approvedPeers.current[member.id]!==event.deviceId)return;
        accepted.current=accepted.current.map(m=>m.id===member.id?{...m,steps:Math.max(m.steps,member.steps)}:m);
        void publish(accepted.current).catch(()=>setError(t.bluetoothError));
      }));
      await BluetoothLowEnergy.startAdvertising({services:[SERVICE],name:'SV-'+walkCode,includeName:true});
      setCode(walkCode);setRole('host');await publish(accepted.current);
    }catch{await dispose();setError(t.bluetoothError);setRole('idle')}
  };
  const search=async()=>{
    if(cleanWalkName(nickname).length<3)return;
    setError('');
    try{
      await prepare('central');setRole('searching');
      listeners.current.push(await BluetoothLowEnergy.addListener('deviceScanned',({device})=>{
        if(!device.name?.startsWith('SV-'))return;
        setPeers(old=>old.some(p=>p.id===device.deviceId)?old:[...old,{id:device.deviceId,name:device.name!.slice(3)}]);
      }));
      await BluetoothLowEnergy.startScan({services:[SERVICE],timeout:0});
    }catch{await dispose();setRole('idle');setError(t.bluetoothError)}
  };
  const join=async(device:Peer)=>{
    setError('');
    try{
      await BluetoothLowEnergy.stopScan();await BluetoothLowEnergy.connect({deviceId:device.id});
      peerId.current=device.id;
      await BluetoothLowEnergy.requestMtu({deviceId:device.id,mtu:256}).catch(()=>{});
      await BluetoothLowEnergy.discoverServices({deviceId:device.id});
      listeners.current.push(await BluetoothLowEnergy.addListener('deviceDisconnected',({deviceId})=>{
        if(deviceId!==peerId.current)return;
        setRoster(null);setRole('idle');setCode('');setError(t.bluetoothError);
        void dispose();
      }));
      listeners.current.push(await BluetoothLowEnergy.addListener('characteristicChanged',event=>{
        if(event.characteristic.toLowerCase()!==CHANNEL)return;
        const packet=readPacket(event.value);
        if(packet){
          setRoster(previous=>{
            if(!previous)return previous;
            const members=previous.members.some(m=>m.id===packet.member.id)
              ? previous.members.map(m=>m.id===packet.member.id?packet.member:m)
              : [...previous.members,packet.member].slice(0,MAX_WALKERS);
            if(packet.member.id===me.current)setRole('member');
            return {...previous,members};
          });
        }else{
          // The host announces the group name first; the roster itself arrives only after approval.
          const name=readGroupName(event.value);
          if(name)setRoster({v:1,kind:'roster',name,members:[]});
        }
      }));
      await BluetoothLowEnergy.startCharacteristicNotifications({deviceId:device.id,service:SERVICE,characteristic:CHANNEL});
      setCode(device.name);setRole('joining');
    }catch{setError(t.bluetoothError);peerId.current=null;setRole('searching');await BluetoothLowEnergy.startScan({services:[SERVICE],timeout:0}).catch(()=>{})}
  };
  const approve=async(member:WalkMember)=>{
    if(accepted.current.length>=MAX_WALKERS){setError(t.full);return;}
    const request=pendingRef.current.find(p=>p.member.id===member.id);if(!request)return;
    pendingRef.current=pendingRef.current.filter(p=>p.member.id!==member.id);setPending(pendingRef.current.map(p=>p.member));
    approvedPeers.current[member.id]=request.deviceId;
    accepted.current=[...accepted.current,member];
    try{await publish(accepted.current)}catch{setError(t.bluetoothError)}
  };
  // Each active device periodically sends only its current step total; the host keeps a temporary roster.
  useEffect(()=>{
    if(role==='host'){
      accepted.current=accepted.current.map(member=>member.id===me.current?{...member,steps}:member);
      void publish(accepted.current).catch(()=>setError(t.bluetoothError));
    }
  },[steps,role]);
  useEffect(()=>{
    if(role!=='joining'&&role!=='member')return;
    let active=true;
    const exchange=async()=>{
      if(!peerId.current||!active)return;
      try{
        await BluetoothLowEnergy.writeCharacteristic({deviceId:peerId.current,service:SERVICE,characteristic:CHANNEL,value:bytes({v:1,kind:'step',member:{id:me.current,name:cleanWalkName(nickname),steps:latest.current}})});

      }catch{if(active)setError(t.bluetoothError)}
    };
    void exchange();const timer=window.setInterval(exchange,10000);
    return()=>{active=false;clearInterval(timer)};
  },[role,nickname,language]);
  return <section className="offline-walk" aria-label={t.groupTitle}>
    <div className="offline-walk-heading"><span><Users size={22}/></span><div><h2>{t.groupTitle}</h2><p>{t.groupHint}</p></div></div>
    {role==='idle'&&<div className="offline-fields"><label>{t.displayName}<input maxLength={24} minLength={3} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Glada Gåsen 42"/><small className="offline-name-hint">{t.nameHint}</small><button type="button" className="offline-suggest" onClick={()=>setNickname(suggestNickname(language))}>{t.suggest}</button></label><label>{t.groupName}<input maxLength={24} minLength={3} value={walkName} onChange={e=>setWalkName(e.target.value)} placeholder="Lunchpromenaden"/></label><div className="offline-actions"><button onClick={start} disabled={cleanWalkName(nickname).length<3||cleanWalkName(walkName).length<3}><Footprints size={17}/>{t.host}</button><button className="offline-join" onClick={search} disabled={cleanWalkName(nickname).length<3}><Users size={17}/>{t.discover}</button></div></div>}
    {role==='searching'&&<div className="offline-discovery"><h3>{t.nearby}</h3>{!peers.length&&<p>{t.waiting}</p>}{peers.map(peer=><button key={peer.id} onClick={()=>join(peer)}><span><span className="offline-signal"/> SV-{peer.name}</span><span>{t.join} <ArrowRight size={16}/></span></button>)}</div>}
    {(role==='host'||role==='joining'||role==='member')&&<div className="offline-session"><div className="offline-code"><span>{role==='host'?walkName:roster?.name||t.approval}</span><small>{t.code} · {code}</small></div>{role==='joining'&&<p role="status">{t.approval}</p>}{roster&&<div className="offline-members"><h3>{t.members} · {roster.members.length}/{MAX_WALKERS}</h3>{[...roster.members].sort((a,b)=>b.steps-a.steps).map((member,i)=><div key={member.id} className="offline-member"><span className="offline-rank">{String(i+1).padStart(2,'0')}</span><strong>{member.name}</strong><span>{formatSteps(member.steps,language)} {t.steps}</span></div>)}</div>}{role==='host'&&pending.map(member=><div className="offline-request" key={member.id}><span>{member.name} · {t.requests}</span><button onClick={()=>approve(member)}><Check size={16}/>{t.approve}</button></div>)}</div>}
    {role!=='idle'&&<button className="offline-stop" onClick={stop}><X size={16}/>{role==='host'?t.endWalk:t.leave}</button>}
    {error&&<p role="alert" className="mode-warning">{error}</p>}
    <p className="offline-footnote">{t.offlineOnly} {t.limited}</p>
  </section>;
}
