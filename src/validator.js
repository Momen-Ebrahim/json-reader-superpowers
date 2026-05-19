function validateItem(item, sourceFile, index) {
  const itemLabel = `${sourceFile} item ${index + 1}`;

  if (!isPlainObject(item)) {
    return invalid(sourceFile, index, `${itemLabel} must be an object`);
  }

  for (const field of ['title', 'slug', 'date', 'content']) {
    if (typeof item[field] !== 'string' || item[field].length === 0) {
      return invalid(sourceFile, index, `${itemLabel} is missing required string field: ${field}`);
    }
  }

  if (!isValidDateString(item.date)) {
    return invalid(sourceFile, index, `${itemLabel} has invalid date: ${item.date}`);
  }

  if (item.tags !== undefined && (!Array.isArray(item.tags) || item.tags.some((tag) => typeof tag !== 'string'))) {
    return invalid(sourceFile, index, `${itemLabel} tags must be an array of strings`);
  }

  return {
    valid: true,
    value: {
      title: item.title,
      slug: item.slug,
      date: item.date,
      content: item.content,
      tags: item.tags || [],
      draft: item.draft === true,
      sourceFile
    }
  };
}

function invalid(file, index, message) {
  return {
    valid: false,
    warning: {
      type: 'invalid-object',
      file,
      index,
      message
    }
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

module.exports = {
  validateItem
};
