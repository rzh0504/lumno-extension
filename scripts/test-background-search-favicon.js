const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const backgroundJs = fs.readFileSync(path.join(repoRoot, 'src/background/background.js'), 'utf8');

function getFunctionBlock(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notStrictEqual(start, -1, `${startNeedle} should exist`);
  const end = source.indexOf(endNeedle, start);
  assert.notStrictEqual(end, -1, `${endNeedle} should exist after ${startNeedle}`);
  return source.slice(start, end);
}

assert.match(
  backgroundJs,
  /function isBrowserInternalPageUrl\(url\)[\s\S]*?FAVICON_UTILS\.isBrowserInternalPageUrl/,
  'background search suggestions should share browser-internal URL detection with favicon utils'
);

assert.match(
  backgroundJs,
  /function getBrowserPageFaviconUrl\(pageUrl\)[\s\S]*?FAVICON_UTILS\.getBrowserPageFaviconUrl[\s\S]*?getRuntimeUrl:[\s\S]*?FAVICON_PROXY_SIZE/,
  'background search suggestions should build favicon2-compatible browser page favicons'
);

const suggestionFaviconBlock = getFunctionBlock(
  backgroundJs,
  'function buildSearchSuggestionFavicon(url)',
  'function createSearchSuggestion'
);

assert.match(
  suggestionFaviconBlock,
  /if \(isBrowserInternalPageUrl\(url\)\) \{\s*return getBrowserPageFaviconUrl\(url\);\s*\}/,
  'bookmark/history/top-site search results for browser pages should use browser-page favicon candidates'
);

const browserPageBranch = suggestionFaviconBlock.indexOf('isBrowserInternalPageUrl(url)');
const genericUrlParsing = suggestionFaviconBlock.indexOf('new URL(url)');
assert.ok(
  browserPageBranch !== -1 && genericUrlParsing !== -1 && browserPageBranch < genericUrlParsing,
  'browser-page favicon handling should run before generic URL host parsing'
);

console.log('background search favicon tests passed');
