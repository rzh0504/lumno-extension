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
const buttonBaseRule = getRule(`.${buttonBaseClass}`);
const secondaryRule = getRule('._x_extension_shortcut_secondary_2024_unique_');
const hoverRule = getRule('._x_extension_shortcut_secondary_2024_unique_:hover');
const secondaryClassPattern = /(?:class(?:Name)?\s*=\s*|class=")(['"]?)([^'"\n]*_x_extension_shortcut_secondary_2024_unique_[^'"\n]*)\1/g;
const secondaryClassUsages = Array.from(`${optionsHtml}\n${optionsJs}`.matchAll(secondaryClassPattern))
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
  'secondary buttons should not use an extra pseudo-element texture layer'
);
assert.ok(
  !/\._x_extension_shortcut_secondary_2024_unique_:active/.test(optionsHtml),
  'secondary buttons should inherit active behavior from the shared button base'
);
assert.match(
  secondaryRule,
  /background:\s*#ffffff;/,
  'secondary buttons should keep a quiet white surface'
);
assert.match(
  secondaryRule,
  /border:\s*1px solid rgba\(15,\s*23,\s*42,\s*0\.06\);/,
  'secondary buttons should use a very light visible border'
);
assert.match(
  secondaryRule,
  /box-shadow:\s*0 2px 2px rgba\(15,\s*23,\s*42,\s*0\.025\),\s*0 1px 1px rgba\(15,\s*23,\s*42,\s*0\.035\),\s*0 0 1px rgba\(15,\s*23,\s*42,\s*0\.06\),\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.75\);/,
  'secondary buttons should use only a restrained short shadow and tiny inset highlight'
);
assert.doesNotMatch(
  secondaryRule,
  /0 10px|0 6px|0 3px 2px|0 6px 14px|0 8px 20px/,
  'secondary buttons should avoid the previous heavy layered shadow'
);
assert.match(
  hoverRule,
  /box-shadow:\s*0 2px 3px rgba\(15,\s*23,\s*42,\s*0\.032\),\s*0 1px 1px rgba\(15,\s*23,\s*42,\s*0\.045\),\s*0 0 1px rgba\(15,\s*23,\s*42,\s*0\.07\),\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.8\);/,
  'secondary buttons should only slightly increase the restrained shadow on hover'
);
