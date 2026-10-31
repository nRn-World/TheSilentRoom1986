// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ModeGate from './ModeGate';
import { estimatedMeters } from './steps';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
const reply = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as Response;
describe('privacy-first mode selection', () => {
  beforeEach(()=>{localStorage.clear();sessionStorage.clear();window.history.replaceState({},'','/');vi.spyOn(globalThis,'fetch').mockImplementation(async()=>{throw Error('Private mode must never call server')});});
  afterEach(()=>{cleanup();vi.restoreAllMocks()});
  it('starts with two explicit modes and does not send requests for the private mode',()=>{
    render(<ModeGate />);
    expect(screen.getByText('Offline · utan GPS')).toBeDefined();
    expect(screen.getByText('Tillsammans · live')).toBeDefined();
    fireEvent.click(screen.getByText('Offline · utan GPS')); 
    expect(screen.getByText('Nära varandra. Bara här.')).toBeDefined();
    fireEvent.click(screen.getByText(/Läs steg från telefonen/));
    expect(screen.getByRole('status').textContent).toContain('installerad iPhone- eller Android-app');
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem('stride-token')).toBeNull();
  });
  it('offers named flags and translates the landing before a mode is selected',()=>{
    render(<ModeGate />);
    expect(screen.getByRole('button',{name:/Svenska/})).toBeDefined();
    expect(screen.getByRole('button',{name:/Dansk/})).toBeDefined();
    fireEvent.click(screen.getByRole('button',{name:/English/}));
    expect(screen.getByText('How will you walk?')).toBeDefined();
    fireEvent.click(screen.getByRole('button',{name:/Dansk/}));
    expect(screen.getByText('Hvordan vil I gå?')).toBeDefined();
    expect(localStorage.getItem('stride-lang')).toBeNull();
  });
  it('converts steps to an explicitly estimated distance',()=>{
    expect(estimatedMeters(1000)).toBe(750);
  });
  it('does not pretend the OAuth integration works without configuration',()=>{
    render(<ModeGate />);fireEvent.click(screen.getByText('Tillsammans · live'));
    expect(screen.getByText('Fortsätt med Google').closest('button')?.disabled).toBe(true);
    expect(screen.getByText('Fortsätt med Apple').closest('button')?.disabled).toBe(true);
    expect(screen.getByText(/Inloggning väntar på konfiguration/)).toBeDefined();
  });
  it('lets the tester open the app without Google or Apple, using sample data only',()=>{
    render(<ModeGate />);fireEvent.click(screen.getByText('Tillsammans · live'));
    fireEvent.click(screen.getByText(/Testa appen utan konto/));
    expect(screen.getByText(/TESTLÄGE/)).toBeDefined();
    expect(screen.getAllByText('FÖRHANDSVISNING').length).toBeGreaterThan(0);
    expect(screen.getByText(/Så här kan din grupp se ut/)).toBeDefined();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem('stride-token')).toBeNull();
    fireEvent.click(screen.getByText('Avsluta test'));
    expect(screen.getByText('Hur vill ni gå?')).toBeDefined();
    expect(sessionStorage.getItem('stride-test-mode')).toBeNull();
  });
  it('creates a nickname account without email and opens the app with it',async()=>{
    const sent: {url:string; body:Record<string,unknown>}[] = [];
    vi.spyOn(globalThis,'fetch').mockImplementation(async(input,init)=>{
      const url=String(input);
      if(url==='/api/accounts'){sent.push({url,body:JSON.parse(String(init?.body))});return reply({token:'account-token',me:{id:'person-1',name:'Lina',distances:{}}})}
      if(url==='/api/state')return reply({me:{id:'person-1',name:'Lina',distances:{}},groups:[]});
      throw Error('Unexpected request: '+url);
    });
    render(<ModeGate />);
    fireEvent.click(screen.getByText('Tillsammans · live'));
    fireEvent.change(screen.getByLabelText('Smeknamn'),{target:{value:'Lina'}});
    fireEvent.change(screen.getByLabelText('Din kod'),{target:{value:'1234'}});
    fireEvent.click(screen.getByRole('button',{name:'Skapa konto'}));
    await waitFor(()=>expect(localStorage.getItem('stride-account')).toContain('Lina'));
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe('/api/accounts');
    expect(sent[0].body).toEqual({nickname:'Lina',code:'1234'});
    expect(localStorage.getItem('stride-token')).toBe('account-token');
    await waitFor(()=>expect(screen.getByText(/LIVE · Plats visas aldrig för andra/)).toBeDefined());
  });
  it('deletes the account and everything on it after an explicit confirmation',async()=>{
    const calls: string[] = [];
    vi.spyOn(globalThis,'fetch').mockImplementation(async(input,init)=>{
      const url=String(input);
      calls.push((init?.method||'GET')+' '+url);
      if(url==='/api/accounts'&&init?.method==='DELETE')return reply({deleted:true});
      if(url==='/api/state')return reply({me:{id:'person-1',name:'Lina',distances:{}},groups:[]});
      throw Error('Unexpected request: '+url);
    });
    localStorage.setItem('stride-account',JSON.stringify({token:'account-token',name:'Lina'}));
    localStorage.setItem('stride-token','account-token');
    const confirm = vi.spyOn(window,'confirm').mockReturnValue(true);
    render(<ModeGate />);
    fireEvent.click(screen.getByRole('button',{name:'Radera kontot'}));
    await waitFor(()=>expect(localStorage.getItem('stride-account')).toBeNull());
    expect(confirm).toHaveBeenCalled();
    expect(calls).toContain('DELETE /api/accounts');
    expect(localStorage.getItem('stride-token')).toBeNull();
    expect(screen.getByText('Hur vill ni gå?')).toBeDefined();
  });
  it('stacks the footer tag on two centred lines instead of wrapping',()=>{
    render(<ModeGate />);
    const lines=document.querySelector('.landing-tag-lines');
    expect(lines).not.toBeNull();
    expect(Array.from(lines!.children).map(child=>child.textContent)).toEqual(['ETT STEG I TAGET,','TILLSAMMANS.']);
    fireEvent.click(screen.getByRole('button',{name:/English/}));
    expect(Array.from(document.querySelector('.landing-tag-lines')!.children).map(child=>child.textContent)).toEqual(['ONE STEP AT A TIME,','TOGETHER.']);
  });
  it('draws a real star everywhere the landing uses a mark, never a wingding glyph',()=>{
    const { container } = render(<ModeGate />);
    expect(container.textContent).not.toMatch(/[✳✻✱]/);
    for (const selector of ['.landing-kicker-star','.stamp-star','.mode-option-star','.landing-tag-star','.caption-star']) {
      expect(container.querySelector(selector+' svg')).not.toBeNull();
    }
  });
  it('credits the maker in the footer with reachable links',()=>{
    render(<ModeGate />);
    const site=screen.getByRole('link',{name:'nrnworld.one'});
    expect(site.getAttribute('href')).toBe('https://nrnworld.one');
    expect(site.getAttribute('rel')).toContain('noopener');
    const mail=screen.getByRole('link',{name:'bynrnworld@gmail.com'});
    expect(mail.getAttribute('href')).toBe('mailto:bynrnworld@gmail.com');
    expect(screen.getByText(/Skapad av/)).toBeDefined();
    fireEvent.click(screen.getByRole('button',{name:/English/}));
    expect(screen.getByText(/Created by/)).toBeDefined();
  });
});
