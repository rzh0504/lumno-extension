const assert = require('assert');
const pages = require('../src/background/extension-pages.js');

function createStorageArea(store) {
  return {
    get(keys, callback) {
      const result = {};
      keys.forEach((key) => {
        result[key] = store[key];
      });
      callback(result);
    },
    set(values, callback) {
      Object.assign(store, values);
      if (typeof callback === 'function') {
        callback();
      }
    }
  };
}

function createChromeApi(localStore, syncStore, createdTabs, version) {
  return {
    runtime: {
      lastError: null,
      id: 'lumno-test-id',
      getManifest() {
        return { version };
      },
      getURL(path) {
        return `chrome-extension://lumno-test-id/${path}`;
      }
    },
    storage: {
      local: createStorageArea(localStore),
      sync: createStorageArea(syncStore)
    },
    tabs: {
      create(options, callback) {
        createdTabs.push(options.url);
        if (typeof callback === 'function') {
          callback();
        }
      }
    }
  };
}

function openReleasePage(options) {
  return new Promise((resolve) => {
    pages.openReleasePage(options, resolve);
  });
}

function openOnboardingPage(options) {
  return new Promise((resolve) => {
    pages.openOnboardingPage(options, resolve);
  });
}

function openSiteSearchOptionsPage() {
  return new Promise((resolve) => {
    pages.openSiteSearchOptionsPage(resolve);
  });
}

(async () => {
  const localStore = {};
  const syncStore = {};
  const createdTabs = [];
  global.chrome = createChromeApi(localStore, syncStore, createdTabs, '0.9.9');

  assert.strictEqual(typeof pages.buildOnboardingUrl, 'function', 'onboarding URL builder should be exported');
  const builtOnboardingUrl = new URL(pages.buildOnboardingUrl({ reason: 'manual' }));
  assert.strictEqual(
    `${builtOnboardingUrl.protocol}//${builtOnboardingUrl.host}${builtOnboardingUrl.pathname}`,
    'chrome-extension://lumno-test-id/src/onboarding/onboarding.html',
    'built onboarding URL should point to the extension-local page'
  );
  assert.strictEqual(builtOnboardingUrl.searchParams.get('entry'), 'ext', 'built onboarding URL should include extension entry context');
  assert.strictEqual(builtOnboardingUrl.searchParams.get('reason'), 'manual', 'built onboarding URL should include open reason');
  assert.strictEqual(builtOnboardingUrl.searchParams.get('version'), 'v0.9.9', 'built onboarding URL should include extension version');

  assert.strictEqual(
    pages.shouldOpenOnboardingForUpdate({ reason: 'update', previousVersion: '0.9.10' }, '0.9.11'),
    true,
    '0.9.11 update should open onboarding once for existing users'
  );
  assert.strictEqual(
    pages.shouldOpenOnboardingForUpdate({ reason: 'install' }, '0.9.11'),
    false,
    'install should not rely on the one-time update onboarding gate'
  );
  assert.strictEqual(
    pages.shouldOpenOnboardingForUpdate({ reason: 'update', previousVersion: '0.9.11' }, '0.9.12'),
    false,
    'future updates after 0.9.11 should not open onboarding for existing users'
  );

  const onboardingOpened = await openOnboardingPage({ reason: 'manual' });
  assert.strictEqual(onboardingOpened, true, 'manual onboarding should open a tab');
  assert.strictEqual(createdTabs.length, 1, 'manual onboarding should create one tab');
  const onboardingUrl = new URL(createdTabs[0]);
  assert.strictEqual(
    `${onboardingUrl.protocol}//${onboardingUrl.host}${onboardingUrl.pathname}`,
    'chrome-extension://lumno-test-id/src/onboarding/onboarding.html',
    'onboarding should open the extension-local page'
  );
  assert.strictEqual(onboardingUrl.searchParams.get('entry'), 'ext', 'onboarding should include extension entry context');
  assert.strictEqual(onboardingUrl.searchParams.get('reason'), 'manual', 'onboarding should include open reason');
  assert.strictEqual(onboardingUrl.searchParams.get('version'), 'v0.9.9', 'onboarding should include extension version');

  assert.strictEqual(typeof pages.openSiteSearchOptionsPage, 'function', 'site-search options opener should be exported');
  const siteSearchOptionsOpened = await openSiteSearchOptionsPage();
  assert.strictEqual(siteSearchOptionsOpened, true, 'site-search options opener should create a tab');
  assert.strictEqual(createdTabs.length, 2, 'site-search options opener should create one tab');
  assert.strictEqual(
    createdTabs[1],
    'chrome-extension://lumno-test-id/src/options/options.html#shortcuts',
    'site-search options opener should deep-link to the shortcuts/site-search list'
  );

  const firstOpened = await openReleasePage({ reason: 'update', oncePerVersion: true });
  assert.strictEqual(firstOpened, true, 'first update should open the release page');
  assert.strictEqual(createdTabs.length, 3, 'first update should create one release tab');
  assert.strictEqual(
    syncStore[pages.RELEASE_PAGE_OPENED_STORAGE_KEY].version,
    'v0.9.9',
    'opened release page version should be persisted in sync'
  );
  assert.strictEqual(
    localStore[pages.RELEASE_PAGE_OPENED_STORAGE_KEY],
    undefined,
    'release page marker should not be duplicated to local when sync is available'
  );

  const secondOpened = await openReleasePage({ reason: 'update', oncePerVersion: true });
  assert.strictEqual(secondOpened, false, 'same version should not reopen the release page');
  assert.strictEqual(createdTabs.length, 3, 'same version should not create another release tab');

  global.chrome = createChromeApi(localStore, syncStore, createdTabs, '0.10.0');
  const nextVersionOpened = await openReleasePage({ reason: 'update', oncePerVersion: true });
  assert.strictEqual(nextVersionOpened, true, 'new version should open the release page again');
  assert.strictEqual(createdTabs.length, 4, 'new version should create a new release tab');
  assert.strictEqual(
    syncStore[pages.RELEASE_PAGE_OPENED_STORAGE_KEY].version,
    'v0.10.0',
    'new version marker should replace the old marker'
  );

  const legacyLocalStore = {
    [pages.RELEASE_PAGE_OPENED_STORAGE_KEY]: {
      version: 'v0.10.1',
      reason: 'update',
      openedAt: 1
    }
  };
  const legacySyncStore = {};
  const legacyCreatedTabs = [];
  global.chrome = createChromeApi(legacyLocalStore, legacySyncStore, legacyCreatedTabs, '0.10.1');
  const legacyOpened = await openReleasePage({ reason: 'update', oncePerVersion: true });
  assert.strictEqual(legacyOpened, false, 'legacy local marker should prevent reopening the same version');
  assert.strictEqual(legacyCreatedTabs.length, 0, 'legacy local marker should not create another release tab');
  assert.strictEqual(
    legacySyncStore[pages.RELEASE_PAGE_OPENED_STORAGE_KEY].version,
    'v0.10.1',
    'legacy local release marker should migrate into sync'
  );

  delete global.chrome;
  console.log('extension page tests passed');
})();
