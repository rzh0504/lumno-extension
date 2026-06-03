(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoRecentTabSwitcher = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const DEFAULT_LIMIT = 5;
  const STACK_BUFFER_MULTIPLIER = 4;
  const DEFAULT_THUMBNAIL_LIMIT = 10;
  const DEFAULT_THUMBNAIL_TTL_MS = 1000 * 60 * 60 * 2;
  const STATE_VERSION = 1;

  function toPositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function getResolvedTabUrl(tab) {
    if (!tab || typeof tab !== 'object') {
      return '';
    }
    const directUrl = typeof tab.url === 'string' ? tab.url.trim() : '';
    if (directUrl) {
      return directUrl;
    }
    return typeof tab.pendingUrl === 'string' ? tab.pendingUrl.trim() : '';
  }

  function defaultShouldIncludeTab(tab) {
    if (!tab || typeof tab.id !== 'number' || typeof tab.windowId !== 'number' || tab.incognito === true) {
      return false;
    }
    const url = getResolvedTabUrl(tab);
    if (!url) {
      return false;
    }
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  function sanitizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function normalizeUrl(value) {
    return String(value || '').trim();
  }

  function normalizeThumbnailEntry(tabId, raw, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const now = Number.isFinite(Number(opts.now)) ? Number(opts.now) : Date.now();
    const ttlMs = Number.isFinite(Number(opts.ttlMs)) ? Math.max(0, Number(opts.ttlMs)) : DEFAULT_THUMBNAIL_TTL_MS;
    if (typeof tabId !== 'number' || !raw || typeof raw !== 'object') {
      return null;
    }
    const dataUrl = typeof raw.dataUrl === 'string' ? raw.dataUrl : '';
    if (!dataUrl.startsWith('data:image/')) {
      return null;
    }
    const capturedAt = Number(raw.capturedAt) || now;
    if (ttlMs > 0 && (now - capturedAt) > ttlMs) {
      return null;
    }
    return {
      tabId,
      url: normalizeUrl(raw.url),
      dataUrl,
      capturedAt
    };
  }

  function normalizeTabSnapshot(tab, visitedAt, shouldIncludeTab) {
    if (!shouldIncludeTab(tab)) {
      return null;
    }
    const now = Number.isFinite(Number(visitedAt)) ? Number(visitedAt) : Date.now();
    return {
      id: tab.id,
      windowId: tab.windowId,
      url: getResolvedTabUrl(tab),
      title: sanitizeText(tab.title),
      favIconUrl: typeof tab.favIconUrl === 'string' ? tab.favIconUrl : '',
      lastAccessed: Number(tab.lastAccessed) || now,
      visitedAt: now
    };
  }

  function createRecentTabTracker(options) {
    const settings = options && typeof options === 'object' ? options : {};
    const limit = toPositiveInteger(settings.limit, DEFAULT_LIMIT);
    const stackLimit = Math.max(limit, limit * STACK_BUFFER_MULTIPLIER);
    const thumbnailLimit = toPositiveInteger(settings.thumbnailLimit, DEFAULT_THUMBNAIL_LIMIT);
    const thumbnailTtlMs = Math.max(0, Number(settings.thumbnailTtlMs) || DEFAULT_THUMBNAIL_TTL_MS);
    const shouldIncludeTab = typeof settings.shouldIncludeTab === 'function'
      ? settings.shouldIncludeTab
      : defaultShouldIncludeTab;
    const recentStack = [];
    const thumbnailByTabId = new Map();

    function trimStack() {
      if (recentStack.length > stackLimit) {
        recentStack.splice(stackLimit);
      }
    }

    function pruneThumbnails(now) {
      const referenceNow = Number.isFinite(Number(now)) ? Number(now) : Date.now();
      Array.from(thumbnailByTabId.entries()).forEach(([tabId, entry]) => {
        const normalized = normalizeThumbnailEntry(tabId, entry, {
          now: referenceNow,
          ttlMs: thumbnailTtlMs
        });
        if (!normalized) {
          thumbnailByTabId.delete(tabId);
        }
      });
      const sortedEntries = Array.from(thumbnailByTabId.entries())
        .sort((a, b) => (Number(b[1] && b[1].capturedAt) || 0) - (Number(a[1] && a[1].capturedAt) || 0));
      sortedEntries.slice(thumbnailLimit).forEach(([tabId]) => {
        thumbnailByTabId.delete(tabId);
      });
    }

    function removeTab(tabId) {
      if (typeof tabId !== 'number') {
        return false;
      }
      const before = recentStack.length;
      for (let index = recentStack.length - 1; index >= 0; index -= 1) {
        if (recentStack[index] && recentStack[index].id === tabId) {
          recentStack.splice(index, 1);
        }
      }
      thumbnailByTabId.delete(tabId);
      return recentStack.length !== before;
    }

    function recordTab(tab, visitedAt) {
      const snapshot = normalizeTabSnapshot(tab, visitedAt, shouldIncludeTab);
      if (!snapshot) {
        if (tab && typeof tab.id === 'number') {
          removeTab(tab.id);
        }
        return null;
      }
      removeTab(snapshot.id);
      recentStack.unshift(snapshot);
      trimStack();
      return snapshot;
    }

    function updateTab(tab, visitedAt) {
      if (!tab || typeof tab.id !== 'number') {
        return null;
      }
      const existingIndex = recentStack.findIndex((item) => item && item.id === tab.id);
      if (existingIndex < 0) {
        return null;
      }
      const previous = recentStack[existingIndex];
      const snapshot = normalizeTabSnapshot(tab, visitedAt || previous.visitedAt, shouldIncludeTab);
      if (!snapshot) {
        removeTab(tab.id);
        return null;
      }
      if (normalizeUrl(previous.url) !== normalizeUrl(snapshot.url)) {
        thumbnailByTabId.delete(tab.id);
      }
      recentStack[existingIndex] = {
        ...previous,
        ...snapshot,
        visitedAt: previous.visitedAt
      };
      return recentStack[existingIndex];
    }

    function getRecentTabs(tabs, requestOptions) {
      const request = requestOptions && typeof requestOptions === 'object' ? requestOptions : {};
      const requestedLimit = toPositiveInteger(request.limit, limit);
      const tabList = Array.isArray(tabs) ? tabs : [];
      const tabById = new Map();
      tabList.forEach((tab) => {
        if (tab && typeof tab.id === 'number' && shouldIncludeTab(tab)) {
          tabById.set(tab.id, {
            ...tab,
            url: getResolvedTabUrl(tab)
          });
        }
      });

      const results = [];
      const seenIds = new Set();
      recentStack.forEach((snapshot) => {
        if (!snapshot || seenIds.has(snapshot.id)) {
          return;
        }
        const liveTab = tabById.get(snapshot.id);
        if (!liveTab) {
          return;
        }
        seenIds.add(snapshot.id);
        results.push({
          ...snapshot,
          ...liveTab,
          url: getResolvedTabUrl(liveTab) || snapshot.url,
          title: sanitizeText(liveTab.title) || snapshot.title,
          favIconUrl: liveTab.favIconUrl || snapshot.favIconUrl || '',
          _xSwitcherVisitedAt: snapshot.visitedAt,
          _xSwitcherThumbnail: getThumbnail(snapshot.id, getResolvedTabUrl(liveTab) || snapshot.url)
        });
      });

      if (results.length < requestedLimit) {
        tabList
          .filter((tab) => tab && typeof tab.id === 'number' && !seenIds.has(tab.id) && shouldIncludeTab(tab))
          .slice()
          .sort((a, b) => {
            const accessA = Number(a.lastAccessed) || 0;
            const accessB = Number(b.lastAccessed) || 0;
            return accessB - accessA;
          })
          .forEach((tab) => {
            if (results.length >= requestedLimit || seenIds.has(tab.id)) {
              return;
            }
            seenIds.add(tab.id);
            results.push({
              ...tab,
              url: getResolvedTabUrl(tab),
              title: sanitizeText(tab.title),
              favIconUrl: tab.favIconUrl || '',
              _xSwitcherVisitedAt: Number(tab.lastAccessed) || 0,
              _xSwitcherThumbnail: getThumbnail(tab.id, getResolvedTabUrl(tab))
            });
          });
      }

      return results.slice(0, requestedLimit);
    }

    function setThumbnail(tabId, dataUrl, capturedAt, metadata) {
      if (typeof tabId !== 'number') {
        return false;
      }
      const value = typeof dataUrl === 'string' ? dataUrl : '';
      if (!value || !value.startsWith('data:image/')) {
        thumbnailByTabId.delete(tabId);
        return false;
      }
      const meta = metadata && typeof metadata === 'object' ? metadata : {};
      const entry = normalizeThumbnailEntry(tabId, {
        dataUrl: value,
        url: normalizeUrl(meta.url),
        capturedAt: Number(capturedAt) || Date.now()
      }, {
        ttlMs: thumbnailTtlMs
      });
      if (!entry) {
        thumbnailByTabId.delete(tabId);
        return false;
      }
      thumbnailByTabId.set(tabId, entry);
      pruneThumbnails(entry.capturedAt);
      return true;
    }

    function getThumbnail(tabId, expectedUrl) {
      const entry = thumbnailByTabId.get(tabId);
      const normalized = normalizeThumbnailEntry(tabId, entry, {
        ttlMs: thumbnailTtlMs
      });
      if (!normalized) {
        thumbnailByTabId.delete(tabId);
        return '';
      }
      const url = normalizeUrl(expectedUrl);
      if (url && normalized.url && normalized.url !== url) {
        return '';
      }
      return normalized.dataUrl || '';
    }

    function getStackSnapshot() {
      return recentStack.map((item) => ({ ...item }));
    }

    function exportState(optionsArg) {
      const opts = optionsArg && typeof optionsArg === 'object' ? optionsArg : {};
      const now = Number.isFinite(Number(opts.now)) ? Number(opts.now) : Date.now();
      pruneThumbnails(now);
      return {
        version: STATE_VERSION,
        savedAt: now,
        stack: getStackSnapshot(),
        thumbnails: Array.from(thumbnailByTabId.values()).map((entry) => ({ ...entry }))
      };
    }

    function hydrateState(state, optionsArg) {
      const opts = optionsArg && typeof optionsArg === 'object' ? optionsArg : {};
      const now = Number.isFinite(Number(opts.now)) ? Number(opts.now) : Date.now();
      if (!state || typeof state !== 'object') {
        return false;
      }
      recentStack.splice(0, recentStack.length);
      thumbnailByTabId.clear();
      const stack = Array.isArray(state.stack) ? state.stack : [];
      stack.forEach((item) => {
        const snapshot = normalizeTabSnapshot(item, item && item.visitedAt, shouldIncludeTab);
        if (!snapshot) {
          return;
        }
        if (recentStack.some((existing) => existing && existing.id === snapshot.id)) {
          return;
        }
        recentStack.push(snapshot);
      });
      trimStack();
      const thumbnails = Array.isArray(state.thumbnails) ? state.thumbnails : [];
      thumbnails.forEach((item) => {
        const tabId = Number(item && item.tabId);
        if (!Number.isInteger(tabId)) {
          return;
        }
        const entry = normalizeThumbnailEntry(tabId, item, {
          now,
          ttlMs: thumbnailTtlMs
        });
        if (entry) {
          thumbnailByTabId.set(tabId, entry);
        }
      });
      pruneThumbnails(now);
      return true;
    }

    return Object.freeze({
      recordTab,
      updateTab,
      removeTab,
      getRecentTabs,
      setThumbnail,
      getThumbnail,
      getStackSnapshot,
      exportState,
      hydrateState
    });
  }

  function callChromeCallback(fn) {
    return new Promise((resolve) => {
      try {
        fn((value) => resolve(value || null));
      } catch (error) {
        resolve(null);
      }
    });
  }

  function getRuntimeError(chromeApi) {
    return chromeApi && chromeApi.runtime && chromeApi.runtime.lastError
      ? chromeApi.runtime.lastError
      : null;
  }

  async function focusWindowAndActivateTab(chromeApi, request) {
    const api = chromeApi || {};
    const tabId = request && typeof request.tabId === 'number' ? request.tabId : null;
    const windowId = request && typeof request.windowId === 'number' ? request.windowId : null;
    if (typeof tabId !== 'number' || !api.tabs || typeof api.tabs.update !== 'function') {
      return { ok: false, reason: 'invalid-tab' };
    }

    if (typeof windowId === 'number' && api.windows && typeof api.windows.update === 'function') {
      await callChromeCallback((done) => {
        api.windows.update(windowId, { focused: true }, done);
      });
    }

    const tab = await callChromeCallback((done) => {
      api.tabs.update(tabId, { active: true }, done);
    });
    const error = getRuntimeError(api);
    if (error) {
      return {
        ok: false,
        tabId,
        windowId,
        reason: error.message || 'tab-update-failed'
      };
    }

    return {
      ok: Boolean(tab),
      tabId,
      windowId: typeof windowId === 'number'
        ? windowId
        : (tab && typeof tab.windowId === 'number' ? tab.windowId : null)
    };
  }

  return Object.freeze({
    DEFAULT_LIMIT,
    createRecentTabTracker,
    defaultShouldIncludeTab,
    focusWindowAndActivateTab
  });
});
