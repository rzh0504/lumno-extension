const assert = require('assert');
const fs = require('fs');
const featureHints = require('../src/shared/feature-hints.js');
const updateNotice = require('../src/shared/update-notice.js');

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.blurred = false;
    this.inert = false;
    this.id = '';
    this.className = '';
    this.type = '';
    this.innerHTML = '';
    this.textContent = '';
  }

  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  removeEventListener(type, listener) {
    if (this.listeners[type] === listener) {
      delete this.listeners[type];
    }
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  getBoundingClientRect() {
    return { width: 0, height: 0 };
  }

  contains(target) {
    if (target === this) {
      return true;
    }
    return this.children.some((child) => child && typeof child.contains === 'function' && child.contains(target));
  }

  blur() {
    this.blurred = true;
  }
}

function createFakeDocument() {
  const fakeDocument = {
    activeElement: null,
    defaultView: null,
    createElement(tagName) {
      const element = new FakeElement(tagName);
      element.ownerDocument = fakeDocument;
      return element;
    }
  };
  return fakeDocument;
}

function createOnChangedEmitter() {
  const listeners = [];
  return {
    addListener(listener) {
      listeners.push(listener);
    },
    removeListener(listener) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    },
    emit(changes, areaName) {
      listeners.slice().forEach((listener) => listener(changes, areaName));
    },
    get count() {
      return listeners.length;
    }
  };
}

function createStorageArea(store, areaName, onChanged) {
  return {
    get(keys, callback) {
      const result = {};
      keys.forEach((key) => {
        result[key] = store[key];
      });
      callback(result);
    },
    set(values, callback) {
      const changes = {};
      Object.keys(values).forEach((key) => {
        changes[key] = {
          oldValue: store[key],
          newValue: values[key]
        };
      });
      Object.assign(store, values);
      onChanged.emit(changes, areaName);
      if (typeof callback === 'function') {
        callback();
      }
    }
  };
}

function createStorageBackedChrome(localStore, syncStore, version) {
  const onChanged = createOnChangedEmitter();
  return {
    runtime: {
      lastError: null,
      getManifest() {
        return { version };
      }
    },
    storage: {
      onChanged,
      local: createStorageArea(localStore, 'local', onChanged),
      sync: createStorageArea(syncStore, 'sync', onChanged)
    }
  };
}

function flushMicrotasks() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

(async () => {
  assert.strictEqual(updateNotice.normalizeVersionTag('0.9.10'), 'v0.9.10');
  assert.strictEqual(updateNotice.normalizeVersionTag('v0.9.10'), 'v0.9.10');
  assert.strictEqual(updateNotice.formatVersionLabel('v0.9.10'), '0.9.10');

  const normalized = updateNotice.normalizeUpdateNoticePayload({
    version: '0.9.10',
    previousVersion: '0.9.9',
    title: 'Release title from GitHub',
    releaseUrl: 'https://example.com/release/?version=v0.9.10',
    reason: 'update',
    updatedAt: 10
  });
  assert.strictEqual(normalized.version, 'v0.9.10');
  assert.strictEqual(normalized.title, 'Release title from GitHub');
  assert.strictEqual(updateNotice.shouldShowUpdateNotice(normalized, '0.9.10'), true);
  assert.strictEqual(updateNotice.shouldShowUpdateNotice(normalized, '0.9.9'), false);
  const fetchedTitle = await updateNotice.fetchReleaseTitle('0.9.10', {
    fetchImpl(url, init) {
      assert.strictEqual(
        url,
        'https://api.github.com/repos/kubai087/lumno-extension/releases/tags/0.9.10'
      );
      assert.strictEqual(init.headers.Accept, 'application/vnd.github+json');
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({ tag_name: 'v0.9.10', name: 'Release title from GitHub' });
        }
      });
    }
  });
  assert.strictEqual(fetchedTitle, 'Release title from GitHub', 'release title should come from the GitHub release');
  const fallbackRequests = [];
  const fallbackTitle = await updateNotice.fetchReleaseTitle('v0.9.10', {
    fetchImpl(url) {
      fallbackRequests.push(url);
      if (url.endsWith('/v0.9.10')) {
        return Promise.resolve({
          ok: false,
          json() {
            return Promise.resolve({});
          }
        });
      }
      if (url.endsWith('/0.9.10')) {
        return Promise.resolve({
          ok: true,
          json() {
            return Promise.resolve({ tag_name: '0.9.10', name: 'Minor Bug Fixes' });
          }
        });
      }
      throw new Error(`unexpected release URL ${url}`);
    }
  });
  assert.strictEqual(fallbackTitle, 'Minor Bug Fixes', 'release title lookup should support tags without a v prefix');
  assert.deepStrictEqual(
    fallbackRequests,
    [
      'https://api.github.com/repos/kubai087/lumno-extension/releases/tags/v0.9.10',
      'https://api.github.com/repos/kubai087/lumno-extension/releases/tags/0.9.10'
    ],
    'release title lookup should try the normalized tag and then the bare version tag'
  );
  const htmlFallbackTitle = await updateNotice.fetchReleaseTitle('v0.9.10', {
    fetchImpl(url) {
      if (url.startsWith('https://api.github.com/')) {
        return Promise.resolve({
          ok: false,
          json() {
            return Promise.resolve({});
          }
        });
      }
      if (url.endsWith('/v0.9.10')) {
        return Promise.resolve({
          ok: false,
          text() {
            return Promise.resolve('');
          }
        });
      }
      if (url.endsWith('/0.9.10')) {
        return Promise.resolve({
          ok: true,
          text() {
            return Promise.resolve('<title>Release Minor Bug Fixes · kubai087/lumno-extension · GitHub</title>');
          }
        });
      }
      throw new Error(`unexpected release URL ${url}`);
    }
  });
  assert.strictEqual(
    htmlFallbackTitle,
    'Minor Bug Fixes',
    'release title lookup should fall back to the GitHub release page title when the API is unavailable'
  );
  const publishWrites = [];
  const publishChromeApi = {
    runtime: {
      lastError: null,
      getManifest() {
        return { version: '0.9.10' };
      }
    },
    storage: {
      sync: {
        get(keys, callback) {
          const result = {};
          keys.forEach((key) => {
            result[key] = undefined;
          });
          callback(result);
        },
        set(values, callback) {
          publishWrites.push(values[updateNotice.UPDATE_NOTICE_STORAGE_KEY]);
          if (typeof callback === 'function') {
            callback();
          }
        }
      }
    }
  };
  await updateNotice.publishUpdateNotice({
    chromeApi: publishChromeApi,
    version: 'v0.9.10',
    previousVersion: '0.9.9',
    reason: 'update',
    fetchImpl() {
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({ tag_name: '0.9.10', name: 'Minor Bug Fixes' });
        }
      });
    }
  });
  assert.strictEqual(publishWrites.length, 1, 'update notice publishing should write once after title lookup');
  assert.strictEqual(
    publishWrites[0].title,
    'Minor Bug Fixes',
    'published update notice should include the GitHub release title'
  );

  const newtabSource = fs.readFileSync('src/newtab/newtab.js', 'utf8');
  assert.strictEqual(
    newtabSource.includes('searchLayer.appendChild(updateNoticeController.element)'),
    false,
    'newtab update notice should not be appended inside the search layer'
  );
  const newtabRootAppendIndex = newtabSource.indexOf('root.appendChild(searchLayer)');
  const newtabNoticeInsertIndex = newtabSource.indexOf('document.body.insertBefore(updateNoticeController.element, newtabUpdateNoticeAnchor)');
  assert(
    newtabRootAppendIndex !== -1 &&
      newtabNoticeInsertIndex !== -1 &&
      newtabRootAppendIndex < newtabNoticeInsertIndex,
    'newtab update notice should be appended below the input search layer and outside it'
  );
  const overlaySource = fs.readFileSync('src/overlay/search-panel.js', 'utf8');
  assert.strictEqual(
    overlaySource.includes('overlay.appendChild(overlayUpdateNoticeController.element)'),
    false,
    'overlay update notice should not be appended inside the overlay panel'
  );
  const overlayNoticeAppendIndex = overlaySource.indexOf('overlayStyleRoot.insertBefore(noticeElement, overlay)');
  const overlayInputAppendIndex = overlaySource.indexOf('overlay.appendChild(inputContainer)');
  const overlayRevealIndex = overlaySource.indexOf('const revealOverlay = () =>');
  const overlayScheduledMountIndex = overlaySource.indexOf('scheduleOverlayUpdateNoticeMount(360)');
  const overlayMountingSetIndex = overlaySource.indexOf("noticeElement.setAttribute('data-overlay-mounting', 'true')");
  const overlayMountingFinishIndex = overlaySource.indexOf('finishOverlayUpdateNoticeMountAnimation(noticeElement)');
  assert(
    overlayNoticeAppendIndex !== -1 &&
      overlayInputAppendIndex !== -1 &&
      overlayNoticeAppendIndex < overlayInputAppendIndex,
    'overlay update notice should be mounted outside and above the overlay panel'
  );
  assert(
    overlayRevealIndex !== -1 &&
      overlayScheduledMountIndex !== -1 &&
      overlayRevealIndex < overlayScheduledMountIndex,
    'overlay update notice should be mounted after the overlay enter animation starts'
  );
  assert(
    overlayMountingSetIndex !== -1 &&
      overlayMountingFinishIndex !== -1 &&
      overlayMountingSetIndex < overlayNoticeAppendIndex,
    'overlay update notice should enter with a temporary mount animation state before insertion'
  );
  const updateNoticeCss = fs.readFileSync('src/shared/feature-hints.css', 'utf8');
  assert(
    updateNoticeCss.includes('.x-lumno-feature-hint--update-notice-overlay') &&
      updateNoticeCss.includes('position: fixed;') &&
      updateNoticeCss.includes('border-radius: 999px;'),
    'update notice should use fixed overlay placement and capsule styling'
  );
  assert(
    updateNoticeCss.includes('transform: translateX(-50%) translateY(calc(-100% + 2px)) scale(0.985);') &&
      updateNoticeCss.includes('transform: translateX(-50%) translateY(calc(-100% - 8px)) scale(1);') &&
      updateNoticeCss.includes('filter: blur(6px);'),
    'overlay update notice should use the same vertical blur/scale enter motion as the overlay'
  );
  assert(
    updateNoticeCss.includes('.x-lumno-feature-hint--update-notice-overlay[data-overlay-mounting="true"]') &&
      updateNoticeCss.includes('filter: blur(8px);') &&
      updateNoticeCss.includes('pointer-events: none;'),
    'overlay update notice should blur in when it is mounted'
  );
  assert(
    updateNoticeCss.includes('gap: 3px;') &&
      updateNoticeCss.includes('padding: 2px 10px 2px 2px;'),
    'update notice badge should keep the badge left inset equal to its vertical inset'
  );
  assert(
    updateNoticeCss.includes('.x-lumno-feature-hint__badge-icon[data-icon-type="text"]') &&
      updateNoticeCss.includes('width: 22px;') &&
      updateNoticeCss.includes('padding-inline-start: 4px;') &&
      updateNoticeCss.includes('justify-content: flex-end;'),
    'text badge icons should reserve visual space before wide emoji glyphs'
  );
  const featureHintsSource = fs.readFileSync('src/shared/feature-hints.js', 'utf8');
  const updateNoticeSource = fs.readFileSync('src/shared/update-notice.js', 'utf8');
  assert(
    updateNoticeSource.includes("badgeIconText: '🦋'") &&
      featureHintsSource.includes('definition.badgeIconText') &&
      featureHintsSource.includes("badgeIcon.setAttribute('data-icon-type', 'text')"),
    'update notice butterfly should use the component badge icon slot'
  );

  const firstDismissKey = updateNotice.getUpdateNoticeDismissKey(featureHints, '0.9.10');
  const nextDismissKey = updateNotice.getUpdateNoticeDismissKey(featureHints, '0.9.11');
  assert(firstDismissKey.includes('update_notice'), 'dismiss key should be scoped to the update notice');
  assert.notStrictEqual(firstDismissKey, nextDismissKey, 'dismiss key should change per version');

  const syncStore = {
    [updateNotice.UPDATE_NOTICE_STORAGE_KEY]: normalized
  };
  const chromeApi = createStorageBackedChrome({}, syncStore, '0.9.10');
  const detailsClicks = [];
  const firstController = updateNotice.createUpdateNotice({
    documentObj: createFakeDocument(),
    featureHints,
    chromeApi,
    t(key, fallback) {
      if (key === 'update_notice_badge') {
        return '🦋 已更新至 {version}';
      }
      return fallback;
    },
    getRiSvg() {
      return '';
    },
    onDetailsClick(notice) {
      detailsClicks.push(notice);
    }
  });
  const secondController = updateNotice.createUpdateNotice({
    documentObj: createFakeDocument(),
    featureHints,
    chromeApi,
    t(key, fallback) {
      return fallback;
    },
    getRiSvg() {
      return '';
    }
  });

  assert(firstController, 'first update notice should be created');
  assert(secondController, 'second update notice should be created');
  await flushMicrotasks();
  await flushMicrotasks();

  assert.strictEqual(
    firstController.element.getAttribute('data-visible'),
    'true',
    'current update notice should become visible'
  );
  assert.strictEqual(firstController.element.children[0].children[0].textContent, '🦋');
  assert.strictEqual(firstController.element.children[0].children[1].textContent, '已更新至 0.9.10');
  assert.strictEqual(firstController.element.children[1].textContent, 'Release title from GitHub');
  assert.strictEqual(firstController.element.children[2].children[0].textContent, '更新日志');

  firstController.element.children[2].listeners.click({
    preventDefault() {},
    stopPropagation() {}
  });
  assert.strictEqual(detailsClicks.length, 1, 'details button should call the details handler');
  assert.strictEqual(detailsClicks[0].version, 'v0.9.10');

  firstController.dismiss();
  await flushMicrotasks();
  assert.strictEqual(
    syncStore[firstDismissKey],
    true,
    'dismissing should persist the current version dismiss marker'
  );
  assert.strictEqual(
    secondController.element.getAttribute('data-visible'),
    'false',
    'dismissing one update notice should hide the other current-version instance'
  );

  const oldChromeApi = createStorageBackedChrome({}, {
    [updateNotice.UPDATE_NOTICE_STORAGE_KEY]: normalized
  }, '0.9.9');
  const oldController = updateNotice.createUpdateNotice({
    documentObj: createFakeDocument(),
    featureHints,
    chromeApi: oldChromeApi,
    t(key, fallback) {
      return fallback;
    },
    getRiSvg() {
      return '';
    }
  });
  assert(oldController, 'old-version update notice controller should still be creatable');
  await flushMicrotasks();
  await flushMicrotasks();
  assert.strictEqual(
    oldController.element.getAttribute('data-visible'),
    'false',
    'notice should not show when the stored update is for a different version'
  );

  const missingTitleStore = {
    [updateNotice.UPDATE_NOTICE_STORAGE_KEY]: updateNotice.normalizeUpdateNoticePayload({
      version: '0.9.10',
      previousVersion: '0.9.9',
      reason: 'update',
      updatedAt: 11
    })
  };
  const missingTitleChromeApi = createStorageBackedChrome({}, missingTitleStore, '0.9.10');
  const hydratedController = updateNotice.createUpdateNotice({
    documentObj: createFakeDocument(),
    featureHints,
    chromeApi: missingTitleChromeApi,
    fetchImpl() {
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({ tag_name: '0.9.10', name: 'Minor Bug Fixes' });
        }
      });
    },
    t(key, fallback) {
      return fallback;
    },
    getRiSvg() {
      return '';
    }
  });
  assert(hydratedController, 'missing-title update notice controller should be created');
  await flushMicrotasks();
  await flushMicrotasks();
  await flushMicrotasks();
  assert.strictEqual(
    hydratedController.element.children[1].textContent,
    'Minor Bug Fixes',
    'visible update notice should hydrate a missing release title'
  );
  assert.strictEqual(
    missingTitleStore[updateNotice.UPDATE_NOTICE_STORAGE_KEY].title,
    'Minor Bug Fixes',
    'hydrated release title should be persisted for all surfaces'
  );

  firstController.destroy();
  secondController.destroy();
  oldController.destroy();
  hydratedController.destroy();
  assert.strictEqual(chromeApi.storage.onChanged.count, 0, 'destroy should detach storage listeners');

  console.log('update notice tests passed');
})();
