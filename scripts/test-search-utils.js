const assert = require('assert');
const search = require('../src/shared/search-utils.js');

function score(item, query, sourceType = 'history') {
  const context = search.buildSearchQueryContext(query);
  return search.calculateSearchRelevanceScore(item, sourceType, context, {
    getTitlePinyinMatchScore: () => ({ score: 0, reason: '' }),
    isLocalNetworkHost: () => false,
    isOwnExtensionUrl: () => false
  });
}

const shortAsciiContext = search.buildSearchQueryContext('x');
assert.strictEqual(
  search.matchesSearchQueryText({ title: 'Example Docs', url: 'https://example.com/docs' }, shortAsciiContext),
  false,
  'short ASCII terms should not match by loose contains'
);
assert.strictEqual(
  search.matchesSearchQueryText({ title: 'X Home', url: 'https://example.com/' }, shortAsciiContext),
  true,
  'short ASCII terms should still match title tokens'
);

const releaseContext = search.buildSearchQueryContext('lumno release');
const releaseCoverage = search.getSearchTermCoverageStats(releaseContext, {
  titleLower: 'lumno',
  hostname: 'lumno.kubai.design',
  urlLower: 'https://lumno.kubai.design/release/',
  titleTokens: ['lumno'],
  hostLabels: ['lumno', 'kubai', 'design'],
  pathTokens: ['release']
});
assert.strictEqual(releaseCoverage.allMatched, true, 'title + path tokens should cover multi-term queries');

const rootScore = score({ title: 'Lumno', url: 'https://lumno.kubai.design/' }, 'lumno release', 'topSite');
const releaseScore = score({ title: 'Release | Lumno', url: 'https://lumno.kubai.design/release/' }, 'lumno release', 'history');
assert.ok(releaseScore > rootScore, 'specific release page should outrank root for path-intent queries');

const selectionNow = 1_800_000_000_000;
let selectionStats = search.normalizeSearchSelectionStats(null, { now: selectionNow });
for (let i = 0; i < 12; i += 1) {
  selectionStats = search.recordSearchSelectionInStats(selectionStats, {
    query: 'ProjectX',
    title: 'ProjectX | Selected Project',
    url: 'https://selected.example.com/',
    type: 'history'
  }, { now: selectionNow + i });
}
const selectionContext = search.buildSearchQueryContext('ProjectX');
const selectedCandidate = {
  title: 'ProjectX | Selected Project',
  url: 'https://selected.example.com/',
  visitCount: 5,
  lastVisitTime: selectionNow
};
const topSiteCandidate = {
  title: 'ProjectX',
  url: 'https://projectx.example.com/',
  visitCount: 40,
  lastVisitTime: selectionNow
};
const selectionOptions = {
  now: selectionNow + 12,
  getTitlePinyinMatchScore: () => ({ score: 0, reason: '' }),
  isLocalNetworkHost: () => false,
  isOwnExtensionUrl: () => false
};
const selectedScore = search.calculateSearchRelevanceScore(selectedCandidate, 'history', selectionContext, selectionOptions) +
  search.getSearchSelectionBoost(selectedCandidate, selectionContext, selectionStats, selectionOptions);
const topSiteScore = search.calculateSearchRelevanceScore(topSiteCandidate, 'topSite', selectionContext, selectionOptions);
assert.ok(
  selectedScore > topSiteScore,
  'query-specific selection history should be strong enough to outrank a generic top-site match'
);
const selectedSelectionBoost = search.getSearchSelectionBoost(
  selectedCandidate,
  selectionContext,
  selectionStats,
  selectionOptions
);
const learnedNavigationList = [
  {
    type: 'topSite',
    title: topSiteCandidate.title,
    url: topSiteCandidate.url,
    isTopSite: true
  },
  {
    type: 'history',
    title: selectedCandidate.title,
    url: selectedCandidate.url,
    selectionBoost: selectedSelectionBoost
  }
];
const learnedNavigationMatch = search.promoteStrongNavigationMatch(learnedNavigationList, 'ProjectX');
assert.strictEqual(
  learnedNavigationMatch.url,
  selectedCandidate.url,
  'strong navigation promotion should respect query-specific selection boost'
);

const navList = [
  { type: 'history', title: 'Example Blog Detail', url: 'https://example.com/blog/detail' },
  { type: 'history', title: 'Example Home', url: 'https://example.com/' }
];
const promoted = search.promoteStrongNavigationMatch(navList, 'example');
assert.strictEqual(promoted.title, 'Example Home', 'strong navigation promotion should choose representative pages');
assert.strictEqual(navList[0].title, 'Example Home', 'strong navigation promotion should mutate the list consistently');

const dedupUrl = search.buildSearchDedupUrlKey('https://www.example.com/docs/?utm_source=x&ref=abc&keep=1#section');
assert.strictEqual(dedupUrl, 'https://example.com/docs?keep=1', 'dedupe URL should drop tracking params and hashes');

const geminiBase = search.normalizeSiteSearchProvider({
  key: 'gm',
  aliases: ['gemini'],
  name: 'Gemini',
  template: 'https://gemini.google.com/app',
  action: 'openAndSubmit',
  submitStrategy: 'geminiPrompt'
});
assert.ok(search.isAiSiteSearchProvider(geminiBase), 'openAndSubmit provider should be AI');
assert.ok(search.isInteractiveSiteSearchProvider(geminiBase), 'Gemini provider should be interactive');

const customizedGemini = search.normalizeSiteSearchProvider({
  key: 'gm',
  aliases: ['g'],
  name: 'Gemini Custom',
  template: 'https://gemini.google.com/app'
}, geminiBase);
assert.strictEqual(customizedGemini.action, 'openAndSubmit', 'customized provider should inherit action');
assert.strictEqual(customizedGemini.submitStrategy, 'geminiPrompt', 'customized provider should inherit submit strategy');

const merged = search.mergeCustomProviders([geminiBase], [customizedGemini]);
assert.strictEqual(merged.length, 1, 'custom provider should replace same-key built-in provider');
assert.strictEqual(merged[0].action, 'openAndSubmit');

assert.strictEqual(
  search.buildSearchUrlFromTemplate('https://example.com/search?q={searchTerms}', 'hello world'),
  'https://example.com/search?q=hello%20world',
  'searchTerms templates should normalize to query templates'
);

console.log('search utils tests passed');
