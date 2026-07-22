const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

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
    parentElement: null,
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createRuntime(options) {
  const config = options || {};
  const preloadedUrls = [];
  const attachedDataUrls = [];
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    URL
  };
  sandbox.globalThis = sandbox;
  sandbox.LumnoFaviconViewCore = {
    createFaviconViewCore(config) {
      return {
        setFallbackNodeVisible() {},
        setFaviconLoadState() {},
        applyFaviconOpticalShift() {},
        applyFaviconOpticalAlignment(img) {
          img.setAttribute('width', '128');
          img.setAttribute('height', '128');
        },
        requestFaviconData() {
          return typeof config.requestFaviconData === 'function'
            ? config.requestFaviconData.apply(null, arguments)
            : Promise.resolve(null);
        },
        setFaviconSrcWithAnimation(img, nextSrc, optionsArg) {
          if (config.isBlockedLocalFaviconUrl(nextSrc)) {
            return false;
          }
          img.src = nextSrc;
          img.setAttribute('data-favicon-current-src', nextSrc);
          if (String(nextSrc || '').startsWith('data:') && optionsArg && optionsArg.sourceUrl) {
            img.setAttribute('data-favicon-data-source', optionsArg.sourceUrl);
          } else {
            img.removeAttribute('data-favicon-data-source');
          }
          return true;
        },
        canReuseCurrentFavicon() {
          return false;
        },
        getLastWorkingFaviconSrc() {
          return '';
        },
        restoreWorkingFaviconOrFallback(img, previousSrc, options) {
          if (previousSrc) {
            img.src = previousSrc;
            img.setAttribute('data-favicon-current-src', previousSrc);
            return true;
          }
          if (options && typeof options.onFailed === 'function') {
            options.onFailed();
          }
          return false;
        },
        attachFaviconData(_img, url) {
          attachedDataUrls.push(url);
        },
        preloadIcon(url) {
          preloadedUrls.push(url);
        },
        warmIconCache() {},
        detectDefaultExtensionFavicon() {
          return Promise.resolve(false);
        }
      };
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'src/shared/favicon-utils.js'), 'utf8'), sandbox, {
    filename: 'src/shared/favicon-utils.js'
  });
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'src/overlay/favicon-view.js'), 'utf8'), sandbox, {
    filename: 'src/overlay/favicon-view.js'
  });

  const localPageUrl = 'http://127.0.0.1:4321/';
  const extensionUrl = `chrome-extension://abc/_favicon/?pageUrl=${encodeURIComponent(localPageUrl)}&size=128`;
  const gstaticUrl = `https://t2.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE%2CSIZE%2CURL&url=${encodeURIComponent(localPageUrl)}&size=128`;
  const browserPageUrl = 'chrome://extensions/';
  const browserPageExtensionUrl = `chrome-extension://abc/_favicon/?pageUrl=${encodeURIComponent(browserPageUrl)}&size=128`;
  const browserPageFavicon2Url = `chrome://favicon2/?pageUrl=${encodeURIComponent(browserPageUrl)}&size=128`;
  const vpnPageUrl = 'https://foo.example.com/';
  const vpnDirectFaviconUrl = 'https://foo.example.com/favicon.ico';
  const vpnExtensionUrl = `chrome-extension://abc/_favicon/?pageUrl=${encodeURIComponent(vpnPageUrl)}&size=128`;
  const vpnGstaticUrl = `https://t2.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE%2CSIZE%2CURL&url=${encodeURIComponent(vpnPageUrl)}&size=128`;

  return {
    localPageUrl,
    extensionUrl,
    browserPageUrl,
    browserPageExtensionUrl,
    browserPageFavicon2Url,
    vpnPageUrl,
    vpnDirectFaviconUrl,
    vpnExtensionUrl,
    vpnGstaticUrl,
    preloadedUrls,
    attachedDataUrls,
    runtime: sandbox.LumnoOverlayFaviconView.createOverlayFaviconViewRuntime({
      document: {
        createElement() {
          return {};
        }
      },
      windowObj: {
        setTimeout,
        clearTimeout
      },
      chromeApi: {
        runtime: {
          getURL(path) {
            return `chrome-extension://abc${path}`;
          }
        }
      },
      requestFaviconData: config.requestFaviconData,
      getRiSvg() {
        return '';
      },
      getHostFromUrl(url) {
        try {
          return new URL(url).hostname.toLowerCase();
        } catch (e) {
          return '';
        }
      },
      getExtensionFaviconUrl(url) {
        if (url === browserPageUrl) {
          return browserPageExtensionUrl;
        }
        if (url === vpnPageUrl) {
          return vpnExtensionUrl;
        }
        return extensionUrl;
      },
      getGstaticFaviconUrl(url) {
        return url === vpnPageUrl ? vpnGstaticUrl : gstaticUrl;
      },
      getChromeFaviconUrl(url) {
        return `chrome://favicon2/?pageUrl=${encodeURIComponent(url)}&size=128`;
      },
      shouldBlockFaviconForHost() {
        return false;
      },
      shouldBlockOverlayFaviconForHost(hostname) {
        if (typeof config.shouldBlockOverlayFaviconForHost === 'function') {
          return config.shouldBlockOverlayFaviconForHost(hostname);
        }
        const host = String(hostname || '').toLowerCase();
        return host === '127.0.0.1' || host === 'localhost';
      },
      isEnhancedFaviconFetchEnabled() {
        return Object.prototype.hasOwnProperty.call(config, 'enhancedFaviconFetchEnabled')
          ? config.enhancedFaviconFetchEnabled
          : true;
      },
      isBlockedLocalFaviconUrl() {
        return false;
      },
      isFaviconProxyUrl(url) {
        return /_favicon\/|gstatic\.cn\/faviconV2/i.test(String(url || ''));
      },
      preloadThemeFromFavicon() {},
      faviconDataCache: config.faviconDataCache,
      faviconCandidateLoadTimeoutMs: 1000
    })
  };
}

function testOverlayRendererLoadsFaviconPolicyBeforeInitialTabs() {
  const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
  assert.match(
    overlayJs,
    /let faviconEnhancedFetchEnabled = false;/,
    'overlay favicon policy should fail closed before storage returns'
  );
  assert.match(
    overlayJs,
    /initialFaviconEnhancedFetchReady = new Promise[\s\S]*?storageArea\.get\(\[FAVICON_ENHANCED_FETCH_ENABLED_STORAGE_KEY\][\s\S]*?resolve\(\)/,
    'overlay should expose a readiness promise for the initial favicon setting load'
  );
  assert.match(
    overlayJs,
    /Promise\.all\(\[initialOverlayOpenTabsDefaultVisibleReady, initialFaviconEnhancedFetchReady\]\)[\s\S]*?requestTabsAndRender\(\)/,
    'first open-tab rendering should wait for the favicon policy setting'
  );
  assert.match(
    overlayJs,
    /overlayFaviconEnhancedFetchStorageListener[\s\S]*?faviconEnhancedFetchEnabled = normalizeFaviconEnhancedFetchEnabled[\s\S]*?refreshOverlayThemeAwareFavicons\(\)/,
    'favicon setting changes should refresh visible overlay favicons after updating the policy state'
  );
  const faviconViewJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/favicon-view.js'), 'utf8');
  assert.match(
    faviconViewJs,
    /data-x-ov-favicon-fallback-url', state\.rawFallbackUrl/,
    'favicon refresh metadata should retain the raw fallback so enabling the setting can restore normal behavior'
  );
}

function testOverlayRendererGuardsThemeSourcesInStrictMode() {
  const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
  assert.match(
    overlayJs,
    /function getOverlayFaviconUrlResolver\(\)[\s\S]*?isEnhancedFaviconFetchEnabled: \(\) => faviconEnhancedFetchEnabled/,
    'overlay URL resolution should use the shared enhanced-fetch policy state'
  );
  assert.match(
    overlayJs,
    /function getSiteFaviconUrl\(hostname\)[\s\S]*?if \(!faviconEnhancedFetchEnabled\) \{\s*return '';\s*\}[\s\S]*?favicon\.ico/,
    'strict mode should stop before constructing a target-host root favicon URL for theme extraction'
  );
  const defaultSearchFaviconStart = overlayJs.indexOf('function getDefaultSearchEngineFaviconUrlForOverlay()');
  const defaultSearchFaviconEnd = overlayJs.indexOf('function getDefaultSearchEngineThemeUrlForOverlay()', defaultSearchFaviconStart);
  assert.notStrictEqual(defaultSearchFaviconStart, -1, 'overlay should define the default search favicon helper');
  assert.notStrictEqual(defaultSearchFaviconEnd, -1, 'default search favicon helper should have a bounded source block');
  const defaultSearchFaviconSource = overlayJs.slice(defaultSearchFaviconStart, defaultSearchFaviconEnd);
  assert.match(
    defaultSearchFaviconSource,
    /if \(!faviconEnhancedFetchEnabled\) \{\s*return '';\s*\}[\s\S]*?favicon\.ico/,
    'strict mode should return before constructing a default search target /favicon.ico candidate'
  );
  assert.match(
    overlayJs,
    /function getThemeFromUrl\(url, hostOverride\)[\s\S]*?isBlockedLocalFaviconUrl\(url\)[\s\S]*?new Image\(\)[\s\S]*?image\.src = url/,
    'theme image assignment should remain behind the shared favicon source policy guard'
  );
  assert.match(
    overlayJs,
    /const safeModeSwitchFavicon = getSafeOverlayFaviconUrl\(suggestion\.favicon\)[\s\S]*?favicon\.src = safeModeSwitchFavicon/,
    'mode-switch rows should sanitize their favicon before direct image assignment'
  );
}

function testOverlayRendererLetsLocalFaviconsReachRuntime() {
  const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
  assert.doesNotMatch(
    overlayJs,
    /const useFallback = shouldBlockOverlayFaviconForHost\(hostForTab\);/,
    'overlay open-tab rendering should let local favicons reach the data-only runtime path'
  );
  const faviconBranch = overlayJs.indexOf('if (suggestion.favicon) {\n              iconNode = createAttachedSuggestionFavicon(suggestion, index, createLinkIcon);');
  const localFallbackBranch = overlayJs.indexOf('} else if (suggestionHost && shouldBlockOverlayFaviconForHost(suggestionHost)) {\n              iconNode = createLinkIcon();');
  assert.notStrictEqual(faviconBranch, -1, 'overlay suggestion rendering should keep the favicon runtime branch');
  assert.notStrictEqual(localFallbackBranch, -1, 'overlay suggestion rendering should keep a no-favicon local fallback');
  assert.ok(
    faviconBranch < localFallbackBranch,
    'overlay suggestion rendering should try favicon runtime before local link fallback'
  );
}

function testOverlayRendererDefersFallbackReplacementUntilFaviconIsMounted() {
  const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
  assert.match(
    overlayJs,
    /function replaceFaviconWithFallbackIcon\(favicon,\s*fallbackIconFactory\)[\s\S]*?scheduleFaviconFallbackReplacement\(favicon,\s*replace\);/,
    'overlay favicon fallback replacement should retry after the favicon has been mounted'
  );
  assert.match(
    overlayJs,
    /function scheduleFaviconFallbackReplacement\(favicon,\s*replace\)[\s\S]*?queueMicrotask[\s\S]*?replace\(\)/,
    'overlay favicon fallback replacement should use a microtask so same-turn appenders can mount the image first'
  );
  assert.match(
    overlayJs,
    /const replaceWithFallbackIcon = function\(\) \{\s*replaceFaviconWithFallbackIcon\(favicon,\s*fallbackIconFactory\);\s*\};/,
    'attached suggestion favicons should use the deferred fallback replacement helper'
  );
  assert.match(
    overlayJs,
    /\(\) => \{\s*replaceFaviconWithFallbackIcon\(favicon,\s*createLinkIcon\);\s*\}/,
    'open-tab favicons should use the deferred fallback replacement helper'
  );
}

function testOverlayRendererReusesRuntimeFallbackIcon() {
  const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
  assert.match(
    overlayJs,
    /function findAttachedFaviconFallbackIcon\(favicon\)[\s\S]*?_x_extension_overlay_favicon_fallback_2026_unique_/,
    'overlay fallback replacement should look for the runtime-managed fallback icon'
  );
  assert.match(
    overlayJs,
    /function showAttachedFaviconFallbackIcon\(favicon\)[\s\S]*?fallbackNode\.setAttribute\('data-visible', 'true'\)[\s\S]*?favicon\.setAttribute\('data-fallback-icon', 'true'\)/,
    'overlay fallback replacement should show the runtime fallback and hide the failed image'
  );
  assert.match(
    overlayJs,
    /if \(showAttachedFaviconFallbackIcon\(favicon\)\) \{\s*return true;\s*\}[\s\S]*?fallbackIconFactory/,
    'overlay fallback replacement should not create a second link icon when the runtime fallback exists'
  );
}

function testOverlayRendererBuildsBrowserPageFavicon2WhenMissingExplicitIcon() {
  const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
  assert.match(
    overlayJs,
    /const browserPageFavicon = suggestion\.type === 'browserPage'[\s\S]*?getPageFaviconCandidateUrl\(suggestion\.url \|\| ''\)/,
    'browser-page suggestions should synthesize a browser favicon candidate when no explicit favicon is present'
  );
  assert.match(
    overlayJs,
    /browserPageFavicon === suggestion\.favicon[\s\S]*?\{ \.\.\.suggestion, favicon: browserPageFavicon \}/,
    'browser-page suggestions should pass the synthesized favicon into the shared favicon fallback chain'
  );
}

function testOverlayRendererUsesExtensionFaviconProxyForBrowserPages() {
  const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
  assert.match(
    overlayJs,
    /function getOverlayFaviconUrlResolver\(\)[\s\S]*?FAVICON_UTILS\.createFaviconUrlResolver[\s\S]*?shouldBlockFaviconForHost: shouldBlockOverlayFaviconForHost/,
    'overlay renderer should use the shared favicon URL resolver with overlay blocking rules'
  );
  assert.match(
    overlayJs,
    /function isBrowserInternalPageUrl\(url\)[\s\S]*?resolver\.isBrowserInternalPageUrl\(url\)/,
    'overlay renderer should share browser-internal page URL detection'
  );
  assert.match(
    overlayJs,
    /function isBlockedOverlayFaviconUrl\(url\)[\s\S]*?resolver\.isBlockedFaviconUrl\(url\)/,
    'overlay renderer should share nested favicon URL blocking rules'
  );
  assert.match(
    overlayJs,
    /function getPageFaviconCandidateUrl\(pageUrl\)[\s\S]*?resolver\.getPageFaviconCandidateUrl\(pageUrl\)/,
    'browser-page favicon candidates should come from the shared resolver'
  );
}

function testOverlayRendererDefinesChromeMonogramHelper() {
  const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
  assert.match(
    overlayJs,
    /function isChromeMonogramFaviconUrl\(url\)[\s\S]*?FAVICON_UTILS\.isChromeMonogramFaviconUrl/,
    'overlay renderer should define a local chrome monogram favicon helper from shared favicon utils'
  );
  assert.match(
    overlayJs,
    /createOverlayFaviconViewRuntime\([\s\S]*?isChromeMonogramFaviconUrl,/,
    'overlay favicon runtime should receive the same chrome monogram helper'
  );
  assert.match(
    overlayJs,
    /function createAttachedSuggestionFavicon\(suggestion, index, fallbackIconFactory\)[\s\S]*?!isChromeMonogramFaviconUrl\(iconUrl\)/,
    'direct URL suggestion favicons should use the local chrome monogram helper instead of an undefined global'
  );
}

async function testOverlayResolvesLocalFaviconThroughDataUrl() {
  const requestedUrls = [];
  const dataUrl = 'data:image/png;base64,bG9jYWw=';
  const { runtime, localPageUrl, extensionUrl } = createRuntime({
    requestFaviconData(url) {
      requestedUrls.push(url);
      return Promise.resolve(url === extensionUrl ? dataUrl : null);
    }
  });
  const img = createFakeImage();
  let failed = false;

  runtime.attachResolvedFaviconWithFallbacks(
    img,
    localPageUrl,
    '127.0.0.1',
    extensionUrl,
    () => {
      failed = true;
    }
  );

  await wait(0);

  assert.strictEqual(failed, false, 'local overlay favicon should not fall back when background returns data');
  assert.deepStrictEqual(requestedUrls, [extensionUrl], 'local overlay favicon should request data through background');
  assert.strictEqual(img.src, dataUrl, 'local overlay favicon should only render the returned data URL');
  assert.strictEqual(
    img.getAttribute('data-favicon-data-source'),
    extensionUrl,
    'data URL should keep the unsafe source only as metadata'
  );
  assert.strictEqual(
    /127\.0\.0\.1|localhost/.test(img.src),
    false,
    'page-visible image src should never contain the local URL'
  );
}

async function testOverlayFallsBackWhenLocalFaviconDataUnavailable() {
  const { runtime, localPageUrl, extensionUrl } = createRuntime();
  const img = createFakeImage();
  let failed = false;

  runtime.attachResolvedFaviconWithFallbacks(
    img,
    localPageUrl,
    '127.0.0.1',
    extensionUrl,
    () => {
      failed = true;
    }
  );

  await wait(0);

  assert.strictEqual(failed, true, 'local overlay favicon should fall back immediately');
  assert.strictEqual(img.src, '', 'local overlay favicon should not assign a page-visible image src');
}

async function testOverlaySkipsRootIconProbeWhenEnhancedFetchDisabled() {
  const requestedUrls = [];
  const { runtime, localPageUrl, extensionUrl } = createRuntime({
    enhancedFaviconFetchEnabled: false,
    requestFaviconData(url) {
      requestedUrls.push(url);
      return Promise.resolve(null);
    }
  });
  const img = createFakeImage();
  let failed = false;

  runtime.attachResolvedFaviconWithFallbacks(
    img,
    localPageUrl,
    '127.0.0.1',
    extensionUrl,
    () => {
      failed = true;
    }
  );

  await wait(4);

  assert.strictEqual(failed, true, 'disabled enhanced favicon fetching should still fall back cleanly');
  assert.deepStrictEqual(
    requestedUrls,
    [extensionUrl],
    'disabled enhanced favicon fetching should not probe root icon files'
  );
}

async function testOverlayStrictModeUsesOnlyVirtualFaviconForVpnHostname() {
  const requestedUrls = [];
  const {
    runtime,
    vpnPageUrl,
    vpnDirectFaviconUrl,
    vpnExtensionUrl,
    vpnGstaticUrl,
    preloadedUrls,
    attachedDataUrls
  } = createRuntime({
    enhancedFaviconFetchEnabled: false,
    requestFaviconData(url) {
      requestedUrls.push(url);
      return Promise.resolve(null);
    }
  });
  const img = createFakeImage();

  runtime.attachFaviconData(img, vpnDirectFaviconUrl, 'foo.example.com');
  runtime.preloadIcon(vpnDirectFaviconUrl);
  runtime.preloadIcon(vpnGstaticUrl);
  runtime.preloadIcon(vpnExtensionUrl);
  runtime.attachResolvedFaviconWithFallbacks(
    img,
    vpnPageUrl,
    'foo.example.com',
    vpnDirectFaviconUrl
  );

  await wait(0);

  assert.deepStrictEqual(attachedDataUrls, [], 'strict mode should not request direct favicon data for a VPN hostname');
  assert.deepStrictEqual(preloadedUrls, [vpnExtensionUrl], 'strict mode should preload only the virtual favicon URL');
  assert.deepStrictEqual(requestedUrls, [], 'normal-looking VPN hosts should not trigger background theme/favicon data requests');
  assert.strictEqual(img.src, vpnExtensionUrl, 'strict mode should render only the extension virtual favicon candidate');
  assert.strictEqual(img.src.includes('foo.example.com/favicon.ico'), false, 'strict mode should not assign the direct favicon');
  assert.strictEqual(img.src.includes('gstatic'), false, 'strict mode should not assign a third-party proxy favicon');
}

async function testOverlayFailsClosedBeforePolicyStateLoads() {
  const {
    runtime,
    vpnPageUrl,
    vpnDirectFaviconUrl,
    vpnExtensionUrl
  } = createRuntime({ enhancedFaviconFetchEnabled: undefined });
  const img = createFakeImage();

  runtime.attachResolvedFaviconWithFallbacks(
    img,
    vpnPageUrl,
    'foo.example.com',
    vpnDirectFaviconUrl
  );

  await wait(0);

  assert.strictEqual(img.src, vpnExtensionUrl, 'unloaded favicon policy should be treated as strict mode');
}

async function testOverlayStrictModeReusesCachedFaviconData() {
  const faviconDataCache = new Map();
  const cachedDataUrl = 'data:image/png;base64,Y2FjaGVk';
  const {
    runtime,
    vpnPageUrl,
    vpnDirectFaviconUrl
  } = createRuntime({
    enhancedFaviconFetchEnabled: false,
    faviconDataCache
  });
  faviconDataCache.set(vpnDirectFaviconUrl, cachedDataUrl);
  const img = createFakeImage();

  runtime.attachResolvedFaviconWithFallbacks(
    img,
    vpnPageUrl,
    'foo.example.com',
    vpnDirectFaviconUrl
  );

  await wait(0);

  assert.strictEqual(img.src, cachedDataUrl, 'strict mode should prefer cached data without reusing its direct URL');
}

async function testOverlayUsesChromeFavicon2ForBrowserInternalPages() {
  const requestedUrls = [];
  const {
    runtime,
    browserPageUrl,
    browserPageFavicon2Url
  } = createRuntime({
    requestFaviconData(url) {
      requestedUrls.push(url);
      return Promise.resolve(null);
    },
    shouldBlockOverlayFaviconForHost(hostname) {
      const host = String(hostname || '').toLowerCase();
      return host === '127.0.0.1' || host === 'localhost' || host === 'extensions';
    }
  });
  const img = createFakeImage();
  let failed = false;

  runtime.attachResolvedFaviconWithFallbacks(
    img,
    browserPageUrl,
    'extensions',
    browserPageFavicon2Url,
    () => {
      failed = true;
    }
  );

  await wait(0);

  assert.strictEqual(failed, false, 'browser internal pages should not use the local-network fallback path');
  assert.strictEqual(
    img.src,
    browserPageFavicon2Url,
    'browser internal pages should render chrome://favicon2 directly'
  );
  assert.deepStrictEqual(
    requestedUrls,
    [],
    'browser internal favicon2 should not be converted into a background data request first'
  );
}

async function testOverlayUsesExtensionFaviconProxyForBrowserInternalPagesWithoutExplicitIcon() {
  const {
    runtime,
    browserPageUrl,
    browserPageExtensionUrl
  } = createRuntime({
    shouldBlockOverlayFaviconForHost(hostname) {
      const host = String(hostname || '').toLowerCase();
      return host === '127.0.0.1' || host === 'localhost' || host === 'extensions';
    }
  });
  const img = createFakeImage();
  let failed = false;

  runtime.attachResolvedFaviconWithFallbacks(
    img,
    browserPageUrl,
    'extensions',
    '',
    () => {
      failed = true;
    }
  );

  await wait(0);

  assert.strictEqual(failed, false, 'browser internal pages should not fall back when no explicit icon was supplied');
  assert.strictEqual(
    img.src,
    browserPageExtensionUrl,
    'browser internal pages should use the extension _favicon proxy before chrome://favicon2'
  );
}

testOverlayResolvesLocalFaviconThroughDataUrl()
  .then(testOverlayFallsBackWhenLocalFaviconDataUnavailable)
  .then(testOverlaySkipsRootIconProbeWhenEnhancedFetchDisabled)
  .then(testOverlayStrictModeUsesOnlyVirtualFaviconForVpnHostname)
  .then(testOverlayFailsClosedBeforePolicyStateLoads)
  .then(testOverlayStrictModeReusesCachedFaviconData)
  .then(testOverlayUsesChromeFavicon2ForBrowserInternalPages)
  .then(testOverlayUsesExtensionFaviconProxyForBrowserInternalPagesWithoutExplicitIcon)
  .then(testOverlayRendererLetsLocalFaviconsReachRuntime)
  .then(testOverlayRendererDefersFallbackReplacementUntilFaviconIsMounted)
  .then(testOverlayRendererReusesRuntimeFallbackIcon)
  .then(testOverlayRendererBuildsBrowserPageFavicon2WhenMissingExplicitIcon)
  .then(testOverlayRendererUsesExtensionFaviconProxyForBrowserPages)
  .then(testOverlayRendererDefinesChromeMonogramHelper)
  .then(testOverlayRendererLoadsFaviconPolicyBeforeInitialTabs)
  .then(testOverlayRendererGuardsThemeSourcesInStrictMode)
  .then(() => {
    console.log('overlay favicon view tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
