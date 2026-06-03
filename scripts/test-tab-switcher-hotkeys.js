const assert = require('assert');
const fs = require('fs');

const contentHotkeySource = fs.readFileSync('src/content/hotkey-listener.js', 'utf8');
const backgroundSource = fs.readFileSync('src/background/background.js', 'utf8');
const switcherSource = fs.readFileSync('src/overlay/tab-switcher.js', 'utf8');
const manifestSource = fs.readFileSync('manifest.json', 'utf8');

assert.strictEqual(
  contentHotkeySource.includes('isBestEffortAltTabEvent'),
  false,
  'content script should not try to force-capture Alt+Tab'
);
assert.strictEqual(
  contentHotkeySource.includes('triggerTabSwitcherFromPageHotkey'),
  false,
  'content script should not expose an Alt+Tab page-hotkey switcher trigger'
);
assert.strictEqual(
  backgroundSource.includes('triggerTabSwitcherFromPageHotkey'),
  false,
  'background router should not keep the removed Alt+Tab page-hotkey action'
);
assert.match(
  switcherSource,
  /keyText === 'q'[\s\S]*selectByOffset\(1\)/,
  'tab switcher should allow Q to cycle to the next item'
);
assert.match(
  switcherSource,
  /function handleKeyup[\s\S]*keyText === 'q'[\s\S]*switchToSelected\(\)/,
  'tab switcher should switch to the selected tab when Q is released'
);
assert.match(
  switcherSource,
  /window\.addEventListener\('keyup',\s*handleKeyup,\s*true\)/,
  'tab switcher should listen for keyup so command-key release can commit the selection'
);
assert.match(
  switcherSource,
  /stopHandledKeyEvent\(event\)/,
  'tab switcher should use a shared hard-stop helper for handled keys'
);
assert.match(
  switcherSource,
  /stopImmediatePropagation/,
  'tab switcher handled keys should stop page listeners from receiving the event'
);
assert.match(
  backgroundSource,
  /advanceOnExisting:\s*true/,
  'Alt+Q command re-entry should ask an already-open switcher to advance instead of closing'
);
assert.match(
  switcherSource,
  /_lumnoTabSwitcherAdvance/,
  'tab switcher should expose an in-page advance hook for command re-entry'
);
assert.match(
  switcherSource,
  /advanceOnExisting[\s\S]*_lumnoTabSwitcherAdvance/,
  'tab switcher should advance the existing instance when requested'
);
assert.match(
  backgroundSource,
  /function shouldTrackSwitcherTab[\s\S]*isBrowserInternalUrl/,
  'Alt+Q should track browser-internal tabs as switchable targets'
);
assert.match(
  backgroundSource,
  /\.filter\(shouldTrackSwitcherTab\)/,
  'Alt+Q list construction should use trackability, not overlay-host eligibility'
);
assert.match(
  backgroundSource,
  /function canHostSwitcherSurface[\s\S]*canOpenOverlayOnUrl/,
  'Alt+Q should separately decide which tab can host the switcher surface'
);
assert.ok(
  JSON.parse(manifestSource).permissions.includes('activeTab'),
  'manifest should request activeTab so command-invoked captures can cover more active pages'
);

console.log('tab switcher hotkey tests passed');
