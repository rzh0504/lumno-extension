const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const WALLPAPER_STORAGE_KEY = '_x_extension_newtab_wallpaper_2026_unique_';
const LOCAL_WALLPAPER_STORAGE_KEY = '_x_extension_newtab_local_wallpaper_2026_unique_';
const DEFAULT_WALLPAPER_ID = 'monet-coastal-white';
const CUSTOM_WALLPAPER_ID_PREFIX = 'custom-wallpaper-';

function createFakeStyle() {
  const values = new Map();
  return {
    setProperty(name, value) {
      values.set(String(name), String(value));
    },
    getPropertyValue(name) {
      return values.get(String(name)) || '';
    },
    removeProperty(name) {
      values.delete(String(name));
    }
  };
}

function createFakeClassList(element) {
  const classes = new Set();
  return {
    add(...items) {
      items.forEach((item) => {
        if (item) {
          classes.add(String(item));
        }
      });
      element.className = Array.from(classes).join(' ');
    },
    remove(...items) {
      items.forEach((item) => classes.delete(String(item)));
      element.className = Array.from(classes).join(' ');
    },
    contains(item) {
      return classes.has(String(item));
    },
    toggle(item, force) {
      const name = String(item);
      const shouldAdd = force === undefined ? !classes.has(name) : Boolean(force);
      if (shouldAdd) {
        classes.add(name);
      } else {
        classes.delete(name);
      }
      element.className = Array.from(classes).join(' ');
      return shouldAdd;
    }
  };
}

function createFakeElement(tagName, documentObj) {
  const attributes = new Map();
  const element = {
    tagName: String(tagName || '').toUpperCase(),
    children: [],
    parentNode: null,
    parentElement: null,
    className: '',
    id: '',
    textContent: '',
    innerHTML: '',
    type: '',
    value: '',
    disabled: false,
    checked: false,
    tabIndex: 0,
    _listeners: Object.create(null),
    style: createFakeStyle(),
    classList: null,
    setAttribute(name, value) {
      const key = String(name);
      const text = String(value);
      attributes.set(key, text);
      if (key === 'class') {
        this.className = text;
      } else if (key === 'id') {
        this.id = text;
      } else if (key === 'type') {
        this.type = text;
      }
    },
    getAttribute(name) {
      return attributes.has(String(name)) ? attributes.get(String(name)) : null;
    },
    removeAttribute(name) {
      attributes.delete(String(name));
    },
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      child.parentElement = this;
      return child;
    },
    contains(target) {
      if (!target) {
        return false;
      }
      if (target === this) {
        return true;
      }
      return this.children.some((child) => child && typeof child.contains === 'function' && child.contains(target));
    },
    addEventListener(type, listener) {
      const key = String(type);
      if (!this._listeners[key]) {
        this._listeners[key] = [];
      }
      this._listeners[key].push(listener);
    },
    removeEventListener(type, listener) {
      const key = String(type);
      if (!this._listeners[key]) {
        return;
      }
      this._listeners[key] = this._listeners[key].filter((item) => item !== listener);
    },
    click() {
      (this._listeners.click || []).forEach((listener) => {
        listener({
          target: this,
          preventDefault() {},
          stopPropagation() {}
        });
      });
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    focus() {
      documentObj.activeElement = this;
    },
    blur() {
      if (documentObj.activeElement === this) {
        documentObj.activeElement = null;
      }
      this._blurred = true;
    }
  };
  element.classList = createFakeClassList(element);
  return element;
}

function createFakeDocument() {
  const documentObj = {
    activeElement: null,
    body: null,
    documentElement: null,
    createElement(tagName) {
      return createFakeElement(tagName, documentObj);
    }
  };
  documentObj.body = createFakeElement('body', documentObj);
  documentObj.documentElement = createFakeElement('html', documentObj);
  return documentObj;
}

function createFakeWindow() {
  return {
    setTimeout,
    clearTimeout,
    requestAnimationFrame(callback) {
      return setTimeout(callback, 0);
    },
    cancelAnimationFrame(id) {
      clearTimeout(id);
    },
    addEventListener() {},
    removeEventListener() {},
    innerWidth: 1280,
    innerHeight: 800,
    matchMedia(query) {
      return {
        matches: String(query || '').includes('prefers-reduced-motion'),
        addEventListener() {},
        removeEventListener() {}
      };
    },
    localStorage: {
      removeItem() {},
      setItem() {},
      getItem() {
        return '';
      }
    }
  };
}

function getChildByClassName(element, className) {
  return (element.children || []).find((child) => {
    const classes = String(child.className || '').split(/\s+/);
    return classes.includes(className);
  });
}

function createMemoryStorage(initialData) {
  const data = Object.assign({}, initialData || {});
  const sets = [];
  return {
    data,
    sets,
    get(keys, callback) {
      const keyList = Array.isArray(keys) ? keys : [keys];
      const result = {};
      keyList.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          result[key] = data[key];
        }
      });
      callback(result);
    },
    set(payload, callback) {
      sets.push(Object.assign({}, payload || {}));
      Object.assign(data, payload || {});
      if (callback) {
        callback();
      }
    }
  };
}

function createLocalWallpaperStoreApi(records) {
  const items = Array.isArray(records) ? records.slice() : [];
  return {
    CUSTOM_WALLPAPER_ID: 'custom-upload',
    CUSTOM_WALLPAPER_ID_PREFIX,
    createWallpaperLocalStore() {
      return {
        isCustomWallpaperId(id) {
          return String(id || '').startsWith(CUSTOM_WALLPAPER_ID_PREFIX);
        },
        normalizeRecord(record) {
          if (!record || !record.imageDataUrl) {
            return null;
          }
          return {
            id: String(record.id || ''),
            key: String(record.key || record.id || ''),
            name: String(record.name || ''),
            imageDataUrl: String(record.imageDataUrl || ''),
            thumbnailDataUrl: String(record.thumbnailDataUrl || record.imageDataUrl || ''),
            updatedAt: Number(record.updatedAt) || 1
          };
        },
        readAll() {
          return Promise.resolve(items);
        },
        write() {
          return Promise.resolve();
        },
        remove() {
          return Promise.resolve();
        },
        buildRecordFromFile() {
          return Promise.reject(new Error('not implemented'));
        }
      };
    }
  };
}

function createWallpaperSandbox(options) {
  const testDocument = createFakeDocument();
  const testWindow = createFakeWindow();
  const testSandbox = {
    console,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: testWindow.requestAnimationFrame,
    cancelAnimationFrame: testWindow.cancelAnimationFrame,
    URL,
    globalThis: null,
    document: testDocument,
    window: testWindow,
    chrome: {
      runtime: {
        getURL: (path) => `chrome-extension://abc/${String(path || '').replace(/^\/+/, '')}`
      }
    },
    LumnoNewtabWallpaperAdaptiveTone: {},
    LumnoNewtabWallpaperEffects: {},
    LumnoNewtabWallpaperLocalStore: options && options.localStoreApi ? options.localStoreApi : {}
  };
  testSandbox.globalThis = testSandbox;
  vm.runInNewContext(fs.readFileSync('src/newtab/wallpaper.js', 'utf8'), testSandbox, {
    filename: 'src/newtab/wallpaper.js'
  });
  return { documentObj: testDocument, windowObj: testWindow, sandbox: testSandbox };
}

const documentObj = createFakeDocument();
const windowObj = createFakeWindow();

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  requestAnimationFrame: windowObj.requestAnimationFrame,
  cancelAnimationFrame: windowObj.cancelAnimationFrame,
  URL,
  globalThis: null,
  document: documentObj,
  window: windowObj,
  chrome: {
    runtime: {
      getURL: (path) => `chrome-extension://abc/${String(path || '').replace(/^\/+/, '')}`
    }
  },
  LumnoNewtabWallpaperAdaptiveTone: {},
  LumnoNewtabWallpaperEffects: {},
  LumnoNewtabWallpaperLocalStore: {}
};
sandbox.globalThis = sandbox;

vm.runInNewContext(fs.readFileSync('src/newtab/wallpaper.js', 'utf8'), sandbox, {
  filename: 'src/newtab/wallpaper.js'
});

const runtime = sandbox.LumnoNewtabWallpaper.createWallpaperRuntime({
  documentObj,
  windowObj,
  storageArea: null,
  t: (_key, fallback) => fallback || '',
  getRiSvg: () => ''
});

runtime.createControls();
const control = runtime.getControlElement();
const panel = control.children[0];
const slider = documentObj.createElement('input');
slider.type = 'range';
panel.appendChild(slider);
documentObj.activeElement = slider;

runtime.closePanel();

assert.strictEqual(slider._blurred, true, 'closing the appearance panel should blur an active slider inside it');
assert.strictEqual(documentObj.activeElement, null, 'closing the appearance panel should clear activeElement for panel sliders');

const appearanceButton = control.children[1];
appearanceButton.click();
const renderedPanel = control.children[0];
const appearanceSection = getChildByClassName(renderedPanel, 'x-nt-appearance-section');
const searchWidthControl = getChildByClassName(appearanceSection, 'x-nt-search-width-control');
const searchWidthSlider = searchWidthControl.children[1].children[0];
const moreSettingsLink = searchWidthControl.children[2];

assert.strictEqual(searchWidthControl.getAttribute('data-visible'), 'true');
assert.strictEqual(searchWidthSlider.disabled, false, 'global scope should still show the search width slider');
assert.strictEqual(searchWidthSlider.tabIndex, 0, 'global scope search width slider should be tabbable');
assert.strictEqual(moreSettingsLink.tabIndex, 0, 'global scope search width settings link should be tabbable');

const scopedRuntime = sandbox.LumnoNewtabWallpaper.createWallpaperRuntime({
  documentObj,
  windowObj,
  storageArea: null,
  t: (_key, fallback) => fallback || '',
  getRiSvg: () => '',
  getThemeScope: () => 'home'
});
scopedRuntime.createControls();
const scopedControl = scopedRuntime.getControlElement();
scopedControl.children[1].click();
const scopedAppearanceSection = getChildByClassName(scopedControl.children[0], 'x-nt-appearance-section');
const scopedSearchWidthControl = getChildByClassName(scopedAppearanceSection, 'x-nt-search-width-control');
const scopedSearchWidthSlider = scopedSearchWidthControl.children[1].children[0];
const scopedMoreSettingsLink = scopedSearchWidthControl.children[2];

assert.strictEqual(scopedSearchWidthControl.getAttribute('data-visible'), 'true');
assert.strictEqual(scopedSearchWidthSlider.disabled, false, 'visible search width slider should be interactive');
assert.strictEqual(scopedSearchWidthSlider.tabIndex, 0, 'visible search width slider should be tabbable');
assert.strictEqual(scopedMoreSettingsLink.tabIndex, 0, 'visible search width settings link should be tabbable');

let switchingScope = 'global';
const switchingRuntime = sandbox.LumnoNewtabWallpaper.createWallpaperRuntime({
  documentObj,
  windowObj,
  storageArea: null,
  t: (_key, fallback) => fallback || '',
  getRiSvg: () => '',
  getThemeScope: () => switchingScope,
  setThemeScope: (scope) => {
    switchingScope = scope === 'home' ? 'home' : 'global';
  }
});
switchingRuntime.createControls();
const switchingControl = switchingRuntime.getControlElement();
switchingControl.children[1].click();
const switchingAppearanceSection = getChildByClassName(switchingControl.children[0], 'x-nt-appearance-section');
const switchingHeader = getChildByClassName(switchingAppearanceSection, 'x-nt-appearance-header');
const switchingScopeTabs = getChildByClassName(switchingHeader, 'x-nt-appearance-scope-tabs');
const switchingSearchWidthControl = getChildByClassName(switchingAppearanceSection, 'x-nt-search-width-control');

assert.strictEqual(switchingSearchWidthControl.getAttribute('data-visible'), 'true');
switchingScopeTabs.children[1].click();
assert.strictEqual(switchingScope, 'home', 'clicking New Tab should switch theme scope');
assert.strictEqual(
  switchingSearchWidthControl.getAttribute('data-visible'),
  'true',
  'search width control should stay visible after switching to New Tab scope'
);
switchingScopeTabs.children[0].click();
assert.strictEqual(switchingScope, 'global', 'clicking Global should switch theme scope back');
assert.strictEqual(
  switchingSearchWidthControl.getAttribute('data-visible'),
  'true',
  'search width control should stay visible after switching back to Global scope'
);

async function testSyncedCustomWallpaperWithoutLocalRecordFallsBackToDefault() {
  const syncStorage = createMemoryStorage({
    [WALLPAPER_STORAGE_KEY]: `${CUSTOM_WALLPAPER_ID_PREFIX}remote-only`
  });
  const { documentObj: testDocument, windowObj: testWindow, sandbox: testSandbox } = createWallpaperSandbox();
  const testRuntime = testSandbox.LumnoNewtabWallpaper.createWallpaperRuntime({
    documentObj: testDocument,
    windowObj: testWindow,
    storageArea: syncStorage,
    storageKeys: {
      wallpaper: WALLPAPER_STORAGE_KEY,
      localWallpaper: LOCAL_WALLPAPER_STORAGE_KEY
    },
    t: (_key, fallback) => fallback || '',
    getRiSvg: () => ''
  });

  await testRuntime.bootstrapInitialWallpaper();

  assert.strictEqual(
    testDocument.body.getAttribute('data-wallpaper-active'),
    'true',
    'missing local wallpaper records should not leave the new tab with a blank wallpaper'
  );
  assert.ok(
    testDocument.documentElement.style
      .getPropertyValue('--x-nt-wallpaper-image')
      .includes('lumno-newtab-monet-coastal-white.webp'),
    'missing synced custom wallpaper should fall back to the default built-in wallpaper'
  );
  assert.strictEqual(
    syncStorage.data[WALLPAPER_STORAGE_KEY],
    DEFAULT_WALLPAPER_ID,
    'a synced custom wallpaper id without local image data should be sanitized to a built-in wallpaper'
  );
}

async function testLegacySyncedCustomWallpaperMigratesToLocalOnlySelection() {
  const customWallpaperId = `${CUSTOM_WALLPAPER_ID_PREFIX}local-record`;
  const syncStorage = createMemoryStorage({
    [WALLPAPER_STORAGE_KEY]: customWallpaperId
  });
  const localStorageArea = createMemoryStorage();
  const localStoreApi = createLocalWallpaperStoreApi([{
    id: customWallpaperId,
    imageDataUrl: 'data:image/webp;base64,wallpaper',
    thumbnailDataUrl: 'data:image/webp;base64,thumb',
    updatedAt: 1
  }]);
  const { documentObj: testDocument, windowObj: testWindow, sandbox: testSandbox } = createWallpaperSandbox({
    localStoreApi
  });
  const testRuntime = testSandbox.LumnoNewtabWallpaper.createWallpaperRuntime({
    documentObj: testDocument,
    windowObj: testWindow,
    storageArea: syncStorage,
    localWallpaperStorageArea: localStorageArea,
    storageKeys: {
      wallpaper: WALLPAPER_STORAGE_KEY,
      localWallpaper: LOCAL_WALLPAPER_STORAGE_KEY
    },
    t: (_key, fallback) => fallback || '',
    getRiSvg: () => ''
  });

  await testRuntime.bootstrapInitialWallpaper();

  assert.ok(
    testDocument.documentElement.style
      .getPropertyValue('--x-nt-wallpaper-image')
      .includes('data:image/webp;base64,wallpaper'),
    'a legacy synced custom wallpaper that exists locally should still render on this device'
  );
  assert.strictEqual(
    localStorageArea.data[LOCAL_WALLPAPER_STORAGE_KEY],
    customWallpaperId,
    'custom wallpaper selection should be migrated to local-only storage'
  );
  assert.strictEqual(
    syncStorage.data[WALLPAPER_STORAGE_KEY],
    DEFAULT_WALLPAPER_ID,
    'custom wallpaper ids should not remain in sync storage after migration'
  );
}

Promise.resolve()
  .then(testSyncedCustomWallpaperWithoutLocalRecordFallsBackToDefault)
  .then(testLegacySyncedCustomWallpaperMigratesToLocalOnlySelection)
  .then(() => {
    console.log('newtab wallpaper panel tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
