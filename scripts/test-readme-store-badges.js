const assert = require('assert');
const fs = require('fs');
const path = require('path');

const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
const badgeAssets = [
  'chrome-web-store-large-bordered.png',
  'microsoft-edge-addons-badge.png'
];

const widths = badgeAssets.map((assetName) => {
  const match = readme.match(new RegExp(
    `<img[^>]+src="\\./assets/images/readme/${assetName}"[^>]+width="(\\d+)"`
  ));
  assert.ok(match, `missing store badge markup for ${assetName}`);
  return Number(match[1]);
});

assert.strictEqual(
  widths[0],
  widths[1],
  'Chrome Web Store and Microsoft Edge Add-ons badges must use the same width'
);

assert.ok(
  readme.indexOf('当前版本：') < readme.indexOf('chrome-web-store-large-bordered.png'),
  'store badges must appear below the current version'
);

console.log('README store badge width test passed');
