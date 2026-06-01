const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const optionsHtml = fs.readFileSync(path.join(repoRoot, 'src/options/options.html'), 'utf8');
const optionsJs = fs.readFileSync(path.join(repoRoot, 'src/options/options.js'), 'utf8');

const buttonId = '_x_extension_site_search_insert_query_2026_unique_';
const buttonClass = '_x_extension_site_search_insert_query_2026_unique_';
const ghostClass = '_x_extension_shortcut_ghost_2026_unique_';
const templateHeaderClass = '_x_extension_site_search_template_header_2026_unique_';
const templateInputId = '_x_extension_site_search_template_2024_unique_';

function getRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = optionsHtml.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `${selector} should exist in options CSS`);
  return match[1];
}

assert.match(
  optionsHtml,
  new RegExp(`<div class="[^"]*_x_extension_shortcut_label_row_2024_unique_[^"]*${templateHeaderClass}[^"]*">[\\s\\S]*?<button[^>]+id="${buttonId}"[^>]+type="button"[^>]+class="[^"]*_x_extension_shortcut_submit_2024_unique_[^"]*${ghostClass}[^"]*${buttonClass}[^"]*"[^>]*>[\\s\\S]*?<span data-i18n="shortcuts_insert_query">插入 \\{query\\}<\\/span>[\\s\\S]*?<i class="ri-icon ri-size-14 ri-braces-line"`),
  'custom site search form should expose a right-aligned compact ghost button with polished copy'
);

assert.match(
  optionsHtml,
  new RegExp(`<input id="${templateInputId}"`),
  'the query insert button should live beside the template input it edits'
);

const labelRowRule = getRule('._x_extension_shortcut_label_row_2024_unique_');
assert.match(labelRowRule, /width:\s*100%;/, 'shortcut label rows should span the field width for right-aligned form actions');
const templateHeaderRule = getRule(`.${templateHeaderClass}`);
assert.match(
  templateHeaderRule,
  /grid-template-columns:\s*auto auto minmax\(0,\s*1fr\) auto;/,
  'site search template header should reserve flexible space before the query button'
);

const ghostRule = getRule(`.${ghostClass}`);
[
  /background:\s*transparent;/,
  /box-shadow:\s*none;/,
  /white-space:\s*nowrap;/
].forEach((pattern) => {
  assert.match(ghostRule, pattern, 'shortcut ghost buttons should stay visually quiet and compact');
});
const buttonRule = getRule(`.${buttonClass}`);
assert.match(buttonRule, /justify-self:\s*end;/, 'query insert button should align to the right edge of the template header');

assert.match(
  optionsJs,
  new RegExp(`const siteSearchInsertQueryButton = document\\.getElementById\\('${buttonId}'\\);`),
  'options should cache the query insert button'
);
assert.match(
  optionsJs,
  /function insertSiteSearchQueryToken\(\)[\s\S]*?const token = '\{query\}';[\s\S]*?setSelectionRange\(nextCursor,\s*nextCursor\)/,
  'query insertion should preserve focus and place the caret after the inserted token'
);
assert.match(
  optionsJs,
  /siteSearchInsertQueryButton\.addEventListener\('click'[\s\S]*?insertSiteSearchQueryToken\(\);/,
  'clicking the query ghost button should insert the query token'
);

['en', 'ja', 'zh_CN', 'zh_TW'].forEach((locale) => {
  const messages = JSON.parse(fs.readFileSync(path.join(repoRoot, '_locales', locale, 'messages.json'), 'utf8'));
  assert.ok(messages.shortcuts_insert_query && messages.shortcuts_insert_query.message, `${locale} should localize the query insert button`);
});

console.log('options site search query button tests passed');
