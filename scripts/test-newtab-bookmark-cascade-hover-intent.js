const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const newtabJs = fs.readFileSync(path.join(repoRoot, 'src', 'newtab', 'newtab.js'), 'utf8');
const newtabHtml = fs.readFileSync(path.join(repoRoot, 'src', 'newtab', 'newtab.html'), 'utf8');
const cascadeMenuJs = fs.readFileSync(path.join(repoRoot, 'src', 'newtab', 'bookmark-cascade-menu.js'), 'utf8');
const {
  buildCascadeSafeTriangle,
  isPointInsideCascadeSafeTriangle
} = require(path.join(repoRoot, 'src', 'newtab', 'bookmark-cascade-position.js'));
const {
  createBookmarkCascadeMenuRuntime
} = require(path.join(repoRoot, 'src', 'newtab', 'bookmark-cascade-menu.js'));

function assertContains(source, needle, message) {
  assert.ok(source.includes(needle), message);
}

function getCssRuleBody(source, selector) {
  const selectorIndex = source.indexOf(selector);
  assert.ok(selectorIndex >= 0, `${selector} rule should exist`);
  const braceStart = source.indexOf('{', selectorIndex);
  assert.ok(braceStart >= 0, `${selector} rule should have a body`);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart + 1, index);
      }
    }
  }
  throw new Error(`${selector} rule should be parseable`);
}

function getCssZIndex(source, selector) {
  const body = getCssRuleBody(source, selector);
  const match = body.match(/z-index:\s*(-?\d+)/);
  assert.ok(match, `${selector} should define a z-index`);
  return Number.parseInt(match[1], 10);
}

function getJsConstNumber(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\d+)\\s*;`));
  assert.ok(match, `${name} should be defined as a numeric constant`);
  return Number.parseInt(match[1], 10);
}

assert.strictEqual(
  typeof buildCascadeSafeTriangle,
  'function',
  'cascade positioning should expose a safe-triangle builder'
);
assert.strictEqual(
  typeof isPointInsideCascadeSafeTriangle,
  'function',
  'cascade positioning should expose safe-triangle hit testing'
);
assert.strictEqual(
  typeof createBookmarkCascadeMenuRuntime,
  'function',
  'bookmark cascade menu should expose a reusable runtime factory'
);

{
  const triangle = buildCascadeSafeTriangle({
    pointer: { x: 100, y: 120 },
    submenuRect: { left: 220, right: 420, top: 80, bottom: 220 },
    side: 'right'
  });

  assert.deepStrictEqual(
    triangle,
    [
      { x: 100, y: 120 },
      { x: 220, y: 80 },
      { x: 220, y: 220 }
    ],
    'right-opening submenus should use the submenu left edge as the safe-triangle base'
  );
  assert.ok(
    isPointInsideCascadeSafeTriangle({ x: 180, y: 128 }, triangle),
    'points inside the right-opening safe triangle should be protected'
  );
  assert.ok(
    !isPointInsideCascadeSafeTriangle({ x: 180, y: 40 }, triangle),
    'points outside the right-opening safe triangle should not be protected'
  );
}

{
  const triangle = buildCascadeSafeTriangle({
    pointer: { x: 500, y: 220 },
    submenuRect: { left: 120, right: 320, top: 160, bottom: 360 },
    side: 'left'
  });

  assert.deepStrictEqual(
    triangle,
    [
      { x: 500, y: 220 },
      { x: 320, y: 160 },
      { x: 320, y: 360 }
    ],
    'left-opening submenus should use the submenu right edge as the safe-triangle base'
  );
  assert.ok(
    isPointInsideCascadeSafeTriangle({ x: 410, y: 230 }, triangle),
    'points inside the left-opening safe triangle should be protected'
  );
  assert.ok(
    !isPointInsideCascadeSafeTriangle({ x: 410, y: 120 }, triangle),
    'points outside the left-opening safe triangle should not be protected'
  );
}

assertContains(
  cascadeMenuJs,
  'BOOKMARK_CASCADE_HOVER_DELAY_MS',
  'bookmark cascade menus should use a hover delay before pointer-triggered activation'
);
assertContains(
  cascadeMenuJs,
  'BOOKMARK_CASCADE_CLOSE_DELAY_MS',
  'bookmark cascade menus should use a delayed close after pointer exit'
);
assertContains(
  cascadeMenuJs,
  'BOOKMARK_CASCADE_SAFE_RECHECK_MS',
  'bookmark cascade menus should recheck safe-triangle protection before switching'
);
assertContains(
  cascadeMenuJs,
  'BOOKMARK_CASCADE_SAFE_MAX_MS',
  'bookmark cascade menus should keep safe-triangle protection independent from the first hover delay'
);
assert.ok(
  getJsConstNumber(cascadeMenuJs, 'BOOKMARK_CASCADE_SAFE_MAX_MS') >
    getJsConstNumber(cascadeMenuJs, 'BOOKMARK_CASCADE_HOVER_DELAY_MS'),
  'safe-triangle protection should be allowed to outlive the initial hover delay'
);
assertContains(
  cascadeMenuJs,
  'safeUntil: scheduledAt + BOOKMARK_CASCADE_SAFE_MAX_MS',
  'safe-triangle protection should use its own max window instead of expiring at hover-delay completion'
);
assertContains(
  newtabJs,
  'BOOKMARK_CASCADE_DEBUG_STORAGE_KEY',
  'newtab should keep the bookmark cascade debug storage key for future maintenance'
);
assertContains(
  newtabJs,
  'const BOOKMARK_CASCADE_DEBUG_UI_ENABLED = false;',
  'bookmark cascade debug UI should be hidden behind a single disabled maintenance flag'
);
assertContains(
  newtabJs,
  'BOOKMARK_CASCADE_DEBUG_UI_ENABLED && bookmarkCascadeRuntime',
  'newtab should only create or append the bookmark cascade debug control when the maintenance flag is enabled'
);
assertContains(
  newtabJs,
  'BOOKMARK_CASCADE_DEBUG_UI_ENABLED && changes[BOOKMARK_CASCADE_DEBUG_STORAGE_KEY]',
  'stored bookmark cascade debug mode should only be restored when the maintenance flag is enabled'
);
assert.ok(
  !newtabJs.includes('if (bookmarkCascadeRuntime) {\n    bookmarkCascadeRuntime.createDebugControls();\n  }'),
  'newtab should not unconditionally create the bookmark cascade debug control'
);
assert.ok(
  !newtabJs.includes('if (bookmarkCascadeRuntime && bookmarkCascadeRuntime.getDebugControl()) {\n    document.body.appendChild(bookmarkCascadeRuntime.getDebugControl());\n  }'),
  'newtab should not unconditionally append the bookmark cascade debug control'
);
assertContains(
  cascadeMenuJs,
  'createBookmarkCascadeDebugControls',
  'bookmark cascade runtime should keep the debug control implementation for future maintenance'
);
assertContains(
  cascadeMenuJs,
  'scheduleBookmarkCascadeHoverIntent',
  'pointer hover in bookmark cascade should be routed through delayed intent scheduling'
);
assertContains(
  cascadeMenuJs,
  'shouldProtectBookmarkCascadeLevel',
  'bookmark cascade switching should consult the safe triangle before replacing a submenu'
);
assertContains(
  cascadeMenuJs,
  'updateBookmarkCascadeDebugTriangle',
  'bookmark cascade debug mode should update the generated triangle in real time'
);
assertContains(
  cascadeMenuJs,
  'updateBookmarkCascadeDelayDebugLabel',
  'bookmark cascade debug mode should show live delay countdown labels'
);
assertContains(
  newtabJs,
  'NEWTAB_BOOKMARK_CASCADE_MENU.createBookmarkCascadeMenuRuntime',
  'newtab should delegate bookmark cascade behavior to the menu runtime'
);
assert.ok(
  !newtabJs.includes('function scheduleBookmarkCascadeHoverIntent'),
  'newtab should not own the cascade hover-intent state machine after componentization'
);
assert.ok(
  newtabHtml.indexOf('bookmark-cascade-position.js') >= 0 &&
    newtabHtml.indexOf('bookmark-cascade-menu.js') > newtabHtml.indexOf('bookmark-cascade-position.js') &&
    newtabHtml.indexOf('bookmark-cascade-menu.js') < newtabHtml.indexOf('newtab.js'),
  'newtab should load the cascade menu runtime after positioning helpers and before newtab.js'
);
assertContains(
  newtabHtml,
  '.x-nt-bookmark-cascade-safe-triangle',
  'newtab CSS should style the safe-triangle debug polygon'
);
assertContains(
  newtabHtml,
  '.x-nt-bookmark-cascade-debug-label',
  'newtab CSS should style the delay countdown debug label'
);
assertContains(
  newtabHtml,
  '.x-nt-bookmark-cascade-debug-button',
  'newtab CSS should style the bookmark cascade debug switch'
);
assert.ok(
  getCssZIndex(newtabHtml, '.x-nt-bookmark-cascade-debug-svg') >
    getCssZIndex(newtabHtml, '.x-nt-bookmark-cascade-level'),
  'safe-triangle debug SVG should render above menu panels so it is not hidden by cascade levels'
);
{
  assert.ok(
    !newtabHtml.includes('.x-nt-bookmark-cascade-item:focus-visible {\n        outline: 2px solid'),
    'bookmark cascade keyboard focus should use the selected row background instead of an outline stroke'
  );
}

console.log('newtab bookmark cascade hover intent tests passed');
