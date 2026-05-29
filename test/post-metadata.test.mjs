import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../scripts/post-metadata.mjs';

function load(raw) {
  return parseFrontmatter(raw).data;
}

test('parses supported scalar frontmatter fields', () => {
  const data = load(`---
title: Hello
slug: custom-slug
description: "Quoted text"
date: 2026-05-29
readTime: ~5 min read
---
Body\n`);

  assert.deepEqual(data, {
    title: 'Hello',
    slug: 'custom-slug',
    description: 'Quoted text',
    date: '2026-05-29',
    readTime: '~5 min read'
  });
});

test('rejects duplicate keys', () => {
  assert.throws(
    () => load(`---
title: One
title: Two
---
Body\n`),
    /duplicate field "title"/
  );
});

test('rejects malformed frontmatter lines', () => {
  assert.throws(
    () => load(`---
title Hello
---
Body\n`),
    /expected "key: value"/
  );
});

test('rejects block scalars and indented multiline values', () => {
  assert.throws(
    () => load(`---
description: |
  multiline
---
Body\n`),
    /block scalars are not supported/
  );

  assert.throws(
    () => load(`---
description: first line
  second line
---
Body\n`),
    /indented or multiline values are not supported/
  );
});

test('rejects comments and other unsupported yaml features', () => {
  assert.throws(
    () => load(`---
# note
title: Hello
---
Body\n`),
    /comments are not supported/
  );

  assert.throws(
    () => load(`---
tags: [one, two]
---
Body\n`),
    /flow collections are not supported/
  );
});
