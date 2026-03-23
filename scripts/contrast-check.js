#!/usr/bin/env node
'use strict';

function parseColor(color) {
  color = color.trim();
  if (color.startsWith('#')) {
    let value = color.slice(1);
    if (value.length === 3) value = value.split('').map((c) => c + c).join('');
    const num = parseInt(value, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
      a: 1,
    };
  }
  const rgbaMatch = color.match(/rgba?\(([^)]+)\)/i);
  if (!rgbaMatch) {
    throw new Error(`Unable to parse color: ${color}`);
  }
  const parts = rgbaMatch[1].split(',').map((p) => p.trim());
  const [r, g, b] = parts.slice(0, 3).map(Number);
  const a = parts[3] !== undefined ? Number(parts[3]) : 1;
  return { r, g, b, a };
}

function blend(fg, bg) {
  const alpha = fg.a === undefined ? 1 : fg.a;
  const inv = 1 - alpha;
  return {
    r: Math.round(fg.r * alpha + bg.r * inv),
    g: Math.round(fg.g * alpha + bg.g * inv),
    b: Math.round(fg.b * alpha + bg.b * inv),
    a: 1,
  };
}

function toLinear(channel) {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function luminance(color) {
  return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
}

function contrastRatio(foreground, background) {
  const fg = blend(foreground, background);
  const bg = background;
  const lum1 = luminance(fg);
  const lum2 = luminance(bg);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function formatRatio(ratio) {
  return `${ratio.toFixed(2)}:1`;
}

const themes = [
  {
    name: 'Standard theme',
    vars: {
      bg: '#0b1020',
      text: 'rgba(255,255,255,.92)',
      muted: 'rgba(255,255,255,.68)',
      card: 'rgba(255,255,255,.06)',
      card2: 'rgba(255,255,255,.09)',
    },
  },
  {
    name: 'High-contrast (a11y-ry)',
    vars: {
      bg: '#ffeb00',
      text: '#b00000',
      muted: '#7a0000',
      accent: '#b00000',
    },
  },
];

const pairs = [
  {
    label: 'Body text on page background',
    fg: (vars) => vars.text,
    bg: (vars) => vars.bg,
    info: 'Hero/paragraph text vs body background',
  },
  {
    label: 'Muted text on page background',
    fg: (vars) => vars.muted,
    bg: (vars) => vars.bg,
    info: 'Meta text (timestamps, tags) vs body background',
  },
  {
    label: 'Body text on TTS card background',
    fg: (vars) => vars.text,
    bg: (vars) => vars.card2,
    info: 'TTS player text vs the floating card background',
    under: (vars) => vars.bg,
  },
  {
    label: 'High-contrast text on yellow',
    fg: (vars) => vars.text,
    bg: (vars) => vars.bg,
    info: 'a11y-ry theme body text vs its yellow background',
    themes: ['High-contrast (a11y-ry)'],
  },
  {
    label: 'High-contrast muted text on yellow',
    fg: (vars) => vars.muted,
    bg: (vars) => vars.bg,
    info: 'a11y-ry muted text vs yellow background',
    themes: ['High-contrast (a11y-ry)'],
  },
];

console.log('Contrast report: scripts/contrast-check.js\n');
themes.forEach((theme) => {
  console.log(`Theme: ${theme.name}`);
  pairs.forEach((pair) => {
    if (pair.themes && !pair.themes.includes(theme.name)) return;
    const fgInput = pair.fg(theme.vars);
    const bgInput = pair.bg(theme.vars);
    if (!fgInput || !bgInput) return;
    const fgColor = parseColor(fgInput);
    let bgColor = parseColor(bgInput);
    if (pair.under) {
      const underColorInput = pair.under(theme.vars);
      if (underColorInput) {
        bgColor = blend(bgColor, parseColor(underColorInput));
      }
    }
    const ratio = contrastRatio(fgColor, bgColor);
    const meetsAA = ratio >= 4.5;
    const meetsLarge = ratio >= 3;
    const meetsAAA = ratio >= 7;
    const notes = [];
    notes.push(meetsAA ? 'AA (normal) ✅' : 'AA (normal) ❌');
    notes.push(meetsLarge ? 'AA (large) ✅' : 'AA (large) ❌');
    if (meetsAAA) notes.push('AAA ✅');
    console.log(`  - ${pair.label}: ${formatRatio(ratio)} (${notes.join(', ')})`);
    console.log(`    ${pair.info}`);
  });
  console.log('');
});
