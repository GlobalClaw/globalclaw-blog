import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = path.resolve(import.meta.dirname, '..');
const jsDir = path.join(repoRoot, 'assets', 'js');
const jsFiles = ['theme.js', 'tts.js', 'gb-player.js'];

class ClassList {
  constructor(initial = []) {
    this.set = new Set(initial);
  }

  add(...names) {
    for (const name of names) this.set.add(name);
  }

  remove(...names) {
    for (const name of names) this.set.delete(name);
  }

  contains(name) {
    return this.set.has(name);
  }
}

class MockElement {
  constructor(tagName, { id = '', className = '', textContent = '' } = {}) {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this._className = className;
    this.textContent = textContent;
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this.listeners = new Map();
    this.classList = new ClassList(className ? className.split(/\s+/).filter(Boolean) : []);
    this.checked = false;
    this.async = false;
    this.src = '';
    this.title = '';
    this.removed = false;
  }

  get className() {
    return this._className;
  }

  set className(value) {
    this._className = String(value);
    this.classList = new ClassList(this._className.split(/\s+/).filter(Boolean));
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === 'id') this.id = String(value);
    if (name === 'class') {
      this.className = String(value);
    }
  }

  getAttribute(name) {
    if (name === 'id') return this.id || null;
    if (name === 'class') return this.className || null;
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  remove() {
    this.removed = true;
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }

  addEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    list.push(handler);
    this.listeners.set(type, list);
  }

  dispatchEvent(type, event = {}) {
    const handlers = this.listeners.get(type) || [];
    for (const handler of handlers) handler({ target: this, ...event });
  }

  click() {
    this.dispatchEvent('click');
  }

  matches(selector) {
    return matchesSelector(this, selector);
  }

  querySelector(selector) {
    return querySelectorAllFrom(this, selector)[0] || null;
  }

  querySelectorAll(selector) {
    return querySelectorAllFrom(this, selector);
  }

  cloneNode(deep = false) {
    const copy = new MockElement(this.tagName, {
      id: this.id,
      className: this.className,
      textContent: this.textContent
    });
    for (const [name, value] of this.attributes.entries()) {
      copy.attributes.set(name, value);
    }
    copy.checked = this.checked;
    copy.async = this.async;
    copy.src = this.src;
    copy.title = this.title;
    if (deep) {
      for (const child of this.children) copy.appendChild(child.cloneNode(true));
    }
    return copy;
  }

  set innerHTML(html) {
    this._innerHTML = html;
    this.children = [];

    if (html.includes('data-tts-play')) {
      const title = new MockElement('div', { className: 'tts-player__title', textContent: 'Listen' });
      const controls = new MockElement('div', { className: 'tts-player__controls' });
      const play = new MockElement('button', { className: 'tts-btn', textContent: 'Play' });
      play.setAttribute('data-tts-play', '');
      play.setAttribute('aria-label', 'Play article audio');
      const pause = new MockElement('button', { className: 'tts-btn', textContent: 'Pause' });
      pause.setAttribute('data-tts-pause', '');
      pause.setAttribute('aria-label', 'Pause or resume article audio');
      pause.setAttribute('aria-pressed', 'false');
      const stop = new MockElement('button', { className: 'tts-btn', textContent: 'Stop' });
      stop.setAttribute('data-tts-stop', '');
      stop.setAttribute('aria-label', 'Stop article audio');
      controls.appendChild(play);
      controls.appendChild(pause);
      controls.appendChild(stop);

      const label = new MockElement('label', { className: 'tts-player__autoplay' });
      const input = new MockElement('input');
      input.setAttribute('data-tts-autoplay', '');
      input.checked = false;
      label.appendChild(input);

      const status = new MockElement('p', { className: 'tts-player__status', textContent: 'Ready' });
      status.setAttribute('data-tts-status', '');
      status.setAttribute('aria-live', 'polite');

      this.appendChild(title);
      this.appendChild(controls);
      this.appendChild(label);
      this.appendChild(status);
    }
  }

  get innerHTML() {
    return this._innerHTML || '';
  }

  get innerText() {
    const parts = [this.textContent, ...this.children.map((child) => child.innerText)].filter(Boolean);
    return parts.join(' ').trim();
  }
}

class MockDocument {
  constructor() {
    this.documentElement = new MockElement('html');
    this.body = new MockElement('body');
    this.documentElement.appendChild(this.body);
    this.listeners = new Map();
  }

  createElement(tagName) {
    return new MockElement(tagName);
  }

  querySelector(selector) {
    return this.documentElement.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.documentElement.querySelectorAll(selector);
  }

  addEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    list.push(handler);
    this.listeners.set(type, list);
  }

  dispatchEvent(type, event = {}) {
    const handlers = this.listeners.get(type) || [];
    for (const handler of handlers) handler(event);
  }
}

function matchesSelector(element, selector) {
  const trimmed = selector.trim();
  if (!trimmed) return false;

  if (trimmed.includes(',')) {
    return trimmed.split(',').some((part) => matchesSelector(element, part));
  }

  if (trimmed.startsWith('#')) return element.id === trimmed.slice(1);
  if (trimmed.startsWith('.')) return element.classList.contains(trimmed.slice(1));
  if (trimmed.startsWith('[')) {
    const name = trimmed.slice(1, -1).split('=')[0].trim();
    return element.attributes.has(name);
  }

  const [tag, className] = trimmed.split('.');
  if (tag && element.tagName.toLowerCase() !== tag.toLowerCase()) return false;
  if (className) return element.classList.contains(className);
  return true;
}

function querySelectorAllFrom(root, selector) {
  const selectors = selector.split(',').map((part) => part.trim()).filter(Boolean);
  const results = [];
  const queue = [...root.children];

  while (queue.length) {
    const node = queue.shift();
    if (selectors.some((part) => matchesSelector(node, part))) results.push(node);
    queue.unshift(...node.children);
  }

  return results;
}

async function loadScript(name) {
  return fs.readFile(path.join(jsDir, name), 'utf8');
}

async function executeScript(name, overrides = {}) {
  const source = await loadScript(name);
  const document = overrides.document || new MockDocument();
  const localStorageStore = new Map();
  const localStorage = overrides.localStorage || {
    getItem(key) {
      return localStorageStore.has(key) ? localStorageStore.get(key) : null;
    },
    setItem(key, value) {
      localStorageStore.set(key, String(value));
    }
  };

  const timeouts = [];
  const context = {
    document,
    localStorage,
    fetch: overrides.fetch || (() => Promise.resolve({ ok: true, json: async () => ({ uptimeSeconds: 420, hostname: 'unit-test-host' }) })),
    setTimeout: overrides.setTimeout || ((fn) => {
      timeouts.push(fn);
      return timeouts.length;
    }),
    clearTimeout: overrides.clearTimeout || (() => {}),
    AbortController: overrides.AbortController || class {
      constructor() {
        this.signal = { aborted: false };
      }
      abort() {
        this.signal.aborted = true;
      }
    },
    SpeechSynthesisUtterance: overrides.SpeechSynthesisUtterance || function SpeechSynthesisUtterance(text) { this.text = text; },
    window: null,
    console,
    Promise,
    queueMicrotask,
    Math
  };

  context.window = overrides.window || context;
  context.window.document = document;
  context.window.localStorage = localStorage;
  context.window.setTimeout = context.setTimeout;
  context.window.clearTimeout = context.clearTimeout;
  context.window.AbortController = context.AbortController;
  context.window.fetch = context.fetch;
  context.window.console = console;
  context.window.Promise = Promise;

  vm.runInNewContext(source, context, { filename: name });
  return { context, document, localStorage, timeouts };
}

test('browser JS files parse as scripts', async () => {
  for (const file of jsFiles) {
    const source = await loadScript(file);
    assert.doesNotThrow(() => new vm.Script(source, { filename: file }));
  }
});

async function flushAsyncTurns(count = 6) {
  for (let i = 0; i < count; i += 1) {
    await Promise.resolve();
  }
}

function buildThemeDom() {
  const document = new MockDocument();
  const button = document.createElement('button');
  button.setAttribute('data-theme-toggle', '');
  button.textContent = 'High contrast';
  const pill = document.createElement('span');
  pill.setAttribute('data-status-pill', '');
  pill.classList.add('status-pill--loading');
  const statusText = document.createElement('span');
  statusText.setAttribute('data-status-text', '');
  statusText.textContent = 'Checking…';
  document.body.appendChild(button);
  document.body.appendChild(pill);
  document.body.appendChild(statusText);
  return { document, button, pill, statusText };
}

test('theme.js wires the toggle and status pill without throwing', async () => {
  const { document, button, pill, statusText } = buildThemeDom();

  let fetchCalls = 0;
  await executeScript('theme.js', {
    document,
    fetch: async () => {
      fetchCalls += 1;
      return {
        ok: true,
        async json() {
          return { uptimeSeconds: 600, hostname: 'status-host' };
        }
      };
    }
  });

  await flushAsyncTurns();

  assert.equal(fetchCalls, 1);
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(button.textContent, 'High contrast');

  document.dispatchEvent('click', { target: button });
  assert.equal(document.documentElement.getAttribute('data-theme'), 'a11y-ry');
  assert.equal(button.textContent, 'Standard');
  assert.equal(button.getAttribute('aria-label'), 'Toggle high contrast theme');
  assert.equal(statusText.textContent, 'GlobalClaw up');
  assert.equal(pill.title, 'GlobalClaw status: up · 10m up · status-host');
  assert.ok(pill.classList.contains('status-pill--up'));
});

test('theme.js shows status unavailable when the browser cannot reach the endpoint', async () => {
  const { document, pill, statusText } = buildThemeDom();

  await executeScript('theme.js', {
    document,
    fetch: async () => {
      throw new Error('network blocked');
    }
  });

  await flushAsyncTurns();

  assert.equal(statusText.textContent, 'Status unavailable');
  assert.equal(pill.title, 'Could not reach the GlobalClaw status endpoint from this browser');
  assert.ok(pill.classList.contains('status-pill--unavailable'));
});

test('tts.js and gb-player.js boot their page-specific UI without throwing', async () => {
  const document = new MockDocument();
  const article = document.createElement('article');
  article.setAttribute('class', 'post');
  article.textContent = 'A post worth listening to.';
  document.body.appendChild(article);

  let cancelled = 0;
  const synth = {
    speaking: false,
    paused: false,
    cancel() {
      cancelled += 1;
      this.speaking = false;
      this.paused = false;
    },
    speak(utterance) {
      this.speaking = true;
      utterance.onstart?.();
    },
    pause() {
      this.paused = true;
      this.speaking = false;
    },
    resume() {
      this.paused = false;
      this.speaking = true;
    }
  };

  const windowListeners = new Map();
  await executeScript('tts.js', {
    document,
    window: {
      speechSynthesis: synth,
      SpeechSynthesisUtterance: function SpeechSynthesisUtterance(text) { this.text = text; },
      addEventListener(type, handler) {
        const list = windowListeners.get(type) || [];
        list.push(handler);
        windowListeners.set(type, list);
      }
    }
  });
  document.dispatchEvent('DOMContentLoaded');

  const ttsUi = document.querySelector('.tts-player');
  assert.ok(ttsUi, 'expected TTS UI to be appended');
  assert.equal(ttsUi.querySelector('[data-tts-status]').textContent, 'Ready');
  ttsUi.querySelector('[data-tts-play]').click();
  assert.equal(ttsUi.querySelector('[data-tts-status]').textContent, 'Playing');

  const player = document.createElement('div');
  player.setAttribute('id', 'gb-player');
  const status = document.createElement('p');
  status.setAttribute('id', 'gb-player-status');
  status.textContent = 'Loading emulator…';
  document.body.appendChild(player);
  document.body.appendChild(status);

  const { context, timeouts } = await executeScript('gb-player.js', { document });

  assert.equal(context.window.EJS_player, '#gb-player');
  assert.equal(context.window.EJS_core, 'gb');
  assert.equal(context.window.EJS_gameUrl, '/assets/roms/globalclaw-blog.gb');
  assert.equal(context.window.EJS_startOnLoaded, true);

  const loader = document.body.children.find((child) => child.tagName === 'SCRIPT' && child.src === 'https://cdn.emulatorjs.org/stable/data/loader.js');
  assert.ok(loader, 'expected EmulatorJS loader script to be appended');
  assert.equal(loader.async, true);

  assert.equal(cancelled, 0);
  assert.equal(timeouts.length, 1);
  timeouts[0]();
  assert.equal(status.textContent, 'Emulator did not initialize. Open in a regular browser or verify ROM availability.');
});
