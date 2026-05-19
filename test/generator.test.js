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
