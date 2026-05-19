# JSON Reader Output And Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden output cleanup and stylesheet copying, then finish responsive offline styling for dashboard and slug pages.

**Architecture:** Keep output filesystem behavior in `src/generator.js` and visual design in the permanent source stylesheet `src/assets/style.css`. Tests assert that old generated files are removed, generated pages link only to local assets, and the stylesheet includes selectors used by both dashboard and slug pages.

**Tech Stack:** Node.js built-in `fs`, `path`, `node:test`, CommonJS modules, static CSS without dependencies.

---

## File Structure

- Modify: `src/generator.js` - keep output cleanup and stylesheet copying behavior explicit and tested.
- Modify: `src/assets/style.css` - complete dashboard cards, file table, slug filters, content cards, and mobile layout styling.
- Modify: `test/generator.test.js` - add cleanup and local asset assertions.
- Create: `test/style.test.js` - verify required CSS selectors and offline-friendly absence of external imports.

### Task 1: Clean Output Behavior

**Files:**
- Modify: `test/generator.test.js`

- [ ] **Step 1: Add failing cleanup regression test**

Append to `test/generator.test.js`:

```js
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
```

- [ ] **Step 2: Run test**

Run: `node --test test/generator.test.js`

Expected: PASS if the scaffold plan's `cleanOutput` already removes `output/` recursively; FAIL if output cleanup was not implemented exactly.

- [ ] **Step 3: Fix cleanup only if the test fails**

If the cleanup test fails, replace `cleanOutput` in `src/generator.js` with:

```js
async function cleanOutput(outputDir) {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(path.join(outputDir, 'assets'), { recursive: true });
}
```

- [ ] **Step 4: Run generator tests**

Run: `node --test test/generator.test.js`

Expected: PASS for cleanup, dashboard, stylesheet, and slug file tests.

- [ ] **Step 5: Commit**

```bash
git add src/generator.js test/generator.test.js
git commit -m "test: cover output cleanup"
```

### Task 2: Offline Asset Links

**Files:**
- Modify: `test/generator.test.js`

- [ ] **Step 1: Add local asset assertions**

Append to `test/generator.test.js`:

```js
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

  assert.match(dashboard, /href="assets\/style\.css"/);
  assert.match(slug, /href="assets\/style\.css"/);
  assert.doesNotMatch(dashboard + slug, /https?:\/\//);
  assert.doesNotMatch(dashboard + slug, /<script\s+src=/);
});
```

- [ ] **Step 2: Run generator tests**

Run: `node --test test/generator.test.js`

Expected: PASS if generated pages use `assets/style.css` and inline JavaScript only.

- [ ] **Step 3: Fix local links only if the test fails**

If the test fails because either renderer links an external or wrong stylesheet path, update both `renderDashboard` and `renderSlugPage` in `src/html.js` so their `<head>` contains exactly:

```html
  <link rel="stylesheet" href="assets/style.css">
```

- [ ] **Step 4: Run full tests**

Run: `npm test`

Expected: PASS for all tests.

- [ ] **Step 5: Commit**

```bash
git add src/html.js test/generator.test.js
git commit -m "test: ensure offline asset links"
```

### Task 3: Complete Responsive Stylesheet

**Files:**
- Modify: `src/assets/style.css`
- Create: `test/style.test.js`

- [ ] **Step 1: Write failing stylesheet tests**

Create `test/style.test.js` with:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const test = require('node:test');

test('stylesheet includes dashboard and slug page layout selectors', async () => {
  const css = await fs.readFile('src/assets/style.css', 'utf8');

  for (const selector of [
    '.stats-grid',
    '.stat-card',
    '.slug-grid',
    '.slug-card',
    '.filter-panel',
    '.content-grid',
    '.content-card',
    '.content-body',
    '.tags',
    '.empty-state',
    '@media (max-width: 680px)',
  ]) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('stylesheet has no external imports or remote asset references', async () => {
  const css = await fs.readFile('src/assets/style.css', 'utf8');

  assert.doesNotMatch(css, /@import/i);
  assert.doesNotMatch(css, /https?:\/\//i);
});
```

- [ ] **Step 2: Run tests to verify they fail if slug styles are missing**

Run: `node --test test/style.test.js`

Expected: FAIL until `.filter-panel`, `.content-grid`, `.content-card`, `.content-body`, `.tags`, and `.empty-state` are styled.

- [ ] **Step 3: Replace stylesheet with complete responsive CSS**

Replace `src/assets/style.css` with:

```css
:root {
  color-scheme: light;
  font-family: Arial, Helvetica, sans-serif;
  background: #f5f7fb;
  color: #182033;
  line-height: 1.5;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(84, 112, 255, 0.16), transparent 32rem),
    #f5f7fb;
}

a {
  color: #2847c7;
}

input,
select {
  width: 100%;
  margin-top: 6px;
  border: 1px solid #c8d2e3;
  border-radius: 10px;
  padding: 10px 12px;
  color: #182033;
  background: #ffffff;
  font: inherit;
}

.page-shell {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.hero,
.panel,
.stat-card,
.slug-card,
.filter-panel,
.content-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #dbe3ef;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(24, 32, 51, 0.08);
}

.hero,
.panel,
.filter-panel,
.content-card {
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
  line-height: 1.15;
}

.stats-grid,
.slug-grid,
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
  font-size: 2.1rem;
  line-height: 1;
}

.slug-card:hover {
  border-color: #2847c7;
  transform: translateY(-1px);
}

.filter-panel {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.4fr;
  gap: 16px;
  align-items: end;
}

.content-card {
  display: grid;
  gap: 14px;
}

.content-card header p {
  margin: 0;
  color: #52607a;
}

.content-body {
  color: #243049;
}

.content-body > :first-child {
  margin-top: 0;
}

.content-body > :last-child {
  margin-bottom: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  color: #52607a;
  list-style: none;
}

.tags li {
  border-radius: 999px;
  background: #e9edff;
  color: #2847c7;
  padding: 4px 10px;
  font-size: 0.86rem;
  font-weight: 700;
}

.empty-state {
  border: 1px dashed #9aa8bf;
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  color: #52607a;
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

th {
  color: #52607a;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

@media (max-width: 680px) {
  .page-shell {
    width: min(100% - 20px, 1120px);
    padding: 16px 0;
  }

  .hero,
  .panel,
  .filter-panel,
  .content-card {
    padding: 18px;
  }

  .filter-panel,
  .stats-grid,
  .slug-grid,
  .content-grid {
    grid-template-columns: 1fr;
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
    padding: 6px 0;
  }

  tr {
    border-bottom: 1px solid #dbe3ef;
    padding: 10px 0;
  }
}
```

- [ ] **Step 4: Run style tests**

Run: `node --test test/style.test.js`

Expected: PASS for selector and offline checks.

- [ ] **Step 5: Run build and full tests**

Run: `npm test`

Expected: PASS for all tests.

Run: `npm run build`

Expected: PASS and generated pages copy the completed stylesheet to `output/assets/style.css`.

- [ ] **Step 6: Commit**

```bash
git add src/assets/style.css test/style.test.js output/assets/style.css output/dashboard.html
git commit -m "feat: style generated json reader pages"
```

## Self-Review Notes

- Spec coverage: Covers deleting old generated files, copying `src/assets/style.css` to `output/assets/style.css`, linking generated pages to `assets/style.css`, no external dependencies, offline operation, dashboard cards/table, slug filters/cards, and mobile stacking.
- Placeholder scan: Every selector, command, and implementation snippet is concrete.
- Type consistency: CSS class names match those introduced in dashboard and slug page renderers.
