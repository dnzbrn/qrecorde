import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import ts from 'typescript';

const transpile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const source = await readFile(new URL('../lib/analytics.ts', import.meta.url), 'utf8');
const analytics = await import(`data:text/javascript;base64,${Buffer.from(transpile(source)).toString('base64')}`);
const { analyticsDay, dayStart, reportRange, analyticsCSV, localDaySQL, localHourSQL, metricSQL } = analytics;

test('Brasília date boundary and inclusive report end', () => {
  assert.equal(analyticsDay(Date.parse('2026-08-28T02:59:59Z')), '2026-08-27');
  assert.equal(analyticsDay(Date.parse('2026-08-28T03:00:00Z')), '2026-08-28');
  assert.deepEqual(reportRange('2026-08-27', '2026-08-27'), { start: Date.parse('2026-08-27T03:00:00Z'), end: Date.parse('2026-08-28T03:00:00Z') });
  for (const range of [[null, null], ['2026-02-30','2026-03-01'],['2026-08-28','2026-08-27'],['2025-01-01','2026-08-27']]) assert.throws(() => reportRange(...range));
  assert.doesNotThrow(() => reportRange('2024-02-29', '2024-02-29'));
});

test('SQL counts every action separately and excludes other events and end boundary', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE activity_events (event_id TEXT, action TEXT, source TEXT, created_at INTEGER); CREATE INDEX idx_activity_event_created ON activity_events(event_id,created_at)');
    const insert = db.prepare('INSERT INTO activity_events VALUES (?,?,?,?)');
    for (const action of ['view','view','open','download','story']) insert.run('mine',action,'qr_main',Date.parse('2026-08-28T02:30:00Z'));
    insert.run('other','view','direct',dayStart('2026-08-27'));
    insert.run('mine','view','direct',dayStart('2026-08-28'));
    const {start,end} = reportRange('2026-08-27','2026-08-27');
    const query = `SELECT ${localDaySQL} day,${localHourSQL} hour,source,${metricSQL} FROM activity_events WHERE event_id=? AND created_at>=? AND created_at<? GROUP BY day,hour,source ORDER BY day,hour,source`;
    assert.deepEqual(db.prepare(query).all('mine',start,end).map(row=>({...row})), [{day:'2026-08-27',hour:'23',source:'qr_main',views:2,opens:1,downloads:1,stories:1}]);
    assert.match(JSON.stringify(db.prepare('EXPLAIN QUERY PLAN '+query).all('mine',start,end)), /idx_activity_event_created/);
  } finally { db.close(); }
});

test('CSV has UTF-8 BOM, escaped cells, explicit types and neutralized formulas', () => {
  const csv = analyticsCSV('=HYPERLINK("bad")', [{day:'2026-08-27',hour:'23',source:' @formula;"x"',views:2,opens:1,downloads:3,stories:4}]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /Downloads da imagem do presente/);
  assert.match(csv, /Downloads da figurinha do Story/);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"\' @formula;""x"""'));
  assert.match(csv, /"2";"1";"3";"4"\r\n$/);
  assert.equal(analyticsCSV('Empty', []).split('\r\n').length, 2);
});

const routeSource = await readFile(new URL('../app/api/events/[id]/analytics/export/route.ts', import.meta.url), 'utf8');
const routeBody = transpile(routeSource.replace(/^import .*;\n/gm, '')).replaceAll('export ', '');
function route({ authenticated = true, owned = true } = {}) {
  let queries = 0;
  const runtimeEnv = { DB: { prepare(sql) { queries++; return { bind(...args) {
    if (sql.includes('owner_id')) assert.deepEqual(args, ['event-1','owner-1']);
    return { first: async () => owned ? {name:'My event'} : null, all: async () => ({results:[]}) };
  } }; } } };
  const bindings = { ...analytics, runtimeEnv, json:(data,status=200)=>Response.json(data,{status}), requireSession:async()=>{if(!authenticated)throw new Response('Unauthorized',{status:401});return {user:{id:'owner-1'}};} };
  return { get: new Function(...Object.keys(bindings), routeBody+';return GET;')(...Object.values(bindings)), queries:()=>queries };
}
const params = {params:Promise.resolve({id:'event-1'})};
test('export requires authentication and event ownership before reading activity', async () => {
  const unauthenticated = route({authenticated:false});
  assert.equal((await unauthenticated.get(new Request('https://test/export'),params)).status,401);
  assert.equal(unauthenticated.queries(),0);
  const otherOwner = route({owned:false});
  assert.equal((await otherOwner.get(new Request('https://test/export'),params)).status,404);
  assert.equal(otherOwner.queries(),1);
});
test('export rejects invalid range and returns a private CSV for valid empty period', async () => {
  const invalid = route();
  assert.equal((await invalid.get(new Request('https://test/export?from=bad&to=bad'),params)).status,400);
  assert.equal(invalid.queries(),1);
  const valid = route();
  const response = await valid.get(new Request('https://test/export?from=2026-08-27&to=2026-08-27'),params);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  assert.match(response.headers.get('content-disposition'), /analytics-2026-08-27-2026-08-27.csv/);
  assert.match(await response.text(), /Aberturas do presente/);
});

test('chart buttons select the day and expose its exact totals and 24 hours', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const panelSource = await readFile(new URL('../app/analytics-panel.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(panelSource.replace(/^import .*;\n/gm,''), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const state = []; let cursor = 0;
  const useState = initial => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => {state[index] = value;}]; };
  const bindings = {...analytics,useState};
  const exports = {};
  new Function('exports','require',...Object.keys(bindings),compiled)(exports,require,...Object.values(bindings));
  const props = {eventId:'event-1',today:'2026-08-27',loaded:true,daily:[{day:'2026-08-26',views:17,opens:4,downloads:3,stories:2}],hourly:[{day:'2026-08-26',hour:'19',views:17,opens:4,downloads:3,stories:2}]};
  const render = () => { cursor = 0; return exports.AnalyticsPanel(props); };
  const nodes = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree,...nodes(tree.props?.children)];
  const before = nodes(render());
  const bars = before.filter(node=>node.type==='button' && node.props['aria-pressed']!==undefined);
  assert.equal(bars.length,14);
  const yesterday = bars.find(node=>node.props['aria-label'].startsWith('26/08/2026'));
  assert.match(yesterday.props['aria-label'],/17 acessos/);
  yesterday.props.onClick();
  const after = nodes(render());
  assert.equal(after.find(node=>node.type==='button' && node.props['aria-pressed']).props['aria-label'],yesterday.props['aria-label']);
  assert.deepEqual(after.filter(node=>node.type==='dd').map(node=>node.props.children),['17','4','3','2']);
  assert.equal(after.filter(node=>node.type==='tbody')[0].props.children.length,24);
});
