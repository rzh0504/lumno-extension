const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const optionsHtml = fs.readFileSync(path.join(repoRoot, 'src/options/options.html'), 'utf8');
const optionsJs = fs.readFileSync(path.join(repoRoot, 'src/options/options.js'), 'utf8');
const onboardingHtml = fs.readFileSync(path.join(repoRoot, 'src/onboarding/onboarding.html'), 'utf8');

const buttonId = '_x_extension_open_onboarding_page_2026_unique_';
const buttonClass = '_x_extension_onboarding_guide_button_2026_unique_';
const labelKey = 'settings_onboarding_tutorial_action';

function getRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = optionsHtml.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `${selector} should exist in options CSS`);
  return match[1];
}

assert.match(
  optionsHtml,
  new RegExp(`<button[^>]+id="${buttonId}"[^>]+class="[^"]*${buttonClass}[^"]*"[^>]*>[\\s\\S]*?<span data-i18n="${labelKey}">使用教程<\\/span>[\\s\\S]*?<i class="ri-icon ri-size-14 ri-external-link-line"`),
  'general settings header should expose a compact onboarding tutorial ghost action with the onboarding ghost icon'
);

assert.match(
  onboardingHtml,
  /onboarding-action-button--ghost[\s\S]*?ri-external-link-line/,
  'onboarding should keep the reference ghost action icon used by the options tutorial link'
);

const rule = getRule(`.${buttonClass}`);
[
  /margin-left:\s*auto;/,
  /min-height:\s*30px;/,
  /padding:\s*6px 10px;/,
  /background:\s*transparent;/,
  /box-shadow:\s*none;/,
  /white-space:\s*nowrap;/
].forEach((pattern) => {
  assert.match(rule, pattern, 'tutorial action should stay compact and ghost-styled');
});

assert.match(
  optionsJs,
  new RegExp(`const openOnboardingPageButton = document\\.getElementById\\('${buttonId}'\\);`),
  'options should cache the onboarding tutorial button'
);
assert.match(
  optionsJs,
  /openOnboardingPageButton\.addEventListener\('click'[\s\S]*?chrome\.runtime\.sendMessage\(\{\s*action:\s*'openOnboardingPage'\s*\}/,
  'clicking the tutorial action should ask the background page to open onboarding in a new tab'
);

['en', 'ja', 'zh_CN', 'zh_TW'].forEach((locale) => {
  const messages = JSON.parse(fs.readFileSync(path.join(repoRoot, '_locales', locale, 'messages.json'), 'utf8'));
  assert.ok(messages[labelKey] && messages[labelKey].message, `${locale} should localize the onboarding tutorial label`);
});

console.log('options onboarding link tests passed');
