const assert = require('assert');
const faviconTheme = require('../src/newtab/favicon-theme.js');

require('../src/newtab/suggestions-view.js');
const suggestionsView = globalThis.LumnoNewtabSuggestionsView;

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

class FakeElement {
  constructor(tagName) {
    this.tagName = String(tagName || '').toUpperCase();
    this.childNodes = [];
    this.children = this.childNodes;
    this.attributes = new Map();
    this.style = new FakeStyle();
    this.parentNode = null;
    this.isConnected = false;
    this.className = '';
    this.eventListeners = new Map();
    this._textContent = '';
    this._innerHTML = '';
  }

  appendChild(child) {
    this.childNodes.push(child);
    child.parentNode = this;
    child.setConnected(this.isConnected);
    return child;
  }

  replaceChild(nextChild, previousChild) {
    const index = this.childNodes.indexOf(previousChild);
    if (index >= 0) {
      this.childNodes[index] = nextChild;
      previousChild.parentNode = null;
      previousChild.setConnected(false);
      nextChild.parentNode = this;
      nextChild.setConnected(this.isConnected);
    }
    return previousChild;
  }

  setConnected(value) {
    this.isConnected = Boolean(value);
    this.childNodes.forEach((child) => {
      if (child && typeof child.setConnected === 'function') {
        child.setConnected(this.isConnected);
      }
    });
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  addEventListener(name, handler) {
    if (!this.eventListeners.has(name)) {
      this.eventListeners.set(name, []);
    }
    this.eventListeners.get(name).push(handler);
  }

  set textContent(value) {
    this._textContent = String(value || '');
    this.childNodes.length = 0;
  }

  get textContent() {
    if (this.childNodes.length > 0) {
      return this.childNodes.map((child) => child.textContent || '').join('');
    }
    return this._textContent;
  }

  set innerHTML(value) {
    this._innerHTML = String(value || '');
    this.childNodes.length = 0;
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

class FakeTextNode extends FakeElement {
  constructor(text) {
    super('#text');
    this._textContent = String(text || '');
  }

  set textContent(value) {
    this._textContent = String(value || '');
  }

  get textContent() {
    return this._textContent;
  }
}

function createFakeDocument() {
  return {
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    createTextNode(text) {
      return new FakeTextNode(text);
    }
  };
}

function getHostFromUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (e) {
    return '';
  }
}

function shouldBlockFaviconForHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
}

function applyThemeVariables(target, theme, defaultTheme) {
  const resolvedTheme = faviconTheme.getThemeForMode(theme, {
    defaultTheme,
    isDarkMode: () => false
  });
  if (!resolvedTheme || !resolvedTheme._xIsBrand) {
    target.style.setProperty('--x-nt-suggestion-active-bg', 'var(--x-nt-hover-bg, #F3F4F6)');
    target.style.setProperty('--x-nt-suggestion-active-border', 'transparent');
    return;
  }
  target.style.setProperty('--x-nt-suggestion-active-bg', resolvedTheme.highlightBg);
  target.style.setProperty('--x-nt-suggestion-active-border', resolvedTheme.highlightBorder);
}

async function testLocalUrlSuggestionUsesFallbackTheme() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();
  const urlHighlightTheme = faviconTheme.createUrlHighlightTheme();

  const view = suggestionsView.createSuggestionsView({
    document,
    container,
    items,
    t: (key, fallback) => fallback || key,
    getRiSvg: () => '',
    sanitizeDisplayText: (value) => String(value || ''),
    getHostFromUrl,
    getThemeHostForSuggestion: (suggestion) => getHostFromUrl(suggestion && suggestion.url),
    shouldBlockFaviconForHost,
    getImmediateThemeForSuggestion: () => defaultTheme,
    getThemeForSuggestion: () => Promise.resolve(defaultTheme),
    getThemeForMode: (theme) => faviconTheme.getThemeForMode(theme, {
      defaultTheme,
      isDarkMode: () => false
    }),
    getHoverColors: (theme) => faviconTheme.getHoverColors(theme, {
      defaultTheme,
      isDarkMode: () => false
    }),
    applyThemeVariables: (target, theme) => applyThemeVariables(target, theme, defaultTheme),
    applyMarkVariables: () => {},
    defaultTheme,
    urlHighlightTheme
  });

  view.render({
    query: '127.0.0.1',
    primaryHighlightIndex: 0,
    primaryHighlightReason: 'topSite',
    suggestions: [{
      type: 'topSite',
      title: 'Lumno',
      url: 'http://127.0.0.1:4321/',
      isTopSite: true,
      favicon: ''
    }]
  });
  view.updateSelection(-1);
  await Promise.resolve();

  const item = view.getItems()[0];
  assert.ok(item, 'local URL suggestion should render');
  assert.strictEqual(
    item._xTheme,
    urlHighlightTheme,
    'local URL suggestions should use the URL fallback highlight theme'
  );
  assert.strictEqual(
    item.style.getPropertyValue('--x-nt-suggestion-active-bg'),
    urlHighlightTheme.highlightBg,
    'local URL active row should use the fallback theme highlight background'
  );
}

testLocalUrlSuggestionUsesFallbackTheme()
  .then(() => {
    console.log('newtab suggestions view tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
