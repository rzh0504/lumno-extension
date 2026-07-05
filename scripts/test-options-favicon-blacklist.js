const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const optionsHtml = fs.readFileSync(path.join(repoRoot, 'src/options/options.html'), 'utf8');
const optionsJs = fs.readFileSync(path.join(repoRoot, 'src/options/options.js'), 'utf8');
const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
const backgroundJs = fs.readFileSync(path.join(repoRoot, 'src/background/background.js'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const zhCnMessages = JSON.parse(fs.readFileSync(path.join(repoRoot, '_locales/zh_CN/messages.json'), 'utf8'));

assert.strictEqual(
  packageJson.scripts['test:options-favicon-blacklist'],
  'node scripts/test-options-favicon-blacklist.js',
  'package.json should expose a dedicated favicon blacklist options test script'
);

[
  '_x_extension_favicon_blacklist_list_2026_unique_',
  '_x_extension_favicon_blacklist_form_2026_unique_',
  '_x_extension_favicon_blacklist_clear_2026_unique_',
  '_x_extension_favicon_blacklist_expand_2026_unique_',
  'data-i18n="favicon_blacklist_section_title"',
  'data-i18n="favicon_blacklist_section_desc"',
  '避免本地网络权限弹窗'
].forEach((snippet) => {
  assert.strictEqual(
    optionsHtml.includes(snippet),
    false,
    `options blacklist tab should not expose the favicon request exclusion UI: ${snippet}`
  );
});
assert.ok(
  optionsHtml.includes('_x_extension_favicon_enhanced_fetch_toggle_2026_unique_'),
  'options search results section should expose the enhanced favicon/theme fetch toggle'
);
assert.ok(
  optionsHtml.includes('data-i18n="settings_favicon_enhanced_fetch_title"'),
  'enhanced favicon/theme fetch toggle should localize its title'
);
assert.ok(
  optionsHtml.includes('data-i18n="settings_favicon_enhanced_fetch_desc"'),
  'enhanced favicon/theme fetch toggle should localize its description'
);
assert.ok(
  /<input[^>]*id="_x_extension_favicon_enhanced_fetch_toggle_2026_unique_"[^>]*checked/.test(optionsHtml),
  'enhanced favicon/theme fetch toggle should be enabled by default'
);
assert.strictEqual(
  zhCnMessages.settings_favicon_enhanced_fetch_desc.message.includes('会尝试从网页声明和常见图标路径补全图标与主题色。'),
  false,
  'enhanced favicon/theme fetch description should not expose implementation details'
);
assert.strictEqual(
  optionsHtml.includes('会尝试从网页声明和常见图标路径补全图标与主题色。'),
  false,
  'fallback zh-CN HTML copy should not expose implementation details'
);

assert.match(
  optionsJs,
  /const FAVICON_REQUEST_BLACKLIST_STORAGE_KEY = '_x_extension_favicon_request_blacklist_2026_unique_';/,
  'options sync export/import should preserve legacy favicon request exclusions'
);
assert.match(
  optionsJs,
  /const FAVICON_ENHANCED_FETCH_ENABLED_STORAGE_KEY = '_x_extension_favicon_enhanced_fetch_enabled_2026_unique_';/,
  'options logic should store the enhanced favicon/theme fetch toggle in a dedicated storage key'
);
assert.match(
  optionsJs,
  /const faviconEnhancedFetchToggle = document\.getElementById\('_x_extension_favicon_enhanced_fetch_toggle_2026_unique_'\);/,
  'options logic should bind the enhanced favicon/theme fetch toggle'
);
assert.match(
  optionsJs,
  /function normalizeFaviconEnhancedFetchEnabled\(value\)/,
  'options logic should normalize the enhanced favicon/theme fetch toggle'
);
assert.match(
  optionsJs,
  /SYNC_KEYS = \[[\s\S]*?FAVICON_ENHANCED_FETCH_ENABLED_STORAGE_KEY/,
  'sync export/import should include the enhanced favicon/theme fetch toggle'
);
assert.match(
  optionsJs,
  /SYNC_KEYS = \[[\s\S]*?FAVICON_REQUEST_BLACKLIST_STORAGE_KEY/,
  'sync export/import should keep existing hidden favicon request exclusion rules'
);
assert.match(
  optionsJs,
  /changes\[FAVICON_ENHANCED_FETCH_ENABLED_STORAGE_KEY\]/,
  'options logic should react to enhanced favicon/theme fetch setting changes'
);
[
  /document\.getElementById\('_x_extension_favicon_blacklist_/,
  /function loadFaviconRequestBlacklistItems\(\)/,
  /function saveFaviconRequestBlacklistItems\(\)/,
  /function renderFaviconRequestBlacklistList\(\)/,
  /faviconRequestBlacklistItems/,
  /faviconBlacklist/
].forEach((pattern) => {
  assert.doesNotMatch(
    optionsJs,
    pattern,
    `options logic should not keep favicon request exclusion UI code: ${pattern}`
  );
});

assert.match(
  newtabJs,
  /const FAVICON_REQUEST_BLACKLIST_STORAGE_KEY = '_x_extension_favicon_request_blacklist_2026_unique_';/,
  'new tab runtime should know the favicon request exclusion storage key'
);
assert.match(
  newtabJs,
  /function isUrlBlockedByFaviconRequestBlacklist\(url\)/,
  'new tab runtime should normalize and check favicon request exclusion rules'
);
assert.match(
  newtabJs,
  /function isAllowedFaviconProxyRequestUrl\(url\)/,
  'new tab runtime should keep allowed favicon proxy URLs available for excluded pages'
);
assert.match(
  newtabJs,
  /changes\[FAVICON_REQUEST_BLACKLIST_STORAGE_KEY\]/,
  'new tab runtime should refresh favicon exclusion cache when storage changes'
);

const themeSourceBlockStart = newtabJs.indexOf('function getThemeSourceForSuggestion(suggestion)');
assert.notStrictEqual(themeSourceBlockStart, -1, 'new tab runtime should have suggestion theme source resolution');
const themeSourceBlockEnd = newtabJs.indexOf('function getSiteFaviconUrl', themeSourceBlockStart);
assert.notStrictEqual(themeSourceBlockEnd, -1, 'suggestion theme source block should end before site favicon helper');
const themeSourceBlock = newtabJs.slice(themeSourceBlockStart, themeSourceBlockEnd);
assert.doesNotMatch(
  themeSourceBlock,
  /isUrlBlockedByFaviconRequestBlacklist\(suggestion\.url\)[\s\S]*?return '';/,
  'favicon request exclusions should not remove the virtual favicon source used for theme extraction'
);
assert.match(
  themeSourceBlock,
  /isUrlBlockedByFaviconRequestBlacklist\(suggestion\.url\)[\s\S]*?isAllowedFaviconProxyRequestUrl\(suggestion\.favicon\)/,
  'excluded suggestions should prefer an allowed favicon proxy source for theme extraction'
);

assert.match(
  backgroundJs,
  /const FAVICON_REQUEST_BLACKLIST_STORAGE_KEY = '_x_extension_favicon_request_blacklist_2026_unique_';/,
  'background runtime should know the favicon request exclusion storage key'
);
assert.match(
  backgroundJs,
  /const FAVICON_ENHANCED_FETCH_ENABLED_STORAGE_KEY = '_x_extension_favicon_enhanced_fetch_enabled_2026_unique_';/,
  'background runtime should know the enhanced favicon/theme fetch storage key'
);
assert.match(
  backgroundJs,
  /function loadFaviconEnhancedFetchEnabled\(\)/,
  'background runtime should load the enhanced favicon/theme fetch setting'
);
assert.match(
  backgroundJs,
  /function resolveSiteThemeColor\(targetUrl, hostOverride, preferredTheme\)[\s\S]*?loadFaviconEnhancedFetchEnabled\(\)[\s\S]*?!enhancedFetchEnabled[\s\S]*?return null/,
  'theme color resolution should stop when enhanced favicon/theme fetching is disabled'
);
assert.match(
  backgroundJs,
  /function resolveFaviconCandidates\(targetUrl, hostOverride, fallbackUrl\)[\s\S]*?loadFaviconEnhancedFetchEnabled\(\)[\s\S]*?skipDirectFallback:[\s\S]*?!enhancedFetchEnabled/,
  'favicon candidate resolution should skip direct fallback URLs when enhanced fetching is disabled'
);
assert.match(
  backgroundJs,
  /function isUrlBlockedByFaviconRequestBlacklist\(url\)/,
  'background runtime should normalize and check favicon request exclusion rules'
);
assert.match(
  backgroundJs,
  /function resolveSiteThemeColor\(targetUrl, hostOverride, preferredTheme\)[\s\S]*?getFaviconTargetPolicy\(inputUrl, hostOverride\)[\s\S]*?targetPolicy\.directFetchBlocked/,
  'theme color resolution should stop when the page URL is excluded from favicon requests'
);
assert.match(
  backgroundJs,
  /function resolveFaviconCandidates\(targetUrl, hostOverride, fallbackUrl\)[\s\S]*?getFaviconTargetPolicy\(inputUrl, hostOverride\)[\s\S]*?targetPolicy\.requestBlacklisted/,
  'favicon candidate resolution should stop when the page URL is excluded from favicon requests'
);
assert.match(
  backgroundJs,
  /function fetchFaviconData\(url\)[\s\S]*?isUrlBlockedByFaviconRequestBlacklist\(url\)/,
  'background favicon fetches should stop when the request URL is excluded'
);

console.log('options favicon blacklist tests passed');
