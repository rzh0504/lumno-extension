const assert = require('assert');
const fs = require('fs');
const path = require('path');

require('../src/newtab/layout.js');
require('../src/newtab/dock.js');

const layoutRuntime = globalThis.LumnoNewtabLayout;
const dockRuntime = globalThis.LumnoNewtabDock;
const repoRoot = path.resolve(__dirname, '..');
const newtabHtml = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.html'), 'utf8');

class FakeStyle {
  constructor() {
    this.props = new Map();
  }

  setProperty(name, value) {
    this.props.set(name, String(value));
  }

  getPropertyValue(name) {
    return this.props.get(name) || '';
  }

  removeProperty(name) {
    this.props.delete(name);
  }
}

class FakeClassList {
  constructor() {
    this.names = new Set();
  }

  add(...names) {
    names.forEach((name) => this.names.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.names.delete(name));
  }

  toggle(name, enabled) {
    if (enabled) {
      this.names.add(name);
    } else {
      this.names.delete(name);
    }
  }

  contains(name) {
    return this.names.has(name);
  }
}

class FakeElement {
  constructor(options) {
    const config = options || {};
    this.style = new FakeStyle();
    this.classList = new FakeClassList();
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this.id = '';
    this.className = '';
    this.rect = {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      bottom: 0,
      ...(config.rect || {})
    };
    this.scrollHeight = Number(config.scrollHeight) || this.rect.height || 0;
    this.computed = {
      display: config.display || 'block',
      'padding-top': config.paddingTop || '0px',
      'padding-bottom': config.paddingBottom || '0px',
      'border-top-width': config.borderTop || '0px',
      'border-bottom-width': config.borderBottom || '0px',
      'margin-top': config.marginTop || '0px',
      'margin-bottom': config.marginBottom || '0px',
      'min-height': config.minHeight || '0px',
      ...(config.computed || {})
    };
    this.computedStyle = {
      get display() {
        return config.display || 'block';
      },
      getPropertyValue: (name) => this.computed[name] || ''
    };
  }

  getBoundingClientRect() {
    const rect = {
      ...this.rect
    };
    rect.bottom = Number.isFinite(rect.bottom) && rect.bottom !== 0
      ? rect.bottom
      : (Number(rect.top) || 0) + (Number(rect.height) || 0);
    return rect;
  }

  setRect(rect) {
    this.rect = {
      ...this.rect,
      ...(rect || {})
    };
    if (Object.prototype.hasOwnProperty.call(rect || {}, 'height')) {
      this.scrollHeight = Number(rect.height) || 0;
    }
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  appendChild(child) {
    if (!child) {
      return child;
    }
    if (child.parentNode && Array.isArray(child.parentNode.children)) {
      child.parentNode.children = child.parentNode.children.filter((item) => item !== child);
    }
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  addEventListener(type, listener, options) {
    this._listeners = this._listeners || [];
    this._listeners.push({ type, listener, options });
  }
}

function createFixture(options) {
  const config = options || {};
  const body = new FakeElement({ display: 'flex' });
  const documentElement = new FakeElement();
  const documentObj = {
    body,
    documentElement
  };
  const windowObj = {
    innerHeight: Number(config.innerHeight) || 900,
    innerWidth: Number(config.innerWidth) || 1280,
    visualViewport: null,
    getComputedStyle(element) {
      return element.computedStyle;
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    }
  };

  const root = new FakeElement({
    rect: { left: 180, top: 200, width: 720, height: 55, ...(config.rootRect || {}) },
    paddingTop: '4px',
    paddingBottom: '4px',
    borderTop: '1px',
    borderBottom: '1px',
    minHeight: '55px'
  });
  const searchLayer = new FakeElement({
    rect: { left: 180, top: 200, width: 720, height: 45 },
    borderTop: '1px',
    borderBottom: '1px',
    minHeight: '45px'
  });
  const inputContainer = new FakeElement({
    rect: { left: 184, top: 204, width: 712, height: 45 }
  });
  const wordmark = new FakeElement({
    rect: { left: 180, top: 98, width: 720, height: 74 },
    marginBottom: '28px',
    scrollHeight: 74
  });
  wordmark.setAttribute('data-visible', 'true');

  const bottomDock = new FakeElement({
    rect: { left: 80, top: 680, width: 920, height: 220 }
  });
  const shortcutSection = new FakeElement({
    rect: { left: 420, top: 270, width: 240, height: 72, ...(config.shortcutRect || {}) }
  });
  const bookmarkSection = new FakeElement();
  const recentSection = new FakeElement();
  const sectionSafeCorridor = new FakeElement();
  shortcutSection.setAttribute('data-visible', config.shortcutVisible ? 'true' : 'false');
  bookmarkSection.setAttribute('data-visible', 'true');
  recentSection.setAttribute('data-visible', 'true');

  const suggestionsContainer = new FakeElement({
    rect: { left: 180, top: 255, width: 720, height: 0 }
  });
  const suggestionsSurface = new FakeElement();
  const suggestionsOutline = new FakeElement();

  const controller = layoutRuntime.createLayoutController({
    documentObj,
    windowObj,
    root,
    searchLayer,
    inputParts: { container: inputContainer },
    wordmarkContainer: wordmark,
    shortcutSection,
    bottomDock,
    bookmarkSection,
    recentSection,
    sectionSafeCorridor,
    suggestionsContainer,
    suggestionsSurface,
    suggestionsOutline,
    constants: {
      minTopPx: 28,
      minBottomPx: 20,
      upshiftRatio: 0.06,
      upshiftMinPx: 24,
      upshiftMaxPx: 80,
      contentSectionsExtraUpshiftPx: 20,
      emptySectionsExtraUpshiftPx: 96,
      ...(config.constants || {})
    }
  });

  return {
    body,
    bottomDock,
    shortcutSection,
    controller
  };
}

function testPreservesSearchTopDuringRestoreLayoutPass() {
  const { body, bottomDock, controller } = createFixture();

  controller.updateBottomDockLayout();
  const initialTop = body.style.getPropertyValue('padding-top');
  assert.ok(initialTop.endsWith('px'), 'initial layout should set a pixel top');

  bottomDock.setRect({ height: 260 });
  controller.updateBottomDockLayout({ preserveSearchEntryLayout: true });

  assert.strictEqual(
    body.style.getPropertyValue('padding-top'),
    initialTop,
    'restore-time section refreshes should not move the logo/search entry'
  );
}

testPreservesSearchTopDuringRestoreLayoutPass();

function testDockRuntimeOwnsBottomDockComponentParts() {
  assert.ok(
    dockRuntime && typeof dockRuntime.createBottomDockRuntime === 'function',
    'newtab dock runtime should expose a component factory'
  );

  const body = new FakeElement();
  const documentObj = {
    body,
    createElement() {
      return new FakeElement();
    }
  };
  const windowObj = {
    getComputedStyle(element) {
      return element.computedStyle;
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    }
  };
  const bookmarkSection = new FakeElement();
  const recentSection = new FakeElement();
  const shortcutSection = new FakeElement();
  let layoutOptions = null;
  const fakeLayoutRuntime = {
    createLayoutController(options) {
      layoutOptions = options;
      return {
        updateBottomDockLayout() {}
      };
    }
  };

  const runtime = dockRuntime.createBottomDockRuntime({
    documentObj,
    windowObj,
    layoutRuntime: fakeLayoutRuntime,
    root: new FakeElement(),
    searchLayer: new FakeElement(),
    inputParts: { container: new FakeElement() },
    wordmarkContainer: new FakeElement(),
    shortcutSection: () => shortcutSection,
    bookmarkSection,
    recentSection,
    suggestionsContainer: new FakeElement(),
    suggestionsSurface: new FakeElement(),
    suggestionsOutline: new FakeElement(),
    constants: {
      compactDockShortcutGapPx: 11
    }
  });

  assert.strictEqual(
    runtime.element.id,
    '_x_extension_newtab_bottom_dock_2024_unique_',
    'dock runtime should create the bottom dock root element'
  );
  assert.strictEqual(
    runtime.scroller.id,
    '_x_extension_newtab_bottom_dock_scroller_2024_unique_',
    'dock runtime should create the dock scroller'
  );
  assert.strictEqual(
    runtime.sectionSafeCorridor.id,
    '_x_extension_newtab_section_safe_corridor_2026_unique_',
    'dock runtime should create the section safe corridor'
  );
  assert.strictEqual(layoutOptions.bottomDock, runtime.element, 'layout should receive the dock element from the component');
  assert.strictEqual(layoutOptions.sectionSafeCorridor, runtime.sectionSafeCorridor, 'layout should receive the component safe corridor');
  assert.strictEqual(layoutOptions.shortcutSection(), shortcutSection, 'layout should receive the shortcut section accessor');
  assert.strictEqual(layoutOptions.constants.compactDockShortcutGapPx, 11, 'component should pass dock layout constants through');

  runtime.mount(body);

  assert.deepStrictEqual(
    runtime.scroller.children,
    [bookmarkSection, runtime.sectionSafeCorridor, recentSection],
    'dock runtime should own the bottom dock section order'
  );
  assert.strictEqual(runtime.element.children[0], runtime.scroller, 'dock root should contain the scroller');
  assert.strictEqual(body.children[0], runtime.element, 'dock runtime should mount the dock root into the body');
}

testDockRuntimeOwnsBottomDockComponentParts();

function testNewtabLoadsAndUsesDockRuntime() {
  const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
  assert.ok(
    newtabHtml.indexOf('<script src="layout.js"></script>') <
      newtabHtml.indexOf('<script src="dock.js"></script>'),
    'newtab should load the dock runtime after the layout runtime'
  );
  assert.ok(
    newtabHtml.indexOf('<script src="dock.js"></script>') <
      newtabHtml.indexOf('<script src="newtab.js"></script>'),
    'newtab should load the dock runtime before the app entry'
  );
  assert.match(
    newtabJs,
    /const bottomDockRuntime = NEWTAB_DOCK\.createBottomDockRuntime\(/,
    'newtab should create the bottom dock through the dock component runtime'
  );
  assert.doesNotMatch(
    newtabJs,
    /document\.createElement\('div'\);\s*bottomDock\.id = '_x_extension_newtab_bottom_dock_2024_unique_'/,
    'newtab should not manually construct bottom dock DOM outside the component runtime'
  );
}

testNewtabLoadsAndUsesDockRuntime();

function testCompactDockKeepsSearchEntryClearOnShortViewports() {
  const { bottomDock, controller } = createFixture({
    innerHeight: 620,
    rootRect: { top: 200, height: 55 },
    constants: {
      bottomDockTopReservePx: 240,
      compactDockViewportMaxHeightPx: 800,
      compactDockSearchGapPx: 30,
      compactDockMinTopReservePx: 168
    }
  });

  controller.updateBottomDockLayout();

  assert.strictEqual(
    bottomDock.style.getPropertyValue('max-height'),
    '335px',
    'short viewports should reserve space below the search entry instead of using the fixed 240px dock reserve'
  );
  assert.strictEqual(
    bottomDock.getAttribute('data-density'),
    'compact',
    'short viewports with limited dock space should mark the dock compact'
  );
}

function testTinyDockDensityForVeryShortViewports() {
  const { body, bottomDock, controller } = createFixture({
    innerHeight: 460,
    rootRect: { top: 190, height: 55 },
    constants: {
      bottomDockTopReservePx: 240,
      compactDockViewportMaxHeightPx: 800,
      compactDockSearchGapPx: 30,
      compactDockMinTopReservePx: 168
    }
  });

  controller.updateBottomDockLayout();

  assert.strictEqual(bottomDock.getAttribute('data-density'), 'tiny', 'very short viewports should use the tiny dock density');
  assert.strictEqual(
    body.getAttribute('data-nt-bottom-dock-density'),
    'tiny',
    'body should expose bottom dock density for CSS and future UI affordances'
  );
}

function testShortDockReservesVisibleShortcutRow() {
  const { bottomDock, controller } = createFixture({
    innerHeight: 520,
    rootRect: { top: 93, height: 56 },
    shortcutRect: { top: 161, height: 72 },
    shortcutVisible: true,
    constants: {
      bottomDockTopReservePx: 240,
      compactDockViewportMaxHeightPx: 800,
      compactDockSearchGapPx: 30,
      compactDockShortcutGapPx: 8,
      compactDockMinTopReservePx: 168
    }
  });

  controller.updateBottomDockLayout();

  assert.strictEqual(
    bottomDock.style.getPropertyValue('max-height'),
    '279px',
    'short viewports should reserve room for the visible shortcut row before the bottom dock'
  );
  assert.strictEqual(
    bottomDock.getAttribute('data-density'),
    'compact',
    'reserving shortcut space should still drive dock density from the remaining height'
  );
}

function testBottomDockCssDefinesAdaptiveDensityVariables() {
  assert.match(
    newtabHtml,
    /#_x_extension_newtab_bottom_dock_2024_unique_\s*\{[\s\S]*?--x-nt-dock-bookmark-card-height:\s*51px;[\s\S]*?--x-nt-dock-recent-inner-height:\s*104px;/,
    'bottom dock should define default adaptive sizing tokens'
  );
  assert.match(
    newtabHtml,
    /#_x_extension_newtab_bottom_dock_2024_unique_\[data-density="compact"\]\s*\{[\s\S]*?--x-nt-dock-bookmark-card-height:\s*44px;[\s\S]*?--x-nt-dock-recent-inner-height:\s*86px;/,
    'compact bottom dock density should reduce recent and bookmark card heights'
  );
  assert.match(
    newtabHtml,
    /#_x_extension_newtab_bottom_dock_2024_unique_\[data-density="tiny"\]\s*\{[\s\S]*?--x-nt-dock-bookmark-card-height:\s*40px;[\s\S]*?--x-nt-dock-recent-inner-height:\s*72px;/,
    'tiny bottom dock density should aggressively reduce card heights'
  );
  assert.match(
    newtabHtml,
    /\.x-nt-bookmark-card\s*\{[\s\S]*?height:\s*var\(--x-nt-dock-bookmark-card-height,\s*51px\);[\s\S]*?padding:\s*var\(--x-nt-dock-bookmark-card-padding,\s*13px 15px\);/,
    'bookmark cards should consume adaptive dock sizing tokens'
  );
  assert.match(
    newtabHtml,
    /\.x-nt-recent-inner\s*\{[\s\S]*?padding:\s*var\(--x-nt-dock-recent-inner-padding,\s*13px 13px 14px 15px\);[\s\S]*?height:\s*var\(--x-nt-dock-recent-inner-height,\s*104px\);/,
    'recent cards should consume adaptive dock sizing tokens'
  );
  assert.match(
    newtabHtml,
    /body\[data-nt-bottom-dock-density="compact"\]\s*\{[\s\S]*?--x-nt-shortcuts-reserved-height:\s*54px;[\s\S]*?--x-nt-shortcut-icon-size:\s*36px;/,
    'compact dock density should also reduce the shortcut dock footprint'
  );
  assert.match(
    newtabHtml,
    /body\[data-nt-bottom-dock-density="tiny"\]\s*\{[\s\S]*?--x-nt-shortcuts-reserved-height:\s*42px;[\s\S]*?--x-nt-shortcut-icon-size:\s*28px;/,
    'tiny dock density should aggressively reduce shortcut dock footprint'
  );
  assert.match(
    newtabHtml,
    /@media \(max-width:\s*520px\)[\s\S]*?#_x_extension_newtab_bookmarks_2024_unique_,\s*#_x_extension_newtab_recent_sites_2024_unique_\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?width:\s*min\(96vw, var\(--x-nt-content-max-width,\s*1040px\)\);/,
    'phone viewports should not force 500px content sections that create horizontal scrolling'
  );
  assert.match(
    newtabHtml,
    /@media \(max-width:\s*520px\)[\s\S]*?#_x_extension_newtab_bookmarks_grid_2024_unique_,\s*#_x_extension_newtab_recent_sites_grid_2024_unique_\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    'phone viewports should collapse bookmarks and recent-site grids to one column'
  );
}

testCompactDockKeepsSearchEntryClearOnShortViewports();
testTinyDockDensityForVeryShortViewports();
testShortDockReservesVisibleShortcutRow();
testBottomDockCssDefinesAdaptiveDensityVariables();

function testWideRecentGridCanReachMaximumColumns() {
  assert.strictEqual(
    layoutRuntime.getGridContentWidthForColumns(6, 248, 12),
    1548,
    'six recent cards plus five gaps should define the wide content max width'
  );

  assert.strictEqual(
    layoutRuntime.getAdaptiveGridColumnCount({
      viewportWidth: 1920,
      compactBreakpointPx: 860,
      compactColumns: 2,
      contentMaxWidth: 1548,
      targetColumnWidth: 248,
      gap: 12,
      minColumns: 4,
      maxColumns: 6
    }),
    6,
    'wide desktop viewports should render the maximum recent-site columns'
  );

  assert.strictEqual(
    layoutRuntime.getAdaptiveGridColumnCount({
      viewportWidth: 1280,
      compactBreakpointPx: 860,
      compactColumns: 2,
      contentMaxWidth: 1548,
      targetColumnWidth: 248,
      gap: 12,
      minColumns: 4,
      maxColumns: 6
    }),
    4,
    'medium desktop viewports should keep recent-site rows compact'
  );
}

function testNewtabWideModeUsesRecentGridMaximumWidth() {
  const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
  assert.match(
    newtabJs,
    /contentMaxWidth:\s*RECENT_WIDE_CONTENT_MAX_WIDTH_PX[\s\S]*?recentMaxColumns:\s*RECENT_WIDE_MAX_COLUMNS/,
    'newtab wide mode should size content from the maximum recent grid width'
  );
}

testWideRecentGridCanReachMaximumColumns();
testNewtabWideModeUsesRecentGridMaximumWidth();

console.log('newtab layout tests passed');
