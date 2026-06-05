const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const optionsHtml = fs.readFileSync(path.join(repoRoot, 'src/options/options.html'), 'utf8');
const optionsJs = fs.readFileSync(path.join(repoRoot, 'src/options/options.js'), 'utf8');

function getRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = optionsHtml.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `${selector} should exist in options CSS`);
  return match[1];
}

const buttonBaseClass = '_x_extension_shortcut_submit_2024_unique_';
const secondaryClass = '_x_extension_shortcut_secondary_2024_unique_';
const primaryClass = '_x_extension_shortcut_submit_primary_2024_unique_';
const buttonBaseRule = getRule(`.${buttonBaseClass}`);
const buttonBaseHoverRule = getRule(`.${buttonBaseClass}:hover`);
const buttonBaseBeforeRule = getRule(`.${buttonBaseClass}::before`);
const buttonBaseFocusRule = getRule(`.${buttonBaseClass}:focus-visible`);
const secondaryRule = getRule('._x_extension_shortcut_secondary_2024_unique_');
const primaryRule = getRule('._x_extension_shortcut_submit_primary_2024_unique_');
const hoverRule = getRule('._x_extension_shortcut_secondary_2024_unique_:hover');
const darkSecondaryRule = getRule('body[data-theme="dark"] ._x_extension_shortcut_secondary_2024_unique_');
const darkHoverRule = getRule('body[data-theme="dark"] ._x_extension_shortcut_secondary_2024_unique_:hover');
const darkPrimaryRule = getRule('body[data-theme="dark"] ._x_extension_shortcut_submit_primary_2024_unique_');
const confirmActionButtonRule = getRule('._x_extension_confirm_actions_2024_unique_ ._x_extension_shortcut_submit_2024_unique_');
const secondaryClassPattern = /(?:class(?:Name)?\s*=\s*|class=")(['"]?)([^'"\n]*_x_extension_shortcut_secondary_2024_unique_[^'"\n]*)\1/g;
const secondaryClassUsages = Array.from(`${optionsHtml}\n${optionsJs}`.matchAll(secondaryClassPattern))
  .map((match) => match[2]);
const primaryClassPattern = /(?:class(?:Name)?\s*=\s*|class=")(['"]?)([^'"\n]*_x_extension_shortcut_submit_primary_2024_unique_[^'"\n]*)\1/g;
const primaryClassUsages = Array.from(`${optionsHtml}\n${optionsJs}`.matchAll(primaryClassPattern))
  .map((match) => match[2]);

assert.match(
  buttonBaseRule,
  /box-sizing:\s*border-box;/,
  'button base should own box sizing'
);
assert.match(
  buttonBaseRule,
  /border-radius:\s*999px;/,
  'button base should keep the shared pill radius'
);
assert.match(
  buttonBaseRule,
  /display:\s*inline-flex;/,
  'button base should own the shared inline-flex layout'
);
assert.match(
  buttonBaseRule,
  /min-height:\s*var\(--settings-button-min-height,\s*auto\);/,
  'button base should own shared min-height through a custom property'
);
assert.match(
  buttonBaseRule,
  /padding:\s*var\(--settings-button-padding,\s*8px 14px\);/,
  'button base should own shared padding through a custom property'
);
assert.match(
  buttonBaseRule,
  /border:\s*1px solid var\(--settings-button-border-color,\s*transparent\);/,
  'button base should reserve one shared border box for all variants'
);
assert.match(
  buttonBaseRule,
  /background:\s*var\(--settings-button-bg,\s*var\(--tab-active-bg\)\);/,
  'button base should own background through a custom property'
);
assert.match(
  buttonBaseRule,
  /background-clip:\s*padding-box;/,
  'button base should keep backgrounds out of the shared border ring layer'
);
assert.match(
  buttonBaseRule,
  /color:\s*var\(--settings-button-color,\s*var\(--tab-active-text\)\);/,
  'button base should own text color through a custom property'
);
assert.match(
  buttonBaseRule,
  /font-size:\s*var\(--settings-button-font-size,\s*12px\);/,
  'button base should own font size through a custom property'
);
assert.match(
  buttonBaseRule,
  /box-shadow:\s*var\(--settings-button-shadow,\s*none\);/,
  'button base should own shadow through a custom property'
);
assert.match(
  buttonBaseHoverRule,
  /background:\s*var\(--settings-button-hover-bg,\s*var\(--settings-button-bg,\s*var\(--tab-active-bg\)\)\);/,
  'button base hover should use the shared hover background property'
);
assert.match(
  buttonBaseHoverRule,
  /border-color:\s*var\(--settings-button-hover-border-color,\s*var\(--settings-button-border-color,\s*transparent\)\);/,
  'button base hover should use the shared hover border property'
);
assert.match(
  buttonBaseBeforeRule,
  /box-shadow:\s*var\(--settings-button-before-shadow,\s*none\);/,
  'button base pseudo ring should be controlled by a shared custom property'
);
assert.match(
  buttonBaseFocusRule,
  /outline:\s*var\(--settings-button-focus-outline,\s*2px solid rgba\(59,\s*130,\s*246,\s*0\.45\)\);/,
  'button base focus ring should be controlled by a shared custom property'
);
assert.match(
  buttonBaseFocusRule,
  /outline-offset:\s*var\(--settings-button-focus-outline-offset,\s*2px\);/,
  'button base focus offset should be controlled by a shared custom property'
);
assert.ok(
  secondaryClassUsages.length > 0,
  'options should have secondary button usages'
);
secondaryClassUsages.forEach((className) => {
  assert.ok(
    className.includes(buttonBaseClass),
    `secondary button usage should include the shared button base: ${className}`
  );
});
assert.ok(
  primaryClassUsages.length > 0,
  'options should have primary button usages'
);
primaryClassUsages.forEach((className) => {
  assert.ok(
    className.includes(buttonBaseClass),
    `primary button usage should include the shared button base: ${className}`
  );
});
assert.match(
  primaryRule,
  /--settings-button-bg:\s*linear-gradient\(180deg,\s*#404859 0%,\s*#273042 100%\);/,
  'primary buttons should use the onboarding primary gradient through the shared custom property'
);
assert.match(
  primaryRule,
  /--settings-button-border-color:\s*#040404;/,
  'primary buttons should use the shared border layer for the single black ring'
);
assert.match(
  primaryRule,
  /--settings-button-before-shadow:\s*inset 0 1px 1\.6px rgba\(255,\s*255,\s*255,\s*0\.34\);/,
  'primary buttons should keep only the onboarding top highlight in the shared pseudo layer'
);
assert.doesNotMatch(
  primaryRule,
  /--settings-button-before-shadow:[\s\S]*?inset 0 0 0 1px #040404/,
  'primary buttons should not draw a second black ring in the pseudo layer'
);
assert.match(
  primaryRule,
  /--settings-button-focus-outline:\s*none;/,
  'primary buttons should not draw an extra focus outline outside their built-in ring'
);
assert.match(
  primaryRule,
  /--settings-button-focus-outline-offset:\s*0;/,
  'primary buttons should not leave an outline gap around their built-in ring'
);
assert.doesNotMatch(
  primaryRule,
  /rgba\(59,\s*130,\s*246|rgba\(4,\s*4,\s*4,\s*0\.9\)/,
  'primary buttons should not add a second focus ring around the built-in black ring'
);
assert.doesNotMatch(
  primaryRule,
  /(^|\n)\s*(border|background|color|box-shadow):/,
  'primary variant should not duplicate base button declarations'
);
[
  'all',
  'box-sizing',
  'cursor',
  'align-self',
  'padding',
  'border-radius',
  'font-size',
  'font-weight',
  'display',
  'align-items',
  'gap'
].forEach((property) => {
  assert.ok(
    !new RegExp(`(^|\\n)\\s*${property}:`).test(secondaryRule),
    `secondary variant should not own base button property: ${property}`
  );
});
assert.ok(
  !/(?:^|\n)\s*\._x_extension_shortcut_secondary_2024_unique_::before\s*\{/.test(optionsHtml),
  'secondary buttons should not define their own pseudo-element layer'
);
assert.ok(
  !/\._x_extension_shortcut_secondary_2024_unique_:active/.test(optionsHtml),
  'secondary buttons should inherit active behavior from the shared button base'
);
assert.match(
  confirmActionButtonRule,
  /--settings-button-font-size:\s*12px;/,
  'confirm action buttons should customize shared button font size through the base button variable'
);
assert.match(
  confirmActionButtonRule,
  /--settings-button-padding:\s*6px 12px;/,
  'confirm action buttons should customize shared button padding through the base button variable'
);
assert.ok(
  !/(?:^|\n)\s*\._x_extension_confirm_actions_2024_unique_\s+\._x_extension_shortcut_secondary_2024_unique_\s*\{/.test(optionsHtml),
  'confirm actions should not resize only the secondary button variant'
);
assert.match(
  secondaryRule,
  /--settings-button-bg:\s*#ffffff;/,
  'secondary buttons should keep a quiet white surface'
);
assert.match(
  secondaryRule,
  /--settings-button-border-color:\s*rgba\(15,\s*23,\s*42,\s*0\.06\);/,
  'secondary buttons should use a very light visible border'
);
assert.match(
  secondaryRule,
  /--settings-button-shadow:\s*0 2px 2px rgba\(15,\s*23,\s*42,\s*0\.025\),\s*0 1px 1px rgba\(15,\s*23,\s*42,\s*0\.035\),\s*0 0 1px rgba\(15,\s*23,\s*42,\s*0\.06\),\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.75\);/,
  'secondary buttons should use only a restrained short shadow and tiny inset highlight'
);
assert.doesNotMatch(
  secondaryRule,
  /0 10px|0 6px|0 3px 2px|0 6px 14px|0 8px 20px/,
  'secondary buttons should avoid the previous heavy layered shadow'
);
assert.match(
  hoverRule,
  /--settings-button-hover-shadow:\s*0 2px 3px rgba\(15,\s*23,\s*42,\s*0\.032\),\s*0 1px 1px rgba\(15,\s*23,\s*42,\s*0\.045\),\s*0 0 1px rgba\(15,\s*23,\s*42,\s*0\.07\),\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.8\);/,
  'secondary buttons should only slightly increase the restrained shadow on hover'
);
assert.match(
  darkSecondaryRule,
  /--settings-button-bg:\s*color-mix\(in srgb,\s*var\(--control-bg\)\s*90%,\s*#475569\s*10%\);/,
  'dark secondary buttons should use a slightly cooler dark control surface'
);
assert.match(
  darkSecondaryRule,
  /--settings-button-color:\s*var\(--panel-text\);/,
  'dark secondary buttons should use the dark-mode text color'
);
assert.match(
  darkSecondaryRule,
  /--settings-button-border-color:\s*rgba\(148,\s*163,\s*184,\s*0\.18\);/,
  'dark secondary buttons should use a subtle cool-gray ring'
);
assert.doesNotMatch(
  darkSecondaryRule,
  /background:\s*#ffffff;|color:\s*#1f2937;|rgba\(15,\s*23,\s*42,|border-color:\s*var\(--tab-border\);|inset 0 1px/,
  'dark secondary buttons should not reuse light-mode colors or keep an inner top highlight'
);
assert.match(
  darkSecondaryRule,
  /--settings-button-shadow:\s*0 1px 1px rgba\(0,\s*0,\s*0,\s*0\.18\);/,
  'dark secondary buttons should use a flat shadow without an internal top highlight'
);
assert.match(
  darkHoverRule,
  /--settings-button-hover-bg:\s*color-mix\(in srgb,\s*var\(--control-hover-bg\)\s*86%,\s*#5b6b84\s*14%\);/,
  'dark secondary button hover should shift to a clearer dark hover surface'
);
assert.match(
  darkHoverRule,
  /--settings-button-hover-border-color:\s*rgba\(164,\s*180,\s*207,\s*0\.32\);/,
  'dark secondary button hover should visibly change the ring color'
);
assert.match(
  darkPrimaryRule,
  /--settings-button-bg:\s*linear-gradient\(180deg,\s*#4a566c 0%,\s*#334157 100%\);/,
  'dark primary buttons should only swap the primary gradient colors'
);
assert.doesNotMatch(
  darkPrimaryRule,
  /--settings-button-shadow|--settings-button-before-shadow|border-color|box-shadow:/,
  'dark primary buttons should not redefine primary structure, rings, or shadows'
);
assert.ok(
  !/(?:^|\n)\s*body\[data-theme="dark"\]\s+\._x_extension_shortcut_submit_primary_2024_unique_::before\s*\{/.test(optionsHtml),
  'dark primary buttons should not define a separate pseudo-element rule'
);
assert.ok(
  !/(?:^|\n)\s*body\[data-theme="dark"\]\s+\._x_extension_shortcut_submit_primary_2024_unique_:hover\s*\{/.test(optionsHtml),
  'dark primary hover should be controlled by color variables on the dark primary rule'
);
assert.ok(
  !/(?:^|\n)\s*\._x_extension_shortcut_submit_primary_2024_unique_::before\s*\{/.test(optionsHtml),
  'primary buttons should use the shared button pseudo-element instead of a variant pseudo-element'
);
