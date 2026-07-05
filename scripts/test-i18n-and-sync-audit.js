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
const backgroundSource = fs.readFileSync('src/background/background.js', 'utf8');
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
