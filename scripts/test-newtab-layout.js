const assert = require('assert');

require('../src/newtab/layout.js');

const layoutRuntime = globalThis.LumnoNewtabLayout;

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
}

function createFixture() {
  const body = new FakeElement({ display: 'flex' });
  const documentElement = new FakeElement();
  const documentObj = {
    body,
    documentElement
  };
  const windowObj = {
    innerHeight: 900,
    innerWidth: 1280,
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
    rect: { left: 180, top: 200, width: 720, height: 55 },
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
  const bookmarkSection = new FakeElement();
  const recentSection = new FakeElement();
  const sectionSafeCorridor = new FakeElement();
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
      emptySectionsExtraUpshiftPx: 96
    }
  });

  return {
    body,
    bottomDock,
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

console.log('newtab layout tests passed');
