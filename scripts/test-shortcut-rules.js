const assert = require('assert');

const shortcutRules = require('../src/background/shortcut-rules.js');

function createResponse(data) {
  return {
    json: () => Promise.resolve(data)
  };
}

async function testLoadShortcutRules() {
  const requestedUrls = [];
  const api = shortcutRules.create({
    chromeApi: {
      runtime: {
        getURL: (path) => `chrome-extension://id/${path}`
      }
    },
    navigatorLike: { userAgent: 'Chrome' },
    fetchImpl: (url) => {
      requestedUrls.push(url);
      return Promise.resolve(createResponse({
        items: [
          { type: 'browserPage', keys: ['ext '], path: 'extensions' }
        ]
      }));
    }
  });

  const first = await api.loadShortcutRules();
  const second = await api.loadShortcutRules();
  assert.deepStrictEqual(first, [{ type: 'browserPage', keys: ['ext '], path: 'extensions' }]);
  assert.strictEqual(second, first);
  assert.deepStrictEqual(requestedUrls, ['chrome-extension://id/assets/data/shortcut-rules.json']);
}

async function testLoadShortcutRulesFallback() {
  const api = shortcutRules.create({
    fetchImpl: () => Promise.resolve(createResponse({ items: 'not-an-array' }))
  });
  assert.deepStrictEqual(await api.loadShortcutRules(), []);
}

function testBrowserScheme() {
  assert.strictEqual(shortcutRules.getBrowserInternalScheme('Chrome Edg/123'), 'edge://');
  assert.strictEqual(shortcutRules.getBrowserInternalScheme('Chrome Brave'), 'brave://');
  assert.strictEqual(shortcutRules.getBrowserInternalScheme('Vivaldi'), 'vivaldi://');
  assert.strictEqual(shortcutRules.getBrowserInternalScheme('OPR/99'), 'opera://');
  assert.strictEqual(shortcutRules.getBrowserInternalScheme('Chrome'), 'chrome://');
}

function testShortcutUrlMatching() {
  const rules = [
    { type: 'browserPage', keys: ['ext ', 'extensions '], path: 'extensions' },
    { type: 'url', keys: ['lumno '], url: 'https://lumno.app' },
    { type: 'url', keys: ['bad '] }
  ];

  assert.strictEqual(
    shortcutRules.getShortcutUrlForScheme('ext test', rules, 'edge://'),
    'edge://extensions'
  );
  assert.strictEqual(
    shortcutRules.getShortcutUrlForScheme('LUMNO app', rules, 'chrome://'),
    'https://lumno.app'
  );
  assert.strictEqual(shortcutRules.getShortcutUrlForScheme('missing', rules, 'chrome://'), null);
  assert.strictEqual(shortcutRules.getShortcutUrlForScheme('', rules, 'chrome://'), null);
  assert.strictEqual(shortcutRules.getShortcutUrlForScheme('ext test', null, 'chrome://'), null);
}

async function testInstanceShortcutUrl() {
  const api = shortcutRules.create({
    navigatorLike: { userAgent: 'Chrome Edg/123' }
  });
  const rules = [
    { type: 'browserPage', keys: ['history '], path: 'history' }
  ];
  assert.strictEqual(api.getShortcutUrl('history today', rules), 'edge://history');
}

(async () => {
  await testLoadShortcutRules();
  await testLoadShortcutRulesFallback();
  testBrowserScheme();
  testShortcutUrlMatching();
  await testInstanceShortcutUrl();
  console.log('shortcut rules tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
