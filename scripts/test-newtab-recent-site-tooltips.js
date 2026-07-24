const assert = require('assert');
const path = require('path');

require(path.join('..', 'src', 'newtab', 'recent-sites-view.js'));

function createFakeElement(tagName) {
  const attributes = new Map();
  const listeners = new Map();
  const classes = new Set();
  return {
    tagName: String(tagName || '').toUpperCase(),
    children: [],
    className: '',
    textContent: '',
    title: '',
    tabIndex: 0,
    innerHTML: '',
    style: {
      setProperty() {},
      removeProperty() {}
    },
    classList: {
      add(...names) {
        names.forEach((name) => classes.add(name));
      },
      remove(...names) {
        names.forEach((name) => classes.delete(name));
      },
      contains(name) {
        return classes.has(name);
      }
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    appendChild(child) {
      this.children.push(child);
      child.parentElement = this;
      return child;
    },
    addEventListener(type, listener) {
      const handlers = listeners.get(type) || [];
      handlers.push(listener);
      listeners.set(type, handlers);
    },
    removeEventListener() {},
    dispatchEvent(event) {
      const normalizedEvent = event || {};
      normalizedEvent.target = normalizedEvent.target || this;
      normalizedEvent.currentTarget = this;
      (listeners.get(normalizedEvent.type) || []).forEach((listener) => {
        listener.call(this, normalizedEvent);
      });
      return true;
    }
  };
}

async function testRecentTitleTooltipOnlyShowsForTruncatedText() {
  const documentObj = {
    visibilityState: 'visible',
    createElement: createFakeElement,
    addEventListener() {},
    removeEventListener() {}
  };
  const grid = createFakeElement('div');
  const tooltipBindings = [];
  const openedUrls = [];
  let cursorTooltipHideCount = 0;
  const view = globalThis.LumnoNewtabRecentSitesView.createRecentSitesView({
    documentObj,
    windowObj: {
      setTimeout,
      clearTimeout,
      addEventListener() {},
      removeEventListener() {}
    },
    grid,
    cards: [],
    t: (_key, fallback) => fallback || '',
    formatMessage: (_key, fallback, values) => fallback.replace('{title}', values.title),
    sanitizeDisplayText: (text) => String(text || ''),
    getHostFromUrl: (url) => new URL(url).hostname,
    getSiteDisplayName: () => 'Tencent',
    getUrlDisplay: (url) => url,
    getRiSvg: () => '',
    attachFaviconWithFallbacks() {},
    getBrowserPageFaviconUrl: () => '',
    getImmediateThemeForSuggestion: () => null,
    queueThemeForTarget() {},
    applyCardTheme() {},
    updatePinButton() {},
    updateDismissButton() {},
    bindCursorTooltip(target, getText, options) {
      tooltipBindings.push({ target, getText, options });
    },
    hideCursorTooltip() {
      cursorTooltipHideCount += 1;
    },
    openUrl(url, options) {
      openedUrls.push({ url, options });
    }
  });

  view.render([{
    title: '查看仪表盘 · 仪表盘 · 日志服务 - 控制台',
    url: 'https://console.cloud.tencent.com/cls'
  }], {});

  const card = grid.children[0];
  const title = card.children[0].children.find((child) => child.className === 'x-nt-recent-title');
  const binding = tooltipBindings[0];

  assert.ok(binding, 'recent card should bind its cursor tooltip');
  assert.strictEqual(title.title, '', 'recent title should not have an unconditional native tooltip');

  title.clientWidth = 180;
  title.scrollWidth = 180;
  title.clientHeight = 48;
  title.scrollHeight = 48;
  assert.strictEqual(
    binding.options.shouldShow(card),
    false,
    'fully visible recent titles should not show the tooltip'
  );

  title.scrollHeight = 64;
  assert.strictEqual(
    binding.options.shouldShow(card),
    true,
    'vertically clamped recent titles should show the tooltip'
  );

  title.scrollHeight = 48;
  title.scrollWidth = 240;
  assert.strictEqual(
    binding.options.shouldShow(card),
    true,
    'horizontally clipped recent titles should show the tooltip'
  );

  const clickEvent = {
    type: 'click',
    metaKey: true,
    preventDefault() {},
    stopPropagation() {}
  };
  const hideCountBeforeActivation = cursorTooltipHideCount;
  card.dispatchEvent(clickEvent);
  assert.strictEqual(openedUrls.length, 1, 'activating a recent card should open its URL');
  assert.ok(
    cursorTooltipHideCount > hideCountBeforeActivation,
    'activating a recent card should immediately hide its cursor tooltip'
  );
  assert.strictEqual(
    binding.options.shouldShow(card),
    false,
    'the tooltip should stay suppressed immediately after card activation'
  );

  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.strictEqual(
    binding.options.shouldShow(card),
    false,
    'the tooltip should not retrigger while the pointer remains on the activated card'
  );

  card.dispatchEvent({ type: 'pointerleave' });
  assert.strictEqual(
    binding.options.shouldShow(card),
    true,
    'leaving the card should restore tooltip eligibility for a later visit'
  );

  card.dispatchEvent(clickEvent);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.strictEqual(binding.options.shouldShow(card), false);
  card.dispatchEvent({ type: 'blur' });
  assert.strictEqual(
    binding.options.shouldShow(card),
    true,
    'moving keyboard focus away should restore tooltip eligibility'
  );
}

testRecentTitleTooltipOnlyShowsForTruncatedText()
  .then(() => {
    console.log('newtab recent-site tooltip tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
