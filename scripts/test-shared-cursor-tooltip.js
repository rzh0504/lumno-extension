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

const controller = cursorTooltip.createController({
  documentObj: fakeDocument,
  windowObj: {
    innerWidth: 320,
    innerHeight: 240,
    requestAnimationFrame: (callback) => callback(),
    setTimeout: (callback) => {
      callback();
      return 1;
    },
    clearTimeout: () => {}
  },
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
controller.move({ clientX: 50, clientY: 60 });
assert.strictEqual(element.style.getPropertyValue('left'), '64px', 'cursor tooltip should follow pointer x movement');
assert.strictEqual(element.style.getPropertyValue('top'), '76px', 'cursor tooltip should follow pointer y movement');
controller.hide();
assert.strictEqual(element.getAttribute('data-visible'), 'false', 'cursor hide() should mark tooltip hidden');

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

const newtabHtml = fs.readFileSync(newtabHtmlPath, 'utf8');
assert.ok(newtabHtml.includes('../shared/cursor-tooltip.css'), 'newtab should load cursor tooltip stylesheet');
assert.ok(newtabHtml.includes('../shared/cursor-tooltip.js'), 'newtab should load cursor tooltip component');
assert.ok(
  newtabHtml.indexOf('../shared/tooltip.js') < newtabHtml.indexOf('../shared/cursor-tooltip.js'),
  'newtab should load shared tooltip before cursor tooltip'
);

console.log('shared cursor tooltip tests passed');
