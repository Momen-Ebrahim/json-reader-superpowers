# JSON Reader Plan Progress

Last checked: 2026-05-19

This progress file is based on the current source and test files, not the unchecked boxes inside the plan documents. The plan checkboxes are still mostly unchecked even where implementation exists.

## Summary

| Plan | Status | Done | Remaining |
| --- | --- | --- | --- |
| `2026-05-19-json-reader-static-generator-design.md` | Mostly done | Package scripts, dashboard renderer, generator orchestration, CLI entrypoint, source stylesheet | None obvious from this plan; implementation includes extra output-safety checks |
| `2026-05-19-json-reader-architecture-data.md` | Done | JSON reader, validator, build-state collection, dashboard slug/file links | None obvious from this plan |
| `2026-05-19-json-reader-generated-pages.md` | Done | `renderSlugPage`, safe JSON embedding, generated slug HTML files, slug-page tests, URL query behavior, encoded slug filenames | None obvious from this plan; implementation includes extra filename-safety coverage |
| `2026-05-19-json-reader-output-styling.md` | Done | Cleanup regression test, local asset-link assertions, slug-page/dashboard responsive CSS, `style.test.js`, regenerated output stylesheet | None obvious from this plan |
| `2026-05-19-json-reader-errors-testing.md` | Partial | Reader warnings, validation warnings, dashboard warning rendering, draft exclusion in core pipeline | Missing planned tests, injectable CLI logger/build options, integration test, slug-page related behavior |

## Plan Details

### `2026-05-19-json-reader-static-generator-design.md`

Status: mostly done.

Implemented:

- Task 1: `package.json` has `build` and `test` scripts.
- Task 2: `src/html.js` exports `renderDashboard` and `escapeHtml`.
- Task 2: `test/generator.test.js` covers the offline dashboard document.
- Task 3: `src/generator.js` exports `buildSite`, `cleanOutput`, `copyStylesheet`, and `createEmptyBuildState`.
- Task 3: `test/generator.test.js` covers writing `dashboard.html` and copying `assets/style.css`.
- Task 4: `src/index.js` exists as the CLI entrypoint.
- Task 4: `src/assets/style.css` exists.

Notes:

- `src/generator.js` now also includes output-directory safety validation beyond the original scaffold plan.
- `src/index.js` uses `path.join(__dirname, 'assets', 'style.css')`, so the CLI can run from another working directory.

### `2026-05-19-json-reader-architecture-data.md`

Status: done.

Implemented:

- Task 1: `src/reader.js` exists and reads object or array JSON files.
- Task 1: `test/reader.test.js` covers missing data folders, single-object JSON, array JSON, invalid JSON, and primitive JSON roots.
- Task 2: `src/validator.js` exists and validates required fields, real `YYYY-MM-DD` dates, tags, draft defaulting, and `sourceFile`.
- Task 2: `test/validator.test.js` covers the planned validator behavior.
- Task 3: `src/generator.js` exports `collectBuildState`, groups published objects by slug, sorts newest-first, records file summaries, and counts warnings.
- Task 3: `test/data-pipeline.test.js` covers grouping, stats, invalid object warnings, and file summaries.
- Task 4: `src/html.js` renders dashboard slug links and per-file slug-count links.
- Task 4: `test/generator.test.js` covers dashboard slug cards and file summary links.

Notes:

- Dashboard hrefs use `encodeURIComponent(slug)` for safer URL output, which differs slightly from the literal snippets in the plan but preserves the intended behavior.

### `2026-05-19-json-reader-generated-pages.md`

Status: done.

Implemented:

- Task 1: `src/html.js` exports `renderSlugPage`, `safeJson`, and `encodeSlugFileName`.
- Task 1: `test/slug-page.test.js` covers slug headings, counts, controls, file options, object cards, raw content rendering, and embedded JSON payloads.
- Task 2: `src/generator.js` imports `renderSlugPage` and writes one slug HTML file for each published `slugGroups` entry.
- Task 2: `test/generator.test.js` covers generated slug files, draft exclusion, encoded slug filenames, and path-like slug safety.
- Task 3: `test/slug-page.test.js` covers the file query-parameter script snippets for reading and updating `?file=`.

Remaining:

- None obvious from this plan.

Notes:

- Generated slug filenames use `encodeSlugFileName(slug)`, which matches dashboard hrefs and additionally encodes `*` as `%2A` so valid slugs do not create invalid Windows filenames.

### `2026-05-19-json-reader-output-styling.md`

Status: done.

Implemented:

- Task 1: `cleanOutput` removes the output directory and recreates `assets/`.
- Task 1: `test/generator.test.js` covers deleting stale generated files before writing new output and copying `assets/style.css`.
- Task 2: `test/generator.test.js` verifies generated dashboard and slug pages link only to the shared local stylesheet, with no remote asset references or script `src`.
- Task 3: `src/assets/style.css` includes the complete responsive dashboard and slug-page CSS from the plan.
- Task 3: `test/style.test.js` verifies required dashboard/slug selectors and checks for no `@import` or remote CSS references.
- Task 3: `output/assets/style.css` has been regenerated from `src/assets/style.css`.

Remaining:

- None obvious from this plan.

Evidence:

- `test/generator.test.js` includes `buildSite deletes old generated files before writing new output` and `generated HTML links only to the shared local stylesheet`.
- `src/assets/style.css` includes slug-page selectors such as `.filter-panel`, `.content-card`, `.content-body`, `.tags`, and `.empty-state`.
- `test/style.test.js` exists and covers required selectors plus offline-friendly CSS checks.
- `npm test` passes with 33 tests, and `npm run build` regenerates the stylesheet successfully.

### `2026-05-19-json-reader-errors-testing.md`

Status: partial.

Implemented:

- Task 1: `readJsonFiles` returns `Data folder not found: data` for an explicitly missing data directory.
- Task 1: `collectBuildState` sets `warningCount` from `state.warnings.length`.
- Task 2: Core draft exclusion exists in `collectBuildState`; drafts are counted but not added to `slugGroups`.
- Task 2: Dashboard rendering includes `No published slugs found.` when there are no slug groups.
- Task 3: CLI prints warnings from `result.warnings` to `console.warn`.

Remaining:

- Task 1: Add the planned missing data build test to `test/generator.test.js`.
- Task 2: Add the planned no-published pipeline and no slug file generation tests.
- Task 3: Change `main` to accept injected `buildOptions` and `logger` if that testability requirement is still wanted.
- Task 3: Create `test/cli.test.js`.
- Task 4: Create `test/integration.test.js`.

Notes:

- Current `buildSite()` creates the default `data/` directory when `dataDir` is omitted, so the CLI test in `test/generator.test.js` expects `Generated dashboard.html with 0 warnings.` from a fresh working directory.
- The errors-testing plan expects an injectable CLI path that can pass an explicit missing `dataDir` and capture `Warning: Data folder not found: data`; that injectable `main({ buildOptions, logger })` API is not implemented.

## Current Test Files

Present:

- `test/reader.test.js`
- `test/validator.test.js`
- `test/data-pipeline.test.js`
- `test/generator.test.js`
- `test/slug-page.test.js`
- `test/style.test.js`

Missing from plans:

- `test/cli.test.js`
- `test/integration.test.js`

## Recommended Next Work

1. Finish the missing tests from `2026-05-19-json-reader-errors-testing.md`, deciding first whether the CLI should keep the current default-data-directory creation behavior or switch to the injectable API from the plan.
