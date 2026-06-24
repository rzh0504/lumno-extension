const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const tooltipJsPath = path.join(repoRoot, 'src/shared/tooltip.js');
const tooltipCssPath = path.join(repoRoot, 'src/shared/tooltip.css');
const newtabHtmlPath = path.join(repoRoot, 'src/newtab/newtab.html');
const optionsHtmlPath = path.join(repoRoot, 'src/options/options.html');
const overlayPanelPath = path.join(repoRoot, 'src/overlay/search-panel.js');
const backgroundPath = path.join(repoRoot, 'src/background/background.js');

assert.ok(fs.existsSync(tooltipJsPath), 'shared tooltip behavior should live in src/shared/tooltip.js');
assert.ok(fs.existsSync(tooltipCssPath), 'shared tooltip styling should live in src/shared/tooltip.css');

const tooltipCss = fs.readFileSync(tooltipCssPath, 'utf8');
const tooltip = require(tooltipJsPath);

assert.strictEqual(
  tooltip.className,
  '_x_extension_tooltip_2026_unique_',
  'shared tooltip should expose a stable tooltip CSS class'
);
assert.strictEqual(
  tooltip.hostClassName,
  '_x_extension_tooltip_host_2026_unique_',
  'shared tooltip should expose a stable tooltip host CSS class'
);
assert.strictEqual(typeof tooltip.createController, 'function', 'shared tooltip should expose createController()');
assert.strictEqual(typeof tooltip.renderText, 'function', 'shared tooltip should expose renderText()');
assert.strictEqual(typeof tooltip.position, 'function', 'shared tooltip should expose position()');

assert.ok(
  tooltipCss.includes('._x_extension_tooltip_2026_unique_'),
  'shared tooltip CSS should style the stable tooltip class'
);
assert.ok(
  tooltipCss.includes('--x-extension-tooltip-bg-top: #ffffff;'),
  'shared tooltip CSS should expose a light gradient top token'
);
assert.ok(
  tooltipCss.includes('--x-extension-tooltip-bg-bottom: #f7f9fc;'),
  'shared tooltip CSS should mirror the feature hint light gradient bottom token'
);
assert.ok(
  tooltipCss.includes('background: linear-gradient('),
  'shared tooltip CSS should use a light gradient surface'
);
assert.ok(
  tooltipCss.includes('color: var(--x-extension-tooltip-text, #556070);'),
  'shared tooltip CSS should default to feature-hint style text for light mode'
);
assert.ok(
  tooltipCss.includes('[data-theme="dark"] ._x_extension_tooltip_2026_unique_'),
  'shared tooltip CSS should still provide a dark theme override'
);
assert.ok(
  tooltipCss.includes('._x_extension_tooltip_divider_2026_unique_'),
  'shared tooltip CSS should own multiline divider styling'
);
assert.match(
  tooltipCss,
  /\._x_extension_tooltip_line_2026_unique_\s*\+\s*\._x_extension_tooltip_line_2026_unique_\s*\{[\s\S]*?margin-top:\s*6px;[\s\S]*?\}/,
  'shared tooltip CSS should add default spacing between multiline text paragraphs'
);

function createFakeElement(tagName) {
  const children = [];
  const attributes = new Map();
  const classes = new Set();
  const properties = new Map();
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
    addEventListener: () => {},
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

const controller = tooltip.createController({
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
  id: '_x_extension_test_tooltip_2026_unique_'
});

const target = createFakeElement('button');
target.ownerDocument = fakeDocument;
fakeDocument.activeElement = target;
controller.show(target, '第一行\n────────\n第二行');

const element = controller.element;
assert.ok(element.classList.contains(tooltip.className), 'controller should create the shared tooltip element');
assert.strictEqual(element.getAttribute('data-visible'), 'true', 'show() should mark tooltip visible');
assert.strictEqual(element.children.length, 3, 'renderText() should preserve multiline tooltip content');
assert.ok(
  element.children[1].classList.contains('_x_extension_tooltip_divider_2026_unique_'),
  'renderText() should convert the divider marker into the shared divider element'
);

controller.hide();
assert.strictEqual(element.getAttribute('data-visible'), 'false', 'hide() should mark tooltip hidden');

const newtabHtml = fs.readFileSync(newtabHtmlPath, 'utf8');
const optionsHtml = fs.readFileSync(optionsHtmlPath, 'utf8');
const overlayPanel = fs.readFileSync(overlayPanelPath, 'utf8');
const background = fs.readFileSync(backgroundPath, 'utf8');

assert.ok(newtabHtml.includes('../shared/tooltip.css'), 'newtab should load the shared tooltip stylesheet');
assert.ok(newtabHtml.includes('../shared/tooltip.js'), 'newtab should load the shared tooltip component');
assert.ok(optionsHtml.includes('../shared/tooltip.css'), 'options should load the shared tooltip stylesheet');
assert.ok(optionsHtml.includes('../shared/tooltip.js'), 'options should load the shared tooltip component');
assert.ok(
  background.includes("'src/shared/tooltip.js'"),
  'overlay injection should load the shared tooltip component before search-panel'
);
assert.ok(
  overlayPanel.includes("overlayRuntime.getRuntimeUrl(chrome, 'src/shared/tooltip.css')"),
  'overlay should resolve the shared tooltip stylesheet URL'
);
assert.ok(
  overlayPanel.includes('LumnoTooltip.createController'),
  'overlay should use the shared tooltip controller'
);

console.log('shared tooltip tests passed');
