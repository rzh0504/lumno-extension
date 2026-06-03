const assert = require('assert');
const fs = require('fs');

const contentHotkeySource = fs.readFileSync('src/content/hotkey-listener.js', 'utf8');
const backgroundSource = fs.readFileSync('src/background/background.js', 'utf8');
const switcherSource = fs.readFileSync('src/overlay/tab-switcher.js', 'utf8');
const manifestSource = fs.readFileSync('manifest.json', 'utf8');

function getFunctionBlock(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notStrictEqual(start, -1, `${startNeedle} should exist`);
  const end = source.indexOf(endNeedle, start);
  assert.notStrictEqual(end, -1, `${endNeedle} should exist after ${startNeedle}`);
  return source.slice(start, end);
}

function getCssRuleBlock(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));
  assert(match, `${selector} style block should exist`);
  return match[1];
}

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
  /function handleKeyup[\s\S]*event\.key === 'Alt'[\s\S]*switchToSelected\(\)/,
  'tab switcher should switch to the selected tab when Alt is released'
);
assert.match(
  switcherSource,
  /window\.addEventListener\('keyup',\s*handleKeyup,\s*true\)/,
  'tab switcher should listen for keyup so command-key release can commit the selection'
);
assert.match(
  switcherSource,
  /\.x-tab-switcher-card\s*\{[\s\S]*?cursor:\s*pointer;/,
  'tab switcher cards should use a pointer cursor for hover selection'
);
assert.match(
  switcherSource,
  /card\.addEventListener\('pointerenter'[\s\S]*selectedIndex = index[\s\S]*renderSelection\(\)/,
  'tab switcher cards should select on pointer hover'
);
assert.strictEqual(
  switcherSource.includes("createElement(document, 'div', 'x-tab-switcher-title')"),
  false,
  'tab switcher should not render a visible title row'
);
assert.match(
  switcherSource,
  /#\$\{PANEL_ID\}\s*\{[\s\S]*--x-tab-switcher-accent:\s*#2563eb;/,
  'tab switcher panel should expose a fallback accent color'
);
assert.match(
  switcherSource,
  /#\$\{PANEL_ID\}\s*\{[\s\S]*top:\s*clamp\(120px,\s*30vh,\s*320px\);/,
  'tab switcher panel should sit closer to the upper-middle of the screen'
);
assert.match(
  switcherSource,
  /#\$\{PANEL_ID\}\s*\{[\s\S]*width:\s*min\(1120px,\s*calc\(100vw - 64px\)\);/,
  'tab switcher panel should be wide enough to show more title text'
);
assert.match(
  switcherSource,
  /backdrop-filter:\s*blur\(42px\)\s*saturate\(185%\)/,
  'tab switcher panel should use a stronger acrylic backdrop blur'
);
assert.match(
  switcherSource,
  /\.x-tab-switcher-card\s*\{[\s\S]*border:\s*0;/,
  'tab switcher cards should not have a default outer frame'
);
assert.match(
  switcherSource,
  /\.x-tab-switcher-card\s*\{[\s\S]*transition:\s*outline-color 70ms ease,\s*background 70ms ease,\s*box-shadow 70ms ease;/,
  'tab switcher hover and selection transitions should be fast'
);
assert.match(
  switcherSource,
  /\.x-tab-switcher-card\[data-active="true"\]\s*\{[\s\S]*outline:\s*2px solid var\(--x-tab-switcher-card-accent,\s*var\(--x-tab-switcher-accent\)\);/,
  'tab switcher selected cards should use the selected site theme color outline'
);
assert.match(
  switcherSource,
  /\.x-tab-switcher-title-favicon/,
  'tab switcher should render the favicon before the title'
);
assert.strictEqual(
  /background\s*:/.test(getCssRuleBlock(switcherSource, '.x-tab-switcher-title-favicon')),
  false,
  'tab switcher title favicon should not draw its own background'
);
assert.match(
  switcherSource,
  /\.x-tab-switcher-name-row\s*\{[\s\S]*grid-template-columns:\s*18px minmax\(0,\s*1fr\) auto;/,
  'tab switcher title row should reserve space for favicon before the title'
);
assert.match(
  switcherSource,
  /\.x-tab-switcher-name\s*\{[\s\S]*font-size:\s*12px;[\s\S]*white-space:\s*nowrap;/,
  'tab switcher titles should be smaller and stay on one line'
);
assert.match(
  switcherSource,
  /data-thumbnail-status/,
  'tab switcher thumbnails should expose their capture status for stable fallback rendering'
);
assert.match(
  switcherSource,
  /\.x-tab-switcher-thumb\[data-thumbnail-status="pending"\]::after/,
  'tab switcher should style pending thumbnails without visible explanatory text'
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
  backgroundSource,
  /function advanceExistingTabSwitcherOnTab\(tab,\s*source,\s*callback\)[\s\S]*_lumnoTabSwitcherAdvance/,
  'Alt+Q command re-entry should have a lightweight advance path for an already-open switcher'
);
assert.match(
  backgroundSource,
  /function triggerTabSwitcherForTab\(tab,\s*source\)[\s\S]*advanceExistingTabSwitcherOnTab\(tab,\s*source,\s*\(didAdvance\)/,
  'Alt+Q should try the lightweight advance path before rebuilding the switcher payload'
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
assert.strictEqual(
  JSON.parse(manifestSource).permissions.includes('activeTab'),
  false,
  'Alt+Q should not add activeTab because it creates an extra permission prompt'
);
assert.match(
  backgroundSource,
  /function buildSwitcherTabFavicon\(tab,\s*url\)[\s\S]*getPageFaviconCandidateUrl\(url\)/,
  'Alt+Q should use the shared favicon resolver for tab icons'
);
const switcherPayloadBlock = getFunctionBlock(
  backgroundSource,
  'function normalizeSwitcherTabForPayload(tab, currentTabId)',
  'function getRecentTabsForSwitcher(tabList, currentTabId)'
);
assert.match(
  switcherPayloadBlock,
  /favIconUrl:\s*buildSwitcherTabFavicon\(tab,\s*url\)/,
  'Alt+Q payload should use resolved favicon candidates instead of raw tab.favIconUrl'
);
assert.match(
  switcherPayloadBlock,
  /accentRgb:\s*getSwitcherTabAccentRgb\(tab,\s*url\)/,
  'Alt+Q payload should include the cached site theme accent color'
);
assert.match(
  backgroundSource,
  /function getSwitcherTabAccentRgb\(tab,\s*url\)[\s\S]*getPersistedThemeEntry/,
  'Alt+Q should read site theme colors from the shared persisted theme cache'
);
assert.strictEqual(
  switcherPayloadBlock.includes("typeof tab.favIconUrl === 'string' ? tab.favIconUrl : ''"),
  false,
  'Alt+Q payload should not directly expose tab.favIconUrl'
);
assert.match(
  backgroundSource,
  /function captureSwitcherThumbnailForTab\(tab,\s*reason\)[\s\S]*chrome\.tabs\.captureVisibleTab/,
  'Alt+Q should have a reusable immediate thumbnail capture helper'
);
assert.match(
  backgroundSource,
  /const tabSwitcherThumbnailTimersByTabId = new Map\(\)/,
  'Alt+Q thumbnail scheduling should keep per-tab timers instead of one global timer'
);
assert.match(
  backgroundSource,
  /function clearScheduledSwitcherThumbnailCapture\(tabId\)[\s\S]*tabSwitcherThumbnailTimersByTabId\.delete\(tabId\)/,
  'Alt+Q thumbnail capture should clear only the pending timer for the same tab'
);
assert.match(
  backgroundSource,
  /function enqueueSwitcherThumbnailCapture\(tab,\s*reason\)[\s\S]*tabSwitcherThumbnailCaptureChain/,
  'Alt+Q thumbnail capture should serialize captureVisibleTab calls to avoid Chrome rate limits'
);
assert.match(
  backgroundSource,
  /function logSwitcherThumbnailCaptureFailure\(tab,\s*failureReason,\s*requestReason\)[\s\S]*tab-switcher-thumbnail-failed/,
  'Alt+Q thumbnail capture failures should log a debuggable reason'
);
assert.match(
  backgroundSource,
  /function markSwitcherThumbnailStatus\(tab,\s*status,\s*requestReason,\s*failureReason\)[\s\S]*setThumbnailStatus/,
  'Alt+Q thumbnail capture should persist capture status alongside thumbnails'
);
assert.match(
  backgroundSource,
  /function getSwitcherThumbnailStatusForFailureReason\(reason\)[\s\S]*restricted/,
  'Alt+Q thumbnail capture should classify restricted capture failures separately'
);
assert.match(
  switcherPayloadBlock,
  /thumbnailStatus:\s*thumbnailState\.status/,
  'Alt+Q payload should include thumbnail capture status'
);
assert.match(
  switcherPayloadBlock,
  /thumbnailReason:\s*thumbnailState\.reason/,
  'Alt+Q payload should include thumbnail capture failure reason'
);
assert.match(
  switcherSource,
  /const accentCss = normalizeAccentCss\(tab\.accentRgb\);[\s\S]*--x-tab-switcher-card-accent/,
  'tab switcher cards should expose each tab accent as a per-card CSS variable'
);
const scheduleThumbnailBlock = getFunctionBlock(
  backgroundSource,
  'function scheduleSwitcherThumbnailCapture(tab, reason)',
  'function normalizeSwitcherTabForPayload(tab, currentTabId)'
);
assert.strictEqual(
  scheduleThumbnailBlock.includes('clearTimeout(tabSwitcherThumbnailTimer)'),
  false,
  'Alt+Q thumbnail scheduling should not cancel every other pending tab capture'
);
assert.match(
  scheduleThumbnailBlock,
  /tabSwitcherThumbnailTimersByTabId\.set\(tab\.id,\s*timer\)/,
  'Alt+Q thumbnail scheduling should store pending capture timers by tab id'
);
assert.match(
  scheduleThumbnailBlock,
  /markSwitcherThumbnailStatus\(tab,\s*'pending',\s*reason/,
  'Alt+Q thumbnail scheduling should mark thumbnails as pending before deferred capture'
);
const triggerSwitcherBlock = getFunctionBlock(
  backgroundSource,
  'function triggerTabSwitcherForTab(tab, source)',
  'function detectAnyActiveVideoPiP(callback)'
);
assert.match(
  triggerSwitcherBlock,
  /if \(didAdvance\)[\s\S]*return;[\s\S]*ensureTabSwitcherStateLoaded/,
  'Alt+Q fast cycling should return before waiting on thumbnail state loading'
);
assert.match(
  triggerSwitcherBlock,
  /enqueueSwitcherThumbnailCapture\(activeTab,\s*'command'\)[\s\S]*getRecentTabsForSwitcher\(tabList,\s*activeTab\.id\)/,
  'Alt+Q should queue the active tab thumbnail capture before building the switcher payload'
);
assert.strictEqual(
  triggerSwitcherBlock.includes("scheduleSwitcherThumbnailCapture(activeTab, 'command')"),
  false,
  'Alt+Q command path should not defer the active-tab thumbnail until after render'
);

console.log('tab switcher hotkey tests passed');
