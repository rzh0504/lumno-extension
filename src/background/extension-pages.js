(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoBackgroundPages = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const ONBOARDING_WEB_URL = 'https://lumno.kubai.design/onboarding/';
  const ONBOARDING_ROUTE_PATH = 'src/onboarding/onboarding.html';
  const RELEASE_URL = 'https://lumno.kubai.design/release/';
  const RELEASE_PAGE_OPENED_STORAGE_KEY = '_x_lumno_release_page_opened_2026_unique_';

  function getChromeApi() {
    return typeof chrome !== 'undefined' ? chrome : null;
  }

  function getRoutesApi() {
    return typeof globalThis !== 'undefined' && globalThis.LumnoExtensionRoutes
      ? globalThis.LumnoExtensionRoutes
      : null;
  }

  function getExtensionDetailsUrl() {
    const chromeApi = getChromeApi();
    if (!chromeApi || !chromeApi.runtime || !chromeApi.runtime.id) {
      return 'chrome://extensions/';
    }
    return `chrome://extensions/?id=${encodeURIComponent(chromeApi.runtime.id)}`;
  }

  function openExtensionOptionsPage(callback) {
    const chromeApi = getChromeApi();
    const done = typeof callback === 'function' ? callback : () => {};
    const fallbackOpen = () => {
      const routes = getRoutesApi();
      const optionsUrl = routes && typeof routes.buildOptionsUrl === 'function'
        ? routes.buildOptionsUrl(chromeApi)
        : chromeApi.runtime.getURL('src/options/options.html');
      chromeApi.tabs.create({ url: optionsUrl }, () => {
        done(!(chromeApi.runtime && chromeApi.runtime.lastError));
      });
    };

    if (!chromeApi || !chromeApi.tabs || !chromeApi.runtime) {
      done(false);
      return;
    }

    if (typeof chromeApi.runtime.openOptionsPage !== 'function') {
      fallbackOpen();
      return;
    }

    chromeApi.runtime.openOptionsPage(() => {
      if (chromeApi.runtime && chromeApi.runtime.lastError) {
        fallbackOpen();
        return;
      }
      done(true);
    });
  }

  function buildExtensionPageUrl(path) {
    const chromeApi = getChromeApi();
    const routes = getRoutesApi();
    if (routes && typeof routes.buildExtensionUrl === 'function') {
      return routes.buildExtensionUrl(chromeApi, path);
    }
    if (chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getURL === 'function') {
      return chromeApi.runtime.getURL(path);
    }
    return path;
  }

  function buildOnboardingUrl(options) {
    const params = new URLSearchParams();
    params.set('entry', 'ext');
    const reason = options && typeof options.reason === 'string'
      ? String(options.reason).trim().toLowerCase()
      : '';
    if (reason) {
      params.set('reason', reason);
    }
    const version = getExtensionVersionTag();
    if (version) {
      params.set('version', version);
    }
    const url = new URL(
      buildExtensionPageUrl(ONBOARDING_ROUTE_PATH),
      'chrome-extension://lumno/'
    );
    params.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }

  function openOnboardingPage(options, callback) {
    const chromeApi = getChromeApi();
    const openOptions = typeof options === 'function' ? {} : (options || {});
    const done = typeof options === 'function'
      ? options
      : (typeof callback === 'function' ? callback : () => {});
    if (!chromeApi || !chromeApi.tabs) {
      done(false);
      return;
    }
    chromeApi.tabs.create({ url: buildOnboardingUrl(openOptions) }, () => {
      done(!(chromeApi.runtime && chromeApi.runtime.lastError));
    });
  }

  function getExtensionVersionTag() {
    const chromeApi = getChromeApi();
    const version = chromeApi && chromeApi.runtime && chromeApi.runtime.getManifest
      ? String((chromeApi.runtime.getManifest() || {}).version || '').trim()
      : '';
    if (!version) {
      return '';
    }
    return /^v/i.test(version) ? version : `v${version}`;
  }

  function getLocalStorageArea(chromeApi) {
    return chromeApi && chromeApi.storage && chromeApi.storage.local
      ? chromeApi.storage.local
      : null;
  }

  function getSyncableStorageArea(chromeApi) {
    if (!chromeApi || !chromeApi.storage) {
      return null;
    }
    return chromeApi.storage.sync || chromeApi.storage.local || null;
  }

  function getStoredReleasePageOpen(payload) {
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    const version = typeof payload.version === 'string' ? payload.version.trim() : '';
    if (!version) {
      return null;
    }
    return {
      version,
      reason: typeof payload.reason === 'string' ? payload.reason : '',
      openedAt: Number(payload.openedAt) || 0
    };
  }

  function getReleaseOpenReason(options) {
    return options && typeof options.reason === 'string'
      ? String(options.reason).trim().toLowerCase()
      : '';
  }

  function buildReleaseUrl(options) {
    const params = new URLSearchParams();
    params.set('entry', 'ext');
    const reason = options && typeof options.reason === 'string' ? String(options.reason).trim().toLowerCase() : '';
    if (reason) {
      params.set('reason', reason);
    }
    const version = getExtensionVersionTag();
    if (version) {
      params.set('version', version);
    }
    return `${RELEASE_URL}?${params.toString()}`;
  }

  function openReleasePage(options, callback) {
    const chromeApi = getChromeApi();
    const done = typeof callback === 'function' ? callback : () => {};
    if (!chromeApi || !chromeApi.tabs) {
      done(false);
      return;
    }
    const releaseUrl = buildReleaseUrl(options);
    const oncePerVersion = Boolean(options && options.oncePerVersion);
    const version = getExtensionVersionTag();
    const storageArea = getSyncableStorageArea(chromeApi);
    const localStorageArea = getLocalStorageArea(chromeApi);
    const openTab = (afterOpen) => {
      chromeApi.tabs.create({ url: releaseUrl }, () => {
        const opened = !(chromeApi.runtime && chromeApi.runtime.lastError);
        if (opened && typeof afterOpen === 'function') {
          afterOpen();
        }
        done(opened);
      });
    };
    const markOpened = () => {
      if (!storageArea || typeof storageArea.set !== 'function' || !version) {
        return;
      }
      try {
        storageArea.set({
          [RELEASE_PAGE_OPENED_STORAGE_KEY]: {
            version,
            reason: getReleaseOpenReason(options),
            openedAt: Date.now()
          }
        }, () => {});
      } catch (e) {
        // A failed marker should not block the user from seeing the release page.
      }
    };

    if (!oncePerVersion || !version || !storageArea || typeof storageArea.get !== 'function') {
      openTab(oncePerVersion ? markOpened : null);
      return;
    }
    try {
      storageArea.get([RELEASE_PAGE_OPENED_STORAGE_KEY], (result) => {
        const runtimeError = chromeApi.runtime ? chromeApi.runtime.lastError : null;
        const stored = runtimeError
          ? null
          : getStoredReleasePageOpen(result && result[RELEASE_PAGE_OPENED_STORAGE_KEY]);
        if (stored && stored.version === version) {
          done(false);
          return;
        }
        if (storageArea !== localStorageArea &&
            localStorageArea &&
            typeof localStorageArea.get === 'function') {
          localStorageArea.get([RELEASE_PAGE_OPENED_STORAGE_KEY], (localResult) => {
            const localRuntimeError = chromeApi.runtime ? chromeApi.runtime.lastError : null;
            const legacyStored = localRuntimeError
              ? null
              : getStoredReleasePageOpen(localResult && localResult[RELEASE_PAGE_OPENED_STORAGE_KEY]);
            if (legacyStored && legacyStored.version === version) {
              markOpened();
              done(false);
              return;
            }
            openTab(markOpened);
          });
          return;
        }
        openTab(markOpened);
      });
    } catch (e) {
      openTab(markOpened);
    }
  }

  function getBookmarkManagerUrls() {
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent)
      ? String(navigator.userAgent).toLowerCase()
      : '';
    const candidates = [];
    const pushUnique = (url) => {
      const value = String(url || '').trim();
      if (!value || candidates.includes(value)) {
        return;
      }
      candidates.push(value);
    };

    if (ua.includes('firefox/')) {
      pushUnique('about:bookmarks');
      pushUnique('chrome://bookmarks/');
      return candidates;
    }
    if (ua.includes('edg/')) {
      pushUnique('edge://favorites/');
      pushUnique('edge://bookmarks/');
    } else if (ua.includes('vivaldi/')) {
      pushUnique('vivaldi://bookmarks/');
    } else if (ua.includes('opr/') || ua.includes('opera')) {
      pushUnique('opera://bookmarks/');
    } else if (ua.includes('brave/')) {
      pushUnique('brave://bookmarks/');
    }
    pushUnique('chrome://bookmarks/');
    return candidates;
  }

  function openBookmarkManagerPage() {
    const chromeApi = getChromeApi();
    const urls = getBookmarkManagerUrls();
    return new Promise((resolve, reject) => {
      if (!chromeApi || !chromeApi.tabs) {
        reject(new Error('tabs-api-unavailable'));
        return;
      }
      const tryOpen = (index) => {
        if (index >= urls.length) {
          reject(new Error('no-bookmark-manager-url'));
          return;
        }
        const targetUrl = urls[index];
        chromeApi.tabs.create({ url: targetUrl }, () => {
          if (chromeApi.runtime && chromeApi.runtime.lastError) {
            tryOpen(index + 1);
            return;
          }
          resolve(targetUrl);
        });
      };
      tryOpen(0);
    });
  }

  function openExtensionShortcutsPage(callback) {
    const chromeApi = getChromeApi();
    const done = typeof callback === 'function' ? callback : () => {};
    if (!chromeApi || !chromeApi.tabs) {
      done(false);
      return;
    }
    chromeApi.tabs.create({ url: 'chrome://extensions/shortcuts' }, () => {
      done(!(chromeApi.runtime && chromeApi.runtime.lastError));
    });
  }

  return Object.freeze({
    buildReleaseUrl,
    buildOnboardingUrl,
    ONBOARDING_WEB_URL,
    ONBOARDING_ROUTE_PATH,
    RELEASE_PAGE_OPENED_STORAGE_KEY,
    getBookmarkManagerUrls,
    getExtensionDetailsUrl,
    getExtensionVersionTag,
    openBookmarkManagerPage,
    openExtensionOptionsPage,
    openExtensionShortcutsPage,
    openOnboardingPage,
    openReleasePage
  });
});
