const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const tooltipJsPath = path.join(repoRoot, 'src/shared/tooltip.js');
const cursorTooltipJsPath = path.join(repoRoot, 'src/shared/cursor-tooltip.js');
const cursorTooltipCssPath = path.join(repoRoot, 'src/shared/cursor-tooltip.css');
const newtabHtmlPath = path.join(repoRoot, 'src/newtab/newtab.html');

assert.ok(fs.existsSync(cursorTooltipJsPath), 'cursor-following tooltip should live in src/shared/cursor-tooltip.js');
assert.ok(fs.existsSync(cursorTooltipCssPath), 'cursor-following tooltip styling should live in src/shared/cursor-tooltip.css');

require(tooltipJsPath);
const cursorTooltip = require(cursorTooltipJsPath);
const cursorTooltipCss = fs.readFileSync(cursorTooltipCssPath, 'utf8');

assert.strictEqual(
  cursorTooltip.hostClassName,
  '_x_extension_cursor_tooltip_host_2026_unique_',
  'cursor tooltip should expose a stable host CSS class'
);
assert.strictEqual(typeof cursorTooltip.createController, 'function', 'cursor tooltip should expose createController()');
assert.strictEqual(typeof cursorTooltip.positionAtPoint, 'function', 'cursor tooltip should expose positionAtPoint()');
assert.ok(
  cursorTooltipCss.includes('._x_extension_cursor_tooltip_host_2026_unique_[data-cursor-tooltip]'),
  'cursor tooltip CSS should suppress native pseudo tips for cursor tooltip hosts'
);
assert.ok(
  cursorTooltipCss.includes('[data-tooltip-kind="cursor"]'),
  'cursor tooltip CSS should identify cursor-following tooltip instances'
);
assert.ok(
  cursorTooltipCss.includes('._x_extension_cursor_tooltip_tag_2026_unique_'),
  'cursor tooltip CSS should style separate action tag bubbles'
);
assert.ok(
  cursorTooltipCss.includes('[data-tooltip-kind="cursor-tag"]'),
  'cursor tooltip CSS should identify separate cursor action tag bubbles'
);
assert.ok(
  cursorTooltipCss.includes('._x_extension_cursor_tooltip_tag_key_2026_unique_'),
  'cursor tooltip CSS should style the action tag keycap'
);
assert.ok(
  /flex:\s*0 0 var\(--x-extension-cursor-tooltip-key-size/.test(cursorTooltipCss) &&
    /width:\s*var\(--x-extension-cursor-tooltip-key-size/.test(cursorTooltipCss) &&
    /height:\s*var\(--x-extension-cursor-tooltip-key-size/.test(cursorTooltipCss),
  'cursor tooltip keycap should keep a fixed square footprint'
);
assert.ok(
  cursorTooltipCss.includes('._x_extension_cursor_tooltip_windows_logo_2026_unique_') &&
    cursorTooltipCss.includes('._x_extension_cursor_tooltip_windows_logo_pane_2026_unique_') &&
    cursorTooltipCss.includes('position: relative') &&
    cursorTooltipCss.includes('position: absolute') &&
    cursorTooltipCss.includes('clip-path: polygon('),
  'cursor tooltip CSS should draw the Windows keycap as shaped perspective panes'
);
assert.ok(
  /padding:\s*6px 12px 6px 7px/.test(cursorTooltipCss) &&
    /gap:\s*8px/.test(cursorTooltipCss) &&
    /transform:\s*translateY\(-1px\)/.test(cursorTooltipCss),
  'cursor tooltip action tag should have looser spacing and a slightly raised keycap'
);

function createFakeElement(tagName) {
  const children = [];
  const attributes = new Map();
  const classes = new Set();
  const properties = new Map();
  const listeners = new Map();
  return {
    tagName,
    children,
    isConnected: true,
    ownerDocument: null,
    className: '',
    textContent: '',
    classList: {
      add: (...names) => names.forEach((name) => {
        classes.add(name);
      }),
      contains: (name) => classes.has(name)
    },
    style: {
      setProperty: (name, value) => properties.set(name, value),
      getPropertyValue: (name) => properties.get(name) || ''
    },
    appendChild: (child) => {
      children.push(child);
      return child;
    },
    replaceChildren: (...nodes) => {
      children.length = 0;
      nodes.forEach((node) => children.push(node));
    },
    setAttribute: (name, value) => attributes.set(name, String(value)),
    getAttribute: (name) => attributes.get(name) || '',
    removeAttribute: (name) => attributes.delete(name),
    addEventListener: (type, listener) => {
      const current = listeners.get(type) || [];
      current.push(listener);
      listeners.set(type, current);
    },
    dispatchFakeEvent: (type, event) => {
      (listeners.get(type) || []).forEach((listener) => listener(event || {}));
    },
    matches: () => true,
    getBoundingClientRect: () => ({ top: 80, left: 120, right: 152, bottom: 112, width: 32, height: 32 })
  };
}

const fakeDocument = {
  activeElement: null,
  body: null,
  createElement(tagName) {
    const element = createFakeElement(tagName);
    element.ownerDocument = fakeDocument;
    return element;
  },
  querySelectorAll: () => []
};
fakeDocument.body = createFakeElement('body');
fakeDocument.body.ownerDocument = fakeDocument;

function getCursorTagElement() {
  return fakeDocument.body.children.find((child) =>
    child &&
    child.classList &&
    child.classList.contains(cursorTooltip.tagClassName)
  ) || null;
}

function getCursorTagKeyElement(tag) {
  return tag && tag.children
    ? tag.children.find((child) =>
      child &&
      child.classList &&
      child.classList.contains('_x_extension_cursor_tooltip_tag_key_2026_unique_')
    ) || null
    : null;
}

function getCursorTagLabelElement(tag) {
  return tag && tag.children
    ? tag.children.find((child) =>
      child &&
      child.classList &&
      child.classList.contains('_x_extension_cursor_tooltip_tag_label_2026_unique_')
    ) || null
    : null;
}

function getWindowsLogoElement(key) {
  return key && key.children
    ? key.children.find((child) =>
      child &&
      child.classList &&
      child.classList.contains('_x_extension_cursor_tooltip_windows_logo_2026_unique_')
    ) || null
    : null;
}

function hasInlineCursorTag(parent) {
  return Boolean(parent && parent.children && parent.children.some((child) =>
    child &&
    child.classList &&
    child.classList.contains(cursorTooltip.tagClassName)
  ));
}

const fakeWindowListeners = new Map();
const fakeWindow = {
  innerWidth: 320,
  innerHeight: 240,
  requestAnimationFrame: (callback) => callback(),
  setTimeout: (callback) => {
    callback();
    return 1;
  },
  clearTimeout: () => {},
  navigator: {
    platform: 'MacIntel',
    userAgent: 'Macintosh'
  },
  addEventListener: (type, listener) => {
    const current = fakeWindowListeners.get(type) || [];
    current.push(listener);
    fakeWindowListeners.set(type, current);
  },
  dispatchFakeEvent: (type, event) => {
    const nextEvent = Object.assign({ type }, event || {});
    (fakeWindowListeners.get(type) || []).forEach((listener) => listener(nextEvent));
  }
};

const controller = cursorTooltip.createController({
  documentObj: fakeDocument,
  windowObj: fakeWindow,
  id: '_x_extension_test_cursor_tooltip_2026_unique_'
});

const target = createFakeElement('button');
target.ownerDocument = fakeDocument;
assert.strictEqual(
  controller.show(target, 'A very long bookmark title', { clientX: 100, clientY: 120 }, {
    checkActive: false,
    shouldShow: () => false
  }),
  null,
  'cursor tooltip should not render when shouldShow returns false'
);

const element = controller.show(target, 'A very long bookmark title', { clientX: 100, clientY: 120 }, {
  checkActive: false,
  shouldShow: () => true
});
assert.ok(element.classList.contains('_x_extension_tooltip_2026_unique_'), 'cursor tooltip should reuse shared tooltip styling');
assert.strictEqual(element.getAttribute('data-tooltip-kind'), 'cursor', 'cursor tooltip should mark the tooltip kind');
assert.strictEqual(element.getAttribute('data-visible'), 'true', 'cursor show() should mark tooltip visible');
assert.strictEqual(element.style.getPropertyValue('left'), '114px', 'cursor tooltip should offset from pointer x');
assert.strictEqual(element.style.getPropertyValue('top'), '136px', 'cursor tooltip should offset from pointer y');
controller.show(target, 'A very long bookmark title', { clientX: 100, clientY: 120 }, {
  checkActive: false,
  tagText: '后台打开'
});
let tagElement = getCursorTagElement();
assert.strictEqual(
  element.getAttribute('data-cursor-tooltip-tag-visible'),
  'true',
  'cursor tooltip should mark tag visibility when a tag is rendered'
);
assert.ok(tagElement, 'cursor tooltip should render the action tag as a separate bubble');
assert.notStrictEqual(tagElement, element, 'cursor tooltip action tag should not reuse the main tooltip bubble');
assert.strictEqual(
  hasInlineCursorTag(element),
  false,
  'cursor tooltip should not append the action tag inside the main tooltip bubble'
);
assert.strictEqual(
  getCursorTagKeyElement(tagElement).textContent,
  '⌘',
  'cursor tooltip should prefix the action tag with a Mac command keycap'
);
assert.strictEqual(
  getCursorTagLabelElement(tagElement).textContent,
  '后台打开',
  'cursor tooltip should render the requested action text after the keycap'
);
assert.strictEqual(
  tagElement.getAttribute('data-visible'),
  'true',
  'cursor tooltip should show the separate tag bubble when tag text is present'
);
assert.ok(
  Number.parseInt(tagElement.style.getPropertyValue('top'), 10) <
    Number.parseInt(element.style.getPropertyValue('top'), 10),
  'cursor tooltip action tag bubble should sit above the main cursor bubble'
);
controller.move({ clientX: 50, clientY: 60 });
assert.strictEqual(element.style.getPropertyValue('left'), '64px', 'cursor tooltip should follow pointer x movement');
assert.strictEqual(element.style.getPropertyValue('top'), '76px', 'cursor tooltip should follow pointer y movement');
assert.strictEqual(
  tagElement.getAttribute('data-visible'),
  'false',
  'cursor tooltip should hide the separate tag bubble when tag text is not present'
);
controller.hide();
assert.strictEqual(element.getAttribute('data-visible'), 'false', 'cursor hide() should mark tooltip hidden');
assert.strictEqual(tagElement.getAttribute('data-visible'), 'false', 'cursor hide() should hide the separate tag bubble');

target.setAttribute('title', 'Native title');
let shouldShowCalls = 0;
controller.bind(target, () => 'Bound title', {
  checkActive: false,
  shouldShow: () => {
    shouldShowCalls += 1;
    return false;
  }
});
assert.strictEqual(target.getAttribute('title'), '', 'cursor tooltip binding should suppress native title duplication');
target.dispatchFakeEvent('pointerenter', { clientX: 140, clientY: 90 });
assert.strictEqual(shouldShowCalls, 1, 'cursor tooltip binding should consult shouldShow before showing');
assert.strictEqual(element.getAttribute('data-visible'), 'false', 'bound cursor tooltip should stay hidden when shouldShow returns false');

const modifierTarget = createFakeElement('button');
modifierTarget.ownerDocument = fakeDocument;
controller.bind(modifierTarget, () => 'Modifier title', {
  checkActive: false,
  shouldShow: (_target, event) => Boolean(event && event.metaKey),
  getTagText: (event) => event && event.metaKey ? '后台打开' : ''
});
modifierTarget.dispatchFakeEvent('pointerenter', { clientX: 140, clientY: 90, metaKey: true });
assert.strictEqual(
  element.getAttribute('data-visible'),
  'true',
  'bound cursor tooltip should pass pointer modifiers into shouldShow'
);
assert.strictEqual(
  element.getAttribute('data-cursor-tooltip-tag-visible'),
  'true',
  'bound cursor tooltip should render a modifier-driven action tag'
);
assert.strictEqual(
  hasInlineCursorTag(element),
  false,
  'bound cursor tooltip should keep modifier tags outside the main tooltip bubble'
);
modifierTarget.dispatchFakeEvent('pointerleave');

const liveTagTarget = createFakeElement('button');
liveTagTarget.ownerDocument = fakeDocument;
controller.bind(liveTagTarget, () => 'Live modifier title', {
  checkActive: false,
  shouldShow: () => true,
  getTagText: (event) => event && event.metaKey ? '后台打开' : ''
});
liveTagTarget.dispatchFakeEvent('pointerenter', { clientX: 120, clientY: 100 });
assert.strictEqual(
  element.getAttribute('data-cursor-tooltip-tag-visible'),
  'false',
  'bound cursor tooltip should start without a modifier tag'
);
fakeWindow.dispatchFakeEvent('keydown', { key: 'Meta', metaKey: true });
tagElement = getCursorTagElement();
assert.strictEqual(
  element.getAttribute('data-cursor-tooltip-tag-visible'),
  'true',
  'bound cursor tooltip should add the action tag as soon as Command is pressed'
);
assert.strictEqual(
  getCursorTagKeyElement(tagElement).textContent,
  '⌘',
  'bound cursor tooltip should keep the live modifier keycap as Command on Mac'
);
assert.strictEqual(
  getCursorTagLabelElement(tagElement).textContent,
  '后台打开',
  'bound cursor tooltip should refresh the separate tag bubble text from the live modifier state'
);
assert.ok(
  Number.parseInt(tagElement.style.getPropertyValue('top'), 10) <
    Number.parseInt(element.style.getPropertyValue('top'), 10),
  'bound cursor tooltip should keep the live modifier tag above the main cursor bubble'
);
fakeWindow.dispatchFakeEvent('keyup', { key: 'Meta', metaKey: false });
assert.strictEqual(
  element.getAttribute('data-cursor-tooltip-tag-visible'),
  'false',
  'bound cursor tooltip should remove the action tag as soon as Command is released'
);
assert.strictEqual(
  tagElement.getAttribute('data-visible'),
  'false',
  'bound cursor tooltip should hide the separate action tag bubble as soon as Command is released'
);
liveTagTarget.dispatchFakeEvent('pointerleave');

const liveShowTarget = createFakeElement('button');
liveShowTarget.ownerDocument = fakeDocument;
controller.bind(liveShowTarget, () => 'Background-only title', {
  checkActive: false,
  shouldShow: (_target, event) => Boolean(event && event.metaKey),
  getTagText: (event) => event && event.metaKey ? '后台打开' : ''
});
liveShowTarget.dispatchFakeEvent('pointerenter', { clientX: 150, clientY: 110, metaKey: false });
assert.strictEqual(
  element.getAttribute('data-visible'),
  'false',
  'bound cursor tooltip should remain hidden before the modifier condition is satisfied'
);
fakeWindow.dispatchFakeEvent('keydown', { key: 'Meta', metaKey: true });
assert.strictEqual(
  element.getAttribute('data-visible'),
  'true',
  'bound cursor tooltip should appear on an already-hovered target when Command is pressed'
);
assert.strictEqual(
  element.getAttribute('data-cursor-tooltip-tag-visible'),
  'true',
  'bound cursor tooltip should render the background-open tag when it appears from a live modifier'
);
assert.strictEqual(
  getCursorTagElement().getAttribute('data-visible'),
  'true',
  'bound cursor tooltip should show the separate tag bubble when it appears from a live modifier'
);
fakeWindow.dispatchFakeEvent('keyup', { key: 'Meta', metaKey: false });
assert.strictEqual(
  element.getAttribute('data-visible'),
  'false',
  'bound cursor tooltip should hide again when the live modifier no longer satisfies shouldShow'
);
assert.strictEqual(
  getCursorTagElement().getAttribute('data-visible'),
  'false',
  'bound cursor tooltip should hide the separate tag bubble when the main bubble hides'
);

fakeWindow.navigator.platform = 'Win32';
fakeWindow.navigator.userAgent = 'Windows';
controller.show(target, 'A very long bookmark title', { clientX: 100, clientY: 120 }, {
  checkActive: false,
  tagText: '后台打开'
});
assert.strictEqual(
  getCursorTagKeyElement(getCursorTagElement()).textContent,
  '',
  'cursor tooltip should not render the Windows keycap as visible win text'
);
const windowsLogoElement = getWindowsLogoElement(getCursorTagKeyElement(getCursorTagElement()));
assert.ok(
  windowsLogoElement,
  'cursor tooltip should draw a Windows logo inside the keycap on Windows platforms'
);
assert.strictEqual(
  windowsLogoElement.children.length,
  4,
  'cursor tooltip Windows logo should have four panes'
);

const newtabHtml = fs.readFileSync(newtabHtmlPath, 'utf8');
assert.ok(newtabHtml.includes('../shared/cursor-tooltip.css'), 'newtab should load cursor tooltip stylesheet');
assert.ok(newtabHtml.includes('../shared/cursor-tooltip.js'), 'newtab should load cursor tooltip component');
assert.ok(
  newtabHtml.indexOf('../shared/tooltip.js') < newtabHtml.indexOf('../shared/cursor-tooltip.js'),
  'newtab should load shared tooltip before cursor tooltip'
);

console.log('shared cursor tooltip tests passed');
