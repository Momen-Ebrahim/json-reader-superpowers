# JSON Reader Static Generator Design

## Overview

Build a small Node.js static site generator that reads JSON files from `data/` and generates browsable static HTML files in `output/`.

The generated site includes:

- `output/dashboard.html`
- `output/<slug>.html` for each unique published slug
- `output/assets/style.css`, copied from `src/assets/style.css`

The generated pages work offline and do not require a server.

## Spec Parts

This design is split into smaller focused files:

- [Architecture And Data](./2026-05-18-json-reader-architecture-data.md)
- [Generated Pages](./2026-05-18-json-reader-generated-pages.md)
- [Output And Styling](./2026-05-18-json-reader-output-styling.md)
- [Errors And Testing](./2026-05-18-json-reader-errors-testing.md)

## Recommended Implementation Approach

Use plain Node.js modules for the first version.

This avoids unnecessary dependencies, keeps the generated output offline-friendly, and matches the requested static `output/*.html` workflow. A template engine or Express server can be considered later if the project grows, but they are not needed for this design.
