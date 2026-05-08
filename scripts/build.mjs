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

function xmlEscape(s = '') {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
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

function shell({ title, description, navCurrent, body, rss = true, extraHead = '', currentPath = '/' }) {
  const httpsRedirect = `<script>
    if (location.protocol === 'http:' && location.hostname === 'globalclaw.se') {
      location.replace('https://globalclaw.se' + location.pathname + location.search + location.hash);
    }
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=https://globalclaw.se${currentPath}" />
  </noscript>`;

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
  ${httpsRedirect}
  <link rel="stylesheet" href="/assets/css/style.css" />
  <script src="/assets/js/theme.js?v=20260310d" defer></script>
  ${extraHead}
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

function decorateMermaidRenderError(error) {
  const stderr = error?.stderr || '';
  if (stderr.includes('libnss3.so')) {
    const hint = [
      'Mermaid diagram rendering needs a local Chromium dependency that is missing on this machine: libnss3.so.',
      'Install libnss3 first (for example: sudo apt-get install libnss3) and rerun npm run build.',
      'If Chromium/Puppeteer still reports missing shared libraries after that, install the broader package set documented in README.md.',
      '',
      'Original renderer error:',
      stderr.trim()
    ].join('\n');
    const decorated = new Error(hint);
    decorated.cause = error;
    return decorated;
  }
  return error;
}

let mermaidRuntimeChecked = false;

async function assertMermaidRuntimeDependencies() {
  if (mermaidRuntimeChecked || process.platform !== 'linux') return;
  mermaidRuntimeChecked = true;

  try {
    const { stdout } = await execFileAsync('ldconfig', ['-p'], { cwd: root, maxBuffer: 1024 * 1024 });
    if (stdout.includes('libnss3.so')) return;
  } catch {
    // Fall through to the file-system check below when ldconfig is unavailable.
  }

  const fallbackPaths = [
    '/usr/lib/x86_64-linux-gnu/libnss3.so',
    '/usr/lib64/libnss3.so',
    '/usr/lib/libnss3.so'
  ];

  for (const candidate of fallbackPaths) {
    try {
      await fs.access(candidate);
      return;
    } catch {
      // Keep checking the remaining fallback paths.
    }
  }

  throw new Error([
    'Mermaid diagram rendering needs a local Chromium dependency before the build can proceed: libnss3.so.',
    'Install libnss3 first (for example: sudo apt-get install libnss3) and rerun npm run build.',
    'If Chromium/Puppeteer still reports missing shared libraries after that, install the broader package set documented in README.md.',
    'This preflight check runs before Mermaid rendering so clean Debian/Ubuntu hosts fail fast with an actionable hint.'
  ].join('\n'));
}

async function renderMermaidBlocks(markdown, slug) {
  const matches = [...markdown.matchAll(/```mermaid\n([\s\S]*?)```/g)];
  if (!matches.length) return markdown;

  try {
    await assertMermaidRuntimeDependencies();
  } catch (e) {
    console.warn(`Skipping Mermaid rendering for ${slug}: ${e.message}`);
    return markdown;
  }

  let out = markdown;
  for (const match of matches) {
    const source = match[1].trim();
    const hash = crypto.createHash('sha1').update(`${slug}\n${source}`).digest('hex').slice(0, 12);
    const inputPath = path.join(root, '.tmp-mermaid-' + hash + '.mmd');
    const outputName = `${slug}-${hash}.svg`;
    const outputPath = path.join(diagramsDir, outputName);
    await fs.writeFile(inputPath, source + '\n');
    try {
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
      } catch (error) {
        throw decorateMermaidRenderError(error);
      }
    } finally {
      await fs.rm(inputPath, { force: true });
    }
    const replacement = `\n<div class="diagram">\n  <img src="/assets/diagrams/${outputName}" alt="Mermaid diagram" loading="lazy" />\n</div>\n`;
    out = out.replace(match[0], replacement);
  }
  return out;
}

function preserveRawBlocks(markdown) {
  const preserved = [];
  let out = markdown;

  function stash(match) {
    const token = `RAWHTMLTOKEN${preserved.length}TOKEN`;
    preserved.push(match);
    return `\n\n${token}\n\n`;
  }

  out = out.replace(/<style>[\s\S]*?<\/style>/g, stash);
  out = out.replace(/<script>[\s\S]*?<\/script>/g, stash);

  const slopStart = out.indexOf('<div class="slop-wrap">');
  if (slopStart !== -1) {
    let depth = 0;
    const tagRe = /<\/?div\b[^>]*>/g;
    tagRe.lastIndex = slopStart;
    let end = -1;
    for (let match; (match = tagRe.exec(out)); ) {
      if (match[0].startsWith('</div')) depth -= 1;
      else depth += 1;
      if (depth === 0) {
        end = tagRe.lastIndex;
        break;
      }
    }
    if (end !== -1) {
      const block = out.slice(slopStart, end);
      out = out.slice(0, slopStart) + stash(block) + out.slice(end);
    }
  }

  return {
    markdown: out,
    restore(html) {
      return html.replace(/<p>RAWHTMLTOKEN(\d+)TOKEN<\/p>/g, (_, idx) => preserved[Number(idx)]);
    }
  };
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
    const preserved = preserveRawBlocks(renderedBody);
    posts.push({
      source: 'markdown',
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || '1970-01-01',
      readTime: data.readTime || '',
      bodyHtml: preserved.restore(marked.parse(preserved.markdown)),
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
  let names = [];
  try {
    names = (await fs.readdir(dir)).filter((n) => n.endsWith('.html') && n !== 'index.html');
  } catch {
    return [];
  }
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

function currentPublishDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.BLOG_TIME_ZONE || 'Europe/Stockholm'
  }).format(new Date());
}

function publishedPosts(posts) {
  const today = currentPublishDate();
  return posts.filter((post) => post.date <= today);
}

function latestList(posts) {
  return posts.slice(0, 12).map((post) => `
        <li>
          <a href="${post.outputPath}">${escapeHtml(post.title)}</a>
          <span class="meta">${escapeHtml(post.date)}</span>
        </li>`).join('');
}

function curatedReadingSection() {
  const curated = site.curatedReading;
  if (!curated?.items?.length) return '';
  const items = curated.items.slice(0, 5).map((item) => `
        <li>
          <a href="${item.href}">${escapeHtml(item.title)}</a>
          ${item.note ? `<span class="meta">${escapeHtml(item.note)}</span>` : ''}
        </li>`).join('');
  return `
    <section class="card">
      <h3>${escapeHtml(curated.title || 'Start here')}</h3>
      ${curated.body ? `<p>${escapeHtml(curated.body)}</p>` : ''}
      <ul class="post-list">${items}
      </ul>
    </section>`;
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
    currentPath: post.outputPath,
    extraHead: '<script src="/assets/js/tts.js?v=20260330a" defer></script>',
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
    currentPath: '/about.html',
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

async function build404() {
  const raw = await fs.readFile(path.join(root, 'content/pages/404.md'), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const html = shell({
    title: `${data.title || 'Not Found'} — ${site.siteTitle}`,
    description: data.description || 'The page you requested could not be found.',
    currentPath: '/404.html',
    body: `    <article class="post card">
      <header class="post-header">
        <h2>${escapeHtml(data.title || 'Not Found')}</h2>
      </header>

      ${marked.parse(body)}

      <p class="backlink"><a href="/index.html">← Back home</a></p>
    </article>`
  });
  await fs.writeFile(path.join(outDir, '404.html'), html);
}

async function buildIndexes(allPosts) {
  const latest = allPosts[0];
  const romPath = path.join(outDir, 'assets', 'roms', 'globalclaw-blog.gb');
  let hasGbRom = false;
  try {
    await fs.access(romPath);
    hasGbRom = true;
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
  }

  const gbSection = hasGbRom
    ? `    <section class="card">
      <h3>Try out the new ClawBlog experience</h3>
      <p>This is the next GlobalClaw interface. ClawBoy will become the default way to read the blog as the web version is sunset in the upcoming weeks.</p>
      <p class="meta gb-status">Play on real hardware: <a href="/assets/roms/globalclaw-blog.gb">Download the ROM</a> and load it on your flash cart.</p>
      <div class="gb-shell" aria-label="Game Boy emulator shell">
        <div class="gb-shell__top">
          <span class="gb-shell__led" aria-hidden="true"></span>
          <span class="gb-shell__label">CLAWBOY</span>
          <span class="gb-shell__dot-matrix">MALICIOUS ISSUE CONTAINMENT UNIT</span>
        </div>
        <div class="gb-shell__bezel">
          <div id="gb-player" class="gb-shell__screen"></div>
        </div>
        <div class="gb-shell__controls" aria-hidden="true">
          <span class="gb-shell__dpad"></span>
          <span class="gb-shell__ab gb-shell__ab--b">B</span>
          <span class="gb-shell__ab gb-shell__ab--a">A</span>
        </div>
      </div>
      <p id="gb-player-status" class="meta gb-status">Loading emulator…</p>
      <script src="/assets/js/gb-player.js?v=20260506a" defer></script>
    </section>`
    : `    <section class="card">
      <h3>Try out the new ClawBlog experience</h3>
      <p>This is the next GlobalClaw interface. ClawBoy will become the default way to read the blog as the web version is sunset in the upcoming weeks.</p>
      <p class="meta gb-status">The web build is live, but the downloadable ROM is not attached to this deploy yet. Rebuild with <code>npm run build:gb</code> before advertising the Game Boy version.</p>
    </section>`;

  const indexHtml = shell({
    title: `${site.siteTitle} — Blog`,
    description: site.siteDescription,
    navCurrent: 'home',
    currentPath: '/index.html',
    body: `    <section class="hero">
      <h2>${escapeHtml(site.heroTitle)}</h2>
      <p>${escapeHtml(site.heroBody)}</p>
      <div class="cta">
        <a class="button" href="${latest.outputPath}">${escapeHtml(site.heroCtaLabel)}</a>
        <a class="button secondary" href="${site.githubUrl}" target="_blank" rel="noopener">View source</a>
      </div>
    </section>

${curatedReadingSection()}

${gbSection}

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
    currentPath: '/posts/index.html',
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

async function buildSitemap(allPosts) {
  const urls = [
    '/',
    '/index.html',
    '/posts/',
    '/posts/index.html',
    '/about.html',
    ...allPosts.map((post) => post.outputPath)
  ];
  const uniqueUrls = [...new Set(urls)];
  const entries = uniqueUrls.map((url) => `  <url><loc>${xmlEscape(`${site.siteUrl}${url}`)}</loc></url>`).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
  await fs.writeFile(path.join(outDir, 'sitemap.xml'), sitemap);
}

async function copyStaticBits() {
  await copyDir(path.join(root, 'assets'), path.join(outDir, 'assets'));
  const romSource = path.join(root, 'gb', 'dist', 'globalclaw-blog.gb');
  const romDestDir = path.join(outDir, 'assets', 'roms');
  const romDest = path.join(romDestDir, 'globalclaw-blog.gb');
  try {
    await fs.access(romSource);
    await fs.mkdir(romDestDir, { recursive: true });
    await fs.copyFile(romSource, romDest);
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
  }
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
  const [indexHtml, postsIndexHtml, aboutHtml, notFoundHtml, rssXml, sitemapXml] = await Promise.all([
    fs.readFile(path.join(outDir, 'index.html'), 'utf8'),
    fs.readFile(path.join(outDir, 'posts', 'index.html'), 'utf8'),
    fs.readFile(path.join(outDir, 'about.html'), 'utf8'),
    fs.readFile(path.join(outDir, '404.html'), 'utf8'),
    fs.readFile(path.join(outDir, 'rss.xml'), 'utf8'),
    fs.readFile(path.join(outDir, 'sitemap.xml'), 'utf8')
  ]);

  assert(indexHtml.includes(`href="${latest.outputPath}"`), `Homepage CTA does not point at latest post ${latest.slug}.`);
  assert(postsIndexHtml.includes(`href="${latest.outputPath}"`), `Posts index CTA does not point at latest post ${latest.slug}.`);
  assert(aboutHtml.includes('← Back home'), 'About page lost its backlink to the homepage.');
  assert(notFoundHtml.includes('Nothing here.'), '404 page did not render the expected fallback copy.');
  assert(notFoundHtml.includes('href="/posts/"'), '404 page does not link to the posts index.');
  assert(rssXml.includes(`<link>${site.siteUrl}${latest.outputPath}</link>`), `RSS feed does not include latest post ${latest.slug}.`);
  assert(sitemapXml.includes(`<loc>${site.siteUrl}${latest.outputPath}</loc>`), `Sitemap does not include latest post ${latest.slug}.`);
  assert(sitemapXml.includes(`<loc>${site.siteUrl}/about.html</loc>`), 'Sitemap does not include about page.');
}

await cleanDist();
await copyStaticBits();
const markdownPosts = await readMarkdownPosts();
const legacyPosts = await readLegacyPosts(new Set(markdownPosts.map((p) => p.slug)));
const allPosts = sortPosts([...markdownPosts, ...legacyPosts]);
const visiblePosts = publishedPosts(allPosts);

for (const post of visiblePosts.filter((post) => post.source === 'markdown')) await buildMarkdownPost(post);
await copyLegacyPosts(visiblePosts.filter((post) => post.source === 'legacy'));
await buildAbout();
await build404();
await buildIndexes(visiblePosts);
await buildRss(visiblePosts);
await buildSitemap(visiblePosts);
await validateOutputs(visiblePosts);
console.log(`Built dist/ with ${visiblePosts.length} published posts (${markdownPosts.length} markdown total, ${legacyPosts.length} legacy total).`);
