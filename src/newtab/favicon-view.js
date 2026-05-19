(function(global) {
  function noop() {}

  function createFaviconViewRuntime(options) {
    const config = options || {};
    const doc = config.document || global.document;
    const win = config.windowObj || global.window || global;
    const chromeApi = config.chromeApi || global.chrome || {};
    const ImageCtor = win.Image || global.Image;
    const requestFrame = typeof win.requestAnimationFrame === 'function'
      ? win.requestAnimationFrame.bind(win)
      : (callback) => win.setTimeout(callback, 16);
    const setTimer = typeof win.setTimeout === 'function' ? win.setTimeout.bind(win) : setTimeout;
    const clearTimer = typeof win.clearTimeout === 'function' ? win.clearTimeout.bind(win) : clearTimeout;
    const getRiSvg = typeof config.getRiSvg === 'function' ? config.getRiSvg : (() => '');
    const getGoogleFaviconUrl = typeof config.getGoogleFaviconUrl === 'function' ? config.getGoogleFaviconUrl : (() => '');
    const getFaviconIsUrl = typeof config.getFaviconIsUrl === 'function' ? config.getFaviconIsUrl : (() => '');
    const isOwnExtensionUrl = typeof config.isOwnExtensionUrl === 'function' ? config.isOwnExtensionUrl : (() => false);
    const isBlockedLocalFaviconUrl = typeof config.isBlockedLocalFaviconUrl === 'function' ? config.isBlockedLocalFaviconUrl : (() => false);
    const shouldBlockFaviconForHost = typeof config.shouldBlockFaviconForHost === 'function' ? config.shouldBlockFaviconForHost : (() => false);
    const getHostFromUrl = typeof config.getHostFromUrl === 'function' ? config.getHostFromUrl : (() => '');
    const getFaviconPreferredTheme = typeof config.getFaviconPreferredTheme === 'function' ? config.getFaviconPreferredTheme : (() => 'light');
    const getKnownThemedFaviconCandidates = typeof config.getKnownThemedFaviconCandidates === 'function'
      ? config.getKnownThemedFaviconCandidates
      : (() => []);
    const hasThemeTokenInUrl = typeof config.hasThemeTokenInUrl === 'function' ? config.hasThemeTokenInUrl : (() => false);
    const shouldSkipThemeUpgradeCandidate = typeof config.shouldSkipThemeUpgradeCandidate === 'function'
      ? config.shouldSkipThemeUpgradeCandidate
      : (() => false);
    const hostHasExplicitDarkFavicon = typeof config.hostHasExplicitDarkFavicon === 'function'
      ? config.hostHasExplicitDarkFavicon
      : (() => false);
    const isChromeMonogramFaviconUrl = typeof config.isChromeMonogramFaviconUrl === 'function'
      ? config.isChromeMonogramFaviconUrl
      : (() => false);
    const getPersistedFaviconEntry = typeof config.getPersistedFaviconEntry === 'function' ? config.getPersistedFaviconEntry : (() => null);
    const setPersistedFaviconUrl = typeof config.setPersistedFaviconUrl === 'function' ? config.setPersistedFaviconUrl : noop;
    const getPersistedFaviconDataEntry = typeof config.getPersistedFaviconDataEntry === 'function'
      ? config.getPersistedFaviconDataEntry
      : (() => null);
    const setPersistedFaviconData = typeof config.setPersistedFaviconData === 'function' ? config.setPersistedFaviconData : noop;
    const isHostFaviconVisitDirty = typeof config.isHostFaviconVisitDirty === 'function' ? config.isHostFaviconVisitDirty : (() => false);
    const clearHostFaviconVisitDirty = typeof config.clearHostFaviconVisitDirty === 'function' ? config.clearHostFaviconVisitDirty : noop;
    const preloadThemeFromFavicon = typeof config.preloadThemeFromFavicon === 'function' ? config.preloadThemeFromFavicon : noop;
    const faviconDataCache = config.faviconDataCache || new Map();
    const faviconDataPending = config.faviconDataPending || new Map();
    const iconPreloadCache = config.iconPreloadCache || new Map();
    const faviconFallbackNodeMap = config.faviconFallbackNodeMap || new WeakMap();
    const missingIconCache = config.missingIconCache || new Set();
    const faviconRevalidateIntervalMs = Number.isFinite(config.faviconRevalidateIntervalMs)
      ? config.faviconRevalidateIntervalMs
      : (1000 * 60 * 60 * 12);
    const faviconSoftRevalidateDelayMs = Number.isFinite(config.faviconSoftRevalidateDelayMs)
      ? config.faviconSoftRevalidateDelayMs
      : 900;
    let themeFaviconRescueTimer = null;

    function createImage() {
      return typeof ImageCtor === 'function' ? new ImageCtor() : doc.createElement('img');
    }

    function setFallbackNodeVisible(node, visible) {
      if (!node) {
        return;
      }
      node.setAttribute('data-visible', visible ? 'true' : 'false');
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

    function reportMissingIcon(context, url, iconUrl) {
      const key = `${context || 'unknown'}::${url || ''}::${iconUrl || ''}`;
      if (missingIconCache.has(key)) {
        return;
      }
      missingIconCache.add(key);
      const safeContext = String(context || 'unknown');
      const safeUrl = String(url || '');
      const safeIcon = String(iconUrl || '');
      console.warn(`[Lumno] icon missing context=${safeContext} url=${safeUrl} icon=${safeIcon}`);
    }

    function resolveFallbackIconDimension(img, axis, defaultSize) {
      if (!img) {
        return defaultSize;
      }
      const inlineValue = Number.parseFloat(
        axis === 'width'
          ? (img.style && img.style.width ? img.style.width : '')
          : (img.style && img.style.height ? img.style.height : '')
      );
      if (Number.isFinite(inlineValue) && inlineValue > 0) {
        return inlineValue;
      }
      if (typeof win.getComputedStyle === 'function') {
        const computed = win.getComputedStyle(img);
        if (computed) {
          const computedValue = Number.parseFloat(axis === 'width' ? computed.width : computed.height);
          if (Number.isFinite(computedValue) && computedValue > 0) {
            return computedValue;
          }
        }
      }
      const layoutValue = axis === 'width' ? img.clientWidth : img.clientHeight;
      if (Number.isFinite(layoutValue) && layoutValue > 0) {
        return layoutValue;
      }
      return defaultSize;
    }

    function ensureFallbackIconNode(img) {
      if (!img || !img.parentElement) {
        return null;
      }
      const mappedNode = faviconFallbackNodeMap.get(img);
      if (mappedNode && mappedNode.isConnected && mappedNode.parentElement === img.parentElement) {
        return mappedNode;
      }
      const fallbackNodes = Array.from(img.parentElement.querySelectorAll('._x_extension_favicon_fallback_2024_unique_'));
      let node = fallbackNodes.find((candidate) => candidate && candidate._xFallbackForImage === img) || null;
      if (!node) {
        const siblingImages = img.parentElement.querySelectorAll('img');
        if (fallbackNodes.length === 1 && siblingImages.length === 1) {
          node = fallbackNodes[0];
        }
      }
      if (node) {
        node._xFallbackForImage = img;
        faviconFallbackNodeMap.set(img, node);
        return node;
      }
      node = doc.createElement('span');
      const isFolderPreview = !!(img.classList && img.classList.contains('x-nt-folder-preview-favicon'));
      const isBookmarkLeadingIcon = !!(
        img.classList &&
        img.classList.contains('x-nt-bookmark-icon') &&
        img.parentElement &&
        img.parentElement.classList &&
        img.parentElement.classList.contains('x-nt-bookmark-card')
      );
      const isSearchSuggestionIcon = (img.getAttribute('data-x-nt-suggestion-icon') === '1') || Boolean(
        img.closest && img.closest('#_x_extension_newtab_suggestions_container_2024_unique_')
      );
      if (isFolderPreview) {
        node.className = 'x-nt-folder-preview-favicon x-nt-folder-preview-favicon--fallback _x_extension_favicon_fallback_2024_unique_';
        setFallbackNodeVisible(node, true);
        node.innerHTML = getRiSvg('ri-link', 'ri-size-12');
        img.parentElement.insertBefore(node, img);
        node._xFallbackForImage = img;
        faviconFallbackNodeMap.set(img, node);
        return node;
      }
      const defaultDimension = isSearchSuggestionIcon ? 16 : 25;
      const fallbackWidth = resolveFallbackIconDimension(img, 'width', defaultDimension);
      const fallbackHeight = resolveFallbackIconDimension(img, 'height', defaultDimension);
      const fallbackBackground = isBookmarkLeadingIcon
        ? 'var(--x-nt-bookmark-icon-color, var(--x-nt-bookmark-icon-bg, rgba(241, 245, 249, 0.92)))'
        : (isSearchSuggestionIcon ? 'transparent' : 'var(--x-nt-tag-bg, #F3F4F6)');
      node.className = 'x-nt-favicon-fallback _x_extension_favicon_fallback_2024_unique_';
      node.style.setProperty('--x-nt-favicon-fallback-width', `${fallbackWidth}px`);
      node.style.setProperty('--x-nt-favicon-fallback-height', `${fallbackHeight}px`);
      node.style.setProperty('--x-nt-favicon-fallback-radius', `${isSearchSuggestionIcon ? 2 : 6}px`);
      node.style.setProperty('--x-nt-favicon-fallback-bg', fallbackBackground);
      node.style.setProperty(
        '--x-nt-favicon-fallback-color',
        isSearchSuggestionIcon ? 'var(--x-nt-subtext, #6B7280)' : 'var(--x-nt-tag-text, #6B7280)'
      );
      node.style.setProperty('--x-nt-favicon-fallback-padding', `${isSearchSuggestionIcon ? 0 : 3}px`);
      setFallbackNodeVisible(node, true);
      node.innerHTML = getRiSvg('ri-link', 'ri-size-16');
      img.parentElement.insertBefore(node, img.nextSibling);
      node._xFallbackForImage = img;
      faviconFallbackNodeMap.set(img, node);
      return node;
    }

    function findFallbackIconNode(img) {
      if (!img || !img.parentElement) {
        return null;
      }
      const mappedNode = faviconFallbackNodeMap.get(img);
      if (mappedNode && mappedNode.isConnected && mappedNode.parentElement === img.parentElement) {
        return mappedNode;
      }
      const fallbackNodes = Array.from(img.parentElement.querySelectorAll('._x_extension_favicon_fallback_2024_unique_'));
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
      img.style.setProperty('display', 'block');
    }

    function showPendingFallbackIcon(img) {
      if (!img) {
        return;
      }
      const node = ensureFallbackIconNode(img);
      img.removeAttribute('data-fallback-icon');
      img.setAttribute('data-favicon-placeholder', 'true');
      img.style.removeProperty('display');
      if (node) {
        setFallbackNodeVisible(node, true);
        return;
      }
      setTimer(() => {
        if (!img || !img.isConnected) {
          return;
        }
        if (img.getAttribute('data-favicon-placeholder') !== 'true') {
          return;
        }
        const delayedNode = ensureFallbackIconNode(img);
        if (delayedNode) {
          setFallbackNodeVisible(delayedNode, true);
        }
      }, 0);
    }

    function applyFallbackIcon(img) {
      if (!img) {
        return;
      }
      const node = ensureFallbackIconNode(img);
      img.removeAttribute('data-favicon-placeholder');
      img.setAttribute('data-fallback-icon', 'true');
      img.style.removeProperty('display');
      if (node) {
        setFallbackNodeVisible(node, true);
        return;
      }
      setTimer(() => {
        if (!img || !img.isConnected) {
          return;
        }
        if (img.getAttribute('data-fallback-icon') !== 'true') {
          return;
        }
        const delayedNode = ensureFallbackIconNode(img);
        if (delayedNode) {
          setFallbackNodeVisible(delayedNode, true);
        }
      }, 0);
    }

    function refreshFallbackIcons() {
      doc.querySelectorAll('img[data-fallback-icon="true"]').forEach((img) => {
        const node = ensureFallbackIconNode(img);
        if (node) {
          setFallbackNodeVisible(node, true);
        }
        img.setAttribute('data-fallback-icon', 'true');
        img.style.removeProperty('display');
      });
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

    function setFaviconSrcWithAnimation(img, nextSrc, optionsArg) {
      if (!img || !nextSrc || isBlockedLocalFaviconUrl(nextSrc)) {
        return false;
      }
      const shouldPersist = !(optionsArg && optionsArg.persist === false);
      const currentSrc = img.getAttribute('data-favicon-current-src') || '';
      const isFallbackVisible = img.getAttribute('data-fallback-icon') === 'true';
      const isPlaceholderVisible = img.getAttribute('data-favicon-placeholder') === 'true';
      const currentRenderedSrc = String(img.getAttribute('src') || img.src || '');
      const shouldRestartSameSource = (isFallbackVisible || isPlaceholderVisible) &&
        currentRenderedSrc === nextSrc &&
        currentSrc !== nextSrc;
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
        const persistKey = img.getAttribute('data-x-nt-favicon-cache-key') || '';
        if (shouldPersist && persistKey) {
          if (nextSrc.startsWith('data:')) {
            setPersistedFaviconData(persistKey, nextSrc);
          } else {
            setPersistedFaviconUrl(persistKey, nextSrc);
          }
        }
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
      if (shouldRestartSameSource) {
        img.removeAttribute('src');
      }
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
      const isFallback = img.getAttribute('data-fallback-icon') === 'true';
      const isPlaceholder = img.getAttribute('data-favicon-placeholder') === 'true';
      if (isFallback || isPlaceholder) {
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
      const isFallback = img.getAttribute('data-fallback-icon') === 'true';
      if (isFallback) {
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

    function restoreWorkingFaviconOrFallback(img, previousSrc) {
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
      applyFallbackIcon(img);
      return false;
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
        if (hostKeyForTheme && !config.hasThemeForHost(hostKeyForTheme)) {
          const themeIcon = getGoogleFaviconUrl(hostKeyForTheme);
          if (themeIcon) {
            requestFaviconData(themeIcon).then((dataUrl) => {
              if (dataUrl) {
                preloadThemeFromFavicon(themeIcon, dataUrl, hostKeyForTheme);
              }
            });
          }
        }
      });
    }

    function dedupeFaviconCandidateUrls(urls) {
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

    function createThemeAwareFaviconState(img, url, host, optionsArg) {
      const forceRevalidate = Boolean(optionsArg && optionsArg.forceRevalidate);
      img._xThemeFaviconSession = (img._xThemeFaviconSession || 0) + 1;
      const session = img._xThemeFaviconSession;
      const hostKey = host || getHostFromUrl(url);
      const faviconHostKey = config.normalizeFaviconHost(hostKey);
      const isVisitDirty = isHostFaviconVisitDirty(faviconHostKey);
      const shouldBypassPersistedForHost = faviconHostKey === 'lumno.kubai.design';
      const preferredTheme = getFaviconPreferredTheme();
      const knownThemedCandidates = getKnownThemedFaviconCandidates(faviconHostKey, preferredTheme);
      const previousWorkingSrc = getLastWorkingFaviconSrc(img);
      const faviconCacheKey = faviconHostKey ? `${preferredTheme}::${faviconHostKey}` : '';
      const persistedEntry = shouldBypassPersistedForHost ? null : getPersistedFaviconEntry(faviconCacheKey);
      let persistedFavicon = persistedEntry && persistedEntry.url ? persistedEntry.url : '';
      const persistedDataEntry = shouldBypassPersistedForHost ? null : getPersistedFaviconDataEntry(faviconCacheKey);
      let persistedDataUrl = persistedDataEntry && persistedDataEntry.dataUrl ? persistedDataEntry.dataUrl : '';
      if (isChromeMonogramFaviconUrl(persistedFavicon)) {
        persistedFavicon = '';
        persistedDataUrl = '';
      }

      const now = Date.now();
      const persistedDataAge = persistedDataEntry && Number.isFinite(persistedDataEntry.updatedAt)
        ? (now - persistedDataEntry.updatedAt)
        : Number.POSITIVE_INFINITY;
      const persistedThemeMismatch = Boolean(persistedFavicon) &&
        shouldSkipThemeUpgradeCandidate(persistedFavicon, preferredTheme, '');
      const preferredThemeToken = preferredTheme === 'dark' ? 'dark' : (preferredTheme === 'light' ? 'light' : '');
      const knownHasPreferredVariant = Boolean(preferredThemeToken) && knownThemedCandidates.some((candidate) =>
        hasThemeTokenInUrl(candidate, preferredThemeToken)
      );
      const persistedMissingPreferredToken = Boolean(preferredThemeToken) &&
        Boolean(persistedFavicon) &&
        !hasThemeTokenInUrl(persistedFavicon, preferredThemeToken);
      const hasExplicitDarkFavicon = hostHasExplicitDarkFavicon(faviconHostKey);
      const shouldForceThemeRevalidate = persistedThemeMismatch ||
        (preferredTheme === 'dark' && (
          config.isFaviconProxyUrl(persistedFavicon) ||
          (persistedDataUrl && !persistedFavicon)
        )) ||
        (preferredTheme === 'dark' && knownHasPreferredVariant && Boolean(persistedDataUrl)) ||
        (knownHasPreferredVariant && persistedMissingPreferredToken);
      const persistedDataIsStale = Number.isFinite(persistedDataAge) &&
        persistedDataAge > faviconRevalidateIntervalMs;
      let shouldRevalidatePersistedData = forceRevalidate || isVisitDirty ||
        !persistedDataUrl ||
        !Number.isFinite(persistedDataAge) ||
        persistedDataIsStale;
      const persistedAge = persistedEntry && Number.isFinite(persistedEntry.updatedAt)
        ? (now - persistedEntry.updatedAt)
        : Number.POSITIVE_INFINITY;
      const persistedFaviconIsStale = Number.isFinite(persistedAge) &&
        persistedAge > faviconRevalidateIntervalMs;
      let shouldRevalidatePersisted = forceRevalidate || isVisitDirty ||
        !persistedFavicon ||
        !Number.isFinite(persistedAge) ||
        persistedFaviconIsStale;
      if (shouldForceThemeRevalidate) {
        shouldRevalidatePersistedData = true;
        shouldRevalidatePersisted = true;
      }
      if (preferredTheme === 'dark' && hasExplicitDarkFavicon) {
        persistedDataUrl = '';
      }

      return {
        url: String(url || ''),
        hostKey: String(hostKey || ''),
        faviconHostKey: String(faviconHostKey || ''),
        preferredTheme,
        knownThemedCandidates,
        previousWorkingSrc,
        faviconCacheKey,
        persistedFavicon,
        persistedDataUrl,
        isVisitDirty,
        shouldRevalidatePersisted,
        shouldRevalidatePersistedData,
        persistedDataIsStale,
        persistedFaviconIsStale,
        hasExplicitDarkFavicon,
        shouldPreferDarkTokenUpgrades: preferredTheme === 'dark' &&
          (knownHasPreferredVariant || hasExplicitDarkFavicon),
        googleFavicon: faviconHostKey ? getGoogleFaviconUrl(faviconHostKey) : '',
        faviconIsFavicon: faviconHostKey ? getFaviconIsUrl(faviconHostKey) : '',
        isSessionCurrent() {
          return Boolean(img && img._xThemeFaviconSession === session);
        },
        isSessionMounted() {
          return Boolean(img && img.isConnected && img._xThemeFaviconSession === session);
        }
      };
    }

    function syncThemeAwareFaviconAttributes(img, state) {
      img.setAttribute('data-x-nt-theme-favicon', '1');
      img.setAttribute('data-x-nt-favicon-page-url', state.url);
      img.setAttribute('data-x-nt-favicon-host', state.hostKey);
      if (state.faviconCacheKey) {
        img.setAttribute('data-x-nt-favicon-cache-key', state.faviconCacheKey);
      } else {
        img.removeAttribute('data-x-nt-favicon-cache-key');
      }
    }

    function primePersistedThemeAwareFaviconData(img, state) {
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
      return applied || reused;
    }

    function buildThemeAwareFaviconCandidatePlan(state) {
      const siteSvgFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon.svg` : '';
      const siteDarkSvgFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon-dark.svg` : '';
      const siteLightSvgFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon-light.svg` : '';
      const siteIcoFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon.ico` : '';
      const rootThemedCandidates = state.preferredTheme === 'dark'
        ? [
          siteDarkSvgFavicon,
          siteSvgFavicon,
          siteIcoFavicon,
          siteLightSvgFavicon
        ]
        : [
          siteLightSvgFavicon,
          siteSvgFavicon,
          siteIcoFavicon,
          siteDarkSvgFavicon
        ];
      const knownThemedCandidates = dedupeFaviconCandidateUrls(state.knownThemedCandidates);
      const genericRootCandidates = dedupeFaviconCandidateUrls(rootThemedCandidates);
      const persistedProxyFavicon = config.isFaviconProxyUrl(state.persistedFavicon) ? state.persistedFavicon : '';
      const persistedSiteFavicon = persistedProxyFavicon ? '' : state.persistedFavicon;
      const shouldPreferPersistedSiteFavicon = Boolean(persistedSiteFavicon) &&
        !state.shouldPreferDarkTokenUpgrades &&
        !shouldSkipThemeUpgradeCandidate(persistedSiteFavicon, state.preferredTheme, '');
      const primaryCandidates = state.shouldPreferDarkTokenUpgrades
        ? [
          ...knownThemedCandidates,
          ...genericRootCandidates,
          persistedSiteFavicon,
          state.googleFavicon
        ]
        : (shouldPreferPersistedSiteFavicon
          ? [
            persistedSiteFavicon,
            ...knownThemedCandidates,
            state.googleFavicon,
            ...genericRootCandidates
          ]
          : [
            ...knownThemedCandidates,
            state.googleFavicon,
            persistedProxyFavicon,
            persistedSiteFavicon,
            ...genericRootCandidates
          ]);

      return {
        localCandidates: dedupeFaviconCandidateUrls([
          ...primaryCandidates,
          persistedProxyFavicon,
          state.faviconIsFavicon
        ])
      };
    }

    function tryApplyThemeAwareFaviconCandidate(img, state, tried, nextSrc) {
      if (!nextSrc || !img || !state.isSessionCurrent()) {
        return false;
      }
      if (tried.has(nextSrc)) {
        return false;
      }
      tried.add(nextSrc);

      const shouldPersist = !(
        (state.persistedFavicon && nextSrc === state.persistedFavicon) ||
        isChromeMonogramFaviconUrl(nextSrc) ||
        config.isFaviconProxyUrl(nextSrc)
      );
      const applied = setFaviconSrcWithAnimation(img, nextSrc, { persist: shouldPersist });
      const reused = !applied && canReuseCurrentFavicon(img, nextSrc);
      if (!applied && !reused) {
        return false;
      }
      if (reused) {
        showResolvedFavicon(img);
      }

      const shouldKeepTokenizedSource = state.preferredTheme === 'dark' &&
        state.hasExplicitDarkFavicon &&
        hasThemeTokenInUrl(nextSrc, 'dark');
      if (
        !nextSrc.startsWith('data:') &&
        !isChromeMonogramFaviconUrl(nextSrc) &&
        !shouldKeepTokenizedSource
      ) {
        attachFaviconData(img, nextSrc, state.hostKey);
      }
      return true;
    }

    function scheduleSoftThemeAwareFaviconRevalidate(img, state, optionsArg) {
      if (!img || !state || !state.url) {
        return;
      }
      setTimer(() => {
        if (!state.isSessionMounted()) {
          return;
        }
        attachFaviconWithFallbacks(img, state.url, state.hostKey, {
          ...(optionsArg || {}),
          forceRevalidate: true,
          skipPersistedDataPrime: true,
          deferRevalidate: false
        });
      }, faviconSoftRevalidateDelayMs);
    }

    function requestResolvedThemeAwareFaviconCandidates(state, optionsArg) {
      return new Promise((resolve) => {
        if (!chromeApi.runtime || typeof chromeApi.runtime.sendMessage !== 'function') {
          resolve([]);
          return;
        }
        chromeApi.runtime.sendMessage(
          {
            action: 'resolveFaviconCandidates',
            url: state.url,
            host: state.hostKey,
            fallbackUrl: '',
            preferredTheme: state.preferredTheme,
            forceFresh: Boolean(
              (optionsArg && optionsArg.forceFreshResolvedCandidates) ||
              state.isVisitDirty ||
              state.persistedDataIsStale ||
              state.persistedFaviconIsStale
            )
          },
          (response) => {
            const resolved = response && Array.isArray(response.urls) ? response.urls : [];
            resolve(dedupeFaviconCandidateUrls(resolved));
          }
        );
      });
    }

    function tryUpgradeThemeAwareFaviconCandidates(img, state, candidateUrls) {
      const currentSrc = img && img.src ? String(img.src) : '';
      const upgrades = dedupeFaviconCandidateUrls(candidateUrls).filter((candidate) => {
        if (!candidate || candidate === currentSrc) {
          return false;
        }
        if (isChromeMonogramFaviconUrl(candidate)) {
          return false;
        }
        if (state.shouldPreferDarkTokenUpgrades && !hasThemeTokenInUrl(candidate, 'dark')) {
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

      const loadNext = (index) => {
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
          const isProxyCandidate = config.isFaviconProxyUrl(candidate);
          setFaviconSrcWithAnimation(img, candidate, { persist: !isProxyCandidate });
          if (!isProxyCandidate && !candidate.startsWith('data:')) {
            attachFaviconData(img, candidate, state.hostKey);
          }
        };
        probe.onerror = () => {
          loadNext(index + 1);
        };
        probe.src = candidate;
      };

      loadNext(0);
    }

    function finalizeThemeAwareFaviconFailure(img, state, iconUrl) {
      reportMissingIcon('favicon', state.url, iconUrl || '');
      restoreWorkingFaviconOrFallback(img, state.previousWorkingSrc);
      scheduleThemeAwareFaviconRescue();
    }

    function attachFaviconWithFallbacks(img, url, host, optionsArg) {
      if (!img || !url) {
        return;
      }
      if (isOwnExtensionUrl(url) && chromeApi.runtime && typeof chromeApi.runtime.getURL === 'function') {
        const ownIconUrl = chromeApi.runtime.getURL('assets/images/lumno.png');
        setFaviconSrcWithAnimation(img, ownIconUrl, { persist: false });
        return;
      }
      const state = createThemeAwareFaviconState(img, url, host, optionsArg);
      if (shouldBlockFaviconForHost(state.hostKey)) {
        applyFallbackIcon(img);
        return;
      }
      syncThemeAwareFaviconAttributes(img, state);
      const shouldSkipPersistedDataPrime = Boolean(optionsArg && optionsArg.skipPersistedDataPrime);
      const persistedDataApplied = shouldSkipPersistedDataPrime
        ? false
        : primePersistedThemeAwareFaviconData(img, state);
      const shouldContinueAfterPersistedData = state.shouldRevalidatePersistedData || state.shouldRevalidatePersisted;
      if (persistedDataApplied && !shouldContinueAfterPersistedData) {
        return;
      }
      if (persistedDataApplied && (!optionsArg || optionsArg.deferRevalidate !== false)) {
        scheduleSoftThemeAwareFaviconRevalidate(img, state, optionsArg);
        return;
      }

      const candidatePlan = buildThemeAwareFaviconCandidatePlan(state);
      const tried = new Set();
      const keepCurrentUntilReady = Boolean(state.previousWorkingSrc);
      const shouldRequestResolvedCandidates = state.shouldRevalidatePersisted || !state.persistedFavicon;
      let resolvedCandidates = [];
      let resolvedCandidatesLoaded = !shouldRequestResolvedCandidates;

      if (img._xThemeFaviconErrorHandler) {
        img.removeEventListener('error', img._xThemeFaviconErrorHandler);
        img._xThemeFaviconErrorHandler = null;
      }

      const tryNextAvailableCandidate = () => {
        const candidatePool = dedupeFaviconCandidateUrls([
          ...candidatePlan.localCandidates,
          ...resolvedCandidates
        ]);
        for (let i = 0; i < candidatePool.length; i += 1) {
          if (tryApplyThemeAwareFaviconCandidate(img, state, tried, candidatePool[i])) {
            return true;
          }
        }
        return false;
      };

      const finalizeFailure = (iconUrl) => {
        finalizeThemeAwareFaviconFailure(
          img,
          state,
          iconUrl || (img ? (img.getAttribute('data-favicon-current-src') || img.src || '') : '')
        );
      };

      const handleImageError = function() {
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
        finalizeFailure();
      };

      img._xThemeFaviconErrorHandler = handleImageError;
      img.addEventListener('error', handleImageError);

      let appliedInitial = keepCurrentUntilReady;
      if (!keepCurrentUntilReady) {
        appliedInitial = tryNextAvailableCandidate();
      }
      if (!appliedInitial) {
        if (shouldRequestResolvedCandidates) {
          showPendingFallbackIcon(img);
        } else {
          applyFallbackIcon(img);
        }
        if (!shouldRequestResolvedCandidates) {
          finalizeFailure('');
        }
      }
      if (!shouldRequestResolvedCandidates) {
        return;
      }

      requestResolvedThemeAwareFaviconCandidates(state, optionsArg)
        .then((resolved) => {
          if (!state.isSessionCurrent()) {
            return;
          }
          if (state.isVisitDirty) {
            clearHostFaviconVisitDirty(state.faviconHostKey);
          }
          resolvedCandidates = resolved;
          resolvedCandidatesLoaded = true;

          if (
            !appliedInitial ||
            img.getAttribute('data-fallback-icon') === 'true' ||
            img.getAttribute('data-favicon-placeholder') === 'true'
          ) {
            if (!tryNextAvailableCandidate()) {
              finalizeFailure('');
            }
            return;
          }

          tryUpgradeThemeAwareFaviconCandidates(img, state, [
            ...resolvedCandidates,
            ...candidatePlan.localCandidates
          ]);
        })
        .catch(() => {
          resolvedCandidatesLoaded = true;
          if (!state.isSessionCurrent()) {
            return;
          }
          if (
            img.getAttribute('data-fallback-icon') === 'true' ||
            img.getAttribute('data-favicon-placeholder') === 'true'
          ) {
            finalizeFailure('');
          }
        });
    }

    function refreshThemeAwareFavicons() {
      doc.querySelectorAll('img[data-x-nt-theme-favicon="1"]').forEach((img) => {
        if (!img || !img.isConnected) {
          return;
        }
        const pageUrl = img.getAttribute('data-x-nt-favicon-page-url') || '';
        if (!pageUrl) {
          return;
        }
        const host = img.getAttribute('data-x-nt-favicon-host') || '';
        attachFaviconWithFallbacks(img, pageUrl, host, { forceRevalidate: true });
      });
    }

    function rescueThemeAwareFallbackFavicons() {
      doc.querySelectorAll(
        'img[data-x-nt-theme-favicon="1"][data-fallback-icon="true"], ' +
        'img[data-x-nt-theme-favicon="1"][data-favicon-placeholder="true"]'
      ).forEach((img) => {
        if (!img || !img.isConnected) {
          return;
        }
        const pageUrl = img.getAttribute('data-x-nt-favicon-page-url') || '';
        if (!pageUrl) {
          return;
        }
        const host = img.getAttribute('data-x-nt-favicon-host') || '';
        attachFaviconWithFallbacks(img, pageUrl, host, {
          forceRevalidate: true,
          forceFreshResolvedCandidates: true,
          skipPersistedDataPrime: true,
          deferRevalidate: false
        });
      });
    }

    function scheduleThemeAwareFaviconRescue() {
      if (themeFaviconRescueTimer !== null) {
        clearTimer(themeFaviconRescueTimer);
        themeFaviconRescueTimer = null;
      }
      themeFaviconRescueTimer = setTimer(() => {
        themeFaviconRescueTimer = null;
        rescueThemeAwareFallbackFavicons();
        setTimer(() => {
          rescueThemeAwareFallbackFavicons();
        }, 900);
      }, 700);
    }

    return {
      applyFaviconOpticalShift,
      applyFaviconOpticalAlignment,
      reportMissingIcon,
      applyFallbackIcon,
      refreshFallbackIcons,
      requestFaviconData,
      setFaviconSrcWithAnimation,
      attachFaviconData,
      preloadIcon,
      warmIconCache,
      attachFaviconWithFallbacks,
      refreshThemeAwareFavicons,
      rescueThemeAwareFallbackFavicons,
      scheduleThemeAwareFaviconRescue
    };
  }

  global.LumnoNewtabFaviconView = {
    createFaviconViewRuntime
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
