const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { main } = require('../src/index');

test('main prints warnings to the provided logger', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'json-reader-cli-'));
  const outputDir = path.join(fixtureRoot, 'output');
  const assetSourcePath = path.join(fixtureRoot, 'src', 'assets', 'style.css');
  const warnings = [];
  const logs = [];
  await fs.mkdir(path.dirname(assetSourcePath), { recursive: true });
  await fs.writeFile(assetSourcePath, 'body { color: #111; }');

  await main({
    buildOptions: {
      dataDir: path.join(fixtureRoot, 'data'),
      outputDir,
      assetSourcePath,
    },
    logger: {
      warn(message) {
        warnings.push(message);
      },
      log(message) {
        logs.push(message);
      },
      error(message) {
        throw message;
      },
    },
  });

  assert.deepEqual(warnings, ['Warning: Data folder not found: data']);
  assert.deepEqual(logs, ['Generated dashboard.html with 1 warnings.']);
});
