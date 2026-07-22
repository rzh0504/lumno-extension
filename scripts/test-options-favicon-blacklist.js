const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const optionsHtml = read('src/options/options.html');
const optionsJs = read('src/options/options.js');
const manifest = JSON.parse(read('manifest.json'));
const packageJson = JSON.parse(read('package.json'));
const localeNames = ['en', 'ja', 'zh_CN', 'zh_TW'];
const locales = localeNames.map((name) => JSON.parse(read(`_locales/${name}/messages.json`)));

assert.strictEqual(
  packageJson.scripts['test:options-favicon-blacklist'],
  'node scripts/test-options-favicon-blacklist.js'
);

[
  '_x_extension_favicon_blacklist_editor_2026_unique_',
  '_x_extension_favicon_blacklist_list_2026_unique_',
  '_x_extension_favicon_blacklist_form_2026_unique_',
  '_x_extension_favicon_blacklist_clear_2026_unique_',
  '_x_extension_favicon_blacklist_expand_2026_unique_',
  '_x_extension_favicon_blacklist_match_suffix_2026_unique_',
  '_x_extension_favicon_blacklist_match_exact_2026_unique_',
  '_x_extension_favicon_blacklist_match_prefix_2026_unique_',
  'data-i18n="favicon_blacklist_section_title"',
  'data-i18n="favicon_blacklist_section_desc"'
].forEach((snippet) => assert.ok(optionsHtml.includes(snippet), `missing restored favicon exclusion UI: ${snippet}`));
assert.match(
  optionsHtml,
  /id="_x_extension_favicon_blacklist_match_suffix_2026_unique_"[^>]*checked/,
  'suffix (site and subdomains) should be the default rule type'
);
assert.match(
  optionsHtml,
  /id="_x_extension_favicon_blacklist_editor_2026_unique_"[\s\S]*?id="_x_extension_favicon_blacklist_form_2026_unique_"/,
  'the exclusion editor should sit directly under the enhanced fetching setting'
);
assert.ok(
  optionsHtml.includes('关闭后只使用浏览器缓存、Lumno 内置或通用图标，不会访问网站来获取图标或主题色。'),
  'fallback HTML should truthfully describe strict mode'
);

assert.match(optionsJs, /const FAVICON_REQUEST_BLACKLIST_STORAGE_KEY = '_x_extension_favicon_request_blacklist_2026_unique_';/);
assert.match(optionsJs, /function loadFaviconRequestBlacklistItems\(\)/, 'legacy rules should load automatically');
assert.match(optionsJs, /function saveFaviconRequestBlacklistItems\(items\)/, 'rules should persist');
assert.match(optionsJs, /function renderFaviconRequestBlacklistList\(\)/, 'saved rules should render');
assert.match(optionsJs, /faviconBlacklistAddButton\.addEventListener\('click'/, 'add should be interactive');
assert.match(optionsJs, /faviconRequestBlacklistItems\.filter[\s\S]*?renderFaviconRequestBlacklistList/, 'remove should persist and rerender');
assert.match(optionsJs, /saveFaviconRequestBlacklistItems\(\[\]\)/, 'clear should persist an empty list');
assert.match(optionsJs, /changes\[FAVICON_REQUEST_BLACKLIST_STORAGE_KEY\][\s\S]*?renderFaviconRequestBlacklistList/, 'storage changes should refresh the editor');
assert.match(optionsJs, /SYNC_KEYS = \[[\s\S]*?FAVICON_REQUEST_BLACKLIST_STORAGE_KEY/, 'sync export/import should include exclusions');
assert.match(optionsJs, /function setFaviconBlacklistEditorEnabled\(enabled\)[\s\S]*?aria-disabled[\s\S]*?\.inert = !editable/, 'global off should make the editor inert and aria-disabled');
assert.match(optionsJs, /faviconEnhancedFetchToggle\.addEventListener\('change'[\s\S]*?setFaviconBlacklistEditorEnabled\(next\)/, 'toggle changes should refresh editor interactivity');
assert.match(optionsJs, /loadFaviconRequestBlacklistItems\(\)\.then[\s\S]*?faviconRequestBlacklistItems = items/, 'legacy rules should appear at startup');

const requiredLocaleKeys = [
  'settings_favicon_enhanced_fetch_desc',
  'favicon_blacklist_section_title',
  'favicon_blacklist_section_desc',
  'favicon_blacklist_add',
  'favicon_blacklist_removed_toast',
  'favicon_blacklist_clear',
  'confirm_clear_favicon_blacklist'
];
locales.forEach((messages, index) => {
  requiredLocaleKeys.forEach((key) => {
    assert.ok(messages[key] && messages[key].message, `${localeNames[index]} missing ${key}`);
  });
});
assert.ok(locales[0].settings_favicon_enhanced_fetch_desc.message.includes('does not access websites'));
assert.ok(locales[0].favicon_blacklist_section_desc.message.includes('searchable'));
assert.ok(locales[2].settings_favicon_enhanced_fetch_desc.message.includes('不会访问网站'));
assert.ok(locales[2].favicon_blacklist_section_desc.message.includes('仍可显示、搜索和打开'));

const accessibleResources = manifest.web_accessible_resources.flatMap((entry) => entry.resources || []);
assert.ok(accessibleResources.includes('src/shared/cursor-tooltip.css'), 'cursor tooltip CSS should be web accessible');

console.log('options favicon blacklist tests passed');
