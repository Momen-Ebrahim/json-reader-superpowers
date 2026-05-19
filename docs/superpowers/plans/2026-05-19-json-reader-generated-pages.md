# JSON Reader Generated Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate one offline HTML slug page per unique published slug, with browser-side filtering and dashboard links into file-filtered slug pages.

**Architecture:** Extend `src/html.js` with a `renderSlugPage` function that embeds only the published objects for one slug as JSON data plus inline filtering JavaScript. Extend `src/generator.js` so `buildSite` writes `<slug>.html` for every `slugGroups` entry after writing the dashboard.

**Tech Stack:** Node.js built-in `fs`, `path`, `node:test`, CommonJS modules, static HTML, inline browser JavaScript.

---

## File Structure

- Modify: `src/html.js` - add slug-page renderer and safe JSON embedding helper.
- Modify: `src/generator.js` - write a page for every unique published slug.
- Create: `test/slug-page.test.js` - unit tests for slug HTML content, data filtering payload, and query-parameter script behavior.
- Modify: `test/generator.test.js` - integration-style test for generated slug files.

### Task 1: Slug Page Renderer

**Files:**
- Modify: `src/html.js`
- Test: `test/slug-page.test.js`

- [ ] **Step 1: Write failing slug renderer tests**

Create `test/slug-page.test.js` with:

```js
const assert = require('node:assert/strict');
const test = require('node:test');

const { renderSlugPage } = require('../src/html');

const objects = [
  {
    title: 'Newest',
    slug: 'alpha',
    date: '2026-05-18',
    content: '<p>Hello <strong>HTML</strong></p>',
    tags: ['release', 'docs'],
    draft: false,
    sourceFile: 'posts.json',
  },
  {
    title: 'Older',
    slug: 'alpha',
    date: '2026-01-01',
    content: 'Plain text',
    tags: [],
    draft: false,
    sourceFile: 'archive.json',
  },
];

test('renderSlugPage shows slug heading, count, controls, and object cards', () => {
  const html = renderSlugPage('alpha', objects);

  assert.match(html, /<title>alpha - JSON Reader<\/title>/);
  assert.match(html, /<h1>alpha<\/h1>/);
  assert.match(html, /2 published objects/);
  assert.match(html, /id="title-filter"/);
  assert.match(html, /id="from-filter"/);
  assert.match(html, /id="to-filter"/);
  assert.match(html, /id="file-filter"/);
  assert.match(html, /<option value="">All files<\/option>/);
  assert.match(html, /<option value="archive\.json">archive\.json<\/option>/);
  assert.match(html, /<option value="posts\.json">posts\.json<\/option>/);
  assert.match(html, /<p>Hello <strong>HTML<\/strong><\/p>/);
});

test('renderSlugPage embeds only the provided slug objects as JSON data', () => {
  const html = renderSlugPage('alpha', objects);

  assert.match(html, /const objects = \[/);
  assert.match(html, /"sourceFile":"posts\.json"/);
  assert.doesNotMatch(html, /draft":true/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/slug-page.test.js`

Expected: FAIL with `renderSlugPage is not a function`.

- [ ] **Step 3: Add slug page renderer**

In `src/html.js`, add this function above `module.exports`:

```js
function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function renderTags(tags) {
  if (tags.length === 0) {
    return '<p class="tags">No tags</p>';
  }

  return `<ul class="tags">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`;
}

function renderSlugPage(slug, objects) {
  const files = Array.from(new Set(objects.map((object) => object.sourceFile))).sort((a, b) => a.localeCompare(b));
  const fileOptions = files
    .map((fileName) => `<option value="${escapeHtml(fileName)}">${escapeHtml(fileName)}</option>`)
    .join('');
  const cards = objects
    .map((object) => `<article class="content-card" data-title="${escapeHtml(object.title.toLowerCase())}" data-date="${escapeHtml(object.date)}" data-file="${escapeHtml(object.sourceFile)}">
      <header>
        <h2>${escapeHtml(object.title)}</h2>
        <p>${escapeHtml(object.date)} · ${escapeHtml(object.sourceFile)}</p>
      </header>
      ${renderTags(object.tags)}
      <div class="content-body">${object.content}</div>
    </article>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(slug)} - JSON Reader</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="page-shell">
    <header class="hero">
      <p class="eyebrow">Published slug</p>
      <h1>${escapeHtml(slug)}</h1>
      <p><span id="visible-count">${objects.length}</span> of ${objects.length} published objects</p>
      <p><a href="dashboard.html">Back to dashboard</a></p>
    </header>
    <section class="filter-panel" aria-label="Filters">
      <label>Search title <input id="title-filter" type="search" placeholder="Filter by title"></label>
      <label>From <input id="from-filter" type="date"></label>
      <label>To <input id="to-filter" type="date"></label>
      <label>JSON file <select id="file-filter"><option value="">All files</option>${fileOptions}</select></label>
    </section>
    <section id="cards" class="content-grid">
      ${cards}
    </section>
    <p id="empty-state" class="empty-state" hidden>No objects match the current filters.</p>
  </main>
  <script>
    const objects = ${safeJson(objects)};
    const titleFilter = document.querySelector('#title-filter');
    const fromFilter = document.querySelector('#from-filter');
    const toFilter = document.querySelector('#to-filter');
    const fileFilter = document.querySelector('#file-filter');
    const cards = Array.from(document.querySelectorAll('.content-card'));
    const visibleCount = document.querySelector('#visible-count');
    const emptyState = document.querySelector('#empty-state');

    function syncFileFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const file = params.get('file') || '';
      if (Array.from(fileFilter.options).some((option) => option.value === file)) {
        fileFilter.value = file;
      }
    }

    function updateFileQuery() {
      const url = new URL(window.location.href);
      if (fileFilter.value) {
        url.searchParams.set('file', fileFilter.value);
      } else {
        url.searchParams.delete('file');
      }
      window.history.replaceState(null, '', url);
    }

    function applyFilters() {
      const title = titleFilter.value.trim().toLowerCase();
      const from = fromFilter.value;
      const to = toFilter.value;
      const file = fileFilter.value;
      let count = 0;

      cards.forEach((card) => {
        const matchesTitle = !title || card.dataset.title.includes(title);
        const matchesFrom = !from || card.dataset.date >= from;
        const matchesTo = !to || card.dataset.date <= to;
        const matchesFile = !file || card.dataset.file === file;
        const visible = matchesTitle && matchesFrom && matchesTo && matchesFile;
        card.hidden = !visible;
        if (visible) {
          count += 1;
        }
      });

      visibleCount.textContent = String(count);
      emptyState.hidden = count !== 0;
    }

    syncFileFromQuery();
    applyFilters();
    titleFilter.addEventListener('input', applyFilters);
    fromFilter.addEventListener('input', applyFilters);
    toFilter.addEventListener('input', applyFilters);
    fileFilter.addEventListener('change', () => {
      updateFileQuery();
      applyFilters();
    });
  </script>
</body>
</html>`;
}
```

Update the export at the bottom of `src/html.js` to:

```js
module.exports = { escapeHtml, renderDashboard, renderSlugPage, safeJson };
```

- [ ] **Step 4: Run slug page tests**

Run: `node --test test/slug-page.test.js`

Expected: PASS for slug renderer tests.

- [ ] **Step 5: Commit**

```bash
git add src/html.js test/slug-page.test.js
git commit -m "feat: render slug pages"
```

### Task 2: Generate Slug Files

**Files:**
- Modify: `src/generator.js`
- Modify: `test/generator.test.js`

- [ ] **Step 1: Add failing generated file test**

Append to `test/generator.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/generator.test.js`

Expected: FAIL with `ENOENT` for `alpha.html`.

- [ ] **Step 3: Write slug pages in generator**

In `src/generator.js`, update the import to:

```js
const { renderDashboard, renderSlugPage } = require('./html');
```

Inside `buildSite`, after writing `dashboard.html`, add:

```js
  for (const [slug, objects] of buildState.slugGroups.entries()) {
    await fs.writeFile(path.join(outputDir, `${slug}.html`), renderSlugPage(slug, objects));
  }
```

- [ ] **Step 4: Run generator tests**

Run: `node --test test/generator.test.js`

Expected: PASS for dashboard and slug generation tests.

- [ ] **Step 5: Commit**

```bash
git add src/generator.js test/generator.test.js
git commit -m "feat: generate slug html files"
```

### Task 3: URL Query Behavior Test Coverage

**Files:**
- Modify: `test/slug-page.test.js`

- [ ] **Step 1: Add script behavior assertions**

Append to `test/slug-page.test.js`:

```js
test('renderSlugPage script reads and updates the file query parameter', () => {
  const html = renderSlugPage('alpha', objects);

  assert.match(html, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(html, /params\.get\('file'\)/);
  assert.match(html, /url\.searchParams\.set\('file', fileFilter\.value\)/);
  assert.match(html, /url\.searchParams\.delete\('file'\)/);
  assert.match(html, /window\.history\.replaceState\(null, '', url\)/);
});
```

- [ ] **Step 2: Run slug page tests**

Run: `node --test test/slug-page.test.js`

Expected: PASS including query-parameter behavior assertions.

- [ ] **Step 3: Run full suite**

Run: `npm test`

Expected: PASS for all tests.

- [ ] **Step 4: Commit**

```bash
git add test/slug-page.test.js
git commit -m "test: cover slug page query behavior"
```

## Self-Review Notes

- Spec coverage: Covers slug pages per unique published slug, newest-first input from `slugGroups`, header, count, title/date/file filters, file query parameter preselection and update, object cards, dashboard file-filter links, and basic HTML content rendering without escaping content wholesale.
- Placeholder scan: Every code change is concrete and all referenced functions are defined in this plan or previous plans.
- Type consistency: `renderSlugPage(slug, objects)`, `sourceFile`, and `slugGroups` match the architecture/data plan.
