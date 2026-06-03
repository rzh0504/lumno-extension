const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

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
    style: {
      setProperty() {},
      removeProperty() {}
    },
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
    addEventListener() {},
    removeEventListener() {},
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

const documentObj = createFakeDocument();
const windowObj = {
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
  matchMedia() {
    return {
      matches: false,
      addEventListener() {},
      removeEventListener() {}
    };
  }
};

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
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

console.log('newtab wallpaper panel tests passed');
