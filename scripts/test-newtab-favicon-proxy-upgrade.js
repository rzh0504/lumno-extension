const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createFakeImage() {
  const attributes = new Map();
  return {
    src: '',
    complete: true,
    naturalWidth: 16,
    naturalHeight: 16,
    isConnected: true,
    style: {
      setProperty() {},
      removeProperty() {}
    },
    classList: {
      contains() {
        return false;
      }
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    addEventListener() {},
    removeEventListener() {}
  };
}

function createProbeImage() {
  let onloadHandler = null;
  return {
    referrerPolicy: '',
    set onload(handler) {
      onloadHandler = handler;
    },
    get onload() {
      return onloadHandler;
    },
    set onerror(handler) {
      this._onerror = handler;
    },
    get onerror() {
      return this._onerror;
    },
    set src(value) {
      this._src = String(value || '');
      if (onloadHandler) {
        onloadHandler();
      }
    },
    get src() {
      return this._src || '';
    }
  };
}

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  URL
};
sandbox.globalThis = sandbox;
sandbox.LumnoFaviconViewCore = {
  createFaviconViewCore() {
    return {
      createImage() {
        return createProbeImage();
      },
      setFallbackNodeVisible() {},
      setFaviconLoadState() {},
      applyFaviconOpticalShift() {},
      applyFaviconOpticalAlignment() {},
      requestFaviconData() {
        return Promise.resolve(null);
      },
      setFaviconSrcWithAnimation(img, nextSrc) {
        img._xFaviconLoadToken = (img._xFaviconLoadToken || 0) + 1;
        img.src = nextSrc;
        img.setAttribute('data-favicon-current-src', nextSrc);
        img.removeAttribute('data-fallback-icon');
        img.removeAttribute('data-favicon-placeholder');
        return true;
      },
      canReuseCurrentFavicon() {
        return false;
      },
      getLastWorkingFaviconSrc(img) {
        return (img && (img.getAttribute('data-favicon-current-src') || img.src)) || '';
      },
      restoreWorkingFaviconOrFallback() {
        return false;
      },
      attachFaviconData() {},
      preloadIcon() {},
      warmIconCache() {},
      dedupeFaviconCandidateUrls(urls) {
        const seen = new Set();
        return (urls || []).filter((url) => {
          if (!url || seen.has(url)) {
            return false;
          }
          seen.add(url);
          return true;
        });
      }
    };
  }
};

vm.runInNewContext(fs.readFileSync('src/newtab/favicon-view.js', 'utf8'), sandbox, {
  filename: 'src/newtab/favicon-view.js'
});

const realDataUrl = 'data:image/png;base64,cmVhbC1mdXR1cmVjb21tLWljb24=';
const googleFallbackUrl = 'https://www.google.com/s2/favicons?domain=futurecomm.cn&sz=128';

const runtime = sandbox.LumnoNewtabFaviconView.createFaviconViewRuntime({
  document: {
    querySelectorAll() {
      return [];
    }
  },
  windowObj: {
    setTimeout,
    clearTimeout,
    requestAnimationFrame(callback) {
      return setTimeout(callback, 0);
    }
  },
  chromeApi: {
    runtime: {
      sendMessage(message, callback) {
        if (message && message.action === 'resolveFaviconCandidates') {
          callback({ urls: [] });
        }
      }
    }
  },
  getRiSvg() {
    return '';
  },
  getGoogleFaviconUrl() {
    return googleFallbackUrl;
  },
  getFaviconIsUrl() {
    return 'https://favicon.is/futurecomm.cn';
  },
  getHostFromUrl(url) {
    return new URL(url).hostname;
  },
  normalizeFaviconHost(host) {
    return String(host || '').toLowerCase();
  },
  getFaviconPreferredTheme() {
    return 'light';
  },
  getKnownThemedFaviconCandidates() {
    return [];
  },
  getRootFaviconCandidates() {
    return [];
  },
  isFaviconProxyUrl(url) {
    return /google\.com\/s2\/favicons|favicon\.is\//i.test(String(url || ''));
  },
  shouldBlockFaviconForHost() {
    return false;
  },
  isBlockedLocalFaviconUrl() {
    return false;
  },
  hasThemeTokenInUrl() {
    return false;
  },
  shouldSkipThemeUpgradeCandidate() {
    return false;
  },
  hostHasExplicitDarkFavicon() {
    return false;
  },
  isChromeMonogramFaviconUrl() {
    return false;
  },
  getPersistedFaviconEntry() {
    return null;
  },
  getPersistedFaviconDataEntry() {
    return {
      dataUrl: realDataUrl,
      updatedAt: Date.now()
    };
  },
  isHostFaviconVisitDirty() {
    return false;
  },
  clearHostFaviconVisitDirty() {},
  preloadThemeFromFavicon() {},
  faviconSoftRevalidateDelayMs: 0
});

(async () => {
  const img = createFakeImage();
  runtime.attachFaviconWithFallbacks(img, 'https://m2.futurecomm.cn/#/center', 'futurecomm.cn');
  assert.strictEqual(img.src, realDataUrl);

  await wait(10);

  assert.notStrictEqual(
    img.src,
    googleFallbackUrl,
    'proxy favicon fallbacks must not replace an already rendered favicon during revalidation'
  );
  assert.strictEqual(/google\.com\/s2\/favicons|favicon\.is\//i.test(img.src), false);
  console.log('newtab favicon proxy upgrade tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
