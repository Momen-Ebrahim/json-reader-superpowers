# JSON Reader Static Generator Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the initial plain Node.js static generator scaffold that can produce an offline `output/dashboard.html` and copied stylesheet.

**Architecture:** Use CommonJS modules under `src/` with `src/index.js` as the CLI entrypoint and `src/generator.js` as the orchestration layer. This plan creates the project shape and a minimal dashboard-only build; later plans add JSON reading, validation, slug pages, richer styling, and warning behavior.

**Tech Stack:** Node.js built-in `fs`, `path`, `node:test`, CommonJS modules, static HTML/CSS.

---

## File Structure

- Create: `src/index.js` - CLI entrypoint that runs the generator and prints warnings.
- Create: `src/generator.js` - build orchestration for cleaning output, copying assets, and writing dashboard HTML.
- Create: `src/html.js` - HTML helpers for rendering the initial dashboard shell.
- Create: `src/assets/style.css` - permanent source stylesheet copied into `output/assets/style.css`.
- Create: `test/generator.test.js` - node:test coverage for the minimal build output.
- Modify: `package.json` - add `build` script while keeping `test`.

### Task 1: Package Scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update scripts**

Replace the `scripts` block in `package.json` with:

```json
"scripts": {
  "build": "node src/index.js",
  "test": "node --test"
}
```

- [ ] **Step 2: Run tests before implementation**

Run: `npm test`

Expected: PASS with `0 tests` or equivalent node:test output because no tests exist yet.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add build script"
```

### Task 2: Minimal Dashboard Renderer

**Files:**
- Create: `src/html.js`
- Test: `test/generator.test.js`

- [ ] **Step 1: Write the failing renderer test**

Create `test/generator.test.js` with:

```js
const assert = require('node:assert/strict');
const test = require('node:test');

const { renderDashboard } = require('../src/html');

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

Expected: FAIL with `Cannot find module '../src/html'`.

- [ ] **Step 3: Implement the renderer**

Create `src/html.js` with:

```js
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderDashboard({ stats, warnings, slugGroups, fileSummaries }) {
  const slugCards = Array.from(slugGroups.entries())
    .map(([slug, objects]) => `<a class="slug-card" href="${escapeHtml(slug)}.html"><strong>${escapeHtml(slug)}</strong><span>${objects.length} published objects</span></a>`)
    .join('');

  const warningItems = warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join('');

  const fileRows = fileSummaries
    .map((file) => `<tr><td>${escapeHtml(file.fileName)}</td><td>${file.validObjects}</td><td>${file.publishedObjects}</td><td>${file.draftObjects}</td><td>${escapeHtml(file.slugSummary)}</td></tr>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>JSON Reader Dashboard</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="page-shell">
    <header class="hero">
      <p class="eyebrow">Static JSON Reader</p>
      <h1>JSON Reader Dashboard</h1>
    </header>
    <section class="stats-grid" aria-label="Build statistics">
      <article class="stat-card"><strong>${stats.filesRead}</strong><span>${stats.filesRead} JSON files read</span></article>
      <article class="stat-card"><strong>${stats.validObjects}</strong><span>valid objects</span></article>
      <article class="stat-card"><strong>${stats.publishedObjects}</strong><span>published objects</span></article>
      <article class="stat-card"><strong>${stats.draftObjects}</strong><span>draft objects</span></article>
      <article class="stat-card"><strong>${stats.uniquePublishedSlugs}</strong><span>unique published slugs</span></article>
      <article class="stat-card"><strong>${stats.warningCount}</strong><span>warnings</span></article>
    </section>
    <section class="panel">
      <h2>Published slugs</h2>
      <div class="slug-grid">${slugCards || '<p>No published slugs found.</p>'}</div>
    </section>
    <section class="panel">
      <h2>Warnings</h2>
      <ul>${warningItems || '<li>No warnings.</li>'}</ul>
    </section>
    <section class="panel">
      <h2>JSON files</h2>
      <table>
        <thead><tr><th>File name</th><th>Valid objects</th><th>Published</th><th>Drafts</th><th>Published slug counts</th></tr></thead>
        <tbody>${fileRows || '<tr><td colspan="5">No JSON files read.</td></tr>'}</tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}

module.exports = { escapeHtml, renderDashboard };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`

Expected: PASS for `renderDashboard returns an offline dashboard document`.

- [ ] **Step 5: Commit**

```bash
git add src/html.js test/generator.test.js
git commit -m "feat: add dashboard renderer"
```

### Task 3: Generator Orchestration

**Files:**
- Create: `src/generator.js`
- Modify: `test/generator.test.js`

- [ ] **Step 1: Add failing build test**

Append to `test/generator.test.js`:

```js
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { buildSite } = require('../src/generator');

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

Expected: FAIL with `Cannot find module '../src/generator'`.

- [ ] **Step 3: Implement generator orchestration**

Create `src/generator.js` with:

```js
const fs = require('node:fs/promises');
const path = require('node:path');

const { renderDashboard } = require('./html');

async function cleanOutput(outputDir) {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(path.join(outputDir, 'assets'), { recursive: true });
}

async function copyStylesheet(assetSourcePath, outputDir) {
  await fs.copyFile(assetSourcePath, path.join(outputDir, 'assets', 'style.css'));
}

function createEmptyBuildState() {
  return {
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
  };
}

async function buildSite({
  dataDir = path.join(process.cwd(), 'data'),
  outputDir = path.join(process.cwd(), 'output'),
  assetSourcePath = path.join(process.cwd(), 'src', 'assets', 'style.css'),
} = {}) {
  await cleanOutput(outputDir);
  await copyStylesheet(assetSourcePath, outputDir);

  const buildState = createEmptyBuildState();
  const dashboardHtml = renderDashboard(buildState);
  await fs.writeFile(path.join(outputDir, 'dashboard.html'), dashboardHtml);

  return buildState;
}

module.exports = { buildSite, cleanOutput, copyStylesheet, createEmptyBuildState };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`

Expected: PASS for both dashboard renderer and build output tests.

- [ ] **Step 5: Commit**

```bash
git add src/generator.js test/generator.test.js
git commit -m "feat: add generator orchestration"
```

### Task 4: CLI Entrypoint And Source Stylesheet

**Files:**
- Create: `src/index.js`
- Create: `src/assets/style.css`

- [ ] **Step 1: Create CLI entrypoint**

Create `src/index.js` with:

```js
const { buildSite } = require('./generator');

async function main() {
  const result = await buildSite();

  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }

  console.log(`Generated dashboard.html with ${result.stats.warningCount} warnings.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { main };
```

- [ ] **Step 2: Create source stylesheet**

Create `src/assets/style.css` with:

```css
:root {
  color-scheme: light;
  font-family: Arial, Helvetica, sans-serif;
  background: #f5f7fb;
  color: #182033;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f5f7fb;
}

a {
  color: inherit;
}

.page-shell {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.hero,
.panel,
.stat-card,
.slug-card {
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(24, 32, 51, 0.08);
}

.hero,
.panel {
  padding: 24px;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #52607a;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0 0 16px;
}

.stats-grid,
.slug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card,
.slug-card {
  display: grid;
  gap: 6px;
  padding: 18px;
  text-decoration: none;
}

.stat-card strong {
  font-size: 2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #dbe3ef;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

@media (max-width: 680px) {
  .page-shell {
    width: min(100% - 20px, 1120px);
    padding: 16px 0;
  }

  table,
  thead,
  tbody,
  tr,
  th,
  td {
    display: block;
  }

  thead {
    display: none;
  }

  td {
    border-bottom: 0;
  }

  tr {
    border-bottom: 1px solid #dbe3ef;
    padding: 8px 0;
  }
}
```

- [ ] **Step 3: Run full test suite**

Run: `npm test`

Expected: PASS for all tests.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS and prints `Generated dashboard.html with 0 warnings.`. Files exist at `output/dashboard.html` and `output/assets/style.css`.

- [ ] **Step 5: Commit**

```bash
git add src/index.js src/assets/style.css output/dashboard.html output/assets/style.css
git commit -m "feat: add json reader cli scaffold"
```

## Self-Review Notes

- Spec coverage: Covers plain Node.js modules, offline generated `dashboard.html`, copied `assets/style.css`, and no server requirement from `2026-05-18-json-reader-static-generator-design.md`.
- Placeholder scan: No placeholder tasks or undefined functions remain; later behavior is explicitly deferred to separate spec plans.
- Type consistency: `buildSite`, `renderDashboard`, `stats`, `warnings`, `slugGroups`, and `fileSummaries` names are consistent across tests and implementation.
