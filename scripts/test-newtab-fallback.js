const assert = require('assert');
const fallback = require('../src/background/newtab-fallback.js');

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
  'chrome-extension://abc/src/newtab/newtab.html?focus=1&notice=file-access',
  'file-access notice should be encoded into the newtab fallback URL'
);

fallback.openNewtabFallbackForUrl('file:///Users/example/document.pdf');
assert.strictEqual(
  createdUrls[0],
  'chrome-extension://abc/src/newtab/newtab.html?focus=1&notice=file-access',
  'file URLs without file-scheme access should open the notice variant'
);

fallback.openNewtabFallbackForUrl('https://example.com/');
assert.strictEqual(
  createdUrls[1],
  'chrome-extension://abc/src/newtab/newtab.html?focus=1',
  'ordinary web URLs should open the regular focused newtab fallback'
);

globalThis.chrome = originalChrome;

console.log('newtab fallback tests passed');
