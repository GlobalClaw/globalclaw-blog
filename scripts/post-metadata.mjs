function unsupportedValueReason(value) {
  if (value === '|' || value === '>') return 'block scalars are not supported';
  if (value.startsWith('[') || value.startsWith('{')) return 'flow collections are not supported';
  if (value.startsWith('&') || value.startsWith('*')) return 'anchors and aliases are not supported';
  if (value.startsWith('!')) return 'tagged values are not supported';
  return null;
}

function parseScalarValue(key, value, lineNumber) {
  const unsupported = unsupportedValueReason(value);
  if (unsupported) {
    throw new Error(`Frontmatter line ${lineNumber}: field "${key}" uses unsupported YAML; ${unsupported}`);
  }

  if ((value.startsWith('"') && !value.endsWith('"')) || (value.startsWith("'") && !value.endsWith("'"))) {
    throw new Error(`Frontmatter line ${lineNumber}: field "${key}" has an unterminated quoted value`);
  }

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

export function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw, hasFrontmatter: false };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { data: {}, body: raw, hasFrontmatter: false };

  const fm = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const data = {};
  const seenKeys = new Set();

  for (const [index, rawLine] of fm.split('\n').entries()) {
    const lineNumber = index + 2;
    const line = rawLine.trimEnd();

    if (!line.trim()) continue;
    if (/^\s/.test(rawLine)) {
      throw new Error(`Frontmatter line ${lineNumber}: indented or multiline values are not supported`);
    }
    if (line.startsWith('#')) {
      throw new Error(`Frontmatter line ${lineNumber}: comments are not supported`);
    }

    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s(.*)|\s*)$/);
    if (!match) {
      throw new Error(`Frontmatter line ${lineNumber}: expected "key: value"`);
    }

    const [, key, rawValue = ''] = match;
    if (seenKeys.has(key)) {
      throw new Error(`Frontmatter line ${lineNumber}: duplicate field "${key}"`);
    }
    seenKeys.add(key);

    data[key] = parseScalarValue(key, rawValue, lineNumber);
  }

  return { data, body, hasFrontmatter: true };
}

export function expectedPostSlug(filename) {
  return filename.replace(/\.md$/, '');
}

export function validatePostSourcePath(filename, date, slug) {
  const stem = expectedPostSlug(filename);
  const match = stem.match(/^(\d{4}-\d{2}-\d{2})-/);
  if (!match) {
    throw new Error(`Invalid post source filename \"${filename}\": expected content/posts/YYYY-MM-DD-slug.md`);
  }
  if (!date) {
    throw new Error(`Post \"${filename}\" is missing frontmatter date; expected it to match ${match[1]}`);
  }
  if (match[1] !== date) {
    throw new Error(`Date mismatch for post \"${filename}\": filename prefix is ${match[1]} but frontmatter date is ${date}`);
  }
  if (slug && slug !== stem) {
    throw new Error(`Slug mismatch for post \"${filename}\": frontmatter slug is ${slug} but canonical slug is ${stem}`);
  }
  return stem;
}

export function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isRealDate(value) {
  if (!isIsoDate(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
