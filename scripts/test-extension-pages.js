const assert = require('assert');
const pages = require('../src/background/extension-pages.js');

function createChromeApi(store, createdTabs, version) {
  return {
    runtime: {
      lastError: null,
      getManifest() {
        return { version };
      }
    },
    storage: {
      local: {
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
      }
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
  const store = {};
  const createdTabs = [];
  global.chrome = createChromeApi(store, createdTabs, '0.9.9');

  const firstOpened = await openReleasePage({ reason: 'update', oncePerVersion: true });
  assert.strictEqual(firstOpened, true, 'first update should open the release page');
  assert.strictEqual(createdTabs.length, 1, 'first update should create one release tab');
  assert.strictEqual(
    store[pages.RELEASE_PAGE_OPENED_STORAGE_KEY].version,
    'v0.9.9',
    'opened release page version should be persisted'
  );

  const secondOpened = await openReleasePage({ reason: 'update', oncePerVersion: true });
  assert.strictEqual(secondOpened, false, 'same version should not reopen the release page');
  assert.strictEqual(createdTabs.length, 1, 'same version should not create another release tab');

  global.chrome = createChromeApi(store, createdTabs, '0.10.0');
  const nextVersionOpened = await openReleasePage({ reason: 'update', oncePerVersion: true });
  assert.strictEqual(nextVersionOpened, true, 'new version should open the release page again');
  assert.strictEqual(createdTabs.length, 2, 'new version should create a new release tab');
  assert.strictEqual(
    store[pages.RELEASE_PAGE_OPENED_STORAGE_KEY].version,
    'v0.10.0',
    'new version marker should replace the old marker'
  );

  delete global.chrome;
  console.log('extension page tests passed');
})();
