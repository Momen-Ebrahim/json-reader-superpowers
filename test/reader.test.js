const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { readJsonFiles } = require('../src/reader');

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-data-'));
}

test('readJsonFiles returns a warning when data folder is missing', async () => {
  const root = await tempDir();
  const result = await readJsonFiles(path.join(root, 'data'));

  assert.deepEqual(result.files, []);
  assert.deepEqual(result.warnings, ['Data folder not found: data']);
});

test('readJsonFiles reads a single object JSON file', async () => {
  const root = await tempDir();
  const dataDir = path.join(root, 'data');
  await fs.mkdir(dataDir);
  await fs.writeFile(path.join(dataDir, 'post.json'), JSON.stringify({ title: 'One' }));

  const result = await readJsonFiles(dataDir);

  assert.equal(result.warnings.length, 0);
  assert.deepEqual(result.files, [{ fileName: 'post.json', objects: [{ title: 'One' }] }]);
});

test('readJsonFiles reads array JSON files', async () => {
  const root = await tempDir();
  const dataDir = path.join(root, 'data');
  await fs.mkdir(dataDir);
  await fs.writeFile(path.join(dataDir, 'posts.json'), JSON.stringify([{ title: 'One' }, { title: 'Two' }]));

  const result = await readJsonFiles(dataDir);

  assert.deepEqual(result.files, [{ fileName: 'posts.json', objects: [{ title: 'One' }, { title: 'Two' }] }]);
});

test('readJsonFiles skips invalid JSON files with warnings', async () => {
  const root = await tempDir();
  const dataDir = path.join(root, 'data');
  await fs.mkdir(dataDir);
  await fs.writeFile(path.join(dataDir, 'broken.json'), '{');

  const result = await readJsonFiles(dataDir);

  assert.deepEqual(result.files, []);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /broken\.json contains invalid JSON/);
});

test('readJsonFiles skips primitive JSON roots with warnings', async () => {
  const root = await tempDir();
  const dataDir = path.join(root, 'data');
  await fs.mkdir(dataDir);
  await fs.writeFile(path.join(dataDir, 'number.json'), '7');

  const result = await readJsonFiles(dataDir);

  assert.deepEqual(result.files, []);
  assert.deepEqual(result.warnings, ['number.json must contain an object or an array of objects.']);
});
