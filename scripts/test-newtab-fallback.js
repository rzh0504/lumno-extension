const assert = require('assert');
const fs = require('fs');
const path = require('path');
require('../src/shared/extension-routes.js');
const fallback = require('../src/background/newtab-fallback.js');

const repoRoot = path.resolve(__dirname, '..');
const lumnoNewtabHtml = fs.readFileSync(path.join(repoRoot, 'src', 'newtab', 'lumno-newtab.html'), 'utf8');

assert.strictEqual(
  fallback.isLocalFileLikeTargetUrl('file:///Users/example/document.pdf'),
  true,
  'file URLs should be treated as local-file-like targets'
);
assert.strictEqual(
  fallback.isLocalFileLikeTargetUrl('https://example.com/viewer?src=file:///tmp/a.html'),
  true,
  'nested file src parameters should be treated as local-file-like targets'
);
assert.strictEqual(
  fallback.isLocalFileLikeTargetUrl('https://example.com/docs/report.pdf'),
  true,
  'PDF paths should be treated as local-file-like targets'
);
assert.strictEqual(
  fallback.isLocalFileLikeTargetUrl('https://example.com/'),
  false,
  'ordinary web URLs should not be treated as local-file-like targets'
);

const originalChrome = globalThis.chrome;
const createdUrls = [];
globalThis.chrome = {
  runtime: {
    getURL: (value) => `chrome-extension://abc/${value}`,
    lastError: null
  },
  extension: {
    isAllowedFileSchemeAccess: (callback) => {
      callback(false);
    }
  },
  tabs: {
    create: ({ url }) => {
      createdUrls.push(url);
    }
  }
};

assert.strictEqual(
  fallback.buildNewtabFallbackUrl({ notice: 'file-access' }),
  'chrome-extension://abc/src/newtab/lumno-newtab.html?focus=1&notice=file-access',
  'file-access notice should be encoded into the standalone Lumno newtab fallback URL'
);

assert.match(
  lumnoNewtabHtml,
  /new URL\('newtab\.html', window\.location\.href\)/,
  'standalone Lumno newtab fallback should redirect to the primary maintained newtab page'
);
assert.match(
  lumnoNewtabHtml,
  /target\.search = window\.location\.search \|\| '';/,
  'standalone Lumno newtab fallback should preserve focus and notice query parameters'
);
assert.match(
  lumnoNewtabHtml,
  /target\.hash = window\.location\.hash \|\| '';/,
  'standalone Lumno newtab fallback should preserve hash parameters'
);
assert.match(
  lumnoNewtabHtml,
  /window\.location\.replace\(target\.href\);/,
  'standalone Lumno newtab fallback should replace history instead of stacking a duplicate page'
);
assert.doesNotMatch(
  lumnoNewtabHtml,
  /<script src="newtab\.js"><\/script>/,
  'standalone Lumno newtab fallback should not duplicate the main newtab runtime dependency list'
);

fallback.openNewtabFallbackForUrl('file:///Users/example/document.pdf');
assert.strictEqual(
  createdUrls[0],
  'chrome-extension://abc/src/newtab/lumno-newtab.html?focus=1&notice=file-access',
  'file URLs without file-scheme access should open the notice variant'
);

fallback.openNewtabFallbackForUrl('https://example.com/');
assert.strictEqual(
  createdUrls[1],
  'chrome-extension://abc/src/newtab/lumno-newtab.html?focus=1',
  'ordinary web URLs should open the standalone focused Lumno newtab fallback'
);

fallback.openBrowserNewtabFallback();
assert.strictEqual(
  createdUrls[2],
  undefined,
  'browser newtab fallback should omit url so the browser-selected newtab provider handles it'
);

globalThis.chrome = originalChrome;

console.log('newtab fallback tests passed');
