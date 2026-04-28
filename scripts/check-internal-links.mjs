import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const distDir = path.join(root, 'dist');

const hrefRegex = /<a\b[^>]*\bhref=(['"])(.*?)\1/gi;
const idRegex = /\bid=(['"])(.*?)\1/gi;
const ignoredSchemes = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function normalizeFileTarget(targetPath) {
  if (targetPath.endsWith('/')) return path.join(targetPath, 'index.html');
  if (!path.extname(targetPath)) return `${targetPath}.html`;
  return targetPath;
}

function extractIds(html) {
  const ids = new Set();
  for (const match of html.matchAll(idRegex)) {
    ids.add(match[2]);
  }
  return ids;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

function decodeHref(href) {
  try {
    return decodeURI(href.trim());
  } catch {
    return href.trim();
  }
}

async function main() {
  try {
    await fs.access(distDir);
  } catch {
    console.error('Missing dist/ output. Run `npm run build` before `npm run check:internal-links`.');
    process.exit(1);
  }

  const allFiles = await walk(distDir);
  const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
  const htmlCache = new Map();

  for (const file of htmlFiles) {
    htmlCache.set(file, await fs.readFile(file, 'utf8'));
  }

  const errors = [];

  for (const [sourceFile, html] of htmlCache) {
    const sourceRel = path.relative(distDir, sourceFile);

    for (const match of html.matchAll(hrefRegex)) {
      const rawHref = decodeHref(match[2]);
      if (!rawHref || rawHref === '#' || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) continue;
      if (ignoredSchemes.test(rawHref)) continue;

      const [rawPathPart, rawFragment = ''] = rawHref.split('#');
      const pathPart = rawPathPart || '';

      let targetFile;
      if (!pathPart) {
        targetFile = sourceFile;
      } else if (pathPart.startsWith('/')) {
        targetFile = path.join(distDir, normalizeFileTarget(pathPart.slice(1)));
      } else {
        const sourceDir = path.dirname(sourceFile);
        targetFile = path.resolve(sourceDir, normalizeFileTarget(pathPart));
      }

      try {
        const stat = await fs.stat(targetFile);
        if (stat.isDirectory()) {
          targetFile = path.join(targetFile, 'index.html');
          await fs.access(targetFile);
        }
      } catch {
        errors.push(`${sourceRel} -> ${rawHref} (missing file: ${path.relative(distDir, targetFile)})`);
        continue;
      }

      if (!rawFragment) continue;
      const targetHtml = htmlCache.get(targetFile) ?? await fs.readFile(targetFile, 'utf8');
      htmlCache.set(targetFile, targetHtml);
      const ids = extractIds(targetHtml);
      if (!ids.has(rawFragment)) {
        errors.push(`${sourceRel} -> ${rawHref} (missing anchor: #${rawFragment} in ${path.relative(distDir, targetFile)})`);
      }
    }
  }

  if (errors.length) {
    console.error('Broken internal links found:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Validated internal links across ${htmlFiles.length} HTML files.`);
}

await main();
