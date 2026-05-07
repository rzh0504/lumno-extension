const assert = require('assert');

const routerApi = require('../src/background/message-router.js');

function run() {
  const calls = [];
  const router = routerApi.createRouter({
    tabs: {
      actions: ['switchToTab', 'getTabsForOverlay'],
      handler: (request, sender, sendResponse) => {
        calls.push({ request, sender });
        sendResponse({ ok: true, group: 'tabs' });
        return true;
      }
    },
    empty: {
      actions: [],
      handler: () => {
        throw new Error('empty group should not be registered');
      }
    }
  });

  let response = null;
  const asyncResult = routerApi.dispatch(
    router,
    { action: 'getTabsForOverlay' },
    { tab: { id: 42 } },
    (value) => {
      response = value;
    }
  );

  assert.strictEqual(asyncResult, true);
  assert.deepStrictEqual(response, { ok: true, group: 'tabs' });
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].sender.tab.id, 42);

  response = null;
  const unknownResult = routerApi.dispatch(
    router,
    { action: 'unknownAction' },
    {},
    (value) => {
      response = value;
    }
  );
  assert.strictEqual(unknownResult, undefined);
  assert.deepStrictEqual(response, { ok: false });

  assert.throws(() => {
    routerApi.createRouter({
      first: {
        actions: ['duplicate'],
        handler: () => {}
      },
      second: {
        actions: ['duplicate'],
        handler: () => {}
      }
    });
  }, /Duplicate background message action/);
}

run();
console.log('message router tests passed');
