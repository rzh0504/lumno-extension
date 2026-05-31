const assert = require('assert');
const faviconTheme = require('../src/newtab/favicon-theme.js');

require('../src/shared/suggestion-action-model.js');
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

async function testGoogleFallbackFaviconUsesFallbackTheme() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();
  const urlHighlightTheme = faviconTheme.createUrlHighlightTheme();
  const googleFallbackFavicon = 'https://www.google.com/s2/favicons?domain=dyjs.cuc.edu.cn&sz=128';
  let requestedTheme = false;

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
    getThemeForSuggestion: (suggestion) => {
      requestedTheme = true;
      assert.strictEqual(suggestion.favicon, googleFallbackFavicon);
      return Promise.resolve(defaultTheme);
    },
    shouldUseUrlFallbackThemeForSuggestion: (suggestion, theme) =>
      Boolean(theme && theme._xIsDefault && suggestion && suggestion.favicon === googleFallbackFavicon),
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
    query: '研究生',
    primaryHighlightIndex: 0,
    primaryHighlightReason: 'topSite',
    suggestions: [{
      type: 'topSite',
      title: '研究生应用管理平台',
      url: 'https://dyjs.cuc.edu.cn/gsapp/sys/emaphome/portal/',
      isTopSite: true,
      favicon: googleFallbackFavicon
    }]
  });
  view.updateSelection(-1);
  await Promise.resolve();

  const item = view.getItems()[0];
  assert.ok(requestedTheme, 'remote URL suggestion should resolve its theme');
  assert.ok(item, 'remote URL suggestion should render');
  assert.strictEqual(
    item._xTheme,
    urlHighlightTheme,
    'Google fallback favicon suggestions should use the URL fallback highlight theme'
  );
  assert.strictEqual(
    item.style.getPropertyValue('--x-nt-suggestion-active-bg'),
    urlHighlightTheme.highlightBg,
    'Google fallback active row should use the fallback theme highlight background'
  );
}

async function testVisitButtonAndEnterTagShareOverlayVisibilityRules() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();

  const view = suggestionsView.createSuggestionsView({
    document,
    container,
    items,
    t: (key, fallback) => fallback || key,
    formatMessage: (key, fallback, params) => String(fallback || key).replace('{name}', params && params.name ? params.name : ''),
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
    actionModel: globalThis.LumnoSuggestionActionModel,
    defaultTheme
  });

  view.render({
    query: 'lumno',
    primaryHighlightIndex: 0,
    primaryHighlightReason: 'topSite',
    suggestions: [{
      type: 'topSite',
      title: 'Lumno',
      url: 'https://lumno.example/',
      isTopSite: true,
      favicon: ''
    }, {
      type: 'history',
      title: 'Lumno docs',
      url: 'https://docs.example/lumno',
      favicon: ''
    }]
  });
  view.updateSelection(-1);

  const [primaryItem, secondaryItem] = view.getItems();
  assert.ok(primaryItem._xVisitButton, 'primary suggestion should render a visit button');
  assert.ok(primaryItem._xTagContainer, 'primary suggestion should render an action tag container');
  assert.strictEqual(
    primaryItem._xTagContainer.getAttribute('data-visible'),
    'true',
    'primary top-site suggestion should show its Enter action tag'
  );
  assert.strictEqual(
    primaryItem._xVisitButton.getAttribute('data-visible'),
    'false',
    'primary suggestion should hide the visit button while the Enter tag is visible'
  );
  assert.ok(secondaryItem._xVisitButton, 'secondary suggestion should render a visit button');
  assert.strictEqual(
    secondaryItem._xVisitButton.getAttribute('data-visible'),
    'true',
    'non-active suggestions should keep the right-side visit button visible'
  );
}

async function testAiProviderVisitButtonUsesWebAppLabel() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();

  const view = suggestionsView.createSuggestionsView({
    document,
    container,
    items,
    t: (key, fallback) => fallback || key,
    formatMessage: (key, fallback, params) => String(fallback || key).replace(/\{(\w+)\}/g, (match, name) => {
      return params && Object.prototype.hasOwnProperty.call(params, name) ? params[name] : match;
    }),
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
    getSearchActionLabel: () => '在 Google 中搜索',
    getSiteSearchDisplayName: (provider) => provider && provider.name ? provider.name : '',
    isAiSiteSearchProvider: (provider) => Boolean(provider && provider.action === 'openAndSubmit'),
    actionModel: globalThis.LumnoSuggestionActionModel,
    defaultTheme
  });

  view.render({
    query: '阿萨德',
    primaryHighlightIndex: 0,
    primaryHighlightReason: 'none',
    suggestions: [{
      type: 'siteSearch',
      title: '向 豆包 提问 "阿萨德"',
      url: 'https://www.doubao.com/chat/',
      favicon: '',
      provider: {
        key: 'dbai',
        name: '豆包',
        action: 'openAndSubmit',
        submitStrategy: 'doubaoPrompt'
      },
      searchQuery: '阿萨德'
    }]
  });

  const item = view.getItems()[0];
  assert.ok(item && item._xVisitButton, 'AI provider suggestion should render a visit button');
  assert.strictEqual(
    item._xVisitButton.textContent,
    '打开 豆包 网页版',
    'AI provider visit button should use the provider web app label instead of default search engine'
  );
}

async function testOpenNewTabVisitButtonReflectsCurrentTabModifier() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();

  const view = suggestionsView.createSuggestionsView({
    document,
    container,
    items,
    t: (key, fallback) => fallback || key,
    formatMessage: (key, fallback, params) => String(fallback || key).replace('{name}', params && params.name ? params.name : ''),
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
    actionModel: globalThis.LumnoSuggestionActionModel,
    defaultTheme
  });

  view.render({
    query: 'lumno',
    primaryHighlightIndex: -1,
    primaryHighlightReason: 'none',
    suggestions: [{
      type: 'history',
      title: 'Lumno docs',
      url: 'https://docs.example/lumno',
      favicon: ''
    }]
  });

  const item = view.getItems()[0];
  assert.ok(item && item._xVisitButton, 'history suggestion should render a visit button');
  assert.strictEqual(
    item._xVisitButton.textContent,
    '新开',
    'default open-new-tab result should show the new-tab action label'
  );

  view.setOpenInCurrentTabModifierActive(true);
  assert.strictEqual(
    item._xVisitButton.textContent,
    '前往',
    'Alt/Option state should change open-new-tab visit button copy to current-tab navigation'
  );

  view.setOpenInCurrentTabModifierActive(false);
  assert.strictEqual(
    item._xVisitButton.textContent,
    '新开',
    'releasing Alt/Option should restore the new-tab action label'
  );
}

testLocalUrlSuggestionUsesFallbackTheme()
  .then(testGoogleFallbackFaviconUsesFallbackTheme)
  .then(testVisitButtonAndEnterTagShareOverlayVisibilityRules)
  .then(testAiProviderVisitButtonUsesWebAppLabel)
  .then(testOpenNewTabVisitButtonReflectsCurrentTabModifier)
  .then(() => {
    console.log('newtab suggestions view tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
