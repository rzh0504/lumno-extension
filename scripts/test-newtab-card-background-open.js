const assert = require('assert');
const path = require('path');
const fs = require('fs');

require(path.join('..', 'src', 'newtab', 'bookmarks-view.js'));
require(path.join('..', 'src', 'newtab', 'recent-sites-view.js'));

const repoRoot = path.resolve(__dirname, '..');
const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');

const { createBookmarksView } = globalThis.LumnoNewtabBookmarksView;
const { createRecentSitesView } = globalThis.LumnoNewtabRecentSitesView;

function createFakeEvent(type, values) {
  return Object.assign({
    type,
    button: 0,
    key: '',
    preventDefault() {},
    stopPropagation() {}
  }, values || {});
}

function createFakeElement(tagName) {
  const children = [];
  const listeners = new Map();
  const attributes = new Map();
  const classes = new Set();
  const styleValues = new Map();
  let classNameValue = '';
  let textContentValue = '';
  const element = {
    tagName: String(tagName || '').toUpperCase(),
    children,
    childNodes: children,
    parentNode: null,
    innerHTML: '',
    title: '',
    type: '',
    tabIndex: 0,
    scrollWidth: 120,
    clientWidth: 40,
    get className() {
      return classNameValue;
    },
    set className(value) {
      classNameValue = String(value || '');
      classes.clear();
      classNameValue.split(/\s+/).filter(Boolean).forEach((part) => classes.add(part));
    },
    get textContent() {
      return textContentValue || children.map((child) => child.textContent || '').join('');
    },
    set textContent(value) {
      textContentValue = String(value || '');
    },
    get isConnected() {
      return true;
    },
    classList: {
      add: (...names) => {
        names.forEach((name) => classes.add(String(name)));
        classNameValue = Array.from(classes).join(' ');
      },
      remove: (...names) => {
        names.forEach((name) => classes.delete(String(name)));
        classNameValue = Array.from(classes).join(' ');
      },
      contains: (name) => classes.has(String(name)),
      toggle: (name, force) => {
        const className = String(name);
        const shouldAdd = force === undefined ? !classes.has(className) : Boolean(force);
        if (shouldAdd) {
          classes.add(className);
        } else {
          classes.delete(className);
        }
        classNameValue = Array.from(classes).join(' ');
        return shouldAdd;
      }
    },
    style: {
      setProperty: (name, value) => styleValues.set(String(name), String(value)),
      removeProperty: (name) => styleValues.delete(String(name)),
      getPropertyValue: (name) => styleValues.get(String(name)) || ''
    },
    appendChild(child) {
      child.parentNode = element;
      children.push(child);
      return child;
    },
    setAttribute(name, value) {
      attributes.set(String(name), String(value));
    },
    getAttribute(name) {
      return attributes.get(String(name)) || '';
    },
    removeAttribute(name) {
      attributes.delete(String(name));
    },
    addEventListener(type, listener) {
      const eventName = String(type || '');
      listeners.set(eventName, [...(listeners.get(eventName) || []), listener]);
    },
    dispatchEvent(event) {
      const nextEvent = event || createFakeEvent('');
      nextEvent.target = nextEvent.target || element;
      (listeners.get(nextEvent.type) || []).forEach((listener) => listener(nextEvent));
      return true;
    },
    matches() {
      return true;
    },
    querySelector() {
      return null;
    }
  };
  return element;
}

function createFakeDocument() {
  return {
    visibilityState: 'visible',
    createElement: createFakeElement,
    addEventListener() {},
    removeEventListener() {}
  };
}

function createBaseBookmarkOptions(overrides) {
  return Object.assign({
    documentObj: createFakeDocument(),
    windowObj: { setTimeout, clearTimeout },
    grid: createFakeElement('div'),
    cards: [],
    cardElementCache: new Map(),
    t: (_key, fallback) => fallback || '',
    formatMessage: (_key, fallback, values) => fallback.replace('{title}', values.title),
    sanitizeDisplayText: (value) => String(value || ''),
    getHostFromUrl: () => 'example.com',
    getSiteDisplayName: (_host, title) => title || '',
    getUrlDisplay: (url) => url,
    getRiSvg: () => '',
    getFigmaFolderSvg: () => '',
    initFolderPathMorph() {},
    playFolderPathMorph() {},
    stableHashCode: () => 0,
    normalizeHost: (host) => host,
    attachFaviconWithFallbacks() {},
    isLocalNetworkHost: () => false,
    getChromeFaviconUrl: () => '',
    getBrowserPageFaviconUrl: () => '',
    getImmediateThemeForSuggestion: () => null,
    queueThemeForTarget() {},
    applyCardTheme() {},
    shouldDelayHoverFromRecent: () => false,
    bindCursorTooltip() {},
    hideCursorTooltip() {},
    openFolder() {},
    openFolderMenu() {},
    navigateToUrl() {}
  }, overrides || {});
}

function createBaseRecentOptions(overrides) {
  return Object.assign({
    documentObj: createFakeDocument(),
    windowObj: {
      setTimeout,
      clearTimeout,
      addEventListener() {}
    },
    grid: createFakeElement('div'),
    cards: [],
    t: (_key, fallback) => fallback || '',
    formatMessage: (_key, fallback, values) => fallback.replace('{title}', values.title),
    sanitizeDisplayText: (value) => String(value || ''),
    getOwnExtensionPageDisplay: () => null,
    getHostFromUrl: () => 'example.com',
    getCanonicalPageUrlForFavicon: (url) => url,
    getBrowserPageFaviconUrl: () => '',
    getSiteDisplayName: (_host, title) => title || '',
    getUrlDisplay: (url) => url,
    getRiSvg: () => '',
    attachFaviconWithFallbacks() {},
    getImmediateThemeForSuggestion: () => null,
    queueThemeForTarget() {},
    applyCardTheme() {},
    getCurrentRecentCount: () => 4,
    isPinned: () => false,
    getPinnedCount: () => 0,
    getMaxPinnedCount: () => 3,
    canDismiss: () => true,
    getDismissTooltip: () => '',
    updatePinButton() {},
    updateDismissButton() {},
    showToast() {},
    showTopActionTooltip() {},
    hideTopActionTooltip() {},
    navigateToUrl() {},
    togglePinned: () => Promise.resolve(null),
    hideTemporarily: () => Promise.resolve(null)
  }, overrides || {});
}

function testBookmarkUrlCardsOpenInBackgroundWithCommandOrControl() {
  const opened = [];
  const tooltipBindings = [];
  const view = createBookmarksView(createBaseBookmarkOptions({
    bindCursorTooltip: (_target, _getText, options) => {
      tooltipBindings.push(options);
    },
    navigateToUrl: (url) => {
      opened.push({ url, via: 'navigate' });
    },
    openUrl: (url, options) => {
      opened.push({ url, background: Boolean(options && options.openInBackgroundTab) });
    }
  }));
  const card = view.buildCard({
    id: 'docs',
    type: 'bookmark',
    title: 'Docs',
    url: 'https://example.com/docs'
  }, 0, { viewMode: 'folder', menuMode: false });

  assert.strictEqual(tooltipBindings.length, 1, 'bookmark URL card should bind a cursor tooltip');
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(tooltipBindings[0], 'getTagText'),
    false,
    'bookmark cursor tooltip should not render the extra background-open badge'
  );

  card.dispatchEvent(createFakeEvent('click', { metaKey: true }));
  card.dispatchEvent(createFakeEvent('keydown', { key: 'Enter', ctrlKey: true }));
  assert.deepStrictEqual(opened, [
    { url: 'https://example.com/docs', background: true },
    { url: 'https://example.com/docs', background: true }
  ]);
}

function testRecentUrlCardsOpenInBackgroundAndBindCursorTooltip() {
  const opened = [];
  const tooltipBindings = [];
  const pendingTimers = [];
  const view = createRecentSitesView(createBaseRecentOptions({
    windowObj: {
      setTimeout: (callback) => {
        pendingTimers.push(callback);
        return pendingTimers.length;
      },
      clearTimeout: () => {},
      addEventListener() {}
    },
    bindCursorTooltip: (_target, _getText, options) => {
      tooltipBindings.push(options);
    },
    navigateToUrl: (url) => {
      opened.push({ url, via: 'navigate' });
    },
    openUrl: (url, options) => {
      opened.push({ url, background: Boolean(options && options.openInBackgroundTab) });
    }
  }));
  const card = view.buildCard({
    title: 'Example Docs',
    url: 'https://example.com/docs',
    visitCount: 3
  }, 0);

  assert.strictEqual(tooltipBindings.length, 1, 'recent URL card should bind a cursor-following tooltip');
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(tooltipBindings[0], 'getTagText'),
    false,
    'recent cursor tooltip should not render the extra background-open badge'
  );

  card.dispatchEvent(createFakeEvent('pointerdown', { metaKey: true }));
  while (pendingTimers.length > 0) {
    pendingTimers.shift()();
  }
  card.dispatchEvent(createFakeEvent('click', { metaKey: true }));
  assert.deepStrictEqual(opened, [
    { url: 'https://example.com/docs', background: true }
  ], 'recent card should only open once for a pointerdown followed by the browser click event');
}

function testNewtabPassesBackgroundOpenHelperToCardViews() {
  assert.ok(
    /function openUrlFromNewtabCard\(url,\s*options\)[\s\S]*disposition:\s*'backgroundTab'[\s\S]*navigateToUrl\(url\)/.test(newtabJs),
    'newtab should expose a card URL opener that maps Command/Ctrl to background tabs'
  );
  assert.ok(
    /createBookmarksView\(\{[\s\S]*openUrl:\s*openUrlFromNewtabCard[\s\S]*\}\)/.test(newtabJs),
    'newtab should pass the background-aware opener into bookmark cards'
  );
  assert.ok(
    /createRecentSitesView\(\{[\s\S]*bindCursorTooltip[\s\S]*openUrl:\s*openUrlFromNewtabCard[\s\S]*\}\)/.test(newtabJs),
    'newtab should pass cursor tooltip binding and background-aware opening into recent cards'
  );
}

function testRecentDismissUsesSubtractIcon() {
  const match = newtabJs.match(/function updateRecentDismissButton\(button, item\) \{[\s\S]*?\n  \}/);
  assert.ok(match, 'newtab should define recent dismiss button rendering');
  assert.ok(
    match[0].includes("getRiSvg('ri-subtract-line', 'ri-size-16')"),
    'recent dismiss button should use the Remix subtract icon'
  );
  assert.ok(
    !match[0].includes('ri-close-line'),
    'recent dismiss button should not use a close icon'
  );
}

testBookmarkUrlCardsOpenInBackgroundWithCommandOrControl();
testRecentUrlCardsOpenInBackgroundAndBindCursorTooltip();
testNewtabPassesBackgroundOpenHelperToCardViews();
testRecentDismissUsesSubtractIcon();

console.log('newtab card background open tests passed');
