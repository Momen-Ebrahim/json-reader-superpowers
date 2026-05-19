const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const { renderDashboard } = require('../src/html');
const { buildSite, cleanOutput } = require('../src/generator');

test('CLI entrypoint exports main and source stylesheet exists', async () => {
  const { main } = require('../src/index');
  const stylesheet = await fs.readFile(path.join(__dirname, '..', 'src', 'assets', 'style.css'), 'utf8');

  assert.equal(typeof main, 'function');
  assert.match(stylesheet, /\.page-shell/);
});

test('CLI entrypoint finds bundled stylesheet from another cwd', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-cli-'));
  const cliPath = path.join(__dirname, '..', 'src', 'index.js');

  const { stdout } = await execFileAsync(process.execPath, [cliPath], { cwd: fixtureRoot });
  const stylesheet = await fs.readFile(path.join(fixtureRoot, 'output', 'assets', 'style.css'), 'utf8');

  assert.match(stdout, /Generated dashboard\.html with 0 warnings\./);
  assert.match(stylesheet, /\.page-shell/);
});

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

test('buildSite rejects output directory that overlaps input data', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-'));
  const assetSourcePath = path.join(fixtureRoot, 'assets', 'style.css');
  const dataDir = path.join(fixtureRoot, 'data');
  const sentinelPath = path.join(dataDir, 'sentinel.json');
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');
  await fs.writeFile(sentinelPath, '{}');

  await assert.rejects(
    buildSite({
      dataDir,
      outputDir: dataDir,
      assetSourcePath,
    }),
    /Unsafe output directory/
  );

  assert.equal(await fs.readFile(sentinelPath, 'utf8'), '{}');
});

test('buildSite rejects output directory that contains data path with dot-dot prefix segment', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-'));
  const outputDir = path.join(fixtureRoot, 'output');
  const dataDir = path.join(outputDir, '..data');
  const assetSourcePath = path.join(fixtureRoot, 'assets', 'style.css');
  const sentinelPath = path.join(dataDir, 'sentinel.json');
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');
  await fs.writeFile(sentinelPath, '{}');

  await assert.rejects(
    buildSite({
      dataDir,
      outputDir,
      assetSourcePath,
    }),
    /Unsafe output directory/
  );

  assert.equal(await fs.readFile(sentinelPath, 'utf8'), '{}');
});

test('cleanOutput rejects empty output directory', async () => {
  await assert.rejects(cleanOutput(''), /Unsafe output directory/);
});

test('buildSite rejects empty output directory', async () => {
  await assert.rejects(buildSite({ outputDir: '' }), /Unsafe output directory/);
});

test('buildSite rejects null output directory', async () => {
  await assert.rejects(buildSite({ outputDir: null }), /Unsafe output directory/);
});

test('renderDashboard links slug cards and per-file slug counts', () => {
  const html = renderDashboard({
    stats: {
      filesRead: 1,
      validObjects: 2,
      publishedObjects: 2,
      draftObjects: 0,
      uniquePublishedSlugs: 1,
      warningCount: 0,
    },
    warnings: [],
    slugGroups: new Map([['alpha', [{ title: 'A' }, { title: 'B' }]]]),
    fileSummaries: [{
      fileName: 'posts.json',
      validObjects: 2,
      publishedObjects: 2,
      draftObjects: 0,
      publishedSlugCounts: new Map([['alpha', 2]]),
    }],
  });

  assert.match(html, /href="alpha\.html"/);
  assert.match(html, /href="alpha\.html\?file=posts\.json"/);
  assert.match(html, /<a class="table-link-pill" href="alpha\.html\?file=posts\.json">alpha \(2\)<\/a>/);
  assert.match(html, /alpha \(2\)/);
});

test('renderDashboard URL-encodes slug href path segments', () => {
  const html = renderDashboard({
    stats: {
      filesRead: 1,
      validObjects: 1,
      publishedObjects: 1,
      draftObjects: 0,
      uniquePublishedSlugs: 1,
      warningCount: 0,
    },
    warnings: [],
    slugGroups: new Map([['javascript:alert(1)//', [{ title: 'Unsafe slug' }]]]),
    fileSummaries: [{
      fileName: 'posts & drafts.json',
      validObjects: 1,
      publishedObjects: 1,
      draftObjects: 0,
      publishedSlugCounts: new Map([['javascript:alert(1)//', 1]]),
    }],
  });

  assert.doesNotMatch(html, /href="javascript:alert\(1\)\/\/\.html"/);
  assert.match(html, /href="javascript%3Aalert\(1\)%2F%2F\.html"/);
  assert.match(html, /href="javascript%3Aalert\(1\)%2F%2F\.html\?file=posts%20%26%20drafts\.json"/);
  assert.match(html, />javascript:alert\(1\)\/\/ \(1\)<\/a>/);
});

test('renderDashboard encodes wildcard characters in slug href file names', () => {
  const html = renderDashboard({
    stats: {
      filesRead: 1,
      validObjects: 1,
      publishedObjects: 1,
      draftObjects: 0,
      uniquePublishedSlugs: 1,
      warningCount: 0,
    },
    warnings: [],
    slugGroups: new Map([['a*b', [{ title: 'Wildcard' }]]]),
    fileSummaries: [{
      fileName: 'posts.json',
      validObjects: 1,
      publishedObjects: 1,
      draftObjects: 0,
      publishedSlugCounts: new Map([['a*b', 1]]),
    }],
  });

  assert.match(html, /href="a%2Ab\.html"/);
  assert.match(html, /href="a%2Ab\.html\?file=posts\.json"/);
});

test('buildSite writes one page for each unique published slug', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-slugs-'));
  const dataDir = path.join(fixtureRoot, 'data');
  const outputDir = path.join(fixtureRoot, 'output');
  const assetSourcePath = path.join(fixtureRoot, 'src', 'assets', 'style.css');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');
  await fs.writeFile(path.join(dataDir, 'posts.json'), JSON.stringify([
    { title: 'Alpha', slug: 'alpha', date: '2026-05-18', content: 'Alpha body' },
    { title: 'Beta Draft', slug: 'beta', date: '2026-05-18', content: 'Draft body', draft: true },
  ]));

  await buildSite({ dataDir, outputDir, assetSourcePath });

  const alpha = await fs.readFile(path.join(outputDir, 'alpha.html'), 'utf8');
  await assert.rejects(fs.readFile(path.join(outputDir, 'beta.html'), 'utf8'), /ENOENT/);
  assert.match(alpha, /<h1>alpha<\/h1>/);
  assert.match(alpha, /Alpha body/);
  assert.doesNotMatch(alpha, /Draft body/);
});

test('buildSite writes encoded slug file names inside the output directory', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-encoded-slugs-'));
  const dataDir = path.join(fixtureRoot, 'data');
  const outputDir = path.join(fixtureRoot, 'output');
  const assetSourcePath = path.join(fixtureRoot, 'src', 'assets', 'style.css');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');
  await fs.writeFile(path.join(dataDir, 'posts.json'), JSON.stringify([
    { title: 'Unsafe', slug: 'javascript:alert(1)//', date: '2026-05-18', content: 'Unsafe body' },
    { title: 'Traversal', slug: '../outside', date: '2026-05-18', content: 'Traversal body' },
    { title: 'Wildcard', slug: 'a*b', date: '2026-05-18', content: 'Wildcard body' },
  ]));

  await buildSite({ dataDir, outputDir, assetSourcePath });

  const unsafe = await fs.readFile(path.join(outputDir, 'javascript%3Aalert(1)%2F%2F.html'), 'utf8');
  const traversal = await fs.readFile(path.join(outputDir, '..%2Foutside.html'), 'utf8');
  const wildcard = await fs.readFile(path.join(outputDir, 'a%2Ab.html'), 'utf8');
  await assert.rejects(fs.readFile(path.join(fixtureRoot, 'outside.html'), 'utf8'), /ENOENT/);
  assert.match(unsafe, /Unsafe body/);
  assert.match(traversal, /Traversal body/);
  assert.match(wildcard, /Wildcard body/);
});

test('buildSite deletes old generated files before writing new output', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-clean-'));
  const dataDir = path.join(fixtureRoot, 'data');
  const outputDir = path.join(fixtureRoot, 'output');
  const assetSourcePath = path.join(fixtureRoot, 'src', 'assets', 'style.css');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(path.join(outputDir, 'assets'), { recursive: true });
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.writeFile(path.join(outputDir, 'old.html'), 'stale');
  await fs.writeFile(path.join(outputDir, 'assets', 'old.css'), 'stale');
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');

  await buildSite({ dataDir, outputDir, assetSourcePath });

  await assert.rejects(fs.readFile(path.join(outputDir, 'old.html'), 'utf8'), /ENOENT/);
  await assert.rejects(fs.readFile(path.join(outputDir, 'assets', 'old.css'), 'utf8'), /ENOENT/);
  assert.equal(await fs.readFile(path.join(outputDir, 'assets', 'style.css'), 'utf8'), 'body { color: #111; }');
});

test('generated HTML links only to the shared local stylesheet', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-assets-'));
  const dataDir = path.join(fixtureRoot, 'data');
  const outputDir = path.join(fixtureRoot, 'output');
  const assetSourcePath = path.join(fixtureRoot, 'src', 'assets', 'style.css');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');
  await fs.writeFile(path.join(dataDir, 'posts.json'), JSON.stringify({
    title: 'Alpha',
    slug: 'alpha',
    date: '2026-05-18',
    content: 'Alpha body',
  }));

  await buildSite({ dataDir, outputDir, assetSourcePath });

  const dashboard = await fs.readFile(path.join(outputDir, 'dashboard.html'), 'utf8');
  const slug = await fs.readFile(path.join(outputDir, 'alpha.html'), 'utf8');
  const stylesheetHrefs = (html) => [...html.matchAll(/<link\b[^>]*>/gi)]
    .filter((match) => /\brel\s*=\s*(['"])stylesheet\1/i.test(match[0]))
    .map((match) => match[0].match(/\bhref\s*=\s*(['"])([^'"]+)\1/i)?.[2])
    .filter(Boolean);

  assert.deepEqual(stylesheetHrefs(dashboard), ['assets/style.css']);
  assert.deepEqual(stylesheetHrefs(slug), ['assets/style.css']);
  assert.doesNotMatch(dashboard + slug, /\b(?:href|src)\s*=\s*["'](?:https?:)?\/\//i);
  assert.doesNotMatch(dashboard + slug, /<script\b[^>]*\bsrc\s*=/i);
});

test('buildSite succeeds with missing data folder and generates only dashboard plus stylesheet', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-missing-data-'));
  const outputDir = path.join(fixtureRoot, 'output');
  const assetSourcePath = path.join(fixtureRoot, 'src', 'assets', 'style.css');
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');

  const result = await buildSite({
    dataDir: path.join(fixtureRoot, 'data'),
    outputDir,
    assetSourcePath,
  });

  const generatedFiles = await fs.readdir(outputDir);
  const dashboard = await fs.readFile(path.join(outputDir, 'dashboard.html'), 'utf8');

  assert.deepEqual(result.stats, {
    filesRead: 0,
    validObjects: 0,
    publishedObjects: 0,
    draftObjects: 0,
    uniquePublishedSlugs: 0,
    warningCount: 1,
  });
  assert.deepEqual(generatedFiles.sort(), ['assets', 'dashboard.html']);
  assert.match(dashboard, /Data folder not found: data/);
  assert.match(dashboard, /0 JSON files read/);
});

test('buildSite generates no slug pages when there are no published objects', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-no-published-'));
  const dataDir = path.join(fixtureRoot, 'data');
  const outputDir = path.join(fixtureRoot, 'output');
  const assetSourcePath = path.join(fixtureRoot, 'src', 'assets', 'style.css');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');
  await fs.writeFile(path.join(dataDir, 'drafts.json'), JSON.stringify({
    title: 'Draft',
    slug: 'draft-only',
    date: '2026-05-18',
    content: 'Hidden',
    draft: true,
  }));

  await buildSite({ dataDir, outputDir, assetSourcePath });

  await assert.rejects(fs.readFile(path.join(outputDir, 'draft-only.html'), 'utf8'), /ENOENT/);
  const dashboard = await fs.readFile(path.join(outputDir, 'dashboard.html'), 'utf8');
  assert.match(dashboard, /No published slugs found/);
});
