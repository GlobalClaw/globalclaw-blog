import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { marked } from 'marked';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const outDir = path.join(root, 'dist');
const diagramsDir = path.join(outDir, 'assets', 'diagrams');
const site = JSON.parse(await fs.readFile(path.join(root, 'content/site.json'), 'utf8'));

marked.setOptions({ gfm: true, breaks: false });

function escapeHtml(s = '') {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { data: {}, body: raw };
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
  return { data, body };
}

function formatRssDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.toUTCString();
}

function formatDisplayDate(dateStr, readTime) {
  return readTime ? `${dateStr} · ${readTime}` : dateStr;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyDir(src, dest) {
  await ensureDir(dest);
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(from, to);
    else await fs.copyFile(from, to);
  }
}

async function cleanDist() {
  await fs.rm(outDir, { recursive: true, force: true });
  await ensureDir(outDir);
  await ensureDir(path.join(outDir, 'posts'));
  await ensureDir(diagramsDir);
}

function shell({ title, description, navCurrent, body, rss = true }) {
  const nav = `
      <nav class="nav">
        <a href="/index.html"${navCurrent === 'home' ? ' aria-current="page"' : ''}>Home</a>
        <a href="/posts/"${navCurrent === 'posts' ? ' aria-current="page"' : ''}>Posts</a>
        <a href="/about.html"${navCurrent === 'about' ? ' aria-current="page"' : ''}>About</a>
        <a href="${site.githubUrl}" target="_blank" rel="noopener">GitHub</a>
        <span class="status-pill status-pill--loading" data-status-pill aria-live="polite" title="Checking GlobalClaw status…">
          <span class="status-pill__dot" data-status-dot></span>
          <span data-status-text>Checking…</span>
        </span>
        <button class="theme-toggle" type="button" data-theme-toggle>High contrast</button>
      </nav>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${rss ? '<link rel="alternate" type="application/rss+xml" title="GlobalClaw Blog RSS" href="/rss.xml" />' : ''}
  <link rel="stylesheet" href="/assets/css/style.css" />
  <script src="/assets/js/theme.js?v=20260310d" defer></script>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <div class="brand">
        <div class="logo" aria-hidden="true">GC</div>
        <div>
          <h1><a class="home-link" href="/index.html">${escapeHtml(site.siteTitle)}</a></h1>
          <p class="tagline">${escapeHtml(site.tagline)}</p>
        </div>
      </div>
${nav}
    </div>
  </header>

  <main class="container">
${body}

    <footer class="site-footer">
      <p>© ${escapeHtml(site.siteTitle)}</p>
    </footer>
  </main>
</body>
</html>`;
}

async function renderMermaidBlocks(markdown, slug) {
  const matches = [...markdown.matchAll(/```mermaid\n([\s\S]*?)```/g)];
  if (!matches.length) return markdown;

  let out = markdown;
  for (const match of matches) {
    const source = match[1].trim();
    const hash = crypto.createHash('sha1').update(`${slug}\n${source}`).digest('hex').slice(0, 12);
    const inputPath = path.join(root, '.tmp-mermaid-' + hash + '.mmd');
    const outputName = `${slug}-${hash}.svg`;
    const outputPath = path.join(diagramsDir, outputName);
    await fs.writeFile(inputPath, source + '\n');
    try {
      await execFileAsync('npx', [
        '-y', '@mermaid-js/mermaid-cli',
        '-i', inputPath,
        '-o', outputPath,
        '-e', 'svg',
        '-b', 'transparent',
        '-q',
        '-p', path.join(root, 'scripts', 'puppeteer-config.json')
      ], { cwd: root, maxBuffer: 10 * 1024 * 1024 });
    } finally {
      await fs.rm(inputPath, { force: true });
    }
    const replacement = `\n<div class="diagram">\n  <img src="/assets/diagrams/${outputName}" alt="Mermaid diagram" loading="lazy" />\n</div>\n`;
    out = out.replace(match[0], replacement);
  }
  return out;
}

async function readMarkdownPosts() {
  const dir = path.join(root, 'content/posts');
  let names = [];
  try {
    names = (await fs.readdir(dir)).filter((n) => n.endsWith('.md'));
  } catch {
    return [];
  }
  const posts = [];
  for (const name of names) {
    const raw = await fs.readFile(path.join(dir, name), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const slug = data.slug || name.replace(/\.md$/, '');
    const renderedBody = await renderMermaidBlocks(body, slug);
    posts.push({
      source: 'markdown',
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || '1970-01-01',
      readTime: data.readTime || '',
      bodyHtml: marked.parse(renderedBody),
      outputPath: `/posts/${slug}.html`
    });
  }
  return posts;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function readLegacyPosts(markdownSlugs) {
  const dir = path.join(root, 'posts');
  const names = (await fs.readdir(dir)).filter((n) => n.endsWith('.html') && n !== 'index.html');
  const posts = [];
  for (const name of names) {
    const slug = name.replace(/\.html$/, '');
    if (markdownSlugs.has(slug)) continue;
    const raw = await fs.readFile(path.join(dir, name), 'utf8');
    const title = raw.match(/<title>(.*?)\s+—\s+GlobalClaw<\/title>/s)?.[1] || raw.match(/<title>(.*?)<\/title>/s)?.[1] || slug;
    const description = raw.match(/<meta name="description" content="([^"]*)"\s*\/?>/)?.[1] || '';
    const meta = raw.match(/<p class="meta">(.*?)<\/p>/s)?.[1] || '';
    const date = (meta.match(/(\d{4}-\d{2}-\d{2})/) || slug.match(/(\d{4}-\d{2}-\d{2})/))?.[1] || '1970-01-01';
    const readTime = (meta.match(/·\s*(.*?)$/)?.[1] || '').trim();
    posts.push({ source: 'legacy', slug, title: stripTags(title), description, date, readTime, outputPath: `/posts/${slug}.html`, raw });
  }
  return posts;
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => `${b.date}${b.slug}`.localeCompare(`${a.date}${a.slug}`));
}

function latestList(posts) {
  return posts.slice(0, 12).map((post) => `
        <li>
          <a href="${post.outputPath}">${escapeHtml(post.title)}</a>
          <span class="meta">${escapeHtml(post.date)}</span>
        </li>`).join('');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildMarkdownPost(post) {
  const html = shell({
    title: `${post.title} — GlobalClaw`,
    description: post.description,
    navCurrent: 'posts',
    body: `    <article class="post card">
      <header class="post-header">
        <h2>${escapeHtml(post.title)}</h2>
        <p class="meta">${escapeHtml(formatDisplayDate(post.date, post.readTime))}</p>
      </header>

      ${post.bodyHtml}

      <p class="backlink"><a href="/index.html">← Back home</a></p>
    </article>`
  });
  await fs.writeFile(path.join(outDir, 'posts', `${post.slug}.html`), html);
}

async function copyLegacyPosts(posts) {
  for (const post of posts) {
    await fs.writeFile(path.join(outDir, 'posts', `${post.slug}.html`), post.raw);
  }
}

async function buildAbout() {
  const raw = await fs.readFile(path.join(root, 'content/pages/about.md'), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const html = shell({
    title: `${data.title || 'About'} — GlobalClaw`,
    description: data.description || '',
    navCurrent: 'about',
    body: `    <article class="post card">
      <header class="post-header">
        <h2>${escapeHtml(data.title || 'About')}</h2>
        <p class="meta">${escapeHtml(data.meta || '')}</p>
      </header>

      ${marked.parse(body)}

      <p class="backlink"><a href="/index.html">← Back home</a></p>
    </article>`
  });
  await fs.writeFile(path.join(outDir, 'about.html'), html);
}

async function buildIndexes(allPosts) {
  const latest = allPosts[0];
  const indexHtml = shell({
    title: `${site.siteTitle} — Blog`,
    description: site.siteDescription,
    navCurrent: 'home',
    body: `    <section class="hero">
      <h2>${escapeHtml(site.heroTitle)}</h2>
      <p>${escapeHtml(site.heroBody)}</p>
      <div class="cta">
        <a class="button" href="${latest.outputPath}">${escapeHtml(site.heroCtaLabel)}</a>
        <a class="button secondary" href="${site.githubUrl}" target="_blank" rel="noopener">View source</a>
      </div>
    </section>

    <section class="card">
      <h3>Latest</h3>
      <ul class="post-list">${latestList(allPosts)}
      </ul>
    </section>`
  });
  const postsIndexHtml = shell({
    title: `Posts — ${site.siteTitle}`,
    description: 'Every new note and experiment from the GlobalClaw blog.',
    navCurrent: 'posts',
    body: `    <section class="hero">
      <h2>Posts</h2>
      <p>Everything on this page matches the canonical list that powers the front page and the RSS feed.</p>
      <div class="cta">
        <a class="button" href="${latest.outputPath}">${escapeHtml(site.heroCtaLabel)}</a>
        <a class="button secondary" href="${site.githubUrl}" target="_blank" rel="noopener">View source</a>
      </div>
    </section>

    <section class="card">
      <h3>Latest</h3>
      <ul class="post-list">${latestList(allPosts)}
      </ul>
    </section>`
  });
  await fs.writeFile(path.join(outDir, 'index.html'), indexHtml);
  await fs.writeFile(path.join(outDir, 'posts', 'index.html'), postsIndexHtml);
}

async function buildRss(allPosts) {
  const items = allPosts.slice(0, 20).map((post) => `    <item>
      <title>${escapeHtml(post.title)}</title>
      <link>${site.siteUrl}${post.outputPath}</link>
      <guid>${site.siteUrl}${post.outputPath}</guid>
      <pubDate>${formatRssDate(post.date)}</pubDate>
      <description>${escapeHtml(post.description)}</description>
    </item>`).join('\n');
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(site.siteTitle)}</title>
    <link>${site.siteUrl}/</link>
    <description>${escapeHtml(site.siteDescription)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
  await fs.writeFile(path.join(outDir, 'rss.xml'), rss);
}

async function copyStaticBits() {
  await copyDir(path.join(root, 'assets'), path.join(outDir, 'assets'));
  await fs.copyFile(path.join(root, 'CNAME'), path.join(outDir, 'CNAME'));
}

async function validateOutputs(allPosts) {
  assert(allPosts.length > 0, 'Build produced no posts. Refusing to write an empty homepage/feed.');

  const slugs = new Set();
  for (const post of allPosts) {
    assert(post.slug, 'Encountered a post without a slug.');
    assert(!slugs.has(post.slug), `Duplicate post slug detected: ${post.slug}`);
    slugs.add(post.slug);
    await fs.access(path.join(outDir, post.outputPath.replace(/^\//, '')));
  }

  const latest = allPosts[0];
  const [indexHtml, postsIndexHtml, rssXml] = await Promise.all([
    fs.readFile(path.join(outDir, 'index.html'), 'utf8'),
    fs.readFile(path.join(outDir, 'posts', 'index.html'), 'utf8'),
    fs.readFile(path.join(outDir, 'rss.xml'), 'utf8')
  ]);

  assert(indexHtml.includes(`href="${latest.outputPath}"`), `Homepage CTA does not point at latest post ${latest.slug}.`);
  assert(postsIndexHtml.includes(`href="${latest.outputPath}"`), `Posts index CTA does not point at latest post ${latest.slug}.`);
  assert(rssXml.includes(`<link>${site.siteUrl}${latest.outputPath}</link>`), `RSS feed does not include latest post ${latest.slug}.`);
}

await cleanDist();
await copyStaticBits();
const markdownPosts = await readMarkdownPosts();
for (const post of markdownPosts) await buildMarkdownPost(post);
const legacyPosts = await readLegacyPosts(new Set(markdownPosts.map((p) => p.slug)));
await copyLegacyPosts(legacyPosts);
await buildAbout();
const allPosts = sortPosts([...markdownPosts, ...legacyPosts]);
await buildIndexes(allPosts);
await buildRss(allPosts);
await validateOutputs(allPosts);
console.log(`Built dist/ with ${markdownPosts.length} markdown posts and ${legacyPosts.length} legacy posts.`);
