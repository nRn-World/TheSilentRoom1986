import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { createClient, type Session } from '@supabase/supabase-js';
import App from './App';
import { setAccessToken } from './apiToken';
import PrivateMode from './PrivateMode';
import WalkingScene from './components/WalkingScene';
import LanguagePicker from './components/LanguagePicker';
import {modeText,type ModeLanguage} from './modeText';
import { Footprints, Users, MapPin, ArrowRight, Star } from './components/PlayfulIcons';
import BrandMark from './components/BrandMark';
import './mode.css';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** `initialMode`/`initialLanguage` exist so store screenshots and tests can render a given view
 * without a browser. In the app they are omitted and the stored choice decides. */
export default function ModeGate({ initialMode, initialLanguage }: { initialMode?: 'choose'|'private'|'connected'; initialLanguage?: ModeLanguage } = {}) {
  const [language,setLanguage]=useState<ModeLanguage>(()=>{
    if (initialLanguage) return initialLanguage;
    const stored=sessionStorage.getItem('pending-language')||localStorage.getItem('stride-lang')||'sv';
    return (['sv','da','en'] as const).includes(stored as ModeLanguage)?stored as ModeLanguage:'sv';
  });
  const m=modeText[language]||modeText.sv;
  useEffect(()=>{document.documentElement.lang=language},[language]);
  const [mode, setMode] = useState<'choose'|'private'|'connected'>(() => initialMode ?? (sessionStorage.getItem('pending-connected')==='yes'||localStorage.getItem('stride-account')?'connected':'choose'));
  const [auth, setAuth] = useState<ReturnType<typeof createClient>|null>(null);
  const [session, setSession] = useState<Session|null>(null);
  const [error, setError] = useState('');
  // A nickname account: no email, no Google/Apple. Stored as a token the app can use like any session.
  const [account, setAccount] = useState<{token:string;name:string}|null>(() => {
    try { const raw = localStorage.getItem('stride-account'); return raw ? JSON.parse(raw) as {token:string;name:string} : null; } catch { return null; }
  });
  const [accountNickname, setAccountNickname] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState('');
  // A clearly labelled test mode: the connected screens open with sample data, no account and no server calls.
  const [testMode, setTestMode] = useState(() => initialMode === 'connected' ? false : sessionStorage.getItem('stride-test-mode') === 'yes');
  const startTest = () => { localStorage.removeItem('stride-token'); setError(''); sessionStorage.setItem('stride-test-mode','yes'); setTestMode(true); };
  const endTest = () => { sessionStorage.removeItem('stride-test-mode'); setTestMode(false); setMode('choose'); };
  useEffect(() => {
    if(mode==='connected' && !auth && url && key) setAuth(createClient(url,key));
  },[mode,auth]);
  useEffect(() => {
    if (!auth) return;
    let listener: {remove:()=>Promise<void>}|undefined;
    if (Capacitor.isNativePlatform()) void NativeApp.addListener('appUrlOpen', async ({url:callback}) => {
      if (!callback.startsWith('app.stegvis.mobile://auth/callback')) return;
      await Browser.close();
      const hash = new URL(callback).hash.slice(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token'), refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        const {error:reason} = await auth.auth.setSession({access_token, refresh_token});
        if (reason) setError(m.loginFailed);
        else {sessionStorage.removeItem('pending-connected');setMode('connected');}
      } else setError(m.loginCancelled);
    }).then(handle => {listener=handle});
    auth.auth.getSession().then(({data})=>{setSession(data.session);if(data.session)sessionStorage.removeItem('pending-connected')}).catch(()=>setError(m.sessionError));
    const {data:{subscription}} = auth.auth.onAuthStateChange((_event, next)=>setSession(next));
    return () => {subscription.unsubscribe(); void listener?.remove();};
  }, [auth]);
  useEffect(() => { setAccessToken(mode==='connected' ? session?.access_token || '' : ''); return () => setAccessToken(''); }, [mode,session]);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const accountRequest = async (kind: 'create'|'login') => {
    if (accountBusy) return;
    setAccountBusy(true); setAccountError(''); setError('');
    try {
      const res = await fetch(apiBase + (kind === 'create' ? '/accounts' : '/accounts/login'), { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ nickname: accountNickname.trim(), code: accountCode }) });
      const data = await res.json().catch(() => ({})) as { token?:string; me?:{name?:string}; error?:string };
      if (!res.ok || !data.token) throw new Error(data.error || m.accountFailed);
      const name = data.me?.name || accountNickname.trim();
      localStorage.setItem('stride-token', data.token);
      localStorage.setItem('stride-account', JSON.stringify({ token:data.token, name }));
      localStorage.setItem('stride-lang', language);
      sessionStorage.removeItem('stride-test-mode'); setTestMode(false);
      setAccount({ token:data.token, name }); setAccountCode(''); setError('');
    } catch (e) { setAccountError(e instanceof Error && e.message ? e.message : m.accountFailed); }
    finally { setAccountBusy(false); }
  };
  const signOutAccount = async () => {
    if (!account) return;
    try { await fetch(apiBase + '/accounts/logout', { method:'POST', headers:{ Authorization:'Bearer ' + account.token } }); } catch { /* the token is cleared locally anyway */ }
    localStorage.removeItem('stride-account');
    localStorage.removeItem('stride-token');
    setAccount(null); sessionStorage.removeItem('pending-connected'); setMode('choose');
  };
  const deleteAccount = async () => {
    if (!account || !window.confirm(m.deleteConfirm)) return;
    setAccountError('');
    try {
      const res = await fetch(apiBase + '/accounts', { method:'DELETE', headers:{ Authorization:'Bearer ' + account.token } });
      if (!res.ok) throw new Error(m.accountFailed);
      localStorage.removeItem('stride-account');
      localStorage.removeItem('stride-token');
      setAccount(null); setMode('choose');
    } catch (e) { setAccountError(e instanceof Error && e.message ? e.message : m.accountFailed); }
  };
  const signIn = async (provider: 'google'|'apple') => {
    if (!auth) return;
    setError('');
    const native=Capacitor.isNativePlatform();
    sessionStorage.setItem('pending-connected','yes');
    sessionStorage.setItem('pending-language',language);
    const {data,error: reason} = await auth.auth.signInWithOAuth({provider,options:{redirectTo:native?'app.stegvis.mobile://auth/callback':window.location.origin + window.location.pathname,skipBrowserRedirect:native}});
    if (native && data.url && !reason) await Browser.open({url:data.url});
    if (reason) {sessionStorage.removeItem('pending-connected');setError(m.loginFailed);}
  };
  if (mode === 'choose') return <div className="landing"><div className="landing-paper">
    <header className="landing-nav">
      <a className="landing-brand" href="/" aria-label="step.by.step"><span className="landing-brand-mark"><BrandMark size={40}/></span><span>step<span className="brand-period">.</span>by<span className="brand-period">.</span>step</span></a>
      <span className="landing-nav-note">{m.nav}</span><LanguagePicker value={language} onChange={setLanguage}/>
      <a className="landing-nav-link" href={"/privacypolicy.html?lang="+language} target="_blank" rel="noopener noreferrer">{m.privacy} <span aria-hidden="true">↗</span></a>
    </header>
    <main>
      <div className="landing-main">
        <div className="landing-copy">
          <p className="landing-kicker"><span className="landing-kicker-star" aria-hidden="true"><Star size={17}/></span> {m.welcome}</p>
          <h1>{m.headlineStart}<br/>{m.headlineEnd} <em>{m.headlineAccent}</em></h1>
          <p className="landing-lead">{m.lead}</p>
          <a className="landing-jump" href="#val">{m.jump} <span aria-hidden="true">↓</span></a>
        </div>
        <div className="landing-art"><div className="landing-art-sun"/><WalkingScene/><span className="landing-art-stamp"><span>{m.artTop}</span><span className="stamp-star" aria-hidden="true"><Star size={26}/></span><span>{m.artBottom}</span></span><span className="landing-art-caption">{m.artCaption} <span className="caption-star" aria-hidden="true"><Star size={10}/></span></span></div>
      </div>
      <section className="landing-choices" id="val" aria-label={m.choose}>
        <div className="landing-choice-heading"><div><span className="landing-section-line"/><span>01 / 02</span><h2>{m.choose}</h2></div><p>{m.chooseSub}</p></div>
        <div className="mode-options">
          <button className="mode-option private-option" onClick={()=>setMode('private')}><span className="mode-option-top"><span className="mode-option-number">01</span><span className="mode-option-symbol"><Footprints size={27} strokeWidth={2.5}/></span></span><span className="mode-option-title">{m.localTitle} <span aria-hidden="true">↗</span></span><span className="mode-option-desc">{m.localDesc}</span><span className="mode-option-bottom">{m.localTag} <span className="mode-option-arrow"><ArrowRight size={18}/></span></span></button>
          <button className="mode-option together-option" onClick={()=>setMode('connected')}><span className="mode-option-top"><span className="mode-option-number">02</span><span className="mode-option-symbol"><Users size={27} strokeWidth={2.5}/></span></span><span className="mode-option-title">{m.liveTitle} <span className="mode-option-star" aria-hidden="true"><Star size={13}/></span></span><span className="mode-option-desc">{m.liveDesc}</span><span className="mode-option-bottom">{m.liveTag} <span className="mode-option-arrow"><ArrowRight size={18}/></span></span></button>
        </div>
      </section>
    </main>
    <footer className="landing-footer"><span className="landing-tag"><span className="landing-tag-star" aria-hidden="true"><Star size={11}/></span><span className="landing-tag-lines"><span>{m.footerLead}</span><span>{m.footerTail}</span></span></span><span className="landing-credit">{m.createdBy} <a href="https://nrnworld.one" target="_blank" rel="noopener noreferrer">nrnworld.one</a><span aria-hidden="true" className="credit-slash">/</span><a href="mailto:bynrnworld@gmail.com">bynrnworld@gmail.com</a></span><span>{m.footerEnd}</span></footer>
  </div></div>;
  if (mode === 'private') return <PrivateMode language={language} onLanguageChange={setLanguage} onBack={()=>setMode('choose')} accountName={account?.name}/>;
  if (account && mode === 'connected') return <div className="connected-shell"><div className="connected-banner"><span><MapPin size={15}/> {m.liveBanner}</span><div className="banner-actions"><button onClick={() => void signOutAccount()}>{m.logout}</button><button onClick={() => void deleteAccount()}>{m.deleteAccount}</button></div></div><App key={account.token} accessToken={account.token} initialLang={language}/></div>;
  if (testMode && !session) return <div className="connected-shell"><div className="connected-banner test-banner"><span><MapPin size={15}/> {m.testBanner}</span><button onClick={endTest}>{m.testExit}</button></div><App key="test-mode" initialLang={language}/></div>;
  if (session && auth) return <div className="connected-shell"><div className="connected-banner"><span><MapPin size={15}/> {m.liveBanner}</span><button onClick={async()=>{await auth.auth.signOut({scope:'local'});setAuth(null);setSession(null);sessionStorage.removeItem('pending-connected');setMode('choose')}}>{m.logout}</button></div><App key={session.user.id} accessToken={session.access_token} initialLang={language}/></div>;
  return <div className="mode-page"><div className="mode-inner"><button className="mode-back" onClick={()=>{sessionStorage.removeItem('pending-connected');setMode('choose')}}>← {m.back}</button><LanguagePicker value={language} onChange={setLanguage}/><div className="mode-mark logo-mark"><BrandMark size={72}/></div><p className="mode-eyebrow">{m.loginEyebrow}</p><h1>{m.loginTitle}</h1><p className="mode-intro">{m.loginIntro}</p><div className="mode-panel"><h2>{m.accountTitle}</h2><p>{m.accountNote}</p><form className="account-form" onSubmit={e=>{e.preventDefault();void accountRequest('login');}}><label htmlFor="account-nickname">{m.accountNickname}</label><input id="account-nickname" autoComplete="username" value={accountNickname} onChange={e=>setAccountNickname(e.target.value)} placeholder="Lina" minLength={3} maxLength={32} required/><label htmlFor="account-code">{m.accountCode}</label><input id="account-code" type="password" autoComplete="current-password" value={accountCode} onChange={e=>setAccountCode(e.target.value)} minLength={4} maxLength={64} required/><p className="account-hint">{m.accountCodeHint}</p><div className="account-actions"><button type="submit" disabled={accountBusy}>{m.accountLogin}</button><button type="button" className="secondary" disabled={accountBusy||accountNickname.trim().length<3||accountCode.trim().length<4} onClick={()=>void accountRequest('create')}>{m.accountCreate}</button></div></form>{accountError&&<p role="alert" className="mode-warning">{accountError}</p>}<div className="auth-divider">{m.accountDivider}</div><div className="auth-actions"><button onClick={()=>signIn('google')} disabled={!auth}>{m.google}</button><button onClick={()=>signIn('apple')} disabled={!auth}>{m.apple}</button></div>{!auth&&<p className="mode-warning">{m.oauthWait}</p>}{error&&<p role="alert" className="mode-warning">{error}</p>}</div><div className="test-entry"><button onClick={startTest}>{m.testEntry}<ArrowRight size={16}/></button><p>{m.testEntryHint}</p></div><a className="mode-policy" href={"/privacypolicy.html?lang="+language} target="_blank" rel="noopener noreferrer">{m.dataLink}</a></div></div>;
}
