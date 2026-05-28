const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const bookmarksView = fs.readFileSync(path.join(repoRoot, 'src/newtab/bookmarks-view.js'), 'utf8');
const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');

function assertContains(source, needle, message) {
  assert.ok(source.includes(needle), message);
}

assertContains(
  bookmarksView,
  "const bindCursorTooltip = getFunction(options, 'bindCursorTooltip');",
  'bookmark cards should receive a cursor-following tooltip binder'
);
assertContains(
  bookmarksView,
  "card.setAttribute('data-cursor-tooltip', titleText);",
  'bookmark cards should expose full titles through the cursor tooltip attribute'
);
assertContains(
  bookmarksView,
  'function isBookmarkTitleTruncated(titleElement) {',
  'bookmark cards should have a local truncation detector for title text'
);
assertContains(
  bookmarksView,
  'shouldShow: () => isBookmarkTitleTruncated(title)',
  'bookmark card cursor tooltips should only show when the title is truncated before hover'
);
assertContains(
  newtabJs,
  'const bookmarkCursorTooltipController = globalThis.LumnoCursorTooltip &&',
  'newtab should create a dedicated cursor-following tooltip controller for bookmarks'
);
assertContains(
  newtabJs,
  'function bindCursorTooltip(target, getText, options) {',
  'newtab should define a reusable cursor tooltip binding helper'
);
assertContains(
  newtabJs,
  'bindCursorTooltip,',
  'newtab should pass the cursor tooltip binder into the bookmark view'
);
assertContains(
  newtabJs,
  'hideCursorTooltip',
  'newtab should provide a way to hide the bookmark cursor tooltip when cards are cleared'
);

console.log('newtab bookmark card cursor tooltip tests passed');
