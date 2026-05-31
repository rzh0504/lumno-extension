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

console.log('suggestion action model tests passed');
