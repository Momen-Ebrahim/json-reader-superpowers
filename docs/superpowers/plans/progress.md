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
| `2026-05-19-json-reader-errors-testing.md` | Done | Missing-data build coverage, no-published-object coverage, injectable CLI logger/build options, terminal warning test, full generation integration test | None obvious from this plan |

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

Status: done.

Implemented:

- Task 1: `readJsonFiles` returns `Data folder not found: data` for an explicitly missing data directory.
- Task 1: `collectBuildState` sets `warningCount` from `state.warnings.length`.
- Task 1: `test/generator.test.js` covers missing data builds that generate only `dashboard.html` and `assets/style.css`.
- Task 2: Core draft exclusion exists in `collectBuildState`; drafts are counted but not added to `slugGroups`.
- Task 2: `test/data-pipeline.test.js` covers draft-only build state with zero published slug groups.
- Task 2: `test/generator.test.js` covers draft-only builds that generate no slug pages and render `No published slugs found.`.
- Task 3: `src/index.js` exposes `main({ buildOptions, logger })` while preserving default CLI stylesheet behavior.
- Task 3: `test/cli.test.js` verifies terminal warning output through an injected logger.
- Task 4: `test/integration.test.js` verifies sample data generation, copied stylesheet, dashboard warning details, slug links, published slug pages, ordering, and draft exclusion.

Remaining:

- None obvious from this plan.

Notes:

- Current `buildSite()` creates the default `data/` directory when `dataDir` is omitted, so the CLI test in `test/generator.test.js` expects `Generated dashboard.html with 0 warnings.` from a fresh working directory.
- The injectable CLI path now supports passing an explicit missing `dataDir` and capturing `Warning: Data folder not found: data` without mutating global `console`.
- `npm test` passes with 38 tests, and `npm run build` completes successfully.

## Current Test Files

Present:

- `test/reader.test.js`
- `test/validator.test.js`
- `test/data-pipeline.test.js`
- `test/generator.test.js`
- `test/cli.test.js`
- `test/integration.test.js`
- `test/slug-page.test.js`
- `test/style.test.js`

Missing from plans:

- None.

## Recommended Next Work

1. No plan gaps are currently obvious from the implemented source and test files.
