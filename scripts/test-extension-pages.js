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
      getManifest() {
        return { version };
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

(async () => {
  const localStore = {};
  const syncStore = {};
  const createdTabs = [];
  global.chrome = createChromeApi(localStore, syncStore, createdTabs, '0.9.9');

  const firstOpened = await openReleasePage({ reason: 'update', oncePerVersion: true });
  assert.strictEqual(firstOpened, true, 'first update should open the release page');
  assert.strictEqual(createdTabs.length, 1, 'first update should create one release tab');
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
  assert.strictEqual(createdTabs.length, 1, 'same version should not create another release tab');

  global.chrome = createChromeApi(localStore, syncStore, createdTabs, '0.10.0');
  const nextVersionOpened = await openReleasePage({ reason: 'update', oncePerVersion: true });
  assert.strictEqual(nextVersionOpened, true, 'new version should open the release page again');
  assert.strictEqual(createdTabs.length, 2, 'new version should create a new release tab');
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
