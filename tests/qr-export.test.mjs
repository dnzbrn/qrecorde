import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import QRCode from 'qrcode';

const source = await readFile(new URL('../lib/qr-export.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const { trackedQrUrl, qrFilename, printQrOptions } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('export preserves campaign, query and fragment; principal is only a fallback', () => {
  const campaign = 'https://example.com/p/festa?utm_source=qr_cartaz&other=1#presente';
  assert.equal(trackedQrUrl(campaign),campaign);
  assert.equal(trackedQrUrl('/p/festa?other=1#presente','https://example.com'),'https://example.com/p/festa?other=1&utm_source=qr_principal#presente');
  assert.throws(()=>trackedQrUrl('javascript:alert(1)'));
});
test('download filename handles event names safely', () => {
  assert.equal(qrFilename('Festa São João / Cartaz'),'qr-festa-sao-joao-cartaz.png');
  assert.equal(qrFilename('✦'),'qr-evento.png');
  assert.ok(qrFilename('a'.repeat(200)).length <= 77);
});
test('print PNG has high-resolution square dimensions and uses a four-module quiet zone', async () => {
  const target = trackedQrUrl('https://example.com/p/festa?utm_source=qr_impressao');
  const png = await QRCode.toBuffer(target, {...printQrOptions,type:'png'});
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  // The renderer can round the requested width down by one pixel.
  assert.ok(png.readUInt32BE(16) >= 2047 && png.readUInt32BE(16) <= 2048);
  assert.equal(png.readUInt32BE(20),png.readUInt32BE(16));
  assert.equal(printQrOptions.margin,4);
  assert.deepEqual(printQrOptions.color,{dark:'#000000',light:'#ffffff'});
  assert.equal(printQrOptions.errorCorrectionLevel,'H');
});
