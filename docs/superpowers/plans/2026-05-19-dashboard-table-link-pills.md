# Dashboard Table Link Pills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Style published slug links inside the dashboard JSON files table as small button pills.

**Architecture:** Keep generated dashboard markup in `src/html.js` and visual presentation in `src/assets/style.css`. Add one explicit class to per-file slug count links so only table slug links receive the pill treatment.

**Tech Stack:** CommonJS, Node.js `node:test`, static HTML strings, static CSS.

---

## File Structure

- Modify: `src/html.js` - add `class="table-link-pill"` to per-file published slug count links in `renderDashboard`.
- Modify: `src/assets/style.css` - add pill, hover, and focus-visible styles for `.table-link-pill`.
- Modify: `test/generator.test.js` - assert dashboard per-file slug count links include the class.
- Modify: `test/style.test.js` - assert the stylesheet contains the table link pill selector.

### Task 1: Dashboard Table Link Pills

**Files:**
- Modify: `test/generator.test.js`
- Modify: `test/style.test.js`
- Modify: `src/html.js`
- Modify: `src/assets/style.css`

- [ ] **Step 1: Write failing HTML assertion**

In `test/generator.test.js`, update the `renderDashboard links slug cards and per-file slug counts` test to include:

```js
assert.match(html, /<a class="table-link-pill" href="alpha\.html\?file=posts\.json">alpha \(2\)<\/a>/);
```

- [ ] **Step 2: Write failing CSS assertion**

In `test/style.test.js`, add `.table-link-pill` to the selector list in `stylesheet includes dashboard and slug page layout selectors`.

- [ ] **Step 3: Run focused tests and verify failure**

Run: `node --test test/generator.test.js test/style.test.js`

Expected: FAIL because the class and CSS selector do not exist yet.

- [ ] **Step 4: Add link class**

In `src/html.js`, change the per-file slug link template to:

```js
`<a class="table-link-pill" href="${encodeSlugFileName(slug)}.html?file=${encodeURIComponent(file.fileName)}">${escapeHtml(slug)} (${count})</a>`
```

- [ ] **Step 5: Add pill styling**

In `src/assets/style.css`, add:

```css
.table-link-pill {
  display: inline-flex;
  align-items: center;
  margin: 0 4px 6px 0;
  border-radius: 999px;
  background: #2847c7;
  color: #ffffff;
  padding: 4px 10px;
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
}

.table-link-pill:hover,
.table-link-pill:focus-visible {
  background: #1d3395;
}
```

- [ ] **Step 6: Run focused tests and verify pass**

Run: `node --test test/generator.test.js test/style.test.js`

Expected: PASS.

- [ ] **Step 7: Run full test suite**

Run: `npm test`

Expected: PASS.
