const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const checkboxJsPath = path.join(repoRoot, 'src/shared/checkbox.js');
const checkboxCssPath = path.join(repoRoot, 'src/shared/checkbox.css');
const optionsHtmlPath = path.join(repoRoot, 'src/options/options.html');

assert.ok(fs.existsSync(checkboxJsPath), 'shared checkbox behavior should live in src/shared/checkbox.js');
assert.ok(fs.existsSync(checkboxCssPath), 'shared checkbox styling should live in src/shared/checkbox.css');

const checkboxCss = fs.readFileSync(checkboxCssPath, 'utf8');
const optionsHtml = fs.readFileSync(optionsHtmlPath, 'utf8');
const optionsJs = fs.readFileSync(path.join(repoRoot, 'src/options/options.js'), 'utf8');
const checkbox = require(checkboxJsPath);

assert.strictEqual(
  checkbox.className,
  '_x_extension_checkbox_2026_unique_',
  'shared checkbox should expose a stable option label class'
);
assert.strictEqual(
  checkbox.groupClassName,
  '_x_extension_checkbox_group_2026_unique_',
  'shared checkbox should expose a stable group class'
);
assert.strictEqual(typeof checkbox.createRequiredGroup, 'function', 'shared checkbox should expose createRequiredGroup()');

assert.ok(
  optionsHtml.includes('<link rel="stylesheet" href="../shared/checkbox.css" />'),
  'options page should import shared checkbox CSS'
);
assert.ok(
  optionsHtml.includes('<script src="../shared/checkbox.js"></script>'),
  'options page should import shared checkbox behavior'
);
assert.ok(
  !optionsHtml.includes('._x_extension_checkbox_2026_unique_ {'),
  'options page should not own shared checkbox styling inline'
);
assert.ok(
  checkboxCss.includes('box-shadow:') &&
    checkboxCss.includes('inset 0 1px 0') &&
    checkboxCss.includes('inset 0 -1px 0'),
  'shared checkbox CSS should include inner highlight and lower edge shading'
);
assert.ok(
  checkboxCss.includes('min-height: 31px;') &&
    checkboxCss.includes('padding: 7px 8px;'),
  'shared checkbox labels should keep the checkbox mark visually centered with matching top, bottom, and left inset'
);
assert.ok(
  checkboxCss.includes('[data-theme="dark"] ._x_extension_checkbox_2026_unique_'),
  'shared checkbox CSS should include dark theme overrides'
);
assert.ok(
  checkboxCss.includes('[data-align="start"]') && checkboxCss.includes('[data-gap="wide"]'),
  'shared checkbox groups should support form-style alignment variants'
);
assert.ok(
  !optionsHtml.includes('_x_extension_blacklist_match_mode_2026_unique_') &&
    !optionsHtml.includes('_x_extension_blacklist_match_modes_2026_unique_') &&
    !optionsJs.includes('_x_extension_blacklist_match_mode_2026_unique_') &&
    !optionsJs.includes('_x_extension_blacklist_match_modes_2026_unique_'),
  'blacklist match options should use shared checkbox classes instead of private checkbox classes'
);

['topSite', 'bookmark', 'history'].forEach((type) => {
  const inputPattern = new RegExp(
    `<label[^>]*class="[^"]*_x_extension_checkbox_2026_unique_[^"]*"[^>]*>\\s*` +
      `<input[^>]*data-search-result-source-type="${type}"[^>]*>\\s*` +
      `<span[^>]*data-i18n="search_tag_(?:top_site|bookmark|history)"[^>]*>`,
    'm'
  );
  assert.ok(inputPattern.test(optionsHtml), `${type} checkbox should wrap its localized text in the label`);
});

[
  ['suffix', 'blacklist_match_suffix'],
  ['exact', 'blacklist_match_exact'],
  ['prefix', 'blacklist_match_prefix']
].forEach(([type, key]) => {
  const inputPattern = new RegExp(
    `<label[^>]*class="[^"]*_x_extension_checkbox_2026_unique_[^"]*"[^>]*id="_x_extension_blacklist_match_${type}_wrap_2026_unique_"[^>]*>\\s*` +
      `<input[^>]*id="_x_extension_blacklist_match_${type}_2026_unique_"[^>]*>\\s*` +
      `<span[^>]*data-i18n="${key}"[^>]*>`,
    'm'
  );
  assert.ok(inputPattern.test(optionsHtml), `${type} blacklist checkbox should wrap its localized text in the shared label`);
});

function createInput(type, checked) {
  const listeners = {};
  return {
    checked: Boolean(checked),
    getAttribute(name) {
      return name === 'data-search-result-source-type' ? type : '';
    },
    addEventListener(name, handler) {
      listeners[name] = handler;
    },
    trigger(name) {
      if (listeners[name]) {
        listeners[name]({ target: this });
      }
    }
  };
}

const inputs = [
  createInput('topSite', true),
  createInput('bookmark', false),
  createInput('history', true)
];
let changedValue = null;
const group = checkbox.createRequiredGroup(inputs, {
  getValue: (input) => input.getAttribute('data-search-result-source-type'),
  onChange: (value) => {
    changedValue = value;
  }
});

assert.deepStrictEqual(group.getValue(), ['topSite', 'history'], 'controller should read checked values');
group.setValue(['bookmark']);
assert.deepStrictEqual(group.getValue(), ['bookmark'], 'controller should set checked values');
inputs[1].checked = false;
inputs[1].trigger('change');
assert.strictEqual(inputs[1].checked, true, 'required groups should keep the last checked box selected');
assert.deepStrictEqual(changedValue, ['bookmark'], 'required groups should report the normalized value');

console.log('shared checkbox tests passed');
