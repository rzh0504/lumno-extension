const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');

const auditOutput = execFileSync(process.execPath, ['scripts/audit-i18n.js'], {
  encoding: 'utf8'
});
const candidateMatch = auditOutput.match(/i18n audit candidate count=(\d+)/);
assert(candidateMatch, 'i18n audit should print a candidate count');
assert.strictEqual(
  Number(candidateMatch[1]),
  0,
  `i18n audit should have no unreviewed candidates:\n${auditOutput}`
);

const optionsSource = fs.readFileSync('src/options/options.js', 'utf8');
const optionsHtml = fs.readFileSync('src/options/options.html', 'utf8');
const backgroundSource = fs.readFileSync('src/background/background.js', 'utf8');
const newtabSource = fs.readFileSync('src/newtab/newtab.js', 'utf8');
const localeNames = ['en', 'ja', 'zh_CN', 'zh_TW'];
const localeMessages = Object.fromEntries(localeNames.map((locale) => [
  locale,
  JSON.parse(fs.readFileSync(`_locales/${locale}/messages.json`, 'utf8'))
]));

assert(
  /data-i18n="settings_overlay_open_tabs_default_visible_title"/.test(optionsHtml),
  'overlay open-tabs setting label should be wired through data-i18n'
);
assert(
  !/settings_overlay_open_tabs_default_visible_desc/.test(optionsHtml),
  'overlay open-tabs setting should not keep a secondary description in options HTML'
);
localeNames.forEach((locale) => {
  assert(
    localeMessages[locale].settings_overlay_open_tabs_default_visible_title &&
      String(localeMessages[locale].settings_overlay_open_tabs_default_visible_title.message || '').trim(),
    `${locale} should localize the overlay open-tabs setting label`
  );
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(localeMessages[locale], 'settings_overlay_open_tabs_default_visible_desc'),
    false,
    `${locale} should not keep unused overlay open-tabs setting description copy`
  );
});
assert(
  /BOOKMARK_FOLDER_ICONS_VISIBLE_STORAGE_KEY\s*=\s*['_"]_x_extension_bookmark_folder_icons_visible_2026_unique_['_"]/.test(newtabSource),
  'new tab should define the bookmark folder icons storage key'
);
assert(
  /changes\[BOOKMARK_FOLDER_ICONS_VISIBLE_STORAGE_KEY\][\s\S]*setFolderIconsVisible/.test(newtabSource),
  'new tab should apply bookmark folder icon setting changes live'
);
assert(
  /migrateStorageIfNeeded\(\[[\s\S]*BOOKMARK_FOLDER_ICONS_VISIBLE_STORAGE_KEY[\s\S]*\]\);/.test(newtabSource),
  'new tab should migrate the bookmark folder icon setting to sync storage'
);
assert(
  /BOOKMARK_FOLDER_ICONS_VISIBLE_STORAGE_KEY\s*=\s*['_"]_x_extension_bookmark_folder_icons_visible_2026_unique_['_"]/.test(backgroundSource),
  'background should define the bookmark folder icons storage key'
);
assert(
  /migrateStorageIfNeeded\(\[[\s\S]*BOOKMARK_FOLDER_ICONS_VISIBLE_STORAGE_KEY[\s\S]*\]\);/.test(backgroundSource),
  'background should migrate the bookmark folder icon setting to sync storage'
);

assert(
  /BOOKMARK_VIEW_MODE_STORAGE_KEY\s*=\s*['_"]_x_extension_bookmark_view_mode_2026_unique_['_"]/.test(optionsSource),
  'options sync should define the bookmark view mode storage key'
);
assert(
  /const SYNC_KEYS = \[[\s\S]*BOOKMARK_VIEW_MODE_STORAGE_KEY[\s\S]*\];/.test(optionsSource),
  'bookmark view mode should be included in options sync/export/import keys'
);
assert(
  /migrateStorageIfNeeded\(\[[\s\S]*BOOKMARK_VIEW_MODE_STORAGE_KEY[\s\S]*\]\);/.test(optionsSource),
  'bookmark view mode should be included in local-to-sync migration'
);
assert(
  /BOOKMARK_FOLDER_ICONS_VISIBLE_STORAGE_KEY\s*=\s*['_"]_x_extension_bookmark_folder_icons_visible_2026_unique_['_"]/.test(optionsSource),
  'options sync should define the bookmark folder icons storage key'
);
assert(
  /const SYNC_KEYS = \[[\s\S]*BOOKMARK_FOLDER_ICONS_VISIBLE_STORAGE_KEY[\s\S]*\];/.test(optionsSource),
  'bookmark folder icons should be included in options sync/export/import keys'
);
assert(
  /migrateStorageIfNeeded\(\[[\s\S]*BOOKMARK_FOLDER_ICONS_VISIBLE_STORAGE_KEY[\s\S]*\]\);/.test(optionsSource),
  'bookmark folder icons should be included in local-to-sync migration'
);
assert(
  /data-i18n="settings_bookmark_folder_icons_visible_title"/.test(optionsHtml),
  'bookmark folder icon setting label should be wired through data-i18n'
);
assert(
  optionsHtml.indexOf('data-i18n="settings_bookmark_folder_icons_visible_title"') <
    optionsHtml.indexOf('data-i18n="settings_recent_sites_title"'),
  'bookmark folder icon setting should appear before site cards'
);
localeNames.forEach((locale) => {
  assert(
    localeMessages[locale].settings_bookmark_folder_icons_visible_title &&
      String(localeMessages[locale].settings_bookmark_folder_icons_visible_title.message || '').trim(),
    `${locale} should localize the bookmark folder icon setting label`
  );
});
assert(
  /NEWTAB_SHORTCUTS_STORAGE_KEY\s*=\s*['_"]_x_extension_newtab_shortcuts_2026_unique_['_"]/.test(optionsSource),
  'options sync should define the New Tab shortcuts storage key'
);
assert(
  /const SYNC_KEYS = \[[\s\S]*NEWTAB_SHORTCUTS_STORAGE_KEY[\s\S]*\];/.test(optionsSource),
  'New Tab shortcuts should be included in options sync/export/import keys'
);
assert(
  /migrateStorageIfNeeded\(\[[\s\S]*NEWTAB_SHORTCUTS_STORAGE_KEY[\s\S]*\]\);/.test(optionsSource),
  'New Tab shortcuts should be included in options local-to-sync migration'
);
assert(
  /changes\[NEWTAB_SHORTCUTS_STORAGE_KEY\]/.test(optionsSource),
  'New Tab shortcuts changes should refresh options sync status'
);
assert(
  /NEWTAB_SHORTCUTS_STORAGE_KEY\s*=\s*['_"]_x_extension_newtab_shortcuts_2026_unique_['_"]/.test(backgroundSource),
  'background sync migration should define the New Tab shortcuts storage key'
);
assert(
  /migrateStorageIfNeeded\(\[[\s\S]*NEWTAB_SHORTCUTS_STORAGE_KEY[\s\S]*\]\);/.test(backgroundSource),
  'background local-to-sync migration should include New Tab shortcuts'
);
