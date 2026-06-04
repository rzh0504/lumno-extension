const assert = require('assert');

require('../src/shared/suggestion-action-model.js');

const actionModel = globalThis.LumnoSuggestionActionModel;

assert.ok(actionModel, 'suggestion action model should be exported');
assert.strictEqual(
  actionModel.getModifierAdjustedAction('openNewTab', { openInCurrentTab: true }),
  'go',
  'Alt/Option should present open-new-tab actions as current-tab navigation'
);
assert.strictEqual(
  actionModel.getModifierAdjustedAction('search', { openInCurrentTab: true }),
  'search',
  'Alt/Option should not rewrite non-new-tab actions'
);
assert.strictEqual(
  actionModel.getModifierAdjustedAction('switch', { openSwitchInNewTab: true }),
  'openNewTab',
  'Shift should present switch actions as open-new-tab navigation'
);
assert.strictEqual(
  actionModel.getModifierAdjustedAction('switch', { openInCurrentTab: true, openSwitchInNewTab: true }),
  'openNewTab',
  'Shift should keep switch actions as open-new-tab navigation even when Alt/Option is also held'
);

const historySuggestion = {
  type: 'history',
  title: 'Lumno',
  url: 'https://lumno.example/'
};
assert.strictEqual(
  actionModel.shouldOpenNewTabActionInCurrentTab(historySuggestion, { openInCurrentTab: true }),
  true,
  'Alt/Option should make default open-new-tab search results eligible for current-tab navigation'
);
assert.strictEqual(
  actionModel.shouldOpenNewTabActionInCurrentTab({ type: 'googleSuggest', searchQuery: 'lumno' }, { openInCurrentTab: true }),
  false,
  'Alt/Option should not treat search suggestions as open-new-tab result actions'
);
assert.strictEqual(
  actionModel.shouldOpenSwitchActionInNewTab(
    { ...historySuggestion, _xMatchedTabId: 42 },
    { action: 'switch', openSwitchInNewTab: true }
  ),
  true,
  'Shift should make switch search results eligible for duplicate new-tab navigation'
);
assert.strictEqual(
  actionModel.shouldOpenSwitchActionInNewTab(
    { type: 'history', title: 'Missing URL', _xMatchedTabId: 42 },
    { action: 'switch', openSwitchInNewTab: true }
  ),
  false,
  'Shift should not duplicate switch results that do not have a URL to open'
);

console.log('suggestion action model tests passed');
