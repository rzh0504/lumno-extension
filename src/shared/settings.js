(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSettings = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function normalizeLocale(locale) {
    const raw = String(locale || '').trim();
    if (!raw) {
      return 'en';
    }
    const lower = raw.toLowerCase();
    if (lower.startsWith('zh')) {
      if (lower.includes('tw') || lower.includes('hk') || lower.includes('mo') || lower.includes('hant')) {
        return 'zh_TW';
      }
      return 'zh_CN';
    }
    if (lower === 'ja' || lower.startsWith('ja-') || lower.startsWith('ja_')) {
      return 'ja';
    }
    return 'en';
  }

  function localeToHtmlLang(locale) {
    const normalized = normalizeLocale(locale);
    if (normalized === 'zh_CN') {
      return 'zh-CN';
    }
    if (normalized === 'zh_TW') {
      return 'zh-TW';
    }
    if (normalized === 'ja') {
      return 'ja';
    }
    return 'en';
  }

  function normalizeNewtabWidthMode(value) {
    return value === 'standard' ? 'standard' : 'wide';
  }

  function normalizeNewtabSearchWidth(value, options) {
    const config = options || {};
    const allowNull = Boolean(config.allowNull);
    const min = Number.isFinite(Number(config.min)) ? Number(config.min) : 720;
    const max = Number.isFinite(Number(config.max)) ? Number(config.max) : 1040;
    const fallback = Number.isFinite(Number(config.fallback)) ? Number(config.fallback) : 920;
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return allowNull ? null : fallback;
    }
    return Math.min(max, Math.max(min, Math.round(number)));
  }

  function normalizeNewtabWordmarkVisible(value) {
    return value !== false;
  }

  function normalizeOverlaySizeMode(value) {
    if (value === 'compact' || value === 'large') {
      return value;
    }
    return 'standard';
  }

  function normalizeOverlayTabPriorityMode(value) {
    if (value === 'switchTabFirst') {
      return true;
    }
    if (value === 'newtabFirst') {
      return false;
    }
    if (value === false) {
      return false;
    }
    return true;
  }

  function normalizeSearchResultPriority(value) {
    return value === 'search' ? 'search' : 'autocomplete';
  }

  function normalizeTabRankScoreDebugMode(value) {
    return value === true;
  }

  function normalizeThemePreference(value) {
    if (value === 'dark') {
      return 'dark';
    }
    if (value === 'light') {
      return 'light';
    }
    return '';
  }

  return Object.freeze({
    normalizeLocale,
    localeToHtmlLang,
    normalizeNewtabWidthMode,
    normalizeNewtabSearchWidth,
    normalizeNewtabWordmarkVisible,
    normalizeOverlaySizeMode,
    normalizeOverlayTabPriorityMode,
    normalizeSearchResultPriority,
    normalizeTabRankScoreDebugMode,
    normalizeThemePreference
  });
});
