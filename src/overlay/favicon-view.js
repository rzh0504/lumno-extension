(function(root, factory) {
  const api = factory(root);
  root.LumnoOverlayFaviconView = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  function noop() {}

  function createOverlayFaviconViewRuntime(options) {
    const config = options || {};
    const doc = config.document || (typeof document !== 'undefined' ? document : null);
    const win = config.windowObj || (typeof window !== 'undefined' ? window : {});
    const chromeApi = config.chromeApi || (typeof chrome !== 'undefined' ? chrome : {});
    const getRiSvg = typeof config.getRiSvg === 'function' ? config.getRiSvg : (() => '');
    const getHostFromUrl = typeof config.getHostFromUrl === 'function' ? config.getHostFromUrl : (() => '');
    const getExtensionFaviconUrl = typeof config.getExtensionFaviconUrl === 'function' ? config.getExtensionFaviconUrl : (() => '');
    const getGstaticFaviconUrl = typeof config.getGstaticFaviconUrl === 'function' ? config.getGstaticFaviconUrl : (() => '');
    const shouldBlockFaviconForHost = typeof config.shouldBlockFaviconForHost === 'function' ? config.shouldBlockFaviconForHost : (() => false);
    const isFaviconProxyUrl = typeof config.isFaviconProxyUrl === 'function' ? config.isFaviconProxyUrl : (() => false);
    const isBlockedLocalFaviconUrl = typeof config.isBlockedLocalFaviconUrl === 'function'
      ? config.isBlockedLocalFaviconUrl
      : (() => false);
    const isChromeMonogramFaviconUrl = typeof config.isChromeMonogramFaviconUrl === 'function'
      ? config.isChromeMonogramFaviconUrl
      : ((url) => /^chrome:\/\/favicon2\//i.test(String(url || '').trim()));
    const preloadThemeFromFavicon = typeof config.preloadThemeFromFavicon === 'function' ? config.preloadThemeFromFavicon : noop;
    const hasThemeForHost = typeof config.hasThemeForHost === 'function' ? config.hasThemeForHost : (() => false);
    const getOverlayPanel = typeof config.getOverlayPanel === 'function' ? config.getOverlayPanel : (() => null);
    const setPersistedFaviconUrl = typeof config.setPersistedFaviconUrl === 'function'
      ? config.setPersistedFaviconUrl
      : noop;
    const setPersistedFaviconData = typeof config.setPersistedFaviconData === 'function'
      ? config.setPersistedFaviconData
      : noop;
    const faviconDataCache = config.faviconDataCache || new Map();
    const faviconDataPending = config.faviconDataPending || new Map();
    const iconPreloadCache = config.iconPreloadCache || new Map();
    const faviconFallbackNodeMap = config.faviconFallbackNodeMap || new WeakMap();
    const setTimer = typeof win.setTimeout === 'function' ? win.setTimeout.bind(win) : setTimeout;
    const clearTimer = typeof win.clearTimeout === 'function' ? win.clearTimeout.bind(win) : clearTimeout;
    const faviconCandidateLoadTimeoutMs = Number.isFinite(config.faviconCandidateLoadTimeoutMs)
      ? Math.max(0, config.faviconCandidateLoadTimeoutMs)
      : 2600;
    const faviconViewCoreApi = root.LumnoFaviconViewCore || {};
    const faviconViewCore = typeof faviconViewCoreApi.createFaviconViewCore === 'function'
      ? faviconViewCoreApi.createFaviconViewCore({
        document: doc,
        windowObj: win,
        chromeApi,
        getHostFromUrl,
        shouldBlockFaviconForHost,
        isBlockedLocalFaviconUrl,
        showResolvedFavicon,
        showPendingFallbackIcon,
        getPersistCacheKey: (img) => img.getAttribute('data-x-ov-favicon-cache-key') || '',
        setPersistedFaviconUrl,
        setPersistedFaviconData,
        shouldPersistFaviconUrl: (url) => !isChromeMonogramFaviconUrl(url) && !isFaviconProxyUrl(url),
        preloadThemeFromFavicon,
        getThemeFaviconUrl: getGstaticFaviconUrl,
        hasThemeForHost,
        faviconDataCache,
        faviconDataPending,
        iconPreloadCache
      })
      : null;

    function setFaviconLoadState(img, state) {
      faviconViewCore.setFaviconLoadState(img, state);
    }

    function setFaviconVisibility(img, visibility) {
      if (!img) {
        return;
      }
      if (visibility) {
        img.setAttribute('data-favicon-visibility', visibility);
      } else {
        img.removeAttribute('data-favicon-visibility');
      }
    }

    function setFallbackNodeVisible(node, visible) {
      faviconViewCore.setFallbackNodeVisible(node, visible);
    }

    function findFallbackIconNode(img) {
      if (!img || !img.parentElement) {
        return null;
      }
      const mappedNode = faviconFallbackNodeMap.get(img);
      if (mappedNode && mappedNode.isConnected && mappedNode.parentElement === img.parentElement) {
        return mappedNode;
      }
      const fallbackNodes = Array.from(img.parentElement.querySelectorAll('._x_extension_overlay_favicon_fallback_2026_unique_'));
      const linkedNode = fallbackNodes.find((candidate) => candidate && candidate._xFallbackForImage === img) || null;
      if (linkedNode) {
        faviconFallbackNodeMap.set(img, linkedNode);
        return linkedNode;
      }
      if (fallbackNodes.length === 1 && img.parentElement.querySelectorAll('img').length === 1) {
        const onlyNode = fallbackNodes[0];
        onlyNode._xFallbackForImage = img;
        faviconFallbackNodeMap.set(img, onlyNode);
        return onlyNode;
      }
      return null;
    }

    function ensureFallbackIconNode(img) {
      if (!img || !img.parentElement || !doc) {
        return null;
      }
      const existingNode = findFallbackIconNode(img);
      if (existingNode) {
        return existingNode;
      }
      const node = doc.createElement('span');
      node.className = 'x-ov-suggestion-inline-icon x-ov-suggestion-favicon-fallback _x_extension_overlay_favicon_fallback_2026_unique_';
      node.innerHTML = getRiSvg('ri-link', 'ri-size-16');
      setFallbackNodeVisible(node, true);
      img.parentElement.insertBefore(node, img.nextSibling);
      node._xFallbackForImage = img;
      faviconFallbackNodeMap.set(img, node);
      return node;
    }

    function removeFallbackIconNode(img) {
      const node = findFallbackIconNode(img);
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
      if (img) {
        faviconFallbackNodeMap.delete(img);
      }
    }

    function showResolvedFavicon(img) {
      if (!img) {
        return;
      }
      clearOverlayCandidateLoadTimer(img);
      const fallbackNode = findFallbackIconNode(img);
      if (fallbackNode) {
        setFallbackNodeVisible(fallbackNode, false);
      }
      img.removeAttribute('data-fallback-icon');
      img.removeAttribute('data-favicon-placeholder');
      setFaviconVisibility(img, 'visible');
    }

    function showPendingFallbackIcon(img) {
      if (!img) {
        return;
      }
      const node = ensureFallbackIconNode(img);
      img.removeAttribute('data-fallback-icon');
      img.setAttribute('data-favicon-placeholder', 'true');
      setFaviconVisibility(img, 'hidden');
      if (node) {
        setFallbackNodeVisible(node, true);
        return;
      }
      if (win && typeof win.setTimeout === 'function') {
        win.setTimeout(() => {
          if (!img || !img.isConnected || img.getAttribute('data-favicon-placeholder') !== 'true') {
            return;
          }
          const delayedNode = ensureFallbackIconNode(img);
          if (delayedNode) {
            setFallbackNodeVisible(delayedNode, true);
          }
        }, 0);
      }
    }

    function applyFallbackIcon(img) {
      if (!img) {
        return;
      }
      clearOverlayCandidateLoadTimer(img);
      const node = ensureFallbackIconNode(img);
      img.removeAttribute('data-favicon-placeholder');
      img.setAttribute('data-fallback-icon', 'true');
      setFaviconVisibility(img, 'hidden');
      if (node) {
        setFallbackNodeVisible(node, true);
        return;
      }
      if (win && typeof win.setTimeout === 'function') {
        win.setTimeout(() => {
          if (!img || !img.isConnected || img.getAttribute('data-fallback-icon') !== 'true') {
            return;
          }
          const delayedNode = ensureFallbackIconNode(img);
          if (delayedNode) {
            setFallbackNodeVisible(delayedNode, true);
          }
        }, 0);
      }
    }

    function applyFaviconOpticalShift(img) {
      faviconViewCore.applyFaviconOpticalShift(img);
    }

    function applyFaviconOpticalAlignment(img) {
      faviconViewCore.applyFaviconOpticalAlignment(img);
    }

    function getSafeOverlayFaviconCandidateUrl(value) {
      const raw = String(value || '').trim();
      if (!raw || isBlockedLocalFaviconUrl(raw)) {
        return '';
      }
      if (raw.startsWith('data:')) {
        return raw;
      }
      try {
        const parsed = new URL(raw);
        if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && shouldBlockFaviconForHost(parsed.hostname)) {
          return '';
        }
        return raw;
      } catch (e) {
        return '';
      }
    }

    function getRuntimeExtensionFaviconUrl(pageUrl) {
      const page = String(pageUrl || '').trim();
      if (!/^https?:\/\//i.test(page)) {
        return '';
      }
      const configured = getSafeOverlayFaviconCandidateUrl(getExtensionFaviconUrl(page));
      if (configured) {
        return configured;
      }
      if (!chromeApi.runtime || typeof chromeApi.runtime.getURL !== 'function') {
        return '';
      }
      try {
        const faviconUrl = new URL(chromeApi.runtime.getURL('/_favicon/'));
        faviconUrl.searchParams.set('pageUrl', page);
        faviconUrl.searchParams.set('size', '128');
        return getSafeOverlayFaviconCandidateUrl(faviconUrl.toString());
      } catch (e) {
        return '';
      }
    }

    function getRuntimeGstaticFaviconUrl(pageUrl) {
      const page = String(pageUrl || '').trim();
      if (!/^https?:\/\//i.test(page)) {
        return '';
      }
      const configured = getSafeOverlayFaviconCandidateUrl(getGstaticFaviconUrl(page));
      if (configured) {
        return configured;
      }
      try {
        const faviconUrl = new URL('https://t2.gstatic.cn/faviconV2');
        faviconUrl.searchParams.set('client', 'SOCIAL');
        faviconUrl.searchParams.set('type', 'FAVICON');
        faviconUrl.searchParams.set('fallback_opts', 'TYPE,SIZE,URL');
        faviconUrl.searchParams.set('url', page);
        faviconUrl.searchParams.set('size', '128');
        return getSafeOverlayFaviconCandidateUrl(faviconUrl.toString());
      } catch (e) {
        return '';
      }
    }

    function requestFaviconData(url) {
      return faviconViewCore.requestFaviconData(url);
    }

    function setFaviconSrcWithAnimation(img, nextSrc, optionsArg) {
      return faviconViewCore.setFaviconSrcWithAnimation(img, nextSrc, optionsArg);
    }

    function canReuseCurrentFavicon(img, nextSrc) {
      return faviconViewCore.canReuseCurrentFavicon(img, nextSrc);
    }

    function getLastWorkingFaviconSrc(img) {
      return faviconViewCore.getLastWorkingFaviconSrc(img);
    }

    function restoreWorkingFaviconOrFail(img, previousSrc, onFailed) {
      return faviconViewCore.restoreWorkingFaviconOrFallback(img, previousSrc, {
        removeFallbackNode: removeFallbackIconNode,
        onFailed,
        applyFallbackIcon
      });
    }

    function createOverlayThemeAwareFaviconState(img, pageUrl, hostKey, fallbackUrl, onFailed) {
      img._xOverlayThemeFaviconSession = (img._xOverlayThemeFaviconSession || 0) + 1;
      const session = img._xOverlayThemeFaviconSession;
      const normalizedHostKey = hostKey || getHostFromUrl(pageUrl);

      return {
        pageUrl: String(pageUrl || ''),
        hostKey: String(normalizedHostKey || ''),
        fallbackUrl: getSafeOverlayFaviconCandidateUrl(fallbackUrl),
        primaryUrl: getSafeOverlayFaviconCandidateUrl(fallbackUrl),
        extensionFavicon: getRuntimeExtensionFaviconUrl(pageUrl),
        gstaticFavicon: getRuntimeGstaticFaviconUrl(pageUrl),
        previousWorkingSrc: getLastWorkingFaviconSrc(img),
        handleFailed: typeof onFailed === 'function' ? onFailed : function() {},
        isSessionCurrent() {
          return Boolean(img && img._xOverlayThemeFaviconSession === session);
        },
        isSessionMounted() {
          return Boolean(img && img.isConnected && img._xOverlayThemeFaviconSession === session);
        }
      };
    }

    function syncOverlayThemeAwareFaviconAttributes(img, state) {
      img.setAttribute('data-x-ov-theme-favicon', '1');
      img.setAttribute('data-x-ov-favicon-page-url', state.pageUrl);
      img.setAttribute('data-x-ov-favicon-host', state.hostKey);
      img.setAttribute('data-x-ov-favicon-fallback-url', state.fallbackUrl);
      img.removeAttribute('data-x-ov-favicon-cache-key');
    }

    function buildOverlayThemeAwareFaviconCandidatePlan(state) {
      const seen = new Set();
      return [
        { kind: 'primary', url: state.primaryUrl },
        { kind: 'extension', url: state.extensionFavicon },
        { kind: 'gstatic', url: state.gstaticFavicon }
      ].filter((candidate) => {
        const url = getSafeOverlayFaviconCandidateUrl(candidate.url);
        if (!url || seen.has(url)) {
          return false;
        }
        seen.add(url);
        candidate.url = url;
        return true;
      });
    }

    function clearOverlayCandidateLoadTimer(img) {
      if (!img || img._xOverlayThemeFaviconLoadTimer === null || img._xOverlayThemeFaviconLoadTimer === undefined) {
        return;
      }
      clearTimer(img._xOverlayThemeFaviconLoadTimer);
      img._xOverlayThemeFaviconLoadTimer = null;
    }

    function isOverlayCandidateLoaded(img, nextUrl) {
      if (!img || !nextUrl) {
        return false;
      }
      const resolvedSrc = img.getAttribute('data-favicon-current-src') || '';
      if (resolvedSrc === nextUrl) {
        return true;
      }
      return Boolean(img.complete && img.naturalWidth > 0);
    }

    function scheduleOverlayCandidateLoadTimer(img, state, nextUrl) {
      if (!img || !state || !nextUrl || faviconCandidateLoadTimeoutMs <= 0) {
        return;
      }
      clearOverlayCandidateLoadTimer(img);
      const expectedToken = img._xFaviconLoadToken || 0;
      const expectedSrc = String(nextUrl);
      img._xOverlayThemeFaviconLoadTimer = setTimer(() => {
        img._xOverlayThemeFaviconLoadTimer = null;
        if (!img || !state.isSessionCurrent()) {
          return;
        }
        if ((img._xFaviconLoadToken || 0) !== expectedToken) {
          return;
        }
        const currentRenderedSrc = String(img.getAttribute('src') || img.src || '');
        if (currentRenderedSrc && currentRenderedSrc !== expectedSrc) {
          return;
        }
        if (isOverlayCandidateLoaded(img, expectedSrc)) {
          return;
        }
        if (typeof img._xOverlayThemeFaviconErrorHandler === 'function') {
          img._xOverlayThemeFaviconErrorHandler();
        }
      }, faviconCandidateLoadTimeoutMs);
    }

    function tryApplyOverlayThemeAwareFaviconCandidate(img, state, tried, candidate) {
      const nextUrl = candidate && candidate.url ? String(candidate.url) : '';
      if (!nextUrl || !img || !state.isSessionCurrent()) {
        return false;
      }
      if (tried.has(nextUrl)) {
        return false;
      }
      tried.add(nextUrl);
      clearOverlayCandidateLoadTimer(img);
      const applied = setFaviconSrcWithAnimation(img, nextUrl, { persist: false });
      const reused = !applied && canReuseCurrentFavicon(img, nextUrl);
      if (!applied && !reused) {
        return false;
      }
      if (reused) {
        showResolvedFavicon(img);
      } else {
        setFaviconVisibility(img, 'visible');
        scheduleOverlayCandidateLoadTimer(img, state, nextUrl);
      }
      return true;
    }

    function finalizeOverlayThemeAwareFaviconFailure(img, state) {
      clearOverlayCandidateLoadTimer(img);
      restoreWorkingFaviconOrFail(img, state.previousWorkingSrc, state.handleFailed);
    }

    function attachResolvedFaviconWithFallbacks(img, pageUrl, hostKey, fallbackUrl, onFailed) {
      if (!img) {
        return;
      }
      if (img._xOverlayThemeFaviconErrorHandler) {
        img.removeEventListener('error', img._xOverlayThemeFaviconErrorHandler);
        img._xOverlayThemeFaviconErrorHandler = null;
      }
      clearOverlayCandidateLoadTimer(img);

      const state = createOverlayThemeAwareFaviconState(img, pageUrl, hostKey, fallbackUrl, onFailed);
      if (state.hostKey && shouldBlockFaviconForHost(state.hostKey)) {
        state.handleFailed();
        return;
      }
      syncOverlayThemeAwareFaviconAttributes(img, state);
      const candidates = buildOverlayThemeAwareFaviconCandidatePlan(state);
      const tried = new Set();
      let candidateIndex = 0;

      const tryNextAvailableCandidate = () => {
        while (candidateIndex < candidates.length) {
          const candidate = candidates[candidateIndex];
          candidateIndex += 1;
          if (tryApplyOverlayThemeAwareFaviconCandidate(img, state, tried, candidate)) {
            return true;
          }
        }
        return false;
      };

      const handleImageError = () => {
        if (!state.isSessionCurrent()) {
          return;
        }
        if (tryNextAvailableCandidate()) {
          return;
        }
        finalizeOverlayThemeAwareFaviconFailure(img, state);
      };

      img._xOverlayThemeFaviconErrorHandler = handleImageError;
      img.addEventListener('error', handleImageError);

      const appliedInitial = tryNextAvailableCandidate();
      if (!appliedInitial) {
        finalizeOverlayThemeAwareFaviconFailure(img, state);
      }
    }

    function refreshOverlayThemeAwareFavicons() {
      const overlay = getOverlayPanel();
      if (!overlay) {
        return;
      }
      overlay.querySelectorAll('img[data-x-ov-theme-favicon="1"]').forEach((img) => {
        if (!img || !img.isConnected) {
          return;
        }
        const pageUrl = img.getAttribute('data-x-ov-favicon-page-url') || '';
        if (!pageUrl) {
          return;
        }
        const hostKey = img.getAttribute('data-x-ov-favicon-host') || '';
        const fallbackUrl = img.getAttribute('data-x-ov-favicon-fallback-url') || '';
        attachResolvedFaviconWithFallbacks(img, pageUrl, hostKey, fallbackUrl);
      });
    }

    function attachFaviconData(img, url, hostOverride) {
      faviconViewCore.attachFaviconData(img, url, hostOverride);
    }

    function preloadIcon(url) {
      faviconViewCore.preloadIcon(url);
    }

    function warmIconCache(list) {
      faviconViewCore.warmIconCache(list);
    }

    return Object.freeze({
      applyFaviconOpticalShift,
      applyFaviconOpticalAlignment,
      isBlockedLocalFaviconUrl,
      isChromeMonogramFaviconUrl,
      requestFaviconData,
      setFaviconSrcWithAnimation,
      attachFaviconData,
      attachResolvedFaviconWithFallbacks,
      refreshOverlayThemeAwareFavicons,
      preloadIcon,
      warmIconCache
    });
  }

  return Object.freeze({
    createOverlayFaviconViewRuntime
  });
});
