(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoNewtabFaviconCache = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const DEFAULTS = Object.freeze({
    faviconPersistStorageKey: '_x_extension_favicon_url_cache_2024_unique_',
    faviconPersistTtlMs: 1000 * 60 * 60 * 24 * 14,
    faviconPersistMaxEntries: 800,
    faviconDataPersistStorageKey: '_x_extension_favicon_data_cache_2024_unique_',
    faviconDataPersistMaxEntries: 220,
    faviconDataPersistMaxLength: 24000,
    faviconVisitDirtyStorageKey: '_x_extension_favicon_visit_dirty_2026_unique_',
    faviconVisitDirtyTtlMs: 1000 * 60 * 60 * 24,
    faviconVisitDirtyMaxEntries: 600,
    faviconCacheBootWaitMs: 120
  });

  function createFaviconCache(options) {
    const config = options || {};
    const storageArea = config.storageArea || null;
    const windowObj = config.windowObj || root.window || root;
    const normalizeFaviconHost = typeof config.normalizeFaviconHost === 'function'
      ? config.normalizeFaviconHost
      : ((value) => String(value || '').toLowerCase().replace(/^www\./i, ''));
    const isBlockedLocalFaviconUrl = typeof config.isBlockedLocalFaviconUrl === 'function'
      ? config.isBlockedLocalFaviconUrl
      : (() => false);
    const isChromeMonogramFaviconUrl = typeof config.isChromeMonogramFaviconUrl === 'function'
      ? config.isChromeMonogramFaviconUrl
      : ((url) => /^chrome:\/\/favicon2\//i.test(String(url || '').trim()));

    const faviconPersistStorageKey = config.faviconPersistStorageKey || DEFAULTS.faviconPersistStorageKey;
    const faviconPersistTtlMs = Number.isFinite(config.faviconPersistTtlMs)
      ? config.faviconPersistTtlMs
      : DEFAULTS.faviconPersistTtlMs;
    const faviconPersistMaxEntries = Number.isFinite(config.faviconPersistMaxEntries)
      ? config.faviconPersistMaxEntries
      : DEFAULTS.faviconPersistMaxEntries;
    const faviconDataPersistStorageKey = config.faviconDataPersistStorageKey || DEFAULTS.faviconDataPersistStorageKey;
    const faviconDataPersistMaxEntries = Number.isFinite(config.faviconDataPersistMaxEntries)
      ? config.faviconDataPersistMaxEntries
      : DEFAULTS.faviconDataPersistMaxEntries;
    const faviconDataPersistMaxLength = Number.isFinite(config.faviconDataPersistMaxLength)
      ? config.faviconDataPersistMaxLength
      : DEFAULTS.faviconDataPersistMaxLength;
    const faviconVisitDirtyStorageKey = config.faviconVisitDirtyStorageKey || DEFAULTS.faviconVisitDirtyStorageKey;
    const faviconVisitDirtyTtlMs = Number.isFinite(config.faviconVisitDirtyTtlMs)
      ? config.faviconVisitDirtyTtlMs
      : DEFAULTS.faviconVisitDirtyTtlMs;
    const faviconVisitDirtyMaxEntries = Number.isFinite(config.faviconVisitDirtyMaxEntries)
      ? config.faviconVisitDirtyMaxEntries
      : DEFAULTS.faviconVisitDirtyMaxEntries;
    const faviconCacheBootWaitMs = Number.isFinite(config.faviconCacheBootWaitMs)
      ? config.faviconCacheBootWaitMs
      : DEFAULTS.faviconCacheBootWaitMs;

    const faviconPersistCache = new Map();
    const faviconDataPersistCache = new Map();
    const faviconVisitDirtyCache = new Map();
    let faviconPersistLoaded = false;
    let faviconPersistLoadPromise = null;
    let faviconPersistWriteTimer = null;
    let faviconDataPersistLoaded = false;
    let faviconDataPersistLoadPromise = null;
    let faviconDataPersistWriteTimer = null;
    let faviconVisitDirtyLoaded = false;
    let faviconVisitDirtyLoadPromise = null;

    function getValidFaviconPersistEntries(rawEntries) {
      const now = Date.now();
      const input = rawEntries && typeof rawEntries === 'object' ? rawEntries : {};
      const valid = [];
      Object.keys(input).forEach((key) => {
        const item = input[key];
        if (!item || typeof item !== 'object') {
          return;
        }
        const url = String(item.url || '').trim();
        const updatedAt = Number(item.updatedAt || 0);
        if (!key || !url || !Number.isFinite(updatedAt)) {
          return;
        }
        if (now - updatedAt > faviconPersistTtlMs) {
          return;
        }
        if (url.startsWith('data:') || isBlockedLocalFaviconUrl(url) || isChromeMonogramFaviconUrl(url)) {
          return;
        }
        valid.push({ key, url, updatedAt });
      });
      valid.sort((a, b) => b.updatedAt - a.updatedAt);
      return valid.slice(0, faviconPersistMaxEntries);
    }

    function isValidDataUrlIcon(value) {
      const raw = String(value || '');
      if (!raw || raw.length > faviconDataPersistMaxLength) {
        return false;
      }
      return /^data:image\/(?:png|webp|svg\+xml|x-icon|jpeg|jpg);base64,/i.test(raw);
    }

    function getValidFaviconDataPersistEntries(rawEntries) {
      const now = Date.now();
      const input = rawEntries && typeof rawEntries === 'object' ? rawEntries : {};
      const valid = [];
      Object.keys(input).forEach((key) => {
        const item = input[key];
        if (!item || typeof item !== 'object') {
          return;
        }
        const dataUrl = String(item.dataUrl || '').trim();
        const updatedAt = Number(item.updatedAt || 0);
        if (!key || !isValidDataUrlIcon(dataUrl) || !Number.isFinite(updatedAt)) {
          return;
        }
        if (now - updatedAt > faviconPersistTtlMs) {
          return;
        }
        valid.push({ key, dataUrl, updatedAt });
      });
      valid.sort((a, b) => b.updatedAt - a.updatedAt);
      return valid.slice(0, faviconDataPersistMaxEntries);
    }

    function getValidFaviconVisitDirtyEntries(rawEntries) {
      const now = Date.now();
      const input = rawEntries && typeof rawEntries === 'object' ? rawEntries : {};
      const valid = [];
      Object.keys(input).forEach((key) => {
        const updatedAt = Number(input[key] || 0);
        if (!key || !Number.isFinite(updatedAt)) {
          return;
        }
        if (now - updatedAt > faviconVisitDirtyTtlMs) {
          return;
        }
        valid.push({ key, updatedAt });
      });
      valid.sort((a, b) => b.updatedAt - a.updatedAt);
      return valid.slice(0, faviconVisitDirtyMaxEntries);
    }

    function loadFaviconPersistCache() {
      if (faviconPersistLoadPromise) {
        return faviconPersistLoadPromise;
      }
      if (!storageArea) {
        faviconPersistLoaded = true;
        faviconPersistLoadPromise = Promise.resolve();
        return faviconPersistLoadPromise;
      }
      if (faviconPersistLoaded) {
        faviconPersistLoadPromise = Promise.resolve();
        return faviconPersistLoadPromise;
      }
      faviconPersistLoaded = true;
      faviconPersistLoadPromise = new Promise((resolve) => {
        storageArea.get([faviconPersistStorageKey], (result) => {
          const payload = result && result[faviconPersistStorageKey];
          const entries = getValidFaviconPersistEntries(payload && payload.entries ? payload.entries : null);
          entries.forEach((item) => {
            faviconPersistCache.set(item.key, { url: item.url, updatedAt: item.updatedAt });
          });
          resolve();
        });
      });
      return faviconPersistLoadPromise;
    }

    function loadFaviconDataPersistCache() {
      if (faviconDataPersistLoadPromise) {
        return faviconDataPersistLoadPromise;
      }
      if (!storageArea) {
        faviconDataPersistLoaded = true;
        faviconDataPersistLoadPromise = Promise.resolve();
        return faviconDataPersistLoadPromise;
      }
      if (faviconDataPersistLoaded) {
        faviconDataPersistLoadPromise = Promise.resolve();
        return faviconDataPersistLoadPromise;
      }
      faviconDataPersistLoaded = true;
      faviconDataPersistLoadPromise = new Promise((resolve) => {
        storageArea.get([faviconDataPersistStorageKey], (result) => {
          const payload = result && result[faviconDataPersistStorageKey];
          const entries = getValidFaviconDataPersistEntries(payload && payload.entries ? payload.entries : null);
          entries.forEach((item) => {
            faviconDataPersistCache.set(item.key, { dataUrl: item.dataUrl, updatedAt: item.updatedAt });
          });
          resolve();
        });
      });
      return faviconDataPersistLoadPromise;
    }

    function loadFaviconVisitDirtyCache() {
      if (faviconVisitDirtyLoadPromise) {
        return faviconVisitDirtyLoadPromise;
      }
      if (!storageArea) {
        faviconVisitDirtyLoaded = true;
        faviconVisitDirtyLoadPromise = Promise.resolve();
        return faviconVisitDirtyLoadPromise;
      }
      if (faviconVisitDirtyLoaded) {
        faviconVisitDirtyLoadPromise = Promise.resolve();
        return faviconVisitDirtyLoadPromise;
      }
      faviconVisitDirtyLoaded = true;
      faviconVisitDirtyLoadPromise = new Promise((resolve) => {
        storageArea.get([faviconVisitDirtyStorageKey], (result) => {
          const payload = result && result[faviconVisitDirtyStorageKey];
          const entries = getValidFaviconVisitDirtyEntries(payload && payload.entries ? payload.entries : null);
          entries.forEach((item) => {
            faviconVisitDirtyCache.set(item.key, item.updatedAt);
          });
          resolve();
        });
      });
      return faviconVisitDirtyLoadPromise;
    }

    function ensureCachesReady() {
      return Promise.all([
        loadFaviconPersistCache(),
        loadFaviconDataPersistCache(),
        loadFaviconVisitDirtyCache()
      ]).then(() => undefined).catch(() => undefined);
    }

    function waitForCachesOrTimeout(maxWaitMs) {
      const waitMs = Number.isFinite(maxWaitMs) && maxWaitMs >= 0
        ? maxWaitMs
        : faviconCacheBootWaitMs;
      return Promise.race([
        ensureCachesReady(),
        new Promise((resolve) => {
          windowObj.setTimeout(resolve, waitMs);
        })
      ]).then(() => undefined).catch(() => undefined);
    }

    function schedulePersistFaviconCache() {
      if (!storageArea) {
        return;
      }
      if (faviconPersistWriteTimer !== null) {
        return;
      }
      faviconPersistWriteTimer = windowObj.setTimeout(() => {
        faviconPersistWriteTimer = null;
        const entries = Array.from(faviconPersistCache.entries())
          .map(([key, value]) => ({
            key: String(key || ''),
            url: String(value && value.url ? value.url : ''),
            updatedAt: Number(value && value.updatedAt ? value.updatedAt : 0)
          }))
          .filter((item) => item.key && item.url && Number.isFinite(item.updatedAt))
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, faviconPersistMaxEntries);
        const serialized = {};
        entries.forEach((item) => {
          serialized[item.key] = { url: item.url, updatedAt: item.updatedAt };
        });
        storageArea.set({
          [faviconPersistStorageKey]: {
            version: 1,
            entries: serialized,
            updatedAt: Date.now()
          }
        });
      }, 600);
    }

    function schedulePersistFaviconDataCache() {
      if (!storageArea) {
        return;
      }
      if (faviconDataPersistWriteTimer !== null) {
        return;
      }
      faviconDataPersistWriteTimer = windowObj.setTimeout(() => {
        faviconDataPersistWriteTimer = null;
        const entries = Array.from(faviconDataPersistCache.entries())
          .map(([key, value]) => ({
            key: String(key || ''),
            dataUrl: String(value && value.dataUrl ? value.dataUrl : ''),
            updatedAt: Number(value && value.updatedAt ? value.updatedAt : 0)
          }))
          .filter((item) => item.key && isValidDataUrlIcon(item.dataUrl) && Number.isFinite(item.updatedAt))
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, faviconDataPersistMaxEntries);
        const serialized = {};
        entries.forEach((item) => {
          serialized[item.key] = { dataUrl: item.dataUrl, updatedAt: item.updatedAt };
        });
        storageArea.set({
          [faviconDataPersistStorageKey]: {
            version: 1,
            entries: serialized,
            updatedAt: Date.now()
          }
        });
      }, 600);
    }

    function persistFaviconVisitDirtyCacheSoon() {
      if (!storageArea) {
        return;
      }
      windowObj.setTimeout(() => {
        const entries = Array.from(faviconVisitDirtyCache.entries())
          .map(([key, updatedAt]) => ({
            key: String(key || ''),
            updatedAt: Number(updatedAt || 0)
          }))
          .filter((item) => item.key && Number.isFinite(item.updatedAt))
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, faviconVisitDirtyMaxEntries);
        const serialized = {};
        entries.forEach((item) => {
          serialized[item.key] = item.updatedAt;
        });
        storageArea.set({
          [faviconVisitDirtyStorageKey]: {
            version: 1,
            entries: serialized,
            updatedAt: Date.now()
          }
        });
      }, 0);
    }

    function isHostVisitDirty(hostname) {
      const host = normalizeFaviconHost(hostname);
      if (!host) {
        return false;
      }
      const updatedAt = Number(faviconVisitDirtyCache.get(host) || 0);
      if (!Number.isFinite(updatedAt) || !updatedAt) {
        return false;
      }
      if (Date.now() - updatedAt > faviconVisitDirtyTtlMs) {
        faviconVisitDirtyCache.delete(host);
        persistFaviconVisitDirtyCacheSoon();
        return false;
      }
      return true;
    }

    function clearHostVisitDirty(hostname) {
      const host = normalizeFaviconHost(hostname);
      if (!host || !faviconVisitDirtyCache.has(host)) {
        return;
      }
      faviconVisitDirtyCache.delete(host);
      persistFaviconVisitDirtyCacheSoon();
    }

    function getPersistedEntry(cacheKey) {
      if (!cacheKey) {
        return null;
      }
      const cached = faviconPersistCache.get(cacheKey);
      if (!cached || !cached.url) {
        return null;
      }
      const now = Date.now();
      if (!Number.isFinite(cached.updatedAt) || now - cached.updatedAt > faviconPersistTtlMs) {
        faviconPersistCache.delete(cacheKey);
        schedulePersistFaviconCache();
        return null;
      }
      return {
        url: cached.url,
        updatedAt: cached.updatedAt
      };
    }

    function setPersistedUrl(cacheKey, url) {
      const key = String(cacheKey || '').trim();
      const nextUrl = String(url || '').trim();
      if (!key || !nextUrl || nextUrl.startsWith('data:') || isBlockedLocalFaviconUrl(nextUrl) || isChromeMonogramFaviconUrl(nextUrl)) {
        return;
      }
      faviconPersistCache.set(key, { url: nextUrl, updatedAt: Date.now() });
      if (faviconPersistCache.size > faviconPersistMaxEntries * 2) {
        const compact = Array.from(faviconPersistCache.entries())
          .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
          .slice(0, faviconPersistMaxEntries);
        faviconPersistCache.clear();
        compact.forEach(([k, v]) => faviconPersistCache.set(k, v));
      }
      schedulePersistFaviconCache();
    }

    function getPersistedDataEntry(cacheKey) {
      if (!cacheKey) {
        return null;
      }
      const cached = faviconDataPersistCache.get(cacheKey);
      if (!cached || !isValidDataUrlIcon(cached.dataUrl)) {
        return null;
      }
      const now = Date.now();
      if (!Number.isFinite(cached.updatedAt) || now - cached.updatedAt > faviconPersistTtlMs) {
        faviconDataPersistCache.delete(cacheKey);
        schedulePersistFaviconDataCache();
        return null;
      }
      return {
        dataUrl: cached.dataUrl,
        updatedAt: cached.updatedAt
      };
    }

    function setPersistedData(cacheKey, dataUrl) {
      const key = String(cacheKey || '').trim();
      const nextDataUrl = String(dataUrl || '').trim();
      if (!key || !isValidDataUrlIcon(nextDataUrl)) {
        return;
      }
      faviconDataPersistCache.set(key, { dataUrl: nextDataUrl, updatedAt: Date.now() });
      if (faviconDataPersistCache.size > faviconDataPersistMaxEntries * 2) {
        const compact = Array.from(faviconDataPersistCache.entries())
          .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
          .slice(0, faviconDataPersistMaxEntries);
        faviconDataPersistCache.clear();
        compact.forEach(([k, v]) => faviconDataPersistCache.set(k, v));
      }
      schedulePersistFaviconDataCache();
    }

    return {
      isFaviconPersistLoaded: () => faviconPersistLoaded,
      isFaviconDataPersistLoaded: () => faviconDataPersistLoaded,
      ensureCachesReady,
      waitForCachesOrTimeout,
      isHostVisitDirty,
      clearHostVisitDirty,
      getPersistedEntry,
      setPersistedUrl,
      getPersistedDataEntry,
      setPersistedData
    };
  }

  return {
    DEFAULTS,
    createFaviconCache
  };
});
