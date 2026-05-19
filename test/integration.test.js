const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { buildSite } = require('../src/generator');

test('buildSite generates expected output for sample data', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-integration-'));
  const dataDir = path.join(fixtureRoot, 'data');
  const outputDir = path.join(fixtureRoot, 'output');
  const assetSourcePath = path.join(fixtureRoot, 'src', 'assets', 'style.css');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.writeFile(assetSourcePath, '.page-shell { max-width: 1120px; }');
  await fs.writeFile(path.join(dataDir, 'posts.json'), JSON.stringify([
    { title: 'Alpha New', slug: 'alpha', date: '2026-05-18', content: '<p>New</p>', tags: ['new'] },
    { title: 'Alpha Old', slug: 'alpha', date: '2026-01-01', content: 'Old', tags: [] },
    { title: 'Beta Draft', slug: 'beta', date: '2026-05-10', content: 'Draft', draft: true },
  ]));
  await fs.writeFile(path.join(dataDir, 'more.json'), JSON.stringify({
    title: 'Gamma',
    slug: 'gamma',
    date: '2026-03-03',
    content: 'Gamma body',
  }));
  await fs.writeFile(path.join(dataDir, 'broken.json'), '{');

  const result = await buildSite({ dataDir, outputDir, assetSourcePath });

  const outputFiles = (await fs.readdir(outputDir)).sort();
  const dashboard = await fs.readFile(path.join(outputDir, 'dashboard.html'), 'utf8');
  const alpha = await fs.readFile(path.join(outputDir, 'alpha.html'), 'utf8');
  const gamma = await fs.readFile(path.join(outputDir, 'gamma.html'), 'utf8');
  const css = await fs.readFile(path.join(outputDir, 'assets', 'style.css'), 'utf8');

  assert.deepEqual(outputFiles, ['alpha.html', 'assets', 'dashboard.html', 'gamma.html']);
  assert.equal(css, '.page-shell { max-width: 1120px; }');
  assert.equal(result.stats.filesRead, 2);
  assert.equal(result.stats.validObjects, 4);
  assert.equal(result.stats.publishedObjects, 3);
  assert.equal(result.stats.draftObjects, 1);
  assert.equal(result.stats.uniquePublishedSlugs, 2);
  assert.equal(result.stats.warningCount, 1);
  assert.match(dashboard, /broken\.json contains invalid JSON/);
  assert.match(dashboard, /href="alpha\.html\?file=posts\.json"/);
  assert.match(dashboard, /href="gamma\.html\?file=more\.json"/);
  assert.match(alpha, /Alpha New[\s\S]*Alpha Old/);
  assert.match(alpha, /<p>New<\/p>/);
  assert.doesNotMatch(alpha, /Beta Draft/);
  assert.match(gamma, /Gamma body/);
});
