const assert = require('assert');

delete globalThis.LumnoOverlayLifecycle;
require('../src/overlay/lifecycle.js');

const lifecycle = globalThis.LumnoOverlayLifecycle;

function createStyleSink() {
  const values = new Map();
  return {
    setProperty(name, value, priority) {
      values.set(name, {
        value: String(value),
        priority: priority || ''
      });
    },
    getPropertyValue(name) {
      return values.has(name) ? values.get(name).value : '';
    },
    getPropertyPriority(name) {
      return values.has(name) ? values.get(name).priority : '';
    }
  };
}

function createOverlayElement() {
  return {
    isConnected: true,
    style: createStyleSink()
  };
}

function createFakeWindow(options) {
  const settings = options || {};
  const windowListeners = new Map();
  const visualViewportListeners = new Map();
  const win = {
    devicePixelRatio: Number(settings.devicePixelRatio) || 1,
    innerWidth: Number(settings.innerWidth) || 1200,
    innerHeight: Number(settings.innerHeight) || 800,
    document: {
      documentElement: {
        clientWidth: Number(settings.innerWidth) || 1200,
        clientHeight: Number(settings.innerHeight) || 800
      }
    },
    addEventListener(type, handler) {
      windowListeners.set(type, handler);
    },
    removeEventListener(type, handler) {
      if (windowListeners.get(type) === handler) {
        windowListeners.delete(type);
      }
    },
    visualViewport: {
      width: Number(settings.visualWidth) || Number(settings.innerWidth) || 1200,
      height: Number(settings.visualHeight) || Number(settings.innerHeight) || 800,
      scale: Number(settings.visualScale) || 1,
      addEventListener(type, handler) {
        visualViewportListeners.set(type, handler);
      },
      removeEventListener(type, handler) {
        if (visualViewportListeners.get(type) === handler) {
          visualViewportListeners.delete(type);
        }
      }
    },
    triggerWindowResize() {
      const handler = windowListeners.get('resize');
      if (handler) {
        handler();
      }
    },
    triggerVisualViewportResize() {
      const handler = visualViewportListeners.get('resize');
      if (handler) {
        handler();
      }
    }
  };
  return win;
}

assert.ok(
  lifecycle && typeof lifecycle.createViewportSizeSync === 'function',
  'overlay lifecycle should expose viewport size synchronization'
);

{
  const win = createFakeWindow({
    innerWidth: 1200,
    innerHeight: 800,
    visualWidth: 600,
    visualHeight: 400,
    visualScale: 2
  });
  const overlay = createOverlayElement();
  const sync = lifecycle.createViewportSizeSync(win, {
    getSizePreset: () => ({ width: 760, maxHeightVh: 75, uiScale: 1 }),
    getRequestedTabZoomFactor: () => 1
  });

  sync.start(overlay);

  assert.strictEqual(
    overlay.style.getPropertyValue('zoom'),
    '0.5',
    'overlay should reverse visual viewport pinch zoom so cmd+wheel does not magnify it'
  );
  assert.strictEqual(
    overlay.style.getPropertyValue('max-width'),
    '1176px',
    'overlay max-width should use the scaled visual viewport width so pinch zoom does not shrink the panel'
  );
}

{
  const win = createFakeWindow({
    innerWidth: 1200,
    innerHeight: 800,
    visualWidth: 1200,
    visualHeight: 800,
    visualScale: 1
  });
  const overlay = createOverlayElement();
  const sync = lifecycle.createViewportSizeSync(win, {
    getSizePreset: () => ({ width: 760, maxHeightVh: 75, uiScale: 1 }),
    getRequestedTabZoomFactor: () => 1
  });

  sync.start(overlay);
  assert.strictEqual(overlay.style.getPropertyValue('zoom'), '1');

  win.visualViewport.width = 600;
  win.visualViewport.height = 400;
  win.visualViewport.scale = 2;
  win.triggerVisualViewportResize();

  assert.strictEqual(
    overlay.style.getPropertyValue('zoom'),
    '0.5',
    'overlay should resync when cmd+wheel changes visual viewport scale after mounting'
  );
}

console.log('overlay viewport size sync tests passed');
