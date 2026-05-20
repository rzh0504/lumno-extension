(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoFaviconViewCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  function noop() {}

  function createFaviconViewCore(options) {
    const config = options || {};
    const doc = config.document || (root && root.document) || null;
    const win = config.windowObj || (root && root.window) || root || {};
    const chromeApi = config.chromeApi || (root && root.chrome) || {};
    const ImageCtor = win.Image || (root && root.Image) || null;
    const requestFrame = typeof win.requestAnimationFrame === 'function'
      ? win.requestAnimationFrame.bind(win)
      : (callback) => win.setTimeout(callback, 16);
    const getHostFromUrl = typeof config.getHostFromUrl === 'function' ? config.getHostFromUrl : (() => '');
    const shouldBlockFaviconForHost = typeof config.shouldBlockFaviconForHost === 'function'
      ? config.shouldBlockFaviconForHost
      : (() => false);
    const isBlockedLocalFaviconUrl = typeof config.isBlockedLocalFaviconUrl === 'function'
      ? config.isBlockedLocalFaviconUrl
      : (() => false);
    const showResolvedFavicon = typeof config.showResolvedFavicon === 'function' ? config.showResolvedFavicon : noop;
    const showPendingFallbackIcon = typeof config.showPendingFallbackIcon === 'function' ? config.showPendingFallbackIcon : noop;
    const getPersistCacheKey = typeof config.getPersistCacheKey === 'function' ? config.getPersistCacheKey : (() => '');
    const setPersistedFaviconUrl = typeof config.setPersistedFaviconUrl === 'function' ? config.setPersistedFaviconUrl : noop;
    const setPersistedFaviconData = typeof config.setPersistedFaviconData === 'function' ? config.setPersistedFaviconData : noop;
    const shouldPersistFaviconUrl = typeof config.shouldPersistFaviconUrl === 'function'
      ? config.shouldPersistFaviconUrl
      : (() => true);
    const preloadThemeFromFavicon = typeof config.preloadThemeFromFavicon === 'function' ? config.preloadThemeFromFavicon : noop;
    const getThemeFaviconUrl = typeof config.getThemeFaviconUrl === 'function' ? config.getThemeFaviconUrl : (() => '');
    const hasThemeForHost = typeof config.hasThemeForHost === 'function' ? config.hasThemeForHost : (() => false);
    const faviconDataCache = config.faviconDataCache || new Map();
    const faviconDataPending = config.faviconDataPending || new Map();
    const iconPreloadCache = config.iconPreloadCache || new Map();
    const ignoreLastWorkingWhenFallback = Boolean(config.ignoreLastWorkingWhenFallback);

    function createImage() {
      return typeof ImageCtor === 'function'
        ? new ImageCtor()
        : (doc && typeof doc.createElement === 'function' ? doc.createElement('img') : {});
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
      if (!img || !doc) {
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
        const persistKey = getPersistCacheKey(img);
        if (shouldPersist && persistKey) {
          if (nextSrc.startsWith('data:')) {
            setPersistedFaviconData(persistKey, nextSrc);
          } else if (shouldPersistFaviconUrl(nextSrc, img)) {
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
      if (ignoreLastWorkingWhenFallback && img.getAttribute('data-fallback-icon') === 'true') {
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

    function restoreWorkingFaviconOrFallback(img, previousSrc, restoreOptions) {
      const fallbackSrc = String(previousSrc || '').trim();
      const optionsForRestore = restoreOptions || {};
      if (fallbackSrc) {
        const applied = setFaviconSrcWithAnimation(img, fallbackSrc);
        if (applied || canReuseCurrentFavicon(img, fallbackSrc)) {
          if (!applied) {
            showResolvedFavicon(img);
          }
          return true;
        }
      }
      if (typeof optionsForRestore.removeFallbackNode === 'function') {
        optionsForRestore.removeFallbackNode(img);
      }
      if (typeof optionsForRestore.onFailed === 'function') {
        optionsForRestore.onFailed();
      } else if (typeof optionsForRestore.applyFallbackIcon === 'function') {
        optionsForRestore.applyFallbackIcon(img);
      }
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
        if (hostKeyForTheme && !hasThemeForHost(hostKeyForTheme)) {
          const themeIcon = getThemeFaviconUrl(hostKeyForTheme, item);
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

    return Object.freeze({
      createImage,
      setFallbackNodeVisible,
      setFaviconLoadState,
      applyFaviconOpticalShift,
      applyFaviconOpticalAlignment,
      requestFaviconData,
      setFaviconSrcWithAnimation,
      canReuseCurrentFavicon,
      getLastWorkingFaviconSrc,
      restoreWorkingFaviconOrFallback,
      attachFaviconData,
      preloadIcon,
      warmIconCache,
      dedupeFaviconCandidateUrls
    });
  }

  return Object.freeze({
    createFaviconViewCore
  });
});
