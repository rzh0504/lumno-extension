const assert = require('assert');
const routes = require('../src/shared/extension-routes.js');

const chromeApi = {
  runtime: {
    getURL: (value) => `chrome-extension://abc/${value}`
  }
};

assert.strictEqual(
  routes.buildNewtabUrl(chromeApi, { focus: true }),
  'chrome-extension://abc/src/newtab/newtab.html?focus=1',
  'focused newtab URL should use the extension route'
);

assert.strictEqual(
  routes.buildNewtabUrl(chromeApi, { focus: true, notice: 'file-access' }),
  'chrome-extension://abc/src/newtab/newtab.html?focus=1&notice=file-access',
  'newtab URL should preserve focus and notice params'
);

assert.strictEqual(
  routes.buildOptionsUrl(chromeApi, 'appearance'),
  'chrome-extension://abc/src/options/options.html#appearance',
  'options hash URL should use the extension route'
);

assert.strictEqual(
  routes.buildExtensionUrl(chromeApi, routes.ROUTE_PATHS.onboarding),
  'chrome-extension://abc/src/onboarding/onboarding.html',
  'onboarding URL should use the extension route'
);

assert.strictEqual(
  routes.classifyExtensionUrl('chrome-extension://abc/src/newtab/newtab.html?focus=1'),
  'newtab',
  'newtab URLs should be classified'
);

assert.strictEqual(
  routes.classifyExtensionUrl('chrome-extension://abc/src/options/options.html#appearance'),
  'options',
  'options URLs should be classified'
);

assert.strictEqual(
  routes.classifyExtensionUrl('chrome-extension://abc/src/onboarding/onboarding.html?entry=ext'),
  'onboarding',
  'onboarding URLs should be classified'
);

assert.strictEqual(
  routes.classifyExtensionUrl('chrome-extension://abc/src/other/page.html'),
  'other',
  'unknown extension URLs should be classified as other'
);

console.log('extension route tests passed');
