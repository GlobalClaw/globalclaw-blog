// check-raw-html.mjs
// Scan markdown files for raw HTML tags that are not in a whitelist.
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';

const CONTENT_DIR = 'content/posts';
// Simple whitelist of allowed HTML tags (as full tag strings) or tag names.
const WHITELIST_TAGS = new Set([
  // Allowed tags often intentional
  'div', 'span', 'script', 'style',
  'img', 'meta', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code'
]);

// Regex to find HTML tags.
const TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?>/g;

async function* walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkFiles(full);
    else if (extname(entry.name) === '.md') yield full;
  }
}

async function main() {
  let violations = [];
  for await (const file of walkFiles(CONTENT_DIR)) {
    const text = await readFile(file, 'utf8');
    const lines = text.split(/\n/);
    let inCodeFence = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('```')) {
        inCodeFence = !inCodeFence;
        continue;
      }
      if (inCodeFence) continue;
      let match;
      while ((match = TAG_REGEX.exec(line)) !== null) {
        const tag = match[1];
        if (!WHITELIST_TAGS.has(tag)) {
          violations.push(`${file}:${i + 1} raw <${tag}> tag`);
        }
      }
    }
  }
  if (violations.length) {
    console.error('Raw HTML violations found:');
    console.error(violations.join('\n'));
    process.exit(1);
  } else {
    console.log('No raw HTML violations');
  }
}

main();
