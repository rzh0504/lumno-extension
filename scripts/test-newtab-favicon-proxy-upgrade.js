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
    },
    dispatchEvent(type) {
      const set = listeners.get(type);
      if (!set) {
        return;
      }
      Array.from(set).forEach((listener) => listener());
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
  createFaviconViewCore(options) {
    const config = options || {};
    return {
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
      getLastWorkingFaviconSrc() {
        return '';
      },
      restoreWorkingFaviconOrFallback() {
        return false;
      },
      attachFaviconData() {},
      preloadIcon() {},
      warmIconCache() {},
      detectDefaultExtensionFavicon(img, url) {
        return typeof config.detectDefaultExtensionFavicon === 'function'
          ? config.detectDefaultExtensionFavicon(img, url)
          : Promise.resolve(false);
      }
    };
  }
};

vm.runInNewContext(fs.readFileSync('src/newtab/favicon-view.js', 'utf8'), sandbox, {
  filename: 'src/newtab/favicon-view.js'
});

const pageUrl = 'https://m2.futurecomm.cn/#/center';
const primaryUrl = 'https://m2.futurecomm.cn/favicon.ico';
const extensionUrl = `chrome-extension://abc/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=128`;
const gstaticUrl = `https://t2.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE%2CSIZE%2CURL&url=${encodeURIComponent(pageUrl)}&size=128`;

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
      getURL(path) {
        return `chrome-extension://abc${path}`;
      }
    }
  },
  getRiSvg() {
    return '';
  },
  getExtensionFaviconUrl() {
    return extensionUrl;
  },
  getGstaticFaviconUrl() {
    return gstaticUrl;
  },
  getHostFromUrl(url) {
    return new URL(url).hostname;
  },
  isFaviconProxyUrl(url) {
    return /_favicon\/|gstatic\.cn\/faviconV2/i.test(String(url || ''));
  },
  shouldBlockFaviconForHost() {
    return false;
  },
  isBlockedLocalFaviconUrl() {
    return false;
  },
  detectDefaultExtensionFavicon(_img, url) {
    return Promise.resolve(url === extensionUrl);
  },
  preloadThemeFromFavicon() {},
  faviconCandidateLoadTimeoutMs: 1000
});

(async () => {
  const img = createFakeImage();
  runtime.attachFaviconWithFallbacks(img, pageUrl, 'futurecomm.cn', {
    primaryUrl
  });
  assert.strictEqual(img.src, primaryUrl);

  img._xThemeFaviconErrorHandler();
  assert.strictEqual(img.src, extensionUrl);

  img.dispatchEvent('load');
  await wait(4);
  assert.strictEqual(img.src, gstaticUrl);
  assert.strictEqual(/google\.com\/s2\/favicons|favicon\.is\//i.test(img.src), false);
  console.log('newtab favicon candidate order tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
