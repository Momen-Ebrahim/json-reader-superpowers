const { isPlainObject } = require('./reader');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function invalid(fileName, index, field, expected) {
  return {
    valid: false,
    warning: `${fileName} object ${index + 1} has invalid ${field}: expected ${expected}.`,
  };
}

function validateObject(value, { fileName, index }) {
  if (!isPlainObject(value)) {
    return invalid(fileName, index, 'object', 'a JSON object');
  }

  for (const field of ['title', 'slug', 'date', 'content']) {
    if (!isNonEmptyString(value[field])) {
      return invalid(fileName, index, field, 'a non-empty string');
    }
  }

  if (!isValidDateString(value.date)) {
    return invalid(fileName, index, 'date', 'a real YYYY-MM-DD date');
  }

  if (value.tags !== undefined && (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== 'string'))) {
    return invalid(fileName, index, 'tags', 'an array of strings');
  }

  return {
    valid: true,
    object: {
      title: value.title,
      slug: value.slug,
      date: value.date,
      content: value.content,
      tags: value.tags || [],
      draft: value.draft === true,
      sourceFile: fileName,
    },
  };
}

module.exports = { isNonEmptyString, isValidDateString, validateObject };
