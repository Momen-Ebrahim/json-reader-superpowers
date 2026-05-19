# JSON Reader Output And Styling

## Output

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

## Styling Requirements

- No external CSS or JavaScript dependencies.
- Pages work offline.
- Clean readable layout.
- Dashboard uses stat cards, slug cards, and a file table.
- Slug pages use a filter panel and content cards.
- Mobile layout stacks cards, filters, and table content cleanly.
