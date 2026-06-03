const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const optionsJs = fs.readFileSync(path.join(repoRoot, 'src/options/options.js'), 'utf8');
const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');

function assertMatches(source, pattern, message) {
  assert.ok(pattern.test(source), message);
}

assertMatches(
  optionsJs,
  /function getThemeStorageUpdate\(mode\) \{[\s\S]*?SETTINGS\.createGlobalThemeModeStorageUpdate/,
  'options should build global theme writes through the shared helper'
);
assertMatches(
  optionsJs,
  /function setThemeMode\(mode\) \{[\s\S]*?const updates = getThemeStorageUpdate\(mode\);[\s\S]*?storageArea\.set\(updates/,
  'options theme picker should write the global theme through the shared helper'
);

assertMatches(
  overlayJs,
  /function getThemeStorageUpdate\(mode\) \{[\s\S]*?SETTINGS\.createGlobalThemeModeStorageUpdate/,
  'overlay should build /mode global writes through the shared helper'
);
assertMatches(
  overlayJs,
  /function applyThemeModeChange\(mode\) \{[\s\S]*?const updates = getThemeStorageUpdate\(mode\);[\s\S]*?storageArea\.set\(updates\);[\s\S]*?applyOverlayTheme\(updates\[THEME_STORAGE_KEY\]\);/,
  'overlay /mode should write and apply the global theme without clearing New Tab override'
);

assertMatches(
  newtabJs,
  /function getGlobalThemeStorageUpdate\(mode\) \{[\s\S]*?SETTINGS\.createGlobalThemeModeStorageUpdate/,
  'newtab should build global appearance writes through the shared helper'
);

console.log('theme sync source tests passed');
