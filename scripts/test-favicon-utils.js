const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const sandbox = {
  console,
  URL
};
sandbox.globalThis = sandbox;

vm.runInNewContext(fs.readFileSync('src/shared/favicon-utils.js', 'utf8'), sandbox, {
  filename: 'src/shared/favicon-utils.js'
});

const utils = sandbox.LumnoFaviconUtils;
assert.ok(utils, 'LumnoFaviconUtils should be exported');

assert.strictEqual(utils.normalizeFaviconHost('www.Example.com'), 'example.com');
assert.strictEqual(utils.normalizeFaviconHost('app.feishu.cn'), 'feishu.cn');

assert.strictEqual(utils.isFaviconProxyUrl('https://www.google.com/s2/favicons?domain=example.com'), true);
assert.strictEqual(utils.isFaviconProxyUrl('https://example.com/favicon.ico'), false);

assert.strictEqual(utils.getChromeFaviconUrl('https://example.com/a b'), 'chrome://favicon2/?size=128&scale_factor=2x&show_fallback_monogram=1&url=https%3A%2F%2Fexample.com%2Fa%20b');
assert.strictEqual(utils.getChromeFaviconUrl('chrome://extensions/'), '');

assert.strictEqual(utils.shouldBlockFaviconForHost('localhost'), true);
assert.strictEqual(utils.shouldBlockFaviconForHost('192.168.1.8'), true);
assert.strictEqual(utils.shouldBlockFaviconForHost('service.internal'), true);
assert.strictEqual(utils.shouldBlockFaviconForHost('example.com'), false);

assert.strictEqual(utils.isBlockedLocalFaviconUrl('https://127.0.0.1/favicon.ico'), true);
assert.strictEqual(
  utils.isBlockedLocalFaviconUrl('chrome://favicon2/?url=http%3A%2F%2F192.168.1.8%2F'),
  true
);
assert.strictEqual(utils.isBlockedLocalFaviconUrl('chrome://favicon2/?url=localhost'), true);
assert.strictEqual(
  utils.isBlockedLocalFaviconUrl('chrome://favicon2/?url=https%3A%2F%2Fexample.com%2F'),
  false
);
assert.strictEqual(utils.isBlockedLocalFaviconUrl('https://example.com/favicon.ico'), false);

assert.strictEqual(utils.hasThemeTokenInUrl('https://example.com/favicon-dark.svg', 'dark'), true);
assert.strictEqual(utils.shouldSkipThemeUpgradeCandidate('https://example.com/favicon-light.svg', 'dark', ''), true);
assert.strictEqual(utils.shouldSkipThemeUpgradeCandidate('https://example.com/favicon.svg', 'dark', 'https://example.com/favicon-dark.svg'), true);

const darkGithubCandidates = utils.getKnownThemedFaviconCandidateUrls('github.com', 'dark');
assert.strictEqual(darkGithubCandidates[0], 'https://github.githubassets.com/favicons/favicon-dark.svg');
assert.strictEqual(utils.hostHasExplicitDarkFavicon('gist.github.com'), true);

const autoGithubScores = utils.getKnownThemedFaviconCandidateScores('github.com', '');
assert.strictEqual(autoGithubScores.map((candidate) => candidate.score).join(','), '52,52,36');

const darkRootCandidates = utils.getRootFaviconCandidateScores('www.Example.com', 'dark');
assert.strictEqual(darkRootCandidates[0].url, 'https://example.com/favicon-dark.svg');
assert.strictEqual(darkRootCandidates.map((candidate) => candidate.score).join(','), '34,28,16,24,16');

const darkRootCandidateUrls = utils.getRootFaviconCandidateUrls('www.Example.com', 'dark');
assert.strictEqual(darkRootCandidateUrls.slice(0, 5).join('\n'), [
  'https://example.com/favicon-dark.svg',
  'https://example.com/favicon.svg',
  'https://example.com/favicon.png',
  'https://example.com/favicon.ico',
  'https://example.com/favicon-32x32.png'
].join('\n'));
assert.ok(darkRootCandidateUrls.includes('https://example.com/apple-touch-icon-precomposed.png'));

const htmlIconCandidates = utils.parseHtmlIconCandidateScores(`
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="32x32" media="(prefers-color-scheme: dark)" data-base-href="/assets/favicon">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
`, 'https://example.com/page', 'dark');
assert.strictEqual(htmlIconCandidates[0].url, 'https://example.com/favicon.svg');
assert.strictEqual(htmlIconCandidates[0].score, 88);
assert.ok(htmlIconCandidates.some((candidate) => candidate.url === 'https://example.com/favicon-dark.svg' && candidate.score === 102));
assert.ok(htmlIconCandidates.some((candidate) => candidate.url === 'https://example.com/assets/favicon-dark.svg'));

assert.strictEqual(utils.parseCssThemeColor('#0f8').join(','), '0,255,136');
assert.strictEqual(utils.parseCssThemeColor('rgba(10, 20, 30, 0.5)').join(','), '10,20,30');
assert.strictEqual(utils.parseCssThemeColor('transparent'), null);

const themeColorCandidates = utils.parseHtmlThemeColorCandidates(`
  <meta name="theme-color" content="#112233" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
  <link rel="manifest" href="/site.webmanifest">
`, 'https://example.com/docs/page', 'dark');
assert.strictEqual(themeColorCandidates[0].accentRgb.join(','), '17,34,51');
assert.strictEqual(themeColorCandidates[0].score, 108);
assert.ok(themeColorCandidates.some((candidate) => candidate.manifestUrl === 'https://example.com/site.webmanifest'));
assert.strictEqual(utils.pickBestThemeColorCandidate(themeColorCandidates).accentRgb.join(','), '17,34,51');

console.log('favicon utils ok');
