const path = require('node:path');

const { readJsonData } = require('./reader');
const { validateItem } = require('./validator');

function buildDataModel(dataDir = path.join(process.cwd(), 'data')) {
  const readResult = readJsonData(dataDir);
  const warnings = [...readResult.warnings];
  const validObjects = [];
  const fileStatsByName = new Map();

  for (const record of readResult.records) {
    ensureFileStats(fileStatsByName, record.sourceFile);

    const validation = validateItem(record.value, record.sourceFile, record.index);
    if (!validation.valid) {
      warnings.push(validation.warning);
      continue;
    }

    validObjects.push(validation.value);
    addToFileStats(fileStatsByName, validation.value);
  }

  const publishedObjects = validObjects.filter((item) => item.draft !== true);
  const draftObjects = validObjects.filter((item) => item.draft === true);
  const groupsBySlug = groupPublishedObjectsBySlug(publishedObjects);
  const fileStats = Array.from(fileStatsByName.values())
    .sort((a, b) => a.file.localeCompare(b.file));

  return {
    stats: {
      filesRead: readResult.filesRead,
      validObjects: validObjects.length,
      publishedObjects: publishedObjects.length,
      draftObjects: draftObjects.length,
      uniquePublishedSlugs: Object.keys(groupsBySlug).length,
      warnings: warnings.length
    },
    validObjects,
    publishedObjects,
    groupsBySlug,
    fileStats,
    warnings
  };
}

function groupPublishedObjectsBySlug(publishedObjects) {
  const grouped = {};

  for (const item of publishedObjects) {
    if (!grouped[item.slug]) {
      grouped[item.slug] = [];
    }
    grouped[item.slug].push(item);
  }

  const sortedGroups = {};
  for (const slug of Object.keys(grouped).sort((a, b) => a.localeCompare(b))) {
    sortedGroups[slug] = grouped[slug].sort((a, b) => b.date.localeCompare(a.date));
  }

  return sortedGroups;
}

function ensureFileStats(fileStatsByName, fileName) {
  if (!fileStatsByName.has(fileName)) {
    fileStatsByName.set(fileName, {
      file: fileName,
      validObjects: 0,
      publishedObjects: 0,
      draftObjects: 0,
      publishedSlugCounts: {}
    });
  }
}

function addToFileStats(fileStatsByName, item) {
  const stats = fileStatsByName.get(item.sourceFile);
  stats.validObjects += 1;

  if (item.draft === true) {
    stats.draftObjects += 1;
    return;
  }

  stats.publishedObjects += 1;
  stats.publishedSlugCounts[item.slug] = (stats.publishedSlugCounts[item.slug] || 0) + 1;
}

module.exports = {
  buildDataModel,
  groupPublishedObjectsBySlug
};
