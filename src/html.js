function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderDashboard({ stats, warnings, slugGroups, fileSummaries }) {
  const slugCards = Array.from(slugGroups.entries())
    .map(([slug, objects]) => `<a class="slug-card" href="${encodeURIComponent(slug)}.html"><strong>${escapeHtml(slug)}</strong><span>${objects.length} published objects</span></a>`)
    .join('');

  const warningItems = warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join('');

  const fileRows = fileSummaries
    .map((file) => {
      const slugLinks = Array.from(file.publishedSlugCounts.entries())
        .map(([slug, count]) => `<a href="${encodeURIComponent(slug)}.html?file=${encodeURIComponent(file.fileName)}">${escapeHtml(slug)} (${count})</a>`)
        .join(', ');

      return `<tr><td>${escapeHtml(file.fileName)}</td><td>${file.validObjects}</td><td>${file.publishedObjects}</td><td>${file.draftObjects}</td><td>${slugLinks || 'No published slugs'}</td></tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>JSON Reader Dashboard</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="page-shell">
    <header class="hero">
      <p class="eyebrow">Static JSON Reader</p>
      <h1>JSON Reader Dashboard</h1>
    </header>
    <section class="stats-grid" aria-label="Build statistics">
      <article class="stat-card"><strong>${stats.filesRead}</strong><span>${stats.filesRead} JSON files read</span></article>
      <article class="stat-card"><strong>${stats.validObjects}</strong><span>valid objects</span></article>
      <article class="stat-card"><strong>${stats.publishedObjects}</strong><span>published objects</span></article>
      <article class="stat-card"><strong>${stats.draftObjects}</strong><span>draft objects</span></article>
      <article class="stat-card"><strong>${stats.uniquePublishedSlugs}</strong><span>unique published slugs</span></article>
      <article class="stat-card"><strong>${stats.warningCount}</strong><span>warnings</span></article>
    </section>
    <section class="panel">
      <h2>Published slugs</h2>
      <div class="slug-grid">${slugCards || '<p>No published slugs found.</p>'}</div>
    </section>
    <section class="panel">
      <h2>Warnings</h2>
      <ul>${warningItems || '<li>No warnings.</li>'}</ul>
    </section>
    <section class="panel">
      <h2>JSON files</h2>
      <table>
        <thead><tr><th>File name</th><th>Valid objects</th><th>Published</th><th>Drafts</th><th>Published slug counts</th></tr></thead>
        <tbody>${fileRows || '<tr><td colspan="5">No JSON files read.</td></tr>'}</tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function renderTags(tags) {
  if (tags.length === 0) {
    return '<p class="tags">No tags</p>';
  }

  return `<ul class="tags">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`;
}

function renderSlugPage(slug, objects) {
  const files = Array.from(new Set(objects.map((object) => object.sourceFile))).sort((a, b) => a.localeCompare(b));
  const fileOptions = files
    .map((fileName) => `<option value="${escapeHtml(fileName)}">${escapeHtml(fileName)}</option>`)
    .join('');
  const cards = objects
    .map((object) => `<article class="content-card" data-title="${escapeHtml(object.title.toLowerCase())}" data-date="${escapeHtml(object.date)}" data-file="${escapeHtml(object.sourceFile)}">
      <header>
        <h2>${escapeHtml(object.title)}</h2>
        <p>${escapeHtml(object.date)} &middot; ${escapeHtml(object.sourceFile)}</p>
      </header>
      ${renderTags(object.tags)}
      <div class="content-body">${object.content}</div>
    </article>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(slug)} - JSON Reader</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="page-shell">
    <header class="hero">
      <p class="eyebrow">Published slug</p>
      <h1>${escapeHtml(slug)}</h1>
      <p><span id="visible-count">${objects.length}</span> of ${objects.length} published objects</p>
      <p><a href="dashboard.html">Back to dashboard</a></p>
    </header>
    <section class="filter-panel" aria-label="Filters">
      <label>Search title <input id="title-filter" type="search" placeholder="Filter by title"></label>
      <label>From <input id="from-filter" type="date"></label>
      <label>To <input id="to-filter" type="date"></label>
      <label>JSON file <select id="file-filter"><option value="">All files</option>${fileOptions}</select></label>
    </section>
    <section id="cards" class="content-grid">
      ${cards}
    </section>
    <p id="empty-state" class="empty-state" hidden>No objects match the current filters.</p>
  </main>
  <script>
    const objects = ${safeJson(objects)};
    const titleFilter = document.querySelector('#title-filter');
    const fromFilter = document.querySelector('#from-filter');
    const toFilter = document.querySelector('#to-filter');
    const fileFilter = document.querySelector('#file-filter');
    const cards = Array.from(document.querySelectorAll('.content-card'));
    const visibleCount = document.querySelector('#visible-count');
    const emptyState = document.querySelector('#empty-state');

    function syncFileFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const file = params.get('file') || '';
      if (Array.from(fileFilter.options).some((option) => option.value === file)) {
        fileFilter.value = file;
      }
    }

    function updateFileQuery() {
      const url = new URL(window.location.href);
      if (fileFilter.value) {
        url.searchParams.set('file', fileFilter.value);
      } else {
        url.searchParams.delete('file');
      }
      window.history.replaceState(null, '', url);
    }

    function applyFilters() {
      const title = titleFilter.value.trim().toLowerCase();
      const from = fromFilter.value;
      const to = toFilter.value;
      const file = fileFilter.value;
      let count = 0;

      cards.forEach((card) => {
        const matchesTitle = !title || card.dataset.title.includes(title);
        const matchesFrom = !from || card.dataset.date >= from;
        const matchesTo = !to || card.dataset.date <= to;
        const matchesFile = !file || card.dataset.file === file;
        const visible = matchesTitle && matchesFrom && matchesTo && matchesFile;
        card.hidden = !visible;
        if (visible) {
          count += 1;
        }
      });

      visibleCount.textContent = String(count);
      emptyState.hidden = count !== 0;
    }

    syncFileFromQuery();
    applyFilters();
    titleFilter.addEventListener('input', applyFilters);
    fromFilter.addEventListener('input', applyFilters);
    toFilter.addEventListener('input', applyFilters);
    fileFilter.addEventListener('change', () => {
      updateFileQuery();
      applyFilters();
    });
  </script>
</body>
</html>`;
}

module.exports = { escapeHtml, renderDashboard, renderSlugPage, safeJson };
