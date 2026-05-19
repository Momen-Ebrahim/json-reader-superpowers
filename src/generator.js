const fs = require('node:fs/promises');
const path = require('node:path');

const { renderDashboard } = require('./html');

async function cleanOutput(outputDir) {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(path.join(outputDir, 'assets'), { recursive: true });
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
  await cleanOutput(outputDir);
  await copyStylesheet(assetSourcePath, outputDir);

  const buildState = createEmptyBuildState();
  const dashboardHtml = renderDashboard(buildState);
  await fs.writeFile(path.join(outputDir, 'dashboard.html'), dashboardHtml);

  return buildState;
}

module.exports = { buildSite, cleanOutput, copyStylesheet, createEmptyBuildState };
