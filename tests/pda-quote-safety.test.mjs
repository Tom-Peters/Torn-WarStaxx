import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../WarStaxx.user.js', import.meta.url), 'utf8');

test('Torn PDA source begins with a valid userscript metadata block', () => {
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.match(source.slice(0, 1500), /^\/\/ @version\s+\d+\.\d+\.\d+/m);
  assert.match(source.slice(0, 2000), /^\/\/ @match\s+https:\/\/www\.torn\.com\/\*/m);
  assert.ok(source.indexOf('// ==/UserScript==') > 0);
});

test('Reject smart quotes that may be straightened by Torn PDA injection', () => {
  assert.doesNotMatch(source, /[\u2018\u2019\u201c\u201d]/u,
    'Smart quotes can turn otherwise valid single-quoted strings into pre-execution SyntaxError');
});

test('Exact full source parses after typographic quote normalisation', () => {
  assert.doesNotThrow(() => new Script(source, { filename: 'userscript.original.js' }));
  const normalised = source.replace(/[\u2018\u2019]/gu, "'").replace(/[\u201c\u201d]/gu, '"');
  assert.doesNotThrow(() => new Script(normalised, { filename: 'userscript.normalised.js' }));
});

test('War source stays ASCII-only while JavaScript escapes retain visual glyphs', () => {
  assert.doesNotMatch(source, /[^\x00-\x7f]/,
    'Keep War script entirely ASCII: encode UI symbols as JavaScript Unicode escapes');
  assert.match(source, /\\u26[0-9a-f]{2}/i, 'Retain UI icon via a JS Unicode escape');
  assert.match(source, /Compare observed online coverage for both factions/);
  assert.match(source, /individual player sleep schedules/);
});

