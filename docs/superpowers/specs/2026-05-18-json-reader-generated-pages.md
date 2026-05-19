# JSON Reader Generated Pages

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
