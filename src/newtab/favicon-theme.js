(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoNewtabFaviconTheme = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const defaultAccentColor = [59, 130, 246];
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

  function mixColor(color, target, amount) {
    return [
      Math.round(color[0] + (target[0] - color[0]) * amount),
      Math.round(color[1] + (target[1] - color[1]) * amount),
      Math.round(color[2] + (target[2] - color[2]) * amount)
    ];
  }

  function stableHashCode(text) {
    const input = String(text || '');
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function rgbToCss(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  function rgbToCssAlpha(rgb, alpha) {
    const nextAlpha = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${nextAlpha})`;
  }

  function rgbToCssParts(rgb) {
    return `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
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
    const rgbMatch = trimmed.match(/^rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)(?:\s*,\s*(?:[0-9.]+|[0-9.]+%))?\s*\)$/);
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
      buttonText,
      buttonBg: rgbToCss(buttonBg),
      buttonBorder: rgbToCss(buttonBorder),
      placeholderText
    };
  }

  function buildTheme(rgb) {
    const accent = normalizeAccentColor(rgb);
    return buildThemeVariant(accent, 'light');
  }

  function createDefaultTheme() {
    const theme = buildTheme(defaultAccentColor);
    theme._xIsDefault = true;
    theme._xIsBrand = false;
    theme._xThemeSource = 'fallback';
    return theme;
  }

  function createUrlHighlightTheme() {
    const theme = buildTheme(defaultAccentColor);
    theme._xIsBrand = true;
    theme._xIsUrl = true;
    theme._xThemeSource = 'url';
    return theme;
  }

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
    if (!hostname) {
      return '';
    }
    const host = String(hostname).toLowerCase().replace(/^www\./i, '');
    if (host === 'feishu.cn' || host.endsWith('.feishu.cn')) {
      return 'feishu.cn';
    }
    return host;
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
    const theme = createDefaultTheme();
    theme._xIsFallback = true;
    return theme;
  }

  function getThemeFingerprint(theme) {
    const source = theme && theme._xThemeSource
      ? String(theme._xThemeSource)
      : (theme && theme._xIsDefault ? 'fallback' : (theme && theme._xIsBrand ? 'brand' : 'unknown'));
    const rgb = theme && (theme.accentRgb || parseCssColor(theme.accent));
    const accent = rgb && rgb.length === 3 ? rgb : defaultAccentColor;
    return `${source}:${accent.join(',')}`;
  }

  function hasThemeTokenInUrl(url, token) {
    const lower = String(url || '').toLowerCase();
    return new RegExp(`(^|[._/-])${token}([._/-]|$)`).test(lower);
  }

  function shouldSkipThemeUpgradeCandidate(candidateUrl, preferredTheme, currentUrl) {
    const mode = preferredTheme === 'dark' ? 'dark' : (preferredTheme === 'light' ? 'light' : '');
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

  function getKnownThemedFaviconCandidates(hostname, preferredTheme) {
    const host = normalizeFaviconHost(hostname);
    if (!host) {
      return [];
    }
    if (host === 'lumno.kubai.design') {
      const chromeApi = root.chrome;
      const lumnoIconUrl = (chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getURL === 'function')
        ? chromeApi.runtime.getURL('assets/images/lumno.png')
        : 'https://lumno.kubai.design/favicon.png';
      return [
        lumnoIconUrl
      ];
    }
    if (host === 'github.com' || host.endsWith('.github.com')) {
      if (preferredTheme === 'dark') {
        return [
          'https://github.githubassets.com/favicons/favicon-dark.svg',
          'https://github.githubassets.com/favicons/favicon.svg',
          'https://github.githubassets.com/favicons/favicon.png'
        ];
      }
      return [
        'https://github.githubassets.com/favicons/favicon.svg',
        'https://github.githubassets.com/favicons/favicon-dark.svg',
        'https://github.githubassets.com/favicons/favicon.png'
      ];
    }
    return [];
  }

  function hostHasExplicitDarkFavicon(hostname) {
    const host = normalizeFaviconHost(hostname);
    if (!host) {
      return false;
    }
    return host === 'github.com' || host.endsWith('.github.com');
  }

  function isFaviconProxyUrl(url) {
    if (!url) {
      return false;
    }
    return /google\.com\/s2\/favicons/i.test(url) ||
      /gstatic\.com\/favicon/i.test(url) ||
      /favicon\.is\//i.test(url);
  }

  function extractAverageColor(image) {
    const size = 16;
    const doc = root.document;
    if (!doc || typeof doc.createElement !== 'function') {
      return null;
    }
    const canvas = doc.createElement('canvas');
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

  function resolveDarkModeOption(options) {
    if (options && typeof options.isDarkMode === 'function') {
      return Boolean(options.isDarkMode());
    }
    return Boolean(options && options.isDarkMode);
  }

  function getThemeForMode(theme, options) {
    const fallbackTheme = options && options.defaultTheme ? options.defaultTheme : createDefaultTheme();
    const sourceTheme = theme || fallbackTheme;
    if (!resolveDarkModeOption(options)) {
      return sourceTheme;
    }
    if (sourceTheme._xDark) {
      return sourceTheme._xDark;
    }
    const accentRgb = sourceTheme.accentRgb || parseCssColor(sourceTheme.accent) || defaultAccentColor;
    const darkTheme = buildThemeVariant(accentRgb, 'dark');
    darkTheme._xIsDefault = Boolean(sourceTheme._xIsDefault);
    darkTheme._xIsBrand = Boolean(sourceTheme._xIsBrand);
    sourceTheme._xDark = darkTheme;
    return darkTheme;
  }

  function getHoverColors(theme, options) {
    const resolvedTheme = getThemeForMode(theme, options);
    const accentRgb = resolvedTheme.accentRgb || parseCssColor(resolvedTheme.accent) || defaultAccentColor;
    const isDark = resolveDarkModeOption(options);
    const base = isDark ? [48, 48, 48] : [255, 255, 255];
    return {
      bg: rgbToCss(mixColor(accentRgb, base, isDark ? 0.6 : 0.9)),
      border: rgbToCss(mixColor(accentRgb, base, isDark ? 0.4 : 0.72))
    };
  }

  return {
    defaultAccentColor,
    mixColor,
    stableHashCode,
    rgbToCss,
    rgbToCssAlpha,
    rgbToCssParts,
    parseCssColor,
    getLuminance,
    getReadableTextColor,
    normalizeAccentColor,
    buildThemeVariant,
    buildTheme,
    createDefaultTheme,
    createUrlHighlightTheme,
    normalizeHost,
    normalizeFaviconHost,
    getBrandAccentForHost,
    getBrandAccentForUrl,
    buildFallbackThemeForHost,
    getThemeFingerprint,
    hasThemeTokenInUrl,
    shouldSkipThemeUpgradeCandidate,
    getKnownThemedFaviconCandidates,
    hostHasExplicitDarkFavicon,
    isFaviconProxyUrl,
    extractAverageColor,
    getThemeForMode,
    getHoverColors
  };
});
