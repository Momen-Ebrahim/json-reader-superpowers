# JSON Reader Errors And Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish warning behavior and test coverage for missing data, invalid inputs, no-published-object builds, dashboard warning details, slug-page filtering data, and full output generation.

**Architecture:** Preserve the data pipeline from earlier plans and add tests around the public `buildSite`, `collectBuildState`, and CLI `main` behavior. Warning strings are produced by `reader.js` and `validator.js`, surfaced in terminal output by `index.js`, and rendered in `dashboard.html` by `html.js`.

**Tech Stack:** Node.js built-in `fs`, `path`, `node:test`, CommonJS modules, static HTML/CSS.

---

## File Structure

- Modify: `src/index.js` - make CLI warning output testable by allowing injected logger and build options.
- Modify: `src/html.js` - ensure warning count and warning details render clearly on dashboard.
- Modify: `test/reader.test.js` - keep missing folder, invalid JSON, unsupported root tests.
- Modify: `test/validator.test.js` - keep validation coverage for required fields, date, tags, draft defaulting.
- Modify: `test/data-pipeline.test.js` - add no-published-object grouping coverage.
- Modify: `test/generator.test.js` - add missing data build and no slug page coverage.
- Create: `test/cli.test.js` - verify terminal warning output.
- Create: `test/integration.test.js` - verify sample `data/` input generates dashboard, slug pages, copied stylesheet, and expected links.

### Task 1: Missing Data Build Behavior

**Files:**
- Modify: `test/generator.test.js`

- [ ] **Step 1: Add missing data build test**

Append to `test/generator.test.js`:

```js
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
```

- [ ] **Step 2: Run test**

Run: `node --test test/generator.test.js`

Expected: PASS if previous plans already preserve missing data as a warning and generate no slug pages; FAIL if missing data still throws or warning count is not rendered.

- [ ] **Step 3: Fix missing data behavior only if needed**

If the test fails because missing data throws, ensure `readJsonFiles` in `src/reader.js` contains this `ENOENT` branch:

```js
    if (error.code === 'ENOENT') {
      warnings.push(`Data folder not found: ${path.basename(dataDir)}`);
      return { files, warnings };
    }
```

If the test fails because no warning count appears, ensure `collectBuildState` in `src/generator.js` sets:

```js
  state.stats.warningCount = state.warnings.length;
```

- [ ] **Step 4: Run generator tests**

Run: `node --test test/generator.test.js`

Expected: PASS including missing data behavior.

- [ ] **Step 5: Commit**

```bash
git add src/reader.js src/generator.js test/generator.test.js
git commit -m "test: cover missing data builds"
```

### Task 2: No Published Objects Behavior

**Files:**
- Modify: `test/data-pipeline.test.js`
- Modify: `test/generator.test.js`

- [ ] **Step 1: Add no-published pipeline test**

Append to `test/data-pipeline.test.js`:

```js
test('collectBuildState counts drafts without creating published slug groups', async () => {
  const dataDir = await writeFixture({
    'drafts.json': [
      { title: 'Draft One', slug: 'drafts', date: '2026-05-18', content: 'Hidden', draft: true },
      { title: 'Draft Two', slug: 'drafts', date: '2026-05-19', content: 'Hidden', draft: true },
    ],
  });

  const state = await collectBuildState(dataDir);

  assert.equal(state.stats.validObjects, 2);
  assert.equal(state.stats.publishedObjects, 0);
  assert.equal(state.stats.draftObjects, 2);
  assert.equal(state.stats.uniquePublishedSlugs, 0);
  assert.equal(state.slugGroups.size, 0);
});
```

- [ ] **Step 2: Add no slug file generation test**

Append to `test/generator.test.js`:

```js
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
```

- [ ] **Step 3: Run tests**

Run: `node --test test/data-pipeline.test.js test/generator.test.js`

Expected: PASS if drafts are counted but excluded from `slugGroups`; FAIL if draft slug pages are generated.

- [ ] **Step 4: Fix draft exclusion only if needed**

If the tests fail, ensure `collectBuildState` returns immediately after counting a draft:

```js
      if (object.draft) {
        state.stats.draftObjects += 1;
        summary.draftObjects += 1;
        return;
      }
```

- [ ] **Step 5: Run full tests**

Run: `npm test`

Expected: PASS for all tests.

- [ ] **Step 6: Commit**

```bash
git add src/generator.js test/data-pipeline.test.js test/generator.test.js
git commit -m "test: cover draft-only builds"
```

### Task 3: CLI Warning Output

**Files:**
- Modify: `src/index.js`
- Create: `test/cli.test.js`

- [ ] **Step 1: Write failing CLI warning test**

Create `test/cli.test.js` with:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { main } = require('../src/index');

test('main prints warnings to the provided logger', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-cli-'));
  const outputDir = path.join(fixtureRoot, 'output');
  const assetSourcePath = path.join(fixtureRoot, 'src', 'assets', 'style.css');
  const warnings = [];
  const logs = [];
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');

  await main({
    buildOptions: {
      dataDir: path.join(fixtureRoot, 'data'),
      outputDir,
      assetSourcePath,
    },
    logger: {
      warn(message) {
        warnings.push(message);
      },
      log(message) {
        logs.push(message);
      },
      error(message) {
        throw message;
      },
    },
  });

  assert.deepEqual(warnings, ['Warning: Data folder not found: data']);
  assert.deepEqual(logs, ['Generated dashboard.html with 1 warnings.']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/cli.test.js`

Expected: FAIL because `main` does not accept injected `buildOptions` and `logger` yet.

- [ ] **Step 3: Make CLI testable**

Replace `src/index.js` with:

```js
const { buildSite } = require('./generator');

async function main({ buildOptions, logger = console } = {}) {
  const result = await buildSite(buildOptions);

  for (const warning of result.warnings) {
    logger.warn(`Warning: ${warning}`);
  }

  logger.log(`Generated dashboard.html with ${result.stats.warningCount} warnings.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { main };
```

- [ ] **Step 4: Run CLI test**

Run: `node --test test/cli.test.js`

Expected: PASS and warnings are captured through the injected logger.

- [ ] **Step 5: Run full tests**

Run: `npm test`

Expected: PASS for all tests.

- [ ] **Step 6: Commit**

```bash
git add src/index.js test/cli.test.js
git commit -m "test: cover cli warning output"
```

### Task 4: Integration Test With Sample Data

**Files:**
- Create: `test/integration.test.js`

- [ ] **Step 1: Write integration test**

Create `test/integration.test.js` with:

```js
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
```

- [ ] **Step 2: Run integration test**

Run: `node --test test/integration.test.js`

Expected: PASS if all prior behavior is integrated correctly; FAIL with a specific output mismatch if counts, files, warnings, ordering, or links are wrong.

- [ ] **Step 3: Fix integration mismatches directly**

If the integration test fails because `filesRead` includes invalid JSON files, keep the spec's dashboard wording `JSON files read` aligned with accepted files by leaving `filesRead = readResult.files.length`; the expected count remains `2` because `broken.json` is skipped.

If the integration test fails because alpha ordering is old before new, ensure `sortSlugGroups` sorts with:

```js
objects.sort((a, b) => b.date.localeCompare(a.date));
```

If the integration test fails because dashboard file-filter links are escaped differently, use this exact link generation in `src/html.js`:

```js
`<a href="${escapeHtml(slug)}.html?file=${encodeURIComponent(file.fileName)}">${escapeHtml(slug)} (${count})</a>`
```

- [ ] **Step 4: Run full tests and build**

Run: `npm test`

Expected: PASS for all tests.

Run: `npm run build`

Expected: PASS and warnings print if local `data/` is absent or contains invalid input.

- [ ] **Step 5: Commit**

```bash
git add src/generator.js src/html.js test/integration.test.js output/dashboard.html output/assets/style.css
git commit -m "test: add full generation integration coverage"
```

## Self-Review Notes

- Spec coverage: Covers missing `data/`, invalid JSON warnings, unsupported roots through reader tests, invalid object warnings through validator tests, dashboard warning count/details, no-published-object dashboard-only generation, terminal warnings, slug-page filtering data/query behavior from the generated-pages plan, and full output generation.
- Placeholder scan: All fixes and tests are concrete, with exact commands and expected outcomes.
- Type consistency: `main({ buildOptions, logger })`, `buildSite`, `collectBuildState`, warning strings, and stats property names match previous plans.
