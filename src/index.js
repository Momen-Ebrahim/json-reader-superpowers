const { buildSite } = require('./generator');

async function main() {
  const result = await buildSite();

  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }

  console.log(`Generated dashboard.html with ${result.stats.warningCount} warnings.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { main };
