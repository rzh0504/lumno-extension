const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const optionsHtml = fs.readFileSync(path.join(repoRoot, 'src/options/options.html'), 'utf8');
const optionsJs = fs.readFileSync(path.join(repoRoot, 'src/options/options.js'), 'utf8');
const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
const backgroundJs = fs.readFileSync(path.join(repoRoot, 'src/background/background.js'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

assert.strictEqual(
  packageJson.scripts['test:options-favicon-blacklist'],
  'node scripts/test-options-favicon-blacklist.js',
  'package.json should expose a dedicated favicon blacklist options test script'
);

assert.ok(
  optionsHtml.includes('_x_extension_favicon_blacklist_list_2026_unique_'),
  'options blacklist tab should include a second list for favicon request exclusions'
);
assert.ok(
  optionsHtml.includes('_x_extension_favicon_blacklist_form_2026_unique_'),
  'options blacklist tab should include a second editor form for favicon request exclusions'
);
assert.ok(
  optionsHtml.includes('data-i18n="favicon_blacklist_section_title"'),
  'options blacklist tab should localize the favicon blacklist section title'
);

[
  ['suffix', 'blacklist_match_suffix'],
  ['exact', 'blacklist_match_exact'],
  ['prefix', 'blacklist_match_prefix']
].forEach(([type, key]) => {
  const pattern = new RegExp(
    `<label[^>]*class="[^"]*_x_extension_checkbox_2026_unique_[^"]*"[^>]*id="_x_extension_favicon_blacklist_match_${type}_wrap_2026_unique_"[^>]*>\\s*` +
      `<input[^>]*id="_x_extension_favicon_blacklist_match_${type}_2026_unique_"[^>]*>\\s*` +
      `<span[^>]*data-i18n="${key}"[^>]*>`,
    'm'
  );
  assert.ok(
    pattern.test(optionsHtml),
    `${type} favicon blacklist checkbox should reuse the shared blacklist match controls`
  );
});

assert.match(
  optionsJs,
  /const FAVICON_REQUEST_BLACKLIST_STORAGE_KEY = '_x_extension_favicon_request_blacklist_2026_unique_';/,
  'options logic should store favicon request exclusions in a dedicated storage key'
);
assert.match(
  optionsJs,
  /function loadFaviconRequestBlacklistItems\(\)/,
  'options logic should load favicon request exclusion rules'
);
assert.match(
  optionsJs,
  /function renderFaviconRequestBlacklistList\(\)/,
  'options logic should render favicon request exclusion rules'
);
assert.match(
  optionsJs,
  /changes\[FAVICON_REQUEST_BLACKLIST_STORAGE_KEY\]/,
  'options logic should react to favicon request exclusion storage changes'
);

assert.match(
  newtabJs,
  /const FAVICON_REQUEST_BLACKLIST_STORAGE_KEY = '_x_extension_favicon_request_blacklist_2026_unique_';/,
  'new tab runtime should know the favicon request exclusion storage key'
);
assert.match(
  newtabJs,
  /function isUrlBlockedByFaviconRequestBlacklist\(url\)/,
  'new tab runtime should normalize and check favicon request exclusion rules'
);
assert.match(
  newtabJs,
  /changes\[FAVICON_REQUEST_BLACKLIST_STORAGE_KEY\]/,
  'new tab runtime should refresh favicon exclusion cache when storage changes'
);

assert.match(
  backgroundJs,
  /const FAVICON_REQUEST_BLACKLIST_STORAGE_KEY = '_x_extension_favicon_request_blacklist_2026_unique_';/,
  'background runtime should know the favicon request exclusion storage key'
);
assert.match(
  backgroundJs,
  /function isUrlBlockedByFaviconRequestBlacklist\(url\)/,
  'background runtime should normalize and check favicon request exclusion rules'
);
assert.match(
  backgroundJs,
  /function resolveSiteThemeColor\(targetUrl, hostOverride, preferredTheme\)[\s\S]*?isUrlBlockedByFaviconRequestBlacklist\(inputUrl\)/,
  'theme color resolution should stop when the page URL is excluded from favicon requests'
);
assert.match(
  backgroundJs,
  /function resolveFaviconCandidates\(targetUrl, hostOverride, fallbackUrl\)[\s\S]*?isUrlBlockedByFaviconRequestBlacklist\(inputUrl\)/,
  'favicon candidate resolution should stop when the page URL is excluded from favicon requests'
);
assert.match(
  backgroundJs,
  /function fetchFaviconData\(url\)[\s\S]*?isUrlBlockedByFaviconRequestBlacklist\(url\)/,
  'background favicon fetches should stop when the request URL is excluded'
);

console.log('options favicon blacklist tests passed');
