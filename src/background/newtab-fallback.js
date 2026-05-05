(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoBackgroundNewtabFallback = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function getChromeApi() {
    return typeof chrome !== 'undefined' ? chrome : null;
  }

  function isLocalFileLikeTargetUrl(url) {
    if (!url) {
      return false;
    }
    try {
      const parsed = new URL(url);
      const protocol = String(parsed.protocol || '').toLowerCase();
      if (protocol === 'file:') {
        return true;
      }
      const pathname = String(parsed.pathname || '').toLowerCase();
      if (pathname.endsWith('.pdf') || pathname.endsWith('.htm') || pathname.endsWith('.html')) {
        return true;
      }
      const srcParam = parsed.searchParams ? parsed.searchParams.get('src') : '';
      if (srcParam) {
        try {
          const nested = new URL(srcParam);
          const nestedProtocol = String(nested.protocol || '').toLowerCase();
          const nestedPath = String(nested.pathname || '').toLowerCase();
          if (nestedProtocol === 'file:' ||
            nestedPath.endsWith('.pdf') ||
            nestedPath.endsWith('.htm') ||
            nestedPath.endsWith('.html')) {
            return true;
          }
        } catch (e) {
          const lowerSrc = String(srcParam).toLowerCase();
          if (lowerSrc.startsWith('file://') ||
            lowerSrc.includes('.pdf') ||
            lowerSrc.includes('.htm') ||
            lowerSrc.includes('.html')) {
            return true;
          }
        }
      }
    } catch (e) {
      const lower = String(url).toLowerCase();
      return lower.startsWith('file://') ||
        lower.includes('.pdf') ||
        lower.includes('.htm') ||
        lower.includes('.html');
    }
    return false;
  }

  function checkFileSchemeAccess(callback) {
    const chromeApi = getChromeApi();
    const done = typeof callback === 'function' ? callback : () => {};
    if (!chromeApi || !chromeApi.extension || typeof chromeApi.extension.isAllowedFileSchemeAccess !== 'function') {
      done(null);
      return;
    }
    try {
      chromeApi.extension.isAllowedFileSchemeAccess((isAllowed) => {
        if (chromeApi.runtime && chromeApi.runtime.lastError) {
          done(null);
          return;
        }
        done(Boolean(isAllowed));
      });
    } catch (e) {
      done(null);
    }
  }

  function buildNewtabFallbackUrl(options) {
    const chromeApi = getChromeApi();
    const baseUrl = chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getURL === 'function'
      ? chromeApi.runtime.getURL('src/newtab/newtab.html')
      : 'src/newtab/newtab.html';
    const newtabUrl = new URL(baseUrl, 'chrome-extension://lumno/');
    newtabUrl.searchParams.set('focus', '1');
    if (options && options.notice === 'file-access') {
      newtabUrl.searchParams.set('notice', 'file-access');
    }
    return newtabUrl.toString();
  }

  function openNewtabFallback(options) {
    const chromeApi = getChromeApi();
    const newtabUrl = buildNewtabFallbackUrl(options);
    if (chromeApi && chromeApi.tabs && typeof chromeApi.tabs.create === 'function') {
      chromeApi.tabs.create({ url: newtabUrl });
    }
  }

  function openNewtabFallbackForUrl(url) {
    if (!isLocalFileLikeTargetUrl(url)) {
      openNewtabFallback();
      return;
    }
    checkFileSchemeAccess((isAllowed) => {
      if (isAllowed === false) {
        openNewtabFallback({ notice: 'file-access' });
        return;
      }
      openNewtabFallback();
    });
  }

  return Object.freeze({
    buildNewtabFallbackUrl,
    checkFileSchemeAccess,
    isLocalFileLikeTargetUrl,
    openNewtabFallback,
    openNewtabFallbackForUrl
  });
});
