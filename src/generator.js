const fs = require('node:fs/promises');
const path = require('node:path');

const { renderDashboard } = require('./html');
const { readJsonFiles } = require('./reader');
const { validateObject } = require('./validator');

function validateOutputDir(outputDir) {
  if (!outputDir || typeof outputDir !== 'string') {
    throw new Error('Unsafe output directory');
  }

  const resolvedOutputDir = path.resolve(outputDir);
  if (resolvedOutputDir === path.parse(resolvedOutputDir).root || resolvedOutputDir === process.cwd()) {
    throw new Error('Unsafe output directory');
  }

  return resolvedOutputDir;
}

function isOutsideDirectory(relativePath) {
  return relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath);
}

async function cleanOutput(outputDir) {
  const resolvedOutputDir = validateOutputDir(outputDir);
  await fs.rm(resolvedOutputDir, { recursive: true, force: true });
  await fs.mkdir(path.join(resolvedOutputDir, 'assets'), { recursive: true });
}

async function copyStylesheet(assetSourcePath, outputDir) {
  await fs.copyFile(assetSourcePath, path.join(outputDir, 'assets', 'style.css'));
}

function createEmptyBuildState() {
  return {
    stats: {
      filesRead: 0,
      validObjects: 0,
      publishedObjects: 0,
      draftObjects: 0,
      uniquePublishedSlugs: 0,
      warningCount: 0,
    },
    warnings: [],
    slugGroups: new Map(),
    fileSummaries: [],
  };
}

function sortSlugGroups(slugGroups) {
  for (const group of slugGroups.values()) {
    group.sort((a, b) => b.date.localeCompare(a.date));
  }
}

async function collectBuildState(dataDir) {
  const readResult = await readJsonFiles(dataDir);
  const state = createEmptyBuildState();

  state.warnings.push(...readResult.warnings);
  state.stats.filesRead = readResult.files.length;

  for (const file of readResult.files) {
    const summary = {
      fileName: file.fileName,
      validObjects: 0,
      publishedObjects: 0,
      draftObjects: 0,
      publishedSlugCounts: new Map(),
    };

    for (const [index, rawObject] of file.objects.entries()) {
      const validation = validateObject(rawObject, { fileName: file.fileName, index });
      if (!validation.valid) {
        state.warnings.push(validation.warning);
        continue;
      }

      const object = validation.object;
      state.stats.validObjects += 1;
      summary.validObjects += 1;

      if (object.draft) {
        state.stats.draftObjects += 1;
        summary.draftObjects += 1;
        continue;
      }

      state.stats.publishedObjects += 1;
      summary.publishedObjects += 1;
      summary.publishedSlugCounts.set(object.slug, (summary.publishedSlugCounts.get(object.slug) || 0) + 1);

      if (!state.slugGroups.has(object.slug)) {
        state.slugGroups.set(object.slug, []);
      }
      state.slugGroups.get(object.slug).push(object);
    }

    state.fileSummaries.push(summary);
  }

  sortSlugGroups(state.slugGroups);
  state.stats.uniquePublishedSlugs = state.slugGroups.size;
  state.stats.warningCount = state.warnings.length;

  return state;
}

async function buildSite(options = {}) {
  const dataDir = options.dataDir === undefined ? path.join(process.cwd(), 'data') : options.dataDir;
  const outputDir = options.outputDir === undefined ? path.join(process.cwd(), 'output') : options.outputDir;
  const assetSourcePath = options.assetSourcePath === undefined
    ? path.join(process.cwd(), 'src', 'assets', 'style.css')
    : options.assetSourcePath;
  const resolvedOutputDir = validateOutputDir(outputDir);
  const resolvedDataDir = path.resolve(dataDir);
  const relativeDataPath = path.relative(resolvedOutputDir, resolvedDataDir);
  const relativeOutputPath = path.relative(resolvedDataDir, resolvedOutputDir);
  if (
    relativeDataPath === '' ||
    relativeOutputPath === '' ||
    !isOutsideDirectory(relativeDataPath) ||
    !isOutsideDirectory(relativeOutputPath)
  ) {
    throw new Error('Unsafe output directory');
  }

  await cleanOutput(outputDir);
  await copyStylesheet(assetSourcePath, outputDir);
  if (options.dataDir === undefined) {
    await fs.mkdir(resolvedDataDir, { recursive: true });
  }

  const buildState = await collectBuildState(dataDir);
  const dashboardHtml = renderDashboard(buildState);
  await fs.writeFile(path.join(outputDir, 'dashboard.html'), dashboardHtml);

  return buildState;
}

module.exports = { buildSite, cleanOutput, collectBuildState, copyStylesheet, createEmptyBuildState, sortSlugGroups };
