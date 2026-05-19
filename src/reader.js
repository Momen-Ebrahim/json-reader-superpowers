const fs = require('node:fs');
const path = require('node:path');

function readJsonData(dataDir = path.join(process.cwd(), 'data')) {
  const records = [];
  const warnings = [];

  if (!fs.existsSync(dataDir)) {
    return {
      filesRead: 0,
      records,
      warnings: [
        {
          type: 'missing-data-directory',
          file: null,
          message: `Data directory not found: ${dataDir}`
        }
      ]
    };
  }

  const jsonFiles = fs.readdirSync(dataDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));

  for (const fileName of jsonFiles) {
    const filePath = path.join(dataDir, fileName);
    let parsed;

    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      warnings.push({
        type: 'invalid-json',
        file: fileName,
        message: `${fileName} contains invalid JSON: ${error.message}`
      });
      continue;
    }

    if (Array.isArray(parsed)) {
      parsed.forEach((value, index) => {
        records.push({ sourceFile: fileName, value, index });
      });
      continue;
    }

    if (isPlainObject(parsed)) {
      records.push({ sourceFile: fileName, value: parsed, index: 0 });
      continue;
    }

    warnings.push({
      type: 'invalid-json-root',
      file: fileName,
      message: `${fileName} must contain one object or an array of objects`
    });
  }

  return {
    filesRead: jsonFiles.length,
    records,
    warnings
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

module.exports = {
  readJsonData
};
