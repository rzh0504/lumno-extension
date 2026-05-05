(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoBackgroundPages = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const ONBOARDING_URL = 'https://lumno.kubai.design/onboarding/';
  const RELEASE_URL = 'https://lumno.kubai.design/release/';

  function getChromeApi() {
    return typeof chrome !== 'undefined' ? chrome : null;
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
      chromeApi.tabs.create({ url: chromeApi.runtime.getURL('src/options/options.html') }, () => {
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

  function openOnboardingPage(callback) {
    const chromeApi = getChromeApi();
    const done = typeof callback === 'function' ? callback : () => {};
    if (!chromeApi || !chromeApi.tabs) {
      done(false);
      return;
    }
    chromeApi.tabs.create({ url: ONBOARDING_URL }, () => {
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
    chromeApi.tabs.create({ url: buildReleaseUrl(options) }, () => {
      done(!(chromeApi.runtime && chromeApi.runtime.lastError));
    });
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
