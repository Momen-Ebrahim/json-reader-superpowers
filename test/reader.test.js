const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { readJsonData } = require('../src/reader');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'json-reader-'));
}

test('readJsonData returns a warning when the data directory is missing', () => {
  const root = makeTempDir();
  const dataDir = path.join(root, 'data');

  const result = readJsonData(dataDir);

  assert.deepEqual(result, {
    filesRead: 0,
    records: [],
    warnings: [
      {
        type: 'missing-data-directory',
        file: null,
        message: `Data directory not found: ${dataDir}`
      }
    ]
  });
});

test('readJsonData reads object and array JSON files in filename order', () => {
  const root = makeTempDir();
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir);
  fs.writeFileSync(path.join(dataDir, 'b.json'), JSON.stringify({ title: 'Object' }));
  fs.writeFileSync(path.join(dataDir, 'a.json'), JSON.stringify([{ title: 'First' }, { title: 'Second' }]));
  fs.writeFileSync(path.join(dataDir, 'ignore.txt'), 'not json');

  const result = readJsonData(dataDir);

  assert.equal(result.filesRead, 2);
  assert.deepEqual(result.records, [
    { sourceFile: 'a.json', value: { title: 'First' }, index: 0 },
    { sourceFile: 'a.json', value: { title: 'Second' }, index: 1 },
    { sourceFile: 'b.json', value: { title: 'Object' }, index: 0 }
  ]);
  assert.deepEqual(result.warnings, []);
});

test('readJsonData skips invalid JSON files and records warnings', () => {
  const root = makeTempDir();
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir);
  fs.writeFileSync(path.join(dataDir, 'broken.json'), '{not valid json');

  const result = readJsonData(dataDir);

  assert.equal(result.filesRead, 1);
  assert.deepEqual(result.records, []);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].type, 'invalid-json');
  assert.equal(result.warnings[0].file, 'broken.json');
  assert.match(result.warnings[0].message, /^broken\.json contains invalid JSON:/);
});

test('readJsonData skips root JSON values that are neither object nor array', () => {
  const root = makeTempDir();
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir);
  fs.writeFileSync(path.join(dataDir, 'number.json'), '42');

  const result = readJsonData(dataDir);

  assert.equal(result.filesRead, 1);
  assert.deepEqual(result.records, []);
  assert.deepEqual(result.warnings, [
    {
      type: 'invalid-json-root',
      file: 'number.json',
      message: 'number.json must contain one object or an array of objects'
    }
  ]);
});
