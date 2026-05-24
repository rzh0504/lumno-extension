const assert = require('assert');
const settings = require('../src/shared/settings.js');

assert.strictEqual(settings.normalizeLocale(''), 'en');
assert.strictEqual(settings.normalizeLocale('en-US'), 'en');
assert.strictEqual(settings.normalizeLocale('ja-JP'), 'ja');
assert.strictEqual(settings.normalizeLocale('zh-CN'), 'zh_CN');
assert.strictEqual(settings.normalizeLocale('zh-HK'), 'zh_TW');
assert.strictEqual(settings.normalizeLocale('zh-Hant-TW'), 'zh_TW');
assert.strictEqual(settings.localeToHtmlLang('en-US'), 'en');
assert.strictEqual(settings.localeToHtmlLang('ja-JP'), 'ja');
assert.strictEqual(settings.localeToHtmlLang('zh-CN'), 'zh-CN');
assert.strictEqual(settings.localeToHtmlLang('zh-HK'), 'zh-TW');

assert.strictEqual(settings.normalizeNewtabWidthMode('standard'), 'standard');
assert.strictEqual(settings.normalizeNewtabWidthMode('wide'), 'wide');
assert.strictEqual(settings.normalizeNewtabWidthMode('other'), 'wide');

assert.strictEqual(settings.normalizeNewtabSearchWidth(719), 720);
assert.strictEqual(settings.normalizeNewtabSearchWidth(920), 920);
assert.strictEqual(settings.normalizeNewtabSearchWidth(1200), 1040);
assert.strictEqual(settings.normalizeNewtabSearchWidth(undefined), 920);
assert.strictEqual(settings.normalizeNewtabSearchWidth(undefined, { allowNull: true }), null);

assert.strictEqual(settings.normalizeNewtabWordmarkVisible(false), false);
assert.strictEqual(settings.normalizeNewtabWordmarkVisible(true), true);
assert.strictEqual(settings.normalizeNewtabWordmarkVisible(undefined), true);

assert.strictEqual(settings.normalizeOverlaySizeMode('compact'), 'compact');
assert.strictEqual(settings.normalizeOverlaySizeMode('large'), 'large');
assert.strictEqual(settings.normalizeOverlaySizeMode('standard'), 'standard');
assert.strictEqual(settings.normalizeOverlaySizeMode('other'), 'standard');

assert.strictEqual(settings.normalizeOverlayTabPriorityMode('switchTabFirst'), true);
assert.strictEqual(settings.normalizeOverlayTabPriorityMode('newtabFirst'), false);
assert.strictEqual(settings.normalizeOverlayTabPriorityMode(false), false);
assert.strictEqual(settings.normalizeOverlayTabPriorityMode(undefined), true);

assert.strictEqual(settings.normalizeSearchResultPriority('search'), 'search');
assert.strictEqual(settings.normalizeSearchResultPriority('autocomplete'), 'autocomplete');
assert.strictEqual(settings.normalizeSearchResultPriority('other'), 'autocomplete');

assert.strictEqual(settings.normalizeTabRankScoreDebugMode(true), true);
assert.strictEqual(settings.normalizeTabRankScoreDebugMode(false), false);
assert.strictEqual(settings.normalizeTabRankScoreDebugMode('true'), false);

assert.strictEqual(settings.normalizeThemePreference('dark'), 'dark');
assert.strictEqual(settings.normalizeThemePreference('light'), 'light');
assert.strictEqual(settings.normalizeThemePreference('system'), '');

console.log('settings tests passed');
