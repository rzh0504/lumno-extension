(function() {
  const PRELOAD_STORAGE_KEY = '_x_extension_newtab_wallpaper_preload_2026_unique_';
  const WALLPAPER_PATH_PATTERN = /^output\/imagegen\/[-.\w]+\.webp$/;

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
