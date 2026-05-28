const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createFakeImage() {
  const attributes = new Map();
  const listeners = new Map();
  return {
    src: '',
    complete: false,
    naturalWidth: 0,
    naturalHeight: 0,
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
    addEventListener(type, listener) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      const set = listeners.get(type);
      if (set) {
        set.delete(listener);
      }
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
        return createFakeImage();
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
        return true;
      },
      canReuseCurrentFavicon() {
        return false;
      },
      getLastWorkingFaviconSrc() {
        return '';
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
    return 'https://www.google.com/s2/favicons?domain=example.test&sz=128';
  },
  getFaviconIsUrl() {
    return '';
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
    return ['https://slow.example.test/favicon.svg'];
  },
  getRootFaviconCandidates() {
    return ['https://example.test/favicon.ico'];
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
    return null;
  },
  isHostFaviconVisitDirty() {
    return false;
  },
  clearHostFaviconVisitDirty() {},
  preloadThemeFromFavicon() {},
  faviconCandidateLoadTimeoutMs: 12
});

(async () => {
  const img = createFakeImage();
  runtime.attachFaviconWithFallbacks(img, 'https://example.test/page', 'example.test');
  assert.strictEqual(img.src, 'https://slow.example.test/favicon.svg');
  await wait(18);
  assert.strictEqual(img.src, 'https://example.test/favicon.ico');
  img._xThemeFaviconSession += 1;
  await wait(20);
  console.log('newtab favicon view timeout ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
