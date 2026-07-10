const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const newtabHtml = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.html'), 'utf8');
const overlayShell = fs.readFileSync(path.join(repoRoot, 'src/overlay/shell.js'), 'utf8');
const overlaySearchPanel = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
const overlayCss = fs.readFileSync(path.join(repoRoot, 'src/overlay/suggestions-view.css'), 'utf8');
const searchInputCss = fs.readFileSync(path.join(repoRoot, 'src/shared/search-input.css'), 'utf8');
const searchInputUi = fs.readFileSync(path.join(repoRoot, 'src/shared/search-input-ui.js'), 'utf8');
const compensatedCornerShape = 'superellipse(1.25)';
const compensatedCornerShapePattern = 'superellipse\\(1\\.25\\)';
const newtabShellRadius = 'var(--x-nt-search-shell-radius, 32px)';
const newtabShellTopRadius = 'var(--x-nt-search-shell-top-radius, 28px)';

function assertSupportsCompensatedCornerShape(source, label) {
  assert.match(
    source,
    new RegExp(`@supports\\s*\\(\\s*corner-shape:\\s*${compensatedCornerShapePattern}\\s*\\)\\s*\\{`),
    `${label} should gate corner-shape behind @supports`
  );
}

function assertRuleHasCornerShape(source, selector, label) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapedSelector}[\\s\\S]*?\\{[\\s\\S]*?corner-shape:\\s*${compensatedCornerShapePattern};`);
  assert.match(source, pattern, `${label} should opt into the compensated corner-shape`);
}

function assertRuleHasRadius(source, selector, radius, label) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedRadius = radius.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapedSelector}[\\s\\S]*?\\{[\\s\\S]*?border-radius:\\s*${escapedRadius};`);
  assert.match(source, pattern, `${label} should use ${radius} border radius`);
}

assertRuleHasRadius(
  newtabHtml,
  '#_x_extension_newtab_root_2024_unique_',
  newtabShellRadius,
  'newtab input root surface'
);
assert.match(
  newtabHtml,
  /:root[\s\S]*?\{[\s\S]*?--x-nt-search-shell-radius:\s*32px;[\s\S]*?--x-nt-search-shell-top-radius:\s*28px;/,
  'newtab closed and open shells should share the same radius tokens'
);
assert.match(
  newtabHtml,
  /#_x_extension_newtab_root_2024_unique_[\s\S]*?\{[\s\S]*?min-height:\s*56px;/,
  'newtab closed input shell should normalize its 32px radius to the same 28px visible top radius as the open shell'
);
assertRuleHasRadius(
  newtabHtml,
  '#_x_extension_newtab_search_layer_2024_unique_',
  newtabShellTopRadius,
  'newtab inset search layer'
);
assertRuleHasRadius(
  newtabHtml,
  'body[data-nt-suggestions-open="true"] #_x_extension_newtab_search_layer_2024_unique_',
  `${newtabShellTopRadius} ${newtabShellTopRadius} 0 0`,
  'newtab open inset search layer'
);
assertRuleHasRadius(
  newtabHtml,
  '#_x_extension_newtab_suggestions_surface_2026_unique_',
  `${newtabShellTopRadius} ${newtabShellTopRadius} ${newtabShellRadius} ${newtabShellRadius}`,
  'newtab suggestions backplate'
);
assertRuleHasRadius(
  newtabHtml,
  '#_x_extension_newtab_suggestions_outline_2026_unique_',
  `${newtabShellTopRadius} ${newtabShellTopRadius} ${newtabShellRadius} ${newtabShellRadius}`,
  'newtab suggestions outline'
);
assertRuleHasRadius(
  newtabHtml,
  '#_x_extension_newtab_suggestions_container_2024_unique_',
  `0 0 ${newtabShellTopRadius} ${newtabShellTopRadius}`,
  'newtab suggestions content inset'
);
assertRuleHasRadius(searchInputCss, '.x-lumno-search-input', '32px 32px 0 0', 'shared search input shell');
assertRuleHasRadius(searchInputCss, '.x-lumno-search-input__container', '32px 32px 0 0', 'shared search input container');
assert.match(
  searchInputUi,
  /\['border-radius',\s*'32px 32px 0 0'\]/,
  'shared inline search input fallback should use the 32px shell radius'
);
assertRuleHasRadius(
  overlayCss,
  ':is(#_x_extension_overlay_2024_unique_, #_x_extension_onboarding_overlay_demo_2026_unique_) .x-ov-suggestions-container',
  '0 0 32px 32px',
  'overlay suggestions container'
);
assert.match(overlayShell, /border-radius:\s*32px !important;/, 'overlay panel should use a 32px shell radius');
assert.match(
  overlaySearchPanel,
  /element\.style\.setProperty\(property,\s*value,\s*'important'\);/,
  'overlay panel radius updates should override the initial important shell radius'
);
assert.match(
  overlaySearchPanel,
  /setOverlayPanelScopedStyle\(\s*overlay,\s*'border-radius',\s*shouldCollapse\s*\?\s*'32px \/ 28px'\s*:\s*'32px 32px 32px 32px \/ 28px 28px 32px 32px'\s*\)/,
  'overlay panel should keep symmetric collapsed corners and a stable expanded top radius'
);
assert.match(
  overlaySearchPanel,
  /setInputScopedStyle\(\s*inputContainer,\s*'border-radius',\s*shouldCollapse\s*\?\s*'32px \/ 28px'\s*:\s*'32px 32px 0 0 \/ 28px 28px 0 0'\s*\)/,
  'overlay input container should keep symmetric collapsed corners and a stable expanded top radius'
);

assertSupportsCompensatedCornerShape(newtabHtml, 'newtab search surfaces');
assertRuleHasCornerShape(
  newtabHtml,
  '#_x_extension_newtab_root_2024_unique_',
  'newtab input root surface'
);
assertRuleHasCornerShape(
  newtabHtml,
  '#_x_extension_newtab_search_layer_2024_unique_',
  'newtab search input layer'
);
assertRuleHasCornerShape(
  newtabHtml,
  '#_x_extension_newtab_suggestions_surface_2026_unique_',
  'newtab suggestions backplate'
);
assertRuleHasCornerShape(
  newtabHtml,
  '#_x_extension_newtab_suggestions_outline_2026_unique_',
  'newtab suggestions outline'
);
assertRuleHasCornerShape(
  newtabHtml,
  '#_x_extension_newtab_suggestions_container_2024_unique_',
  'newtab suggestions container'
);
assertRuleHasCornerShape(newtabHtml, '.x-nt-suggestion-item', 'newtab suggestion rows');

assert.match(
  overlayShell,
  /CSS\.supports\(\s*'corner-shape'\s*,\s*shape\s*\)/,
  'overlay panel should check runtime corner-shape support before writing inline styles'
);
assert.match(
  overlayShell,
  new RegExp(`applyCornerShapeIfSupported\\(\\s*overlay\\s*,\\s*'${compensatedCornerShapePattern}'\\s*,\\s*'important'\\s*\\)`),
  'overlay panel should opt into the supported compensated corner shape'
);

assertSupportsCompensatedCornerShape(overlayCss, 'overlay search results surfaces');
assertRuleHasCornerShape(
  overlayCss,
  ':is(#_x_extension_overlay_2024_unique_, #_x_extension_onboarding_overlay_demo_2026_unique_) .x-ov-suggestions-container',
  'overlay suggestions container'
);
assertRuleHasCornerShape(overlayCss, '.x-ov-suggestion-item', 'overlay suggestion rows');

assertSupportsCompensatedCornerShape(searchInputCss, 'shared search input surfaces');
assertRuleHasCornerShape(searchInputCss, '.x-lumno-search-input', 'shared search input shell');
assertRuleHasCornerShape(searchInputCss, '.x-lumno-search-input__container', 'shared search input container');

console.log('search corner-shape tests passed');
