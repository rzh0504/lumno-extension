const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const localeNames = ['en', 'ja', 'zh_CN', 'zh_TW'];
const nativeLanguageLabels = {
  language_zh_cn: '简体中文',
  language_zh_tw: '繁體中文',
  language_ja: '日本語',
  language_en: 'English'
};

localeNames.forEach((locale) => {
  const messagesPath = path.join(repoRoot, '_locales', locale, 'messages.json');
  const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));

  Object.entries(nativeLanguageLabels).forEach(([key, expected]) => {
    assert.strictEqual(
      messages[key] && messages[key].message,
      expected,
      `${locale} should keep ${key} as its native language label`
    );
  });
});

console.log('options language label tests passed');
