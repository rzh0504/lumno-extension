const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const optionsHtml = fs.readFileSync(path.join(repoRoot, 'src/options/options.html'), 'utf8');

function getContentBlock(name) {
  const start = optionsHtml.indexOf(`data-content="${name}"`);
  assert.notStrictEqual(start, -1, `${name} settings content should exist`);
  const nextContent = optionsHtml.indexOf('class="_x_extension_settings_content_2024_unique_"', start + 1);
  const end = nextContent === -1 ? optionsHtml.length : nextContent;
  return optionsHtml.slice(start, end);
}

const generalContent = getContentBlock('general');
const labsContent = getContentBlock('labs');

const syncTitleIndex = generalContent.indexOf('data-i18n="settings_sync_title"');
const autoPipTitleIndex = generalContent.indexOf('data-i18n="settings_auto_pip_title"');
const searchResultsSectionIndex = generalContent.indexOf('data-i18n="settings_search_results_section_title"');

assert.notStrictEqual(syncTitleIndex, -1, 'general settings should include Lumno configuration');
assert.notStrictEqual(autoPipTitleIndex, -1, 'auto picture-in-picture should live in general settings');
assert.notStrictEqual(searchResultsSectionIndex, -1, 'general settings should include search results section');
assert.ok(
  syncTitleIndex < autoPipTitleIndex,
  'auto picture-in-picture should appear below Lumno configuration'
);
assert.ok(
  autoPipTitleIndex < searchResultsSectionIndex,
  'auto picture-in-picture should stay in the Lumno configuration group before search results settings'
);
assert.doesNotMatch(
  labsContent,
  /data-i18n="settings_auto_pip_title"/,
  'auto picture-in-picture should no longer appear in Labs'
);

console.log('options auto PiP placement tests passed');
