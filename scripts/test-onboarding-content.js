const assert = require('assert');

const content = require('../src/onboarding/onboarding-content.js');

assert.strictEqual(typeof content.getOnboardingContent, 'function');
assert.strictEqual(typeof content.getSupportedLocales, 'function');

const locales = content.getSupportedLocales();
assert.deepStrictEqual(locales, ['zh_CN', 'zh_TW', 'ja', 'en']);

const en = content.getOnboardingContent('en');
assert.strictEqual(en.brand, 'Lumno');
assert.ok(en.hero.title.includes('Lumno'));
assert.ok(en.steps.length >= 4, 'onboarding should cover the core activation path');
assert.ok(en.features.length >= 4, 'onboarding should summarize major Lumno surfaces');

const actionIds = en.steps
  .map((step) => step.action && step.action.id)
  .filter(Boolean);
assert.ok(actionIds.includes('openShortcuts'), 'onboarding should help users set the command shortcut');
assert.ok(actionIds.includes('openNewtab'), 'onboarding should let users open the Lumno new tab');
assert.ok(actionIds.includes('openOptions'), 'onboarding should offer a settings path');

const fallback = content.getOnboardingContent('missing-locale');
assert.strictEqual(fallback.hero.title, en.hero.title, 'unknown locales should fall back to English');

const zh = content.getOnboardingContent('zh-CN');
assert.strictEqual(zh.locale, 'zh_CN', 'BCP-47 Chinese locale should normalize to extension locale key');

console.log('onboarding content tests passed');
