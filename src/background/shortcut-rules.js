(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoShortcutRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function getBrowserInternalScheme(userAgent) {
    const ua = String(userAgent || '');
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

  function normalizeBrandName(brand) {
    return String(brand || '').replace(/\s+/g, ' ').trim();
  }

  function isGreaseBrandName(brand) {
    const compact = normalizeBrandName(brand).toLowerCase().replace(/[^a-z]/g, '');
    return compact.includes('not') && compact.includes('brand');
  }

  function isChromiumEngineBrandName(brand) {
    return normalizeBrandName(brand).toLowerCase() === 'chromium';
  }

  function getClientHintBrowserName(userAgentData) {
    const brands = userAgentData && Array.isArray(userAgentData.brands)
      ? userAgentData.brands
      : [];
    const names = brands
      .map((item) => normalizeBrandName(item && item.brand))
      .filter((name) => name && !isGreaseBrandName(name));
    const productName = names.find((name) => {
      const lower = name.toLowerCase();
      return !isChromiumEngineBrandName(name) &&
        lower !== 'google chrome' &&
        lower !== 'chrome';
    });
    if (productName) {
      return productName;
    }
    return names.find((name) => !isChromiumEngineBrandName(name)) ||
      names.find((name) => isChromiumEngineBrandName(name)) ||
      '';
  }

  function getFallbackBrowserName(userAgent, scheme) {
    if (scheme === 'edge://') {
      return 'Microsoft Edge';
    }
    if (scheme === 'brave://') {
      return 'Brave';
    }
    if (scheme === 'vivaldi://') {
      return 'Vivaldi';
    }
    if (scheme === 'opera://') {
      return 'Opera';
    }
    return 'Chrome';
  }

  function getBrowserInternalProfile(navigatorLike) {
    const source = navigatorLike && typeof navigatorLike === 'object'
      ? navigatorLike
      : { userAgent: navigatorLike };
    const userAgent = String(source.userAgent || '');
    const scheme = getBrowserInternalScheme(userAgent);
    return {
      scheme,
      name: getClientHintBrowserName(source.userAgentData) ||
        getFallbackBrowserName(userAgent, scheme)
    };
  }

  function getShortcutUrlForScheme(query, rules, scheme) {
    if (!query || !Array.isArray(rules)) {
      return null;
    }
    const queryLower = query.toLowerCase();
    const browserScheme = scheme || 'chrome://';
    for (let i = 0; i < rules.length; i += 1) {
      const rule = rules[i];
      if (!rule || !Array.isArray(rule.keys)) {
        continue;
      }
      const isMatch = rule.keys.some((key) => queryLower.startsWith(key));
      if (!isMatch) {
        continue;
      }
      if (rule.type === 'browserPage' && rule.path) {
        return `${browserScheme}${rule.path}`;
      }
      if (rule.type === 'url' && rule.url) {
        return rule.url;
      }
    }
    return null;
  }

  function create(options) {
    const settings = options && typeof options === 'object' ? options : {};
    const chromeApi = settings.chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
    const fetchImpl = settings.fetchImpl || (typeof fetch === 'function' ? fetch : null);
    const navigatorLike = settings.navigatorLike || (typeof navigator !== 'undefined' ? navigator : null);
    let shortcutRulesCache = null;
    let shortcutRulesPromise = null;

    function getRuntimeUrl(path) {
      return chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getURL === 'function'
        ? chromeApi.runtime.getURL(path)
        : path;
    }

    function loadShortcutRules() {
      if (shortcutRulesCache) {
        return Promise.resolve(shortcutRulesCache);
      }
      if (shortcutRulesPromise) {
        return shortcutRulesPromise;
      }
      if (typeof fetchImpl !== 'function') {
        return Promise.resolve([]);
      }
      const rulesUrl = getRuntimeUrl('assets/data/shortcut-rules.json');
      shortcutRulesPromise = fetchImpl(rulesUrl)
        .then((response) => response.json())
        .then((data) => {
          const items = data && Array.isArray(data.items) ? data.items : [];
          shortcutRulesCache = items;
          return items;
        })
        .catch(() => []);
      return shortcutRulesPromise;
    }

    function getShortcutUrl(query, rules) {
      const scheme = getBrowserInternalProfile(navigatorLike).scheme;
      return getShortcutUrlForScheme(query, rules, scheme);
    }

    return Object.freeze({
      loadShortcutRules,
      getShortcutUrl
    });
  }

  return Object.freeze({
    create,
    getBrowserInternalScheme,
    getBrowserInternalProfile,
    getShortcutUrlForScheme
  });
});
