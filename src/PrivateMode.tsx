import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';
import { Footprints, ArrowRight, Target, ShieldCheck } from './components/PlayfulIcons';
import LanguagePicker from './components/LanguagePicker';
import OfflineGroup from './OfflineGroup';
import BrandMark from './components/BrandMark';
import { modeText, type ModeLanguage } from './modeText';
import { formatSteps, numberLocale } from './format';
import { estimatedMeters } from './steps';
import './mode.css';

type Totals = { day: number; week: number; month: number; year: number };
const startOf = (period: keyof Totals) => {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (period === 'week') d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  if (period === 'month') d.setDate(1);
  if (period === 'year') { d.setMonth(0); d.setDate(1); }
  return d.toISOString();
};

/** Health totals and nearby BLE group live only in memory. No fetch, API, or browser storage. */
export default function PrivateMode({ onBack, language, onLanguageChange, accountName }: { onBack: () => void; language: ModeLanguage; onLanguageChange: (next: ModeLanguage) => void; accountName?: string }) {
  const t=modeText[language];
  const [totals, setTotals] = useState<Totals>({ day: 0, week: 0, month: 0, year: 0 });
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [period, setPeriod] = useState<keyof Totals>('day');
  const [goal, setGoal] = useState(8000); // Memory only; never saved to disk or server.
  const refresh = useCallback(async () => {
    try {
      const endDate = new Date().toISOString();
      const periods: (keyof Totals)[] = ['day', 'week', 'month', 'year'];
      const values = await Promise.allSettled(periods.map(async key => {
        // Health Connect normally permits only recent history; never label a partial year as complete.
        const availableFrom = Capacitor.getPlatform()==='android'
          ? new Date(Math.max(new Date(startOf(key)).getTime(), Date.now()-29*86400000)).toISOString()
          : startOf(key);
        const { samples } = await Health.queryAggregated({ dataType: 'steps', startDate: availableFrom, endDate, bucket: 'day', aggregation: 'sum' });
        return samples.reduce((sum, sample) => sum + (Number(sample.value) || 0), 0);
      }));
      setTotals(Object.fromEntries(periods.map((key, index) => [key, values[index].status==='fulfilled' ? values[index].value : 0])) as Totals);
      setMessage(values.some(result=>result.status==='rejected') ? modeText[language].historyError : '');
    } catch { setMessage(modeText[language].historyError); }
  }, [language]);
  const connect = async () => {
    if (!Capacitor.isNativePlatform()) { setMessage(t.browserLimit); return; }
    try {
      const availability = await Health.isAvailable();
      if (!availability.available) { setMessage(t.noHealth); return; }
      await Health.requestAuthorization({ read: ['steps'], write: [] });
      const permission = await Health.checkAuthorization({ read: ['steps'], write: [] });
      if (!permission.readAuthorized.includes('steps')) { setMessage(t.noPermission); return; }
      setReady(true); await refresh();
    } catch { setMessage(t.healthError); }
  };
  useEffect(() => { if (!ready) return; const timer = window.setInterval(refresh, 15000); return () => clearInterval(timer); }, [ready, refresh]);
  const steps = totals[period];
  return <div className="mode-page private-page"><div className="mode-inner">
    <button className="mode-back" onClick={onBack}>← {t.back}</button><LanguagePicker value={language} onChange={onLanguageChange}/>
    <div className="mode-mark logo-mark"><BrandMark size={72}/></div>
    <p className="mode-eyebrow">{t.privateEyebrow}</p>
    <h1>{t.privateTitle}</h1>
    <p className="mode-intro">{t.privateIntro}</p>
    {!ready ? <div className="mode-panel"><h2>{t.privateReady}</h2><p>{t.privateReadyNote}</p><button className="mode-primary" onClick={connect}>{t.privateStart} <ArrowRight size={18}/></button></div> : <>
      <div className="private-tabs">{(['day','week','month','year'] as const).map(key=><button key={key} className={period===key?'chosen':''} onClick={()=>setPeriod(key)}>{t[key]}</button>)}</div>
      {Capacitor.getPlatform()==='android'&&<p className="private-history-note">{t.historyNote}</p>}
      <div className="private-stats"><article><Footprints size={25}/><span>{t.steps}</span><strong>{formatSteps(steps,language)}</strong></article><article><Target size={25}/><span>{t.distance}</span><strong>{(estimatedMeters(steps)/1000).toLocaleString(numberLocale(language),{maximumFractionDigits:2})} km</strong></article></div>
      <OfflineGroup steps={totals.day} language={language} accountName={accountName}/>
      <div className="mode-panel"><h2>{t.goal}</h2><label htmlFor="private-goal">{t.goalSteps}</label><input id="private-goal" type="number" min="100" max="100000" value={goal} onChange={e=>setGoal(Number(e.target.value))}/><p>{Math.min(100, Math.round(totals.day / Math.max(1,goal) * 100))}{t.goalEnd}</p></div>
    </>}
    {message && <p role="status" className="mode-warning">{message}</p>}
    <a className="mode-policy" href={"/privacypolicy.html?lang="+language} target="_blank" rel="noopener noreferrer">{t.dataLink}</a>
    <p className="mode-foot"><ShieldCheck size={17}/> {t.privateFoot}</p>
  </div></div>;
}
