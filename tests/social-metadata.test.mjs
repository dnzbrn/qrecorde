import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/social-metadata.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {eventMetadata,socialOrigin} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const origin = 'https://qrecorde.com.br';
const festa = {name:'Festa da Comunidade',slug:'festa-comunidade',pageTitle:'Nossa festa 2026',pageMessage:'Um presente especial para você.',giftMessage:'Obrigado!',coverImageKey:'organizers/123/capa festa.png'};
test('shared link uses the event identity and cover in both social formats', () => {
  const metadata = eventMetadata(festa,origin);
  assert.equal(metadata.title,'Nossa festa 2026 | QRecorde');
  assert.equal(metadata.description,festa.pageMessage);
  assert.equal(metadata.openGraph.siteName,'QRecorde');
  assert.equal(metadata.openGraph.url,origin+'/p/festa-comunidade');
  assert.equal(metadata.openGraph.images[0].url,origin+'/media/organizers/123/capa%20festa.png');
  assert.deepEqual(metadata.twitter.images,metadata.openGraph.images);
  assert.equal(metadata.twitter.title,metadata.title);
  assert.equal(metadata.twitter.description,metadata.description);
  assert.equal(metadata.twitter.card,'summary_large_image');
});
test('second event and missing covers never inherit the generic brand image', () => {
  const metadata = eventMetadata({...festa,name:'Festa Junina',pageTitle:'',pageMessage:'',slug:'junina',coverImageKey:null},origin);
  assert.equal(metadata.title,'Festa Junina | QRecorde');
  assert.equal(metadata.description,'Obrigado!');
  assert.deepEqual(metadata.openGraph.images,[]);
  assert.deepEqual(metadata.twitter.images,[]);
  assert.equal(metadata.twitter.card,'summary');
  const missing = eventMetadata(null,origin);
  assert.equal(missing.robots.index,false);
  assert.deepEqual(missing.openGraph.images,[]);
});
test('absolute URLs only use known hosts and never an untrusted forwarded host', () => {
  assert.equal(socialOrigin('qrecorde.com.br'),origin);
  assert.equal(socialOrigin('localhost:3000'),'http://localhost:3000');
  assert.equal(socialOrigin('attacker.example'),'https://qrecorde.brunonevesdiniz.workers.dev');
});
test('public route supplies metadata server-side and realization uses event name', async () => {
  const page = await readFile(new URL('../app/p/[slug]/page.tsx',import.meta.url),'utf8');
  const layout = await readFile(new URL('../app/layout.tsx',import.meta.url),'utf8');
  const component = await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(page,/use client|useEffect/);
  assert.match(page,/export async function generateMetadata/);
  assert.match(page,/eventName=\{event.name\}/);
  assert.match(component,/<span>Realização<\/span><b>\{eventName \|\| pageTitle\}<\/b>/);
  assert.doesNotMatch(component,/<b>Santuário/);
  assert.match(layout,/og-qrecorde\.png/);
  assert.doesNotMatch(layout,/x-forwarded-host|\/og\.png/);
});
