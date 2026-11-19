// Exercises the actual Workers runtime and its local D1 binding without a Cloudflare account.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const {unstable_splitSqlQuery: splitSQL} = require('wrangler');
const {Miniflare, convertV4MiniflareOptions} = createRequire(require.resolve('wrangler'))('miniflare');
const workerRoot = new URL('../../shared-worker/', import.meta.url);
const reader = 'local-reader';
const writer = 'local-writer';
const hitters = ['local-primary', 'local-backup'];
const grants = Object.fromEntries(hitters.map((token, i) => [
  createHash('sha256').update(token).digest('hex'),
  {id: i + 1, role: 'skull', faction: 57819, expires: Date.now() + 3600000}
]));
const runtime = new Miniflare(convertV4MiniflareOptions({
  cf: false, host: '127.0.0.1',
  workers: [{
    name: 'warstaxx-shared-orders', compatibilityDate: '2026-10-01',
    modules: ['index.js', 'command.js'].map(name => ({
      type: 'ESModule', path: fileURLToPath(new URL('src/' + name, workerRoot))
    })),
    modulesRoot: fileURLToPath(new URL('src/', workerRoot)),
    d1Databases: {DB: 'disposable-war-command'},
    bindings: {FACTION_ID: '57819', SHARED_READ_TOKEN: reader, SHARED_WRITE_TOKEN: writer,
      MEMBER_GRANTS: JSON.stringify(grants)}
  }]
}));
const legacy = 'http://war.test/v1/factions/57819/wars/211/orders';
const command = 'http://war.test/v2/factions/57819/wars/211/command';

async function request(url, token, data, revision) {
  const options = {headers: {Authorization: 'Bearer ' + token}};
  if (data !== undefined) {
    options.method = 'PUT';
    options.headers['If-Match'] = String(revision);
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify({data});
  }
  const response = await runtime.dispatchFetch(url, options);
  return {status: response.status, body: await response.json()};
}
function checked(response, status = 200) {
  assert.equal(response.status, status, JSON.stringify(response.body));
  return response.body;
}

try {
  const original = checked(await request(legacy, writer, {heavyPolicy: {version: 2, mode: 'relative'}}, 0));
  assert.equal(original.revision, 1);
  checked(await request(command, reader), 503);

  const db = await runtime.getD1Database('DB', 'warstaxx-shared-orders');
  const migrations = new URL('migrations/', workerRoot);
  for (const filename of readdirSync(migrations).filter(f => f.endsWith('.sql')).sort()) {
    const statements = splitSQL(readFileSync(new URL(filename, migrations), 'utf8'));
    await db.batch(statements.map(sql => db.prepare(sql)));
  }
  assert.deepEqual(checked(await request(legacy, reader)), original);
  assert.equal(checked(await request(command, reader)).revision, 0);

  const assign = {type: 'assign', target: 44, primary: 1, backups: [2], priority: 90};
  const concurrent = await Promise.all([request(command, writer, assign, 0), request(command, writer, assign, 0)]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
  assert.equal(checked(concurrent.find(r => r.status === 200)).revision, 1);

  const claims = await Promise.all(hitters.map(token => request(command, token, {type: 'claim', target: 44}, 1)));
  assert.deepEqual(claims.map(r => r.status).sort(), [200, 409]);
  const winner = claims.findIndex(r => r.status === 200);
  assert.equal(claims[winner].body.ops.claims[44].hitter, winner + 1);
  checked(await request(command, hitters[1 - winner], {type: 'release', target: 44}, 2), 403);
  checked(await request(command, hitters[winner], {type: 'release', target: 44}, 2));
  checked(await request(command, writer, {type: 'lock', target: 44, reason: 'Hold this assignment'}, 3));
  checked(await request(command, hitters[0], {type: 'unlock', target: 44}, 4), 403);
  checked(await request(command, writer, assign, 4), 409);

  const room = checked(await request(command, reader));
  assert.equal(room.revision, 4);
  assert.deepEqual(room.events.map(e => e.revision), [4, 3, 2, 1]);
  assert.equal(room.plan.assignments[44].primary, 1);
  assert.equal(checked(await request(command.replace('/211/', '/212/'), reader)).revision, 0);
  console.log('Passed workerd/D1 migration, concurrent assignments and claims, release ownership, locks, audit and war isolation.');
} finally {
  await runtime.dispose();
}
