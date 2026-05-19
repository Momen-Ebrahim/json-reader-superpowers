const fs = require('node:fs/promises');
const path = require('node:path');

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function readJsonFiles(dataDir) {
  const warnings = [];
  const files = [];

  let entries;
  try {
    entries = await fs.readdir(dataDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      warnings.push(`Data folder not found: ${path.basename(dataDir)}`);
      return { files, warnings };
    }
    throw error;
  }

  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  for (const fileName of jsonFiles) {
    const filePath = path.join(dataDir, fileName);
    let parsed;
    try {
      parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (error) {
      warnings.push(`${fileName} contains invalid JSON: ${error.message}`);
      continue;
    }

    if (Array.isArray(parsed)) {
      files.push({ fileName, objects: parsed });
      continue;
    }

    if (isPlainObject(parsed)) {
      files.push({ fileName, objects: [parsed] });
      continue;
    }

    warnings.push(`${fileName} must contain an object or an array of objects.`);
  }

  return { files, warnings };
}

module.exports = { isPlainObject, readJsonFiles };
