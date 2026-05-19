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

test('renderSlugPage script reads and updates the file query parameter', () => {
  const html = renderSlugPage('alpha', objects);

  assert.match(html, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(html, /params\.get\('file'\)/);
  assert.match(html, /url\.searchParams\.set\('file', fileFilter\.value\)/);
  assert.match(html, /url\.searchParams\.delete\('file'\)/);
  assert.match(html, /window\.history\.replaceState\(null, '', url\)/);
});
