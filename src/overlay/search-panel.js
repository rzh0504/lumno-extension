'use strict';

window._x_extension_toggleSearchOverlay_2026_unique_ = function(tabs, overlayContext) {
  let captureTabHandler = null;
  let overlayThemeStorageListener = null;
  let overlayLanguageStorageListener = null;
  let overlaySearchEngineStorageListener = null;
  let overlaySearchResultPriorityStorageListener = null;
  let overlaySearchBlacklistStorageListener = null;
  let overlaySizeStorageListener = null;
  let overlayTabPriorityStorageListener = null;
  let overlayTabScoreDebugStorageListener = null;
  let overlayThemeMediaListener = null;
  let overlayPageThemeObserver = null;
  let overlayPageThemeSyncRaf = null;
  let siteSearchStorageListener = null;
  let keydownHandler = null;
  let overlayKeyCaptureHandler = null;
  let clickOutsideHandler = null;
  let overlayScrollPauseHandler = null;
  let overlayRevealGate = null;
  const OVERLAY_HOST_ID = '_x_extension_overlay_host_2026_unique_';
  const OVERLAY_PANEL_ID = '_x_extension_overlay_2024_unique_';
  const SETTINGS = window.LumnoSettings || {};
  const SEARCH_UTILS = window.LumnoSearchUtils || {};
  const SITE_SEARCH_STORE = window.LumnoSiteSearchStore || {};
  const SUGGESTION_ACTION_MODEL = window.LumnoSuggestionActionModel || {};
  const SUGGESTION_NAVIGATION = window.LumnoSuggestionNavigation || {};
  const SEARCH_INPUT_MODE = window.LumnoSearchInputMode || {};
  const FAVICON_UTILS = window.LumnoFaviconUtils || {};
  const overlayRuntime = window.LumnoOverlayRuntime;
  const overlayLifecycle = window.LumnoOverlayLifecycle;
  const overlayFaviconView = window.LumnoOverlayFaviconView;
  const overlaySiteFixes = window.LumnoOverlaySiteFixes;
  if (!overlayRuntime ||
      !overlayRuntime.STORAGE_KEYS ||
      typeof overlayRuntime.getRuntimeUrl !== 'function' ||
      typeof overlayRuntime.getStorageArea !== 'function' ||
      typeof overlayRuntime.getStorageValues !== 'function' ||
      typeof overlayRuntime.loadLocaleMessages !== 'function') {
    console.warn('Lumno: overlay runtime helper not available.');
    return;
  }
  if (typeof SITE_SEARCH_STORE.loadSiteSearchProviders !== 'function' ||
      typeof SITE_SEARCH_STORE.mergeStoredProviders !== 'function') {
    console.warn('Lumno: site search store helper not available.');
    return;
  }
  if (typeof SUGGESTION_NAVIGATION.scrollItemIntoView !== 'function') {
    console.warn('Lumno: suggestion navigation helper not available.');
    return;
  }
  if (typeof SEARCH_INPUT_MODE.createInputModeController !== 'function') {
    console.warn('Lumno: search input mode helper not available.');
    return;
  }
  if (!overlayLifecycle ||
      typeof overlayLifecycle.createFrameTracker !== 'function' ||
      typeof overlayLifecycle.createViewportSizeSync !== 'function' ||
      typeof overlayLifecycle.createAntiTranslateGuard !== 'function') {
    console.warn('Lumno: overlay lifecycle helper not available.');
    return;
  }
  if (!overlayFaviconView ||
      typeof overlayFaviconView.createOverlayFaviconViewRuntime !== 'function') {
    console.warn('Lumno: overlay favicon view helper not available.');
    return;
  }
  const normalizedOverlayContext = (overlayContext && typeof overlayContext === 'object') ? overlayContext : {};
  const requestedTabZoomFactorRaw = Number(normalizedOverlayContext.tabZoomFactor);
  const initialPrefillQuery = typeof normalizedOverlayContext.prefillQuery === 'string'
    ? String(normalizedOverlayContext.prefillQuery).trim()
    : '';
  const prioritizeCurrentPageMatch = Boolean(normalizedOverlayContext.prioritizeCurrentPageMatch);
  const initialContextTabId = Number.isFinite(Number(normalizedOverlayContext.currentTabId))
    ? Number(normalizedOverlayContext.currentTabId)
    : null;
  const initialContextTabUrl = typeof normalizedOverlayContext.currentTabUrl === 'string'
    ? String(normalizedOverlayContext.currentTabUrl).trim()
    : '';
  function isLocalFileLikeOverlayUrl(url) {
    if (!url) {
      return false;
    }
    try {
      const parsed = new URL(url);
      const protocol = String(parsed.protocol || '').toLowerCase();
      if (protocol === 'file:') {
        return true;
      }
      const pathname = String(parsed.pathname || '').toLowerCase();
      const srcParam = parsed.searchParams ? parsed.searchParams.get('src') : '';
      if (pathname.endsWith('.pdf')) {
        return true;
      }
      if (srcParam) {
        try {
          const nested = new URL(srcParam);
          if (String(nested.protocol || '').toLowerCase() === 'file:') {
            return true;
          }
          if (String(nested.pathname || '').toLowerCase().endsWith('.pdf')) {
            return true;
          }
        } catch (e) {
          if (String(srcParam).toLowerCase().startsWith('file://') || String(srcParam).toLowerCase().includes('.pdf')) {
            return true;
          }
        }
      }
    } catch (e) {
      return String(url).toLowerCase().startsWith('file://') || String(url).toLowerCase().includes('.pdf');
    }
    return false;
  }
  const shouldIgnoreTabZoomCompensation = isLocalFileLikeOverlayUrl(initialContextTabUrl);
  const initialOverlayTabs = Array.isArray(tabs)
    ? tabs.map((tab) => ({
      ...tab,
      url: tab && typeof tab.url === 'string' ? String(tab.url).trim() : ''
    }))
    : [];
  const requestedTabZoomFactor = Number.isFinite(requestedTabZoomFactorRaw) && requestedTabZoomFactorRaw > 0
    ? requestedTabZoomFactorRaw
    : 1;
  const overlayFrameTracker = overlayLifecycle.createFrameTracker(window);
  const overlayViewportSizeSync = overlayLifecycle.createViewportSizeSync(window, {
    getSizePreset: () => getOverlaySizePreset(overlaySizeMode),
    getRequestedTabZoomFactor: () => requestedTabZoomFactor,
    shouldIgnoreTabZoomCompensation: () => shouldIgnoreTabZoomCompensation
  });
  const overlayAntiTranslateGuard = overlayLifecycle.createAntiTranslateGuard(window, {
    applyNoTranslate,
    applyNoTranslateDeep,
    restoreProtectedNode,
    restoreProtectedAncestors
  });
  const overlayStorageKeys = overlayRuntime.STORAGE_KEYS;
  const THEME_STORAGE_KEY = overlayStorageKeys.themeMode;
  const LANGUAGE_STORAGE_KEY = overlayStorageKeys.language;
  const LANGUAGE_MESSAGES_STORAGE_KEY = overlayStorageKeys.languageMessages;
  const DEFAULT_SEARCH_ENGINE_STORAGE_KEY = overlayStorageKeys.defaultSearchEngine;
  const SITE_SEARCH_STORAGE_KEY = overlayStorageKeys.siteSearchCustom;
  const SITE_SEARCH_DISABLED_STORAGE_KEY = overlayStorageKeys.siteSearchDisabled;
  const SEARCH_RESULT_PRIORITY_STORAGE_KEY = overlayStorageKeys.searchResultPriority;
  const SEARCH_BLACKLIST_STORAGE_KEY = overlayStorageKeys.searchBlacklist;
  const OVERLAY_SIZE_MODE_STORAGE_KEY = overlayStorageKeys.overlaySizeMode;
  const OVERLAY_TAB_PRIORITY_STORAGE_KEY = overlayStorageKeys.overlayTabPriority;
  const TAB_RANK_SCORE_DEBUG_STORAGE_KEY = overlayStorageKeys.tabRankScoreDebug;
  const storageRuntime = overlayRuntime.getStorageArea(chrome);
  const storageArea = storageRuntime.area;
  const storageAreaName = storageRuntime.name;
  const RI_CSS_URL = overlayRuntime.getRuntimeUrl(chrome, 'assets/remixicon/fonts/remixicon.css');
  const OPEN_SANS_CSS_URL = overlayRuntime.getRuntimeUrl(chrome, 'assets/fonts/open-sans/open-sans.css');
  const SEARCH_INPUT_CSS_URL = overlayRuntime.getRuntimeUrl(chrome, 'src/shared/search-input.css');
  const OVERLAY_SUGGESTIONS_CSS_URL = overlayRuntime.getRuntimeUrl(chrome, 'src/overlay/suggestions-view.css');
  const overlayMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let overlayThemeMode = 'system';
  let overlaySearchResultPriorityMode = 'autocomplete';
  let overlaySizeMode = 'standard';
  let overlaySearchBlacklistItems = [];
  let overlayThemeListenerAttached = false;

  function normalizeOverlaySearchBlacklistItems(items) {
    if (globalThis.LumnoBlacklistUtils && typeof globalThis.LumnoBlacklistUtils.normalizeItems === 'function') {
      return globalThis.LumnoBlacklistUtils.normalizeItems(items, 'prefix');
    }
    return [];
  }

  function isUrlBlockedByOverlaySearchBlacklist(url) {
    if (globalThis.LumnoBlacklistUtils && typeof globalThis.LumnoBlacklistUtils.isUrlBlocked === 'function') {
      return globalThis.LumnoBlacklistUtils.isUrlBlocked(url, overlaySearchBlacklistItems);
    }
    return false;
  }

  function isOverlaySuggestionBlockedBySearchBlacklist(suggestion, queryForProvider) {
    if (!suggestion) {
      return false;
    }
    if (
      suggestion.type === 'newtab' ||
      suggestion.type === 'siteSearch' ||
      suggestion.type === 'inlineSiteSearch' ||
      suggestion.type === 'siteSearchPrompt'
    ) {
      return false;
    }
    if (suggestion.url && isUrlBlockedByOverlaySearchBlacklist(suggestion.url)) {
      return true;
    }
    return false;
  }

  function filterOverlayBlacklistedSuggestions(list, queryForProvider) {
    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }
    return list.filter((suggestion) => !isOverlaySuggestionBlockedBySearchBlacklist(suggestion, queryForProvider));
  }

  function limitOverlaySuggestionsForDisplay(list) {
    if (typeof SEARCH_UTILS.limitSearchSuggestionsForDisplay === 'function') {
      return SEARCH_UTILS.limitSearchSuggestionsForDisplay(list);
    }
    const suggestions = Array.isArray(list) ? list : [];
    const policy = SEARCH_UTILS.SEARCH_POLICY || {};
    const limit = Number(policy.displaySuggestionLimit) || 10;
    return suggestions.slice(0, limit);
  }

  function loadOverlaySearchBlacklistItems(onReload) {
    if (!storageArea) {
      overlaySearchBlacklistItems = [];
      return;
    }
    storageArea.get([SEARCH_BLACKLIST_STORAGE_KEY], (result) => {
      overlaySearchBlacklistItems = normalizeOverlaySearchBlacklistItems(
        result ? result[SEARCH_BLACKLIST_STORAGE_KEY] : null
      );
      if (typeof onReload === 'function') {
        onReload();
      }
    });
  }

  function normalizeSearchResultPriority(value) {
    return typeof SETTINGS.normalizeSearchResultPriority === 'function'
      ? SETTINGS.normalizeSearchResultPriority(value)
      : (value === 'search' ? 'search' : 'autocomplete');
  }

  function stopOverlayPageThemeObserver() {
    if (overlayPageThemeSyncRaf !== null) {
      cancelAnimationFrame(overlayPageThemeSyncRaf);
      overlayPageThemeSyncRaf = null;
    }
    if (overlayPageThemeObserver) {
      overlayPageThemeObserver.disconnect();
      overlayPageThemeObserver = null;
    }
  }

  function escapeRegExp(text) {
    return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function sanitizeDisplayText(text) {
    const raw = String(text || '');
    const withoutSpecial = raw.replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\uFFF9-\uFFFD]|\p{Co}/gu, '');
    return withoutSpecial.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
  }

  function renderHighlightedText(target, text, query, styles) {
    applyNoTranslate(target);
    const safeText = sanitizeDisplayText(text);
    const needle = String(query || '').trim();
    if (!needle) {
      target.textContent = safeText;
      return;
    }
    const parts = safeText.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'));
    if (parts.length === 1) {
      target.textContent = safeText;
      return;
    }
    parts.forEach((part) => {
      if (!part) {
        return;
      }
      if (part.toLowerCase() === needle.toLowerCase()) {
        const mark = document.createElement('mark');
        applyNoTranslate(mark);
        mark.style.background = styles && styles.background
          ? styles.background
          : 'var(--x-ext-mark-bg, #CFE8FF)';
        mark.style.color = styles && styles.color
          ? styles.color
          : 'var(--x-ext-mark-text, #1E3A8A)';
        mark.style.padding = '0 1px';
        mark.style.borderRadius = '2px';
        mark.style.lineHeight = 'inherit';
        mark.style.fontFamily = "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
        mark.textContent = part;
        target.appendChild(mark);
      } else {
        target.appendChild(document.createTextNode(part));
      }
    });
  }

  function applyNoTranslate(element) {
    if (!element || !element.setAttribute) {
      return element;
    }
    element.setAttribute('translate', 'no');
    element.setAttribute('lang', 'zxx');
    element.setAttribute('notranslate', '');
    element.setAttribute('data-no-translate', 'true');
    if (element.classList) {
      element.classList.add('notranslate');
    }
    return element;
  }

  function applyNoTranslateDeep(root) {
    if (!root || typeof root !== 'object') {
      return root;
    }
    applyNoTranslate(root);
    if (!root.querySelectorAll) {
      return root;
    }
    root.querySelectorAll('*').forEach((element) => {
      applyNoTranslate(element);
    });
    return root;
  }

  function setProtectedPlainText(element, text) {
    if (!element) {
      return element;
    }
    const safeText = sanitizeDisplayText(text);
    element._xProtectedRender = function() {
      applyNoTranslate(element);
      if (element.textContent !== safeText || element.childNodes.length !== 1 || element.firstChild.nodeType !== Node.TEXT_NODE) {
        element.textContent = safeText;
      }
    };
    element._xProtectedRender();
    return element;
  }

  function setProtectedHighlightedText(element, text, query, styles) {
    if (!element) {
      return element;
    }
    const safeText = sanitizeDisplayText(text);
    const safeQuery = String(query || '');
    element._xProtectedRender = function() {
      applyNoTranslate(element);
      element.textContent = '';
      renderHighlightedText(element, safeText, safeQuery, styles);
    };
    element._xProtectedRender();
    return element;
  }

  function restoreProtectedNode(node) {
    if (node && typeof node._xProtectedRender === 'function') {
      node._xProtectedRender();
      return true;
    }
    return false;
  }

  function restoreProtectedAncestors(node, root) {
    let current = node && node.nodeType === Node.ELEMENT_NODE
      ? node
      : node && node.parentElement
        ? node.parentElement
        : null;
    while (current) {
      if (restoreProtectedNode(current)) {
        return true;
      }
      if (current === root) {
        break;
      }
      current = current.parentElement;
    }
    return false;
  }

  function stopOverlayAntiTranslateObserver() {
    overlayAntiTranslateGuard.stop();
  }

  function pauseOverlayAntiTranslateObserverForScroll() {
    overlayAntiTranslateGuard.pauseForScroll();
  }

  function setInlineLabelWithIcon(container, labelText, iconHtml) {
    if (!container) {
      return;
    }
    container.textContent = '';
    const label = document.createElement('span');
    label.className = 'x-ov-inline-label';
    setProtectedPlainText(label, labelText);
    const icon = document.createElement('span');
    icon.className = 'x-ov-inline-icon';
    applyNoTranslate(icon);
    icon.innerHTML = iconHtml;
    container.appendChild(label);
    container.appendChild(icon);
  }

  function startOverlayAntiTranslateObserver(root) {
    overlayAntiTranslateGuard.start(root);
  }

  let modeBadge = null;
  let inputModeController = null;
  let overlayLanguageMode = 'system';
  let overlayTabQuickSwitchEnabled = true;
  let overlayTabScoreDebugEnabled = false;
  let currentMessages = null;
  let defaultPlaceholderText = 'Search or enter URL...';
  let lastSuggestionResponse = [];
  let overlaySearchEngineState = {
    id: '',
    name: '',
    host: '',
    searchTemplate: ''
  };

  function ensureRemixIconStyles() {
    if (document.getElementById('_x_extension_remixicon_css_2024_unique_')) {
      return;
    }
    const host = document.head || document.documentElement;
    if (!host) {
      return;
    }
    const link = document.createElement('link');
    link.id = '_x_extension_remixicon_css_2024_unique_';
    link.rel = 'stylesheet';
    link.href = RI_CSS_URL;
    host.appendChild(link);
  }

  function ensureOpenSansStyles() {
    if (document.getElementById('_x_extension_open_sans_css_2024_unique_')) {
      return;
    }
    const host = document.head || document.documentElement;
    if (!host) {
      return;
    }
    const link = document.createElement('link');
    link.id = '_x_extension_open_sans_css_2024_unique_';
    link.rel = 'stylesheet';
    link.href = OPEN_SANS_CSS_URL;
    host.appendChild(link);
  }

  ensureOpenSansStyles();
  ensureRemixIconStyles();

  function normalizeLocale(locale) {
    return typeof SETTINGS.normalizeLocale === 'function'
      ? SETTINGS.normalizeLocale(locale)
      : 'en';
  }

  function getSystemLocale() {
    if (chrome && chrome.i18n && chrome.i18n.getUILanguage) {
      return normalizeLocale(chrome.i18n.getUILanguage());
    }
    return normalizeLocale(navigator.language || 'en');
  }

  function loadLocaleMessages(locale) {
    return overlayRuntime.loadLocaleMessages({
      chromeApi: chrome,
      locale,
      normalizeLocale
    });
  }

  function t(key, fallback) {
    if (currentMessages && currentMessages[key] && currentMessages[key].message) {
      return currentMessages[key].message;
    }
    if (chrome && chrome.i18n && chrome.i18n.getMessage) {
      const message = chrome.i18n.getMessage(key);
      if (message) {
        return message;
      }
    }
    return fallback || '';
  }

  function getStorageValuesAsync(keys) {
    return overlayRuntime.getStorageValues(storageArea, keys);
  }

  async function bootstrapOverlayLanguageForInitialRender() {
    const result = await getStorageValuesAsync([LANGUAGE_STORAGE_KEY, LANGUAGE_MESSAGES_STORAGE_KEY]);
    overlayLanguageMode = result[LANGUAGE_STORAGE_KEY] || 'system';
    const targetLocale = overlayLanguageMode === 'system'
      ? getSystemLocale()
      : normalizeLocale(overlayLanguageMode);
    const payload = result[LANGUAGE_MESSAGES_STORAGE_KEY];
    if (payload && payload.locale === targetLocale && payload.messages) {
      currentMessages = payload.messages || {};
      return;
    }
    currentMessages = await loadLocaleMessages(targetLocale).catch(() => ({}));
  }

  function formatMessage(key, fallback, params) {
    let text = t(key, fallback);
    if (!params) {
      return text;
    }
    Object.keys(params).forEach((token) => {
      const value = params[token];
      text = text.replace(new RegExp(`\\{${token}\\}`, 'g'), value);
    });
    return text;
  }

  function normalizeOverlayTabPriorityMode(mode) {
    return typeof SETTINGS.normalizeOverlayTabPriorityMode === 'function'
      ? SETTINGS.normalizeOverlayTabPriorityMode(mode)
      : mode !== 'newtabFirst' && mode !== false;
  }

  function normalizeTabRankScoreDebugMode(mode) {
    return typeof SETTINGS.normalizeTabRankScoreDebugMode === 'function'
      ? SETTINGS.normalizeTabRankScoreDebugMode(mode)
      : mode === true;
  }

  function normalizeOverlaySizeMode(mode) {
    return typeof SETTINGS.normalizeOverlaySizeMode === 'function'
      ? SETTINGS.normalizeOverlaySizeMode(mode)
      : ((mode === 'compact' || mode === 'large') ? mode : 'standard');
  }

  function getOverlaySizePreset(mode) {
    const normalizedMode = normalizeOverlaySizeMode(mode);
    if (normalizedMode === 'compact') {
      return { width: 680, maxHeightVh: 72, uiScale: 0.94 };
    }
    if (normalizedMode === 'large') {
      return { width: 840, maxHeightVh: 80, uiScale: 1.06 };
    }
    return { width: 760, maxHeightVh: 75, uiScale: 1 };
  }

  function formatTabRankDebugText(tab) {
    const scoreRaw = Number(tab && tab._xTabRankScore);
    const score = Number.isFinite(scoreRaw) ? scoreRaw.toFixed(2) : '0.00';
    const count30mRaw = Number(tab && tab._xTabSwitchCount30m);
    const count24hRaw = Number(tab && tab._xTabSwitchCount24h);
    const debugTotalRaw = Number(tab && tab._xTabDebugEventTotal);
    const lastAccessedRaw = Number(tab && tab._xTabLastAccessedRaw);
    const sortAtRaw = Number(tab && tab._xTabSortAt);
    const fetchSeqRaw = Number(tab && tab._xTabFetchSeq);
    const count30m = Number.isFinite(count30mRaw) ? Math.max(0, Math.round(count30mRaw)) : 0;
    const count24h = Number.isFinite(count24hRaw) ? Math.max(0, Math.round(count24hRaw)) : 0;
    const debugTotal = Number.isFinite(debugTotalRaw) ? Math.max(0, Math.round(debugTotalRaw)) : 0;
    const lastAccessedSec = Number.isFinite(lastAccessedRaw) && lastAccessedRaw > 0 ? Math.round(lastAccessedRaw / 1000) : 0;
    const sortAtSec = Number.isFinite(sortAtRaw) && sortAtRaw > 0 ? Math.round(sortAtRaw / 1000) : 0;
    const fetchSeq = Number.isFinite(fetchSeqRaw) ? Math.max(0, Math.round(fetchSeqRaw)) : 0;
    return `score ${score} · 30m ${count30m} · 24h ${count24h} · ev ${debugTotal} · la ${lastAccessedSec} · s ${sortAtSec} · fs ${fetchSeq} · build 20260308-1`;
  }

  function getRiSvg(id, sizeClass, extraClass) {
    const size = sizeClass || 'ri-size-16';
    const extra = extraClass ? ` ${extraClass}` : '';
    return '<i class="ri-icon ' + size + extra + ' ' + id + '" aria-hidden="true"></i>';
  }

  function buildSearchUrlFromTemplate(template, query) {
    if (!template) {
      return '';
    }
    return template.replace(/\{query\}/g, encodeURIComponent(query || ''));
  }

  function getOverlaySearchEngineState() {
    return overlaySearchEngineState || {};
  }

  function buildDefaultSearchUrlForOverlay(query) {
    const state = getOverlaySearchEngineState();
    if (state.searchTemplate) {
      return buildSearchUrlFromTemplate(state.searchTemplate, query);
    }
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  function getDefaultSearchEngineFaviconUrlForOverlay() {
    const state = getOverlaySearchEngineState();
    if (state.host) {
      return `https://${state.host}/favicon.ico`;
    }
    if (state.searchTemplate) {
      try {
        const url = buildSearchUrlFromTemplate(state.searchTemplate, 'test');
        const host = new URL(url).hostname;
        return `https://${host}/favicon.ico`;
      } catch (e) {
        return '';
      }
    }
    return 'https://www.google.com/favicon.ico';
  }

  function getDefaultSearchEngineThemeUrlForOverlay() {
    const state = getOverlaySearchEngineState();
    if (state.searchTemplate) {
      return buildSearchUrlFromTemplate(state.searchTemplate, 'test');
    }
    if (state.host) {
      return `https://${state.host}`;
    }
    return 'https://www.google.com';
  }

  function getSearchActionLabel() {
    const state = getOverlaySearchEngineState();
    if (state.name) {
      return formatMessage('action_search_engine', '在 {engine} 中搜索', {
        engine: state.name
      });
    }
    return t('action_search', '搜索');
  }

  function loadOverlaySearchEngineState(onReload) {
    if (!storageArea) {
      return;
    }
    storageArea.get([DEFAULT_SEARCH_ENGINE_STORAGE_KEY], (result) => {
      const stored = result ? result[DEFAULT_SEARCH_ENGINE_STORAGE_KEY] : null;
      if (stored && stored.id) {
        overlaySearchEngineState = stored;
        if (typeof onReload === 'function') {
          onReload();
        }
      }
    });
  }


  function isLocalNetworkHost(hostname) {
    return typeof FAVICON_UTILS.isLocalNetworkHost === 'function'
      ? FAVICON_UTILS.isLocalNetworkHost(hostname)
      : false;
  }

  function isSuspiciousLocalFaviconHost(hostname) {
    return typeof FAVICON_UTILS.isSuspiciousLocalFaviconHost === 'function'
      ? FAVICON_UTILS.isSuspiciousLocalFaviconHost(hostname)
      : false;
  }

  function shouldBlockFaviconForHost(hostname) {
    return typeof FAVICON_UTILS.shouldBlockFaviconForHost === 'function'
      ? FAVICON_UTILS.shouldBlockFaviconForHost(hostname)
      : false;
  }

  function normalizeOverlayThemePreference(theme) {
    return typeof SETTINGS.normalizeThemePreference === 'function'
      ? SETTINGS.normalizeThemePreference(theme)
      : '';
  }

  function shouldSkipOverlayThemeUpgradeCandidate(candidateUrl, preferredTheme, currentUrl) {
    return typeof FAVICON_UTILS.shouldSkipThemeUpgradeCandidate === 'function'
      ? FAVICON_UTILS.shouldSkipThemeUpgradeCandidate(candidateUrl, normalizeOverlayThemePreference(preferredTheme), currentUrl)
      : false;
  }

  function isLocalNetworkInput(input) {
    const raw = String(input || '').trim().toLowerCase();
    if (!raw) {
      return false;
    }
    const withoutScheme = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
    const authority = withoutScheme.split(/[/?#]/)[0] || '';
    const host = authority.includes('@') ? authority.split('@').pop() : authority;
    const normalizedHost = (() => {
      const value = String(host || '').trim().toLowerCase();
      if (!value) {
        return '';
      }
      if (value.startsWith('[')) {
        const endBracket = value.indexOf(']');
        if (endBracket > 1) {
          return value.slice(1, endBracket);
        }
      }
      return value.replace(/^\[|\]$/g, '').split(':')[0];
    })();
    if (!normalizedHost) {
      return false;
    }
    return isLocalNetworkHost(normalizedHost);
  }
  function clearOverlayEnterAnimationFrames() {
    overlayFrameTracker.clear();
  }

  function stopOverlayViewportSizeSync() {
    overlayViewportSizeSync.stop();
  }

  function applyOverlaySizeForPageZoom(overlayElement) {
    overlayViewportSizeSync.apply(overlayElement);
  }

  function startOverlayViewportSizeSync(overlayElement) {
    overlayViewportSizeSync.start(overlayElement);
  }

  // Helper function to remove overlay and clean up styles
  function removeOverlay(overlayElement) {
    clearOverlayEnterAnimationFrames();
    if (overlayRevealGate && typeof overlayRevealGate.cancel === 'function') {
      overlayRevealGate.cancel();
      overlayRevealGate = null;
    }
    stopOverlayViewportSizeSync();
    stopOverlayAntiTranslateObserver();
    if (overlayElement) {
      const mountHost = overlayElement._lumnoOverlayHost || overlayElement;
      mountHost.remove();
    }
    // Also remove the scrollbar style
    const scrollbarStyle = document.getElementById('_x_extension_scrollbar_style_2024_unique_');
    if (scrollbarStyle) {
      scrollbarStyle.remove();
    }
    const overlayThemeStyle = document.getElementById('_x_extension_overlay_theme_style_2024_unique_');
    if (overlayThemeStyle) {
      overlayThemeStyle.remove();
    }
    if (captureTabHandler) {
      document.removeEventListener('keydown', captureTabHandler, true);
      captureTabHandler = null;
    }
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
    if (clickOutsideHandler) {
      document.removeEventListener('click', clickOutsideHandler);
      clickOutsideHandler = null;
    }
    if (overlayKeyCaptureHandler) {
      window.removeEventListener('keydown', overlayKeyCaptureHandler, true);
      overlayKeyCaptureHandler = null;
    }
    if (overlayThemeStorageListener) {
      chrome.storage.onChanged.removeListener(overlayThemeStorageListener);
      overlayThemeStorageListener = null;
    }
    if (overlayLanguageStorageListener) {
      chrome.storage.onChanged.removeListener(overlayLanguageStorageListener);
      overlayLanguageStorageListener = null;
    }
    if (overlaySearchEngineStorageListener) {
      chrome.storage.onChanged.removeListener(overlaySearchEngineStorageListener);
      overlaySearchEngineStorageListener = null;
    }
    if (overlaySearchResultPriorityStorageListener) {
      chrome.storage.onChanged.removeListener(overlaySearchResultPriorityStorageListener);
      overlaySearchResultPriorityStorageListener = null;
    }
    if (overlaySearchBlacklistStorageListener) {
      chrome.storage.onChanged.removeListener(overlaySearchBlacklistStorageListener);
      overlaySearchBlacklistStorageListener = null;
    }
    if (overlayTabPriorityStorageListener) {
      chrome.storage.onChanged.removeListener(overlayTabPriorityStorageListener);
      overlayTabPriorityStorageListener = null;
    }
    if (overlayTabScoreDebugStorageListener) {
      chrome.storage.onChanged.removeListener(overlayTabScoreDebugStorageListener);
      overlayTabScoreDebugStorageListener = null;
    }
    if (overlaySizeStorageListener) {
      chrome.storage.onChanged.removeListener(overlaySizeStorageListener);
      overlaySizeStorageListener = null;
    }
    if (overlayThemeMediaListener) {
      overlayMediaQuery.removeEventListener('change', overlayThemeMediaListener);
      overlayThemeMediaListener = null;
    }
    if (overlayScrollPauseHandler) {
      window.removeEventListener('scroll', overlayScrollPauseHandler, true);
      window.removeEventListener('wheel', overlayScrollPauseHandler, true);
      window.removeEventListener('touchmove', overlayScrollPauseHandler, true);
      overlayScrollPauseHandler = null;
    }
    stopOverlayPageThemeObserver();
    if (siteSearchStorageListener) {
      chrome.storage.onChanged.removeListener(siteSearchStorageListener);
      siteSearchStorageListener = null;
    }
    if (inputModeController) {
      inputModeController.destroy();
      inputModeController = null;
    }
  }

  const overlayShell = window.LumnoOverlayShell;

  // Check if the overlay already exists
  let overlay = overlayShell && typeof overlayShell.findOverlayPanel === 'function'
    ? overlayShell.findOverlayPanel(document, {
      hostId: OVERLAY_HOST_ID,
      id: OVERLAY_PANEL_ID
    })
    : document.getElementById(OVERLAY_PANEL_ID);

  if (overlay) {
    // If it exists, remove it (toggle off)
    removeOverlay(overlay);
  } else {
    // If it doesn't exist, create it (toggle on)
    if (!overlayShell ||
        typeof overlayShell.createOverlayMount !== 'function' ||
        typeof overlayShell.appendOverlayStyleNodes !== 'function') {
      console.warn('Lumno: overlay shell helper not available.');
      return;
    }
    const initialOverlaySizePreset = getOverlaySizePreset(overlaySizeMode);
    const overlayMount = overlayShell.createOverlayMount(document, {
      hostId: OVERLAY_HOST_ID,
      id: OVERLAY_PANEL_ID,
      width: initialOverlaySizePreset.width,
      maxHeightVh: initialOverlaySizePreset.maxHeightVh,
      openSansCssUrl: OPEN_SANS_CSS_URL,
      remixIconCssUrl: RI_CSS_URL,
      searchInputCssUrl: SEARCH_INPUT_CSS_URL,
      overlaySuggestionsCssUrl: OVERLAY_SUGGESTIONS_CSS_URL
    });
    overlay = overlayMount && overlayMount.panel ? overlayMount.panel : null;
    const overlayHost = overlayMount && overlayMount.host ? overlayMount.host : overlay;
    const overlayStyleRoot = overlayMount && overlayMount.root ? overlayMount.root : null;
    if (!overlay || !overlayHost) {
      console.warn('Lumno: overlay mount could not be created.');
      return;
    }
    applyNoTranslate(overlay);

    let tabs = [];
    let currentOverlayTabId = null;
    if (initialOverlayTabs.length > 0) {
      tabs = initialOverlayTabs;
    }
    if (typeof initialContextTabId === 'number') {
      currentOverlayTabId = initialContextTabId;
    }
    let latestOverlayQuery = '';
    let latestRawInputValue = '';
    let lastDeletionAt = 0;
    let autocompleteState = null;
    let inlineSearchState = null;
    let siteSearchTriggerState = null;
    let siteSearchState = null;
    let openTabsSearchModeActive = false;
    let isComposing = false;
    let selectedIndex = -1; // -1 means input is focused, 0+ means suggestion is selected
    const suggestionItems = [];
    let currentSuggestions = []; // Store current suggestions for keyboard navigation
    let lastRenderedQuery = '';
    let lastRenderedActionContextKey = '';

    const applyOverlayTheme = (mode) => {
      overlayThemeMode = mode;
      const previousResolvedTheme = overlay ? overlay.getAttribute('data-theme') : '';
      applyOverlayThemeVariables(overlay, mode);
      const nextResolvedTheme = overlay ? overlay.getAttribute('data-theme') : '';
      suggestionItems.forEach((item) => {
        if (item && item._xTheme) {
          applyThemeVariables(item, item._xTheme);
        }
      });
      updateSelection();
      updateModeBadge(searchInput ? searchInput.value : '');
      if (previousResolvedTheme !== nextResolvedTheme) {
        refreshOverlayThemeAwareFavicons();
      }
      if (mode === 'system') {
        startOverlayPageThemeObserver();
        if (!overlayThemeListenerAttached) {
          overlayThemeMediaListener = function() {
            if (overlayThemeMode === 'system') {
              // 仅更新容器变量会导致建议项主题变量滞后，系统主题切换时完整刷新。
              applyOverlayTheme('system');
            }
          };
          overlayMediaQuery.addEventListener('change', overlayThemeMediaListener);
          overlayThemeListenerAttached = true;
        }
        return;
      }
      stopOverlayPageThemeObserver();
      if (overlayThemeListenerAttached) {
        overlayMediaQuery.removeEventListener('change', overlayThemeMediaListener);
        overlayThemeMediaListener = null;
        overlayThemeListenerAttached = false;
      }
    };

    // 使用系统字体，避免外链字体依赖。

    overlayShell.appendOverlayStyleNodes(document, {
      root: overlayStyleRoot,
      openSansCssUrl: OPEN_SANS_CSS_URL,
      remixIconCssUrl: RI_CSS_URL,
      searchInputCssUrl: SEARCH_INPUT_CSS_URL,
      overlaySuggestionsCssUrl: OVERLAY_SUGGESTIONS_CSS_URL
    });

    overlayRevealGate = overlaySiteFixes && typeof overlaySiteFixes.createOverlayRevealGate === 'function'
      ? overlaySiteFixes.createOverlayRevealGate(window, {
        overlay,
        styleRoot: overlayStyleRoot || document.head || document.documentElement
      })
      : null;

    if (typeof window._x_extension_createSearchInput_2024_unique_ !== 'function') {
      console.warn('Lumno: input UI helper not available.');
      removeOverlay(overlay);
      return;
    }

    const initialLanguageReady = bootstrapOverlayLanguageForInitialRender().catch(() => {});

    const inputUsesIsolatedStyles = Boolean(overlayStyleRoot);
    const inputParts = window._x_extension_createSearchInput_2024_unique_({
      styleRoot: overlayStyleRoot,
      useIsolatedStyles: inputUsesIsolatedStyles,
      useInlineBaseStyles: !inputUsesIsolatedStyles,
      placeholder: t('overlay_search_placeholder', t('search_placeholder', defaultPlaceholderText)),
      inputId: '_x_extension_search_input_2024_unique_',
      iconId: '_x_extension_search_icon_2024_unique_',
      containerId: '_x_extension_input_container_2024_unique_',
      rightIconUrl: chrome.runtime.getURL('assets/images/lumno-input-light.png'),
      containerStyleOverrides: {
        height: '56px',
        'min-height': '56px',
        'max-height': '56px',
        overflow: 'visible'
      },
      inputStyleOverrides: {
        height: '56px',
        'min-height': '56px',
        'max-height': '56px',
        'line-height': '1.3',
        'padding-top': '0',
        'padding-bottom': '0',
        'padding-left': '50px',
        'padding-right': '92px'
      },
      rightIconStyleOverrides: {
        cursor: 'pointer',
        right: '50px'
      },
      showUnderlineWhenEmpty: true
    });
    const searchInput = inputParts.input;
    const inputContainer = inputParts.container;
    const rightIcon = inputParts.rightIcon;
    const setInputScopedStyle = (element, property, value) => {
      if (!element) {
        return;
      }
      element.style.setProperty(property, value, inputUsesIsolatedStyles ? '' : 'important');
    };
    applyNoTranslate(searchInput);
    applyNoTranslate(inputContainer);
    applyNoTranslate(rightIcon);
    const topActionTooltip = document.createElement('div');
    applyNoTranslate(topActionTooltip);
    topActionTooltip.id = '_x_extension_top_action_tooltip_2026_unique_';
    topActionTooltip.className = 'x-ov-top-action-tooltip';
    overlay.appendChild(topActionTooltip);
    let topActionTooltipHideTimer = null;
    const showTopActionTooltip = (button, text) => {
      if (!button || !text || !topActionTooltip) {
        return;
      }
      if (topActionTooltipHideTimer) {
        clearTimeout(topActionTooltipHideTimer);
        topActionTooltipHideTimer = null;
      }
      topActionTooltip.textContent = text;
      const isDark = overlay && overlay.getAttribute('data-theme') === 'dark';
      topActionTooltip.style.setProperty('--x-ov-tooltip-bg', isDark ? '#020617' : '#0F172A');
      topActionTooltip.style.setProperty('--x-ov-tooltip-text', '#F8FAFC');
      topActionTooltip.style.setProperty(
        '--x-ov-tooltip-border',
        isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(15, 23, 42, 0.12)'
      );
      topActionTooltip.style.setProperty(
        '--x-ov-tooltip-shadow',
        isDark ? '0 14px 30px rgba(0, 0, 0, 0.45)' : '0 10px 22px rgba(0, 0, 0, 0.18)'
      );
      const overlayRect = overlay.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const availableWidth = Math.max(180, Math.floor(overlayRect.width - 16));
      const resolvedMaxWidth = Math.min(420, availableWidth);
      topActionTooltip.style.setProperty('--x-ov-tooltip-max-width', `${resolvedMaxWidth}px`);
      topActionTooltip.removeAttribute('data-visible');
      const tooltipRect = topActionTooltip.getBoundingClientRect();
      const spacing = 10;
      let tooltipTop = Math.round(buttonRect.top - overlayRect.top - tooltipRect.height - spacing);
      if (tooltipTop < 8) {
        tooltipTop = Math.round(buttonRect.bottom - overlayRect.top + spacing);
      }
      let tooltipLeft = Math.round(
        buttonRect.left - overlayRect.left + (buttonRect.width - tooltipRect.width) / 2
      );
      const minLeft = 8;
      const maxLeft = Math.max(minLeft, Math.round(overlayRect.width - tooltipRect.width - 8));
      tooltipLeft = Math.max(minLeft, Math.min(maxLeft, tooltipLeft));
      topActionTooltip.style.setProperty('--x-ov-tooltip-top', `${tooltipTop}px`);
      topActionTooltip.style.setProperty('--x-ov-tooltip-left', `${tooltipLeft}px`);
      requestAnimationFrame(() => {
        topActionTooltip.setAttribute('data-visible', 'true');
      });
    };
    const hideTopActionTooltip = () => {
      if (!topActionTooltip) {
        return;
      }
      topActionTooltip.removeAttribute('data-visible');
      if (topActionTooltipHideTimer) {
        clearTimeout(topActionTooltipHideTimer);
      }
      topActionTooltipHideTimer = setTimeout(() => {
        topActionTooltip.removeAttribute('data-visible');
      }, 120);
    };
    const closeOtherTabsButton = document.createElement('button');
    applyNoTranslate(closeOtherTabsButton);
    closeOtherTabsButton.id = '_x_extension_search_close_other_tabs_2026_unique_';
    closeOtherTabsButton.className = 'x-ov-close-other-tabs';
    closeOtherTabsButton.type = 'button';
    closeOtherTabsButton.innerHTML = getRiSvg('ri-brush-2-line', 'ri-size-16');
    closeOtherTabsButton.setAttribute('aria-label', t('overlay_close_other_tabs_tooltip', '清理本页外的其他标签页（除置顶与群组）'));
    const resetCloseOtherTabsButtonVisualState = () => {
      closeOtherTabsButton.removeAttribute('data-hover-active');
    };
    resetCloseOtherTabsButtonVisualState();
    closeOtherTabsButton.addEventListener('mouseenter', () => {
      closeOtherTabsButton.setAttribute('data-hover-active', 'true');
    });
    closeOtherTabsButton.addEventListener('mouseleave', resetCloseOtherTabsButtonVisualState);
    closeOtherTabsButton.addEventListener('blur', resetCloseOtherTabsButtonVisualState);
    closeOtherTabsButton.addEventListener('pointerup', resetCloseOtherTabsButtonVisualState);
    closeOtherTabsButton.addEventListener('pointercancel', resetCloseOtherTabsButtonVisualState);
    inputContainer.appendChild(closeOtherTabsButton);
    modeBadge = document.createElement('div');
    modeBadge.id = '_x_extension_mode_badge_2024_unique_';
    applyNoTranslate(modeBadge);
    modeBadge.className = 'x-lumno-search-input-mode__badge';
    modeBadge.setAttribute('data-surface', 'overlay');
    modeBadge.setAttribute('data-visible', 'false');
    inputContainer.appendChild(modeBadge);

    const suggestionsContainer = document.createElement('div');
    applyNoTranslate(suggestionsContainer);
    suggestionsContainer.id = '_x_extension_suggestions_container_2024_unique_';
    suggestionsContainer.className = 'x-ov-suggestions-container';

    function updateInputRightPadding() {
      if (inputModeController) {
        inputModeController.updateLayout();
      }
    }

    function setSiteSearchTabHint(provider) {
      if (inputModeController) {
        inputModeController.setTabHintVisible(true, provider);
      }
    }

    function clearSiteSearchTabHint() {
      if (inputModeController) {
        inputModeController.setTabHintVisible(false);
      }
    }


    function applyLanguageStrings() {
      const settingsTooltipText = formatMessage('command_settings', '打开 Lumno 设置', { name: 'Lumno' });
      const closeOtherTooltipText = t('overlay_close_other_tabs_tooltip', '清理本页外的其他标签页（除置顶与群组）');
      if (searchInput) {
        defaultPlaceholderText = t('overlay_search_placeholder', t('search_placeholder', defaultPlaceholderText));
        if (!siteSearchState) {
          searchInput.placeholder = defaultPlaceholderText;
        }
      }
      if (rightIcon) {
        rightIcon.setAttribute('aria-label', settingsTooltipText);
      }
      if (closeOtherTabsButton) {
        closeOtherTabsButton.setAttribute('aria-label', closeOtherTooltipText);
      }
      if (modeBadge) {
        updateModeBadge(searchInput ? searchInput.value : '');
      }
      if (siteSearchState) {
        const activeSiteSearchProvider = siteSearchState;
        setSiteSearchPrefix(activeSiteSearchProvider, defaultTheme);
        getThemeForProvider(activeSiteSearchProvider).then((theme) => {
          if (siteSearchState === activeSiteSearchProvider) {
            setSiteSearchPrefix(activeSiteSearchProvider, theme);
          }
        });
        updateSiteSearchPrefixLayout();
      }
      if (latestOverlayQuery) {
        updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
      } else {
        requestTabsAndRender();
      }
    }

    function applyLanguageMode(mode) {
      overlayLanguageMode = mode || 'system';
      const targetLocale = overlayLanguageMode === 'system'
        ? getSystemLocale()
        : normalizeLocale(overlayLanguageMode);
      if (storageArea) {
        storageArea.get([LANGUAGE_MESSAGES_STORAGE_KEY], (result) => {
          const payload = result[LANGUAGE_MESSAGES_STORAGE_KEY];
          if (payload && payload.locale === targetLocale && payload.messages) {
            currentMessages = payload.messages || {};
            applyLanguageStrings();
            return;
          }
          loadLocaleMessages(targetLocale).then((messages) => {
            currentMessages = messages || {};
            applyLanguageStrings();
          });
        });
        return;
      }
      loadLocaleMessages(targetLocale).then((messages) => {
        currentMessages = messages || {};
        applyLanguageStrings();
      });
    }

    initialLanguageReady.then(() => {
      if (overlay && overlay.isConnected) {
        applyLanguageStrings();
      }
    });

    function getThemeModeLabel(mode) {
      if (mode === 'dark') {
        return t('theme_label_dark', '深色');
      }
      if (mode === 'light') {
        return t('theme_label_light', '浅色');
      }
      return t('theme_label_system', '跟随系统');
    }

    const commandDefinitions = [
      {
        type: 'commandNewTab',
        primary: '/new',
        aliases: ['/n', '/newtab', '/nt']
      },
      {
        type: 'commandSettings',
        primary: '/settings',
        aliases: ['/set', '/settings', '/s']
      }
    ];

    function getCommandMatch(rawInput) {
      const input = String(rawInput || '').trim().toLowerCase();
      if (!input.startsWith('/')) {
        return null;
      }
      for (let i = 0; i < commandDefinitions.length; i += 1) {
        const command = commandDefinitions[i];
        const tokens = [command.primary].concat(command.aliases || []);
        for (let j = 0; j < tokens.length; j += 1) {
          const token = tokens[j];
          if (token.startsWith(input) || input.startsWith(token)) {
            return {
              command: command,
              completion: command.primary
            };
          }
        }
      }
      return null;
    }

    function buildCommandSuggestion(command) {
      let titleText = '';
      if (command.type === 'commandSettings') {
        titleText = formatMessage('command_settings', '打开 Lumno 设置', {
          name: 'Lumno'
        });
      } else {
        titleText = t('command_newtab', '新建标签页');
      }
      return {
        type: command.type,
        title: titleText,
        url: '',
        commandText: command.primary,
        commandAliases: command.aliases || []
      };
    }

    function updateModeBadge(rawValue) {
      if (!modeBadge) {
        return;
      }
      const shouldShow = isModeCommand(rawValue || '');
      if (!shouldShow) {
        modeBadge.setAttribute('data-visible', 'false');
        updateInputRightPadding();
        return;
      }
      if (overlayThemeMode === 'system') {
        const pageTheme = detectPageTheme();
        if (pageTheme) {
          modeBadge.textContent = formatMessage('mode_badge_follow_site', '模式：{mode}（跟随网站）', {
            mode: getThemeModeLabel(pageTheme)
          });
        } else {
          const systemResolved = overlayMediaQuery.matches ? 'dark' : 'light';
          modeBadge.textContent = formatMessage('mode_badge_follow_system', '模式：{mode}（跟随系统）', {
            mode: getThemeModeLabel(systemResolved)
          });
        }
      } else {
        modeBadge.textContent = formatMessage('mode_badge', '模式：{mode}', {
          mode: getThemeModeLabel(overlayThemeMode)
        });
      }
      modeBadge.setAttribute('data-visible', 'true');
      updateInputRightPadding();
    }

    function getNextThemeMode(mode) {
      const order = ['system', 'light', 'dark'];
      const index = order.indexOf(mode);
      if (index === -1) {
        return 'light';
      }
      return order[(index + 1) % order.length];
    }

    function isModeCommand(input) {
      const raw = String(input || '').trim().toLowerCase();
      return raw === '/mode' || raw.startsWith('/mode ');
    }

    function buildModeSuggestion() {
      const nextMode = getNextThemeMode(overlayThemeMode || 'system');
      return {
        type: 'modeSwitch',
        title: formatMessage('mode_switch_title', `Lumno：切换到${getThemeModeLabel(nextMode)}模式`, {
          name: 'Lumno',
          mode: getThemeModeLabel(nextMode)
        }),
        url: '',
        favicon: chrome.runtime.getURL('assets/images/lumno.png'),
        nextMode: nextMode
      };
    }

    function applyThemeModeChange(mode) {
      const nextMode = mode || 'system';
      if (storageArea) {
        storageArea.set({ [THEME_STORAGE_KEY]: nextMode });
      }
      applyOverlayTheme(nextMode);
      if (isModeCommand(searchInput.value || '')) {
        updateSearchSuggestions([], (searchInput.value || '').trim());
      }
    }

    if (rightIcon) {
      const settingsTooltipText = () => formatMessage('command_settings', '打开 Lumno 设置', { name: 'Lumno' });
      rightIcon.addEventListener('mouseenter', function() {
        showTopActionTooltip(rightIcon, settingsTooltipText());
      });
      rightIcon.addEventListener('focus', function() {
        showTopActionTooltip(rightIcon, settingsTooltipText());
      });
      rightIcon.addEventListener('mouseleave', hideTopActionTooltip);
      rightIcon.addEventListener('blur', hideTopActionTooltip);
      rightIcon.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        hideTopActionTooltip();
        chrome.runtime.sendMessage({ action: 'openOptionsPage' });
        removeOverlay(overlay);
        if (clickOutsideHandler) {
          document.removeEventListener('click', clickOutsideHandler);
        }
        if (keydownHandler) {
          document.removeEventListener('keydown', keydownHandler);
        }
        if (captureTabHandler) {
          document.removeEventListener('keydown', captureTabHandler, true);
        }
      });
    }
    if (closeOtherTabsButton) {
      const closeOtherTooltipText = () => t('overlay_close_other_tabs_tooltip', '清理本页外的其他标签页（除置顶与群组）');
      closeOtherTabsButton.addEventListener('mouseenter', function() {
        showTopActionTooltip(closeOtherTabsButton, closeOtherTooltipText());
      });
      closeOtherTabsButton.addEventListener('focus', function() {
        showTopActionTooltip(closeOtherTabsButton, closeOtherTooltipText());
      });
      closeOtherTabsButton.addEventListener('mouseleave', hideTopActionTooltip);
      closeOtherTabsButton.addEventListener('blur', hideTopActionTooltip);
      closeOtherTabsButton.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        hideTopActionTooltip();
        chrome.runtime.sendMessage({ action: 'closeOtherTabsForOverlay' }, (response) => {
          resetCloseOtherTabsButtonVisualState();
          if (typeof closeOtherTabsButton.blur === 'function') {
            closeOtherTabsButton.blur();
          }
          if (!response || response.ok !== true) {
            return;
          }
          if (latestOverlayQuery) {
            chrome.runtime.sendMessage({
              action: 'getSearchSuggestions',
              query: latestOverlayQuery,
              context: 'overlay'
            }, (refreshResponse) => {
              const suggestions = refreshResponse && Array.isArray(refreshResponse.suggestions)
                ? refreshResponse.suggestions
                : [];
              updateSearchSuggestions(suggestions, latestOverlayQuery);
            });
            return;
          }
          requestTabsAndRender();
        });
      });
    }

    // Add focus styles
    searchInput.addEventListener('focus', function() {
      selectedIndex = -1;
      updateSelection();
    });

    searchInput.addEventListener('blur', function() {
      // Don't change selectedIndex here to allow keyboard navigation
    });

    function isImeCompositionEvent(event) {
      if (!event) {
        return isComposing;
      }
      return Boolean(
        isComposing ||
        event.isComposing ||
        event.keyCode === 229 ||
        event.which === 229 ||
        event.key === 'Process'
      );
    }
    const defaultPlaceholder = searchInput.placeholder;
    const initialSiteSearchProviders = Array.isArray(overlayContext && overlayContext.siteSearchProviders)
      ? overlayContext.siteSearchProviders
      : [];
    let siteSearchProvidersCache = initialSiteSearchProviders.length > 0
      ? initialSiteSearchProviders
      : null;
    let pendingProviderReload = false;
    const defaultSiteSearchProviders = typeof SEARCH_UTILS.getDefaultSiteSearchProviders === 'function'
      ? SEARCH_UTILS.getDefaultSiteSearchProviders()
      : initialSiteSearchProviders;
    const defaultAccentColor = [59, 130, 246];
    const themeColorCache = window._x_extension_theme_color_cache_2024_unique_ || new Map();
    window._x_extension_theme_color_cache_2024_unique_ = themeColorCache;
    const themeHostCache = window._x_extension_theme_host_cache_2024_unique_ || new Map();
    window._x_extension_theme_host_cache_2024_unique_ = themeHostCache;

    const overlayFaviconCacheApi = window.LumnoFaviconCache || window.LumnoNewtabFaviconCache;
    let overlayFaviconCacheRuntime = window._x_extension_overlay_favicon_cache_runtime_2026_unique_ || null;
    if (!overlayFaviconCacheRuntime &&
        overlayFaviconCacheApi &&
        typeof overlayFaviconCacheApi.createFaviconCache === 'function') {
      overlayFaviconCacheRuntime = overlayFaviconCacheApi.createFaviconCache({
        storageArea: (chrome && chrome.storage && chrome.storage.local) ? chrome.storage.local : null,
        windowObj: window,
        normalizeFaviconHost,
        isBlockedLocalFaviconUrl: isBlockedLocalFaviconCacheUrl
      });
      window._x_extension_overlay_favicon_cache_runtime_2026_unique_ = overlayFaviconCacheRuntime;
    }
    if (overlayFaviconCacheRuntime && typeof overlayFaviconCacheRuntime.ensureCachesReady === 'function') {
      overlayFaviconCacheRuntime.ensureCachesReady().then(() => {
        refreshOverlayThemeAwareFavicons();
      });
    }

    function getPersistedOverlayFaviconEntry(cacheKey) {
      return overlayFaviconCacheRuntime &&
        typeof overlayFaviconCacheRuntime.getPersistedEntry === 'function'
        ? overlayFaviconCacheRuntime.getPersistedEntry(cacheKey)
        : null;
    }

    function setPersistedOverlayFaviconUrl(cacheKey, url) {
      if (overlayFaviconCacheRuntime && typeof overlayFaviconCacheRuntime.setPersistedUrl === 'function') {
        overlayFaviconCacheRuntime.setPersistedUrl(cacheKey, url);
      }
    }

    function getPersistedOverlayFaviconDataEntry(cacheKey) {
      return overlayFaviconCacheRuntime &&
        typeof overlayFaviconCacheRuntime.getPersistedDataEntry === 'function'
        ? overlayFaviconCacheRuntime.getPersistedDataEntry(cacheKey)
        : null;
    }

    function setPersistedOverlayFaviconData(cacheKey, dataUrl) {
      if (overlayFaviconCacheRuntime && typeof overlayFaviconCacheRuntime.setPersistedData === 'function') {
        overlayFaviconCacheRuntime.setPersistedData(cacheKey, dataUrl);
      }
    }

    const faviconDataCache = window._x_extension_overlay_favicon_data_cache_2026_unique_ || new Map();
    window._x_extension_overlay_favicon_data_cache_2026_unique_ = faviconDataCache;
    const faviconDataPending = window._x_extension_overlay_favicon_data_pending_2026_unique_ || new Map();
    window._x_extension_overlay_favicon_data_pending_2026_unique_ = faviconDataPending;
    const iconPreloadCache = window._x_extension_overlay_icon_preload_cache_2026_unique_ || new Map();
    window._x_extension_overlay_icon_preload_cache_2026_unique_ = iconPreloadCache;
    const overlayFaviconRuntime = overlayFaviconView.createOverlayFaviconViewRuntime({
      document,
      windowObj: window,
      chromeApi: chrome,
      getRiSvg,
      getHostFromUrl,
      getGoogleFaviconUrl,
      getFaviconIsUrl,
      getSiteFaviconUrl,
      normalizeFaviconHost,
      shouldBlockFaviconForHost,
      isBlockedLocalFaviconUrl: isBlockedLocalFaviconCacheUrl,
      isFaviconProxyUrl,
      isChromeMonogramFaviconUrl: (url) => (
        typeof FAVICON_UTILS.isChromeMonogramFaviconUrl === 'function'
          ? FAVICON_UTILS.isChromeMonogramFaviconUrl(url)
          : /^chrome:\/\/favicon2\//i.test(String(url || '').trim())
      ),
      getKnownThemedFaviconCandidates: (hostname, preferredTheme) => (
        typeof FAVICON_UTILS.getKnownThemedFaviconCandidateUrls === 'function'
          ? FAVICON_UTILS.getKnownThemedFaviconCandidateUrls(hostname, preferredTheme, {
            getRuntimeUrl: (path) => chrome.runtime.getURL(path)
          })
          : []
      ),
      getRootFaviconCandidates: (hostname, preferredTheme) => (
        typeof FAVICON_UTILS.getRootFaviconCandidateUrls === 'function'
          ? FAVICON_UTILS.getRootFaviconCandidateUrls(hostname, preferredTheme)
          : []
      ),
      hostHasExplicitDarkFavicon: (hostname) => (
        typeof FAVICON_UTILS.hostHasExplicitDarkFavicon === 'function'
          ? FAVICON_UTILS.hostHasExplicitDarkFavicon(hostname)
          : false
      ),
      shouldSkipThemeUpgradeCandidate: shouldSkipOverlayThemeUpgradeCandidate,
      isOverlayDarkMode,
      preloadThemeFromFavicon,
      faviconDataCache,
      faviconDataPending,
      iconPreloadCache,
      getPersistedFaviconEntry: getPersistedOverlayFaviconEntry,
      setPersistedFaviconUrl: setPersistedOverlayFaviconUrl,
      getPersistedFaviconDataEntry: getPersistedOverlayFaviconDataEntry,
      setPersistedFaviconData: setPersistedOverlayFaviconData,
      getOverlayPanel: () => overlay,
      hasThemeForHost: (hostKey) => Boolean(hostKey && themeHostCache.has(hostKey))
    });
    const applyFaviconOpticalShift = overlayFaviconRuntime.applyFaviconOpticalShift;
    const applyFaviconOpticalAlignment = overlayFaviconRuntime.applyFaviconOpticalAlignment;
    const isBlockedLocalFaviconUrl = overlayFaviconRuntime.isBlockedLocalFaviconUrl;
    const requestFaviconData = overlayFaviconRuntime.requestFaviconData;
    const setFaviconSrcWithAnimation = overlayFaviconRuntime.setFaviconSrcWithAnimation;
    const attachFaviconData = overlayFaviconRuntime.attachFaviconData;
    const attachResolvedFaviconWithFallbacks = overlayFaviconRuntime.attachResolvedFaviconWithFallbacks;
    const refreshOverlayThemeAwareFavicons = overlayFaviconRuntime.refreshOverlayThemeAwareFavicons;
    const preloadIcon = overlayFaviconRuntime.preloadIcon;
    const warmIconCache = overlayFaviconRuntime.warmIconCache;
    const defaultCaretColor = searchInput.style.caretColor || 'var(--x-ext-input-caret, #7DB7FF)';
    const inputModePrefixTransition = 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 300ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms ease, box-shadow 180ms ease';

    function mixColor(color, target, amount) {
      return [
        Math.round(color[0] + (target[0] - color[0]) * amount),
        Math.round(color[1] + (target[1] - color[1]) * amount),
        Math.round(color[2] + (target[2] - color[2]) * amount)
      ];
    }

    function rgbToCss(rgb) {
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }

    function parseCssColor(color) {
      if (!color || typeof color !== 'string') {
        return null;
      }
      const trimmed = color.trim().toLowerCase();
      if (trimmed.startsWith('#')) {
        const hex = trimmed.slice(1);
        if (hex.length === 3) {
          const r = parseInt(hex[0] + hex[0], 16);
          const g = parseInt(hex[1] + hex[1], 16);
          const b = parseInt(hex[2] + hex[2], 16);
          if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
            return [r, g, b];
          }
        }
        if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
            return [r, g, b];
          }
        }
        return null;
      }
      const rgbMatch = trimmed.match(/^rgb\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)$/);
      if (rgbMatch) {
        const r = Number(rgbMatch[1]);
        const g = Number(rgbMatch[2]);
        const b = Number(rgbMatch[3]);
        if ([r, g, b].every((value) => Number.isFinite(value))) {
          return [r, g, b];
        }
      }
      return null;
    }

    function getHighlightColors(theme) {
      const resolvedTheme = getThemeForMode(theme);
      if (!resolvedTheme || !resolvedTheme._xIsBrand) {
        return {
          bg: 'var(--x-ov-hover-bg, #F3F4F6)',
          border: 'transparent'
        };
      }
      return {
        bg: resolvedTheme.highlightBg,
        border: resolvedTheme.highlightBorder
      };
    }

    function getLuminance(rgb) {
      const [r, g, b] = rgb.map((value) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function getReadableTextColor(bgRgb) {
      if (!bgRgb || bgRgb.length !== 3) {
        return '#111827';
      }
      const darkText = [17, 24, 39];
      const lightText = [248, 250, 252];
      const bgLum = getLuminance(bgRgb);
      const darkLum = getLuminance(darkText);
      const lightLum = getLuminance(lightText);
      const contrastWithDark = (Math.max(bgLum, darkLum) + 0.05) / (Math.min(bgLum, darkLum) + 0.05);
      const contrastWithLight = (Math.max(bgLum, lightLum) + 0.05) / (Math.min(bgLum, lightLum) + 0.05);
      return contrastWithDark >= contrastWithLight ? '#111827' : '#F8FAFC';
    }

    function normalizeAccentColor(rgb) {
      if (!rgb || rgb.length !== 3) {
        return defaultAccentColor;
      }
      const luminance = getLuminance(rgb);
      if (luminance < 0.12) {
        return mixColor(rgb, [255, 255, 255], 0.55);
      }
      if (luminance > 0.9) {
        return mixColor(rgb, [0, 0, 0], 0.2);
      }
      return rgb;
    }

    function buildThemeVariant(accent, mode) {
      const isDark = mode === 'dark';
      const base = isDark ? [48, 48, 48] : [255, 255, 255];
      const highlightBg = mixColor(accent, base, isDark ? 0.82 : 0.86);
      const highlightBorder = mixColor(accent, base, isDark ? 0.66 : 0.62);
      const markBg = mixColor(accent, base, isDark ? 0.74 : 0.78);
      const tagBg = mixColor(accent, base, isDark ? 0.76 : 0.74);
      const keyBg = mixColor(accent, base, isDark ? 0.88 : 0.9);
      const tagBorder = mixColor(accent, base, isDark ? 0.62 : 0.58);
      const keyBorder = mixColor(accent, base, isDark ? 0.7 : 0.18);
      const buttonBg = mixColor(accent, base, isDark ? 0.8 : 0.94);
      const buttonBorder = mixColor(accent, base, isDark ? 0.68 : 0.7);
      const buttonText = isDark
        ? getReadableTextColor(buttonBg)
        : (getLuminance(accent) > 0.8
          ? rgbToCss(mixColor(accent, [0, 0, 0], 0.6))
          : rgbToCss(accent));
      const placeholderText = isDark
        ? rgbToCss(mixColor(accent, [255, 255, 255], 0.2))
        : buttonText;
      return {
        accent: rgbToCss(accent),
        accentRgb: accent,
        highlightBg: rgbToCss(highlightBg),
        highlightBorder: rgbToCss(highlightBorder),
        markBg: rgbToCss(markBg),
        markText: getReadableTextColor(markBg),
        tagBg: rgbToCss(tagBg),
        tagText: getReadableTextColor(tagBg),
        tagBorder: rgbToCss(tagBorder),
        keyBg: rgbToCss(keyBg),
        keyText: getReadableTextColor(keyBg),
        keyBorder: rgbToCss(keyBorder),
        buttonText: buttonText,
        buttonBg: rgbToCss(buttonBg),
        buttonBorder: rgbToCss(buttonBorder),
        placeholderText: placeholderText
      };
    }

    function buildTheme(rgb) {
      const accent = normalizeAccentColor(rgb);
      return buildThemeVariant(accent, 'light');
    }

    const defaultTheme = buildTheme(defaultAccentColor);
    defaultTheme._xIsDefault = true;
    defaultTheme._xIsBrand = false;
    defaultTheme._xThemeSource = 'fallback';
    const urlHighlightTheme = buildTheme(defaultAccentColor);
    urlHighlightTheme._xIsBrand = true;
    urlHighlightTheme._xIsUrl = true;
    urlHighlightTheme._xThemeSource = 'url';
    const overlayThemeTokens = {
      light: {
        bg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.97) 0%, rgba(255, 255, 255, 0.95) 100%)',
        border: 'rgba(0, 0, 0, 0.14)',
        shadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 16px 40px rgba(15, 23, 42, 0.12), 0 40px 90px rgba(15, 23, 42, 0.12)',
        text: '#111827',
        subtext: '#6B7280',
        link: '#2563EB',
        placeholder: '#9CA3AF',
        hoverBg: 'rgba(200, 208, 218, 0.45)',
        tagBg: '#F3F4F6',
        tagText: '#6B7280',
        bookmarkTagBg: '#FEF3C7',
        bookmarkTagText: '#D97706',
        underline: '#E5E7EB',
        dividerOpacity: '0.5',
        dividerInset: '24px',
        blur: '14px',
        saturate: '175%'
      },
      dark: {
        bg: 'rgba(20, 20, 20, 0.62)',
        border: 'rgba(255, 255, 255, 0.16)',
        shadow: '0 24px 90px rgba(0, 0, 0, 0.65)',
        text: '#E5E7EB',
        subtext: '#9CA3AF',
        link: '#D1D5DB',
        placeholder: '#9CA3AF',
        hoverBg: 'rgba(255, 255, 255, 0.08)',
        tagBg: 'rgba(255, 255, 255, 0.12)',
        tagText: '#E5E7EB',
        bookmarkTagBg: 'rgba(245, 158, 11, 0.22)',
        bookmarkTagText: '#FBBF24',
        underline: 'rgba(255, 255, 255, 0.18)',
        dividerOpacity: '0.35',
        dividerInset: '24px',
        blur: '40px',
        saturate: '145%'
      }
    };
    function resolveOverlayTheme(mode) {
      if (mode === 'dark') {
        return 'dark';
      }
      if (mode === 'light') {
        return 'light';
      }
      const pageTheme = detectPageTheme();
      if (pageTheme) {
        return pageTheme;
      }
      return overlayMediaQuery.matches ? 'dark' : 'light';
    }

    function detectPageTheme() {
      const docEl = document.documentElement;
      const body = document.body;
      if (!docEl) {
        return null;
      }
      // Some sites use boolean dark/light attributes instead of data-theme tokens.
      if (docEl.hasAttribute('dark') || (body && body.hasAttribute('dark'))) {
        return 'dark';
      }
      if (docEl.hasAttribute('light') || (body && body.hasAttribute('light'))) {
        return 'light';
      }
      const darkAttrNode = document.querySelector(
        'html[dark], body[dark], ytd-app[dark], ytm-app[dark], [data-dark], [dark-mode], [theme="dark"], [color-scheme="dark"], [data-color-mode="dark"], [data-mode="dark"], [data-appearance="dark"]'
      );
      if (darkAttrNode) {
        return 'dark';
      }
      const lightAttrNode = document.querySelector(
        '[theme="light"], [color-scheme="light"], [data-color-mode="light"], [data-mode="light"], [data-appearance="light"]'
      );
      if (lightAttrNode) {
        return 'light';
      }
      const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
      if (colorSchemeMeta) {
        const metaContent = String(colorSchemeMeta.getAttribute('content') || '').toLowerCase();
        if (metaContent.includes('dark') && !metaContent.includes('light')) {
          return 'dark';
        }
        if (metaContent.includes('light') && !metaContent.includes('dark')) {
          return 'light';
        }
      }
      const schemeValue = (window.getComputedStyle(docEl).colorScheme || '').toLowerCase();
      if (schemeValue.includes('dark') && !schemeValue.includes('light')) {
        return 'dark';
      }
      if (schemeValue.includes('light') && !schemeValue.includes('dark')) {
        return 'light';
      }
      const attrCandidates = [
        docEl.getAttribute('data-theme'),
        docEl.getAttribute('data-color-scheme'),
        docEl.getAttribute('data-color-mode'),
        docEl.getAttribute('data-mode'),
        docEl.getAttribute('data-appearance'),
        docEl.getAttribute('color-scheme'),
        docEl.getAttribute('theme'),
        docEl.getAttribute('data-bs-theme'),
        body ? body.getAttribute('data-theme') : null,
        body ? body.getAttribute('data-color-scheme') : null,
        body ? body.getAttribute('data-color-mode') : null,
        body ? body.getAttribute('data-mode') : null,
        body ? body.getAttribute('data-appearance') : null,
        body ? body.getAttribute('color-scheme') : null,
        body ? body.getAttribute('theme') : null,
        body ? body.getAttribute('data-bs-theme') : null
      ];
      for (let i = 0; i < attrCandidates.length; i += 1) {
        const value = String(attrCandidates[i] || '').toLowerCase();
        if (!value) {
          continue;
        }
        if (
          value.includes('dark') ||
          value.includes('night') ||
          value === '1' ||
          value === 'true' ||
          value === 'on'
        ) {
          return 'dark';
        }
        if (
          value.includes('light') ||
          value.includes('day') ||
          value === '0' ||
          value === 'false' ||
          value === 'off'
        ) {
          return 'light';
        }
      }
      const classTokens = [
        docEl.className || '',
        body ? body.className || '' : ''
      ];
      for (let i = 0; i < classTokens.length; i += 1) {
        const classText = String(classTokens[i] || '').toLowerCase();
        const tokenList = classText.split(/\s+/);
        if (tokenList.includes('dark')) {
          return 'dark';
        }
        if (tokenList.includes('light')) {
          return 'light';
        }
        if (/(^|[\s_-])(dark|darkmode|dark-theme|theme-dark|night)([\s_-]|$)/.test(classText)) {
          return 'dark';
        }
        if (/(^|[\s_-])(light|lightmode|light-theme|theme-light|day)([\s_-]|$)/.test(classText)) {
          return 'light';
        }
      }
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        const themeColor = String(themeColorMeta.getAttribute('content') || '').trim();
        const rgb = parseCssColor(themeColor);
        if (rgb && rgb.length === 3) {
          return getLuminance(rgb) < 0.42 ? 'dark' : 'light';
        }
      }
      const bodyStyle = body ? window.getComputedStyle(body) : null;
      const docStyle = window.getComputedStyle(docEl);
      const bgColor = (bodyStyle && bodyStyle.backgroundColor && bodyStyle.backgroundColor !== 'transparent')
        ? bodyStyle.backgroundColor
        : docStyle.backgroundColor;
      const rgb = parseCssColor(bgColor);
      if (rgb && rgb.length === 3) {
        return getLuminance(rgb) < 0.42 ? 'dark' : 'light';
      }
      return null;
    }

    function scheduleOverlayPageThemeSync() {
      if (overlayPageThemeSyncRaf !== null) {
        return;
      }
      overlayPageThemeSyncRaf = requestAnimationFrame(() => {
        overlayPageThemeSyncRaf = null;
        if (!overlay || !overlay.isConnected || overlayThemeMode !== 'system') {
          return;
        }
        applyOverlayTheme('system');
      });
    }

    function startOverlayPageThemeObserver() {
      if (overlayPageThemeObserver || overlayThemeMode !== 'system') {
        return;
      }
      const themeAttrFilter = [
        'class',
        'style',
        'data-theme',
        'data-color-scheme',
        'data-color-mode',
        'data-mode',
        'data-appearance',
        'theme',
        'color-scheme',
        'dark',
        'light',
        'data-bs-theme'
      ];
      overlayPageThemeObserver = new MutationObserver(() => {
        scheduleOverlayPageThemeSync();
      });
      const docEl = document.documentElement;
      if (docEl) {
        overlayPageThemeObserver.observe(docEl, {
          attributes: true,
          attributeFilter: themeAttrFilter
        });
      }
      const body = document.body;
      if (body) {
        overlayPageThemeObserver.observe(body, {
          attributes: true,
          attributeFilter: themeAttrFilter
        });
      }
      const head = document.head;
      if (head) {
        overlayPageThemeObserver.observe(head, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['name', 'content', 'media']
        });
      }
      scheduleOverlayPageThemeSync();
    }

    function applyOverlayThemeVariables(target, mode) {
      if (!target) {
        return;
      }
      const resolved = resolveOverlayTheme(mode);
      const tokens = overlayThemeTokens[resolved] || overlayThemeTokens.light;
      target.setAttribute('data-theme', resolved);
      target.style.setProperty('--x-ov-bg', tokens.bg);
      target.style.setProperty('--x-ov-border', tokens.border);
      target.style.setProperty('--x-ov-shadow', tokens.shadow);
      target.style.setProperty('--x-ov-text', tokens.text);
      target.style.setProperty('--x-ov-subtext', tokens.subtext);
      target.style.setProperty('--x-ov-link', tokens.link);
      target.style.setProperty('--x-ov-placeholder', tokens.placeholder);
      target.style.setProperty('--x-ov-hover-bg', tokens.hoverBg);
      target.style.setProperty('--x-ov-tag-bg', tokens.tagBg);
      target.style.setProperty('--x-ov-tag-text', tokens.tagText);
      target.style.setProperty('--x-ov-bookmark-tag-bg', tokens.bookmarkTagBg);
      target.style.setProperty('--x-ov-bookmark-tag-text', tokens.bookmarkTagText);
      target.style.setProperty('--x-ov-blur', tokens.blur);
      target.style.setProperty('--x-ov-saturate', tokens.saturate);
      target.style.setProperty('--x-ext-input-text', tokens.text);
      target.style.setProperty('--x-ext-input-caret', tokens.link);
      target.style.setProperty('--x-ext-input-icon', tokens.subtext);
      target.style.setProperty('--x-ext-input-icon-hover-bg', tokens.hoverBg);
      target.style.setProperty('--x-ext-input-icon-hover', tokens.text);
      target.style.setProperty('--x-ext-input-underline', tokens.underline);
      target.style.setProperty('--x-ext-input-divider-inset', tokens.dividerInset);
      target.style.setProperty('--x-ext-input-divider-opacity', tokens.dividerOpacity);
    }

    function refreshOverlaySuggestionsFromLastResponse() {
      if (latestOverlayQuery) {
        updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
      }
    }

    if (storageArea) {
      storageArea.get([THEME_STORAGE_KEY], (result) => {
        applyOverlayTheme(result[THEME_STORAGE_KEY] || 'system');
      });
    }
    overlayThemeStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[THEME_STORAGE_KEY]) {
        return;
      }
      applyOverlayTheme(changes[THEME_STORAGE_KEY].newValue || 'system');
    };
    chrome.storage.onChanged.addListener(overlayThemeStorageListener);

    if (storageArea) {
      storageArea.get([LANGUAGE_STORAGE_KEY], (result) => {
        applyLanguageMode(result[LANGUAGE_STORAGE_KEY] || 'system');
      });
    }
    overlayLanguageStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName) {
        return;
      }
      if (changes[LANGUAGE_STORAGE_KEY]) {
        applyLanguageMode(changes[LANGUAGE_STORAGE_KEY].newValue || 'system');
      }
      if (changes[LANGUAGE_MESSAGES_STORAGE_KEY]) {
        const payload = changes[LANGUAGE_MESSAGES_STORAGE_KEY].newValue;
        const targetLocale = overlayLanguageMode === 'system'
          ? getSystemLocale()
          : normalizeLocale(overlayLanguageMode);
        if (payload && payload.locale === targetLocale && payload.messages) {
          currentMessages = payload.messages || {};
          applyLanguageStrings();
        }
      }
    };
    chrome.storage.onChanged.addListener(overlayLanguageStorageListener);

    loadOverlaySearchEngineState(refreshOverlaySuggestionsFromLastResponse);
    overlaySearchEngineStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[DEFAULT_SEARCH_ENGINE_STORAGE_KEY]) {
        return;
      }
      const nextValue = changes[DEFAULT_SEARCH_ENGINE_STORAGE_KEY].newValue;
      if (nextValue && nextValue.id) {
        overlaySearchEngineState = nextValue;
        if (latestOverlayQuery) {
          updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
        }
      }
    };
    chrome.storage.onChanged.addListener(overlaySearchEngineStorageListener);
    if (storageArea) {
      storageArea.get([SEARCH_RESULT_PRIORITY_STORAGE_KEY], (result) => {
        overlaySearchResultPriorityMode = normalizeSearchResultPriority(result[SEARCH_RESULT_PRIORITY_STORAGE_KEY]);
      });
    }
    loadOverlaySearchBlacklistItems(refreshOverlaySuggestionsFromLastResponse);
    overlaySearchResultPriorityStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[SEARCH_RESULT_PRIORITY_STORAGE_KEY]) {
        return;
      }
      overlaySearchResultPriorityMode = normalizeSearchResultPriority(changes[SEARCH_RESULT_PRIORITY_STORAGE_KEY].newValue);
      if (latestOverlayQuery) {
        updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
      }
    };
    chrome.storage.onChanged.addListener(overlaySearchResultPriorityStorageListener);
    overlaySearchBlacklistStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[SEARCH_BLACKLIST_STORAGE_KEY]) {
        return;
      }
      overlaySearchBlacklistItems = normalizeOverlaySearchBlacklistItems(
        changes[SEARCH_BLACKLIST_STORAGE_KEY].newValue
      );
      if (latestOverlayQuery) {
        updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
      }
    };
    chrome.storage.onChanged.addListener(overlaySearchBlacklistStorageListener);

    if (storageArea) {
      storageArea.get([OVERLAY_TAB_PRIORITY_STORAGE_KEY], (result) => {
        overlayTabQuickSwitchEnabled = normalizeOverlayTabPriorityMode(result[OVERLAY_TAB_PRIORITY_STORAGE_KEY]);
      });
    }
    overlayTabPriorityStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[OVERLAY_TAB_PRIORITY_STORAGE_KEY]) {
        return;
      }
      overlayTabQuickSwitchEnabled = normalizeOverlayTabPriorityMode(changes[OVERLAY_TAB_PRIORITY_STORAGE_KEY].newValue);
      if (latestOverlayQuery) {
        updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
      }
    };
    chrome.storage.onChanged.addListener(overlayTabPriorityStorageListener);
    if (storageArea) {
      storageArea.get([OVERLAY_SIZE_MODE_STORAGE_KEY], (result) => {
        overlaySizeMode = normalizeOverlaySizeMode(result[OVERLAY_SIZE_MODE_STORAGE_KEY]);
        applyOverlaySizeForPageZoom(overlay);
      });
    }
    overlaySizeStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[OVERLAY_SIZE_MODE_STORAGE_KEY]) {
        return;
      }
      overlaySizeMode = normalizeOverlaySizeMode(changes[OVERLAY_SIZE_MODE_STORAGE_KEY].newValue);
      applyOverlaySizeForPageZoom(overlay);
    };
    chrome.storage.onChanged.addListener(overlaySizeStorageListener);
    if (storageArea) {
      storageArea.get([TAB_RANK_SCORE_DEBUG_STORAGE_KEY], (result) => {
        overlayTabScoreDebugEnabled = normalizeTabRankScoreDebugMode(result[TAB_RANK_SCORE_DEBUG_STORAGE_KEY]);
      });
    }
    overlayTabScoreDebugStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[TAB_RANK_SCORE_DEBUG_STORAGE_KEY]) {
        return;
      }
      overlayTabScoreDebugEnabled = normalizeTabRankScoreDebugMode(changes[TAB_RANK_SCORE_DEBUG_STORAGE_KEY].newValue);
      if (!latestOverlayQuery || !latestOverlayQuery.trim()) {
        requestTabsAndRender();
      }
    };
    chrome.storage.onChanged.addListener(overlayTabScoreDebugStorageListener);

    function isOverlayDarkMode() {
      return overlay && overlay.getAttribute('data-theme') === 'dark';
    }

    function getThemeForMode(theme) {
      if (!theme) {
        return defaultTheme;
      }
      if (!isOverlayDarkMode()) {
        return theme;
      }
      if (theme._xDark) {
        return theme._xDark;
      }
      const accentRgb = theme.accentRgb || parseCssColor(theme.accent) || defaultAccentColor;
      const darkTheme = buildThemeVariant(accentRgb, 'dark');
      darkTheme._xIsDefault = Boolean(theme._xIsDefault);
      darkTheme._xIsBrand = Boolean(theme._xIsBrand);
      theme._xDark = darkTheme;
      return darkTheme;
    }

    function getHoverColors(theme) {
      const resolvedTheme = getThemeForMode(theme);
      const accentRgb = resolvedTheme.accentRgb || parseCssColor(resolvedTheme.accent) || defaultAccentColor;
      const isDark = isOverlayDarkMode();
      const base = isDark ? [48, 48, 48] : [255, 255, 255];
      return {
        bg: rgbToCss(mixColor(accentRgb, base, isDark ? 0.6 : 0.9)),
        border: rgbToCss(mixColor(accentRgb, base, isDark ? 0.4 : 0.72))
      };
    }

    function getNeutralHoverActionColors() {
      return isOverlayDarkMode()
        ? {
          bg: 'rgba(255, 255, 255, 0.10)',
          border: 'rgba(255, 255, 255, 0.18)',
          text: '#E5E7EB'
        }
        : {
          bg: 'rgba(200, 208, 218, 0.45)',
          border: 'rgba(148, 163, 184, 0.28)',
          text: '#4B5563'
        };
    }
    const brandAccentMap = {
      'github.com': [36, 41, 46],
      'docs.github.com': [36, 41, 46],
      'douban.com': [0, 181, 29],
      'zhihu.com': [23, 127, 255],
      'bilibili.com': [0, 174, 236],
      'youtube.com': [255, 0, 0],
      'youtu.be': [255, 0, 0],
      'google.com': [66, 133, 244],
      'chatgpt.com': [16, 163, 127],
      'gemini.google.com': [66, 133, 244],
      'doubao.com': [79, 70, 229],
      'qianwen.com': [37, 99, 235],
      'yuanbao.tencent.com': [0, 82, 217],
      'chat.minimax.io': [24, 119, 242],
      'chat.deepseek.com': [74, 107, 255],
      'kimi.com': [77, 92, 255],
      'bing.com': [0, 120, 215],
      'baidu.com': [41, 98, 255],
      'taobao.com': [255, 80, 0],
      'tmall.com': [226, 35, 26],
      'juejin.cn': [30, 128, 255],
      'reddit.com': [255, 69, 0],
      'wikipedia.org': [64, 64, 64],
      'zh.wikipedia.org': [64, 64, 64],
      'x.com': [17, 24, 39],
      'twitter.com': [29, 161, 242]
    };

    function normalizeHost(hostname) {
      if (!hostname) {
        return '';
      }
      const lower = String(hostname).toLowerCase();
      const stripped = lower.replace(/^www\./i, '');
      if (stripped === 'my.feishu.cn') {
        return 'feishu.cn';
      }
      return stripped;
    }

    function normalizeFaviconHost(hostname) {
      return typeof FAVICON_UTILS.normalizeFaviconHost === 'function'
        ? FAVICON_UTILS.normalizeFaviconHost(hostname)
        : String(hostname || '').toLowerCase().replace(/^www\./i, '');
    }

    function getGoogleFaviconUrl(hostname) {
      const normalized = normalizeFaviconHost(hostname);
      if (!normalized) {
        return '';
      }
      if (normalized === 'lumno.kubai.design') {
        return (chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function')
          ? chrome.runtime.getURL('assets/images/lumno.png')
          : 'https://lumno.kubai.design/favicon.png';
      }
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(normalized)}&sz=128`;
    }

    function getFaviconIsUrl(hostname) {
      const normalized = normalizeFaviconHost(hostname);
      if (!normalized) {
        return '';
      }
      return `https://favicon.is/${encodeURIComponent(normalized)}`;
    }

    function getBrandAccentForHost(hostname) {
      const host = String(hostname || '').toLowerCase();
      if (!host) {
        return null;
      }
      if (brandAccentMap[host]) {
        return brandAccentMap[host];
      }
      const entry = Object.keys(brandAccentMap).find((key) => host === key || host.endsWith(`.${key}`));
      return entry ? brandAccentMap[entry] : null;
    }

    function getBrandAccentForUrl(url) {
      if (!url) {
        return null;
      }
      try {
        const hostname = normalizeHost(new URL(url).hostname);
        return getBrandAccentForHost(hostname);
      } catch (e) {
        return null;
      }
    }

    function buildFallbackThemeForHost(hostname) {
      const theme = buildTheme(defaultAccentColor);
      theme._xIsDefault = true;
      theme._xIsBrand = false;
      theme._xThemeSource = 'fallback';
      theme._xIsFallback = true;
      return theme;
    }

    function getHostFromUrl(url) {
      if (!url) {
        return '';
      }
      try {
        return normalizeHost(new URL(url).hostname);
      } catch (e) {
        return '';
      }
    }

    function extractAverageColor(image) {
      const size = 16;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        return null;
      }
      try {
        context.drawImage(image, 0, 0, size, size);
        const data = context.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 32) {
            continue;
          }
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const brightness = (red + green + blue) / 3;
          if (brightness > 245) {
            continue;
          }
          r += red;
          g += green;
          b += blue;
          count += 1;
        }
        if (!count) {
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha < 32) {
              continue;
            }
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count += 1;
          }
        }
        if (!count) {
          return null;
        }
        return [
          Math.round(r / count),
          Math.round(g / count),
          Math.round(b / count)
        ];
      } catch (e) {
        return null;
      }
    }

    function isFaviconProxyUrl(url) {
      return typeof FAVICON_UTILS.isFaviconProxyUrl === 'function'
        ? FAVICON_UTILS.isFaviconProxyUrl(url)
        : false;
    }

    function isBlockedLocalFaviconCacheUrl(url) {
      return typeof FAVICON_UTILS.isBlockedLocalFaviconUrl === 'function'
        ? FAVICON_UTILS.isBlockedLocalFaviconUrl(url)
        : false;
    }

    function getThemeFromUrl(url, hostOverride) {
      if (!url) {
        return Promise.resolve(defaultTheme);
      }
      const hostKey = hostOverride || getHostFromUrl(url);
      if (isBlockedLocalFaviconUrl(url) || (hostKey && shouldBlockFaviconForHost(hostKey))) {
        const fallbackTheme = buildFallbackThemeForHost(hostKey);
        return Promise.resolve(fallbackTheme || defaultTheme);
      }
      const isProxy = isFaviconProxyUrl(url);
      const useHostCache = hostKey && (!isProxy || Boolean(hostOverride));
      if (useHostCache && themeHostCache.has(hostKey)) {
        return Promise.resolve(themeHostCache.get(hostKey));
      }
      if (themeColorCache.has(url)) {
        return Promise.resolve(themeColorCache.get(url));
      }
      const brandAccent = (isProxy && hostOverride) ? null : getBrandAccentForUrl(url);
      if (brandAccent) {
        const brandTheme = buildTheme(brandAccent);
        brandTheme._xIsBrand = true;
        themeColorCache.set(url, brandTheme);
        if (useHostCache) {
          themeHostCache.set(hostKey, brandTheme);
        }
        return Promise.resolve(brandTheme);
      }
      const cachedFaviconData = faviconDataCache.get(url);
      if (cachedFaviconData) {
        return new Promise((resolve) => {
          const image = new Image();
          image.onload = function() {
            const avg = extractAverageColor(image);
            if (!avg) {
              themeColorCache.set(url, defaultTheme);
              resolve(defaultTheme);
              return;
            }
            const theme = buildTheme(avg);
            theme._xIsBrand = true;
            themeColorCache.set(url, theme);
            if (useHostCache) {
              themeHostCache.set(hostKey, theme);
            }
            resolve(theme);
          };
          image.onerror = function() {
            themeColorCache.set(url, defaultTheme);
            resolve(defaultTheme);
          };
          image.src = cachedFaviconData;
        });
      }
      if (isProxy) {
        return requestFaviconData(url).then((dataUrl) => {
          if (!dataUrl) {
            themeColorCache.set(url, defaultTheme);
            return defaultTheme;
          }
          return new Promise((resolve) => {
            const image = new Image();
            image.onload = function() {
              const avg = extractAverageColor(image);
              if (!avg) {
                themeColorCache.set(url, defaultTheme);
                resolve(defaultTheme);
                return;
              }
              const theme = buildTheme(avg);
              theme._xIsBrand = true;
              themeColorCache.set(url, theme);
              if (useHostCache) {
                themeHostCache.set(hostKey, theme);
              }
              resolve(theme);
            };
            image.onerror = function() {
              themeColorCache.set(url, defaultTheme);
              resolve(defaultTheme);
            };
            image.src = dataUrl;
          });
        });
      }
      return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = function() {
          const avg = extractAverageColor(image);
          if (!avg) {
            themeColorCache.set(url, defaultTheme);
            resolve(defaultTheme);
            return;
          }
          const theme = buildTheme(avg);
          theme._xIsBrand = true;
          themeColorCache.set(url, theme);
          if (useHostCache) {
            themeHostCache.set(hostKey, theme);
          }
          resolve(theme);
        };
        image.onerror = function() {
          themeColorCache.set(url, defaultTheme);
          resolve(defaultTheme);
        };
        image.src = url;
      });
    }

    function getProviderThemeHost(provider) {
      return normalizeHost(getProviderHost(provider));
    }

    function buildAndCacheBrandThemeForHost(hostKey, iconUrl) {
      const normalizedHost = normalizeHost(hostKey);
      if (!normalizedHost) {
        return null;
      }
      const brandAccent = getBrandAccentForHost(normalizedHost);
      if (!brandAccent) {
        return null;
      }
      const brandTheme = buildTheme(brandAccent);
      brandTheme._xIsBrand = true;
      themeHostCache.set(normalizedHost, brandTheme);
      if (iconUrl) {
        themeColorCache.set(iconUrl, brandTheme);
      }
      return brandTheme;
    }

    function getThemeForProvider(provider) {
      const hostKey = getProviderThemeHost(provider);
      const iconUrl = getProviderIcon(provider);
      if (hostKey && themeHostCache.has(hostKey)) {
        return Promise.resolve(themeHostCache.get(hostKey));
      }
      if (iconUrl && themeColorCache.has(iconUrl)) {
        return Promise.resolve(themeColorCache.get(iconUrl));
      }
      const brandTheme = buildAndCacheBrandThemeForHost(hostKey, iconUrl);
      if (brandTheme) {
        return Promise.resolve(brandTheme);
      }
      return getThemeFromUrl(iconUrl, hostKey);
    }

    function shouldUseBrandTheme(suggestion) {
      if (!suggestion) {
        return false;
      }
    const neutralTypes = ['googleSuggest', 'newtab', 'modeSwitch', 'chatgpt', 'perplexity', 'commandNewTab', 'commandSettings'];
      if (neutralTypes.includes(suggestion.type)) {
        return false;
      }
      return true;
    }

    function getThemeForSuggestion(suggestion) {
      if (!shouldUseBrandTheme(suggestion)) {
        return Promise.resolve(defaultTheme);
      }
      if (suggestion && suggestion.provider) {
        return getThemeForProvider(suggestion.provider);
      }
      if (suggestion && suggestion.url) {
        const brandAccent = getBrandAccentForUrl(suggestion.url);
        if (brandAccent) {
          const brandTheme = buildTheme(brandAccent);
          brandTheme._xIsBrand = true;
          return Promise.resolve(brandTheme);
        }
      }
      const hostKey = suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : '';
      if (hostKey && shouldBlockFaviconForHost(hostKey)) {
        const fallbackTheme = buildFallbackThemeForHost(hostKey);
        return Promise.resolve(fallbackTheme || defaultTheme);
      }
      const siteFavicon = hostKey ? getSiteFaviconUrl(hostKey) : '';
      if (siteFavicon) {
        return getThemeFromUrl(siteFavicon, hostKey).then((theme) => {
          if (theme && !theme._xIsDefault) {
            return theme;
          }
          return getThemeFromUrl(getThemeSourceForSuggestion(suggestion), hostKey);
        });
      }
      return getThemeFromUrl(getThemeSourceForSuggestion(suggestion), hostKey);
    }

    function getImmediateThemeForSuggestion(suggestion) {
      if (!shouldUseBrandTheme(suggestion)) {
        return defaultTheme;
      }
      if (suggestion && suggestion.provider) {
        const hostKey = getProviderThemeHost(suggestion.provider);
        const iconUrl = getProviderIcon(suggestion.provider);
        if (hostKey && themeHostCache.has(hostKey)) {
          return themeHostCache.get(hostKey);
        }
        if (iconUrl && themeColorCache.has(iconUrl)) {
          return themeColorCache.get(iconUrl);
        }
        const brandTheme = buildAndCacheBrandThemeForHost(hostKey, iconUrl);
        if (brandTheme) {
          return brandTheme;
        }
        const fallbackTheme = buildFallbackThemeForHost(hostKey);
        if (fallbackTheme) {
          return fallbackTheme;
        }
      }
      if (suggestion && suggestion.url) {
        const hostKey = getHostFromUrl(suggestion.url);
        if (hostKey && themeHostCache.has(hostKey)) {
          return themeHostCache.get(hostKey);
        }
        if (themeColorCache.has(suggestion.url)) {
          return themeColorCache.get(suggestion.url);
        }
        const brandAccent = getBrandAccentForUrl(suggestion.url);
        if (brandAccent) {
          const brandTheme = buildTheme(brandAccent);
          brandTheme._xIsBrand = true;
          return brandTheme;
        }
        const fallbackTheme = buildFallbackThemeForHost(hostKey);
        if (fallbackTheme) {
          return fallbackTheme;
        }
      }
      return null;
    }

    function applyThemeVariables(target, theme) {
      if (!target || !theme) {
        return;
      }
      const resolvedTheme = getThemeForMode(theme);
      target.style.setProperty('--x-ext-mark-bg', resolvedTheme.markBg);
      target.style.setProperty('--x-ext-mark-text', resolvedTheme.markText);
      target.style.setProperty('--x-ext-tag-bg', resolvedTheme.tagBg);
      target.style.setProperty('--x-ext-tag-text', resolvedTheme.tagText);
      target.style.setProperty('--x-ext-tag-border', resolvedTheme.tagBorder);
      target.style.setProperty('--x-ext-key-bg', resolvedTheme.keyBg);
      target.style.setProperty('--x-ext-key-text', resolvedTheme.keyText);
      target.style.setProperty('--x-ext-key-border', resolvedTheme.keyBorder);
      target.style.setProperty('--x-ext-icon-color', resolvedTheme.accent);
    }

    function applyMarkVariables(target, theme) {
      if (!target || !theme) {
        return;
      }
      const resolvedTheme = getThemeForMode(theme);
      target.style.setProperty('--x-ext-mark-bg', resolvedTheme.markBg);
      target.style.setProperty('--x-ext-mark-text', resolvedTheme.markText);
    }

    function preloadThemeFromFavicon(url, dataUrl, hostOverride) {
      if (!url || themeColorCache.has(url)) {
        return;
      }
      const hostKey = hostOverride || getHostFromUrl(url);
      const useHostCache = hostKey && (Boolean(hostOverride) || !isFaviconProxyUrl(url));
      if (useHostCache && themeHostCache.has(hostKey)) {
        return;
      }
      if (!dataUrl) {
        return;
      }
      const image = new Image();
      image.onload = function() {
        const avg = extractAverageColor(image);
        if (!avg) {
          return;
        }
        const theme = buildTheme(avg);
        theme._xIsBrand = true;
        themeColorCache.set(url, theme);
        if (useHostCache) {
          themeHostCache.set(hostKey, theme);
        }
      };
      image.onerror = function() {};
      image.src = dataUrl;
    }

    function createSuggestionInlineIcon(iconName, tone) {
      const icon = document.createElement('span');
      icon.className = 'x-ov-suggestion-inline-icon';
      if (tone) {
        icon.setAttribute('data-tone', tone);
      }
      icon.innerHTML = getRiSvg(iconName, 'ri-size-16');
      return icon;
    }

    function createSearchIcon(tone) {
      return createSuggestionInlineIcon('ri-search-line', tone);
    }

    function createLinkIcon() {
      return createSuggestionInlineIcon('ri-link');
    }

    function getNonFaviconIconBg() {
      return isOverlayDarkMode() ? 'rgba(255, 255, 255, 0.12)' : '#FFFFFF';
    }

    function getOverlayActionTagPalette() {
      if (isOverlayDarkMode()) {
        return {
          tagBg: 'rgba(59, 130, 246, 0.22)',
          tagText: '#DBEAFE',
          tagBorder: 'rgba(147, 197, 253, 0.52)',
          keyBg: 'rgba(15, 23, 42, 0.45)',
          keyText: '#DBEAFE',
          keyBorder: 'rgba(147, 197, 253, 0.46)'
        };
      }
      return {
        tagBg: '#EEF6FF',
        tagText: '#1E3A8A',
        tagBorder: '#BFDBFE',
        keyBg: '#FFFFFF',
        keyText: '#1E3A8A',
        keyBorder: '#BFDBFE'
      };
    }

    function setNonFaviconIconBg(item, isActive) {
      if (!item || !item._xIconWrap || item._xIconIsFavicon) {
        return;
      }
      item._xIconWrap.style.setProperty(
        'background-color',
        isActive ? getNonFaviconIconBg() : 'transparent'
      );
    }

    function createActionTag(labelText, keyLabel) {
      const tag = document.createElement('span');
      tag.className = 'x-ov-action-tag';
      applyNoTranslate(tag);

      const label = document.createElement('span');
      label.className = 'x-ov-action-tag__label';
      setProtectedPlainText(label, labelText);

      const keycap = document.createElement('span');
      keycap.className = 'x-ov-action-tag__key';
      setProtectedPlainText(keycap, keyLabel);

      tag.appendChild(label);
      tag.appendChild(keycap);
      return tag;
    }

    function getSuggestionActionLabel(action) {
      switch (action) {
        case 'search':
          return getSearchActionLabel();
        case 'switch':
          return t('action_switch', '切换');
        case 'open':
          return t('action_open', '打开');
        case 'openNewTab':
          return t('action_open_new_tab', '新开');
        case 'go':
          return t('action_go_current_tab', '前往');
        case 'commandNewTab':
          return t('command_newtab', '新建标签页');
        case 'commandSettings':
          return formatMessage('command_settings', '打开 {name} 设置', { name: 'Lumno' });
        default:
          return t('action_open_new_tab', '新开');
      }
    }

    function setSuggestionVisitButtonContent(button, action) {
      setInlineLabelWithIcon(
        button,
        getSuggestionActionLabel(action),
        getRiSvg('ri-arrow-right-line', 'ri-size-12')
      );
    }

    function createSuggestionActionModel(optionsArg) {
      if (SUGGESTION_ACTION_MODEL &&
          typeof SUGGESTION_ACTION_MODEL.createSearchActionModel === 'function') {
        return SUGGESTION_ACTION_MODEL.createSearchActionModel(optionsArg);
      }
      return {
        actionTags: [],
        visitButtonAction: 'openNewTab',
        alwaysHideVisitButton: false,
        hasActionTags: false,
        hasSwitchAction: false,
        hideSourceTags: false
      };
    }

    function getThemeSourceForSuggestion(suggestion) {
      if (suggestion && suggestion.provider) {
        const hostKey = getProviderThemeHost(suggestion.provider);
        if (hostKey && shouldBlockFaviconForHost(hostKey)) {
          return '';
        }
        return getProviderIcon(suggestion.provider) || (hostKey ? getGoogleFaviconUrl(hostKey) : '');
      }
      if (suggestion && suggestion.url) {
        try {
          const hostname = normalizeHost(new URL(suggestion.url).hostname);
          if (hostname) {
            if (shouldBlockFaviconForHost(hostname)) {
              return '';
            }
            return getGoogleFaviconUrl(hostname) || getFaviconIsUrl(hostname);
          }
        } catch (e) {
          // Ignore malformed URLs.
        }
      }
      return suggestion && suggestion.favicon ? suggestion.favicon : '';
    }

    function getSiteFaviconUrl(hostname) {
      if (!hostname) {
        return '';
      }
      return `https://${hostname}/favicon.ico`;
    }

    inputModeController = SEARCH_INPUT_MODE.createInputModeController(inputParts, {
      surface: 'overlay',
      useImportantStyles: !inputUsesIsolatedStyles,
      prefixTransition: inputModePrefixTransition,
      defaultPlaceholder: defaultPlaceholderText || defaultPlaceholder,
      getDefaultPlaceholder: () => defaultPlaceholderText || defaultPlaceholder,
      defaultCaretColor,
      modeBadgeElement: modeBadge,
      rightReserveBase: 92,
      rightAnchorOffset: 86,
      baseInputPaddingLeft: 50,
      setInputStyle: setInputScopedStyle,
      applyNoTranslate,
      getThemeForMode,
      defaultTheme,
      defaultAccentColor,
      parseCssColor,
      rgbToCss,
      isDarkMode: isOverlayDarkMode,
      getProviderIcon,
      getProviderThemeHost,
      getSiteSearchPrefixText,
      getSiteSearchDisplayName,
      isAiSiteSearchProvider,
      attachFaviconData,
      formatMessage,
      isTabHintSuppressed: () => Boolean(siteSearchState || openTabsSearchModeActive)
    });

    function updateSiteSearchPrefixLayout() {
      if (inputModeController) {
        inputModeController.updateLayout();
      }
    }

    function setSiteSearchPrefix(provider, theme, options) {
      if (inputModeController) {
        inputModeController.setProviderPrefix(provider, theme, options);
      }
    }

    function setOpenTabsSearchPrefix(theme) {
      if (inputModeController) {
        inputModeController.setPrefixText(
          t('search_open_tabs_only_entry', '搜索已打开标签页'),
          theme
        );
      }
    }

    function clearSiteSearchPrefix() {
      if (inputModeController) {
        inputModeController.clearProviderPrefix();
      }
    }

    function isEnglishQuery(query) {
      if (!query) {
        return false;
      }
      return /^[A-Za-z0-9\s._/-]+$/.test(query);
    }

    function getUrlDisplay(url) {
      if (!url) {
        return '';
      }
      try {
        const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./i, '');
        const path = parsed.pathname === '/' ? '' : parsed.pathname;
        return `${host}${path}${parsed.search || ''}${parsed.hash || ''}`;
      } catch (e) {
        return url;
      }
    }

    function normalizeTabSearchToken(value) {
      return String(value || '').trim().toLowerCase();
    }

    function buildTabSearchText(tab) {
      if (!tab) {
        return '';
      }
      const parts = [];
      if (tab.title) {
        parts.push(String(tab.title));
      }
      if (tab.url) {
        parts.push(String(tab.url));
      }
      try {
        const parsed = new URL(tab.url || '');
        if (parsed.hostname) {
          parts.push(parsed.hostname);
        }
        if (parsed.pathname) {
          parts.push(parsed.pathname);
        }
      } catch (e) {
        // Ignore malformed URLs.
      }
      return parts.join(' ').toLowerCase();
    }

    function filterTabsForOverlay(tabList, queryText) {
      const list = Array.isArray(tabList) ? tabList : [];
      const normalized = normalizeTabSearchToken(queryText);
      if (!normalized) {
        if (list.length < 2 || typeof currentOverlayTabId !== 'number') {
          return list.slice();
        }
        if (!list[0] || list[0].id !== currentOverlayTabId) {
          return list.slice();
        }
        const reordered = list.slice();
        const currentTab = reordered.shift();
        if (currentTab) {
          reordered.splice(1, 0, currentTab);
        }
        return reordered;
      }
      const tokens = normalized.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) {
        return list.slice();
      }
      return list.filter((tab) => {
        const haystack = buildTabSearchText(tab);
        if (!haystack) {
          return false;
        }
        return tokens.every((token) => haystack.includes(token));
      });
    }

    function normalizeTabMatchUrl(url) {
      if (!url) {
        return '';
      }
      try {
        const parsed = new URL(url);
        const protocol = String(parsed.protocol || '').toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') {
          return String(url).trim().toLowerCase();
        }
        const host = normalizeHost(parsed.hostname);
        let path = parsed.pathname || '/';
        path = path.replace(/\/+$/, '');
        if (!path) {
          path = '/';
        }
        return `${host}${path}${parsed.search || ''}`;
      } catch (e) {
        return String(url).trim().toLowerCase();
      }
    }

    function normalizeTabMatchUrlWithoutSearch(url) {
      if (!url) {
        return '';
      }
      try {
        const parsed = new URL(url);
        const protocol = String(parsed.protocol || '').toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') {
          return String(url).trim().toLowerCase();
        }
        const host = normalizeHost(parsed.hostname);
        let path = parsed.pathname || '/';
        path = path.replace(/\/+$/, '');
        if (!path) {
          path = '/';
        }
        return `${host}${path}`;
      } catch (e) {
        return String(url).trim().toLowerCase();
      }
    }

    function getMatchedOpenTabIdForSuggestion(suggestion) {
      if (!suggestion || !suggestion.url || !Array.isArray(tabs) || tabs.length === 0) {
        return null;
      }
      const target = normalizeTabMatchUrl(suggestion.url);
      if (!target) {
        return null;
      }
      for (let i = 0; i < tabs.length; i += 1) {
        const tab = tabs[i];
        if (!tab || typeof tab.id !== 'number' || !tab.url) {
          continue;
        }
        const current = normalizeTabMatchUrl(tab.url);
        if (current && current === target) {
          return tab.id;
        }
      }
      if (prioritizeCurrentPageMatch && typeof currentOverlayTabId === 'number') {
        const currentTab = tabs.find((tab) => tab && tab.id === currentOverlayTabId) || null;
        const targetNoSearch = normalizeTabMatchUrlWithoutSearch(suggestion.url);
        const currentNoSearch = currentTab ? normalizeTabMatchUrlWithoutSearch(currentTab.url) : '';
        if (targetNoSearch && currentNoSearch && targetNoSearch === currentNoSearch) {
          return currentOverlayTabId;
        }
      }
      return null;
    }

    function isCurrentOverlayTabUrl(url) {
      if (!prioritizeCurrentPageMatch || !url) {
        return false;
      }
      const currentTab = typeof currentOverlayTabId === 'number'
        ? (tabs.find((tab) => tab && tab.id === currentOverlayTabId) || null)
        : null;
      const currentUrl = currentTab && currentTab.url
        ? currentTab.url
        : initialContextTabUrl;
      if (!currentUrl) {
        return false;
      }
      const targetFull = normalizeTabMatchUrl(url);
      const currentFull = normalizeTabMatchUrl(currentUrl);
      if (targetFull && currentFull && targetFull === currentFull) {
        return true;
      }
      const targetNoSearch = normalizeTabMatchUrlWithoutSearch(url);
      const currentNoSearch = normalizeTabMatchUrlWithoutSearch(currentUrl);
      return Boolean(targetNoSearch && currentNoSearch && targetNoSearch === currentNoSearch);
    }

    function getAutocompleteCandidate(allSuggestions, rawQuery) {
      if (!Array.isArray(allSuggestions) || !rawQuery) {
        return null;
      }
      const rawLower = rawQuery.toLowerCase();
      const passes = [true, false];
      for (let passIndex = 0; passIndex < passes.length; passIndex += 1) {
        const skipGoogleSuggest = passes[passIndex];
        for (let i = 0; i < allSuggestions.length; i += 1) {
          const suggestion = allSuggestions[i];
          if (!suggestion || suggestion.type === 'newtab') {
            continue;
          }
          if (skipGoogleSuggest && suggestion.type === 'googleSuggest') {
            continue;
          }
          if (suggestion.commandText) {
            const commandText = String(suggestion.commandText).toLowerCase();
            if (commandText.startsWith(rawLower)) {
              return {
                completion: suggestion.commandText,
                url: '',
                title: suggestion.title || '',
                type: 'command'
              };
            }
            const aliases = Array.isArray(suggestion.commandAliases) ? suggestion.commandAliases : [];
            for (let aliasIndex = 0; aliasIndex < aliases.length; aliasIndex += 1) {
              const alias = String(aliases[aliasIndex] || '').toLowerCase();
              if (alias && alias.startsWith(rawLower)) {
                return {
                  completion: aliases[aliasIndex],
                  url: '',
                  title: suggestion.title || '',
                  type: 'command'
                };
              }
            }
          }
          const urlText = getUrlDisplay(suggestion.url);
          if (urlText && urlText.toLowerCase().startsWith(rawLower)) {
            return {
              completion: urlText,
              url: suggestion.url || '',
              title: suggestion.title || '',
              type: 'url'
            };
          }
          const titleText = suggestion.title || '';
          if (titleText && titleText.toLowerCase().startsWith(rawLower)) {
            return {
              completion: titleText,
              url: suggestion.url || '',
              title: suggestion.title || '',
              type: 'title'
            };
          }
        }
      }
      return null;
    }

    function getDomainPrefixCandidate(allSuggestions, rawQuery) {
      if (!Array.isArray(allSuggestions) || !rawQuery) {
        return null;
      }
      const rawLower = rawQuery.toLowerCase();
      for (let i = 0; i < allSuggestions.length; i += 1) {
        const suggestion = allSuggestions[i];
        if (!suggestion || suggestion.type === 'newtab') {
          continue;
        }
        const urlText = getUrlDisplay(suggestion.url);
        if (!urlText) {
          continue;
        }
        const host = urlText.split('/')[0] || '';
        if (host.toLowerCase().startsWith(rawLower)) {
          return {
            completion: urlText,
            url: suggestion.url || '',
            title: suggestion.title || '',
            type: 'url'
          };
        }
      }
      return null;
    }

    function getAutocompleteCandidateFromSuggestion(suggestion, rawQuery) {
      if (!suggestion || !rawQuery || suggestion.type === 'newtab') {
        return null;
      }
      const rawLower = rawQuery.toLowerCase();
      if (suggestion.commandText) {
        const commandText = String(suggestion.commandText).toLowerCase();
        if (commandText.startsWith(rawLower)) {
          return {
            completion: suggestion.commandText,
            url: '',
            title: suggestion.title || '',
            type: 'command'
          };
        }
        const aliases = Array.isArray(suggestion.commandAliases) ? suggestion.commandAliases : [];
        for (let aliasIndex = 0; aliasIndex < aliases.length; aliasIndex += 1) {
          const alias = String(aliases[aliasIndex] || '');
          if (alias.toLowerCase().startsWith(rawLower)) {
            return {
              completion: alias,
              url: '',
              title: suggestion.title || '',
              type: 'command'
            };
          }
        }
      }
      const urlText = getUrlDisplay(suggestion.url);
      if (urlText) {
        const host = urlText.split('/')[0] || '';
        if (host.toLowerCase().startsWith(rawLower) || urlText.toLowerCase().startsWith(rawLower)) {
          return {
            completion: urlText,
            url: suggestion.url || '',
            title: suggestion.title || '',
            type: 'url'
          };
        }
      }
      const titleText = suggestion.title || '';
      if (titleText && titleText.toLowerCase().startsWith(rawLower)) {
        return {
          completion: titleText,
          url: suggestion.url || '',
          title: suggestion.title || '',
          type: 'title'
        };
      }
      return null;
    }

    function clearAutocomplete() {
      autocompleteState = null;
    }

    function dismissAutocompletePreviewOnNonTabKey(event) {
      if (!event || event.key === 'Tab' || event.key === 'Enter') {
        return false;
      }
      const isModifierOnly = event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta';
      if (isModifierOnly) {
        return false;
      }
      if (!autocompleteState || !autocompleteState.completion) {
        return false;
      }
      const rawQuery = typeof autocompleteState.rawQuery === 'string'
        ? autocompleteState.rawQuery
        : String(latestRawInputValue || '');
      if (searchInput && searchInput.value !== rawQuery) {
        searchInput.value = rawQuery;
        searchInput.setSelectionRange(rawQuery.length, rawQuery.length);
      }
      latestRawInputValue = rawQuery;
      latestOverlayQuery = rawQuery.trim();
      clearAutocomplete();
      return true;
    }

    function applyAutocomplete(allSuggestions, primarySuggestion, primaryHighlightReason) {
      const rawQuery = latestRawInputValue;
      const trimmedQuery = rawQuery.trim();
      if (overlaySearchResultPriorityMode === 'search') {
        if (searchInput && searchInput.value !== rawQuery) {
          searchInput.value = rawQuery;
          searchInput.setSelectionRange(rawQuery.length, rawQuery.length);
        }
        clearAutocomplete();
        return;
      }
      if (Date.now() - lastDeletionAt < 250) {
        clearAutocomplete();
        return;
      }
      if (siteSearchState) {
        clearAutocomplete();
        return;
      }
      if (!isEnglishQuery(trimmedQuery) || !rawQuery) {
        clearAutocomplete();
        return;
      }
      if (!allSuggestions || !Array.isArray(allSuggestions)) {
        clearAutocomplete();
        return;
      }
      if (searchInput.selectionStart !== searchInput.value.length || searchInput.selectionEnd !== searchInput.value.length) {
        return;
      }
      const shouldForcePrimaryAlignment = Boolean(
        primarySuggestion &&
        primaryHighlightReason &&
        primaryHighlightReason !== 'autocomplete' &&
        primaryHighlightReason !== 'default'
      );
      let candidate = null;
      if (primarySuggestion) {
        candidate = getAutocompleteCandidateFromSuggestion(primarySuggestion, rawQuery);
      }
      if (!candidate && shouldForcePrimaryAlignment) {
        clearAutocomplete();
        return;
      }
      if (!candidate) {
        candidate = getDomainPrefixCandidate(allSuggestions, rawQuery) ||
          getAutocompleteCandidate(allSuggestions, rawQuery);
      }
      if (!candidate || !candidate.completion) {
        clearAutocomplete();
        return;
      }
      if (candidate.type === 'title') {
        clearAutocomplete();
        return;
      }
      if (candidate.completion.length <= rawQuery.length) {
        clearAutocomplete();
        return;
      }
      if (!candidate.completion.toLowerCase().startsWith(rawQuery.toLowerCase())) {
        clearAutocomplete();
        return;
      }
      const displayText = candidate.completion;
      searchInput.value = displayText;
      searchInput.setSelectionRange(rawQuery.length, displayText.length);
      autocompleteState = {
        completion: candidate.completion,
        displayText: displayText,
        url: candidate.url || '',
        rawQuery: rawQuery,
        title: candidate.title || '',
        type: candidate.type || ''
      };
    }

    function buildSearchUrl(template, query) {
      if (!template) {
        return '';
      }
      return template.replace(/\{query\}/g, encodeURIComponent(query));
    }

    function hasOpenAndSubmitSiteSearchAction(provider) {
      return Boolean(
        provider &&
        String(provider.action || '').trim() === 'openAndSubmit'
      );
    }

    function normalizeOverlaySiteSearchTemplate(template) {
      if (typeof SEARCH_UTILS.normalizeSiteSearchTemplate === 'function') {
        return SEARCH_UTILS.normalizeSiteSearchTemplate(template);
      }
      return String(template || '')
        .trim()
        .replace(/\{\{\{s\}\}\}/g, '{query}')
        .replace(/\{s\}/g, '{query}')
        .replace(/\{searchTerms\}/g, '{query}');
    }

    function isAiSiteSearchProvider(provider) {
      if (typeof SEARCH_UTILS.isAiSiteSearchProvider === 'function') {
        return SEARCH_UTILS.isAiSiteSearchProvider(provider);
      }
      const template = normalizeOverlaySiteSearchTemplate(provider && provider.template);
      return Boolean(
        provider &&
        (
          hasOpenAndSubmitSiteSearchAction(provider) ||
          (template && !template.includes('{query}'))
        )
      );
    }

    function isInteractiveSiteSearchProvider(provider) {
      if (typeof SEARCH_UTILS.isInteractiveSiteSearchProvider === 'function') {
        return SEARCH_UTILS.isInteractiveSiteSearchProvider(provider);
      }
      return Boolean(
        hasOpenAndSubmitSiteSearchAction(provider) &&
        ['geminiPrompt', 'chatgptPrompt', 'doubaoPrompt', 'qianwenQuery', 'yuanbaoPrompt', 'minimaxPrompt', 'deepseekPrompt', 'kimiPrompt'].includes(String(provider.submitStrategy || '').trim())
      );
    }

    function openSiteSearchProviderQuery(provider, query) {
      const trimmedQuery = String(query || '').trim();
      if (!provider || !trimmedQuery) {
        return false;
      }
      if (isInteractiveSiteSearchProvider(provider)) {
        chrome.runtime.sendMessage({
          action: 'runSiteSearchProviderQuery',
          provider: provider,
          query: trimmedQuery,
          disposition: 'newTab'
        });
        return true;
      }
      const siteUrl = buildSearchUrl(provider.template, trimmedQuery);
      if (!siteUrl) {
        return false;
      }
      chrome.runtime.sendMessage({
        action: 'createTab',
        url: siteUrl
      });
      return true;
    }

    function recordSearchSuggestionSelectionFromSuggestion(suggestion, query, source) {
      if (!suggestion || suggestion.forceSearch || suggestion.provider || !suggestion.url) {
        return;
      }
      try {
        chrome.runtime.sendMessage({
          action: 'recordSearchSuggestionSelection',
          query: String(query || '').trim(),
          url: suggestion.url,
          title: suggestion.title || '',
          type: suggestion.type || 'history',
          source: source || 'overlay'
        });
      } catch (e) {
        // Selection ranking is best-effort; never block opening the target.
      }
    }

    function getProviderIcon(provider) {
      if (provider && provider.icon) {
        return provider.icon;
      }
      if (provider && provider.iconUrl) {
        return provider.iconUrl;
      }
      const template = provider && provider.template ? provider.template : '';
      try {
        const url = template.replace(/\{query\}/g, 'test');
        const hostname = normalizeHost(new URL(url).hostname);
        return getGoogleFaviconUrl(hostname) || getFaviconIsUrl(hostname);
      } catch (e) {
        return '';
      }
    }

    function getSiteSearchProviders() {
      if (siteSearchProvidersCache) {
        return Promise.resolve(siteSearchProvidersCache);
      }
      return SITE_SEARCH_STORE.loadSiteSearchProviders({
        chromeApi: chrome,
        storageArea,
        storageKeys: {
          custom: SITE_SEARCH_STORAGE_KEY,
          disabled: SITE_SEARCH_DISABLED_STORAGE_KEY
        },
        defaultProviders: defaultSiteSearchProviders,
        mergeCustomProviders: SEARCH_UTILS.mergeCustomProviders,
        getStorageValues: getStorageValuesAsync
      }).then((items) => {
        siteSearchProvidersCache = items;
        return items;
      });
    }

    getSiteSearchProviders();

    siteSearchStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName ||
          (!changes[SITE_SEARCH_STORAGE_KEY] && !changes[SITE_SEARCH_DISABLED_STORAGE_KEY])) {
        return;
      }
      if (!storageArea) {
        return;
      }
      storageArea.get([SITE_SEARCH_STORAGE_KEY, SITE_SEARCH_DISABLED_STORAGE_KEY], (result) => {
        const customItems = Array.isArray(result[SITE_SEARCH_STORAGE_KEY]) ? result[SITE_SEARCH_STORAGE_KEY] : [];
        const disabledKeys = Array.isArray(result[SITE_SEARCH_DISABLED_STORAGE_KEY])
          ? result[SITE_SEARCH_DISABLED_STORAGE_KEY]
          : [];
        siteSearchProvidersCache = SITE_SEARCH_STORE.mergeStoredProviders(
          defaultSiteSearchProviders,
          customItems,
          disabledKeys,
          SEARCH_UTILS.mergeCustomProviders
        );
        if (latestOverlayQuery) {
          chrome.runtime.sendMessage({
            action: 'getSearchSuggestions',
            query: latestOverlayQuery,
            context: 'overlay'
          }, function(response) {
            if (response && response.suggestions) {
              updateSearchSuggestions(response.suggestions, latestOverlayQuery);
            } else {
              updateSearchSuggestions([], latestOverlayQuery);
            }
          });
        }
      });
    };
    chrome.storage.onChanged.addListener(siteSearchStorageListener);

    function getSiteSearchDisplayName(provider) {
      if (!provider) {
        return t('site_search_default', '站内');
      }
      const mapping = typeof SEARCH_UTILS.getSiteSearchProviderDisplayNameMessage === 'function'
        ? SEARCH_UTILS.getSiteSearchProviderDisplayNameMessage(provider)
        : null;
      if (mapping) {
        return t(mapping.messageKey, mapping.fallback);
      }
      return provider.name || provider.key || t('site_search_default', '站内');
    }

    function getSiteSearchActionTitle(provider, query) {
      const site = getSiteSearchDisplayName(provider);
      const queryText = String(query || '').trim();
      if (isAiSiteSearchProvider(provider)) {
        return queryText
          ? formatMessage('ask_ai_provider_query', '向 {site} 提问 "{query}"', { site, query: queryText })
          : formatMessage('ask_ai_provider', '向 {site} 提问', { site });
      }
      return queryText
        ? formatMessage('search_in_site_query', '在 {site} 中搜索 "{query}"', { site, query: queryText })
        : formatMessage('search_in_site', '在 {site} 中搜索', { site });
    }

    function getSiteSearchPrefixText(provider) {
      if (isAiSiteSearchProvider(provider)) {
        return getSiteSearchDisplayName(provider);
      }
      return getSiteSearchDisplayName(provider) || formatMessage('search_in_site', '在 {site} 中搜索', {
        site: provider && provider.name ? provider.name : ''
      });
    }

    function getProviderHost(provider) {
      return SEARCH_UTILS.getSiteSearchProviderHost(provider);
    }

    function findProviderForSuggestionMatch(suggestion, providers) {
      return SEARCH_UTILS.findProviderForSiteSearchSuggestion(suggestion, providers);
    }

    function getInlineSiteSearchCandidate(input, providers) {
      return SEARCH_UTILS.getInlineSiteSearchCandidate(input, providers);
    }

    function promoteStrongNavigationMatch(list, rawQuery) {
      if (typeof SEARCH_UTILS.promoteStrongNavigationMatch !== 'function') {
        return null;
      }
      return SEARCH_UTILS.promoteStrongNavigationMatch(list, rawQuery, {
        getDirectNavigationUrl,
        getUrlDisplay
      });
    }

    function matchesTopSitePrefix(suggestion, input) {
      if (!suggestion || !(suggestion.type === 'topSite' || suggestion.isTopSite)) {
        return false;
      }
      const query = String(input || '').trim().toLowerCase();
      if (!query) {
        return false;
      }
      const titleText = String(suggestion.title || '').toLowerCase();
      if (titleText.startsWith(query)) {
        return true;
      }
      const urlText = getUrlDisplay(suggestion.url || '');
      if (!urlText) {
        return false;
      }
      const host = urlText.split('/')[0] || '';
      return host.toLowerCase().startsWith(query);
    }

    function getTopSiteMatchCandidate(list, input) {
      if (!Array.isArray(list)) {
        return null;
      }
      const query = String(input || '').trim();
      if (!query || /\s/.test(query)) {
        return null;
      }
      let fallback = null;
      for (let i = 0; i < list.length; i += 1) {
        const suggestion = list[i];
        if (!suggestion || !(suggestion.type === 'topSite' || suggestion.isTopSite)) {
          continue;
        }
        const urlText = getUrlDisplay(suggestion.url || '');
        const host = urlText ? (urlText.split('/')[0] || '') : '';
        if (host && host.toLowerCase().startsWith(query.toLowerCase())) {
          return suggestion;
        }
        if (!fallback && matchesTopSitePrefix(suggestion, query)) {
          fallback = suggestion;
        }
      }
      return fallback;
    }

    function promoteTopSiteMatch(list, queryText) {
      const match = getTopSiteMatchCandidate(list, queryText);
      if (!match) {
        return null;
      }
      const matchIndex = list.indexOf(match);
      const firstResultIndex = Array.isArray(list)
        ? list.findIndex((item) => item && item.type !== 'newtab')
        : -1;
      if (matchIndex !== firstResultIndex) {
        return null;
      }
      if (matchIndex > 0) {
        const [picked] = list.splice(matchIndex, 1);
        list.unshift(picked);
        return picked;
      }
      if (matchIndex === 0) {
        return list[0];
      }
      return null;
    }

    function getSiteSearchTriggerCandidate(input, providers, topSiteMatch) {
      return SEARCH_UTILS.getSiteSearchTriggerCandidate(input, providers, topSiteMatch, {
        matchesTopSitePrefix
      });
    }

    function activateSiteSearch(provider) {
      if (!provider) {
        return;
      }
      openTabsSearchModeActive = false;
      siteSearchState = provider;
      inlineSearchState = null;
      searchInput.value = '';
      latestRawInputValue = '';
      latestOverlayQuery = '';
      clearAutocomplete();
      setSiteSearchPrefix(provider, defaultTheme, { animate: true });
      const providerIcon = getProviderIcon(provider);
      getThemeForProvider(provider).then((theme) => {
        if (siteSearchState === provider) {
          setSiteSearchPrefix(provider, theme);
        }
      });
      clearSearchSuggestions();
    }

    function clearSiteSearch() {
      if (!siteSearchState) {
        return;
      }
      siteSearchState = null;
      inlineSearchState = null;
      clearSiteSearchPrefix();
      clearAutocomplete();
    }

    function activateOpenTabsSearchMode() {
      openTabsSearchModeActive = true;
      siteSearchState = null;
      inlineSearchState = null;
      siteSearchTriggerState = null;
      clearAutocomplete();
      setOpenTabsSearchPrefix(defaultTheme);
      latestRawInputValue = searchInput.value || '';
      latestOverlayQuery = latestRawInputValue.trim();
      requestTabsAndRender(latestOverlayQuery);
    }

    function clearOpenTabsSearchMode() {
      if (!openTabsSearchModeActive) {
        return;
      }
      openTabsSearchModeActive = false;
      clearSiteSearchPrefix();
      clearAutocomplete();
      const rawValue = searchInput.value || '';
      const query = rawValue.trim();
      latestRawInputValue = rawValue;
      latestOverlayQuery = query;
      if (!query) {
        clearSearchSuggestions();
        return;
      }
      if (isModeCommand(query) || getCommandMatch(query)) {
        updateSearchSuggestions([], query);
        return;
      }
      chrome.runtime.sendMessage({
        action: 'getSearchSuggestions',
        query: query,
        context: 'overlay'
      }, function(response) {
        if (response && response.suggestions) {
          updateSearchSuggestions(response.suggestions, query);
        }
      });
    }

    // Add input event for search suggestions
    searchInput.addEventListener('compositionstart', function() {
      isComposing = true;
      clearAutocomplete();
    });

    searchInput.addEventListener('compositionend', function(e) {
      isComposing = false;
      const rawValue = e.target.value || '';
      const query = rawValue.trim();
      updateModeBadge(rawValue);
      if (selectedIndex >= 0) {
        selectedIndex = -1;
        updateSelection();
      }
      latestOverlayQuery = query;
      latestRawInputValue = rawValue;
      clearAutocomplete();
      if (query.length > 0) {
        if (openTabsSearchModeActive) {
          requestTabsAndRender(query);
          return;
        }
        if (isModeCommand(query) || getCommandMatch(query)) {
          updateSearchSuggestions([], query);
          return;
        }
        chrome.runtime.sendMessage({
          action: 'getSearchSuggestions',
          query: query,
          context: 'overlay'
        }, function(response) {
          if (response && response.suggestions) {
            updateSearchSuggestions(response.suggestions, query);
          }
        });
      } else {
        if (openTabsSearchModeActive) {
          requestTabsAndRender('');
          return;
        }
        clearSearchSuggestions();
      }
    });

    searchInput.addEventListener('input', function(event) {
      const rawValue = this.value;
      const query = rawValue.trim();
      updateModeBadge(rawValue);
      const inputType = event && event.inputType;
      const isPaste = inputType === 'insertFromPaste';
      const isDelete = inputType && inputType.startsWith('delete');
      if (isDelete) {
        lastDeletionAt = Date.now();
      }
      if (isComposing) {
        latestRawInputValue = rawValue;
        latestOverlayQuery = query;
        return;
      }
      if (selectedIndex >= 0) {
        selectedIndex = -1;
        updateSelection();
      }
      if (!query && siteSearchState) {
        latestOverlayQuery = '';
        latestRawInputValue = '';
        clearAutocomplete();
        clearSearchSuggestions();
        return;
      }
      latestOverlayQuery = query;
      latestRawInputValue = rawValue;
      clearAutocomplete();
      if (query.length > 0) {
        if (openTabsSearchModeActive) {
          requestTabsAndRender(query);
          return;
        }
        if (isPaste || getDirectUrlSuggestion(query)) {
          updateSearchSuggestions([], query);
        }
        if (isModeCommand(query) || getCommandMatch(query)) {
          updateSearchSuggestions([], query);
          return;
        }
        // Get search suggestions
        chrome.runtime.sendMessage({
          action: 'getSearchSuggestions',
          query: query,
          context: 'overlay'
        }, function(response) {
          if (response && response.suggestions) {
            updateSearchSuggestions(response.suggestions, query);
          }
        });
      } else {
        if (openTabsSearchModeActive) {
          requestTabsAndRender('');
          return;
        }
        // Clear suggestions and show tabs
        clearSearchSuggestions();
      }
    });

    // Add click outside to close functionality
    clickOutsideHandler = function(e) {
      const eventPath = e && typeof e.composedPath === 'function' ? e.composedPath() : [];
      const clickedInsideOverlay = overlay.contains(e.target) ||
        eventPath.includes(overlay) ||
        eventPath.includes(overlay._lumnoOverlayHost);
      if (!clickedInsideOverlay) {
        removeOverlay(overlay);
        document.removeEventListener('click', clickOutsideHandler);
      }
    };
    document.addEventListener('click', clickOutsideHandler);

    function handleTabKey(e) {
      if (siteSearchState || openTabsSearchModeActive) {
        return false;
      }
      const rawValue = searchInput.value;
      const rawTrigger = latestRawInputValue || rawValue;
      const triggerInput = (rawTrigger || rawValue).trim();
      if (siteSearchTriggerState &&
          siteSearchTriggerState.rawInput === triggerInput &&
          siteSearchTriggerState.provider) {
        e.preventDefault();
        activateSiteSearch(siteSearchTriggerState.provider);
        return true;
      }
      if (triggerInput) {
        e.preventDefault();
        const providers = (siteSearchProvidersCache && siteSearchProvidersCache.length > 0)
          ? siteSearchProvidersCache
          : defaultSiteSearchProviders;
        const topSiteMatch = getTopSiteMatchCandidate(currentSuggestions, triggerInput);
        const directProvider = getSiteSearchTriggerCandidate(triggerInput, providers, topSiteMatch);
        if (directProvider) {
          activateSiteSearch(directProvider);
          return true;
        }
        getSiteSearchProviders().then((items) => {
          const asyncTopSiteMatch = getTopSiteMatchCandidate(currentSuggestions, triggerInput);
          const asyncProvider = getSiteSearchTriggerCandidate(triggerInput, items, asyncTopSiteMatch);
          if (asyncProvider) {
            activateSiteSearch(asyncProvider);
            return;
          }
          if (autocompleteState && autocompleteState.completion) {
            searchInput.value = autocompleteState.completion;
            searchInput.setSelectionRange(autocompleteState.completion.length, autocompleteState.completion.length);
            latestRawInputValue = autocompleteState.completion;
            latestOverlayQuery = autocompleteState.completion.trim();
            autocompleteState = null;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        return true;
      }
      if (autocompleteState && autocompleteState.completion) {
        e.preventDefault();
        searchInput.value = autocompleteState.completion;
        searchInput.setSelectionRange(autocompleteState.completion.length, autocompleteState.completion.length);
        latestRawInputValue = autocompleteState.completion;
        latestOverlayQuery = autocompleteState.completion.trim();
        autocompleteState = null;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      if (!triggerInput && suggestionItems.length > 0) {
        const firstItem = suggestionItems[0];
        const autoIndex = getAutoHighlightIndex();
        if (firstItem && !firstItem._xIsSearchSuggestion && autoIndex === 0) {
          e.preventDefault();
          activateOpenTabsSearchMode();
          return true;
        }
      }
      return false;
    }

    captureTabHandler = function(e) {
      if (e.key !== 'Tab') {
        return;
      }
      const searchRoot = searchInput && typeof searchInput.getRootNode === 'function'
        ? searchInput.getRootNode()
        : null;
      const activeInRoot = searchRoot && searchRoot.activeElement ? searchRoot.activeElement : null;
      if (document.activeElement !== searchInput && activeInRoot !== searchInput) {
        return;
      }
      handleTabKey(e);
    };
    document.addEventListener('keydown', captureTabHandler, true);

    searchInput.addEventListener('keydown', function(e) {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        e.stopPropagation();
      }
      if (e.key === 'Escape' && siteSearchState) {
        e.preventDefault();
        e.stopPropagation();
        clearSiteSearch();
        return;
      }
      if (e.key === 'Escape' && openTabsSearchModeActive) {
        e.preventDefault();
        e.stopPropagation();
        clearOpenTabsSearchMode();
        return;
      }
      if (e.key === 'Backspace' && siteSearchState && !searchInput.value) {
        clearSiteSearch();
        return;
      }
      if (e.key === 'Backspace' && openTabsSearchModeActive && !searchInput.value) {
        clearOpenTabsSearchMode();
        return;
      }
      if (isImeCompositionEvent(e)) {
        return;
      }
      if (e.key === 'Tab') {
        handleTabKey(e);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
        keydownHandler(e);
        return;
      }
      dismissAutocompletePreviewOnNonTabKey(e);
      if (e.key !== 'Backspace' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        latestRawInputValue = searchInput.value;
        latestOverlayQuery = searchInput.value.trim();
      }
    });
    searchInput.addEventListener('keypress', function(e) {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        e.stopPropagation();
      }
    });
    searchInput.addEventListener('keyup', function(e) {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        e.stopPropagation();
      }
    });

    // Add keyboard navigation
    function getAutoHighlightIndex() {
      return suggestionItems.findIndex((item) => Boolean(item && item._xIsAutocompleteTop));
    }

    function shouldSwitchMatchedTabSuggestion(suggestion, index) {
      if (!suggestion || typeof suggestion._xMatchedTabId !== 'number') {
        return false;
      }
      if (prioritizeCurrentPageMatch &&
        typeof currentOverlayTabId === 'number' &&
        suggestion._xMatchedTabId === currentOverlayTabId &&
        index === 0) {
        return true;
      }
      if (!overlayTabQuickSwitchEnabled) {
        return false;
      }
      return index === 0;
    }

    keydownHandler = function(e) {
      if (isImeCompositionEvent(e)) {
        return;
      }
      dismissAutocompletePreviewOnNonTabKey(e);
      if (e.key === 'Escape' && overlay) {
        removeOverlay(overlay);
        document.removeEventListener('keydown', keydownHandler);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (suggestionItems.length === 0) {
          return;
        }
        let didWrap = false;
        if (selectedIndex === -1) {
          // Move from auto highlight (or input) to next suggestion
          const autoIndex = getAutoHighlightIndex();
          selectedIndex = autoIndex >= 0
            ? (autoIndex + 1) % suggestionItems.length
            : 0;
          didWrap = autoIndex >= 0 && selectedIndex === 0;
        } else {
          // Move to next suggestion
          const previousIndex = selectedIndex;
          selectedIndex = (selectedIndex + 1) % suggestionItems.length;
          didWrap = previousIndex === suggestionItems.length - 1 && selectedIndex === 0;
        }
        updateSelection();
        scrollSelectedSuggestionIntoView('down', didWrap);
        searchInput.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (suggestionItems.length === 0) {
          return;
        }
        let didWrap = false;
        if (selectedIndex === 0) {
          // Wrap from first suggestion to the last suggestion
          selectedIndex = suggestionItems.length - 1;
          didWrap = true;
        } else if (selectedIndex === -1) {
          const autoIndex = getAutoHighlightIndex();
          if (autoIndex > 0) {
            selectedIndex = autoIndex - 1;
          } else if (autoIndex === 0) {
            selectedIndex = suggestionItems.length - 1;
            didWrap = true;
          } else {
            // Move from input to last suggestion
            selectedIndex = suggestionItems.length - 1;
            didWrap = true;
          }
        } else {
          // Move to previous suggestion
          selectedIndex = selectedIndex - 1;
        }
        updateSelection();
        scrollSelectedSuggestionIntoView('up', didWrap);
        searchInput.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        const commandMatch = getCommandMatch(query);
        if (commandMatch && selectedIndex === -1) {
          if (commandMatch.command.type === 'commandNewTab') {
            chrome.runtime.sendMessage({ action: 'openNewTab' });
          } else if (commandMatch.command.type === 'commandSettings') {
            chrome.runtime.sendMessage({ action: 'openOptionsPage' });
          }
          removeOverlay(overlay);
          document.removeEventListener('click', clickOutsideHandler);
          document.removeEventListener('keydown', keydownHandler);
          document.removeEventListener('keydown', captureTabHandler, true);
          return;
        }
        if (isModeCommand(query) && selectedIndex === -1) {
          applyThemeModeChange(getNextThemeMode(overlayThemeMode || 'system'));
          return;
        }

        const activeSuggestionIndex = selectedIndex >= 0
          ? selectedIndex
          : getAutoHighlightIndex();
        if (activeSuggestionIndex >= 0 && suggestionItems[activeSuggestionIndex]) {
          // Check if we're showing search suggestions or tab suggestions
          const activeItem = suggestionItems[activeSuggestionIndex];
          const isSearchSuggestion = Boolean(activeItem._xIsSearchSuggestion);

          if (isSearchSuggestion && currentSuggestions[activeSuggestionIndex]) {
            const selectedSuggestion = currentSuggestions[activeSuggestionIndex];
            if (selectedSuggestion.type === 'modeSwitch') {
              applyThemeModeChange(selectedSuggestion.nextMode);
              searchInput.focus();
              return;
            }
            if (selectedSuggestion.type === 'commandNewTab') {
              chrome.runtime.sendMessage({ action: 'openNewTab' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (selectedSuggestion.type === 'commandSettings') {
              chrome.runtime.sendMessage({ action: 'openOptionsPage' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (selectedSuggestion.type === 'siteSearchPrompt' && selectedSuggestion.provider) {
              activateSiteSearch(selectedSuggestion.provider);
              searchInput.focus();
              return;
            }
            if (selectedSuggestion.provider && selectedSuggestion.searchQuery) {
              if (openSiteSearchProviderQuery(selectedSuggestion.provider, selectedSuggestion.searchQuery)) {
                removeOverlay(overlay);
                document.removeEventListener('click', clickOutsideHandler);
                document.removeEventListener('keydown', keydownHandler);
                document.removeEventListener('keydown', captureTabHandler, true);
              }
              return;
            }
            if (shouldSwitchMatchedTabSuggestion(selectedSuggestion, activeSuggestionIndex)) {
              chrome.runtime.sendMessage({
                action: 'switchToTab',
                tabId: selectedSuggestion._xMatchedTabId
              });
            } else if (selectedSuggestion.forceSearch && selectedSuggestion.searchQuery) {
              chrome.runtime.sendMessage({
                action: 'searchOrNavigate',
                query: selectedSuggestion.searchQuery,
                forceSearch: true
              });
            } else {
              // Navigate to the suggested URL
              console.log('Opening URL from keyboard:', selectedSuggestion.url);
              recordSearchSuggestionSelectionFromSuggestion(selectedSuggestion, query, 'overlay');
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: selectedSuggestion.url
              });
            }
          } else if (!isSearchSuggestion) {
            if (activeItem && activeItem._xIsOpenTabsModeEntry) {
              activateOpenTabsSearchMode();
              searchInput.focus();
              return;
            }
            // Switch to existing tab
            if (activeItem && typeof activeItem._xTabId === 'number') {
              chrome.runtime.sendMessage({
                action: 'switchToTab',
                tabId: activeItem._xTabId
              });
            }
          }
          removeOverlay(overlay);
          document.removeEventListener('click', clickOutsideHandler);
          document.removeEventListener('keydown', keydownHandler);
          document.removeEventListener('keydown', captureTabHandler, true);
        } else if (query) {
          if (siteSearchState) {
            if (openSiteSearchProviderQuery(siteSearchState, query)) {
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
          }
          const currentRawInput = (latestRawInputValue || searchInput.value || '').trim();
          if (inlineSearchState && inlineSearchState.isAuto &&
              inlineSearchState.rawInput === currentRawInput) {
            if (inlineSearchState.provider && inlineSearchState.query) {
              if (!openSiteSearchProviderQuery(inlineSearchState.provider, inlineSearchState.query)) {
                return;
              }
            } else if (inlineSearchState.url) {
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: inlineSearchState.url
              });
            } else {
              return;
            }
            removeOverlay(overlay);
            document.removeEventListener('click', clickOutsideHandler);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keydown', captureTabHandler, true);
            return;
          }
          if (autocompleteState && autocompleteState.url) {
            recordSearchSuggestionSelectionFromSuggestion({
              url: autocompleteState.url,
              title: autocompleteState.title || '',
              type: 'autocomplete'
            }, query, 'overlay');
            chrome.runtime.sendMessage({
              action: 'createTab',
              url: autocompleteState.url
            });
            removeOverlay(overlay);
            document.removeEventListener('click', clickOutsideHandler);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keydown', captureTabHandler, true);
            return;
          }
          resolveQuickNavigation(query).then((targetUrl) => {
            if (targetUrl) {
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: targetUrl
              });
            } else {
              // Handle search or URL navigation
              chrome.runtime.sendMessage({
                action: 'searchOrNavigate',
                query: query
              });
            }
            removeOverlay(overlay);
            document.removeEventListener('click', clickOutsideHandler);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keydown', captureTabHandler, true);
          });
        }
      }
    };

    overlayKeyCaptureHandler = function(e) {
      if (!overlay || !overlay.isConnected) {
        return;
      }
      const searchRoot = searchInput && typeof searchInput.getRootNode === 'function'
        ? searchInput.getRootNode()
        : null;
      const activeInRoot = searchRoot && searchRoot.activeElement ? searchRoot.activeElement : null;
      if (document.activeElement !== searchInput && activeInRoot !== searchInput) {
        return;
      }
      if (isImeCompositionEvent(e)) {
        return;
      }
      if (e.key === 'Tab') {
        handleTabKey(e);
        e.stopImmediatePropagation();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
        keydownHandler(e);
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener('keydown', overlayKeyCaptureHandler, true);
    document.addEventListener('keydown', keydownHandler);

    function setSuggestionRowColors(item, bg, border) {
      if (!item) {
        return;
      }
      item.style.setProperty('--x-ov-suggestion-row-bg', bg || 'transparent');
      item.style.setProperty('--x-ov-suggestion-row-border', border || 'transparent');
    }

    function setSuggestionActionTagsVisible(element, visible) {
      if (!element) {
        return;
      }
      element.setAttribute('data-visible', visible ? 'true' : 'false');
    }

    function setSuggestionTitleActive(title, active) {
      if (!title) {
        return;
      }
      title.style.setProperty('--x-ov-suggestion-title-weight', active ? '600' : '400');
    }

    function setSuggestionSourceTagVisible(tag, visible) {
      if (!tag) {
        return;
      }
      tag.setAttribute('data-visible', visible ? 'true' : 'false');
    }

    function setSuggestionSourceTagPalette(tag, bg, text, border) {
      if (!tag) {
        return;
      }
      tag.style.setProperty('--x-ov-suggestion-source-tag-bg', bg || 'var(--x-ov-tag-bg, #F3F4F6)');
      tag.style.setProperty('--x-ov-suggestion-source-tag-text', text || 'var(--x-ov-tag-text, #6B7280)');
      tag.style.setProperty('--x-ov-suggestion-source-tag-border', border || 'transparent');
    }

    function applySuggestionSourceTagState(tag, visible, active, resolvedTheme) {
      if (!tag) {
        return;
      }
      setSuggestionSourceTagVisible(tag, visible);
      if (active) {
        setSuggestionSourceTagPalette(tag, resolvedTheme.tagBg, resolvedTheme.tagText, resolvedTheme.tagBorder);
      } else {
        setSuggestionSourceTagPalette(
          tag,
          tag._xDefaultBg || 'var(--x-ov-tag-bg, #F3F4F6)',
          tag._xDefaultText || 'var(--x-ov-tag-text, #6B7280)',
          tag._xDefaultBorder || 'transparent'
        );
      }
    }

    function createSuggestionSourceTag(label, defaults) {
      const tag = document.createElement('span');
      setProtectedPlainText(tag, label);
      tag.className = 'x-ov-suggestion-source-tag';
      tag._xDefaultBg = defaults && defaults.bg ? defaults.bg : 'var(--x-ov-tag-bg, #F3F4F6)';
      tag._xDefaultText = defaults && defaults.text ? defaults.text : 'var(--x-ov-tag-text, #6B7280)';
      tag._xDefaultBorder = defaults && defaults.border ? defaults.border : 'transparent';
      setSuggestionSourceTagPalette(tag, tag._xDefaultBg, tag._xDefaultText, tag._xDefaultBorder);
      setSuggestionSourceTagVisible(tag, true);
      return tag;
    }

    function setSuggestionActionButtonVisible(button, visible) {
      if (!button) {
        return;
      }
      button.setAttribute('data-visible', visible ? 'true' : 'false');
    }

    function setSuggestionActionButtonPalette(button, text, bg, border) {
      if (!button) {
        return;
      }
      button.style.setProperty(
        '--x-ov-suggestion-action-button-text',
        text || 'var(--x-ov-subtext, #9CA3AF)'
      );
      button.style.setProperty('--x-ov-suggestion-action-button-bg', bg || 'transparent');
      button.style.setProperty('--x-ov-suggestion-action-button-border', border || 'transparent');
    }

    function applySuggestionVisitButtonState(button, visible, active, resolvedTheme) {
      if (!button) {
        return;
      }
      setSuggestionActionButtonVisible(button, visible);
      if (active && resolvedTheme) {
        setSuggestionActionButtonPalette(
          button,
          resolvedTheme.buttonText,
          resolvedTheme.buttonBg,
          resolvedTheme.buttonBorder
        );
        return;
      }
      setSuggestionActionButtonPalette(button, 'var(--x-ov-subtext, #9CA3AF)', 'transparent', 'transparent');
    }

    function applySuggestionSwitchButtonState(button, visible, active) {
      if (!button) {
        return;
      }
      setSuggestionActionButtonVisible(button, visible);
      setSuggestionActionButtonPalette(
        button,
        active ? 'var(--x-ov-text, #1F2937)' : 'var(--x-ov-subtext, #9CA3AF)',
        'transparent',
        'transparent'
      );
    }

    function setHistoryDeleteVisible(slot, button, visible) {
      if (slot) {
        slot.setAttribute('data-visible', visible ? 'true' : 'false');
      }
      if (button) {
        button.setAttribute('data-visible', visible ? 'true' : 'false');
      }
    }

    function setHistoryDeleteButtonHover(button, active) {
      if (!button) {
        return;
      }
      button.setAttribute('data-hover-active', active ? 'true' : 'false');
    }

    function setHistoryDeleteButtonPalette(button, text, bg, border) {
      if (!button) {
        return;
      }
      button.style.setProperty('--x-ov-history-delete-text', text || 'var(--x-ext-input-icon, #9CA3AF)');
      button.style.setProperty('--x-ov-history-delete-bg', bg || 'transparent');
      button.style.setProperty('--x-ov-history-delete-border', border || 'transparent');
    }

    function setHistoryDeleteButtonSurface(button, bg, border) {
      if (!button) {
        return;
      }
      button.style.setProperty('--x-ov-history-delete-bg', bg || 'transparent');
      button.style.setProperty('--x-ov-history-delete-border', border || 'transparent');
    }

    function applyHistoryDeleteState(item, active, resolvedTheme) {
      if (!item || !item._xHistoryDeleteButton) {
        return;
      }
      const shouldShowHistoryDelete = Boolean(item._xHasHistoryDeleteButton && item._xIsHovering);
      setHistoryDeleteVisible(item._xHistoryDeleteSlot, item._xHistoryDeleteButton, shouldShowHistoryDelete);
      if (!shouldShowHistoryDelete) {
        setHistoryDeleteButtonHover(item._xHistoryDeleteButton, false);
      }
      if (shouldShowHistoryDelete && active) {
        setHistoryDeleteButtonPalette(
          item._xHistoryDeleteButton,
          resolvedTheme.buttonText,
          resolvedTheme.buttonBg,
          resolvedTheme.buttonBorder
        );
        return;
      }
      setHistoryDeleteButtonPalette(
        item._xHistoryDeleteButton,
        'var(--x-ext-input-icon, #9CA3AF)',
        'transparent',
        'transparent'
      );
    }

    function applySearchSuggestionHighlight(item, theme) {
      const highlight = getHighlightColors(theme);
      setSuggestionRowColors(item, highlight.bg, highlight.border);
    }

    function resetSearchSuggestion(item) {
      setSuggestionRowColors(item, 'transparent', 'transparent');
    }

    function applySearchActionStyles(item, theme, isActive) {
      const resolvedTheme = getThemeForMode(theme);
      applyMarkVariables(item, isActive ? resolvedTheme : defaultTheme);
      const shouldHideSourceTags = Boolean(item._xHasSwitchAction);
      if (item._xVisitButton) {
        const shouldShowVisitButton = SUGGESTION_ACTION_MODEL &&
          typeof SUGGESTION_ACTION_MODEL.shouldShowVisitButton === 'function'
          ? SUGGESTION_ACTION_MODEL.shouldShowVisitButton(item._xActionModel, isActive)
          : Boolean(!item._xAlwaysHideVisitButton && !(isActive && item._xHasActionTags));
        applySuggestionVisitButtonState(item._xVisitButton, shouldShowVisitButton, isActive, resolvedTheme);
      }
      applyHistoryDeleteState(item, isActive, resolvedTheme);
      if (item._xHistoryTag) {
        applySuggestionSourceTagState(item._xHistoryTag, !shouldHideSourceTags, isActive, resolvedTheme);
      }
      if (item._xBookmarkTag) {
        applySuggestionSourceTagState(item._xBookmarkTag, !shouldHideSourceTags, isActive, resolvedTheme);
      }
      if (item._xTopSiteTag) {
        applySuggestionSourceTagState(item._xTopSiteTag, !shouldHideSourceTags, isActive, resolvedTheme);
      }
      if (item._xOpenTabTag) {
        applySuggestionSourceTagState(item._xOpenTabTag, Boolean(item._xHasSwitchAction), isActive, resolvedTheme);
      }
      if (item._xTagContainer) {
        const shouldShow = isActive && item._xHasActionTags;
        setSuggestionActionTagsVisible(item._xTagContainer, shouldShow);
      }
      if (item._xTitle) {
        setSuggestionTitleActive(item._xTitle, isActive);
      }
    }

    function updateSelection() {
      suggestionItems.forEach((item, index) => {
        const isSelected = index === selectedIndex;
        const shouldAutoHighlight = selectedIndex === -1 && item._xIsAutocompleteTop;
        const isHighlighted = isSelected || shouldAutoHighlight;
        if (item._xIsSearchSuggestion) {
          const theme = item._xTheme || defaultTheme;
          const shouldUseBlue = !(theme && theme._xIsBrand) && (isSelected || item._xIsAutocompleteTop);
          const highlightTheme = shouldUseBlue ? urlHighlightTheme : theme;
          if (isHighlighted) {
            applySearchSuggestionHighlight(item, highlightTheme);
          } else {
            resetSearchSuggestion(item);
          }
          applySearchActionStyles(item, theme, isHighlighted);
          setNonFaviconIconBg(item, Boolean(isHighlighted || item._xIsHovering));
          if (item._xDirectIconWrap) {
            const shouldShow = isHighlighted && theme && theme._xIsBrand;
            const resolvedTheme = getThemeForMode(theme || defaultTheme);
            item._xDirectIconWrap.style.setProperty(
              'color',
              shouldShow ? resolvedTheme.accent : 'var(--x-ov-subtext, #9CA3AF)'
            );
          }
          return;
        }
        setNonFaviconIconBg(item, Boolean(isHighlighted || item._xIsHovering));
        const theme = item._xTheme || defaultTheme;
        const shouldUseBlue = !(theme && theme._xIsBrand) && isHighlighted;
        const highlightTheme = shouldUseBlue ? urlHighlightTheme : theme;
        if (isHighlighted) {
          applySearchSuggestionHighlight(item, highlightTheme);
          if (item._xEntryActionTag) {
            const palette = getOverlayActionTagPalette();
            item._xEntryActionTag.style.setProperty('--x-ext-tag-bg', palette.tagBg);
            item._xEntryActionTag.style.setProperty('--x-ext-tag-text', palette.tagText);
            item._xEntryActionTag.style.setProperty('--x-ext-tag-border', palette.tagBorder);
            item._xEntryActionTag.style.setProperty('--x-ext-key-bg', palette.keyBg);
            item._xEntryActionTag.style.setProperty('--x-ext-key-text', palette.keyText);
            item._xEntryActionTag.style.setProperty('--x-ext-key-border', palette.keyBorder);
          }
          if (item._xSwitchButton) {
            const shouldShowTags = Boolean(item._xTagContainer && item._xHasActionTags);
            applySuggestionSwitchButtonState(item._xSwitchButton, !shouldShowTags, true);
          }
          if (item._xTagContainer) {
            setSuggestionActionTagsVisible(item._xTagContainer, item._xHasActionTags);
          }
        } else {
          resetSearchSuggestion(item);
          if (item._xSwitchButton) {
            applySuggestionSwitchButtonState(item._xSwitchButton, true, false);
          }
          if (item._xTagContainer) {
            setSuggestionActionTagsVisible(item._xTagContainer, false);
          }
        }
        if (item._xTitle) {
          setSuggestionTitleActive(item._xTitle, isHighlighted);
        }
      });
    }

    function scrollSelectedSuggestionIntoView(direction, didWrap) {
      if (!suggestionsContainer || selectedIndex < 0) {
        return;
      }
      const item = suggestionItems[selectedIndex];
      SUGGESTION_NAVIGATION.scrollItemIntoView(suggestionsContainer, item, {
        direction,
        didWrap,
        inset: 8
      });
    }

    function animateSuggestionsGrowth(container, fromHeight) {
      if (!container || !fromHeight) {
        return;
      }
      const toHeight = container.getBoundingClientRect().height;
      if (toHeight <= fromHeight + 1) {
        return;
      }
      container.style.setProperty('height', `${fromHeight}px`, 'important');
      container.style.setProperty('overflow', 'hidden', 'important');
      container.style.setProperty('transition', 'height 180ms ease', 'important');
      requestAnimationFrame(() => {
        container.style.setProperty('height', `${toHeight}px`, 'important');
      });
      const cleanup = () => {
        container.style.removeProperty('height');
        container.style.removeProperty('overflow');
        container.style.removeProperty('transition');
        container.removeEventListener('transitionend', cleanup);
      };
      container.addEventListener('transitionend', cleanup);
      setTimeout(cleanup, 220);
    }

    function renderOverlayEmptyState(message) {
      const isDark = isOverlayDarkMode();
      const empty = document.createElement('div');
      applyNoTranslate(empty);
      empty.className = 'x-ov-empty-state';
      empty.setAttribute('data-theme', isDark ? 'dark' : 'light');
      const icon = document.createElement('span');
      applyNoTranslate(icon);
      icon.innerHTML = getRiSvg('ri-file-3-line', 'ri-size-16');
      icon.className = 'x-ov-empty-state__icon';
      const text = document.createElement('span');
      setProtectedPlainText(text, message || t('overlay_empty_result', '无匹配结果'));
      text.className = 'x-ov-empty-state__text';
      empty.appendChild(icon);
      empty.appendChild(text);
      suggestionsContainer.appendChild(empty);
    }

    function renderTabSuggestions(tabList) {
      suggestionsContainer.innerHTML = '';
      suggestionItems.length = 0;
      currentSuggestions = [];
      lastRenderedQuery = '';
      lastRenderedActionContextKey = '';
      const list = Array.isArray(tabList) ? tabList : [];
      const showOpenTabsModeEntry = false;
      const totalItems = list.length + (showOpenTabsModeEntry ? 1 : 0);
      if (totalItems === 0) {
        const emptyText = openTabsSearchModeActive
          ? t('overlay_empty_open_tabs', '未找到匹配的已打开标签页')
          : t('overlay_empty_result', '无匹配结果');
        renderOverlayEmptyState(emptyText);
        return;
      }
      list.forEach((tab) => {
        if (tab && tab.favIconUrl) {
          preloadIcon(tab.favIconUrl);
        }
      });
      if (showOpenTabsModeEntry) {
        const entryItem = document.createElement('div');
        applyNoTranslate(entryItem);
        entryItem.id = '_x_extension_open_tabs_mode_entry_2026_unique_';
        const entryIsLast = totalItems === 1;
        entryItem.className = 'x-ov-suggestion-item';
        entryItem.setAttribute('data-last', entryIsLast ? 'true' : 'false');
        entryItem._xIsSearchSuggestion = false;
        entryItem._xIsOpenTabsModeEntry = true;
        entryItem._xIsAutocompleteTop = false;
        entryItem._xTheme = defaultTheme;
        suggestionItems.push(entryItem);

        const entryLeft = document.createElement('div');
        entryLeft.className = 'x-ov-suggestion-left';
        const entryIconSlot = document.createElement('span');
        entryIconSlot.className = 'x-ov-suggestion-icon-slot';
        const entryIcon = document.createElement('span');
        entryIcon.innerHTML = getRiSvg('ri-search-line', 'ri-size-16');
        entryIconSlot.appendChild(entryIcon);
        entryItem._xIconWrap = entryIconSlot;
        entryItem._xIconIsFavicon = false;

        const entryTitle = document.createElement('span');
        applyNoTranslate(entryTitle);
        setProtectedPlainText(entryTitle, t('search_open_tabs_only_entry', '搜索已打开标签页'));
        entryTitle.className = 'x-ov-suggestion-title';
        entryItem._xTitle = entryTitle;

        const entryActionTags = document.createElement('div');
        entryActionTags.className = 'x-ov-suggestion-action-tags';
        setSuggestionActionTagsVisible(entryActionTags, false);
        const entryActionTag = createActionTag(t('action_search', '搜索'), 'Tab');
        entryActionTag.dataset.clickable = 'true';
        const entryTagPalette = getOverlayActionTagPalette();
        entryActionTag.style.setProperty('--x-ext-tag-bg', entryTagPalette.tagBg);
        entryActionTag.style.setProperty('--x-ext-tag-text', entryTagPalette.tagText);
        entryActionTag.style.setProperty('--x-ext-tag-border', entryTagPalette.tagBorder);
        entryActionTag.style.setProperty('--x-ext-key-bg', entryTagPalette.keyBg);
        entryActionTag.style.setProperty('--x-ext-key-text', entryTagPalette.keyText);
        entryActionTag.style.setProperty('--x-ext-key-border', entryTagPalette.keyBorder);
        entryItem._xEntryActionTag = entryActionTag;
        entryActionTags.appendChild(entryActionTag);
        entryItem._xTagContainer = entryActionTags;
        entryItem._xHasActionTags = true;

        const entryVisitButton = document.createElement('button');
        applyNoTranslate(entryVisitButton);
        entryVisitButton.className = 'x-ov-suggestion-action-button x-ov-suggestion-visit-button';
        setSuggestionActionButtonVisible(entryVisitButton, true);
        setSuggestionActionButtonPalette(entryVisitButton, 'var(--x-ov-subtext, #9CA3AF)', 'transparent', 'transparent');
        setInlineLabelWithIcon(
          entryVisitButton,
          t('action_search', '搜索'),
          getRiSvg('ri-arrow-right-line', 'ri-size-12')
        );
        entryItem._xSwitchButton = entryVisitButton;

        entryItem.addEventListener('mouseenter', function() {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this._xIsHovering = true;
            setNonFaviconIconBg(this, true);
            if (selectedIndex === -1 && this._xIsAutocompleteTop) {
              return;
            }
            setSuggestionRowColors(this, 'var(--x-ov-hover-bg)', 'transparent');
          }
        });
        entryItem.addEventListener('mouseleave', function() {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this._xIsHovering = false;
            updateSelection();
          }
        });
        const activateEntry = function() {
          activateOpenTabsSearchMode();
          searchInput.focus();
        };
        const activateEntryFromAction = function(e) {
          e.stopPropagation();
          activateEntry();
        };
        entryActionTag.addEventListener('click', activateEntryFromAction);
        entryVisitButton.addEventListener('click', activateEntryFromAction);
        entryItem.addEventListener('click', activateEntry);

        entryLeft.appendChild(entryIconSlot);
        entryLeft.appendChild(entryTitle);
        const entryRight = document.createElement('div');
        entryRight.className = 'x-ov-suggestion-right';
        entryRight.appendChild(entryActionTags);
        entryRight.appendChild(entryVisitButton);
        entryItem.appendChild(entryLeft);
        entryItem.appendChild(entryRight);
        applyNoTranslateDeep(entryItem);
        suggestionsContainer.appendChild(entryItem);
      }
      list.forEach((tab, tabIndex) => {
        const index = tabIndex + (showOpenTabsModeEntry ? 1 : 0);
        const suggestionItem = document.createElement('div');
        applyNoTranslate(suggestionItem);
        suggestionItem.id = `_x_extension_suggestion_item_${index}_2024_unique_`;
        const isLastItem = index === totalItems - 1;
        suggestionItem.className = 'x-ov-suggestion-item';
        suggestionItem.setAttribute('data-last', isLastItem ? 'true' : 'false');
        suggestionItem._xIsSearchSuggestion = false;

        // Store reference to suggestion item
        suggestionItems.push(suggestionItem);
        suggestionItem._xIsAutocompleteTop = tabIndex === 0;
        suggestionItem._xTheme = defaultTheme;
        suggestionItem._xTabId = tab && typeof tab.id === 'number' ? tab.id : null;

        // Create left side with icon and title
        const leftSide = document.createElement('div');
        leftSide.id = `_x_extension_left_side_${index}_2024_unique_`;
        leftSide.className = 'x-ov-suggestion-left';

        // Create favicon
        let favicon = null;
        let hostForTab = '';
        try {
          hostForTab = tab && tab.url ? new URL(tab.url).hostname : '';
        } catch (e) {
          hostForTab = '';
        }
        const useFallback = !tab.favIconUrl || shouldBlockFaviconForHost(hostForTab);
        let iconNode = null;
        let isFaviconIcon = false;
        if (useFallback) {
          iconNode = createLinkIcon();
        } else {
          favicon = document.createElement('img');
          favicon.id = `_x_extension_favicon_${index}_2024_unique_`;
          favicon.className = 'x-ov-suggestion-favicon';
          favicon.decoding = 'async';
          favicon.loading = 'eager';
          favicon.referrerPolicy = 'no-referrer';
          if (index < 4) {
            favicon.fetchPriority = 'high';
          }
          applyFaviconOpticalAlignment(favicon);
          attachResolvedFaviconWithFallbacks(
            favicon,
            tab && tab.url ? tab.url : '',
            hostForTab,
            tab.favIconUrl || '',
            () => {
              if (favicon && favicon.parentNode) {
                favicon.parentNode.replaceChild(createLinkIcon(), favicon);
              }
            }
          );
          iconNode = favicon;
          isFaviconIcon = true;
        }
        const iconSlot = document.createElement('span');
        iconSlot.className = 'x-ov-suggestion-icon-slot';
        iconSlot.appendChild(iconNode);
        suggestionItem._xIconWrap = iconSlot;
        suggestionItem._xIconIsFavicon = isFaviconIcon;

        // Create title
        const title = document.createElement('span');
        applyNoTranslate(title);
        title.id = `_x_extension_title_${index}_2024_unique_`;
        setProtectedPlainText(title, tab.title || t('untitled', '无标题'));
        title.className = 'x-ov-suggestion-title';
        suggestionItem._xTitle = title;

        // Create switch button
        const switchButton = document.createElement('button');
        applyNoTranslate(switchButton);
        switchButton.id = `_x_extension_switch_button_${index}_2024_unique_`;
        switchButton.className = 'x-ov-suggestion-action-button x-ov-suggestion-switch-button';
        setSuggestionActionButtonVisible(switchButton, true);
        setSuggestionActionButtonPalette(switchButton, 'var(--x-ov-subtext, #4B5563)', 'transparent', 'transparent');
        setInlineLabelWithIcon(
          switchButton,
          t('switch_to_tab', '切换到标签页'),
          getRiSvg('ri-arrow-right-line', 'ri-size-12')
        );
        suggestionItem._xSwitchButton = switchButton;

        const actionTags = document.createElement('div');
        actionTags.className = 'x-ov-suggestion-action-tags';
        setSuggestionActionTagsVisible(actionTags, false);
        actionTags.appendChild(createActionTag(t('action_switch', '切换'), 'Enter'));
        suggestionItem._xTagContainer = actionTags;
        suggestionItem._xHasActionTags = actionTags.childNodes.length > 0;

        // Add hover effects
        suggestionItem.addEventListener('mouseenter', function() {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this._xIsHovering = true;
            setNonFaviconIconBg(this, true);
            if (selectedIndex === -1 && this._xIsAutocompleteTop) {
              return;
            }
            const theme = this._xTheme;
            if (theme && theme._xIsBrand) {
              const hover = getHoverColors(theme);
              setSuggestionRowColors(this, hover.bg, hover.border);
            } else {
              setSuggestionRowColors(this, 'var(--x-ov-hover-bg)', 'transparent');
            }
          }
        });

        suggestionItem.addEventListener('mouseleave', function() {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this._xIsHovering = false;
            updateSelection();
          }
        });

        // Add click handler to switch to tab
        switchButton.addEventListener('click', function(e) {
          e.stopPropagation();
          chrome.runtime.sendMessage({
            action: 'switchToTab',
            tabId: tab.id
          });
          removeOverlay(overlay);
          document.removeEventListener('keydown', keydownHandler);
        });

        // Add click handler to select item
        suggestionItem.addEventListener('click', function() {
          chrome.runtime.sendMessage({
            action: 'switchToTab',
            tabId: tab.id
          });
          removeOverlay(overlay);
          document.removeEventListener('keydown', keydownHandler);
        });

        leftSide.appendChild(iconSlot);
        leftSide.appendChild(title);
        if (overlayTabScoreDebugEnabled) {
          const rankDebug = document.createElement('span');
          applyNoTranslate(rankDebug);
          setProtectedPlainText(rankDebug, formatTabRankDebugText(tab));
          rankDebug.className = 'x-ov-tab-rank-debug';
          leftSide.appendChild(rankDebug);
        }
        const rightSide = document.createElement('div');
        rightSide.className = 'x-ov-suggestion-right';
        rightSide.appendChild(actionTags);
        rightSide.appendChild(switchButton);
        suggestionItem.appendChild(leftSide);
        suggestionItem.appendChild(rightSide);
        applyNoTranslateDeep(suggestionItem);
        suggestionsContainer.appendChild(suggestionItem);

        const themeSourceSuggestion = {
          url: tab.url || '',
          favicon: tab.favIconUrl || ''
        };
        const immediateTheme = getImmediateThemeForSuggestion(themeSourceSuggestion) || defaultTheme;
        suggestionItem._xTheme = immediateTheme;
        applyThemeVariables(suggestionItem, immediateTheme);
        getThemeForSuggestion(themeSourceSuggestion).then((theme) => {
          if (!suggestionItem.isConnected) {
            return;
          }
          suggestionItem._xTheme = theme;
          applyThemeVariables(suggestionItem, theme);
          updateSelection();
        });
      });

      selectedIndex = -1;
      updateSelection();
    }

    function requestTabsAndRender(filterQuery) {
      chrome.runtime.sendMessage({ action: 'getTabsForOverlay' }, (response) => {
        const freshTabs = response && Array.isArray(response.tabs) ? response.tabs : [];
        currentOverlayTabId = (response && typeof response.currentTabId === 'number')
          ? response.currentTabId
          : null;
        const queryText = typeof filterQuery === 'string'
          ? filterQuery
          : String(searchInput.value || '').trim();
        const filteredTabs = filterTabsForOverlay(freshTabs, queryText);
        tabs = filteredTabs;
        renderTabSuggestions(filteredTabs);
      });
    }

    function getBrowserInternalScheme() {
      const ua = navigator.userAgent || '';
      if (ua.includes('Edg/')) {
        return 'edge://';
      }
      if (ua.includes('Brave')) {
        return 'brave://';
      }
      if (ua.includes('Vivaldi')) {
        return 'vivaldi://';
      }
      if (ua.includes('OPR/') || ua.includes('Opera')) {
        return 'opera://';
      }
      return 'chrome://';
    }

    function getShortcutRules() {
      const cacheKey = '_x_extension_shortcut_rules_2024_unique_';
      const promiseKey = '_x_extension_shortcut_rules_promise_2024_unique_';
      if (window[cacheKey]) {
        return Promise.resolve(window[cacheKey]);
      }
      if (window[promiseKey]) {
        return window[promiseKey];
      }
      const rulesUrl = chrome.runtime.getURL('assets/data/shortcut-rules.json');
      const rulesPromise = fetch(rulesUrl)
        .then((response) => response.json())
        .then((data) => {
          const items = data && Array.isArray(data.items) ? data.items : [];
          window[cacheKey] = items;
          return items;
        })
        .catch(() => new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'getShortcutRules' }, (response) => {
            const items = response && Array.isArray(response.items) ? response.items : [];
            window[cacheKey] = items;
            resolve(items);
          });
        }));
      window[promiseKey] = rulesPromise;
      return rulesPromise;
    }

    function buildKeywordSuggestions(input, rules) {
      const queryLower = input.toLowerCase();
      const scheme = getBrowserInternalScheme();
      const matches = [];
      rules.forEach((rule) => {
        if (!rule || !Array.isArray(rule.keys)) {
          return;
        }
        const isMatch = rule.keys.some((key) => queryLower.startsWith(key));
        if (!isMatch) {
          return;
        }
        if (rule.type === 'browserPage' && rule.path) {
          const targetUrl = `${scheme}${rule.path}`;
          matches.push({
            type: 'browserPage',
            title: formatMessage('open_url', '打开 {url}', { url: targetUrl }),
            url: targetUrl,
            favicon: 'https://img.icons8.com/?size=100&id=1LqgD1Q7n2fy&format=png&color=000000'
          });
        } else if (rule.type === 'url' && rule.url) {
          matches.push({
            type: 'browserPage',
            title: formatMessage('open_url', '打开 {url}', { url: rule.url }),
            url: rule.url,
            favicon: 'https://img.icons8.com/?size=100&id=1LqgD1Q7n2fy&format=png&color=000000'
          });
        }
      });
      return matches;
    }

    function isNumericHostLike(hostname) {
      if (!hostname) {
        return false;
      }
      if (!/^(\d{1,3})(\.\d{1,3}){0,3}$/.test(hostname)) {
        return false;
      }
      const parts = hostname.split('.');
      if (parts.length < 1 || parts.length > 4) {
        return false;
      }
      if (parts.length === 1) {
        return parts[0] === '127';
      }
      return parts.every((part) => {
        const value = Number(part);
        return Number.isInteger(value) && value >= 0 && value <= 255;
      });
    }

    function extractHostFromInput(rawInput) {
      const withoutScheme = String(rawInput || '').replace(/^https?:\/\//i, '');
      const authority = withoutScheme.split(/[/?#]/)[0] || '';
      if (!authority) {
        return '';
      }
      if (authority.startsWith('[')) {
        const endBracket = authority.indexOf(']');
        if (endBracket > 1) {
          return authority.slice(1, endBracket).toLowerCase();
        }
        return '';
      }
      if (authority.includes('::') && !authority.includes('.')) {
        return authority.toLowerCase();
      }
      return (authority.split(':')[0] || '').toLowerCase();
    }

    function isDevHostLike(hostname) {
      if (!hostname) {
        return false;
      }
      if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        return true;
      }
      if (hostname === 'host.docker.internal') {
        return true;
      }
      if (
        hostname.endsWith('.local') ||
        hostname.endsWith('.test') ||
        hostname.endsWith('.localdev') ||
        hostname.endsWith('.internal')
      ) {
        return true;
      }
      return hostname === '::1' || hostname === '0:0:0:0:0:0:0:1';
    }

    function getDirectNavigationUrl(input) {
      const raw = String(input || '').trim();
      if (!raw) {
        return '';
      }
      const queryLower = raw.toLowerCase();
      const isInternal = ['chrome://', 'edge://', 'brave://', 'vivaldi://', 'opera://'].some((prefix) =>
        queryLower.startsWith(prefix)
      );
      let normalizedInput = raw.match(/^(\d{1,3})([.\s]\d{1,3}){0,3}(?::\d{1,5})?(?:[/?#].*)?$/)
        ? raw.replace(/\s+/g, '.').replace(/\.{2,}/g, '.')
        : raw;
      const hostOnly = extractHostFromInput(normalizedInput);
      const isDevHost = isDevHostLike(hostOnly);
      const isNumericLike = isNumericHostLike(hostOnly);
      const looksLikeUrl = (normalizedInput.includes('.') && !normalizedInput.includes(' ')) || isInternal || isDevHost || isNumericLike;
      if (!looksLikeUrl) {
        return '';
      }
      if (hostOnly.includes(':') && !/^https?:\/\//i.test(normalizedInput) && !normalizedInput.startsWith('[')) {
        normalizedInput = `[${normalizedInput}]`;
      }
      if (!isInternal && !normalizedInput.startsWith('http://') && !normalizedInput.startsWith('https://')) {
        return `https://${normalizedInput}`;
      }
      return normalizedInput;
    }

    function getDirectUrlSuggestion(input) {
      const targetUrl = getDirectNavigationUrl(input);
      if (!targetUrl) {
        return null;
      }
      let isLocalNetwork = isLocalNetworkInput(input);
      if (!isLocalNetwork) {
        const host = getHostFromUrl(targetUrl);
        isLocalNetwork = isLocalNetworkHost(host);
      }
      return {
        type: 'directUrl',
        title: formatMessage('open_url', '打开 {url}', { url: targetUrl }),
        url: targetUrl,
        favicon: '',
        isLocalNetwork: isLocalNetwork
      };
    }

    function resolveQuickNavigation(query) {
      const directUrlSuggestion = getDirectUrlSuggestion(query);
      if (directUrlSuggestion) {
        return Promise.resolve(directUrlSuggestion.url);
      }
      return getShortcutRules().then((rules) => {
        const keywordSuggestions = buildKeywordSuggestions(query, rules);
        if (keywordSuggestions.length > 0) {
          return keywordSuggestions[0].url;
        }
        return null;
      });
    }

    function isSameSuggestion(a, b) {
      if (!a || !b) {
        return false;
      }
      if (a.type !== b.type) {
        return false;
      }
      if ((a.url || '') !== (b.url || '')) {
        return false;
      }
      if ((a.title || '') !== (b.title || '')) {
        return false;
      }
      const providerA = a.provider && a.provider.key ? a.provider.key : '';
      const providerB = b.provider && b.provider.key ? b.provider.key : '';
      return providerA === providerB;
    }

    function isSuggestionPrefix(previous, next) {
      if (!Array.isArray(previous) || !Array.isArray(next)) {
        return false;
      }
      if (previous.length === 0 || previous.length > next.length) {
        return false;
      }
      for (let i = 0; i < previous.length; i += 1) {
        if (!isSameSuggestion(previous[i], next[i])) {
          return false;
        }
      }
      return true;
    }

    function getSuggestionActionContextKey(options) {
      if (SUGGESTION_ACTION_MODEL &&
          typeof SUGGESTION_ACTION_MODEL.getActionContextKey === 'function') {
        return SUGGESTION_ACTION_MODEL.getActionContextKey(options);
      }
      const config = options || {};
      return [
        Number.isInteger(config.primaryHighlightIndex) ? String(config.primaryHighlightIndex) : '-1',
        String(config.primaryHighlightReason || ''),
        config.onlyKeywordSuggestions ? 'keyword' : 'mixed'
      ].join('|');
    }

    function updateSearchSuggestions(suggestions, query) {
      if (query !== latestOverlayQuery) {
        return;
      }
      lastSuggestionResponse = Array.isArray(suggestions) ? suggestions : [];
      const rawTagInput = (latestRawInputValue || query || '').trim();
      const siteSearchQueryModeActive = Boolean(siteSearchState && String(query || '').trim());
      const modeCommandActive = !siteSearchQueryModeActive && isModeCommand(rawTagInput);
      if (modeCommandActive) {
        if (storageArea) {
          storageArea.get([THEME_STORAGE_KEY], (result) => {
            const storedMode = result[THEME_STORAGE_KEY] || 'system';
            if (storedMode !== overlayThemeMode && query === latestOverlayQuery) {
              applyOverlayTheme(storedMode);
              updateSearchSuggestions([], query);
            }
          });
        }
      }

      // Add New Tab suggestion as first item
      const newTabSuggestion = (modeCommandActive || siteSearchQueryModeActive)
        ? null
        : {
          type: 'newtab',
          title: formatMessage('search_query', '搜索 "{query}"', {
            query: query
          }),
          url: buildDefaultSearchUrlForOverlay(query),
          favicon: getDefaultSearchEngineFaviconUrlForOverlay(),
          searchQuery: query,
          forceSearch: true
        };

      // Add ChatGPT suggestion as second item
      // const chatGptSuggestion = {
      //   type: 'chatgpt',
      //   title: `Ask ChatGPT: "${query}"`,
      //   url: `https://chatgpt.com/?q=${encodeURIComponent(query)}`,
      //   favicon: 'https://img.icons8.com/?size=100&id=fO5yVwARGUEB&format=png&color=ffffff'
      // };

      // Add Perplexity suggestion as third item
      // const perplexitySuggestion = {
      //   type: 'perplexity',
      //   title: `Ask Perplexity: "${query}"`,
      //   url: `https://perplexity.ai/search?q=${encodeURIComponent(query)}`,
      //   favicon: 'https://img.icons8.com/?size=100&id=kzJWN5jCDzpq&format=png&color=000000'
      // };

      function buildUrlLine(url) {
        if (!url) {
          return null;
        }
        const urlLine = document.createElement('span');
        setProtectedPlainText(urlLine, url);
        urlLine.className = 'x-ov-suggestion-url-line';
        return urlLine;
      }

      getShortcutRules().then((rules) => {
        if (query !== latestOverlayQuery) {
          return;
        }
        const commandMatch = (!modeCommandActive && !siteSearchQueryModeActive)
          ? getCommandMatch(rawTagInput)
          : null;
        const hasCommand = Boolean(commandMatch);
        const preSuggestions = [];
        if (modeCommandActive) {
          preSuggestions.push(buildModeSuggestion());
        } else if (!siteSearchQueryModeActive) {
          if (hasCommand) {
            preSuggestions.push(buildCommandSuggestion(commandMatch.command));
          }
          const directUrlSuggestion = getDirectUrlSuggestion(query);
          if (directUrlSuggestion && !isCurrentOverlayTabUrl(directUrlSuggestion.url)) {
            preSuggestions.push(directUrlSuggestion);
          }
          const keywordSuggestions = buildKeywordSuggestions(query, rules);
          preSuggestions.push(...keywordSuggestions);
        }

        const providersForTags = (siteSearchProvidersCache && siteSearchProvidersCache.length > 0)
          ? siteSearchProvidersCache
          : defaultSiteSearchProviders;
        if (!siteSearchProvidersCache && !pendingProviderReload) {
          pendingProviderReload = true;
          getSiteSearchProviders().then((items) => {
            pendingProviderReload = false;
            if (query !== latestOverlayQuery) {
              return;
            }
            siteSearchProvidersCache = items;
            updateSearchSuggestions(suggestions, query);
          });
        }
        const rawTagInputForInline = (latestRawInputValue || searchInput.value || '').trim();
        const inlineCandidate = (!siteSearchQueryModeActive && !modeCommandActive && !hasCommand)
          ? getInlineSiteSearchCandidate(rawTagInputForInline, providersForTags)
          : null;
        let inlineSuggestion = null;
        if (inlineCandidate) {
          const inlineUrl = buildSearchUrl(inlineCandidate.provider.template, inlineCandidate.query);
          if (inlineUrl) {
            inlineSuggestion = {
              type: 'inlineSiteSearch',
              title: getSiteSearchActionTitle(inlineCandidate.provider),
              url: inlineUrl,
              favicon: getProviderIcon(inlineCandidate.provider),
              provider: inlineCandidate.provider,
              searchQuery: inlineCandidate.query
            };
          }
        }

        const siteSearchSuggestion = siteSearchQueryModeActive
          ? (() => {
              const siteUrl = buildSearchUrl(siteSearchState.template, query);
              if (!siteUrl) {
                return null;
              }
              return {
                type: 'siteSearch',
                title: getSiteSearchActionTitle(siteSearchState, query),
                url: siteUrl,
                favicon: getProviderIcon(siteSearchState),
                provider: siteSearchState,
                searchQuery: query
              };
            })()
          : null;

        // Add New Tab, ChatGPT and Perplexity suggestions to the beginning
        let allSuggestions = siteSearchQueryModeActive
          ? (siteSearchSuggestion ? [siteSearchSuggestion] : [])
          : (modeCommandActive ? [...preSuggestions] : [...preSuggestions, newTabSuggestion, /*chatGptSuggestion, perplexitySuggestion,*/ ...suggestions]);
        allSuggestions.forEach((item) => {
          if (!item || !item.url) {
            return;
          }
          const matchedTabId = getMatchedOpenTabIdForSuggestion(item);
          if (typeof matchedTabId === 'number') {
            item._xMatchedTabId = matchedTabId;
            return;
          }
          if (Object.prototype.hasOwnProperty.call(item, '_xMatchedTabId')) {
            delete item._xMatchedTabId;
          }
        });
        allSuggestions = filterOverlayBlacklistedSuggestions(allSuggestions, query);
        const onlyKeywordSuggestions = allSuggestions.length > 0 &&
          allSuggestions.every((item) => item && (item.type === 'googleSuggest' || item.type === 'newtab'));

        let autocompleteCandidate = null;
        let primaryHighlightIndex = -1;
        let primaryHighlightReason = 'none';
        let strongNavigationMatch = null;
        let topSiteMatch = null;
        const inlineEnabled = Boolean(inlineSuggestion);
        let siteSearchTrigger = null;
        let mergedProvider = null;
        let primarySuggestion = null;
        const preferAutocompleteFirst = overlaySearchResultPriorityMode !== 'search';
        if (!modeCommandActive && !hasCommand) {
          if (!siteSearchState && !inlineEnabled && preferAutocompleteFirst) {
            strongNavigationMatch = promoteStrongNavigationMatch(allSuggestions, latestRawInputValue.trim());
            if (strongNavigationMatch) {
              primaryHighlightIndex = 0;
              primaryHighlightReason = 'navigation';
            }
            topSiteMatch = promoteTopSiteMatch(allSuggestions, latestRawInputValue.trim());
          }
          siteSearchTrigger = (!siteSearchState && !inlineEnabled)
            ? getSiteSearchTriggerCandidate(rawTagInput, providersForTags, topSiteMatch)
            : null;
          if (!siteSearchState && !inlineEnabled && !strongNavigationMatch && preferAutocompleteFirst) {
            autocompleteCandidate = getAutocompleteCandidate(allSuggestions, latestRawInputValue);
            if (autocompleteCandidate) {
              const candidateIndex = allSuggestions.findIndex((suggestion) => {
                if (!suggestion || suggestion.type === 'newtab') {
                  return false;
                }
                if (autocompleteCandidate.url && suggestion.url === autocompleteCandidate.url) {
                  return true;
                }
                const suggestionUrlText = getUrlDisplay(suggestion.url);
                if (suggestionUrlText && suggestionUrlText.toLowerCase() === autocompleteCandidate.completion.toLowerCase()) {
                  return true;
                }
                if (suggestion.title && suggestion.title.toLowerCase().startsWith(autocompleteCandidate.completion.toLowerCase())) {
                  return true;
                }
                return false;
              });
              if (candidateIndex >= 0 && candidateIndex !== 0) {
                const [candidateSuggestion] = allSuggestions.splice(candidateIndex, 1);
                allSuggestions.unshift(candidateSuggestion);
              }
              primaryHighlightIndex = 0;
              primaryHighlightReason = 'autocomplete';
            }
          }
          if (inlineSuggestion) {
            allSuggestions.unshift(inlineSuggestion);
            allSuggestions = filterOverlayBlacklistedSuggestions(allSuggestions, query);
            primaryHighlightIndex = 0;
            primaryHighlightReason = 'inline';
          } else if (!strongNavigationMatch && topSiteMatch && preferAutocompleteFirst) {
            primaryHighlightIndex = 0;
            primaryHighlightReason = 'topSite';
          }
          if (!siteSearchState && query && (overlayTabQuickSwitchEnabled || prioritizeCurrentPageMatch)) {
            const preferredCurrentTabMatchIndex = prioritizeCurrentPageMatch && typeof currentOverlayTabId === 'number'
              ? allSuggestions.findIndex((item) =>
                item &&
                item.type !== 'newtab' &&
                item._xMatchedTabId === currentOverlayTabId
              )
              : -1;
            if (preferredCurrentTabMatchIndex >= 0) {
              if (preferredCurrentTabMatchIndex > 0) {
                const [preferredCurrentTabMatch] = allSuggestions.splice(preferredCurrentTabMatchIndex, 1);
                allSuggestions.unshift(preferredCurrentTabMatch);
              }
              primaryHighlightIndex = 0;
              primaryHighlightReason = 'currentOpenTab';
            }
            if (preferredCurrentTabMatchIndex < 0) {
              const openTabMatchIndex = allSuggestions.findIndex((item) =>
                item &&
                item.type !== 'newtab' &&
                typeof item._xMatchedTabId === 'number'
              );
              if (openTabMatchIndex >= 0) {
                if (openTabMatchIndex > 0) {
                  const [openTabMatch] = allSuggestions.splice(openTabMatchIndex, 1);
                  allSuggestions.unshift(openTabMatch);
                }
                primaryHighlightIndex = 0;
                primaryHighlightReason = 'openTab';
              }
            }
          }
          if (query && primaryHighlightIndex < 0 && allSuggestions.length > 0) {
            primaryHighlightIndex = 0;
            primaryHighlightReason = 'default';
          }
          if (primaryHighlightIndex >= 0) {
            primarySuggestion = allSuggestions[primaryHighlightIndex] || null;
            mergedProvider = findProviderForSuggestionMatch(primarySuggestion, providersForTags);
          }
          applyAutocomplete(allSuggestions, primarySuggestion, primaryHighlightReason);
          const inlineAutoHighlight = Boolean(inlineSuggestion && primaryHighlightIndex === 0);
          inlineSearchState = inlineSuggestion
            ? {
                url: inlineSuggestion.url,
                provider: inlineSuggestion.provider,
                query: inlineSuggestion.searchQuery || '',
                rawInput: rawTagInputForInline,
                isAuto: inlineAutoHighlight
              }
            : null;
          const resolvedProvider = mergedProvider || siteSearchTrigger;
          siteSearchTriggerState = resolvedProvider
            ? { provider: resolvedProvider, rawInput: rawTagInputForInline }
            : null;
          if (siteSearchTriggerState) {
            setSiteSearchTabHint(resolvedProvider);
          } else {
            clearSiteSearchTabHint();
          }
        } else if (modeCommandActive) {
          clearAutocomplete();
          inlineSearchState = null;
          siteSearchTriggerState = null;
          clearSiteSearchTabHint();
          primaryHighlightIndex = 0;
          primaryHighlightReason = 'modeSwitch';
        } else if (hasCommand) {
          clearAutocomplete();
          inlineSearchState = null;
          siteSearchTriggerState = null;
          clearSiteSearchTabHint();
          primaryHighlightIndex = 0;
          primaryHighlightReason = 'command';
        }
        if (hasCommand) {
          applyAutocomplete(allSuggestions, primarySuggestion, primaryHighlightReason);
        }
        allSuggestions = limitOverlaySuggestionsForDisplay(allSuggestions);
        const actionContextKey = getSuggestionActionContextKey({
          primaryHighlightIndex,
          primaryHighlightReason,
          onlyKeywordSuggestions,
          primarySuggestion,
          mergedProvider
        });
        const canAppend = query === lastRenderedQuery &&
          actionContextKey === lastRenderedActionContextKey &&
          isSuggestionPrefix(currentSuggestions, allSuggestions);
        const startIndex = canAppend ? currentSuggestions.length : 0;
        const shouldAnimateGrowth = canAppend && startIndex < allSuggestions.length;
        const previousHeight = shouldAnimateGrowth
          ? suggestionsContainer.getBoundingClientRect().height
          : 0;
        if (!canAppend) {
          // Clear existing suggestions
          suggestionsContainer.innerHTML = '';
          suggestionItems.length = 0;
          selectedIndex = -1;
        } else {
          suggestionItems.forEach((item, index) => {
            item._xIsAutocompleteTop = index === primaryHighlightIndex;
          });
        }

        currentSuggestions = allSuggestions; // Store current suggestions including ChatGPT
        lastRenderedQuery = query;
        lastRenderedActionContextKey = actionContextKey;
        warmIconCache(allSuggestions);

        // Add search suggestions
        allSuggestions.forEach((suggestion, index) => {
          if (index < startIndex) {
            return;
          }
          const suggestionItem = document.createElement('div');
          applyNoTranslate(suggestionItem);
          suggestionItem.id = `_x_extension_suggestion_item_${index}_2024_unique_`;
          const isLastItem = index === allSuggestions.length - 1;
          const isPrimaryHighlight = index === primaryHighlightIndex;
          const shouldSwitchMatchedTab = isPrimaryHighlight &&
            (primaryHighlightReason === 'openTab' || primaryHighlightReason === 'currentOpenTab') &&
            shouldSwitchMatchedTabSuggestion(suggestion, index);
          const isPrimarySearchSuggest = isPrimaryHighlight && suggestion.type === 'googleSuggest';
          let immediateTheme = getImmediateThemeForSuggestion(suggestion) || defaultTheme;
          if (suggestion.type === 'directUrl' || suggestion.type === 'browserPage') {
            immediateTheme = urlHighlightTheme;
          }
          const shouldUseSearchEngineTheme = isPrimarySearchSuggest ||
            (onlyKeywordSuggestions && isPrimaryHighlight && suggestion.type === 'newtab');
          if (shouldUseSearchEngineTheme) {
            const engineAccent = getBrandAccentForUrl(getDefaultSearchEngineThemeUrlForOverlay());
            if (engineAccent) {
              immediateTheme = buildTheme(engineAccent);
              immediateTheme._xIsBrand = true;
            }
          }
          const initialHighlight = isPrimaryHighlight ? getHighlightColors(immediateTheme) : null;
          suggestionItem.className = 'x-ov-suggestion-item';
          suggestionItem.setAttribute('data-last', isLastItem ? 'true' : 'false');
          if (isPrimaryHighlight) {
            setSuggestionRowColors(suggestionItem, initialHighlight.bg, initialHighlight.border);
          }

          suggestionItems.push(suggestionItem);
          suggestionItem._xIsSearchSuggestion = true;
          suggestionItem._xIsAutocompleteTop = isPrimaryHighlight;
          suggestionItem._xTheme = immediateTheme;
          applyThemeVariables(suggestionItem, immediateTheme);

          // Create left side with icon and title
          const leftSide = document.createElement('div');
          leftSide.className = 'x-ov-suggestion-left';
          leftSide.setAttribute('data-motion', 'true');

          let iconNode = null;
          let iconWrapper = null;
          if (suggestion.type === 'browserPage') {
            iconNode = createLinkIcon();
          } else if (suggestion.type === 'directUrl') {
            const directUrlHost = suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : '';
            const isLocalDirectUrl = Boolean(
              suggestion && suggestion.isLocalNetwork
            ) || (directUrlHost && isLocalNetworkHost(directUrlHost));
            iconNode = isLocalDirectUrl
              ? createLinkIcon()
              : createSearchIcon();
          } else if (suggestion.type === 'commandNewTab') {
            iconNode = createSuggestionInlineIcon('ri-add-line', 'subtext');
          } else if (suggestion.type === 'commandSettings') {
            iconNode = createSuggestionInlineIcon('ri-settings-3-line', 'subtext');
          } else if (suggestion.type === 'modeSwitch' && suggestion.favicon) {
            const favicon = document.createElement('img');
            favicon.className = 'x-ov-suggestion-favicon';
            favicon.decoding = 'async';
            favicon.loading = 'eager';
            favicon.referrerPolicy = 'no-referrer';
            if (index < 4) {
              favicon.fetchPriority = 'high';
            }
            applyFaviconOpticalAlignment(favicon);
            favicon.src = suggestion.favicon || '';
            favicon.onerror = function() {
              const fallbackDiv = createSearchIcon('subtext');
              if (favicon.parentNode) {
                favicon.parentNode.replaceChild(fallbackDiv, favicon);
              }
            };
            iconNode = favicon;
          } else if (suggestion.type === 'newtab' || suggestion.type === 'googleSuggest') {
            iconNode = createSearchIcon('subtext');
          } else {
            const suggestionHost = suggestion.url ? getHostFromUrl(suggestion.url) : '';
            if (suggestionHost && shouldBlockFaviconForHost(suggestionHost)) {
              iconNode = createLinkIcon();
            } else if (suggestion.favicon) {
              // Create icon for suggestions - always use img for all types
              const favicon = document.createElement('img');
              favicon.className = 'x-ov-suggestion-favicon';
              favicon.decoding = 'async';
              favicon.loading = 'eager';
              favicon.referrerPolicy = 'no-referrer';
              if (index < 4) {
                favicon.fetchPriority = 'high';
              }
              if (!isFaviconProxyUrl(suggestion.favicon)) {
                attachFaviconData(
                  favicon,
                  suggestion.favicon || '',
                  suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : ''
                );
              }
              applyFaviconOpticalAlignment(favicon);
              const replaceWithFallbackIcon = function() {
                const fallbackDiv = createLinkIcon();
                if (favicon.parentNode) {
                  favicon.parentNode.replaceChild(fallbackDiv, favicon);
                }
              };
              attachResolvedFaviconWithFallbacks(
                favicon,
                suggestion && suggestion.url ? suggestion.url : '',
                suggestionHost,
                suggestion.favicon || '',
                replaceWithFallbackIcon
              );
              iconNode = favicon;
            } else {
              iconNode = createSearchIcon('subtext');
            }
          }

          if (iconNode) {
            const isFaviconIcon = iconNode.tagName === 'IMG';
            const iconSlot = document.createElement('span');
            iconSlot.className = 'x-ov-suggestion-icon-slot';
            iconSlot._xIsFavicon = isFaviconIcon;
            iconSlot.appendChild(iconNode);
            iconNode = iconSlot;
            suggestionItem._xIconWrap = iconSlot;
            suggestionItem._xIconIsFavicon = isFaviconIcon;
            if (suggestion.type === 'directUrl' || suggestion.type === 'browserPage') {
              iconWrapper = iconSlot;
            }
          }

          // Create text wrapper for title and tag
          const textWrapper = document.createElement('div');
          textWrapper.className = 'x-ov-suggestion-text';

          // Create title with highlighted query
          const title = document.createElement('span');
          applyNoTranslate(title);
          let highlightedTitle;
          if (isPrimarySearchSuggest ||
              suggestion.type === 'chatgpt' ||
              suggestion.type === 'perplexity' ||
              suggestion.type === 'newtab' ||
              suggestion.type === 'siteSearch' ||
              suggestion.type === 'inlineSiteSearch' ||
              suggestion.type === 'siteSearchPrompt' ||
              suggestion.type === 'modeSwitch') {
            // For ChatGPT, Perplexity, and New Tab, don't highlight the query part
            highlightedTitle = suggestion.title;
          } else {
            // For other suggestions, highlight the query
            highlightedTitle = suggestion.title;
          }
          setProtectedHighlightedText(title, highlightedTitle, query, {
            background: 'var(--x-ext-mark-bg, #CFE8FF)',
            color: 'var(--x-ext-mark-text, #1E3A8A)'
          });
          title.className = 'x-ov-suggestion-title';
          suggestionItem._xTitle = title;

          textWrapper.appendChild(title);
          const reasonText = Array.isArray(suggestion.reasons)
            ? suggestion.reasons.map((item) => String(item || '').trim()).filter(Boolean).join(' · ')
            : '';
          if (overlayTabScoreDebugEnabled && reasonText) {
            const reasonLine = document.createElement('span');
            setProtectedPlainText(reasonLine, reasonText);
            reasonLine.className = 'x-ov-suggestion-reason';
            textWrapper.appendChild(reasonLine);
          }

          // Add history tag if type is history
          if (suggestion.type === 'history' && !suggestion.isTopSite) {
            const urlLine = buildUrlLine(suggestion.url || '');
            if (urlLine) {
              textWrapper.appendChild(urlLine);
            }
            const historyTag = createSuggestionSourceTag(t('search_tag_history', '历史'), {
              bg: 'var(--x-ov-tag-bg, #F3F4F6)',
              text: 'var(--x-ov-tag-text, #6B7280)',
              border: 'transparent'
            });
            textWrapper.appendChild(historyTag);
            suggestionItem._xHistoryTag = historyTag;
          }

          // Add topSite tag if type is topSite
          if (suggestion.type === 'topSite' || suggestion.isTopSite) {
            const urlLine = buildUrlLine(suggestion.url || '');
            if (urlLine) {
              textWrapper.appendChild(urlLine);
            }
            const topSiteTag = createSuggestionSourceTag(t('search_tag_top_site', '常用'), {
              bg: 'var(--x-ov-tag-bg, #F3F4F6)',
              text: 'var(--x-ov-tag-text, #6B7280)',
              border: 'transparent'
            });
            textWrapper.appendChild(topSiteTag);
            suggestionItem._xTopSiteTag = topSiteTag;
          }

          // Add bookmark tag if type is bookmark
          if (suggestion.type === 'bookmark') {
            if (suggestion.path) {
              const bookmarkPath = document.createElement('span');
              setProtectedPlainText(bookmarkPath, suggestion.path);
              bookmarkPath.className = 'x-ov-suggestion-bookmark-path';
              textWrapper.appendChild(bookmarkPath);
            }
            const bookmarkTag = createSuggestionSourceTag(t('search_tag_bookmark', '书签'), {
              bg: 'var(--x-ov-bookmark-tag-bg, #FEF3C7)',
              text: 'var(--x-ov-bookmark-tag-text, #D97706)',
              border: 'transparent'
            });
            textWrapper.appendChild(bookmarkTag);
            suggestionItem._xBookmarkTag = bookmarkTag;
          }
          if (shouldSwitchMatchedTab) {
            const openTabTag = createSuggestionSourceTag(t('search_tag_open_tab', '已打开'), {
              bg: 'var(--x-ov-tag-bg, #F3F4F6)',
              text: 'var(--x-ov-tag-text, #6B7280)',
              border: 'transparent'
            });
            textWrapper.appendChild(openTabTag);
            suggestionItem._xOpenTabTag = openTabTag;
          }

          const rightSide = document.createElement('div');
          rightSide.className = 'x-ov-suggestion-right';

          const actionTags = document.createElement('div');
          actionTags.className = 'x-ov-suggestion-action-tags';
          setSuggestionActionTagsVisible(actionTags, false);

          const isMergedHighlight = Boolean(mergedProvider && primarySuggestion === suggestion && isPrimaryHighlight);
          const itemActionModel = createSuggestionActionModel({
            suggestion,
            isPrimaryHighlight,
            isPrimarySearchSuggest,
            primaryHighlightReason,
            onlyKeywordSuggestions,
            isMergedHighlight,
            shouldSwitchMatchedTab,
            enterAction: 'openNewTab'
          });
          itemActionModel.actionTags.forEach((tag) => {
            actionTags.appendChild(createActionTag(
              getSuggestionActionLabel(tag.action),
              tag.keyLabel || 'Enter'
            ));
          });

          // Create visit button
          const visitButton = document.createElement('button');
          applyNoTranslate(visitButton);
          visitButton.type = 'button';
          visitButton.className = 'x-ov-suggestion-action-button x-ov-suggestion-visit-button';
          setSuggestionActionButtonVisible(visitButton, true);
          setSuggestionActionButtonPalette(visitButton, 'var(--x-ov-subtext, #9CA3AF)', 'transparent', 'transparent');
          suggestionItem._xAlwaysHideVisitButton = itemActionModel.alwaysHideVisitButton;
          if (suggestionItem._xAlwaysHideVisitButton) {
            setSuggestionActionButtonVisible(visitButton, false);
          }
          setSuggestionVisitButtonContent(visitButton, itemActionModel.visitButtonAction);

          let historyDeleteButton = null;
          let historyDeleteSlot = null;
          if (suggestion.type === 'history' && !suggestion.isTopSite) {
            historyDeleteSlot = document.createElement('div');
            applyNoTranslate(historyDeleteSlot);
            historyDeleteSlot.className = 'x-ov-history-delete-slot';
            setHistoryDeleteVisible(historyDeleteSlot, null, false);
            historyDeleteButton = document.createElement('button');
            applyNoTranslate(historyDeleteButton);
            historyDeleteButton.type = 'button';
            const removeHistoryTooltipText = t('search_remove_history_tooltip', '移除该历史');
            historyDeleteButton.innerHTML = getRiSvg('ri-delete-bin-6-line', 'ri-size-14');
            historyDeleteButton.setAttribute('aria-label', removeHistoryTooltipText);
            historyDeleteButton.setAttribute('title', removeHistoryTooltipText);
            historyDeleteButton.className = 'x-ov-history-delete-button';
            setHistoryDeleteVisible(null, historyDeleteButton, false);
            setHistoryDeleteButtonHover(historyDeleteButton, false);
            setHistoryDeleteButtonPalette(
              historyDeleteButton,
              'var(--x-ext-input-icon, #9CA3AF)',
              'transparent',
              'transparent'
            );
            historyDeleteButton.addEventListener('mouseenter', () => {
              const itemIndex = suggestionItems.indexOf(suggestionItem);
              const isSelected = itemIndex === selectedIndex;
              const shouldAutoHighlight = selectedIndex === -1 && suggestionItem._xIsAutocompleteTop;
              const shouldUseThemeHover = Boolean(isSelected || shouldAutoHighlight);
              const buttonThemeSource = suggestionItem._xTheme || defaultTheme;
              const resolvedTheme = getThemeForMode(buttonThemeSource);
              const hoverColors = shouldUseThemeHover
                ? getHoverColors(buttonThemeSource)
                : getNeutralHoverActionColors();
              showTopActionTooltip(historyDeleteButton, removeHistoryTooltipText);
              setHistoryDeleteButtonPalette(
                historyDeleteButton,
                shouldUseThemeHover ? resolvedTheme.buttonText : hoverColors.text,
                hoverColors.bg,
                hoverColors.border
              );
              setHistoryDeleteButtonHover(historyDeleteButton, true);
            });
            historyDeleteButton.addEventListener('mouseleave', () => {
              hideTopActionTooltip();
              setHistoryDeleteButtonSurface(historyDeleteButton, 'transparent', 'transparent');
              setHistoryDeleteButtonHover(historyDeleteButton, false);
            });
            historyDeleteButton.addEventListener('blur', () => {
              hideTopActionTooltip();
              setHistoryDeleteButtonSurface(historyDeleteButton, 'transparent', 'transparent');
              setHistoryDeleteButtonHover(historyDeleteButton, false);
            });
            historyDeleteButton.addEventListener('pointerup', () => {
              setHistoryDeleteButtonHover(historyDeleteButton, false);
            });
            historyDeleteButton.addEventListener('pointercancel', () => {
              setHistoryDeleteButtonHover(historyDeleteButton, false);
            });
            historyDeleteButton.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              chrome.runtime.sendMessage({
                action: 'deleteHistoryUrl',
                url: suggestion.url
              }, function(response) {
                if (!response || response.ok !== true) {
                  return;
                }
                const queryToRefresh = latestOverlayQuery || (searchInput ? String(searchInput.value || '').trim() : '');
                if (!queryToRefresh) {
                  updateSearchSuggestions([], '');
                  return;
                }
                chrome.runtime.sendMessage({
                  action: 'getSearchSuggestions',
                  query: queryToRefresh,
                  context: 'overlay'
                }, function(nextResponse) {
                  if (chrome.runtime && chrome.runtime.lastError) {
                    return;
                  }
                  updateSearchSuggestions(
                    nextResponse && Array.isArray(nextResponse.suggestions) ? nextResponse.suggestions : [],
                    queryToRefresh
                  );
                });
              });
            });
            historyDeleteSlot.appendChild(historyDeleteButton);
          }

          // Add hover effects
          suggestionItem.addEventListener('mouseenter', function() {
            this._xIsHovering = true;
            setNonFaviconIconBg(this, true);
            updateSelection();
            if (suggestionItems.indexOf(this) !== selectedIndex) {
              if (selectedIndex === -1 && this._xIsAutocompleteTop) {
                return;
              }
              setSuggestionRowColors(this, 'var(--x-ov-hover-bg)', 'transparent');
            }
          });

          suggestionItem.addEventListener('mouseleave', function() {
            this._xIsHovering = false;
            updateSelection();
          });

          // Add click handler to visit URL
          visitButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (suggestion.type === 'commandNewTab') {
              chrome.runtime.sendMessage({ action: 'openNewTab' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.type === 'commandSettings') {
              chrome.runtime.sendMessage({ action: 'openOptionsPage' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.type === 'siteSearchPrompt' && suggestion.provider) {
              activateSiteSearch(suggestion.provider);
              searchInput.focus();
              return;
            }
            if (shouldSwitchMatchedTabSuggestion(suggestion, index)) {
              chrome.runtime.sendMessage({
                action: 'switchToTab',
                tabId: suggestion._xMatchedTabId
              });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.provider && suggestion.searchQuery) {
              openSiteSearchProviderQuery(suggestion.provider, suggestion.searchQuery);
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.forceSearch && suggestion.searchQuery) {
              chrome.runtime.sendMessage({
                action: 'searchOrNavigate',
                query: suggestion.searchQuery,
                forceSearch: true
              });
            } else {
              console.log('Opening URL:', suggestion.url);
              recordSearchSuggestionSelectionFromSuggestion(suggestion, query, 'overlay');
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: suggestion.url
              });
            }
            removeOverlay(overlay);
            document.removeEventListener('click', clickOutsideHandler);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keydown', captureTabHandler, true);
          });

          // Add click handler to select item
          suggestionItem.addEventListener('click', function() {
            if (suggestion.type === 'commandNewTab') {
              chrome.runtime.sendMessage({ action: 'openNewTab' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.type === 'commandSettings') {
              chrome.runtime.sendMessage({ action: 'openOptionsPage' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.type === 'siteSearchPrompt' && suggestion.provider) {
              activateSiteSearch(suggestion.provider);
              searchInput.focus();
              return;
            }
            if (suggestion.type === 'modeSwitch') {
              applyThemeModeChange(suggestion.nextMode);
              searchInput.focus();
              return;
            }
            if (shouldSwitchMatchedTabSuggestion(suggestion, index)) {
              chrome.runtime.sendMessage({
                action: 'switchToTab',
                tabId: suggestion._xMatchedTabId
              });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.provider && suggestion.searchQuery) {
              openSiteSearchProviderQuery(suggestion.provider, suggestion.searchQuery);
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.forceSearch && suggestion.searchQuery) {
              chrome.runtime.sendMessage({
                action: 'searchOrNavigate',
                query: suggestion.searchQuery,
                forceSearch: true
              });
            } else {
              console.log('Opening URL:', suggestion.url);
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: suggestion.url
              });
            }
            removeOverlay(overlay);
            document.removeEventListener('click', clickOutsideHandler);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keydown', captureTabHandler, true);
          });

          leftSide.appendChild(iconNode);
          leftSide.appendChild(textWrapper);
          suggestionItem.appendChild(leftSide);
          rightSide.appendChild(actionTags);
          rightSide.appendChild(visitButton);
          suggestionItem.appendChild(rightSide);
          suggestionItem._xVisitButton = visitButton;
          suggestionItem._xTagContainer = actionTags;
          suggestionItem._xActionModel = itemActionModel;
          suggestionItem._xHasActionTags = itemActionModel.hasActionTags;
          suggestionItem._xHasSwitchAction = itemActionModel.hasSwitchAction;
          suggestionItem._xHistoryDeleteSlot = historyDeleteSlot;
          suggestionItem._xHistoryDeleteButton = historyDeleteButton;
          suggestionItem._xHasHistoryDeleteButton = Boolean(historyDeleteButton);
          if (iconWrapper) {
            suggestionItem._xDirectIconWrap = iconWrapper;
          }
          if (historyDeleteSlot) {
            rightSide.appendChild(historyDeleteSlot);
          }
          applyNoTranslateDeep(suggestionItem);
          suggestionsContainer.appendChild(suggestionItem);

          if (!shouldUseSearchEngineTheme &&
              !(onlyKeywordSuggestions && suggestion.type === 'newtab') &&
              suggestion.type !== 'directUrl' &&
              suggestion.type !== 'browserPage') {
            getThemeForSuggestion(suggestion).then((theme) => {
              if (!suggestionItem.isConnected) {
                return;
              }
              suggestionItem._xTheme = theme;
              applyThemeVariables(suggestionItem, theme);
              updateSelection();
            });
          }
        });
        updateSelection();
        if (shouldAnimateGrowth) {
          animateSuggestionsGrowth(suggestionsContainer, previousHeight);
        }
      // Update keyboard navigation
      if (!canAppend) {
        selectedIndex = -1;
      }
      });
    }

    function clearSearchSuggestions() {
      inlineSearchState = null;
      siteSearchTriggerState = null;
      clearSiteSearchTabHint();
      lastSuggestionResponse = [];
      requestTabsAndRender();
    }

    // Focus the input when created
    setTimeout(() => searchInput.focus(), 100);
    overlay.appendChild(inputContainer);
    overlay.appendChild(suggestionsContainer);
    applyNoTranslateDeep(overlay);
    document.body.appendChild(overlayHost);
    startOverlayViewportSizeSync(overlay);
    startOverlayAntiTranslateObserver(overlay);

    const revealOverlay = () => {
      if (!overlay || !overlay.isConnected) {
        return;
      }
      if (overlayRevealGate && typeof overlayRevealGate.release === 'function') {
        overlayRevealGate.release();
      }
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        overlay.style.setProperty('opacity', '1', 'important');
        overlay.style.setProperty('transform', 'translateX(-50%) translateY(0) scale(1)', 'important');
        overlay.style.setProperty('filter', 'blur(0)', 'important');
      } else {
        clearOverlayEnterAnimationFrames();
        // Flush initial style state before starting transition to avoid skipped enter animations.
        void overlay.offsetHeight;
        overlayFrameTracker.runEnterAnimation(overlay, () => {
          overlay.style.setProperty('opacity', '1', 'important');
          overlay.style.setProperty('transform', 'translateX(-50%) translateY(0) scale(1)', 'important');
          overlay.style.setProperty('filter', 'blur(0)', 'important');
        });
      }
    };
    const revealReady = overlayRevealGate && typeof overlayRevealGate.waitUntilReady === 'function'
      ? overlayRevealGate.waitUntilReady()
      : Promise.resolve({ ok: true, reason: 'no-site-fix' });
    Promise.resolve(revealReady).then(revealOverlay).catch(revealOverlay);
    // Let the container paint first so the enter transition is visible on busy pages.
    const queueInitialOverlayRender = () => {
      if (!overlay.isConnected) {
        return;
      }
      if (initialPrefillQuery) {
        searchInput.value = initialPrefillQuery;
        if (typeof searchInput.setSelectionRange === 'function') {
          searchInput.setSelectionRange(initialPrefillQuery.length, initialPrefillQuery.length);
        }
        latestRawInputValue = initialPrefillQuery;
        latestOverlayQuery = initialPrefillQuery.trim();
        updateModeBadge(initialPrefillQuery);
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      requestTabsAndRender();
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(queueInitialOverlayRender);
    });
    overlayScrollPauseHandler = () => {
      pauseOverlayAntiTranslateObserverForScroll();
    };
    window.addEventListener('scroll', overlayScrollPauseHandler, true);
    window.addEventListener('wheel', overlayScrollPauseHandler, { passive: true, capture: true });
    window.addEventListener('touchmove', overlayScrollPauseHandler, { passive: true, capture: true });
  }
};
