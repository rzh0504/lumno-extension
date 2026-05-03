const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const sandbox = {
  console,
  URL
};
sandbox.globalThis = sandbox;

vm.runInNewContext(fs.readFileSync('src/shared/url-guards.js', 'utf8'), sandbox, {
  filename: 'src/shared/url-guards.js'
});

const guards = sandbox.LumnoUrlGuards;
assert.ok(guards, 'LumnoUrlGuards should be exported');

assert.strictEqual(guards.isBrowserExtensionProtocol('chrome-extension:'), true);
assert.strictEqual(guards.isBrowserExtensionProtocol('https:'), false);

assert.strictEqual(guards.isRestrictedUrl('chrome://extensions/'), true);
assert.strictEqual(guards.isRestrictedUrl('chrome-extension://abc/src/newtab/newtab.html'), true);
assert.strictEqual(guards.isRestrictedUrl('https://chromewebstore.google.com/detail/example/abc'), true);
assert.strictEqual(guards.isRestrictedUrl('https://chrome.google.com/webstore/detail/example/abc'), true);
assert.strictEqual(guards.isRestrictedUrl('https://microsoftedge.microsoft.com/addons/detail/example/abc'), true);
assert.strictEqual(guards.isRestrictedUrl('https://example.com/release/'), false);

assert.strictEqual(guards.canOpenOverlayOnUrl('file:///Users/kevinxu/test.html'), true);
assert.strictEqual(guards.canOpenOverlayOnUrl('https://x.com/home'), true);
assert.strictEqual(guards.canOpenOverlayOnUrl('https://chromewebstore.google.com/detail/example/abc'), false);

assert.strictEqual(guards.canFetchPageForFavicon('https://example.com/'), true);
assert.strictEqual(guards.canFetchPageForFavicon('https://chromewebstore.google.com/detail/example/abc'), false);
assert.strictEqual(guards.canFetchPageForFavicon('https://chrome.google.com/webstore/devconsole/abc'), false);
assert.strictEqual(guards.canFetchPageForFavicon('file:///Users/kevinxu/test.html'), false);

console.log('url guards ok');
