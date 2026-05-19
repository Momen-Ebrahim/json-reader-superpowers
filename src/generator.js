const fs = require('node:fs/promises');
const path = require('node:path');

const { renderDashboard } = require('./html');

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

async function buildSite({
  dataDir = path.join(process.cwd(), 'data'),
  outputDir = path.join(process.cwd(), 'output'),
  assetSourcePath = path.join(process.cwd(), 'src', 'assets', 'style.css'),
} = {}) {
  const resolvedOutputDir = validateOutputDir(outputDir);
  const resolvedDataDir = path.resolve(dataDir);
  const relativeDataPath = path.relative(resolvedOutputDir, resolvedDataDir);
  const relativeOutputPath = path.relative(resolvedDataDir, resolvedOutputDir);
  if (
    relativeDataPath === '' ||
    relativeOutputPath === '' ||
    (!relativeDataPath.startsWith('..') && !path.isAbsolute(relativeDataPath)) ||
    (!relativeOutputPath.startsWith('..') && !path.isAbsolute(relativeOutputPath))
  ) {
    throw new Error('Unsafe output directory');
  }

  await cleanOutput(outputDir);
  await copyStylesheet(assetSourcePath, outputDir);

  const buildState = createEmptyBuildState();
  const dashboardHtml = renderDashboard(buildState);
  await fs.writeFile(path.join(outputDir, 'dashboard.html'), dashboardHtml);

  return buildState;
}

module.exports = { buildSite, cleanOutput, copyStylesheet, createEmptyBuildState };
