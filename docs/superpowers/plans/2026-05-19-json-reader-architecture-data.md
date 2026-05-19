# JSON Reader Architecture And Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JSON data reading, object validation, draft handling, per-file summaries, and published slug grouping.

**Architecture:** Keep data concerns in focused modules: `reader.js` reads JSON files and normalizes object arrays, `validator.js` validates and normalizes objects, and `generator.js` combines those results into the build state consumed by HTML rendering. Slug grouping is computed from valid published objects and preserves each object's source JSON file name.

**Tech Stack:** Node.js built-in `fs`, `path`, `node:test`, CommonJS modules.

---

## File Structure

- Create: `src/reader.js` - read `data/*.json`, accept a single object or an array of objects, and report file-level warnings.
- Create: `src/validator.js` - validate object shape, normalize optional fields, and identify published objects.
- Modify: `src/generator.js` - call reader and validator, compute dashboard stats, compute file summaries, group published objects by slug newest first.
- Modify: `src/html.js` - render real slug cards and file summary links from computed build state.
- Create: `test/reader.test.js` - unit tests for reading missing folders, object JSON, array JSON, invalid JSON, and unsupported JSON roots.
- Create: `test/validator.test.js` - unit tests for validation rules and draft defaulting.
- Create: `test/data-pipeline.test.js` - unit tests for grouping, stats, file summaries, and newest-first ordering.

### Task 1: JSON Reader

**Files:**
- Create: `src/reader.js`
- Test: `test/reader.test.js`

- [ ] **Step 1: Write failing reader tests**

Create `test/reader.test.js` with:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL with `Cannot find module '../src/reader'`.

- [ ] **Step 3: Implement JSON reader**

Create `src/reader.js` with:

```js
const fs = require('node:fs/promises');
const path = require('node:path');

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function readJsonFiles(dataDir) {
  const warnings = [];
  const files = [];

  let entries;
  try {
    entries = await fs.readdir(dataDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      warnings.push(`Data folder not found: ${path.basename(dataDir)}`);
      return { files, warnings };
    }
    throw error;
  }

  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  for (const fileName of jsonFiles) {
    const filePath = path.join(dataDir, fileName);
    let parsed;
    try {
      parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (error) {
      warnings.push(`${fileName} contains invalid JSON: ${error.message}`);
      continue;
    }

    if (Array.isArray(parsed)) {
      files.push({ fileName, objects: parsed });
      continue;
    }

    if (isPlainObject(parsed)) {
      files.push({ fileName, objects: [parsed] });
      continue;
    }

    warnings.push(`${fileName} must contain an object or an array of objects.`);
  }

  return { files, warnings };
}

module.exports = { isPlainObject, readJsonFiles };
```

- [ ] **Step 4: Run reader tests**

Run: `node --test test/reader.test.js`

Expected: PASS for all `readJsonFiles` tests.

- [ ] **Step 5: Commit**

```bash
git add src/reader.js test/reader.test.js
git commit -m "feat: read json data files"
```

### Task 2: Object Validation

**Files:**
- Create: `src/validator.js`
- Test: `test/validator.test.js`

- [ ] **Step 1: Write failing validator tests**

Create `test/validator.test.js` with:

```js
const assert = require('node:assert/strict');
const test = require('node:test');

const { validateObject } = require('../src/validator');

const validPost = {
  title: 'Title',
  slug: 'my-slug',
  date: '2026-05-18',
  content: 'Body',
  tags: ['news'],
};

test('validateObject normalizes valid published objects', () => {
  const result = validateObject(validPost, { fileName: 'posts.json', index: 0 });

  assert.equal(result.valid, true);
  assert.deepEqual(result.object, {
    title: 'Title',
    slug: 'my-slug',
    date: '2026-05-18',
    content: 'Body',
    tags: ['news'],
    draft: false,
    sourceFile: 'posts.json',
  });
});

test('validateObject accepts draft true and marks unpublished', () => {
  const result = validateObject({ ...validPost, draft: true }, { fileName: 'drafts.json', index: 1 });

  assert.equal(result.valid, true);
  assert.equal(result.object.draft, true);
});

test('validateObject rejects missing required strings', () => {
  const result = validateObject({ ...validPost, title: '' }, { fileName: 'posts.json', index: 2 });

  assert.equal(result.valid, false);
  assert.equal(result.warning, 'posts.json object 3 has invalid title: expected a non-empty string.');
});

test('validateObject rejects impossible YYYY-MM-DD dates', () => {
  const result = validateObject({ ...validPost, date: '2026-02-31' }, { fileName: 'posts.json', index: 0 });

  assert.equal(result.valid, false);
  assert.equal(result.warning, 'posts.json object 1 has invalid date: expected a real YYYY-MM-DD date.');
});

test('validateObject rejects non-string tags', () => {
  const result = validateObject({ ...validPost, tags: ['ok', 3] }, { fileName: 'posts.json', index: 0 });

  assert.equal(result.valid, false);
  assert.equal(result.warning, 'posts.json object 1 has invalid tags: expected an array of strings.');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/validator.test.js`

Expected: FAIL with `Cannot find module '../src/validator'`.

- [ ] **Step 3: Implement validation**

Create `src/validator.js` with:

```js
const { isPlainObject } = require('./reader');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function invalid(fileName, index, field, expected) {
  return {
    valid: false,
    warning: `${fileName} object ${index + 1} has invalid ${field}: expected ${expected}.`,
  };
}

function validateObject(value, { fileName, index }) {
  if (!isPlainObject(value)) {
    return invalid(fileName, index, 'object', 'a JSON object');
  }

  for (const field of ['title', 'slug', 'date', 'content']) {
    if (!isNonEmptyString(value[field])) {
      return invalid(fileName, index, field, 'a non-empty string');
    }
  }

  if (!isValidDateString(value.date)) {
    return invalid(fileName, index, 'date', 'a real YYYY-MM-DD date');
  }

  if (value.tags !== undefined && (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== 'string'))) {
    return invalid(fileName, index, 'tags', 'an array of strings');
  }

  return {
    valid: true,
    object: {
      title: value.title,
      slug: value.slug,
      date: value.date,
      content: value.content,
      tags: value.tags || [],
      draft: value.draft === true,
      sourceFile: fileName,
    },
  };
}

module.exports = { isNonEmptyString, isValidDateString, validateObject };
```

- [ ] **Step 4: Run validator tests**

Run: `node --test test/validator.test.js`

Expected: PASS for all `validateObject` tests.

- [ ] **Step 5: Commit**

```bash
git add src/validator.js test/validator.test.js
git commit -m "feat: validate json objects"
```

### Task 3: Build State Assembly

**Files:**
- Modify: `src/generator.js`
- Test: `test/data-pipeline.test.js`

- [ ] **Step 1: Write failing pipeline tests**

Create `test/data-pipeline.test.js` with:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { collectBuildState } = require('../src/generator');

async function writeFixture(files) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-pipeline-'));
  const dataDir = path.join(root, 'data');
  await fs.mkdir(dataDir);

  for (const [fileName, data] of Object.entries(files)) {
    await fs.writeFile(path.join(dataDir, fileName), JSON.stringify(data));
  }

  return dataDir;
}

test('collectBuildState validates objects and groups published slugs newest first', async () => {
  const dataDir = await writeFixture({
    'a.json': [
      { title: 'Old', slug: 'alpha', date: '2026-01-01', content: 'Old body' },
      { title: 'Draft', slug: 'alpha', date: '2026-05-01', content: 'Draft body', draft: true },
    ],
    'b.json': { title: 'New', slug: 'alpha', date: '2026-05-18', content: 'New body', tags: ['release'] },
  });

  const state = await collectBuildState(dataDir);

  assert.deepEqual(state.stats, {
    filesRead: 2,
    validObjects: 3,
    publishedObjects: 2,
    draftObjects: 1,
    uniquePublishedSlugs: 1,
    warningCount: 0,
  });
  assert.deepEqual(state.slugGroups.get('alpha').map((object) => object.title), ['New', 'Old']);
  assert.deepEqual(state.slugGroups.get('alpha').map((object) => object.sourceFile), ['b.json', 'a.json']);
});

test('collectBuildState records invalid object warnings and file summaries', async () => {
  const dataDir = await writeFixture({
    'mixed.json': [
      { title: 'Good', slug: 'good', date: '2026-05-18', content: 'Body' },
      { title: 'Bad', slug: 'bad', date: 'not-a-date', content: 'Body' },
    ],
  });

  const state = await collectBuildState(dataDir);

  assert.equal(state.stats.filesRead, 1);
  assert.equal(state.stats.validObjects, 1);
  assert.equal(state.stats.publishedObjects, 1);
  assert.equal(state.stats.warningCount, 1);
  assert.deepEqual(state.fileSummaries, [{
    fileName: 'mixed.json',
    validObjects: 1,
    publishedObjects: 1,
    draftObjects: 0,
    publishedSlugCounts: new Map([['good', 1]]),
  }]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/data-pipeline.test.js`

Expected: FAIL with `collectBuildState is not a function`.

- [ ] **Step 3: Implement build state assembly**

Replace `src/generator.js` with:

```js
const fs = require('node:fs/promises');
const path = require('node:path');

const { renderDashboard } = require('./html');
const { readJsonFiles } = require('./reader');
const { validateObject } = require('./validator');

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

function sortSlugGroups(slugGroups) {
  for (const objects of slugGroups.values()) {
    objects.sort((a, b) => b.date.localeCompare(a.date));
  }
}

async function collectBuildState(dataDir) {
  const readResult = await readJsonFiles(dataDir);
  const state = createEmptyBuildState();
  state.warnings.push(...readResult.warnings);
  state.stats.filesRead = readResult.files.length;

  for (const file of readResult.files) {
    const summary = {
      fileName: file.fileName,
      validObjects: 0,
      publishedObjects: 0,
      draftObjects: 0,
      publishedSlugCounts: new Map(),
    };

    file.objects.forEach((rawObject, index) => {
      const validation = validateObject(rawObject, { fileName: file.fileName, index });
      if (!validation.valid) {
        state.warnings.push(validation.warning);
        return;
      }

      const object = validation.object;
      state.stats.validObjects += 1;
      summary.validObjects += 1;

      if (object.draft) {
        state.stats.draftObjects += 1;
        summary.draftObjects += 1;
        return;
      }

      state.stats.publishedObjects += 1;
      summary.publishedObjects += 1;
      summary.publishedSlugCounts.set(object.slug, (summary.publishedSlugCounts.get(object.slug) || 0) + 1);

      if (!state.slugGroups.has(object.slug)) {
        state.slugGroups.set(object.slug, []);
      }
      state.slugGroups.get(object.slug).push(object);
    });

    state.fileSummaries.push(summary);
  }

  sortSlugGroups(state.slugGroups);
  state.stats.uniquePublishedSlugs = state.slugGroups.size;
  state.stats.warningCount = state.warnings.length;
  return state;
}

async function buildSite({
  dataDir = path.join(process.cwd(), 'data'),
  outputDir = path.join(process.cwd(), 'output'),
  assetSourcePath = path.join(process.cwd(), 'src', 'assets', 'style.css'),
} = {}) {
  await cleanOutput(outputDir);
  await copyStylesheet(assetSourcePath, outputDir);

  const buildState = await collectBuildState(dataDir);
  const dashboardHtml = renderDashboard(buildState);
  await fs.writeFile(path.join(outputDir, 'dashboard.html'), dashboardHtml);

  return buildState;
}

module.exports = { buildSite, cleanOutput, collectBuildState, copyStylesheet, createEmptyBuildState, sortSlugGroups };
```

- [ ] **Step 4: Run pipeline tests**

Run: `node --test test/data-pipeline.test.js`

Expected: PASS for grouping, stats, and file summary tests.

- [ ] **Step 5: Commit**

```bash
git add src/generator.js test/data-pipeline.test.js
git commit -m "feat: collect json build state"
```

### Task 4: Dashboard Data Links

**Files:**
- Modify: `src/html.js`
- Modify: `test/generator.test.js`

- [ ] **Step 1: Add failing dashboard link test**

Append to `test/generator.test.js`:

```js
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
  assert.match(html, /alpha \(2\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/generator.test.js`

Expected: FAIL because the file summary still renders a plain `slugSummary` value.

- [ ] **Step 3: Update dashboard rendering**

In `src/html.js`, replace the `fileRows` mapping inside `renderDashboard` with:

```js
  const fileRows = fileSummaries
    .map((file) => {
      const slugLinks = Array.from(file.publishedSlugCounts.entries())
        .map(([slug, count]) => `<a href="${escapeHtml(slug)}.html?file=${encodeURIComponent(file.fileName)}">${escapeHtml(slug)} (${count})</a>`)
        .join(', ');

      return `<tr><td>${escapeHtml(file.fileName)}</td><td>${file.validObjects}</td><td>${file.publishedObjects}</td><td>${file.draftObjects}</td><td>${slugLinks || 'No published slugs'}</td></tr>`;
    })
    .join('');
```

- [ ] **Step 4: Run full tests**

Run: `npm test`

Expected: PASS for reader, validator, pipeline, and generator tests.

- [ ] **Step 5: Commit**

```bash
git add src/html.js test/generator.test.js
git commit -m "feat: link dashboard data summaries"
```

## Self-Review Notes

- Spec coverage: Covers data folder reading, object-or-array JSON files, validation rules, draft defaulting, published grouping by slug, newest-first ordering, source file retention, dashboard counts, and file summaries.
- Placeholder scan: All tasks include exact code and commands; no undefined functions are referenced without a defining task.
- Type consistency: `sourceFile`, `publishedSlugCounts`, `slugGroups`, and stat property names match across reader, validator, generator, renderer, and tests.
