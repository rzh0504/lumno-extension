(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoFaviconUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function normalizeFaviconHost(hostname) {
    if (!hostname) {
      return '';
    }
    const host = String(hostname).toLowerCase().replace(/^www\./i, '');
    if (host === 'feishu.cn' || host.endsWith('.feishu.cn')) {
      return 'feishu.cn';
    }
    return host;
  }

  function isFaviconProxyUrl(url) {
    return /google\.com\/s2\/favicons/i.test(String(url || '')) ||
      /gstatic\.com\/favicon/i.test(String(url || '')) ||
      /favicon\.is\//i.test(String(url || ''));
  }

  function isChromeMonogramFaviconUrl(url) {
    return /^chrome:\/\/favicon2\//i.test(String(url || '').trim());
  }

  function getChromeFaviconUrl(url) {
    if (!url || !/^https?:\/\//i.test(url)) {
      return '';
    }
    return `chrome://favicon2/?size=128&scale_factor=2x&show_fallback_monogram=1&url=${encodeURIComponent(url)}`;
  }

  function normalizeFaviconThemePreference(theme) {
    const value = String(theme || '').trim().toLowerCase();
    return value === 'dark' || value === 'light' ? value : '';
  }

  function hasThemeTokenInUrl(url, token) {
    const mode = normalizeFaviconThemePreference(token);
    if (!mode) {
      return false;
    }
    const lower = String(url || '').toLowerCase();
    return new RegExp(`(^|[._/-])${mode}([._/-]|$)`).test(lower);
  }

  function shouldSkipThemeUpgradeCandidate(candidateUrl, preferredTheme, currentUrl) {
    const mode = normalizeFaviconThemePreference(preferredTheme);
    if (!mode) {
      return false;
    }
    const opposite = mode === 'dark' ? 'light' : 'dark';
    if (hasThemeTokenInUrl(candidateUrl, opposite)) {
      return true;
    }
    const currentHasPreferredToken = hasThemeTokenInUrl(currentUrl, mode);
    const candidateHasPreferredToken = hasThemeTokenInUrl(candidateUrl, mode);
    if (currentHasPreferredToken && !candidateHasPreferredToken) {
      return true;
    }
    return false;
  }

  function getRuntimeFaviconUrl(path, options) {
    const getRuntimeUrl = options && typeof options.getRuntimeUrl === 'function'
      ? options.getRuntimeUrl
      : null;
    if (!getRuntimeUrl) {
      return '';
    }
    try {
      return String(getRuntimeUrl(path) || '');
    } catch (e) {
      return '';
    }
  }

  function getKnownThemedFaviconCandidateScores(hostname, preferredTheme, options) {
    const host = normalizeFaviconHost(hostname);
    const mode = normalizeFaviconThemePreference(preferredTheme);
    if (!host) {
      return [];
    }
    if (host === 'lumno.kubai.design') {
      return [
        {
          url: getRuntimeFaviconUrl('assets/images/lumno.png', options) || 'https://lumno.kubai.design/favicon.png',
          score: 58
        }
      ];
    }
    if (host === 'github.com' || host.endsWith('.github.com')) {
      if (mode === 'dark') {
        return [
          { url: 'https://github.githubassets.com/favicons/favicon-dark.svg', score: 60 },
          { url: 'https://github.githubassets.com/favicons/favicon.svg', score: 42 },
          { url: 'https://github.githubassets.com/favicons/favicon.png', score: 36 }
        ];
      }
      if (mode === 'light') {
        return [
          { url: 'https://github.githubassets.com/favicons/favicon.svg', score: 60 },
          { url: 'https://github.githubassets.com/favicons/favicon-dark.svg', score: 40 },
          { url: 'https://github.githubassets.com/favicons/favicon.png', score: 36 }
        ];
      }
      return [
        { url: 'https://github.githubassets.com/favicons/favicon.svg', score: 52 },
        { url: 'https://github.githubassets.com/favicons/favicon-dark.svg', score: 52 },
        { url: 'https://github.githubassets.com/favicons/favicon.png', score: 36 }
      ];
    }
    return [];
  }

  function getKnownThemedFaviconCandidateUrls(hostname, preferredTheme, options) {
    const mode = normalizeFaviconThemePreference(preferredTheme);
    const scoreMode = mode === 'dark' ? 'dark' : 'light';
    return getKnownThemedFaviconCandidateScores(hostname, scoreMode, options)
      .map((item) => item.url)
      .filter(Boolean);
  }

  function getRootFaviconCandidateScores(hostname, preferredTheme) {
    const host = normalizeFaviconHost(hostname);
    const mode = normalizeFaviconThemePreference(preferredTheme);
    if (!host) {
      return [];
    }
    const themed = mode === 'dark'
      ? [
        { url: `https://${host}/favicon-dark.svg`, score: 34 },
        { url: `https://${host}/favicon.svg`, score: 28 },
        { url: `https://${host}/favicon-light.svg`, score: 16 }
      ]
      : mode === 'light'
        ? [
          { url: `https://${host}/favicon-light.svg`, score: 32 },
          { url: `https://${host}/favicon.svg`, score: 29 },
          { url: `https://${host}/favicon-dark.svg`, score: 15 }
        ]
        : [
          { url: `https://${host}/favicon.svg`, score: 28 },
          { url: `https://${host}/favicon-dark.svg`, score: 20 },
          { url: `https://${host}/favicon-light.svg`, score: 20 }
        ];
    return [
      ...themed,
      { url: `https://${host}/favicon.ico`, score: 24 },
      { url: `https://${host}/apple-touch-icon.png`, score: 16 }
    ];
  }

  function getThemeHintScore(url, mediaValue, preferredTheme) {
    const normalizedTheme = normalizeFaviconThemePreference(preferredTheme);
    if (!normalizedTheme) {
      return 0;
    }
    let score = 0;
    const lowerMedia = String(mediaValue || '').toLowerCase();
    if (lowerMedia.includes('prefers-color-scheme')) {
      const hasDark = /prefers-color-scheme\s*:\s*dark/.test(lowerMedia);
      const hasLight = /prefers-color-scheme\s*:\s*light/.test(lowerMedia);
      if ((normalizedTheme === 'dark' && hasDark) || (normalizedTheme === 'light' && hasLight)) {
        score += 34;
      }
      if ((normalizedTheme === 'dark' && hasLight) || (normalizedTheme === 'light' && hasDark)) {
        score -= 20;
      }
    }
    const hasDarkToken = hasThemeTokenInUrl(url, 'dark');
    const hasLightToken = hasThemeTokenInUrl(url, 'light');
    if (normalizedTheme === 'dark') {
      if (hasDarkToken) {
        score += 16;
      }
      if (hasLightToken) {
        score -= 8;
      }
    } else if (normalizedTheme === 'light') {
      if (hasLightToken) {
        score += 16;
      }
      if (hasDarkToken) {
        score -= 8;
      }
    }
    return score;
  }

  function getHtmlAttributeValue(tag, name) {
    if (!tag || !name) {
      return '';
    }
    const pattern = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
    const match = String(tag).match(pattern);
    return match ? String(match[2] || match[3] || match[4] || '').trim() : '';
  }

  function parseHtmlIconCandidateScores(html, pageUrl, preferredTheme) {
    if (!html || !pageUrl) {
      return [];
    }
    const normalizedTheme = normalizeFaviconThemePreference(preferredTheme);
    const list = [];
    const linkMatches = String(html).match(/<link\b[^>]*>/gi) || [];
    linkMatches.forEach((tag) => {
      const rel = getHtmlAttributeValue(tag, 'rel').toLowerCase();
      const hrefRaw = getHtmlAttributeValue(tag, 'href');
      if (!rel.includes('icon') || !hrefRaw) {
        return;
      }
      let href = '';
      try {
        href = new URL(hrefRaw, pageUrl).href;
      } catch (e) {
        return;
      }
      const type = getHtmlAttributeValue(tag, 'type').toLowerCase();
      const sizes = getHtmlAttributeValue(tag, 'sizes').toLowerCase();
      const media = getHtmlAttributeValue(tag, 'media').toLowerCase();
      let score = 10;
      if (/\bicon\b/.test(rel)) {
        score += 20;
      }
      if (rel.includes('shortcut')) {
        score += 6;
      }
      if (rel.includes('apple-touch-icon')) {
        score += 8;
      }
      if (type.includes('svg') || href.toLowerCase().endsWith('.svg')) {
        score += 14;
      }
      if (href.toLowerCase().includes('favicon')) {
        score += 6;
      }
      score += getThemeHintScore(href, media, normalizedTheme);
      const sizeNumbers = sizes.match(/\d+/g);
      if (sizeNumbers && sizeNumbers.length > 0) {
        const size = Math.max(...sizeNumbers.map((n) => Number(n) || 0));
        score += Math.min(20, Math.floor(size / 8));
      }
      list.push({ url: href, score: score });
      if (normalizedTheme === 'dark' && /\/favicon\.svg(?:[?#].*)?$/i.test(href)) {
        list.push({
          url: href.replace(/\/favicon\.svg([?#].*)?$/i, '/favicon-dark.svg$1'),
          score: score + 14
        });
      }
      if (normalizedTheme === 'light' && /\/favicon-dark\.svg(?:[?#].*)?$/i.test(href)) {
        list.push({
          url: href.replace(/\/favicon-dark\.svg([?#].*)?$/i, '/favicon.svg$1'),
          score: score + 14
        });
      }
      const baseHrefRaw = getHtmlAttributeValue(tag, 'data-base-href');
      if (baseHrefRaw) {
        let baseHref = '';
        try {
          baseHref = new URL(baseHrefRaw, pageUrl).href;
        } catch (e) {
          baseHref = '';
        }
        if (baseHref) {
          if (normalizedTheme === 'dark') {
            list.push({ url: `${baseHref}-dark.svg`, score: score + 20 });
            list.push({ url: `${baseHref}.svg`, score: score + 8 });
          } else if (normalizedTheme === 'light') {
            list.push({ url: `${baseHref}.svg`, score: score + 20 });
            list.push({ url: `${baseHref}-light.svg`, score: score + 12 });
          } else {
            list.push({ url: `${baseHref}.svg`, score: score + 12 });
            list.push({ url: `${baseHref}-dark.svg`, score: score + 12 });
          }
        }
      }
    });
    return list;
  }

  function parseCssThemeColor(color) {
    const value = String(color || '').trim().toLowerCase();
    if (!value || value === 'transparent') {
      return null;
    }
    if (value.startsWith('#')) {
      const hex = value.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return [r, g, b].every((channel) => Number.isFinite(channel)) ? [r, g, b] : null;
      }
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return [r, g, b].every((channel) => Number.isFinite(channel)) ? [r, g, b] : null;
      }
      return null;
    }
    const rgbMatch = value.match(/^rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)(?:\s*,\s*(?:[0-9.]+|[0-9.]+%))?\s*\)$/);
    if (!rgbMatch) {
      return null;
    }
    const rgb = [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
    return rgb.every((channel) => Number.isFinite(channel) && channel >= 0 && channel <= 255)
      ? rgb.map((channel) => Math.round(channel))
      : null;
  }

  function getThemeMediaScore(media, preferredTheme) {
    const theme = normalizeFaviconThemePreference(preferredTheme);
    const value = String(media || '').toLowerCase();
    if (!value) {
      return 8;
    }
    const wantsDark = value.includes('prefers-color-scheme') && value.includes('dark');
    const wantsLight = value.includes('prefers-color-scheme') && value.includes('light');
    if (theme === 'dark') {
      return wantsDark ? 28 : (wantsLight ? -18 : 4);
    }
    if (theme === 'light') {
      return wantsLight ? 28 : (wantsDark ? -18 : 4);
    }
    return wantsDark || wantsLight ? 12 : 4;
  }

  function parseHtmlThemeColorCandidates(html, pageUrl, preferredTheme) {
    const list = [];
    const metaMatches = String(html || '').match(/<meta\b[^>]*>/gi) || [];
    metaMatches.forEach((tag) => {
      const name = getHtmlAttributeValue(tag, 'name').toLowerCase();
      if (name !== 'theme-color') {
        return;
      }
      const accentRgb = parseCssThemeColor(getHtmlAttributeValue(tag, 'content'));
      if (!accentRgb) {
        return;
      }
      list.push({
        accentRgb,
        source: 'meta',
        score: 80 + getThemeMediaScore(getHtmlAttributeValue(tag, 'media'), preferredTheme)
      });
    });
    const manifestMatches = String(html || '').match(/<link\b[^>]*>/gi) || [];
    manifestMatches.forEach((tag) => {
      const rel = getHtmlAttributeValue(tag, 'rel').toLowerCase();
      const hrefRaw = getHtmlAttributeValue(tag, 'href');
      if (!rel.includes('manifest') || !hrefRaw) {
        return;
      }
      try {
        list.push({
          manifestUrl: new URL(hrefRaw, pageUrl).href,
          source: 'meta',
          score: 42
        });
      } catch (e) {
        // Ignore malformed manifest links.
      }
    });
    return list;
  }

  function pickBestThemeColorCandidate(candidates) {
    const sorted = (Array.isArray(candidates) ? candidates : [])
      .filter((item) => item && (item.accentRgb || item.manifestUrl))
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    return sorted[0] || null;
  }

  function hostHasExplicitDarkFavicon(hostname) {
    const host = normalizeFaviconHost(hostname);
    if (!host) {
      return false;
    }
    return host === 'github.com' || host.endsWith('.github.com');
  }

  function isLocalNetworkHost(hostname) {
    const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
    if (!host) {
      return false;
    }
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host === 'host.docker.internal'
    ) {
      return true;
    }
    if (/^\d{1,3}(?:\.\d{1,3}){0,2}$/.test(host)) {
      const shortParts = host.split('.').map((part) => Number(part));
      if (shortParts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
        return true;
      }
    }
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      const parts = host.split('.').map((part) => Number(part));
      if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
        return false;
      }
      if (
        parts[0] === 0 ||
        parts[0] === 10 ||
        parts[0] === 127 ||
        (parts[0] === 169 && parts[1] === 254)
      ) {
        return true;
      }
      if (parts[0] === 192 && parts[1] === 168) {
        return true;
      }
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
        return true;
      }
      if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) {
        return true;
      }
      return false;
    }
    const ipv6 = host.split('%')[0];
    if (
      ipv6 === '::1' ||
      ipv6 === '0:0:0:0:0:0:0:1' ||
      ipv6 === '::' ||
      /^fe[89ab][0-9a-f]*:/i.test(ipv6) ||
      /^[fd][0-9a-f]{1,3}:/i.test(ipv6)
    ) {
      return true;
    }
    const mappedIpv4 = ipv6.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
    if (mappedIpv4 && mappedIpv4[1]) {
      return isLocalNetworkHost(mappedIpv4[1]);
    }
    return false;
  }

  function isSuspiciousLocalFaviconHost(hostname) {
    const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
    if (!host) {
      return false;
    }
    const ipv6 = host.split('%')[0];
    if (host.includes(':') || ipv6.includes(':')) {
      return false;
    }
    if (/^\d{1,3}(?:\.\d{1,3}){0,3}$/.test(host)) {
      return false;
    }
    if (!host.includes('.')) {
      return /^[a-z0-9-]+$/i.test(host);
    }
    const labels = host.split('.').filter(Boolean);
    if (labels.length < 2) {
      return false;
    }
    const suffix = labels[labels.length - 1];
    return [
      'internal',
      'intern',
      'test',
      'localdev',
      'lan',
      'home',
      'corp',
      'localdomain'
    ].includes(suffix);
  }

  function shouldBlockFaviconForHost(hostname) {
    return isLocalNetworkHost(hostname) || isSuspiciousLocalFaviconHost(hostname);
  }

  function getFaviconUrlHostCandidate(url) {
    const raw = String(url || '').trim();
    if (!raw) {
      return '';
    }
    const decodedRaw = (() => {
      try {
        return decodeURIComponent(raw);
      } catch (e) {
        return raw;
      }
    })();
    const withoutScheme = decodedRaw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
    const authority = withoutScheme.split(/[/?#]/)[0] || '';
    const hostCandidateRaw = authority.includes('@') ? authority.split('@').pop() : authority;
    const value = String(hostCandidateRaw || '').trim().toLowerCase();
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
  }

  function isBlockedLocalFaviconUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) {
      return false;
    }
    try {
      const parsed = new URL(raw);
      const protocol = String(parsed.protocol || '').toLowerCase();
      if (protocol === 'chrome:' && parsed.hostname === 'favicon2') {
        const nested = parsed.searchParams.get('url') || '';
        if (nested) {
          const nestedHostCandidate = getFaviconUrlHostCandidate(nested);
          if (nestedHostCandidate && shouldBlockFaviconForHost(nestedHostCandidate)) {
            return true;
          }
          try {
            const nestedUrl = new URL(nested);
            if (shouldBlockFaviconForHost(nestedUrl.hostname)) {
              return true;
            }
          } catch (e) {
            // Ignore malformed nested URL.
          }
        }
        return false;
      }
      if ((protocol === 'http:' || protocol === 'https:') && shouldBlockFaviconForHost(parsed.hostname)) {
        return true;
      }
    } catch (e) {
      // Ignore malformed URL.
    }
    const hostCandidate = getFaviconUrlHostCandidate(raw);
    if (hostCandidate && shouldBlockFaviconForHost(hostCandidate)) {
      return true;
    }
    return false;
  }

  return Object.freeze({
    getChromeFaviconUrl,
    getHtmlAttributeValue,
    getKnownThemedFaviconCandidateScores,
    getKnownThemedFaviconCandidateUrls,
    getRootFaviconCandidateScores,
    getThemeHintScore,
    getThemeMediaScore,
    hasThemeTokenInUrl,
    hostHasExplicitDarkFavicon,
    isBlockedLocalFaviconUrl,
    isChromeMonogramFaviconUrl,
    isFaviconProxyUrl,
    isLocalNetworkHost,
    isSuspiciousLocalFaviconHost,
    normalizeFaviconThemePreference,
    normalizeFaviconHost,
    parseCssThemeColor,
    parseHtmlIconCandidateScores,
    parseHtmlThemeColorCandidates,
    pickBestThemeColorCandidate,
    shouldSkipThemeUpgradeCandidate,
    shouldBlockFaviconForHost
  });
});
