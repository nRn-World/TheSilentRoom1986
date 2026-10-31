// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
const reply = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as Response;
const group = (name: string, memberName: string, token?: string) => ({ id: 'group-id', name, code: 'invite', isAdmin: true, goals: [], members: [{ id: 'member-id', name: memberName, distances: {}, isAdmin: true, liked: false, likes: 0, active: false }], ...(token ? { token } : {}) });

function enterNameAndGroup(name: string, groupName: string) {
  fireEvent.click(screen.getByText('Kom igång'));
  fireEvent.change(screen.getByPlaceholderText('Lunchpromenaden'), { target: { value: groupName } });
  fireEvent.change(screen.getByLabelText('Vad vill du bli kallad i den här gruppen?'), { target: { value: name } });
  fireEvent.click(screen.getByRole('dialog').querySelector('button[type=submit]')!);
}

describe('name to group creation', () => {
  afterEach(() => cleanup());
  beforeEach(() => { localStorage.clear(); window.history.replaceState({}, '', '/'); vi.restoreAllMocks(); });

  it('creates a name and group together without needing a prior server session', async () => {
    let submitted: Record<string, any> | undefined;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (input === '/api/groups') { submitted = JSON.parse(String(init?.body)); return reply(group('Team Walk', 'Anna Test', 'new-session')); }
      if (input === '/api/state') return reply({ me: { id: 'member-id', name: 'Anna Test', distances: {} }, groups: [group('Team Walk', 'Anna Test')] });
      throw new Error(`Unexpected request: ${input}`);
    });
    render(<App />);
    enterNameAndGroup('Anna Test', 'Team Walk');
    await waitFor(() => expect(submitted?.memberName).toBe('Anna Test'));
    expect(submitted?.name).toBe('Team Walk');
    expect(submitted?.goals).toEqual([{ type: 'day', target: 8000, scope: 'each' }, { type: 'week', target: 50000, scope: 'each' }]);
    expect(localStorage.getItem('stride-token')).toBe('new-session');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getAllByText('Team Walk').length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalledWith('/api/profile', expect.anything());
  });

  it('shows the group even when the follow-up state request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (input === '/api/groups') return reply(group('Lunchlaget', 'Robin', 'new-session'));
      if (input === '/api/state') return reply({ error: 'Sessionen hittades inte. Ange ett namn igen.' }, 401);
      throw new Error(`Unexpected request: ${input}`);
    });
    render(<App />);
    enterNameAndGroup('Robin', 'Lunchlaget');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getAllByText('Lunchlaget').length).toBeGreaterThan(0);
    expect(screen.queryByText('Sessionen hittades inte. Ange ett namn igen.')).toBeNull();
  });

  it('recovers an obsolete token while keeping a previously entered name', async () => {
    localStorage.setItem('stride-token', 'expired');
    localStorage.setItem('stride-name', 'Sara Test');
    let submitted: Record<string, any> | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (input === '/api/state') return reply({ error: 'Sessionen hittades inte. Ange ett namn igen.' }, 401);
      if (input === '/api/groups') { submitted = JSON.parse(String(init?.body)); return reply(group('Team Sara', 'Sara Test', 'recovered-session')); }
      throw new Error(`Unexpected request: ${input}`);
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Skapa grupp' }));
    fireEvent.change(screen.getByPlaceholderText('Lunchpromenaden'), { target: { value: 'Team Sara' } });
    expect((screen.getByLabelText('Vad vill du bli kallad i den här gruppen?') as HTMLInputElement).value).toBe('');
    fireEvent.change(screen.getByLabelText('Vad vill du bli kallad i den här gruppen?'), { target: { value: 'Sara Test' } });
    fireEvent.click(screen.getByRole('dialog').querySelector('button[type=submit]')!);
    await waitFor(() => expect(submitted?.memberName).toBe('Sara Test'));
    expect(localStorage.getItem('stride-token')).toBe('recovered-session');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getAllByText('Team Sara').length).toBeGreaterThan(0);
  });
  it('lets the creator choose monthly and yearly goals during creation', async () => {
    let submitted: Record<string, any> | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if(input==='/api/groups'){ submitted=JSON.parse(String(init?.body));return reply(group('Målgänget','Kim Walk','created-session'));}
      if(input==='/api/state')return reply({me:{id:'member-id',name:'Kim Walk',distances:{}},groups:[group('Målgänget','Kim Walk')]});
      throw Error(`Unexpected request: ${input}`);
    });
    render(<App />);
    fireEvent.click(screen.getByText('Kom igång'));
    fireEvent.change(screen.getByPlaceholderText('Lunchpromenaden'),{target:{value:'Målgänget'}});
    fireEvent.change(screen.getByLabelText('Vad vill du bli kallad i den här gruppen?'),{target:{value:'Kim Walk'}});
    fireEvent.click(screen.getByRole('checkbox',{name:'Månad'}));
    fireEvent.click(screen.getByRole('checkbox',{name:'År'}));
    fireEvent.click(screen.getByRole('checkbox',{name:'Vecka'}));
    fireEvent.change(screen.getByRole('spinbutton',{name:'Månad Antal steg'}),{target:{value:'250000'}});
    fireEvent.click(screen.getByRole('dialog').querySelector('button[type=submit]')!);
    await waitFor(()=>expect(submitted?.goals).toEqual([{type:'day',target:8000,scope:'each'},{type:'month',target:250000,scope:'each'},{type:'year',target:2400000,scope:'each'}]));
  });

  it('lets the creator add a shared goal for the whole group', async () => {
    let submitted: Record<string, any> | undefined;
    vi.spyOn(globalThis,'fetch').mockImplementation(async (input, init) => {
      if (input === '/api/groups') { submitted = JSON.parse(String(init?.body)); return reply(group('Team Walk','Anna Test','new-session')); }
      if (input === '/api/state') return reply({ me:{id:'member-id',name:'Anna Test',distances:{}}, groups:[group('Team Walk','Anna Test')] });
      throw new Error('Unexpected request: '+input);
    });
    render(<App />);
    fireEvent.click(screen.getByText('Kom igång'));
    fireEvent.change(screen.getByPlaceholderText('Lunchpromenaden'), { target: { value: 'Team Walk' } });
    fireEvent.change(screen.getByLabelText('Vad vill du bli kallad i den här gruppen?'), { target: { value: 'Anna Test' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Gemensamt mål' }));
    const shared = screen.getByLabelText('Gemensamt mål Antal steg') as HTMLInputElement;
    expect(shared.value).toBe('40000');
    fireEvent.click(screen.getByRole('dialog').querySelector('button[type=submit]')!);
    await waitFor(() => expect(submitted?.goals).toContainEqual({ type:'day', target:40000, scope:'together' }));
    expect(submitted?.goals).toContainEqual({ type:'day', target:8000, scope:'each' });
  });

  it('lets the group reach its shared goal even when one walker lags behind', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now());
    const member = (id: string, name: string, steps: number, isAdmin = false) => ({ id, name, distances:{ [today]: steps * 0.75 }, isAdmin, liked:false, likes:0, active:false });
    const g = { id:'group-1', name:'Femman', code:'invite', isAdmin:true,
      goals:[{ id:'a', type:'day', target:10000, scope:'each' },{ id:'b', type:'day', target:40000, scope:'together' }],
      members:[member('me','Jag',33000,true), member('bo','Bo',8000)] };
    vi.spyOn(globalThis,'fetch').mockImplementation(async input => {
      if(input==='/api/state')return reply({ me:{id:'me',name:'Jag',distances:{}},groups:[g] });
      throw Error(`Unexpected request: ${input}`);
    });
    render(<App />);
    await waitFor(() => expect(document.getElementById('goals')!.textContent).toContain('40'));
    const cards = Array.from(document.querySelectorAll('.goal-card'));
    expect(cards.length).toBe(2);
    const flat = (el: Element) => (el.textContent || '').replace(/\s/g, '');
    // The personal goal counts people who reached it.
    expect(flat(cards[0])).toContain('10000');
    expect(flat(cards[0])).toContain('1/2');
    // The shared goal adds the whole group together, so 8 000 steps still count.
    expect(flat(cards[1])).toContain('41000');
    expect(flat(cards[1])).toContain('40000');
    expect(flat(cards[1])).toContain('Målnått');
  });

  it('shows only the shared goals of a paired team, never its personal goal', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const partner = { id:'team-beta', name:'Beta laget', memberCount:4,
      goals:[{ type:'day', target:50000, steps:31200 },{ type:'week', target:300000, steps:120500 }],
      steps:{ day:31200, week:120500, month:480000 } };
    const g = { ...group('Alfa laget','Anna Test'), pairCode:'EJ88PQ', partners:[partner] };
    vi.spyOn(globalThis,'fetch').mockImplementation(async input => {
      if (input === '/api/state') return reply({ me:{ id:'member-id', name:'Anna Test', distances:{} }, groups:[g] });
      throw new Error('Unexpected request: '+input);
    });
    render(<App />);
    const section = await waitFor(() => {
      const found = document.getElementById('teams');
      expect(found?.textContent).toContain('Beta laget');
      return found!;
    });
    const text = (section.textContent || '').replace(/\s/g,'');
    expect(text).toContain('31200');
    expect(text).toContain('50000');
    expect(text).toContain('120500');
    expect(text).toContain('baragruppensmål');
    // A personal goal from the other team must never reach this screen.
    expect(text).not.toContain('10000');
    expect(section.querySelectorAll('.paired-goal').length).toBe(2);
  });

  it('copies the invite link even when the clipboard API is blocked', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    const exec = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: exec });
    const g = group('Alfa laget','Anna Test');
    vi.spyOn(globalThis,'fetch').mockImplementation(async input => {
      if (input === '/api/state') return reply({ me:{ id:'member-id', name:'Anna Test', distances:{} }, groups:[g] });
      throw new Error('Unexpected request: '+input);
    });
    render(<App />);
    fireEvent.click((await screen.findAllByText('Bjud in vänner'))[0]);
    fireEvent.click(screen.getByRole('button', { name: /Kopiera länk/ }));
    await waitFor(() => expect(exec).toHaveBeenCalledWith('copy'));
    await waitFor(() => expect(screen.getByRole('button', { name: /Kopierad/ })).toBeTruthy());
  });

  it('selects the invite link and explains how to copy when every method is blocked', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => false) });
    const g = group('Alfa laget','Anna Test');
    vi.spyOn(globalThis,'fetch').mockImplementation(async input => {
      if (input === '/api/state') return reply({ me:{ id:'member-id', name:'Anna Test', distances:{} }, groups:[g] });
      throw new Error('Unexpected request: '+input);
    });
    render(<App />);
    fireEvent.click((await screen.findAllByText('Bjud in vänner'))[0]);
    fireEvent.click(screen.getByRole('button', { name: /Kopiera länk/ }));
    await waitFor(() => expect(screen.getByText(/kopiera den manuellt/)).toBeTruthy());
    expect(String(window.getSelection()?.toString())).toContain('?join=');
  });

  it('copies the bare pair code and accepts a pasted pair link', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    let sent: Record<string, any> | undefined;
    const g = { ...group('Alfa laget','Anna Test'), pairCode:'EJ88PQ', partners:[] };
    const paired = { ...g, partners:[{ id:'team-beta', name:'Beta laget', memberCount:2, goals:[], steps:{ day:0, week:0, month:0 } }] };
    vi.spyOn(globalThis,'fetch').mockImplementation(async (input, init) => {
      if (input === '/api/state') return reply({ me:{ id:'member-id', name:'Anna Test', distances:{} }, groups:[g] });
      if (input === '/api/groups/group-id/partners') { sent = JSON.parse(String(init?.body)); return reply(paired); }
      throw new Error('Unexpected request: '+input);
    });
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Länka grupp' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kopiera kod' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('EJ88PQ'));
    fireEvent.change(screen.getByLabelText('Kod från det andra teamet'), { target: { value: 'https://example.test/?pair=tw66er' } });
    fireEvent.click(screen.getByRole('button', { name: 'Para ihop grupperna' }));
    await waitFor(() => expect(sent?.code).toBe('TW66ER'));
  });

  it('celebrates a personal goal with the matching day scene', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now());
    const g = { ...group('Alfa laget','Anna Test'), goals:[{ id:'g1', type:'day', target:8000, scope:'each' as const }] };
    g.members[0].distances = { [today]: 8400 * 0.75 };
    vi.spyOn(globalThis,'fetch').mockImplementation(async input => {
      if (input === '/api/state') return reply({ me:{ id:'member-id', name:'Anna Test', distances:g.members[0].distances }, groups:[g] });
      throw new Error('Unexpected request: '+input);
    });
    render(<App />);
    const card = await waitFor(() => {
      const found = document.querySelector('[data-testid=celebration]');
      expect(found).toBeTruthy();
      return found as HTMLElement;
    });
    expect(card.getAttribute('data-scene')).toBe('day');
    const text = (card.textContent || '').replace(/\s/g,'');
    expect(text).toContain('Måletnått!');
    expect(text).toContain('Idag·perperson');
    expect(text).toContain('Duklarademåletpå8000steg');
    expect(text).toContain('Duhar8400steg');
    fireEvent.click(screen.getByRole('button', { name: 'Fortsätt' }));
    await waitFor(() => expect(document.querySelector('[data-testid=celebration]')).toBeNull());
    expect(localStorage.getItem('stride-celebrated')).toContain('group-id:g1');
  });

  it('celebrates a shared group goal with the together scene', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now());
    const g = { ...group('Alfa laget','Anna Test'), goals:[{ id:'g2', type:'day', target:40000, scope:'together' as const }] };
    g.members[0].distances = { [today]: 41000 * 0.75 };
    vi.spyOn(globalThis,'fetch').mockImplementation(async input => {
      if (input === '/api/state') return reply({ me:{ id:'member-id', name:'Anna Test', distances:g.members[0].distances }, groups:[g] });
      throw new Error('Unexpected request: '+input);
    });
    render(<App />);
    const card = await waitFor(() => {
      const found = document.querySelector('[data-testid=celebration]');
      expect(found).toBeTruthy();
      return found as HTMLElement;
    });
    expect(card.getAttribute('data-scene')).toBe('together');
    expect((card.textContent || '').replace(/\s/g,'')).toContain('Helagruppenklarademåletpå40000steg');
    expect((card.textContent || '').replace(/\s/g,'')).toContain('Tillsammansharni41000steg');
  });

  it('ranks the linked teams in an animated analysis map', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now());
    const own = { ...group('Alfa laget','Anna Test'), goals:[{ id:'g1', type:'day', target:40000, scope:'together' as const }],
      partners:[{ id:'team-beta', name:'Beta laget', memberCount:4, goals:[{ type:'day' as const, target:50000, steps:41000 }], steps:{ day:41000, week:0, month:0 } }] };
    own.members[0].distances = { [today]: 30000 * 0.75 };
    vi.spyOn(globalThis,'fetch').mockImplementation(async input => {
      if (input === '/api/state') return reply({ me:{ id:'member-id', name:'Anna Test', distances:{} }, groups:[own] });
      throw new Error('Unexpected request: '+input);
    });
    render(<App />);
    const map = await waitFor(() => {
      const found = document.querySelector('.race-map');
      expect(found).toBeTruthy();
      return found as HTMLElement;
    });
    const rows = map.querySelectorAll('.race-row');
    expect(rows.length).toBe(2);
    expect(rows[0].classList.contains('leading')).toBe(true);
    expect(rows[0].textContent).toContain('Beta laget');
    expect(rows[0].textContent).toContain('Leder');
    expect(rows[1].textContent).toContain('Alfa laget');
    expect(rows[1].classList.contains('mine')).toBe(true);
    expect(rows[1].textContent).toContain('Du');
    const text = (map.textContent || '').replace(/\s/g,'');
    expect(text).toContain('Analyskarta');
    expect(text).toContain('Niligger11000stegefterBetalaget');
    expect(text).toContain('75%avmålet40000steg');
    // A linked comparison belongs above the leaderboard, right where the eye lands.
    const leaderboard = document.getElementById('leaderboard')!;
    const teams = document.getElementById('teams')!;
    expect(teams.compareDocumentPosition(leaderboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('pairs two teams with a shared code', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    let sent: Record<string, any> | undefined;
    const g = { ...group('Alfa laget','Anna Test'), pairCode:'EJ88PQ', goals:[{ id:'g1', type:'day', target:40000, scope:'together' }], partners:[] };
    const paired = { ...g, partners:[{ id:'team-beta', name:'Beta laget', memberCount:4, goals:[{ type:'day', target:50000, steps:0 }], steps:{day:0,week:0,month:0} }] };
    vi.spyOn(globalThis,'fetch').mockImplementation(async (input, init) => {
      if (input === '/api/state') return reply({ me:{ id:'member-id', name:'Anna Test', distances:{} }, groups:[g] });
      if (input === '/api/groups/group-id/partners') { sent = JSON.parse(String(init?.body)); return reply(paired); }
      throw new Error('Unexpected request: '+input);
    });
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Länka grupp' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('EJ88PQ');
    fireEvent.change(screen.getByLabelText('Kod från det andra teamet'), { target: { value: 'tw66er' } });
    fireEvent.click(screen.getByRole('button', { name: 'Para ihop grupperna' }));
    await waitFor(() => expect(sent?.code).toBe('TW66ER'));
    await waitFor(() => expect(document.getElementById('teams')!.textContent).toContain('Beta laget'));
  });

  it('lets a member change their name in an existing group without changing other groups', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const first = group('Lunchlaget', 'Robin');
    const other = { ...group('Efter jobbet', 'Andra Namnet'), id: 'other-group' };
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (input === '/api/state') return reply({me:{id:'member-id',name:'Robin',distances:{}},groups:[first,other]});
      if (input === '/api/groups/group-id/name') return reply({...first,members:[{...first.members[0],name:'Promenadproffset'}]});
      throw Error(`Unexpected request: ${input}`);
    });
    render(<App />);
    await screen.findAllByText('Lunchlaget');
    fireEvent.click(screen.getByRole('button',{name:'Ändra mitt namn'}));
    fireEvent.change(screen.getByLabelText('Vad vill du bli kallad i den här gruppen?'),{target:{value:'Promenadproffset'}});
    fireEvent.click(screen.getByRole('dialog').querySelector('button[type=submit]')!);
    await waitFor(()=>expect(screen.getAllByText('Promenadproffset').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Efter jobbet').length).toBeGreaterThan(0);
  });

  it('lists every joined group and only leaves after explicit confirmation', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const first = group('Lunchlaget', 'Robin');
    const other = { ...group('Kvällsturen', 'Robin'), id: 'group-two' };
    let leaveCalls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (input === '/api/state') return reply({ me: { id: 'member-id', name: 'Robin', distances: {} }, groups: [first, other] });
      if (input === '/api/groups/group-id/leave') { leaveCalls++; return reply({ left: true, deleted: false }); }
      throw Error(`Unexpected request: ${input}`);
    });
    render(<App />);
    const region = await screen.findByRole('region', {name:'Mina grupper'});
    expect(region.querySelectorAll('.membership-chip').length).toBe(2);
    expect(region.querySelector('.membership-chip.current')?.textContent).toContain('Lunchlaget');
    expect(region.textContent).toContain('Kvällsturen');
    fireEvent.click(screen.getByRole('button', {name:'Lämna grupp'}));
    expect(screen.getByText('Vill du lämna gruppen?')).toBeDefined();
    expect(leaveCalls).toBe(0);
    fireEvent.click(screen.getByRole('button', {name:'Avbryt'}));
    expect(leaveCalls).toBe(0);
    fireEvent.click(screen.getByRole('button', {name:'Lämna grupp'}));
    fireEvent.click(screen.getByRole('button', {name:'Ja, lämna gruppen'}));
    await waitFor(() => expect(leaveCalls).toBe(1));
    await waitFor(() => expect(region.querySelector('.membership-chip.current')?.textContent).toContain('Kvällsturen'));
    expect(region.querySelectorAll('.membership-chip').length).toBe(1);
  });

  it('shows only other members’ GPS activity counts in the group card', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now());
    const g = group('Promenader', 'Jag');
    g.members[0] = { ...g.members[0], activityCounts: { [today]: 5 } } as typeof g.members[0];
    g.members.push({ id:'someone-else', name:'Kollega', distances:{}, activityCounts:{[today]:2}, isAdmin:false, liked:false, likes:0, active:false } as typeof g.members[0]);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
      if(input==='/api/state')return reply({ me:{id:'member-id',name:'Jag',distances:{}},groups:[g] });
      throw Error(`Unexpected request: ${input}`);
    });
    render(<App />);
    const digest = await screen.findByLabelText('Andras aktiviteter per dag');
    expect(digest.textContent).toContain('Aktiviteter idag2');
    expect(digest.textContent).toContain('av andra i gruppen');
    expect(digest.textContent).not.toContain('7');
  });

  it('gives the podium gold, silver and bronze ranks', async () => {
    render(<App />);
    const ranks = Array.from(document.querySelectorAll('.leader-row .rank'));
    expect(ranks.length).toBeGreaterThanOrEqual(3);
    expect(ranks[0].className).toContain('rank-0');
    expect(ranks[1].className).toContain('rank-1');
    expect(ranks[2].className).toContain('rank-2');
    expect(ranks[3].className).not.toMatch(/rank-[0-2]/);
    // The whole podium carries a crown, in its own metal colour.
    expect(ranks[0].querySelector('svg')).not.toBeNull();
    expect(ranks[1].querySelector('svg')).not.toBeNull();
    expect(ranks[2].querySelector('svg')).not.toBeNull();
    expect(ranks[3].querySelector('svg')).toBeNull();
  });

  it('never marks a single member as live in the leaderboard', async () => {
    render(<App />);
    const rows = Array.from(document.querySelectorAll('.leader-row'));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.textContent).not.toContain('Live');
      expect(row.textContent).not.toContain('LIVE');
      expect(row.querySelector('.live-dot')).toBeNull();
    }
    // No row carries the green live dot any more.
    expect(document.querySelectorAll('.leader-list .live-dot, .leader-row .live-dot').length).toBe(0);
    // The section also drops the automatic update label.
    const leaderboard = document.getElementById('leaderboard')!;
    expect(leaderboard.textContent).not.toContain('Uppdateras automatiskt');
    expect(leaderboard.textContent).not.toContain('LIVE');
  });

  it('lets the preview group like a walk without a server', async () => {
    render(<App />);
    const like = await screen.findByRole('button', { name: 'Gilla Alex Morgan' });
    expect(like.textContent).toBe('8');
    expect(like.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(like);
    expect(like.textContent).toBe('9');
    expect(like.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(like);
    expect(like.textContent).toBe('8');
    expect(like.getAttribute('aria-pressed')).toBe('false');
  });

  it('gives every group its own leaderboard', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const first = { ...group('Första gruppen', 'Jag'), id: 'group-1', members: [
      { id: 'me-1', name: 'Jag', distances: { [new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now())]: 3000 }, isAdmin: true, liked: false, likes: 0, active: false },
      { id: 'anna', name: 'Anna', distances: {}, isAdmin: false, liked: false, likes: 0, active: false },
    ] };
    const second = { ...group('Andra gruppen', 'Jag'), id: 'group-2', members: [
      { id: 'me-2', name: 'Jag', distances: {}, isAdmin: true, liked: false, likes: 0, active: false },
      { id: 'bo', name: 'Bo', distances: {}, isAdmin: false, liked: false, likes: 0, active: false },
      { id: 'cissi', name: 'Cissi', distances: {}, isAdmin: false, liked: false, likes: 0, active: false },
    ] };
    vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
      if(input==='/api/state')return reply({ me:{id:'me-1',name:'Jag',distances:{}},groups:[first,second] });
      throw Error(`Unexpected request: ${input}`);
    });
    render(<App />);
    const board = () => document.getElementById('leaderboard')!;
    await waitFor(() => expect(board().textContent).toContain('Anna'));
    expect(board().textContent).toContain('Första gruppen');
    expect(board().textContent).not.toContain('Cissi');
    fireEvent.click(screen.getAllByRole('button', { name: /Andra gruppen/ })[0]);
    await waitFor(() => expect(board().textContent).toContain('Cissi'));
    expect(board().textContent).toContain('Andra gruppen');
    expect(board().textContent).not.toContain('Anna');
  });

  it('tells the walker at the bottom that GPS only measures distance', async () => {
    render(<App />);
    const note = document.querySelector('.gps-privacy');
    expect(note).not.toBeNull();
    const text = note!.textContent || '';
    expect(text).toContain('GPS används endast för att beräkna sträcka');
    expect(text).toContain('Din position stannar på telefonen');
    expect(text).toContain('delar aldrig var du har varit, är eller ska gå');
    // The old wording promised neither distance-only use nor privacy.
    expect(text).not.toContain('Endast GPS-uppskattade steg');
    expect(text).not.toContain('medan sidan är öppen');
  });

  it('keeps the brand mark in the sidebar of the live dashboard', async () => {
    render(<App />);
    const mark = document.querySelector('.brand .brand-icon .brand-mark-image');
    expect(mark).not.toBeNull();
    expect(mark?.getAttribute('src')).toBe('/brand-mark.png');
    expect(mark?.getAttribute('loading')).toBe('eager');
  });

  it('runs the activity bars Monday to Sunday and marks the weekend red', async () => {
    localStorage.setItem('stride-token', 'owner-token');
    const g = group('Promenader', 'Jag');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
      if(input==='/api/state')return reply({ me:{id:'member-id',name:'Jag',distances:{}},groups:[g] });
      throw Error(`Unexpected request: ${input}`);
    });
    render(<App />);
    const digest = await screen.findByLabelText('Andras aktiviteter per dag');
    const days = Array.from(digest.querySelectorAll('.activity-day'));
    expect(days.length).toBe(7);
    // Monday first, Sunday last – no week starting on Sunday.
    expect(days[0].className).not.toContain('is-weekend');
    expect(days[5].className).toContain('is-weekend');
    expect(days[6].className).toContain('is-weekend');
    const title = (i: number) => new Date(`${days[i].getAttribute('title')!.split(':')[0]}T12:00:00Z`).getUTCDay();
    expect(title(0)).toBe(1);   // Monday
    expect(title(5)).toBe(6);   // Saturday
    expect(title(6)).toBe(0);   // Sunday
    expect(days[6].textContent).toBe(new Intl.DateTimeFormat('sv',{weekday:'narrow'}).format(new Date(`${days[6].getAttribute('title')!.split(':')[0]}T12:00:00Z`)));
  });

});
