const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildDataModel } = require('../src/pipeline');

function makeDataDir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'json-reader-'));
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir);
  return dataDir;
}

test('buildDataModel returns empty stats and a warning for a missing data directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'json-reader-'));
  const dataDir = path.join(root, 'data');

  const model = buildDataModel(dataDir);

  assert.deepEqual(model.stats, {
    filesRead: 0,
    validObjects: 0,
    publishedObjects: 0,
    draftObjects: 0,
    uniquePublishedSlugs: 0,
    warnings: 1
  });
  assert.deepEqual(model.validObjects, []);
  assert.deepEqual(model.publishedObjects, []);
  assert.deepEqual(model.groupsBySlug, {});
  assert.deepEqual(model.fileStats, []);
  assert.equal(model.warnings[0].type, 'missing-data-directory');
});

test('buildDataModel validates objects, counts drafts, groups published objects by slug, and sorts newest first', () => {
  const dataDir = makeDataDir();
  fs.writeFileSync(path.join(dataDir, 'posts.json'), JSON.stringify([
    {
      title: 'Older Note',
      slug: 'notes',
      date: '2026-05-18',
      content: 'Older',
      tags: ['old']
    },
    {
      title: 'Draft Note',
      slug: 'notes',
      date: '2026-05-20',
      content: 'Draft',
      draft: true
    },
    {
      title: 'Newest Note',
      slug: 'notes',
      date: '2026-05-19',
      content: 'Newest'
    },
    {
      title: 'Bad Item',
      slug: 'broken',
      date: 'not-a-date',
      content: 'Invalid'
    }
  ]));
  fs.writeFileSync(path.join(dataDir, 'pages.json'), JSON.stringify({
    title: 'About',
    slug: 'about',
    date: '2026-05-17',
    content: '<strong>About page</strong>'
  }));

  const model = buildDataModel(dataDir);

  assert.deepEqual(model.stats, {
    filesRead: 2,
    validObjects: 4,
    publishedObjects: 3,
    draftObjects: 1,
    uniquePublishedSlugs: 2,
    warnings: 1
  });
  assert.deepEqual(Object.keys(model.groupsBySlug), ['about', 'notes']);
  assert.deepEqual(model.groupsBySlug.notes.map((item) => item.title), ['Newest Note', 'Older Note']);
  assert.deepEqual(model.groupsBySlug.about.map((item) => item.title), ['About']);
  assert.deepEqual(model.warnings, [
    {
      type: 'invalid-object',
      file: 'posts.json',
      index: 3,
      message: 'posts.json item 4 has invalid date: not-a-date'
    }
  ]);
});

test('buildDataModel returns dashboard-ready per-file stats with published slug counts', () => {
  const dataDir = makeDataDir();
  fs.writeFileSync(path.join(dataDir, 'a.json'), JSON.stringify([
    {
      title: 'First',
      slug: 'notes',
      date: '2026-05-18',
      content: 'One'
    },
    {
      title: 'Second',
      slug: 'notes',
      date: '2026-05-19',
      content: 'Two'
    },
    {
      title: 'Draft',
      slug: 'notes',
      date: '2026-05-20',
      content: 'Draft',
      draft: true
    }
  ]));
  fs.writeFileSync(path.join(dataDir, 'b.json'), JSON.stringify({
    title: 'Guide',
    slug: 'guide',
    date: '2026-05-18',
    content: 'Guide'
  }));

  const model = buildDataModel(dataDir);

  assert.deepEqual(model.fileStats, [
    {
      file: 'a.json',
      validObjects: 3,
      publishedObjects: 2,
      draftObjects: 1,
      publishedSlugCounts: {
        notes: 2
      }
    },
    {
      file: 'b.json',
      validObjects: 1,
      publishedObjects: 1,
      draftObjects: 0,
      publishedSlugCounts: {
        guide: 1
      }
    }
  ]);
});
