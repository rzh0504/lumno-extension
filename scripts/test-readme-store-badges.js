const assert = require('assert');
const fs = require('fs');
const path = require('path');

const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
const badgeAssets = [
  { name: 'chrome-web-store-large-bordered.png', sourceWidth: 496, sourceHeight: 150 },
  { name: 'microsoft-edge-addons-badge.png', sourceWidth: 1178, sourceHeight: 312 }
];

const renderedBadges = badgeAssets.map(({ name, sourceWidth, sourceHeight }) => {
  const match = readme.match(new RegExp(
    `<img[^>]+src="\\./assets/images/readme/${name}"[^>]+height="(\\d+)"[^>]+align="middle"`
  ));
  assert.ok(match, `missing vertically centered store badge markup for ${name}`);
  const height = Number(match[1]);
  const width = height * sourceWidth / sourceHeight;
  return { width, height, area: width * height };
});

const relativeDifference = (first, second) => Math.abs(first - second) / Math.min(first, second);

assert.ok(
  relativeDifference(renderedBadges[0].width, renderedBadges[1].width) < 0.08 &&
    relativeDifference(renderedBadges[0].height, renderedBadges[1].height) < 0.08,
  'store badge rendered dimensions must stay visually balanced'
);

assert.ok(
  relativeDifference(renderedBadges[0].area, renderedBadges[1].area) < 0.01,
  'store badges must have approximately equal visual area'
);

assert.ok(
  readme.indexOf('当前版本：') < readme.indexOf('chrome-web-store-large-bordered.png'),
  'store badges must appear below the current version'
);

console.log('README store badge visual balance test passed');
