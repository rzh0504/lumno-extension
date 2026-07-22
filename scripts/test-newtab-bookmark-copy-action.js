const assert = require('assert');
const fs = require('fs');
const path = require('path');

require(path.join('..', 'src', 'newtab', 'bookmarks-view.js'));

const repoRoot = path.resolve(__dirname, '..');
const { createBookmarksView } = globalThis.LumnoNewtabBookmarksView;

function createElement(tagName) {
  const listeners = new Map();
  const attributes = new Map();
  const classes = new Set();
  const element = {
    tagName: String(tagName || '').toUpperCase(),
    children: [],
    style: {
      setProperty() {}
    },
    classList: {
      add(...names) {
        names.forEach((name) => classes.add(name));
      },
      remove(...names) {
        names.forEach((name) => classes.delete(name));
      },
      toggle(name, force) {
        if (force) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      },
      contains(name) {
        return classes.has(name);
      }
    },
    set className(value) {
      classes.clear();
      String(value || '').split(/\s+/).filter(Boolean).forEach((name) => classes.add(name));
    },
    get className() {
      return Array.from(classes).join(' ');
    },
    appendChild(child) {
      child.parentNode = element;
      element.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) || '';
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    addEventListener(type, listener) {
      listeners.set(type, [...(listeners.get(type) || []), listener]);
    },
    dispatch(type, values) {
      const event = Object.assign({
        type,
        target: element,
        preventDefault() {},
        stopPropagation() {}
      }, values || {});
      (listeners.get(type) || []).forEach((listener) => listener(event));
    },
    querySelector(selector) {
      const className = selector.startsWith('.') ? selector.slice(1) : '';
      const visit = (node) => {
        if (className && node.classList && node.classList.contains(className)) {
          return node;
        }
        for (const child of node.children || []) {
          const match = visit(child);
          if (match) {
            return match;
          }
        }
        return null;
      };
      return visit(element);
    }
  };
  return element;
}

function createView(copyCalls) {
  return createBookmarksView({
    documentObj: { createElement },
    windowObj: { setTimeout, clearTimeout },
    t: (_key, fallback) => fallback || '',
    formatMessage: (_key, fallback, values) => fallback.replace('{title}', values.title),
    sanitizeDisplayText: (value) => String(value || ''),
    getHostFromUrl: () => 'example.com',
    getSiteDisplayName: (_host, title) => title,
    getUrlDisplay: (url) => url,
    getRiSvg: () => '<svg></svg>',
    getFigmaFolderSvg: () => '<svg></svg>',
    initFolderPathMorph() {},
    playFolderPathMorph() {},
    attachFaviconWithFallbacks() {},
    getImmediateThemeForSuggestion: () => null,
    queueThemeForTarget() {},
    applyCardTheme() {},
    bindCursorTooltip() {},
    hideCursorTooltip() {},
    shouldDelayHoverFromRecent: () => false,
    openUrl() {},
    openFolder() {},
    openFolderMenu() {},
    copyUrl(url) {
      copyCalls.push(url);
      return Promise.resolve(true);
    }
  });
}

async function testBookmarkCopyAction() {
  const copyCalls = [];
  const card = createView(copyCalls).buildCard({
    id: 'docs',
    type: 'bookmark',
    title: 'A very long bookmark title',
    url: 'https://example.com/docs'
  }, 0, { menuMode: false });
  const copyButton = card.querySelector('.x-nt-bookmark-copy-action');

  assert.ok(copyButton, 'URL bookmarks should render a copy action');
  assert.strictEqual(card.getAttribute('data-bookmark-copy-action-visible'), '');

  copyButton.dispatch('pointerenter');
  assert.strictEqual(card.getAttribute('data-bookmark-copy-action-visible'), 'true');

  copyButton.dispatch('click');
  await Promise.resolve();
  await Promise.resolve();
  assert.deepStrictEqual(copyCalls, ['https://example.com/docs']);

  copyButton.dispatch('pointerleave');
  assert.strictEqual(card.getAttribute('data-bookmark-copy-action-visible'), '');
}

function testFoldersDoNotRenderCopyAction() {
  const card = createView([]).buildCard({
    id: 'folder',
    type: 'folder',
    title: 'Folder'
  }, 0, { menuMode: true });

  assert.strictEqual(card.querySelector('.x-nt-bookmark-copy-action'), null);
}

function testCopyActionIntegration() {
  const html = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.html'), 'utf8');
  const cascadeSource = fs.readFileSync(path.join(repoRoot, 'src/newtab/bookmark-cascade-menu.js'), 'utf8');
  const newtabSource = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');

  assert.match(
    html,
    /\.x-nt-bookmark-card\[data-bookmark-copy-action-visible="true"\] \.x-nt-bookmark-title[\s\S]*?padding-right:\s*30px/,
    'Visible copy actions should reserve space before long card titles are truncated'
  );
  assert.match(
    html,
    /\.x-nt-bookmark-cascade-row\[data-bookmark-copy-action-visible="true"\] \.x-nt-bookmark-cascade-label[\s\S]*?padding-right:\s*32px/,
    'Visible cascade copy actions should reserve space before long labels are truncated'
  );
  assert.match(
    html,
    /\.x-nt-bookmark-cascade-content[\s\S]*?scrollbar-gutter:\s*auto/,
    'Short cascade menus should not reserve an empty scrollbar gutter'
  );
  assert.match(cascadeSource, /x-nt-bookmark-cascade-copy-trigger/);
  assert.match(
    cascadeSource,
    /showTopActionTooltip\(copyButton, copyLabel, \{ placement: 'top' \}\)/,
    'Cascade copy actions should explain themselves with a Copy link tooltip'
  );
  assert.doesNotMatch(
    cascadeSource,
    /x-nt-bookmark-cascade-copy-action/,
    'Cascade copy actions should use their independent trigger implementation'
  );
  assert.match(newtabSource, /copyUrl: copyBookmarkUrl/);
  assert.doesNotMatch(html, /bookmark-context-menu\.js/);
}

Promise.resolve()
  .then(testBookmarkCopyAction)
  .then(() => {
    testFoldersDoNotRenderCopyAction();
    testCopyActionIntegration();
    process.stdout.write('newtab bookmark copy action tests passed\n');
  })
  .catch((error) => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exit(1);
  });
