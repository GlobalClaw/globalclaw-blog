import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');

function parseFrontmatter(raw) {
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

async function listMarkdownFiles(dir) {
  try {
    return (await fs.readdir(dir))
      .filter((name) => name.endsWith('.md'))
      .sort()
      .map((name) => path.join(dir, name));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isRealDate(value) {
  if (!isIsoDate(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function expectedPostSlug(filename) {
  return filename.replace(/\.md$/, '');
}

function validatePost(file, raw, errors) {
  const rel = path.relative(root, file);
  const name = path.basename(file);
  const { data, body, hasFrontmatter } = parseFrontmatter(raw);

  if (!hasFrontmatter) {
    errors.push(`${rel}: missing frontmatter block`);
    return;
  }

  for (const field of ['title', 'description', 'date']) {
    if (!String(data[field] || '').trim()) errors.push(`${rel}: missing required field \`${field}\``);
  }

  if (data.date && !isRealDate(data.date)) {
    errors.push(`${rel}: date must be a real ISO date (YYYY-MM-DD), got \`${data.date}\``);
  }

  const expectedSlug = expectedPostSlug(name);
  if (data.slug && data.slug !== expectedSlug) {
    errors.push(`${rel}: slug must match filename \`${expectedSlug}\`, got \`${data.slug}\``);
  }

  const filenameDate = name.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1];
  if (!filenameDate) {
    errors.push(`${rel}: filename must use YYYY-MM-DD-slug.md`);
  } else if (data.date && data.date !== filenameDate) {
    errors.push(`${rel}: date \`${data.date}\` does not match filename prefix \`${filenameDate}\``);
  }

  if (!body.trim()) {
    errors.push(`${rel}: body is empty`);
  }
}

function validatePage(file, raw, errors) {
  const rel = path.relative(root, file);
  const { data, body, hasFrontmatter } = parseFrontmatter(raw);

  if (!hasFrontmatter) {
    errors.push(`${rel}: missing frontmatter block`);
    return;
  }

  for (const field of ['title', 'description']) {
    if (!String(data[field] || '').trim()) errors.push(`${rel}: missing required field \`${field}\``);
  }

  if (!body.trim()) {
    errors.push(`${rel}: body is empty`);
  }
}

async function main() {
  const errors = [];
  const postFiles = await listMarkdownFiles(path.join(root, 'content', 'posts'));
  const pageFiles = await listMarkdownFiles(path.join(root, 'content', 'pages'));

  for (const file of postFiles) {
    validatePost(file, await fs.readFile(file, 'utf8'), errors);
  }

  for (const file of pageFiles) {
    validatePage(file, await fs.readFile(file, 'utf8'), errors);
  }

  if (errors.length) {
    console.error('Frontmatter/content validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Validated frontmatter for ${postFiles.length} posts and ${pageFiles.length} pages.`);
}

await main();
