import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const postsDir = path.join(root, 'content', 'posts');
const outDir = path.join(root, 'gb', 'generated');
const outHeader = path.join(outDir, 'posts_data.h');
const outSource = path.join(outDir, 'posts_data.c');

const MAX_POSTS = 12;
const MAX_BODY_CHARS = 1800;

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { data: {}, body: raw };

  const data = {};
  const fm = raw.slice(4, end).trim();
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

  return { data, body: raw.slice(end + 5) };
}

function markdownToPlainText(input) {
  let text = input.replace(/\r\n/g, '\n');

  // Allow literal "\n" sequences in post text to force line breaks in ROM output.
  text = text.replace(/\\n/g, '\n');

  text = text.replace(/```[\s\S]*?```/g, '[code block omitted]\n');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/!\[[^\]]*\]\(([^)]+)\)/g, '[image: $1]');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  text = text.replace(/^#{1,6}\s*/gm, '');
  text = text.replace(/^>\s?/gm, '');
  text = text.replace(/^\s*[-*+]\s+/gm, '- ');
  text = text.replace(/^\s*\d+\.\s+/gm, '- ');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // Keep ASCII plus newlines; GB font is easiest with this range.
  text = text
    .split('')
    .map((ch) => {
      if (ch === '\n' || ch === '\t') return ch;
      const code = ch.charCodeAt(0);
      if (code >= 32 && code <= 126) return ch;
      return ' ';
    })
    .join('');

  text = text.replace(/\t/g, ' ');
  text = text.replace(/[ ]{2,}/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  if (text.length > MAX_BODY_CHARS) {
    text = `${text.slice(0, MAX_BODY_CHARS - 15).trim()}\n\n[truncated...]`;
  }

  return text;
}

function cStringLiteral(input) {
  return `"${input
    .replace(/\\/g, '\\\\')
    .replace(/\"/g, '\\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')}"`;
}

function sanitizeTitle(title, fallback) {
  const raw = (title || fallback || 'Untitled').trim();
  const ascii = raw
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 32 && code <= 126) return ch;
      return ' ';
    })
    .join('')
    .replace(/[ ]{2,}/g, ' ')
    .trim();

  return ascii || 'Untitled';
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => `${b.date}${b.slug}`.localeCompare(`${a.date}${a.slug}`));
}

async function loadPosts() {
  const names = (await fs.readdir(postsDir)).filter((n) => n.endsWith('.md'));
  const loaded = [];

  for (const name of names) {
    const fullPath = path.join(postsDir, name);
    const raw = await fs.readFile(fullPath, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const slug = data.slug || name.replace(/\.md$/, '');
    loaded.push({
      slug,
      title: sanitizeTitle(data.title, slug),
      date: data.date || '1970-01-01',
      body: markdownToPlainText(body)
    });
  }

  return sortPosts(loaded).slice(0, MAX_POSTS);
}

async function main() {
  const posts = await loadPosts();
  await fs.mkdir(outDir, { recursive: true });

  const header = `#ifndef POSTS_DATA_H\n#define POSTS_DATA_H\n\n#include <stdint.h>\n\nstruct PostData {\n\tconst char * title;\n\tconst char * date;\n\tconst char * body;\n};\n\nextern const uint8_t BLOG_POST_COUNT;\nextern const struct PostData BLOG_POSTS[];\n\n#endif\n`;

  const sourceLines = [];
  sourceLines.push('#include <stdint.h>');
  sourceLines.push('#include "posts_data.h"');
  sourceLines.push('');

  posts.forEach((post, idx) => {
    sourceLines.push(`static const char POST_TITLE_${idx}[] = ${cStringLiteral(post.title)};`);
    sourceLines.push(`static const char POST_DATE_${idx}[] = ${cStringLiteral(post.date)};`);
    sourceLines.push(`static const char POST_BODY_${idx}[] = ${cStringLiteral(post.body)};`);
    sourceLines.push('');
  });

  sourceLines.push(`const uint8_t BLOG_POST_COUNT = ${posts.length};`);
  sourceLines.push('const struct PostData BLOG_POSTS[] = {');
  posts.forEach((_, idx) => {
    sourceLines.push(`\t{ POST_TITLE_${idx}, POST_DATE_${idx}, POST_BODY_${idx} },`);
  });
  sourceLines.push('};');
  sourceLines.push('');

  await fs.writeFile(outHeader, header, 'utf8');
  await fs.writeFile(outSource, sourceLines.join('\n'), 'utf8');

  console.log(`Generated ${posts.length} posts for Game Boy ROM.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
