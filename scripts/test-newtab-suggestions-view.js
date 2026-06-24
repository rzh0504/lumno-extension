const assert = require('assert');
const fs = require('fs');
const path = require('path');
const faviconTheme = require('../src/newtab/favicon-theme.js');

require('../src/shared/suggestion-action-model.js');
require('../src/newtab/suggestions-view.js');
const suggestionsView = globalThis.LumnoNewtabSuggestionsView;
const repoRoot = path.resolve(__dirname, '..');

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

function triggerEvent(element, name, event) {
  const handlers = element && element.eventListeners ? element.eventListeners.get(name) : null;
  if (!handlers) {
    return;
  }
  handlers.forEach((handler) => handler.call(element, event || {}));
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
  return host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.endsWith('.local');
}

function isLocalNetworkHost(hostname) {
  return shouldBlockFaviconForHost(hostname);
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

function testSiteSearchProviderIconsUsePageFaviconCandidates() {
  const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
  const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
  assert.ok(
    /function getProviderIcon\(provider\)[\s\S]*getPageFaviconCandidateUrl\(providerIconPageUrl\)/.test(newtabJs),
    'newtab site-search provider icons should convert proxy icon URLs into page favicon candidates'
  );
  assert.ok(
    /function getProviderFaviconPageUrl\(provider\)[\s\S]*return `\$\{parsed\.origin\}\/`;/.test(newtabJs),
    'newtab site-search provider icons should use the provider origin instead of a synthetic search query'
  );
  assert.ok(
    /function getProviderIcon\(provider\)[\s\S]*getPageFaviconCandidateUrl\(providerIconPageUrl\)/.test(overlayJs),
    'overlay site-search provider icons should convert proxy icon URLs into page favicon candidates'
  );
  assert.ok(
    /function getProviderFaviconPageUrl\(provider\)[\s\S]*return `\$\{parsed\.origin\}\/`;/.test(overlayJs),
    'overlay site-search provider icons should use the provider origin instead of a synthetic search query'
  );
}

function testSiteSearchTabHintRequiresExplicitTrigger() {
  const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
  const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
  assert.ok(
    /const resolvedProvider = siteSearchTrigger;/.test(newtabJs),
    'newtab Tab site-search hint should be driven only by explicit provider triggers'
  );
  assert.ok(
    /const resolvedProvider = siteSearchTrigger;/.test(overlayJs),
    'overlay Tab site-search hint should be driven only by explicit provider triggers'
  );
  assert.ok(
    !/const resolvedProvider = mergedProvider \|\| siteSearchTrigger;/.test(newtabJs),
    'newtab should not infer the Tab site-search hint from the highlighted result provider'
  );
  assert.ok(
    !/const resolvedProvider = mergedProvider \|\| siteSearchTrigger;/.test(overlayJs),
    'overlay should not infer the Tab site-search hint from the highlighted result provider'
  );
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
    shouldBlockFaviconForHost: () => false,
    isLocalNetworkHost,
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

async function testDirectUrlSuggestionUsesFaviconWhenAvailable() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();
  const attached = [];

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
    shouldBlockFaviconForHost: () => false,
    isLocalNetworkHost,
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
    getChromeFaviconUrl: (url) => `chrome://favicon2/?pageUrl=${encodeURIComponent(url)}&size=128`,
    attachFaviconWithFallbacks: (img, url, host, options) => {
      attached.push({
        img,
        url,
        host,
        primaryUrl: options && options.primaryUrl,
        browserUrl: options && options.browserUrl
      });
    },
    defaultTheme
  });

  view.render({
    query: '192.168.1.8',
    primaryHighlightIndex: 0,
    primaryHighlightReason: 'navigation',
    suggestions: [{
      type: 'directUrl',
      title: '打开 http://192.168.1.8/',
      url: 'http://192.168.1.8/',
      favicon: 'chrome-extension://abc/_favicon/?pageUrl=http%3A%2F%2F192.168.1.8%2F&size=128'
    }]
  });

  const item = view.getItems()[0];
  assert.ok(item, 'direct URL suggestion should render');
  assert.strictEqual(item._xIconIsFavicon, true, 'direct URL suggestion with favicon should render an image icon');
  assert.strictEqual(attached.length, 1, 'direct URL favicon should be attached through the fallback chain');
  assert.strictEqual(attached[0].url, 'http://192.168.1.8/');
  assert.strictEqual(attached[0].host, '192.168.1.8');
  assert.strictEqual(
    attached[0].primaryUrl,
    'chrome-extension://abc/_favicon/?pageUrl=http%3A%2F%2F192.168.1.8%2F&size=128'
  );
  assert.strictEqual(
    attached[0].browserUrl,
    'chrome://favicon2/?pageUrl=http%3A%2F%2F192.168.1.8%2F&size=128'
  );
}

async function testAppendRenderKeepsOnlyFinalSuggestionMarkedLast() {
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
    getRiSvg: () => '',
    sanitizeDisplayText: (value) => String(value || ''),
    getHostFromUrl,
    getThemeHostForSuggestion: (suggestion) => getHostFromUrl(suggestion && suggestion.url),
    shouldBlockFaviconForHost: () => false,
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
    defaultTheme
  });

  const suggestions = Array.from({ length: 7 }, (_, index) => ({
    type: 'history',
    title: `Result ${index + 1}`,
    url: `https://example.com/${index + 1}`,
    favicon: ''
  }));

  view.render({
    query: 'result',
    primaryHighlightIndex: 0,
    primaryHighlightReason: 'default',
    suggestions: suggestions.slice(0, 6)
  });

  assert.strictEqual(view.getItems()[5].getAttribute('data-last'), 'true');

  view.render({
    query: 'result',
    canAppend: true,
    startIndex: 6,
    primaryHighlightIndex: 0,
    primaryHighlightReason: 'default',
    suggestions
  });

  assert.strictEqual(view.getItems().length, 7, 'append render should create the seventh suggestion');
  assert.strictEqual(
    view.getItems()[5].getAttribute('data-last'),
    'false',
    'append render should clear data-last from the previous final suggestion'
  );
  assert.strictEqual(
    view.getItems()[6].getAttribute('data-last'),
    'true',
    'append render should mark only the true final suggestion as last'
  );
}

async function testBrowserNewtabSuggestionUsesFallbackIconWhenFaviconMissing() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();
  const attached = [];
  const fallbackImages = [];

  const view = suggestionsView.createSuggestionsView({
    document,
    container,
    items,
    t: (key, fallback) => fallback || key,
    getRiSvg: (iconName) => iconName,
    sanitizeDisplayText: (value) => String(value || ''),
    getHostFromUrl,
    getThemeHostForSuggestion: (suggestion) => getHostFromUrl(suggestion && suggestion.url),
    shouldBlockFaviconForHost: () => false,
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
    getChromeFaviconUrl: (url) => `chrome://favicon2/?pageUrl=${encodeURIComponent(url)}&size=128`,
    applyFallbackIcon: (img) => {
      fallbackImages.push(img);
      if (img) {
        img.setAttribute('data-fallback-icon', 'true');
      }
    },
    attachFaviconWithFallbacks: (img, url, host, options) => {
      attached.push({ img, url, host, browserUrl: options && options.browserUrl });
    },
    defaultTheme
  });

  view.renderTabs([{
    title: '新标签页',
    url: 'chrome://newtab/',
    favIconUrl: ''
  }]);

  const item = view.getItems()[0];
  assert.ok(item, 'tab suggestion should render');
  assert.strictEqual(item._xIconIsFavicon, false, 'new-tab suggestion should render an inline fallback icon');
  assert.strictEqual(attached.length, 0, 'new-tab suggestion should not request a browser favicon when none exists');
  assert.strictEqual(fallbackImages.length, 0, 'new-tab suggestion should not rely on the image fallback pipeline');
  assert.ok(item._xIconWrap, 'new-tab suggestion should render an icon slot');
  assert.strictEqual(item._xIconWrap.childNodes[0].tagName, 'SPAN');
  assert.strictEqual(item._xIconWrap.childNodes[0].innerHTML, 'ri-link');
}

async function testBrowserPageTabUsesBrowserPageFaviconPrimaryCandidate() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();
  const attached = [];
  const browserPageIcon = 'chrome-extension://abc/_favicon/?pageUrl=chrome%3A%2F%2Fextensions%2F&size=128';

  const view = suggestionsView.createSuggestionsView({
    document,
    container,
    items,
    t: (key, fallback) => fallback || key,
    getRiSvg: () => '',
    sanitizeDisplayText: (value) => String(value || ''),
    getHostFromUrl,
    getThemeHostForSuggestion: (suggestion) => getHostFromUrl(suggestion && suggestion.url),
    shouldBlockFaviconForHost: () => false,
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
    getChromeFaviconUrl: (url) => `chrome://favicon2/?pageUrl=${encodeURIComponent(url)}&size=128`,
    getBrowserPageFaviconUrl: () => browserPageIcon,
    attachFaviconWithFallbacks: (img, url, host, options) => {
      attached.push({
        img,
        url,
        host,
        primaryUrl: options && options.primaryUrl,
        browserUrl: options && options.browserUrl
      });
    },
    defaultTheme
  });

  view.renderTabs([{
    title: '扩展程序',
    url: 'chrome://extensions/',
    favIconUrl: browserPageIcon
  }]);

  const item = view.getItems()[0];
  assert.ok(item, 'browser page tab suggestion should render');
  assert.strictEqual(item._xIconIsFavicon, true, 'browser page tab should try the favicon chain first');
  assert.strictEqual(attached.length, 1, 'browser page tab favicon should be attached through the fallback chain');
  assert.strictEqual(
    attached[0].primaryUrl,
    browserPageIcon,
    'browser page tabs should keep the extension _favicon URL as the primary favicon candidate'
  );
  assert.strictEqual(
    attached[0].browserUrl,
    'chrome://favicon2/?pageUrl=chrome%3A%2F%2Fextensions%2F&size=128',
    'browser page tabs should keep chrome://favicon2 as a fallback candidate'
  );
}

async function testBrowserPageSuggestionUsesBrowserPageFaviconWhenFaviconMissing() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();
  const attached = [];

  const view = suggestionsView.createSuggestionsView({
    document,
    container,
    items,
    t: (key, fallback) => fallback || key,
    getRiSvg: (iconName) => iconName,
    sanitizeDisplayText: (value) => String(value || ''),
    getHostFromUrl,
    getThemeHostForSuggestion: (suggestion) => getHostFromUrl(suggestion && suggestion.url),
    shouldBlockFaviconForHost: () => false,
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
    getChromeFaviconUrl: (url) => `chrome://favicon2/?pageUrl=${encodeURIComponent(url)}&size=128`,
    getBrowserPageFaviconUrl: (url) => `chrome-extension://abc/_favicon/?pageUrl=${encodeURIComponent(url)}&size=128`,
    attachFaviconWithFallbacks: (img, url, host, options) => {
      attached.push({
        img,
        url,
        host,
        primaryUrl: options && options.primaryUrl,
        browserUrl: options && options.browserUrl
      });
    },
    defaultTheme
  });

  view.render({
    query: 'extensions',
    primaryHighlightIndex: 0,
    primaryHighlightReason: 'browserPage',
    suggestions: [{
      type: 'browserPage',
      title: '扩展程序',
      url: 'chrome://extensions/',
      favicon: ''
    }]
  });

  const item = view.getItems()[0];
  assert.ok(item, 'browser page suggestion should render');
  assert.strictEqual(item._xIconIsFavicon, true, 'browser page suggestions should render a favicon image');
  assert.strictEqual(attached.length, 1, 'browser page suggestions should attach a favicon even without suggestion.favicon');
  assert.strictEqual(
    attached[0].primaryUrl,
    'chrome-extension://abc/_favicon/?pageUrl=chrome%3A%2F%2Fextensions%2F&size=128',
    'browser page suggestions should use the extension _favicon URL when no favicon was supplied'
  );
  assert.strictEqual(
    attached[0].browserUrl,
    'chrome://favicon2/?pageUrl=chrome%3A%2F%2Fextensions%2F&size=128',
    'browser page suggestions should keep chrome://favicon2 as a fallback candidate'
  );
}

async function testHighlightedSiteSearchUsesFaviconFallbackChain() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();
  const providerFavicon = 'https://t2.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE%2CSIZE%2CURL&url=https%3A%2F%2Fgithub.com%2F&size=128';
  const attached = [];

  const view = suggestionsView.createSuggestionsView({
    document,
    container,
    items,
    t: (key, fallback) => fallback || key,
    getRiSvg: (iconName) => iconName,
    sanitizeDisplayText: (value) => String(value || ''),
    getHostFromUrl,
    getThemeHostForSuggestion: (suggestion) => getHostFromUrl(suggestion && suggestion.url),
    shouldBlockFaviconForHost: () => false,
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
    attachFaviconWithFallbacks: (img, url, host, options) => {
      attached.push({
        img,
        url,
        host,
        primaryUrl: options && options.primaryUrl,
        browserUrl: options && options.browserUrl
      });
    },
    defaultTheme
  });

  view.render({
    query: 'react',
    primaryHighlightIndex: 0,
    primaryHighlightReason: 'none',
    suggestions: [{
      type: 'siteSearch',
      title: '在 GitHub 中搜索 "react"',
      url: 'https://github.com/search?q=react',
      favicon: providerFavicon,
      provider: {
        key: 'gh',
        name: 'GitHub',
        template: 'https://github.com/search?q={query}'
      },
      searchQuery: 'react'
    }]
  });

  const item = view.getItems()[0];
  const iconSlot = item && item._xIconWrap;
  assert.ok(iconSlot, 'site search suggestion should render an icon slot');
  assert.strictEqual(item._xIconIsFavicon, true, 'highlighted site search should use an image favicon');
  assert.strictEqual(attached.length, 1, 'highlighted site search favicon should use the shared fallback chain');
  assert.strictEqual(attached[0].url, 'https://github.com/search?q=react');
  assert.strictEqual(attached[0].host, 'github.com');
  assert.strictEqual(attached[0].primaryUrl, providerFavicon);
  assert.strictEqual(attached[0].browserUrl, '');
}

async function testAiSiteSearchUsesFaviconFallbackChain() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();
  const providerFavicon = 'https://t2.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE%2CSIZE%2CURL&url=https%3A%2F%2Fwww.doubao.com%2F&size=128';
  const attached = [];

  const view = suggestionsView.createSuggestionsView({
    document,
    container,
    items,
    t: (key, fallback) => fallback || key,
    getRiSvg: () => '',
    sanitizeDisplayText: (value) => String(value || ''),
    getHostFromUrl,
    getThemeHostForSuggestion: (suggestion) => getHostFromUrl(suggestion && suggestion.url),
    shouldBlockFaviconForHost: () => false,
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
    isAiSiteSearchProvider: (provider) => Boolean(provider && provider.action === 'openAndSubmit'),
    attachFaviconWithFallbacks: (img, url, host, options) => {
      attached.push({
        img,
        url,
        host,
        primaryUrl: options && options.primaryUrl,
        browserUrl: options && options.browserUrl
      });
    },
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
      favicon: providerFavicon,
      provider: {
        key: 'dbai',
        name: '豆包',
        template: 'https://www.doubao.com/chat/',
        action: 'openAndSubmit',
        submitStrategy: 'doubaoPrompt'
      },
      searchQuery: '阿萨德'
    }]
  });

  const item = view.getItems()[0];
  assert.ok(item, 'AI site search suggestion should render');
  assert.strictEqual(item._xIconIsFavicon, true, 'AI site search should use an image favicon');
  assert.strictEqual(attached.length, 1, 'AI site search favicon should use the shared fallback chain');
  assert.strictEqual(attached[0].url, 'https://www.doubao.com/chat/');
  assert.strictEqual(attached[0].host, 'www.doubao.com');
  assert.strictEqual(attached[0].primaryUrl, providerFavicon);
  assert.strictEqual(attached[0].browserUrl, '');
}

async function testModeSwitchImageFallbackUsesLinkIcon() {
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
    getRiSvg: (iconName) => iconName,
    sanitizeDisplayText: (value) => String(value || ''),
    getHostFromUrl,
    getThemeHostForSuggestion: (suggestion) => getHostFromUrl(suggestion && suggestion.url),
    shouldBlockFaviconForHost: () => false,
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
    defaultTheme
  });

  view.render({
    query: 'settings',
    primaryHighlightIndex: 0,
    primaryHighlightReason: 'modeSwitch',
    suggestions: [{
      type: 'modeSwitch',
      title: '切换搜索模式',
      url: '',
      favicon: 'https://example.com/missing.png'
    }]
  });

  const item = view.getItems()[0];
  const iconSlot = item && item._xIconWrap;
  assert.ok(iconSlot, 'mode switch suggestion should render an icon slot');
  const image = iconSlot.childNodes[0];
  assert.strictEqual(image.tagName, 'IMG', 'mode switch suggestion should start with a favicon image');
  assert.strictEqual(typeof image.onerror, 'function', 'favicon image should install an error fallback');
  image.onerror();
  assert.strictEqual(iconSlot.childNodes[0].innerHTML, 'ri-link');
}

async function testProxyFallbackFaviconUsesFallbackTheme() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();
  const urlHighlightTheme = faviconTheme.createUrlHighlightTheme();
  const proxyFallbackFavicon = 'https://t2.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE%2CSIZE%2CURL&url=https%3A%2F%2Fdyjs.cuc.edu.cn%2F&size=128';
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
      assert.strictEqual(suggestion.favicon, proxyFallbackFavicon);
      return Promise.resolve(defaultTheme);
    },
    shouldUseUrlFallbackThemeForSuggestion: (suggestion, theme) =>
      Boolean(theme && theme._xIsDefault && suggestion && suggestion.favicon === proxyFallbackFavicon),
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
      favicon: proxyFallbackFavicon
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
    'proxy fallback favicon suggestions should use the URL fallback highlight theme'
  );
  assert.strictEqual(
    item.style.getPropertyValue('--x-nt-suggestion-active-bg'),
    urlHighlightTheme.highlightBg,
    'proxy fallback active row should use the fallback theme highlight background'
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

async function testTopSiteSuggestionCanUseHoverDeleteAction() {
  const document = createFakeDocument();
  const container = document.createElement('div');
  container.setConnected(true);
  const items = [];
  const defaultTheme = faviconTheme.createDefaultTheme();
  const deleted = [];
  let activateCount = 0;
  const eventState = {
    preventDefaultCount: 0,
    stopPropagationCount: 0
  };

  const view = suggestionsView.createSuggestionsView({
    document,
    container,
    items,
    t: (key, fallback) => {
      if (key === 'search_remove_top_site_tooltip') {
        return '移除该常用';
      }
      return fallback || key;
    },
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
    onActivateSuggestion: () => {
      activateCount += 1;
    },
    onDeleteHistory: (suggestion, query) => {
      deleted.push({ suggestion, query });
    },
    actionModel: globalThis.LumnoSuggestionActionModel,
    defaultTheme
  });

  const topSiteSuggestion = {
    type: 'topSite',
    title: 'Lumno',
    url: 'https://lumno.example/',
    isTopSite: true,
    favicon: ''
  };
  view.render({
    query: 'lumno',
    primaryHighlightIndex: -1,
    primaryHighlightReason: 'none',
    suggestions: [topSiteSuggestion]
  });

  const item = view.getItems()[0];
  assert.ok(item, 'top-site suggestion should render');
  assert.strictEqual(
    item._xHasHistoryDeleteButton,
    true,
    'top-site suggestions should render the same hover delete control as history suggestions'
  );
  assert.strictEqual(
    item._xHistoryDeleteButton.getAttribute('aria-label'),
    '移除该常用',
    'top-site delete control should describe removing a frequent result'
  );

  triggerEvent(item, 'mouseenter');
  assert.strictEqual(
    item.getAttribute('data-history-delete-visible'),
    'true',
    'hovering a top-site suggestion should reveal the delete control'
  );

  triggerEvent(item._xHistoryDeleteButton, 'click', {
    preventDefault() {
      eventState.preventDefaultCount += 1;
    },
    stopPropagation() {
      eventState.stopPropagationCount += 1;
    }
  });

  assert.strictEqual(eventState.preventDefaultCount, 1, 'top-site delete click should prevent row activation');
  assert.strictEqual(eventState.stopPropagationCount, 1, 'top-site delete click should not bubble to the result row');
  assert.strictEqual(activateCount, 0, 'top-site delete click should not open the result');
  assert.strictEqual(deleted.length, 1, 'top-site delete click should request URL removal');
  assert.strictEqual(deleted[0].suggestion, topSiteSuggestion, 'top-site delete should pass the clicked suggestion');
  assert.strictEqual(deleted[0].query, 'lumno', 'top-site delete should preserve the current query');
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

testSiteSearchProviderIconsUsePageFaviconCandidates();
testSiteSearchTabHintRequiresExplicitTrigger();

testLocalUrlSuggestionUsesFallbackTheme()
  .then(testDirectUrlSuggestionUsesFaviconWhenAvailable)
  .then(testAppendRenderKeepsOnlyFinalSuggestionMarkedLast)
  .then(testBrowserNewtabSuggestionUsesFallbackIconWhenFaviconMissing)
  .then(testBrowserPageTabUsesBrowserPageFaviconPrimaryCandidate)
  .then(testBrowserPageSuggestionUsesBrowserPageFaviconWhenFaviconMissing)
  .then(testHighlightedSiteSearchUsesFaviconFallbackChain)
  .then(testAiSiteSearchUsesFaviconFallbackChain)
  .then(testModeSwitchImageFallbackUsesLinkIcon)
  .then(testProxyFallbackFaviconUsesFallbackTheme)
  .then(testVisitButtonAndEnterTagShareOverlayVisibilityRules)
  .then(testTopSiteSuggestionCanUseHoverDeleteAction)
  .then(testAiProviderVisitButtonUsesWebAppLabel)
  .then(testOpenNewTabVisitButtonReflectsCurrentTabModifier)
  .then(() => {
    console.log('newtab suggestions view tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
