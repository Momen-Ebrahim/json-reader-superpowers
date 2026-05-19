const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { renderDashboard } = require('../src/html');
const { buildSite } = require('../src/generator');

test('renderDashboard returns an offline dashboard document', () => {
  const html = renderDashboard({
    stats: {
      filesRead: 0,
      validObjects: 0,
      publishedObjects: 0,
      draftObjects: 0,
      uniquePublishedSlugs: 0,
      warningCount: 0,
    },
    warnings: [],
    slugGroups: new Map(),
    fileSummaries: [],
  });

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<title>JSON Reader Dashboard<\/title>/);
  assert.match(html, /href="assets\/style.css"/);
  assert.match(html, /JSON Reader Dashboard/);
  assert.match(html, /0 JSON files read/);
});

test('buildSite writes dashboard and stylesheet', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-'));
  const outputDir = path.join(fixtureRoot, 'output');
  const assetSourcePath = path.join(fixtureRoot, 'src', 'assets', 'style.css');
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');

  const result = await buildSite({
    dataDir: path.join(fixtureRoot, 'data'),
    outputDir,
    assetSourcePath,
  });

  const dashboard = await fs.readFile(path.join(outputDir, 'dashboard.html'), 'utf8');
  const stylesheet = await fs.readFile(path.join(outputDir, 'assets', 'style.css'), 'utf8');

  assert.equal(result.stats.filesRead, 0);
  assert.match(dashboard, /JSON Reader Dashboard/);
  assert.equal(stylesheet, 'body { color: #111; }');
});
