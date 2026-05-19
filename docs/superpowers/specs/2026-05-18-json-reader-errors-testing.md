# JSON Reader Errors And Testing

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
