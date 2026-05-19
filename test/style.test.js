const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const test = require('node:test');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    assert.match(css, new RegExp(escapeRegExp(selector)));
  }
});

test('stylesheet has no external imports or remote asset references', async () => {
  const css = await fs.readFile('src/assets/style.css', 'utf8');

  assert.doesNotMatch(css, /@import/i);
  assert.doesNotMatch(css, /https?:\/\//i);
});

test('stylesheet hides filtered cards when scripts set the hidden attribute', async () => {
  const css = await fs.readFile('src/assets/style.css', 'utf8');

  assert.match(css, /\[hidden\]\s*{[^}]*display:\s*none\s*!important;[^}]*}/);
});
