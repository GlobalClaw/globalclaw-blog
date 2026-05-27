export function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw, hasFrontmatter: false };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { data: {}, body: raw, hasFrontmatter: false };

  const fm = raw.slice(4, end).trim();
  const body = raw.slice(end + 5);
  const data = {};

  for (const line of fm.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
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
