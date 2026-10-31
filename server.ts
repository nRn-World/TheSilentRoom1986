import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { countActivities, recordWalk, type Walk } from './activity';

const app = express();
const authClient = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {auth:{persistSession:false}}) : null;

// Only the installed app and explicitly configured web origins may call the API cross-origin.
app.use('/api',(req,res,next)=>{
  const allowed = ['capacitor://localhost','https://localhost',...(process.env.APP_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)];
  const origin=req.headers.origin;
  if(origin&&allowed.includes(origin)){
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, DELETE, OPTIONS');
  }
  if(req.method==='OPTIONS')return res.sendStatus(origin&&allowed.includes(origin)?204:403);
  next();
});
app.use(express.json({ limit: '20kb' }));
const DATA = join(process.cwd(), 'data', 'steps.json');
type GoalType = 'day' | 'week' | 'weekend' | 'month' | 'year';
type Account = { nickname: string; salt: string; hash: string };
type Person = { id: string; token: string; name: string; distances: Record<string, number>; activities?: Walk[]; lastMovementAt?: number; oauthSubject?: string; account?: Account;  };
type GoalScope = 'each' | 'together';
type Group = { mode?: 'connected'; id: string; code: string; pairCode?: string; name: string; ownerId: string; members: string[]; memberNames?: Record<string, string>; banned: string[]; goals: { id: string; type: GoalType; target: number; scope?: GoalScope }[]; partners?: string[]; likes: Record<string, string[]>; createdAt: number };
type DB = { people: Person[]; groups: Group[] };
// A goal is either for each walker ('each') or for the whole group together ('together').
const goalKey = (g: { type: GoalType; scope?: GoalScope }) => `${g.type}:${g.scope === 'each' ? 'each' : 'together'}`;
// Two teams pair up with a short code. Only their together goals are shared, never members or personal goals.
const PAIR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nextPairCode = () => { for (;;) { let out = ''; const bytes = randomBytes(6); for (let i = 0; i < 6; i++) out += PAIR_ALPHABET[bytes[i] % PAIR_ALPHABET.length]; if (!db.groups.some(g => g.pairCode === out)) return out; } };
const METERS_PER_STEP = 0.75;
let db: DB = { people: [], groups: [] };
try { db = JSON.parse(readFileSync(DATA, 'utf8')); } catch { /* new instance */ }
const save = () => { mkdirSync(join(process.cwd(), 'data'), { recursive: true }); writeFileSync(DATA, JSON.stringify(db)); };
// Migrate old records: the server must never retain historic GPS coordinates.
if (db.people.some(p => 'lastFix' in p)) {
  for (const p of db.people) delete (p as Person & {lastFix?:unknown}).lastFix;
  save();
}
const id = () => randomBytes(12).toString('hex');
// JWTs are verified server-side for every connected request. Never trust a client-supplied user id.
app.use('/api', async (req, res, next) => {
  const bearer = req.headers.authorization?.replace(/^Bearer /, '');
  if (!bearer || !bearer.includes('.')) return next(); // Existing anonymous prototype identities only.
  if (!authClient) return fail(res, 503, 'Inloggning är inte konfigurerad på servern.');
  try {
    const { data, error } = await authClient.auth.getUser(bearer);
    if (error || !data.user || !['google','apple'].includes(data.user.app_metadata?.provider)) return fail(res, 401, 'Logga in med Google eller Apple.');
    let p = db.people.find(item => item.oauthSubject === data.user.id);
    if (!p) { p = makePerson('Vandrare'); p.oauthSubject = data.user.id; save(); }
    (req as express.Request & { verifiedPerson?: Person }).verifiedPerson = p;
    next();
  } catch { return fail(res, 401, 'Inloggningen kunde inte verifieras.'); }
});
const dateKey = (time = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(time);
// Same period rules as the app, so a partner card never disagrees with the group's own goal card.
const metersFor = (distances: Record<string, number>, period: GoalType) => {
  const today = dateKey();
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const now = new Date(`${today}T12:00:00Z`).getTime();
  return Object.entries(distances || {}).reduce((sum, [day, meters]) => {
    const at = new Date(`${day}T12:00:00Z`);
    if (Number.isNaN(at.getTime())) return sum;
    const daysAgo = Math.round((now - at.getTime()) / 86400000);
    let valid = false;
    if (period === 'day') valid = day === today;
    if (period === 'week') valid = daysAgo >= 0 && daysAgo < weekday + 1;
    if (period === 'weekend') valid = daysAgo >= 0 && daysAgo < weekday + 1 && (at.getUTCDay() === 0 || at.getUTCDay() === 6);
    if (period === 'month') valid = day.slice(0, 7) === today.slice(0, 7);
    if (period === 'year') valid = day.slice(0, 4) === today.slice(0, 4);
    return valid ? sum + (Number(meters) || 0) : sum;
  }, 0);
};
const groupSteps = (g: Group, period: GoalType) => Math.floor(g.members.reduce((sum, mid) => sum + metersFor(db.people.find(p => p.id === mid)?.distances || {}, period), 0) / METERS_PER_STEP);
// Only the shared picture leaves a group: its name, size and together goals. No names, no personal goals.
const partnerSummary = (g: Group) => ({ id: g.id, name: g.name, memberCount: g.members.length,
  goals: g.goals.filter(goal => goalKey(goal) !== `${goal.type}:each`).map(goal => ({ type: goal.type, target: goal.target, steps: groupSteps(g, goal.type) })),
  steps: { day: groupSteps(g, 'day'), week: groupSteps(g, 'week'), month: groupSteps(g, 'month') } });
const person = (req: express.Request) => (req as express.Request & {verifiedPerson?:Person}).verifiedPerson || db.people.find(p => !p.oauthSubject && (p.token === req.body?.token || p.token === req.headers.authorization?.replace(/^Bearer /, '')));
const fail = (res: express.Response, status: number, message: string) => res.status(status).json({ error: message });
const view = (g: Group, viewer: Person) => ({ id: g.id, viewerId: viewer.id, name: g.name, code: g.code, isAdmin: g.ownerId === viewer.id,
  partners: (g.partners || []).map(pid => db.groups.find(x => x.id === pid)).filter((x): x is Group => !!x).map(partnerSummary),
  ...(g.ownerId === viewer.id ? { pairCode: g.pairCode || null } : {}),
  goals: g.goals, members: g.members.map(mid => { const p = db.people.find(x => x.id === mid)!; return { id: p.id, name: g.memberNames?.[p.id] || p.name, distances: p.distances, activityCounts: countActivities(p.activities || []), isAdmin: p.id === g.ownerId, liked: (g.likes[`${dateKey()}:${p.id}`] || []).includes(viewer.id), likes: (g.likes[`${dateKey()}:${p.id}`] || []).length, active: !!p.lastMovementAt && Date.now() - p.lastMovementAt < 90000 }; }) });
app.get('/api/state', (req, res) => { const p = person(req); if (!p) return fail(res, 401, 'Sessionen hittades inte. Ange ett namn igen.'); res.json({ me: { id: p.id, name: p.name, distances: p.distances }, groups: db.groups.filter(g => g.members.includes(p.id)).map(g => view(g,p)) }); });
const validName = (input: unknown) => typeof input === 'string' ? input.trim().replace(/\s+/g, ' ') : '';
const makePerson = (name: string): Person => { const p: Person = { id: id(), token: id() + id(), name, distances: {} }; db.people.push(p); return p; };
// A nickname account: no email, no OAuth provider. Only a nickname and a code the person chooses.
const codeHash = (code: string, salt: string) => scryptSync(code.normalize('NFKC'), salt, 32).toString('hex');
const accountByNickname = (nickname: string) => db.people.find(p => p.account && p.account.nickname.toLowerCase() === nickname.toLowerCase());
const accountPayload = (p: Person) => ({ token: p.token, me: { id: p.id, name: p.name, distances: p.distances } });
app.post('/api/accounts', (req, res) => {
  const nickname = validName(req.body.nickname);
  const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
  if (nickname.length < 3 || nickname.length > 32) return fail(res, 400, 'Smeknamnet måste vara 3 till 32 tecken.');
  if (code.length < 4 || code.length > 64) return fail(res, 400, 'Koden måste vara minst 4 tecken.');
  if (accountByNickname(nickname)) return fail(res, 409, 'Det finns redan ett konto med det smeknamnet. Logga in i stället.');
  const salt = randomBytes(16).toString('hex');
  const p = makePerson(nickname);
  p.account = { nickname, salt, hash: codeHash(code, salt) };
  p.token = id() + id();
  save();
  res.json(accountPayload(p));
});
app.post('/api/accounts/login', (req, res) => {
  const nickname = validName(req.body.nickname);
  const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
  const p = nickname ? accountByNickname(nickname) : undefined;
  if (!p || !p.account) return fail(res, 401, 'Hittade inget konto med det smeknamnet.');
  const expected = Buffer.from(p.account.hash, 'hex');
  const given = Buffer.from(codeHash(code, p.account.salt), 'hex');
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return fail(res, 401, 'Koden stämmer inte.');
  save();
  res.json(accountPayload(p));
});
app.post('/api/accounts/logout', (req, res) => {
  const p = person(req);
  if (!p) return fail(res, 401, 'Sessionen hittades inte.');
  p.token = id() + id();
  save();
  res.json({ signedOut: true });
});
// Deleting the account erases the person, every membership and every like in one go.
app.delete('/api/accounts', (req, res) => {
  const p = person(req);
  if (!p) return fail(res, 401, 'Sessionen hittades inte.');
  for (const g of db.groups) {
    if (!g.members.includes(p.id)) continue;
    g.members = g.members.filter(mid => mid !== p.id);
    if (g.memberNames) delete g.memberNames[p.id];
    for (const key of Object.keys(g.likes)) {
      if (key.endsWith(`:${p.id}`)) delete g.likes[key];
      else g.likes[key] = g.likes[key].filter(mid => mid !== p.id);
    }
    if (g.ownerId === p.id) g.ownerId = g.members[0] || '';
  }
  db.groups = db.groups.filter(g => g.members.length > 0);
  db.people = db.people.filter(x => x.id !== p.id);
  save();
  res.json({ deleted: true });
});
app.post('/api/profile', (req, res) => { const name = validName(req.body.name); if (name.length < 3 || name.length > 32) return fail(res, 400, 'Namnet måste vara 3 till 32 tecken.'); const p = makePerson(name); save(); res.json({ token: p.token }); });
app.get('/api/invite/:code', (req, res) => { const g = db.groups.find(g => g.code === req.params.code); if (!g) return fail(res, 404, 'Länken är ogiltig.'); res.json({ id: g.id, name: g.name, members: g.members.length }); });
app.post('/api/groups/:id/pair-code', (req, res) => { const p = person(req); const g = db.groups.find(g => g.id === req.params.id); if (!p || !g || g.ownerId !== p.id) return fail(res, 403, 'Bara gruppens skapare kan hämta koden.'); if (!g.pairCode) { g.pairCode = nextPairCode(); save(); } res.json({ code: g.pairCode }); });
app.get('/api/pair/:code', (req, res) => { const p = person(req); if (!p) return fail(res, 401, 'Sessionen hittades inte. Ange ett namn igen.'); const code = String(req.params.code || '').trim().toUpperCase(); const g = db.groups.find(g => !!g.pairCode && g.pairCode === code); if (!g) return fail(res, 404, 'Koden hittades inte. Be det andra teamet om en ny kod.'); res.json({ id: g.id, name: g.name, memberCount: g.members.length }); });
app.post('/api/groups/:id/partners', (req, res) => { const p = person(req); const g = db.groups.find(g => g.id === req.params.id); if (!p || !g || g.ownerId !== p.id) return fail(res, 403, 'Bara gruppens skapare kan para ihop grupper.'); const code = String(req.body.code || '').trim().toUpperCase(); if (!code) return fail(res, 400, 'Ange koden från det andra teamet.'); const other = db.groups.find(x => !!x.pairCode && x.pairCode === code); if (!other) return fail(res, 404, 'Koden hittades inte. Be det andra teamet om en ny kod.'); if (other.id === g.id) return fail(res, 400, 'Det är er egen kod. Använd koden från det andra teamet.'); g.partners ||= []; other.partners ||= []; if (g.partners.includes(other.id)) return fail(res, 409, 'De grupperna är redan ihopkopplade.'); if (g.partners.length >= 5) return fail(res, 409, 'En grupp kan vara ihopkopplad med högst fem grupper.'); g.partners.push(other.id); if (!other.partners.includes(g.id)) other.partners.push(g.id); save(); res.json(view(g, p)); });
app.delete('/api/groups/:id/partners/:partnerId', (req, res) => { const p = person(req); const g = db.groups.find(g => g.id === req.params.id); if (!p || !g || g.ownerId !== p.id) return fail(res, 403, 'Bara gruppens skapare kan koppla bort grupper.'); g.partners = (g.partners || []).filter(pid => pid !== req.params.partnerId); const other = db.groups.find(x => x.id === req.params.partnerId); if (other) other.partners = (other.partners || []).filter(pid => pid !== g.id); save(); res.json(view(g, p)); });
app.post('/api/groups', (req, res) => {
  const name = validName(req.body.name);
  const memberName = validName(req.body.memberName);
  if (name.length < 3 || name.length > 50) return fail(res, 400, 'Gruppnamnet måste vara 3 till 50 tecken.');
  if (req.body.memberName === undefined || req.body.goals === undefined) return fail(res, 400, 'Du använder ett gammalt formulär. Ladda om sidan för att välja namn och mål.');
  if (memberName.length < 3 || memberName.length > 32) return fail(res, 400, 'Välj ett namn i gruppen på 3 till 32 tecken.');
  const requested = req.body.goals;
  if (!Array.isArray(requested) || requested.length < 1 || requested.length > 10 || new Set(requested.map(g => goalKey(g))).size !== requested.length || requested.some(g => !['day','week','weekend','month','year'].includes(g?.type) || !Number.isInteger(g.target) || g.target < 100 || g.target > 10000000 || (g.scope !== undefined && !['each','together'].includes(g.scope)))) return fail(res, 400, 'Välj minst ett giltigt gruppmål.');
  let p = person(req);
  let recoveredToken: string | undefined;
  if (!p) { p = makePerson(memberName); recoveredToken = p.token; }
  const g: Group = { ...(p.oauthSubject ? {mode:'connected' as const} : {}), id: id(), code: randomBytes(8).toString('hex'), pairCode: nextPairCode(), name, ownerId: p.id, members: [p.id], memberNames: { [p.id]: memberName }, banned: [], goals: requested.map((goal: { type: GoalType; target: number; scope?: GoalScope }) => ({ id: id(), type: goal.type, target: goal.target, ...(goal.scope ? { scope: goal.scope } : {}) })), likes: {}, createdAt: Date.now() };
  db.groups.push(g); save(); res.json({ ...view(g,p), ...(recoveredToken ? { token: recoveredToken } : {}) });
});
app.post('/api/groups/:id/join', (req, res) => {
  const g = db.groups.find(g => g.id === req.params.id && g.code === req.body.code);
  if (!g) return fail(res, 404, 'Inbjudan hittades inte.');
  if (g.mode === 'connected' && !(req as express.Request & {verifiedPerson?:Person}).verifiedPerson) return fail(res, 401, 'Logga in för att gå med i den här gruppen.');
  if (g.mode !== 'connected' && (req as express.Request & {verifiedPerson?:Person}).verifiedPerson) return fail(res, 403, 'Den här gruppen använder det äldre gruppsystemet.');
  const memberName = validName(req.body.memberName);
  if (memberName.length < 3 || memberName.length > 32) return fail(res, 400, 'Välj ett namn i gruppen på 3 till 32 tecken.');
  let p = person(req);
  if (p && g.banned.includes(p.id)) return fail(res, 403, 'Du kan inte gå med i den här gruppen igen.');
  let recoveredToken: string | undefined;
  if (!p) { p = makePerson(memberName); recoveredToken = p.token; }
  if (!g.members.includes(p.id)) { g.members.push(p.id); g.memberNames ||= {}; g.memberNames[p.id] = memberName; }
  save(); res.json({ ...view(g,p), ...(recoveredToken ? { token: recoveredToken } : {}) });
});
app.patch('/api/groups/:id/name', (req, res) => {
  const p = person(req);
  const g = db.groups.find(g => g.id === req.params.id);
  if (!p || !g || !g.members.includes(p.id)) return fail(res, 403, 'Du tillhör inte den här gruppen.');
  const memberName = validName(req.body.memberName);
  if (memberName.length < 3 || memberName.length > 32) return fail(res, 400, 'Välj ett namn i gruppen på 3 till 32 tecken.');
  g.memberNames ||= {};
  g.memberNames[p.id] = memberName;
  save(); res.json(view(g,p));
});
app.post('/api/groups/:id/goals', (req, res) => { const p = person(req); const g = db.groups.find(g => g.id === req.params.id); if (!p || !g || g.ownerId !== p.id) return fail(res, 403, 'Endast gruppens skapare kan ändra mål.'); const type = req.body.type as GoalType; const target = Number(req.body.target); const scope: GoalScope | undefined = req.body.scope === 'each' ? 'each' : req.body.scope === 'together' ? 'together' : undefined; if (!['day','week','weekend','month','year'].includes(type) || !Number.isInteger(target) || target < 100 || target > 10000000) return fail(res,400,'Ogiltigt mål.'); if (g.goals.some(goal => goalKey(goal) === goalKey({ type, scope }))) return fail(res,409,'Det målet finns redan för den perioden.'); g.goals.push({ id: id(), type, target, ...(scope ? { scope } : {}) }); save(); res.json(view(g,p)); });
app.patch('/api/groups/:id/goals/:goalId', (req, res) => { const p = person(req); const g = db.groups.find(g => g.id === req.params.id); if (!p || !g || g.ownerId !== p.id) return fail(res,403,'Endast gruppens skapare kan ändra mål.'); const goal = g.goals.find(goal => goal.id === req.params.goalId); const target = Number(req.body.target); if (!goal || !Number.isInteger(target) || target < 100 || target > 10000000) return fail(res,400,'Ogiltigt mål.'); goal.target = target; save(); res.json(view(g,p)); });
app.delete('/api/groups/:id/goals/:goalId', (req, res) => { const p = person(req); const g = db.groups.find(g => g.id === req.params.id); if (!p || !g || g.ownerId !== p.id) return fail(res,403,'Endast gruppens skapare kan ändra mål.'); g.goals = g.goals.filter(goal => goal.id !== req.params.goalId); save(); res.json(view(g,p)); });
app.post('/api/groups/:id/leave', (req, res) => {
  const p = person(req);
  const g = db.groups.find(g => g.id === req.params.id);
  if (!p || !g || !g.members.includes(p.id)) return fail(res, 403, 'Du är inte med i den här gruppen.');
  g.members = g.members.filter(mid => mid !== p.id);
  if (g.memberNames) delete g.memberNames[p.id];
  for (const key of Object.keys(g.likes)) {
    if (key.endsWith(`:${p.id}`)) delete g.likes[key];
    else g.likes[key] = g.likes[key].filter(mid => mid !== p.id);
  }
  if (g.members.length === 0) db.groups = db.groups.filter(group => group.id !== g.id);
  else if (g.ownerId === p.id) g.ownerId = g.members[0];
  save(); res.json({ left: true, deleted: g.members.length === 0 });
});
app.post('/api/groups/:id/remove', (req, res) => { const p = person(req); const g = db.groups.find(g => g.id === req.params.id); const mid = String(req.body.memberId); if (!p || !g || g.ownerId !== p.id || mid === p.id || !g.members.includes(mid)) return fail(res,403,'Du kan inte ta bort den här personen.'); g.members = g.members.filter(x => x !== mid); g.banned.push(mid); save(); res.json(view(g,p)); });
app.post('/api/groups/:id/like', (req, res) => { const p = person(req); const g = db.groups.find(g => g.id === req.params.id); const mid = String(req.body.memberId); if (!p || !g || !g.members.includes(p.id) || !g.members.includes(mid) || p.id === mid) return fail(res,403,'Det gick inte att gilla.'); const key = `${dateKey()}:${mid}`; const likes = g.likes[key] || []; g.likes[key] = likes.includes(p.id) ? likes.filter(x => x !== p.id) : [...likes,p.id]; save(); res.json(view(g,p)); });
// Only distance and quality metadata reach this server. No lat/lon or routes are accepted.
app.post('/api/track', (req, res) => {
  const p = person(req);
  if (!p) return fail(res,401,'Sessionen hittades inte.');
  if ('lat' in req.body || 'lon' in req.body) return fail(res,400,'GPS-positioner får inte skickas till servern.');
  const { meters, seconds, accuracy } = req.body;
  if (![meters,seconds,accuracy].every((n:unknown)=>typeof n==='number'&&Number.isFinite(n)) || seconds<2 || seconds>300 || meters<8 || meters/seconds>3.2 || accuracy<0 || accuracy>40)
    return fail(res,400,'Ogiltig GPS-sträcka.');
  const now=Date.now();
  if (p.lastMovementAt && now-p.lastMovementAt<1800) return fail(res,429,'Vänta på nästa mätning.');
  const day=dateKey();
  p.distances[day]=Math.round((p.distances[day]||0)+meters);
  p.activities ||= [];
  recordWalk(p.activities,day,now,meters);
  p.lastMovementAt=now;
  save();
  res.json({distance:p.distances[day]});
});
if (existsSync(join(process.cwd(), 'dist', 'index.html'))) { app.use(express.static('dist', { setHeaders(res, file) { if (file.endsWith('index.html')) res.setHeader('Cache-Control', 'no-store'); } })); app.get('*', (_req,res) => { res.setHeader('Cache-Control', 'no-store'); res.sendFile(join(process.cwd(),'dist','index.html')); }); }
const port = Number(process.env.API_PORT || process.env.PORT || 3001);
app.listen(port, '0.0.0.0', () => console.log(`API listening on ${port}`));
