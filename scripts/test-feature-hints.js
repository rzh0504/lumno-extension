const assert = require('assert');
const featureHints = require('../src/shared/feature-hints.js');

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

function createStorageBackedChrome(store) {
  const local = {
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
  return {
    runtime: { lastError: null },
    storage: { local }
  };
}

function flushMicrotasks() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

(async () => {
  assert.strictEqual(
    featureHints.normalizeDismissStorage('local'),
    'local',
    'local dismiss storage should be supported'
  );

  const store = {};
  const chromeApi = createStorageBackedChrome(store);
  let resizeObserverDisconnects = 0;
  const fakeWindow = {
    ResizeObserver: class FakeResizeObserver {
      observe() {}
      disconnect() {
        resizeObserverDisconnects += 1;
      }
    }
  };
  const localKey = featureHints.getFeatureHintLocalDismissKey('newtab-ai-quick-jump');
  const sessionKey = featureHints.getFeatureHintSessionDismissKey('newtab-ai-quick-jump');
  assert.notStrictEqual(localKey, sessionKey, 'local and session dismiss keys should not collide');

  const firstDocument = createFakeDocument();
  const firstController = featureHints.createFeatureHint({
    documentObj: firstDocument,
    definition: 'newtab-ai-quick-jump',
    chromeApi,
    windowObj: fakeWindow,
    t: (key, fallback) => fallback,
    getRiSvg: () => ''
  });
  assert(firstController, 'first feature hint should be created');
  await flushMicrotasks();

  assert.strictEqual(
    firstController.element.getAttribute('data-visible'),
    'true',
    'first feature hint should become visible after storage loads'
  );
  assert.strictEqual(
    store[localKey],
    true,
    'first visible render should persist a local dismissal marker'
  );
  assert.strictEqual(firstController.element.inert, false, 'visible feature hint should not be inert');

  const closeButton = firstController.element.children[firstController.element.children.length - 1];
  firstDocument.activeElement = closeButton;
  firstController.dismiss();
  assert.strictEqual(closeButton.blurred, true, 'focused feature hint control should blur on dismiss');
  assert.strictEqual(firstController.element.inert, true, 'dismissed feature hint should become inert');
  assert.strictEqual(resizeObserverDisconnects, 1, 'dismissed feature hint should disconnect layout observer');

  const secondController = featureHints.createFeatureHint({
    documentObj: createFakeDocument(),
    definition: 'newtab-ai-quick-jump',
    chromeApi,
    t: (key, fallback) => fallback,
    getRiSvg: () => ''
  });
  assert(secondController, 'second feature hint should be created');
  await flushMicrotasks();

  assert.strictEqual(
    secondController.element.getAttribute('data-visible'),
    'false',
    'second feature hint should stay hidden after the first one was remembered'
  );
  assert.strictEqual(
    secondController.element.getAttribute('data-dismissed'),
    'true',
    'second feature hint should load the local dismissed state'
  );

  console.log('feature hint tests passed');
})();
