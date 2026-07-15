const assert = require('assert');
const fs = require('fs');
const path = require('path');

const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
const badgeAssets = [
  'chrome-web-store-large-bordered.png',
  'microsoft-edge-addons-badge.png'
];

const heights = badgeAssets.map((assetName) => {
  const match = readme.match(new RegExp(
    `<img[^>]+src="\\./assets/images/readme/${assetName}"[^>]+height="(\\d+)"`
  ));
  assert.ok(match, `missing store badge markup for ${assetName}`);
  return Number(match[1]);
});

assert.strictEqual(
  heights[0],
  heights[1],
  'Chrome Web Store and Microsoft Edge Add-ons badges must use the same height'
);

assert.ok(
  readme.indexOf('当前版本：') < readme.indexOf('chrome-web-store-large-bordered.png'),
  'store badges must appear below the current version'
);

console.log('README store badge height test passed');
