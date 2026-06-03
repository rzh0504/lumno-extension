const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const searchInputCss = fs.readFileSync(path.join(repoRoot, 'src/shared/search-input.css'), 'utf8');
const searchInputUi = fs.readFileSync(path.join(repoRoot, 'src/shared/search-input-ui.js'), 'utf8');
const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');
const overlayCss = fs.readFileSync(path.join(repoRoot, 'src/overlay/suggestions-view.css'), 'utf8');
const onboardingHtml = fs.readFileSync(path.join(repoRoot, 'src/onboarding/onboarding.html'), 'utf8');

function getRuleBlock(source, selector) {
  const start = source.indexOf(`${selector} {`);
  assert.notStrictEqual(start, -1, `missing rule: ${selector}`);
  const end = source.indexOf('}', start);
  assert.notStrictEqual(end, -1, `unterminated rule: ${selector}`);
  return source.slice(start, end + 1);
}

const rightIconRule = getRuleBlock(searchInputCss, '.x-lumno-search-input__right-icon');
assert.match(
  rightIconRule,
  /right:\s*var\(--x-ext-input-right-icon-inset,\s*13px\);[\s\S]*?top:\s*var\(--x-ext-input-right-icon-inset,\s*13px\);/,
  'settings icon should use the same inset for top and right'
);
assert.match(rightIconRule, /transform:\s*none;/, 'settings icon should not rely on translateY centering');
assert.match(
  rightIconRule,
  /border-radius:\s*var\(--x-ext-input-right-icon-radius,\s*16px\);/,
  'settings icon hover background radius should correspond to the 32px shell radius'
);

const rightIconHoverRule = getRuleBlock(searchInputCss, '.x-lumno-search-input__right-icon[data-hover-active="true"]');
assert.match(rightIconHoverRule, /transform:\s*scale\(1\.06\);/, 'settings icon hover scale should preserve equal top/right inset');
assert.doesNotMatch(rightIconHoverRule, /translateY/, 'settings icon hover should not reintroduce vertical centering');

assert.match(
  searchInputUi,
  /\['right',\s*'var\(--x-ext-input-right-icon-inset,\s*13px\)'\][\s\S]*?\['top',\s*'var\(--x-ext-input-right-icon-inset,\s*13px\)'\]/,
  'inline settings icon fallback should use the same top/right inset'
);
assert.match(
  searchInputUi,
  /\['border-radius',\s*'var\(--x-ext-input-right-icon-radius,\s*16px\)'\]/,
  'inline settings icon fallback should use the shell-corresponding hover radius'
);
assert.match(
  searchInputUi,
  /setElementStyle\(rightIcon,\s*'transform',\s*active\s*\?\s*'scale\(1\.06\)'\s*:\s*'none'/,
  'inline hover state should scale without changing equal top/right inset'
);

assert.match(
  newtabJs,
  /rightIconStyleOverrides:\s*\{[\s\S]*?'--x-ext-input-right-icon-inset':\s*'7px'[\s\S]*?\}/,
  'newtab settings icon should use a 7px top/right inset for the 44px input'
);
assert.doesNotMatch(
  newtabJs,
  /rightIcon\.style\.setProperty\('right',\s*'14px'\)/,
  'newtab should not override the equal top/right inset with a one-sided right value'
);

assert.match(
  overlayJs,
  /rightIconStyleOverrides:\s*\{[\s\S]*?'--x-ext-input-right-icon-inset':\s*'13px'[\s\S]*?\}/,
  'overlay settings icon should use a 13px top/right inset for the 56px input'
);
assert.doesNotMatch(
  overlayJs,
  /rightIconStyleOverrides:\s*\{[\s\S]*right:\s*'50px'[\s\S]*?\}/,
  'overlay settings icon should be the rightmost input icon'
);

assert.match(
  onboardingHtml,
  /\.newtab-preview-viewport \.x-lumno-search-input__container\s*\{[\s\S]*?--x-ext-input-right-icon-inset:\s*7\.5px;/,
  'onboarding newtab preview should keep equal top/right spacing for its 45px input'
);
assert.match(
  onboardingHtml,
  /\.lumno-overlay-panel \.x-lumno-search-input__container\s*\{[\s\S]*?--x-ext-input-right-icon-inset:\s*13px;/,
  'onboarding overlay preview should inherit the 56px overlay settings inset'
);
assert.match(
  onboardingHtml,
  /\.site-search-demo-card \.x-lumno-search-input__container\s*\{[\s\S]*?--x-ext-input-right-icon-inset:\s*13px;/,
  'onboarding site-search overlay demo should inherit the 56px overlay settings inset'
);
assert.doesNotMatch(
  onboardingHtml,
  /(?:newtab-preview-viewport|lumno-overlay-panel|site-search-demo-card)[\s\S]*?\.x-lumno-search-input__right-icon\s*\{[^}]*right:\s*14px;/,
  'onboarding previews should not override equal top/right settings icon spacing with a one-sided right value'
);

const closeOtherRule = getRuleBlock(
  overlayCss,
  ':is(#_x_extension_overlay_2024_unique_, #_x_extension_onboarding_overlay_demo_2026_unique_) .x-ov-close-other-tabs'
);
assert.match(
  closeOtherRule,
  /right:\s*calc\(var\(--x-ext-input-right-icon-inset,\s*13px\) \+ 36px\);[\s\S]*?top:\s*var\(--x-ext-input-right-icon-inset,\s*13px\);/,
  'overlay secondary input icon should move left of the rightmost settings icon while keeping matched top spacing'
);
assert.match(closeOtherRule, /transform:\s*none;/, 'overlay secondary input icon should not use translateY centering');
assert.match(
  closeOtherRule,
  /border-radius:\s*var\(--x-ext-input-right-icon-radius,\s*16px\);/,
  'overlay secondary input icon hover radius should match the settings icon geometry'
);

const closeOtherHoverRule = getRuleBlock(
  overlayCss,
  ':is(#_x_extension_overlay_2024_unique_, #_x_extension_onboarding_overlay_demo_2026_unique_) .x-ov-close-other-tabs[data-hover-active="true"]'
);
assert.match(closeOtherHoverRule, /transform:\s*scale\(1\.06\);/, 'overlay secondary input icon hover should preserve equal top spacing');
assert.doesNotMatch(closeOtherHoverRule, /translateY/, 'overlay secondary input icon hover should not reintroduce translateY');

console.log('search settings icon spacing tests passed');
