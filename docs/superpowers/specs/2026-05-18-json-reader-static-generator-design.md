# JSON Reader Static Generator Design

## Overview

Build a small Node.js static site generator that reads JSON files from `data/` and generates browsable HTML files in `output/`.

The generator creates:

- `output/dashboard.html`
- `output/<slug>.html` for each unique published slug
- `output/assets/style.css`, copied from `src/assets/style.css`

The generated pages are static, work offline, and do not require a server.

## Architecture

Project structure:

```text
data/
  *.json

src/
  index.js
  reader.js
  validator.js
  generator.js
  html.js
  assets/
    style.css

output/
  assets/style.css
  dashboard.html
  <slug>.html
```

Build flow:

1. Clean old generated files from `output/`.
2. Read every `.json` file inside `data/` if the folder exists.
3. Accept JSON files containing either one object or an array of objects.
4. Validate each object.
5. Skip invalid files and invalid objects, recording warnings.
6. Group valid published objects by `slug`.
7. Generate one page per unique published slug.
8. Generate the dashboard page.

If `data/` is missing, the build still succeeds. The only generated HTML page is `output/dashboard.html`; the shared stylesheet is still copied so the dashboard renders correctly.

## Data Rules

Each valid object has this shape:

```json
{
  "title": "string",
  "slug": "string",
  "date": "YYYY-MM-DD",
  "content": "string",
  "tags": ["string"],
  "draft": false
}
```

Validation rules:

- `title`, `slug`, `date`, and `content` are required strings.
- `date` must be a valid `YYYY-MM-DD` date.
- `tags` is optional, but when present it must be an array of strings.
- `draft` is optional; missing `draft` means `false`.
- Published means `draft !== true`.
- Draft objects are counted on the dashboard but do not generate slug pages.
- Slug pages include only published objects.
- Objects with the same `slug` are shown together, newest first by `date`.
- Every valid object keeps its source JSON file name for dashboard links and slug-page filtering.

## Slug Pages

For every unique published slug, generate:

```text
output/<slug>.html
```

Each slug page shows all published objects with that slug, sorted newest first.

Page features:

- Header showing the slug.
- Summary count of matching objects.
- Search input for title filtering.
- Date range filters with `from` and `to` inputs.
- JSON file dropdown with `All files` plus only source JSON files that contain published objects for that slug.
- Object cards showing title, date, source JSON file, tags, and content.

Filtering runs in the browser with inline JavaScript, so users do not need to rebuild after filtering.

URL behavior:

- `output/my-slug.html` shows all published objects for `my-slug`.
- `output/my-slug.html?file=posts.json` preselects that source file and shows only matching objects from that file.
- Changing the JSON file dropdown updates visible objects and should update the `file` query parameter.
- Title search and date range filters affect only the current browser view.

Content rendering:

- `content` may contain plain text or basic HTML.
- Generated pages render basic HTML tags as HTML rather than escaping all content as plain text.

## Dashboard Page

Generate:

```text
output/dashboard.html
```

Dashboard content:

- Total JSON files read.
- Total valid objects read.
- Total published objects.
- Total draft objects.
- Unique published slug count.
- Warning count.
- Warning details.
- Cards for every unique published slug.

Each slug card links to `<slug>.html` and shows the slug name plus the number of published objects for that slug.

JSON files table columns:

- File name
- Valid objects
- Published
- Drafts
- Published slug counts

The `Published slug counts` column lists each published slug found in that file with its count. Each listed slug links to:

```text
<slug>.html?file=<json-file-name>
```

That link opens the slug page filtered to objects from the selected JSON file.

## Output And Styling

The build deletes old generated files from `output/` before generating new files.

The source stylesheet is permanent project code:

```text
src/assets/style.css
```

During each build, the generator copies it to:

```text
output/assets/style.css
```

Generated pages link to the shared stylesheet at `assets/style.css`.

Styling requirements:

- No external CSS or JavaScript dependencies.
- Pages work offline.
- Clean readable layout.
- Dashboard uses stat cards, slug cards, and a file table.
- Slug pages use a filter panel and content cards.
- Mobile layout stacks cards, filters, and table content cleanly.

## Error And Warning Behavior

- Missing `data/` folder does not stop the build.
- If `data/` is missing, generate `output/dashboard.html` with empty stats and a warning that the folder was not found. Do not generate slug pages.
- Invalid JSON files are skipped and recorded as warnings.
- JSON files that contain neither an object nor an array are skipped and recorded as warnings.
- Invalid objects are skipped and recorded as warnings.
- Warnings appear in the terminal.
- Dashboard shows warning count and warning details.
- If there are no published objects, still generate `dashboard.html`, but no slug pages.

Empty dashboard stats for missing `data/`:

- `0` JSON files read
- `0` valid objects
- `0` published objects
- `0` draft objects
- `0` unique published slugs

## Testing Strategy

Unit tests should cover:

- Missing `data/` folder behavior.
- Reading object JSON files.
- Reading array JSON files.
- Validation rules.
- Grouping by slug.
- Dashboard stats.
- Slug-page filtering data and query parameter behavior.

Integration tests should cover:

- Sample `data/` input.
- Full `output/` generation.
- Expected dashboard and slug files.

## Recommended Implementation Approach

Use plain Node.js modules for the first version.

This avoids unnecessary dependencies, keeps the generated output offline-friendly, and matches the requested static `output/*.html` workflow. A template engine or Express server can be considered later if the project grows, but they are not needed for this design.
