import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRealDate, parseFrontmatter, validatePostSourcePath } from './post-metadata.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');

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

function validatePost(file, raw, errors) {
  const rel = path.relative(root, file);
  const name = path.basename(file);
  let parsed;

  try {
    parsed = parseFrontmatter(raw);
  } catch (error) {
    errors.push(`${rel}: ${error.message}`);
    return;
  }

  const { data, body, hasFrontmatter } = parsed;

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

  try {
    validatePostSourcePath(name, data.date, data.slug);
  } catch (error) {
    errors.push(`${rel}: ${error.message}`);
  }

  if (!body.trim()) {
    errors.push(`${rel}: body is empty`);
  }
}

function validatePage(file, raw, errors) {
  const rel = path.relative(root, file);
  let parsed;

  try {
    parsed = parseFrontmatter(raw);
  } catch (error) {
    errors.push(`${rel}: ${error.message}`);
    return;
  }

  const { data, body, hasFrontmatter } = parsed;

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
