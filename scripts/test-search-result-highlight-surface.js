const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const newtabHtml = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.html'), 'utf8');
const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
const overlayCss = fs.readFileSync(path.join(repoRoot, 'src/overlay/suggestions-view.css'), 'utf8');
const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');

function getCssRuleBlock(source, selector) {
  const start = source.indexOf(`${selector} {`);
  assert.notStrictEqual(start, -1, `missing CSS rule: ${selector}`);
  const end = source.indexOf('}', start);
  assert.notStrictEqual(end, -1, `unterminated CSS rule: ${selector}`);
  return source.slice(start, end + 1);
}

const newtabSuggestionBlock = getCssRuleBlock(newtabHtml, '.x-nt-suggestion-item');
const newtabActiveSuggestionBlock = getCssRuleBlock(
  newtabHtml,
  '.x-nt-suggestion-item[data-row-state="active"]'
);
const overlaySuggestionBlock = getCssRuleBlock(
  overlayCss,
  ':is(#_x_extension_overlay_2024_unique_, #_x_extension_onboarding_overlay_demo_2026_unique_) .x-ov-suggestion-item'
);
const overlayDarkActiveFaviconBlock = getCssRuleBlock(
  overlayCss,
  ':is(#_x_extension_overlay_2024_unique_[data-theme="dark"], #_x_extension_onboarding_overlay_demo_2026_unique_[data-theme="dark"]) .x-ov-suggestion-item[data-row-state="active"] .x-ov-suggestion-icon-slot[data-favicon="true"]'
);
const newtabDarkActiveFaviconBlock = getCssRuleBlock(
  newtabHtml,
  'body[data-theme="dark"] .x-nt-suggestion-item[data-row-state="active"] .x-nt-suggestion-icon-slot[data-favicon="true"]'
);

assert.match(
  newtabActiveSuggestionBlock,
  /background:\s*var\(--x-nt-suggestion-active-bg[\s\S]*?border-color:\s*var\(--x-nt-suggestion-active-border/,
  'newtab active suggestion rows should keep the existing background and border highlight'
);

assert.doesNotMatch(
  newtabActiveSuggestionBlock,
  /box-shadow:/,
  'newtab active suggestion rows should not add inner highlight or shadow'
);

assert.match(
  newtabSuggestionBlock,
  /transition:\s*background-color 0\.2s ease,\s*border-color 0\.2s ease;/,
  'newtab suggestion row transitions should not animate a removed shadow'
);

assert.match(
  overlaySuggestionBlock,
  /background:\s*var\(--x-ov-suggestion-row-bg[\s\S]*?border:\s*1px solid var\(--x-ov-suggestion-row-border/,
  'overlay suggestion rows should keep the existing background and border highlight'
);

assert.doesNotMatch(
  overlaySuggestionBlock,
  /box-shadow:/,
  'overlay suggestion rows should not expose an active-row shadow'
);

assert.match(
  overlaySuggestionBlock,
  /transition:\s*background-color 0\.2s ease,\s*border-color 0\.2s ease;/,
  'overlay suggestion row transitions should not animate a removed shadow'
);

assert.match(
  overlayDarkActiveFaviconBlock,
  /background-color:\s*#FFFFFF;/,
  'overlay dark active favicon slots should render on a white rounded rectangle'
);

assert.match(
  newtabDarkActiveFaviconBlock,
  /background-color:\s*#FFFFFF;/,
  'newtab dark active favicon slots should render on a white rounded rectangle'
);

assert.match(
  overlayJs,
  /function setSuggestionRowColors\(item,\s*bg,\s*border\)[\s\S]*?--x-ov-suggestion-row-bg[\s\S]*?--x-ov-suggestion-row-border/,
  'overlay row color helper should only control background and border'
);

assert.match(
  overlayJs,
  /function applySearchSuggestionHighlight\(item,\s*theme\)[\s\S]*?setSuggestionRowColors\(item,\s*highlight\.bg,\s*highlight\.border\);/,
  'overlay active suggestions should not apply an extra shadow'
);

assert.match(
  overlayJs,
  /function applySearchSuggestionHighlight\(item,\s*theme\)[\s\S]*?item\.setAttribute\('data-row-state',\s*'active'\);/,
  'overlay active suggestions should expose row state for dark favicon styling'
);

assert.match(
  overlayJs,
  /function resetSearchSuggestion\(item\)[\s\S]*?item\.removeAttribute\('data-row-state'\);/,
  'overlay inactive suggestions should clear row state for dark favicon styling'
);

assert.match(
  overlayJs,
  /iconSlot\.setAttribute\('data-favicon',\s*isFaviconIcon \? 'true' : 'false'\);/,
  'overlay favicon slots should expose whether their child is a favicon'
);

assert.doesNotMatch(
  newtabJs + overlayJs,
  /getSuggestionActiveShadow|suggestion-active-shadow|suggestion-row-shadow|rgba\(255, 255, 255, 0\.40\)/,
  'search result highlight code should not keep the removed active shadow helpers or variables'
);

console.log('search result highlight surface tests passed');
