import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const distDir = path.join(root, 'dist');

const hrefRegex = /<a\b[^>]*\bhref=(['"])(.*?)\1/gi;
const markdownLinkRegex = /(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const idRegex = /\bid=(['"])(.*?)\1/gi;
const ignoredSchemes = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function normalizeFileTarget(targetPath) {
  if (targetPath.endsWith('/')) return path.join(targetPath, 'index.html');
  if (!path.extname(targetPath)) return `${targetPath}.html`;
  return targetPath;
}

function sourceOutputPath(file) {
  const rel = path.relative(root, file);
  if (rel.startsWith(`content${path.sep}posts${path.sep}`)) {
    const slug = path.basename(rel, path.extname(rel));
    return `/posts/${slug}.html`;
  }
  if (rel === path.join('content', 'pages', 'about.md')) return '/about.html';
  if (rel === path.join('content', 'pages', '404.md')) return '/404.html';
  if (rel.startsWith(`posts${path.sep}`)) return `/posts/${path.basename(rel)}`;
  return '/index.html';
}

function normalizeRoutePath(targetPath) {
  if (!targetPath || targetPath === '/') return '/';
  if (targetPath.endsWith('/')) return targetPath === '/' ? '/' : `${targetPath}index.html`;
  if (!path.extname(targetPath)) return `${targetPath}.html`;
  return targetPath;
}

function resolveRouteHref(sourceRoute, rawHref) {
  const [rawPathPart] = rawHref.split('#');
  const pathPart = rawPathPart || '';
  if (!pathPart) return normalizeRoutePath(sourceRoute);
  if (pathPart.startsWith('/')) return normalizeRoutePath(pathPart);
  const sourceDir = path.posix.dirname(sourceRoute);
  return normalizeRoutePath(path.posix.resolve(sourceDir, pathPart));
}

function shouldValidateSourceHref(rawHref) {
  const [rawPathPart] = rawHref.split('#');
  const pathPart = rawPathPart || '';
  if (!pathPart) return false;
  if (pathPart.startsWith('/assets/')) return false;
  const ext = path.posix.extname(pathPart);
  return !ext || ext === '.html' || pathPart.endsWith('/');
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

async function listFilesIfPresent(dir, predicate) {
  try {
    return (await fs.readdir(dir)).filter(predicate).map((name) => path.join(dir, name));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function validateSourceLinks(errors) {
  const sourceFiles = [
    ...(await listFilesIfPresent(path.join(root, 'content', 'posts'), (name) => name.endsWith('.md'))),
    ...(await listFilesIfPresent(path.join(root, 'content', 'pages'), (name) => name.endsWith('.md'))),
    ...(await listFilesIfPresent(path.join(root, 'posts'), (name) => name.endsWith('.html') && name !== 'index.html'))
  ];

  const knownRoutes = new Set(['/','/index.html','/posts/','/posts/index.html','/about.html','/404.html','/license.html']);

  for (const file of sourceFiles) {
    knownRoutes.add(sourceOutputPath(file));
  }

  for (const sourceFile of sourceFiles) {
    const raw = await fs.readFile(sourceFile, 'utf8');
    const sourceRel = path.relative(root, sourceFile);
    const sourceRoute = sourceOutputPath(sourceFile);
    const links = sourceFile.endsWith('.md') ? raw.matchAll(markdownLinkRegex) : raw.matchAll(hrefRegex);

    for (const match of links) {
      const rawHref = decodeHref(match[1] ?? match[2]);
      if (!rawHref || rawHref === '#' || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) continue;
      if (ignoredSchemes.test(rawHref)) continue;
      if (!shouldValidateSourceHref(rawHref)) continue;

      const resolvedRoute = resolveRouteHref(sourceRoute, rawHref);
      if (!knownRoutes.has(resolvedRoute)) {
        errors.push(`${sourceRel} -> ${rawHref} (missing source route: ${resolvedRoute})`);
      }
    }
  }

  return sourceFiles.length;
}

async function readHtmlTarget(targetFile) {
  try {
    return { targetFile, html: await fs.readFile(targetFile, 'utf8') };
  } catch (error) {
    if (error?.code === 'EISDIR') {
      const indexFile = path.join(targetFile, 'index.html');
      return { targetFile: indexFile, html: await fs.readFile(indexFile, 'utf8') };
    }
    throw error;
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
  const sourceFileCount = await validateSourceLinks(errors);

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

      let targetHtml;
      try {
        const resolved = htmlCache.has(targetFile)
          ? { targetFile, html: htmlCache.get(targetFile) }
          : await readHtmlTarget(targetFile);
        targetFile = resolved.targetFile;
        targetHtml = resolved.html;
        htmlCache.set(targetFile, targetHtml);
      } catch {
        errors.push(`${sourceRel} -> ${rawHref} (missing file: ${path.relative(distDir, targetFile)})`);
        continue;
      }

      if (!rawFragment) continue;
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

  console.log(`Validated internal links across ${sourceFileCount} source files and ${htmlFiles.length} built HTML files.`);
}

await main();
