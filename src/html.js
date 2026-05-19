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
    .map(([slug, objects]) => `<a class="slug-card" href="${escapeHtml(slug)}.html"><strong>${escapeHtml(slug)}</strong><span>${objects.length} published objects</span></a>`)
    .join('');

  const warningItems = warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join('');

  const fileRows = fileSummaries
    .map((file) => `<tr><td>${escapeHtml(file.fileName)}</td><td>${file.validObjects}</td><td>${file.publishedObjects}</td><td>${file.draftObjects}</td><td>${escapeHtml(file.slugSummary)}</td></tr>`)
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

module.exports = { escapeHtml, renderDashboard };
