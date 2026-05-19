# JSON Reader Architecture And Data

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

## Data Shape

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

## Validation Rules

- `title`, `slug`, `date`, and `content` are required strings.
- `date` must be a valid `YYYY-MM-DD` date.
- `tags` is optional, but when present it must be an array of strings.
- `draft` is optional; missing `draft` means `false`.
- Published means `draft !== true`.
- Draft objects are counted on the dashboard but do not generate slug pages.
- Slug pages include only published objects.
- Objects with the same `slug` are shown together, newest first by `date`.
- Every valid object keeps its source JSON file name for dashboard links and slug-page filtering.
