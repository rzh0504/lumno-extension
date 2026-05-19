(function(root, factory) {
  const api = factory();
  root.LumnoOverlayFaviconView = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function noop() {}

  function createOverlayFaviconViewRuntime(options) {
    const config = options || {};
    const doc = config.document || (typeof document !== 'undefined' ? document : null);
    const win = config.windowObj || (typeof window !== 'undefined' ? window : {});
    const chromeApi = config.chromeApi || (typeof chrome !== 'undefined' ? chrome : {});
    const ImageCtor = win.Image || (typeof Image !== 'undefined' ? Image : null);
    const requestFrame = typeof win.requestAnimationFrame === 'function'
      ? win.requestAnimationFrame.bind(win)
      : (callback) => win.setTimeout(callback, 16);
    const getRiSvg = typeof config.getRiSvg === 'function' ? config.getRiSvg : (() => '');
    const getHostFromUrl = typeof config.getHostFromUrl === 'function' ? config.getHostFromUrl : (() => '');
    const getGoogleFaviconUrl = typeof config.getGoogleFaviconUrl === 'function' ? config.getGoogleFaviconUrl : (() => '');
    const getFaviconIsUrl = typeof config.getFaviconIsUrl === 'function' ? config.getFaviconIsUrl : (() => '');
    const getSiteFaviconUrl = typeof config.getSiteFaviconUrl === 'function' ? config.getSiteFaviconUrl : (() => '');
    const normalizeFaviconHost = typeof config.normalizeFaviconHost === 'function' ? config.normalizeFaviconHost : ((value) => String(value || ''));
    const shouldBlockFaviconForHost = typeof config.shouldBlockFaviconForHost === 'function' ? config.shouldBlockFaviconForHost : (() => false);
    const isFaviconProxyUrl = typeof config.isFaviconProxyUrl === 'function' ? config.isFaviconProxyUrl : (() => false);
    const shouldSkipThemeUpgradeCandidate = typeof config.shouldSkipThemeUpgradeCandidate === 'function'
      ? config.shouldSkipThemeUpgradeCandidate
      : (() => false);
    const isOverlayDarkMode = typeof config.isOverlayDarkMode === 'function' ? config.isOverlayDarkMode : (() => false);
    const preloadThemeFromFavicon = typeof config.preloadThemeFromFavicon === 'function' ? config.preloadThemeFromFavicon : noop;
    const hasThemeForHost = typeof config.hasThemeForHost === 'function' ? config.hasThemeForHost : (() => false);
    const getOverlayPanel = typeof config.getOverlayPanel === 'function' ? config.getOverlayPanel : (() => null);
    const faviconDataCache = config.faviconDataCache || new Map();
    const faviconDataPending = config.faviconDataPending || new Map();
    const iconPreloadCache = config.iconPreloadCache || new Map();
    const faviconFallbackNodeMap = config.faviconFallbackNodeMap || new WeakMap();
    const resolvedFaviconUrlCache = config.resolvedFaviconUrlCache ||
      win._x_extension_overlay_favicon_url_cache_2024_unique_ ||
      new Map();
    win._x_extension_overlay_favicon_url_cache_2024_unique_ = resolvedFaviconUrlCache;

    function createImage() {
      return typeof ImageCtor === 'function'
        ? new ImageCtor()
        : (doc && typeof doc.createElement === 'function' ? doc.createElement('img') : {});
    }

    function setFaviconLoadState(img, state) {
      if (!img) {
        return;
      }
      if (state) {
        img.setAttribute('data-favicon-load-state', state);
      } else {
        img.removeAttribute('data-favicon-load-state');
      }
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
      if (!node) {
        return;
      }
      node.setAttribute('data-visible', visible ? 'true' : 'false');
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
      if (!img) {
        return;
      }
      const targetSize = 16;
      const visualCenter = (targetSize - 1) / 2;
      try {
        if (!(img.complete && img.naturalWidth > 0 && img.naturalHeight > 0)) {
          img.style.setProperty('transform', 'none');
          return;
        }
        const canvas = doc.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          img.style.setProperty('transform', 'none');
          return;
        }
        context.clearRect(0, 0, targetSize, targetSize);
        context.drawImage(img, 0, 0, targetSize, targetSize);
        const data = context.getImageData(0, 0, targetSize, targetSize).data;
        let sumAlpha = 0;
        let weightedX = 0;
        let weightedY = 0;
        for (let y = 0; y < targetSize; y += 1) {
          for (let x = 0; x < targetSize; x += 1) {
            const alpha = data[(y * targetSize + x) * 4 + 3];
            if (alpha < 18) {
              continue;
            }
            sumAlpha += alpha;
            weightedX += x * alpha;
            weightedY += y * alpha;
          }
        }
        if (sumAlpha <= 0) {
          img.style.setProperty('transform', 'none');
          return;
        }
        const contentCenterX = weightedX / sumAlpha;
        const contentCenterY = weightedY / sumAlpha;
        const clamp = (value) => Math.max(-2, Math.min(2, value));
        let offsetX = clamp(visualCenter - contentCenterX);
        let offsetY = clamp(visualCenter - contentCenterY);
        if (Math.abs(offsetX) < 0.4) {
          offsetX = 0;
        }
        if (Math.abs(offsetY) < 0.4) {
          offsetY = 0;
        }
        img.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px)`);
      } catch (e) {
        img.style.setProperty('transform', 'none');
      }
    }

    function applyFaviconOpticalAlignment(img) {
      if (!img) {
        return;
      }
      img.style.setProperty('object-fit', 'contain');
      img.style.setProperty('object-position', 'center center');
      applyFaviconOpticalShift(img);
    }

    function dedupeOverlayFaviconCandidateUrls(urls) {
      const unique = [];
      const seen = new Set();
      (urls || []).forEach((item) => {
        const value = String(item || '').trim();
        if (!value || seen.has(value)) {
          return;
        }
        seen.add(value);
        unique.push(value);
      });
      return unique;
    }

    function isChromeMonogramFaviconUrl(url) {
      return /^chrome:\/\/favicon2\//i.test(String(url || '').trim());
    }

    function getKnownOverlayThemedFaviconCandidates(hostname, preferredTheme) {
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
      const host = normalizeFaviconHost(hostname);
      if (!host) {
        return false;
      }
      return host === 'github.com' || host.endsWith('.github.com');
    }

    function isBlockedLocalFaviconUrl(url) {
      const raw = String(url || '').trim();
      if (!raw) {
        return false;
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
      const hostCandidate = (() => {
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
      })();
      if (hostCandidate && shouldBlockFaviconForHost(hostCandidate)) {
        return true;
      }
      try {
        const parsed = new URL(raw);
        const protocol = String(parsed.protocol || '').toLowerCase();
        if ((protocol === 'http:' || protocol === 'https:') && shouldBlockFaviconForHost(parsed.hostname)) {
          return true;
        }
        if (protocol === 'chrome:' && parsed.hostname === 'favicon2') {
          const nested = parsed.searchParams.get('url') || '';
          if (nested) {
            try {
              const nestedUrl = new URL(nested);
              if (shouldBlockFaviconForHost(nestedUrl.hostname)) {
                return true;
              }
            } catch (e) {
              // Ignore malformed nested URL.
            }
          }
        }
      } catch (e) {
        // Ignore malformed URL.
      }
      return false;
    }

    function requestFaviconData(url) {
      if (!url || url.startsWith('data:') || isBlockedLocalFaviconUrl(url)) {
        return Promise.resolve(null);
      }
      if (faviconDataCache.has(url)) {
        return Promise.resolve(faviconDataCache.get(url));
      }
      if (faviconDataPending.has(url)) {
        return faviconDataPending.get(url);
      }
      const promise = new Promise((resolve) => {
        if (!chromeApi.runtime || typeof chromeApi.runtime.sendMessage !== 'function') {
          faviconDataPending.delete(url);
          resolve(null);
          return;
        }
        chromeApi.runtime.sendMessage({ action: 'getFaviconData', url: url }, (response) => {
          const dataUrl = response && response.data ? response.data : '';
          if (dataUrl) {
            faviconDataCache.set(url, dataUrl);
          }
          faviconDataPending.delete(url);
          resolve(dataUrl || null);
        });
      });
      faviconDataPending.set(url, promise);
      return promise;
    }

    function setFaviconSrcWithAnimation(img, nextSrc) {
      if (!img || !nextSrc || isBlockedLocalFaviconUrl(nextSrc)) {
        return false;
      }
      const currentSrc = img.getAttribute('data-favicon-current-src') || '';
      const isFallbackVisible = img.getAttribute('data-fallback-icon') === 'true';
      const isPlaceholderVisible = img.getAttribute('data-favicon-placeholder') === 'true';
      if (currentSrc === nextSrc) {
        if ((isFallbackVisible || isPlaceholderVisible) && img.complete && img.naturalWidth > 0) {
          showResolvedFavicon(img);
          return false;
        }
        if (!isFallbackVisible && !isPlaceholderVisible) {
          return false;
        }
      }
      const hasAppeared = img.getAttribute('data-favicon-has-appeared') === 'true';
      const shouldAnimate = !hasAppeared;
      if (shouldAnimate || isFallbackVisible || isPlaceholderVisible) {
        showPendingFallbackIcon(img);
      }
      img._xFaviconLoadToken = (img._xFaviconLoadToken || 0) + 1;
      const token = img._xFaviconLoadToken;
      const finalize = () => {
        if (!img || token !== img._xFaviconLoadToken) {
          return;
        }
        showResolvedFavicon(img);
        img.setAttribute('data-favicon-current-src', nextSrc);
        img.setAttribute('data-favicon-has-appeared', 'true');
        applyFaviconOpticalShift(img);
        if (!shouldAnimate) {
          setFaviconLoadState(img, '');
          img.style.setProperty('filter', 'none');
          img.style.setProperty('opacity', '1');
          img.style.setProperty('transition', 'none');
          return;
        }
        setFaviconLoadState(img, 'priming');
        requestFrame(() => {
          if (!img || token !== img._xFaviconLoadToken) {
            return;
          }
          setFaviconLoadState(img, 'loaded');
        });
      };
      img.addEventListener('load', finalize, { once: true });
      img.src = nextSrc;
      if (img.complete && img.naturalWidth > 0) {
        finalize();
      }
      return true;
    }

    function canReuseCurrentFavicon(img, nextSrc) {
      if (!img || !nextSrc) {
        return false;
      }
      const currentSrc = img.getAttribute('data-favicon-current-src') || img.src || '';
      if (currentSrc !== nextSrc) {
        return false;
      }
      if (
        img.getAttribute('data-fallback-icon') === 'true' ||
        img.getAttribute('data-favicon-placeholder') === 'true'
      ) {
        return false;
      }
      const currentResolved = img.getAttribute('data-favicon-current-src') || '';
      if (currentResolved === nextSrc) {
        return true;
      }
      return Boolean(img.complete && img.naturalWidth > 0);
    }

    function getLastWorkingFaviconSrc(img) {
      if (!img) {
        return '';
      }
      const resolved = img.getAttribute('data-favicon-current-src') || '';
      if (resolved) {
        return resolved;
      }
      if (img.complete && img.naturalWidth > 0) {
        return img.src || '';
      }
      return '';
    }

    function restoreWorkingFaviconOrFail(img, previousSrc, onFailed) {
      const fallbackSrc = String(previousSrc || '').trim();
      if (fallbackSrc) {
        const applied = setFaviconSrcWithAnimation(img, fallbackSrc);
        if (applied || canReuseCurrentFavicon(img, fallbackSrc)) {
          if (!applied) {
            showResolvedFavicon(img);
          }
          return true;
        }
      }
      removeFallbackIconNode(img);
      if (typeof onFailed === 'function') {
        onFailed();
      } else {
        applyFallbackIcon(img);
      }
      return false;
    }

    function createOverlayThemeAwareFaviconState(img, pageUrl, hostKey, fallbackUrl, onFailed) {
      img._xOverlayThemeFaviconSession = (img._xOverlayThemeFaviconSession || 0) + 1;
      const session = img._xOverlayThemeFaviconSession;
      const normalizedHostKey = hostKey || getHostFromUrl(pageUrl);
      const preferredTheme = isOverlayDarkMode() ? 'dark' : 'light';
      const cacheKey = `${String(normalizedHostKey || '')}::${String(pageUrl || '')}::${String(fallbackUrl || '')}::${preferredTheme}`;
      const shouldBypassCachedUrl = normalizeFaviconHost(normalizedHostKey || '') === 'lumno.kubai.design';
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
        faviconHostKey: normalizeFaviconHost(normalizedHostKey || ''),
        fallbackUrl: safeFallbackUrl,
        preferredTheme,
        previousWorkingSrc: getLastWorkingFaviconSrc(img),
        cacheKey,
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
      const themedCandidates = state.preferredTheme === 'dark'
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
      const knownThemedCandidates = getKnownOverlayThemedFaviconCandidates(state.faviconHostKey, state.preferredTheme);

      return {
        localCandidates: dedupeOverlayFaviconCandidateUrls([
          state.safeCachedUrl,
          state.primaryFallbackUrl,
          ...knownThemedCandidates,
          ...themedCandidates,
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
        if (!candidate || candidate === currentSrc || isChromeMonogramFaviconUrl(candidate)) {
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
      const candidatePlan = buildOverlayThemeAwareFaviconCandidatePlan(state);
      const tried = new Set();
      let resolvedCandidates = [];
      let resolvedCandidatesLoaded = !state.pageUrl;

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

      const handleImageError = () => {
        if (!state.isSessionCurrent()) {
          return;
        }
        if (tryNextAvailableCandidate()) {
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
      if (!img || !url) {
        return;
      }
      const cached = faviconDataCache.get(url);
      if (cached) {
        setFaviconSrcWithAnimation(img, cached);
        preloadThemeFromFavicon(url, cached, hostOverride);
        return;
      }
      requestFaviconData(url).then((dataUrl) => {
        if (!dataUrl || !img.isConnected) {
          return;
        }
        setFaviconSrcWithAnimation(img, dataUrl);
        preloadThemeFromFavicon(url, dataUrl, hostOverride);
      });
    }

    function preloadIcon(url) {
      if (!url || url.startsWith('data:') || iconPreloadCache.has(url) || isBlockedLocalFaviconUrl(url)) {
        return;
      }
      const host = getHostFromUrl(url);
      if (host && shouldBlockFaviconForHost(host)) {
        return;
      }
      const img = createImage();
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.src = url;
      iconPreloadCache.set(url, img);
    }

    function warmIconCache(list) {
      if (!Array.isArray(list)) {
        return;
      }
      list.forEach((item) => {
        if (!item) {
          return;
        }
        const skipType = item.type === 'browserPage' ||
          item.type === 'directUrl' ||
          item.type === 'newtab' ||
          item.type === 'googleSuggest';
        if (item.favicon && !skipType) {
          preloadIcon(item.favicon);
          const hostKey = item && item.url ? getHostFromUrl(item.url) : '';
          requestFaviconData(item.favicon).then((dataUrl) => {
            if (dataUrl) {
              preloadThemeFromFavicon(item.favicon, dataUrl, hostKey);
            }
          });
        }
        const hostKeyForTheme = item && item.url ? getHostFromUrl(item.url) : '';
        if (hostKeyForTheme && !hasThemeForHost(hostKeyForTheme)) {
          const siteFavicon = getSiteFaviconUrl(hostKeyForTheme);
          if (siteFavicon) {
            requestFaviconData(siteFavicon).then((dataUrl) => {
              if (dataUrl) {
                preloadThemeFromFavicon(siteFavicon, dataUrl, hostKeyForTheme);
              }
            });
          }
        }
      });
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
