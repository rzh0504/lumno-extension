const assert = require('assert');
const fs = require('fs');
const path = require('path');

const backgroundPath = path.join(__dirname, '..', 'src', 'background', 'background.js');
const source = fs.readFileSync(backgroundPath, 'utf8');

function getFunctionBlock(functionName) {
  const needle = `function ${functionName}(`;
  const start = source.indexOf(needle);
  assert.notStrictEqual(start, -1, `${functionName} should exist`);
  const braceStart = source.indexOf('{', start);
  assert.notStrictEqual(braceStart, -1, `${functionName} should have a body`);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error(`${functionName} body should close`);
}

function getListenerBlock(startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notStrictEqual(start, -1, `${startNeedle} should exist`);
  const end = source.indexOf(endNeedle, start);
  assert.notStrictEqual(end, -1, `${endNeedle} should follow ${startNeedle}`);
  return source.slice(start, end);
}

const restoreFunction = getFunctionBlock('restorePinnedTabsFromSnapshotNow');
assert.match(
  restoreFunction,
  /ensurePinnedTabRecoverySettingLoaded\(\)/,
  'pinned tab startup restore should wait for the stored setting before checking the enabled cache'
);
assert.match(
  restoreFunction,
  /const savedEntries = normalizePinnedTabSnapshot\(savedRaw\)/,
  'pinned tab restore should read URL plus tab-group snapshot entries'
);
assert.match(
  restoreFunction,
  /groupRestoredPinnedTab\(result\.tab, entry\.group, existingGroupId\)/,
  'pinned tab restore should attempt to rebuild saved tab groups without blocking URL recovery'
);

const persistFunction = getFunctionBlock('persistPinnedTabSnapshotNow');
assert.match(
  persistFunction,
  /entries\.push\(entry\)/,
  'pinned tab snapshot persistence should store structured entries'
);
assert.match(
  persistFunction,
  /getPinnedTabGroupSnapshot\(tab\)/,
  'pinned tab snapshot persistence should capture tab group metadata when present'
);

const installedListener = getListenerBlock(
  'chrome.runtime.onInstalled.addListener',
  'if (chrome && chrome.runtime && chrome.runtime.onStartup)'
);
assert.match(
  installedListener,
  /restorePinnedTabsFromSnapshotOnStartup\(\)\.catch\(\(\) => \{\}\)/,
  'extension or Chrome update should attempt pinned tab recovery, not only save a fresh snapshot'
);

const removedListener = getListenerBlock(
  'chrome.tabs.onRemoved.addListener',
  'if (chrome && chrome.tabs && chrome.tabs.onUpdated)'
);
assert.match(
  removedListener,
  /removeInfo/,
  'tab removal handler should inspect removeInfo'
);
assert.match(
  removedListener,
  /isWindowClosing/,
  'tab removal handler should avoid overwriting the saved pinned snapshot while a whole window is closing'
);

console.log('pinned tab recovery tests passed');
