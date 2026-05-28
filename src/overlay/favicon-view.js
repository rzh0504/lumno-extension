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
    const getGoogleFaviconUrl = typeof config.getGoogleFaviconUrl === 'function' ? config.getGoogleFaviconUrl : (() => '');
    const getFaviconIsUrl = typeof config.getFaviconIsUrl === 'function' ? config.getFaviconIsUrl : (() => '');
    const getSiteFaviconUrl = typeof config.getSiteFaviconUrl === 'function' ? config.getSiteFaviconUrl : (() => '');
    const normalizeFaviconHost = typeof config.normalizeFaviconHost === 'function' ? config.normalizeFaviconHost : ((value) => String(value || ''));
    const shouldBlockFaviconForHost = typeof config.shouldBlockFaviconForHost === 'function' ? config.shouldBlockFaviconForHost : (() => false);
    const isFaviconProxyUrl = typeof config.isFaviconProxyUrl === 'function' ? config.isFaviconProxyUrl : (() => false);
    const isBlockedLocalFaviconUrl = typeof config.isBlockedLocalFaviconUrl === 'function'
      ? config.isBlockedLocalFaviconUrl
      : (() => false);
    const isChromeMonogramFaviconUrl = typeof config.isChromeMonogramFaviconUrl === 'function'
      ? config.isChromeMonogramFaviconUrl
      : ((url) => /^chrome:\/\/favicon2\//i.test(String(url || '').trim()));
    const getKnownThemedFaviconCandidates = typeof config.getKnownThemedFaviconCandidates === 'function'
      ? config.getKnownThemedFaviconCandidates
      : null;
    const getRootFaviconCandidates = typeof config.getRootFaviconCandidates === 'function'
      ? config.getRootFaviconCandidates
      : (() => []);
    const hostHasExplicitDarkFavicon = typeof config.hostHasExplicitDarkFavicon === 'function'
      ? config.hostHasExplicitDarkFavicon
      : null;
    const shouldSkipThemeUpgradeCandidate = typeof config.shouldSkipThemeUpgradeCandidate === 'function'
      ? config.shouldSkipThemeUpgradeCandidate
      : (() => false);
    const isOverlayDarkMode = typeof config.isOverlayDarkMode === 'function' ? config.isOverlayDarkMode : (() => false);
    const preloadThemeFromFavicon = typeof config.preloadThemeFromFavicon === 'function' ? config.preloadThemeFromFavicon : noop;
    const hasThemeForHost = typeof config.hasThemeForHost === 'function' ? config.hasThemeForHost : (() => false);
    const getOverlayPanel = typeof config.getOverlayPanel === 'function' ? config.getOverlayPanel : (() => null);
    const getPersistedFaviconEntry = typeof config.getPersistedFaviconEntry === 'function'
      ? config.getPersistedFaviconEntry
      : (() => null);
    const setPersistedFaviconUrl = typeof config.setPersistedFaviconUrl === 'function'
      ? config.setPersistedFaviconUrl
      : noop;
    const getPersistedFaviconDataEntry = typeof config.getPersistedFaviconDataEntry === 'function'
      ? config.getPersistedFaviconDataEntry
      : (() => null);
    const setPersistedFaviconData = typeof config.setPersistedFaviconData === 'function'
      ? config.setPersistedFaviconData
      : noop;
    const faviconDataCache = config.faviconDataCache || new Map();
    const faviconDataPending = config.faviconDataPending || new Map();
    const iconPreloadCache = config.iconPreloadCache || new Map();
    const faviconFallbackNodeMap = config.faviconFallbackNodeMap || new WeakMap();
    const resolvedFaviconUrlCache = config.resolvedFaviconUrlCache ||
      win._x_extension_overlay_favicon_url_cache_2024_unique_ ||
      new Map();
    win._x_extension_overlay_favicon_url_cache_2024_unique_ = resolvedFaviconUrlCache;
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
        getThemeFaviconUrl: getSiteFaviconUrl,
        hasThemeForHost,
        faviconDataCache,
        faviconDataPending,
        iconPreloadCache
      })
      : null;

    function createImage() {
      return faviconViewCore.createImage();
    }

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

    function isFaviconHidden(img) {
      return Boolean(img && (
        img.getAttribute('data-favicon-visibility') === 'hidden' ||
        img.getAttribute('data-fallback-icon') === 'true' ||
        img.getAttribute('data-favicon-placeholder') === 'true'
      ));
    }

    function applyFaviconOpticalShift(img) {
      faviconViewCore.applyFaviconOpticalShift(img);
    }

    function applyFaviconOpticalAlignment(img) {
      faviconViewCore.applyFaviconOpticalAlignment(img);
    }

    function dedupeOverlayFaviconCandidateUrls(urls) {
      return faviconViewCore.dedupeFaviconCandidateUrls(urls);
    }

    function getKnownOverlayThemedFaviconCandidates(hostname, preferredTheme) {
      if (getKnownThemedFaviconCandidates) {
        return getKnownThemedFaviconCandidates(hostname, preferredTheme);
      }
      const host = normalizeFaviconHost(hostname);
      if (!host) {
        return [];
      }
      if (host === 'lumno.kubai.design') {
        const lumnoIconUrl = (chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getURL === 'function')
          ? chromeApi.runtime.getURL('assets/images/lumno.png')
          : 'https://lumno.kubai.design/favicon.png';
        return [lumnoIconUrl];
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

    function overlayHostHasExplicitDarkFavicon(hostname) {
      if (hostHasExplicitDarkFavicon) {
        return hostHasExplicitDarkFavicon(hostname);
      }
      const host = normalizeFaviconHost(hostname);
      if (!host) {
        return false;
      }
      return host === 'github.com' || host.endsWith('.github.com');
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
      const preferredTheme = isOverlayDarkMode() ? 'dark' : 'light';
      const faviconHostKey = normalizeFaviconHost(normalizedHostKey || '');
      const cacheKey = `${String(normalizedHostKey || '')}::${String(pageUrl || '')}::${String(fallbackUrl || '')}::${preferredTheme}`;
      const persistentCacheKey = faviconHostKey ? `${preferredTheme}::${faviconHostKey}` : '';
      const persistedEntry = persistentCacheKey ? getPersistedFaviconEntry(persistentCacheKey) : null;
      const persistedDataEntry = persistentCacheKey ? getPersistedFaviconDataEntry(persistentCacheKey) : null;
      const persistedFavicon = persistedEntry &&
        persistedEntry.url &&
        !isBlockedLocalFaviconUrl(persistedEntry.url) &&
        !isChromeMonogramFaviconUrl(persistedEntry.url) &&
        !isFaviconProxyUrl(persistedEntry.url)
        ? persistedEntry.url
        : '';
      const persistedDataUrl = persistedDataEntry && persistedDataEntry.dataUrl
        ? persistedDataEntry.dataUrl
        : '';
      const shouldBypassCachedUrl = faviconHostKey === 'lumno.kubai.design';
      const cachedUrl = resolvedFaviconUrlCache.get(cacheKey) || '';
      const safeCachedUrl = (
        shouldBypassCachedUrl ||
        isBlockedLocalFaviconUrl(cachedUrl) ||
        isChromeMonogramFaviconUrl(cachedUrl) ||
        isFaviconProxyUrl(cachedUrl)
      )
        ? ''
        : cachedUrl;
      const safeFallbackUrl = isBlockedLocalFaviconUrl(fallbackUrl) ? '' : String(fallbackUrl || '');
      const fallbackIsProxy = isFaviconProxyUrl(safeFallbackUrl);

      return {
        pageUrl: String(pageUrl || ''),
        hostKey: String(normalizedHostKey || ''),
        faviconHostKey,
        fallbackUrl: safeFallbackUrl,
        preferredTheme,
        previousWorkingSrc: getLastWorkingFaviconSrc(img),
        cacheKey,
        persistentCacheKey,
        persistedFavicon,
        persistedDataUrl,
        safeCachedUrl,
        primaryFallbackUrl: fallbackIsProxy ? '' : safeFallbackUrl,
        proxyFallbackUrl: fallbackIsProxy ? safeFallbackUrl : '',
        googleFavicon: normalizedHostKey ? getGoogleFaviconUrl(normalizedHostKey) : '',
        faviconIsFavicon: normalizedHostKey ? getFaviconIsUrl(normalizedHostKey) : '',
        handleFailed: typeof onFailed === 'function' ? onFailed : function() {},
        shouldPreferDarkTokenUpgrades: preferredTheme === 'dark' &&
          overlayHostHasExplicitDarkFavicon(normalizedHostKey),
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
      if (state.persistentCacheKey) {
        img.setAttribute('data-x-ov-favicon-cache-key', state.persistentCacheKey);
      } else {
        img.removeAttribute('data-x-ov-favicon-cache-key');
      }
    }

    function primePersistedOverlayFaviconData(img, state) {
      if (!state.persistedDataUrl) {
        return false;
      }
      if (state.persistedFavicon && !faviconDataCache.has(state.persistedFavicon)) {
        faviconDataCache.set(state.persistedFavicon, state.persistedDataUrl);
      }
      const applied = setFaviconSrcWithAnimation(img, state.persistedDataUrl, { persist: false });
      const reused = !applied && canReuseCurrentFavicon(img, state.persistedDataUrl);
      if (reused) {
        showResolvedFavicon(img);
      }
      if (applied || reused) {
        preloadThemeFromFavicon(state.persistedFavicon || state.fallbackUrl || state.googleFavicon, state.persistedDataUrl, state.hostKey);
      }
      return applied || reused;
    }

    function buildOverlayThemeAwareFaviconCandidatePlan(state) {
      const siteSvgFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon.svg` : '';
      const siteDarkSvgFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon-dark.svg` : '';
      const siteLightSvgFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon-light.svg` : '';
      const sitePngFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon.png` : '';
      const site32PngFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon-32x32.png` : '';
      const site16PngFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon-16x16.png` : '';
      const siteIcoFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon.ico` : '';
      const siteAppleTouchIcon = state.faviconHostKey ? `https://${state.faviconHostKey}/apple-touch-icon.png` : '';
      const siteAppleTouchIconPrecomposed = state.faviconHostKey ? `https://${state.faviconHostKey}/apple-touch-icon-precomposed.png` : '';
      const siteIconPng = state.faviconHostKey ? `https://${state.faviconHostKey}/icon.png` : '';
      const sharedRootCandidates = getRootFaviconCandidates(state.faviconHostKey, state.preferredTheme);
      const fallbackRootCandidates = state.preferredTheme === 'dark'
        ? [
          siteDarkSvgFavicon,
          siteSvgFavicon,
          sitePngFavicon,
          siteIcoFavicon,
          site32PngFavicon,
          site16PngFavicon,
          siteAppleTouchIcon,
          siteAppleTouchIconPrecomposed,
          siteIconPng,
          siteLightSvgFavicon
        ]
        : [
          siteLightSvgFavicon,
          siteSvgFavicon,
          sitePngFavicon,
          siteIcoFavicon,
          site32PngFavicon,
          site16PngFavicon,
          siteAppleTouchIcon,
          siteAppleTouchIconPrecomposed,
          siteIconPng,
          siteDarkSvgFavicon
        ];
      const rootCandidates = sharedRootCandidates.length > 0 ? sharedRootCandidates : fallbackRootCandidates;
      const knownThemedCandidates = getKnownOverlayThemedFaviconCandidates(state.faviconHostKey, state.preferredTheme);

      return {
        localCandidates: dedupeOverlayFaviconCandidateUrls([
          state.persistedFavicon,
          state.safeCachedUrl,
          state.primaryFallbackUrl,
          ...knownThemedCandidates,
          ...rootCandidates,
          state.googleFavicon,
          state.proxyFallbackUrl,
          state.faviconIsFavicon
        ]).filter((candidate) => !isBlockedLocalFaviconUrl(candidate))
      };
    }

    function tryApplyOverlayThemeAwareFaviconCandidate(img, state, tried, nextUrl) {
      if (!nextUrl || !img || !state.isSessionCurrent()) {
        return false;
      }
      if (tried.has(nextUrl)) {
        return false;
      }
      tried.add(nextUrl);
      const applied = setFaviconSrcWithAnimation(img, nextUrl);
      const reused = !applied && canReuseCurrentFavicon(img, nextUrl);
      if (!applied && !reused) {
        return false;
      }
      if (reused) {
        showResolvedFavicon(img);
      } else {
        setFaviconVisibility(img, 'visible');
      }
      if (!isChromeMonogramFaviconUrl(nextUrl) && state.cacheKey) {
        if (!isFaviconProxyUrl(nextUrl)) {
          resolvedFaviconUrlCache.set(state.cacheKey, nextUrl);
        }
      }
      const isProxyCandidate = isFaviconProxyUrl(nextUrl);
      if (!nextUrl.startsWith('data:') && !isChromeMonogramFaviconUrl(nextUrl) && !isProxyCandidate) {
        attachFaviconData(img, nextUrl, state.hostKey);
      }
      return true;
    }

    function requestResolvedOverlayThemeAwareFaviconCandidates(state) {
      if (!state.pageUrl) {
        return Promise.resolve([]);
      }
      return new Promise((resolve) => {
        if (!chromeApi.runtime || typeof chromeApi.runtime.sendMessage !== 'function') {
          resolve([]);
          return;
        }
        chromeApi.runtime.sendMessage(
          {
            action: 'resolveFaviconCandidates',
            url: state.pageUrl,
            host: state.hostKey,
            fallbackUrl: state.fallbackUrl,
            preferredTheme: state.preferredTheme
          },
          (response) => {
            const resolved = response && Array.isArray(response.urls) ? response.urls : [];
            resolve(
              dedupeOverlayFaviconCandidateUrls(resolved)
                .filter((candidate) => candidate && !isBlockedLocalFaviconUrl(candidate))
            );
          }
        );
      });
    }

    function tryUpgradeOverlayThemeAwareFaviconCandidates(img, state, candidateUrls) {
      const currentSrc = img && img.src ? String(img.src) : '';
      const upgrades = dedupeOverlayFaviconCandidateUrls(candidateUrls).filter((candidate) => {
        if (!candidate || candidate === currentSrc || isChromeMonogramFaviconUrl(candidate) || isFaviconProxyUrl(candidate)) {
          return false;
        }
        if (state.shouldPreferDarkTokenUpgrades && !/(^|[._/-])dark([._/-]|$)/i.test(String(candidate || ''))) {
          return false;
        }
        if (shouldSkipThemeUpgradeCandidate(candidate, state.preferredTheme, currentSrc)) {
          return false;
        }
        return true;
      });
      if (upgrades.length === 0) {
        return;
      }

      const tryUpgrade = (index) => {
        if (!state.isSessionMounted() || index >= upgrades.length) {
          return;
        }
        const candidate = upgrades[index];
        const probe = createImage();
        probe.referrerPolicy = 'no-referrer';
        probe.onload = () => {
          if (!state.isSessionMounted()) {
            return;
          }
          setFaviconSrcWithAnimation(img, candidate);
          setFaviconVisibility(img, 'visible');
          if (state.cacheKey && !isFaviconProxyUrl(candidate)) {
            resolvedFaviconUrlCache.set(state.cacheKey, candidate);
          }
          if (!candidate.startsWith('data:') && !isChromeMonogramFaviconUrl(candidate) && !isFaviconProxyUrl(candidate)) {
            attachFaviconData(img, candidate, state.hostKey);
          }
        };
        probe.onerror = () => {
          tryUpgrade(index + 1);
        };
        probe.src = candidate;
      };

      tryUpgrade(0);
    }

    function finalizeOverlayThemeAwareFaviconFailure(img, state) {
      restoreWorkingFaviconOrFail(img, state.previousWorkingSrc, state.handleFailed);
    }

    function attachResolvedFaviconWithFallbacks(img, pageUrl, hostKey, fallbackUrl, onFailed) {
      if (!img) {
        return;
      }
      const state = createOverlayThemeAwareFaviconState(img, pageUrl, hostKey, fallbackUrl, onFailed);
      if (state.hostKey && shouldBlockFaviconForHost(state.hostKey)) {
        state.handleFailed();
        return;
      }
      syncOverlayThemeAwareFaviconAttributes(img, state);
      if (primePersistedOverlayFaviconData(img, state)) {
        return;
      }
      const candidatePlan = buildOverlayThemeAwareFaviconCandidatePlan(state);
      const tried = new Set();
      const shouldRequestResolvedCandidatesImmediately = Boolean(state.pageUrl && !state.persistedFavicon);
      let resolvedCandidates = [];
      let resolvedCandidatesLoaded = !shouldRequestResolvedCandidatesImmediately;
      let resolvedCandidatesRequested = false;

      if (img._xOverlayThemeFaviconErrorHandler) {
        img.removeEventListener('error', img._xOverlayThemeFaviconErrorHandler);
        img._xOverlayThemeFaviconErrorHandler = null;
      }

      const tryNextAvailableCandidate = () => {
        const candidatePool = dedupeOverlayFaviconCandidateUrls([
          ...candidatePlan.localCandidates,
          ...resolvedCandidates
        ]);
        for (let i = 0; i < candidatePool.length; i += 1) {
          if (tryApplyOverlayThemeAwareFaviconCandidate(img, state, tried, candidatePool[i])) {
            return true;
          }
        }
        return false;
      };

      const requestResolvedCandidatesOnce = () => {
        if (!state.pageUrl || resolvedCandidatesRequested) {
          return false;
        }
        resolvedCandidatesRequested = true;
        resolvedCandidatesLoaded = false;
        requestResolvedOverlayThemeAwareFaviconCandidates(state)
          .then((resolved) => {
            if (!state.isSessionCurrent()) {
              return;
            }
            resolvedCandidates = resolved;
            resolvedCandidatesLoaded = true;

            if (!appliedInitial || isFaviconHidden(img)) {
              if (!tryNextAvailableCandidate()) {
                finalizeOverlayThemeAwareFaviconFailure(img, state);
              }
              return;
            }

            tryUpgradeOverlayThemeAwareFaviconCandidates(img, state, [
              ...resolvedCandidates,
              ...candidatePlan.localCandidates
            ]);
          })
          .catch(() => {
            resolvedCandidatesLoaded = true;
            if (!state.isSessionCurrent()) {
              return;
            }
            if (!appliedInitial || isFaviconHidden(img)) {
              finalizeOverlayThemeAwareFaviconFailure(img, state);
            }
          });
        return true;
      };

      const handleImageError = () => {
        if (!state.isSessionCurrent()) {
          return;
        }
        if (tryNextAvailableCandidate()) {
          return;
        }
        if (state.pageUrl && !resolvedCandidatesRequested) {
          showPendingFallbackIcon(img);
          requestResolvedCandidatesOnce();
          return;
        }
        if (!resolvedCandidatesLoaded) {
          showPendingFallbackIcon(img);
          return;
        }
        finalizeOverlayThemeAwareFaviconFailure(img, state);
      };

      img._xOverlayThemeFaviconErrorHandler = handleImageError;
      img.addEventListener('error', handleImageError);

      const appliedInitial = tryNextAvailableCandidate();
      if (!appliedInitial) {
        if (state.pageUrl) {
          showPendingFallbackIcon(img);
        } else {
          applyFallbackIcon(img);
        }
      }
      if (!state.pageUrl) {
        if (!appliedInitial) {
          finalizeOverlayThemeAwareFaviconFailure(img, state);
        }
        return;
      }
      if (!appliedInitial || shouldRequestResolvedCandidatesImmediately) {
        requestResolvedCandidatesOnce();
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
