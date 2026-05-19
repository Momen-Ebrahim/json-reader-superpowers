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
