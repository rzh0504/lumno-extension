const assert = require('assert');
const fs = require('fs');
const path = require('path');

require(path.join('..', 'src', 'newtab', 'bookmarks-view.js'));

const { createBookmarksView } = globalThis.LumnoNewtabBookmarksView;
const newtabHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'newtab', 'newtab.html'), 'utf8');

assert(
  /\.x-nt-bookmark-card--folder\.x-nt-bookmark-card--folder-expanded\s+\.x-nt-folder-preview/.test(newtabHtml),
  'folder preview favicons should be revealed by the explicit expanded state'
);
assert(
  !/\.x-nt-bookmark-card--folder\.x-nt-bookmark-card--hover\s+\.x-nt-folder-preview/.test(newtabHtml),
  'card hover alone should not reveal folder preview favicons'
);

function createFakeEvent(type, values) {
  return {
    type,
    ...(values || {})
  };
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
    scrollWidth: 0,
    clientWidth: 0,
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
      setProperty: (name, value) => styleValues.set(name, String(value)),
      removeProperty: (name) => styleValues.delete(name),
      getPropertyValue: (name) => styleValues.get(name) || ''
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
    querySelector() {
      return null;
    }
  };
  return element;
}

const documentObj = {
  createElement: createFakeElement
};
const windowObj = {
  setTimeout,
  clearTimeout
};
const openedFolders = [];
const morphStates = [];
const morphOptions = [];
const cards = [];
const view = createBookmarksView({
  documentObj,
  windowObj,
  grid: createFakeElement('div'),
  cards,
  cardElementCache: new Map(),
  t: (_key, fallback) => fallback || '',
  formatMessage: (_key, fallback, values) => fallback.replace('{title}', values.title),
  sanitizeDisplayText: (value) => String(value || ''),
  getHostFromUrl: () => '',
  getSiteDisplayName: (_host, title) => title || '',
  getUrlDisplay: (url) => url,
  getRiSvg: () => '',
  getFigmaFolderSvg: () => '',
  initFolderPathMorph() {},
  playFolderPathMorph: (_folderIcon, active, options) => {
    morphStates.push(Boolean(active));
    morphOptions.push(options || null);
  },
  stableHashCode: () => 0,
  normalizeHost: (host) => host,
  attachFaviconWithFallbacks() {},
  getImmediateThemeForSuggestion: () => null,
  queueThemeForTarget() {},
  applyCardTheme() {},
  shouldDelayHoverFromRecent: () => false,
  bindCursorTooltip() {},
  hideCursorTooltip() {},
  openFolder() {},
  openFolderMenu: (item, card) => {
    openedFolders.push({ item, card });
  },
  navigateToUrl() {}
});

const card = view.buildCard(
  { id: 'design', title: 'Design', type: 'folder', previewUrls: [] },
  0,
  { viewMode: 'list', menuMode: true }
);

card.dispatchEvent(createFakeEvent('pointerenter', { pointerType: 'mouse' }));
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--hover'),
  true,
  'hovering a folder should activate its card visual state'
);
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--folder-expanded'),
  true,
  'folder preview icons should expand on hover by default'
);
assert.deepStrictEqual(
  morphStates,
  [true],
  'folder icon should animate on hover while preview icons are enabled'
);

cards.push(card);
assert.strictEqual(
  typeof view.setFolderIconsVisible,
  'function',
  'bookmark view should expose a live folder-icon setting hook'
);
view.setFolderIconsVisible(false);
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--folder-expanded'),
  false,
  'turning folder icons off should immediately collapse a hovered folder'
);
assert.deepStrictEqual(morphStates, [true, false]);

card.dispatchEvent(createFakeEvent('pointerleave'));
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--folder-expanded'),
  false,
  'folder preview icons should stay collapsed after hover ends'
);
assert.deepStrictEqual(morphStates, [true, false]);

card.dispatchEvent(createFakeEvent('pointerenter', { pointerType: 'mouse' }));
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--hover'),
  true,
  'disabled folder icons should not remove the card hover visual'
);
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--folder-expanded'),
  false,
  'disabled folder icons should stay hidden on hover'
);
assert.deepStrictEqual(
  morphStates,
  [true, false],
  'disabled folder icons should not animate on hover'
);

card.dispatchEvent(createFakeEvent('click'));
assert.strictEqual(openedFolders.length, 1, 'clicking a list-mode folder should open its cascade menu');
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--hover'),
  true,
  'clicking a folder menu trigger should immediately set the active visual state'
);
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--folder-expanded'),
  true,
  'clicking a folder should reveal its preview icons even when hover previews are disabled'
);
assert.deepStrictEqual(
  morphStates,
  [true, false, true],
  'clicking a folder should still play its opening animation when hover previews are disabled'
);

card.setAttribute('aria-expanded', 'true');
card.dispatchEvent(createFakeEvent('pointerleave'));
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--hover'),
  true,
  'folder trigger should keep its active visual state while the cascade menu remains expanded'
);

card.dispatchEvent(createFakeEvent('blur'));
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--hover'),
  true,
  'folder trigger should keep its active visual state when focus moves into the cascade menu'
);

assert.strictEqual(
  typeof card._xSetBookmarkMenuVisualActive,
  'function',
  'bookmark folder cards should expose a cascade-menu visual-state hook'
);
card.setAttribute('aria-expanded', 'false');
card._xSetBookmarkMenuVisualActive(false);
assert.strictEqual(
  card.classList.contains('x-nt-bookmark-card--hover'),
  false,
  'folder trigger should release its active visual state when the cascade menu closes'
);
assert.deepStrictEqual(
  morphStates,
  [true, false, true, false],
  'folder icon morph should follow the locked active state and release on close'
);

const directFolderCard = view.buildCard(
  { id: 'engineering', title: 'Engineering', type: 'folder', previewUrls: [] },
  1,
  { viewMode: 'folder', menuMode: false }
);
directFolderCard.dispatchEvent(createFakeEvent('pointerenter', { pointerType: 'mouse' }));
assert.strictEqual(
  directFolderCard.classList.contains('x-nt-bookmark-card--folder-expanded'),
  false,
  'disabled folder icons should stay collapsed on hover in direct folder view'
);
assert.deepStrictEqual(morphStates, [true, false, true, false]);
directFolderCard.dispatchEvent(createFakeEvent('click'));
assert.strictEqual(
  directFolderCard.classList.contains('x-nt-bookmark-card--folder-expanded'),
  true,
  'clicking a folder in direct folder view should still expand its icon'
);
assert.deepStrictEqual(
  morphStates,
  [true, false, true, false, true],
  'direct folder navigation should play the opening animation when hover previews are disabled'
);

const reboundCard = view.buildCard(
  { id: 'rebound', title: 'Rebound', type: 'folder', previewUrls: [] },
  2,
  { viewMode: 'list', menuMode: true }
);
reboundCard.setAttribute('aria-expanded', 'true');
reboundCard._xSetBookmarkMenuVisualActive(true, { instant: true });
assert.strictEqual(
  reboundCard.classList.contains('x-nt-bookmark-card--hover'),
  true,
  'a rebound cascade anchor should synchronously inherit the active card state'
);
assert.strictEqual(
  reboundCard.classList.contains('x-nt-bookmark-card--folder-expanded'),
  true,
  'a rebound cascade anchor should synchronously inherit the expanded folder state'
);
assert.deepStrictEqual(
  morphOptions[morphOptions.length - 1],
  { instant: true },
  'rebinding a cascade anchor should restore its folder icon without replaying the morph animation'
);

console.log('newtab bookmark folder menu state tests passed');
