const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
const newtabHtml = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.html'), 'utf8');

function assertContains(source, needle, message) {
  assert.ok(source.includes(needle), message);
}

assertContains(
  newtabJs,
  'function bindBookmarkPagerTooltip',
  'bookmark pager buttons should bind custom hover/focus tooltips'
);

assertContains(
  newtabJs,
  "bookmarkPagerPrevButton.setAttribute('data-tooltip', prevLabel);",
  'previous page button should expose its tooltip text'
);
assertContains(
  newtabJs,
  "bookmarkPagerNextButton.setAttribute('data-tooltip', nextLabel);",
  'next page button should expose its tooltip text'
);
assertContains(
  newtabJs,
  "bookmarkOpenManagerButton.setAttribute('data-tooltip', managerLabel);",
  'bookmark manager button should expose its tooltip text'
);

assertContains(
  newtabJs,
  "bookmarkPagerPrevButton.removeAttribute('title');",
  'previous page button should avoid native title tooltip duplication'
);
assertContains(
  newtabJs,
  "bookmarkPagerNextButton.removeAttribute('title');",
  'next page button should avoid native title tooltip duplication'
);
assertContains(
  newtabJs,
  "bookmarkOpenManagerButton.removeAttribute('title');",
  'bookmark manager button should avoid native title tooltip duplication'
);

assert.ok(
  !/bookmarkPager(?:Prev|Next)Button\.disabled\s*=/.test(newtabJs),
  'pager buttons should remain hoverable instead of using the native disabled attribute'
);
assertContains(
  newtabJs,
  'setBookmarkPagerButtonAvailability(bookmarkPagerPrevButton, !atStart);',
  'previous page availability should be represented without native disabled'
);
assertContains(
  newtabJs,
  'setBookmarkPagerButtonAvailability(bookmarkPagerNextButton, !atEnd);',
  'next page availability should be represented without native disabled'
);

assertContains(
  newtabHtml,
  '.x-nt-bookmarks-pager-btn:hover:not([aria-disabled="true"])',
  'pager hover styling should ignore aria-disabled buttons'
);
assertContains(
  newtabHtml,
  '.x-nt-bookmarks-pager-btn[aria-disabled="true"]',
  'pager disabled styling should be driven by aria-disabled'
);

console.log('newtab bookmark pager tooltip tests passed');
