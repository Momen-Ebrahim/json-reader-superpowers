const path = require('node:path');

const { buildSite } = require('./generator');

async function main({ buildOptions, logger = console } = {}) {
  const result = await buildSite(buildOptions === undefined
    ? { assetSourcePath: path.join(__dirname, 'assets', 'style.css') }
    : buildOptions);

  for (const warning of result.warnings) {
    logger.warn(`Warning: ${warning}`);
  }

  logger.log(`Generated dashboard.html with ${result.stats.warningCount} warnings.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { main };
