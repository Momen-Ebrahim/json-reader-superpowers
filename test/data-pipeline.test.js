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
