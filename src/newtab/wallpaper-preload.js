(function() {
  const PRELOAD_STORAGE_KEY = '_x_extension_newtab_wallpaper_preload_2026_unique_';
  const FAVICON_STORAGE_KEY = '_x_extension_newtab_favicon_2026_unique_';
  const FAVICON_PRELOAD_STORAGE_KEY = '_x_extension_newtab_favicon_preload_2026_unique_';
  const WALLPAPER_PATH_PATTERN = /^output\/imagegen\/[-.\w]+\.webp$/;
  const FAVICON_OPTIONS = {
    default: {
      file: 'assets/images/lumno.png',
      type: 'image/png',
      sizes: ''
    },
    alternate: {
      file: 'assets/images/lumno-newtab-favicon.svg',
      type: 'image/svg+xml',
      sizes: 'any'
    }
  };

  function readCachedWallpaperPath() {
    try {
      const raw = window.localStorage ? window.localStorage.getItem(PRELOAD_STORAGE_KEY) : '';
      if (!raw) {
        return '';
      }
      const data = JSON.parse(raw);
      const path = data && typeof data.path === 'string' ? data.path.trim() : '';
      return WALLPAPER_PATH_PATTERN.test(path) ? path : '';
    } catch (e) {
      return '';
    }
  }

  function getRuntimeUrl(path) {
    if (window.chrome && window.chrome.runtime && typeof window.chrome.runtime.getURL === 'function') {
      return window.chrome.runtime.getURL(path);
    }
    return `../../${path}`;
  }

  function normalizeFaviconId(value) {
    const id = String(value || '').trim();
    return Object.prototype.hasOwnProperty.call(FAVICON_OPTIONS, id) ? id : '';
  }

  function readCachedFaviconId() {
    try {
      return normalizeFaviconId(window.localStorage ?
        window.localStorage.getItem(FAVICON_PRELOAD_STORAGE_KEY) :
        '');
    } catch (e) {
      return '';
    }
  }

  function cacheFaviconId(id) {
    const normalized = normalizeFaviconId(id);
    if (!normalized) {
      return;
    }
    try {
      if (window.localStorage) {
        window.localStorage.setItem(FAVICON_PRELOAD_STORAGE_KEY, normalized);
      }
    } catch (e) {
      // Ignore private-mode or quota failures; the runtime still applies the favicon later.
    }
  }

  function getFaviconLink() {
    if (!document.head) {
      return null;
    }
    const existing = Array.from(document.head.children || []).find((child) => {
      return child &&
        String(child.tagName || '').toUpperCase() === 'LINK' &&
        child.getAttribute &&
        child.getAttribute('data-lumno-newtab-favicon') === 'true';
    });
    if (existing) {
      return existing;
    }
    const link = document.createElement('link');
    link.setAttribute('data-lumno-newtab-favicon', 'true');
    document.head.appendChild(link);
    return link;
  }

  function applyFaviconId(id) {
    const normalized = normalizeFaviconId(id);
    const item = normalized ? FAVICON_OPTIONS[normalized] : null;
    const link = item ? getFaviconLink() : null;
    if (!link) {
      return false;
    }
    link.setAttribute('rel', 'icon');
    link.setAttribute('type', item.type);
    link.setAttribute('href', getRuntimeUrl(item.file));
    link.setAttribute('data-newtab-favicon-id', normalized);
    if (item.sizes) {
      link.setAttribute('sizes', item.sizes);
    } else {
      link.removeAttribute('sizes');
    }
    return true;
  }

  function applyStoredFaviconWhenAvailable() {
    const cachedId = readCachedFaviconId();
    if (cachedId) {
      applyFaviconId(cachedId);
    }
    try {
      const storage = window.chrome && window.chrome.storage && window.chrome.storage.sync;
      if (!storage || typeof storage.get !== 'function') {
        return;
      }
      storage.get([FAVICON_STORAGE_KEY], (result) => {
        const nextId = normalizeFaviconId(result && result[FAVICON_STORAGE_KEY]);
        if (!nextId) {
          return;
        }
        cacheFaviconId(nextId);
        applyFaviconId(nextId);
      });
    } catch (e) {
      // Best-effort only; wallpaper.js applies the definitive favicon after boot.
    }
  }

  function getCssUrlValue(url) {
    const safe = String(url || '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '')
      .replace(/\r/g, '');
    return safe ? `url("${safe}")` : 'none';
  }

  function markBodyActive() {
    const shouldMarkActive = () => {
      return document.documentElement &&
        document.documentElement.getAttribute('data-wallpaper-active') === 'true';
    };
    if (document.body) {
      if (shouldMarkActive()) {
        document.body.setAttribute('data-wallpaper-active', 'true');
      }
      return;
    }
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body && shouldMarkActive()) {
        document.body.setAttribute('data-wallpaper-active', 'true');
      }
    }, { once: true });
  }

  applyStoredFaviconWhenAvailable();

  const path = readCachedWallpaperPath();
  if (!path) {
    return;
  }
  const url = getRuntimeUrl(path);
  const root = document.documentElement;
  if (root) {
    root.style.setProperty('--x-nt-wallpaper-image', getCssUrlValue(url));
    root.style.setProperty('--x-nt-wallpaper-size', 'cover');
    root.style.setProperty('--x-nt-wallpaper-position', 'center center');
    root.setAttribute('data-wallpaper-active', 'true');
  }
  if (document.head) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
  }
  markBodyActive();
})();
