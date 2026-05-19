const test = require('node:test');
const assert = require('node:assert/strict');

const { validateItem } = require('../src/validator');

test('validateItem accepts a complete published object and records its source file', () => {
  const result = validateItem({
    title: 'First Post',
    slug: 'notes',
    date: '2026-05-18',
    content: '<p>Hello</p>',
    tags: ['node', 'json'],
    draft: false
  }, 'posts.json', 0);

  assert.equal(result.valid, true);
  assert.deepEqual(result.value, {
    title: 'First Post',
    slug: 'notes',
    date: '2026-05-18',
    content: '<p>Hello</p>',
    tags: ['node', 'json'],
    draft: false,
    sourceFile: 'posts.json'
  });
});

test('validateItem defaults missing tags to an empty array and missing draft to false', () => {
  const result = validateItem({
    title: 'No Tags',
    slug: 'notes',
    date: '2026-05-19',
    content: 'Plain text'
  }, 'posts.json', 1);

  assert.equal(result.valid, true);
  assert.deepEqual(result.value.tags, []);
  assert.equal(result.value.draft, false);
});

test('validateItem preserves draft true so drafts can be counted without publishing', () => {
  const result = validateItem({
    title: 'Draft Post',
    slug: 'notes',
    date: '2026-05-20',
    content: 'Draft text',
    draft: true
  }, 'drafts.json', 0);

  assert.equal(result.valid, true);
  assert.equal(result.value.draft, true);
});

test('validateItem rejects non-object array entries', () => {
  const result = validateItem('not an object', 'posts.json', 2);

  assert.equal(result.valid, false);
  assert.deepEqual(result.warning, {
    type: 'invalid-object',
    file: 'posts.json',
    index: 2,
    message: 'posts.json item 3 must be an object'
  });
});

test('validateItem rejects missing required string fields', () => {
  const result = validateItem({
    title: 'Missing Content',
    slug: 'notes',
    date: '2026-05-18'
  }, 'posts.json', 0);

  assert.equal(result.valid, false);
  assert.deepEqual(result.warning, {
    type: 'invalid-object',
    file: 'posts.json',
    index: 0,
    message: 'posts.json item 1 is missing required string field: content'
  });
});

test('validateItem rejects invalid calendar dates', () => {
  const result = validateItem({
    title: 'Bad Date',
    slug: 'notes',
    date: '2026-02-30',
    content: 'Date should fail'
  }, 'posts.json', 0);

  assert.equal(result.valid, false);
  assert.deepEqual(result.warning, {
    type: 'invalid-object',
    file: 'posts.json',
    index: 0,
    message: 'posts.json item 1 has invalid date: 2026-02-30'
  });
});

test('validateItem rejects tags that are not strings', () => {
  const result = validateItem({
    title: 'Bad Tags',
    slug: 'notes',
    date: '2026-05-18',
    content: 'Tags should fail',
    tags: ['node', 42]
  }, 'posts.json', 0);

  assert.equal(result.valid, false);
  assert.deepEqual(result.warning, {
    type: 'invalid-object',
    file: 'posts.json',
    index: 0,
    message: 'posts.json item 1 tags must be an array of strings'
  });
});
