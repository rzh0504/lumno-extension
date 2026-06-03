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

const displaySuggestionItems = Array.from({ length: 12 }, (_, index) => ({
  type: 'history',
  title: `Result ${index + 1}`,
  url: `https://example.com/${index + 1}`
}));
assert.strictEqual(
  search.limitSearchSuggestionsForDisplay(displaySuggestionItems).length,
  10,
  'display suggestions should default to the shared visible-result cap'
);
assert.deepStrictEqual(
  search.limitSearchSuggestionsForDisplay(displaySuggestionItems, { limit: 3 }).map((item) => item.title),
  ['Result 1', 'Result 2', 'Result 3'],
  'display suggestion limiting should preserve ranking order'
);
assert.deepStrictEqual(
  search.filterSearchSuggestionsBySourceTypes([
    { type: 'topSite', title: 'Frequent', url: 'https://frequent.example.com/' },
    { type: 'bookmark', title: 'Bookmark', url: 'https://bookmark.example.com/' },
    { type: 'history', title: 'History', url: 'https://history.example.com/' },
    { type: 'googleSuggest', title: 'Search Suggestion', url: 'https://google.example.com/' },
    { type: 'newtab', title: 'Search', url: 'https://search.example.com/' },
    { type: 'directUrl', title: 'Direct', url: 'https://direct.example.com/' }
  ], ['bookmark']).map((item) => item.type),
  ['bookmark', 'googleSuggest', 'newtab', 'directUrl'],
  'source filtering should only remove disabled local result types'
);

const navList = [
  { type: 'history', title: 'Example Blog Detail', url: 'https://example.com/blog/detail' },
  { type: 'history', title: 'Example Home', url: 'https://example.com/' }
];
const promoted = search.promoteStrongNavigationMatch(navList, 'example');
assert.strictEqual(promoted.title, 'Example Home', 'strong navigation promotion should choose representative pages');
assert.strictEqual(navList[0].title, 'Example Home', 'strong navigation promotion should mutate the list consistently');

function testDirectNavigationUrl(input) {
  const raw = String(input || '').trim();
  if (!raw || /\s/.test(raw) || !raw.includes('.')) {
    return '';
  }
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

const complexUrlInput = 'apps.apple.com/cn/app/%E6%97%A5%E8%BF%99%E9%94%81%E5%B1%8F';
const unrelatedOpenTabSuggestion = {
  type: 'history',
  title: '(1) App Store / X',
  url: 'https://x.com/i/bookmarks/2057032873014652963',
  _xMatchedTabId: 42
};
const directComplexUrlSuggestion = {
  type: 'directUrl',
  title: `打开 https://${complexUrlInput}`,
  url: `https://${complexUrlInput}`
};
assert.strictEqual(
  search.isDirectNavigationMatch(unrelatedOpenTabSuggestion, complexUrlInput, {
    getDirectNavigationUrl: testDirectNavigationUrl
  }),
  false,
  'unrelated open tabs should not be treated as matches for a complex URL input'
);
assert.strictEqual(
  search.isDirectNavigationMatch(directComplexUrlSuggestion, complexUrlInput, {
    getDirectNavigationUrl: testDirectNavigationUrl
  }),
  true,
  'the direct open-url suggestion should be treated as the URL navigation match'
);
const complexNavigationList = [unrelatedOpenTabSuggestion, directComplexUrlSuggestion];
const complexPromoted = search.promoteStrongNavigationMatch(complexNavigationList, complexUrlInput, {
  getDirectNavigationUrl: testDirectNavigationUrl,
  getUrlDisplay: search.getDefaultNavigationUrlDisplay
});
assert.strictEqual(
  complexPromoted.url,
  directComplexUrlSuggestion.url,
  'complex URL navigation promotion should choose the direct open-url suggestion over unrelated open tabs'
);
assert.deepStrictEqual(
  search.findSearchOpenTabMatchIndex([
    directComplexUrlSuggestion,
    unrelatedOpenTabSuggestion
  ], {
    rawQuery: complexUrlInput,
    primaryHighlightIndex: 0,
    openTabQuickSwitchEnabled: true,
    getDirectNavigationUrl: testDirectNavigationUrl
  }),
  { index: -1, reason: '' },
  'open-tab promotion should not override a direct URL primary with an unrelated open tab'
);
assert.deepStrictEqual(
  search.findSearchOpenTabMatchIndex([
    { ...directComplexUrlSuggestion, _xMatchedTabId: 99 },
    unrelatedOpenTabSuggestion
  ], {
    rawQuery: complexUrlInput,
    primaryHighlightIndex: 0,
    openTabQuickSwitchEnabled: true,
    getDirectNavigationUrl: testDirectNavigationUrl
  }),
  { index: 0, reason: 'openTab' },
  'open-tab promotion should still recognize an already-open exact URL navigation match'
);
assert.deepStrictEqual(
  search.findSearchOpenTabMatchIndex([
    { type: 'newtab', title: 'Search', url: 'https://search.example.com/?q=github' },
    unrelatedOpenTabSuggestion
  ], {
    rawQuery: 'github',
    primaryHighlightIndex: -1,
    openTabQuickSwitchEnabled: true,
    getDirectNavigationUrl: testDirectNavigationUrl
  }),
  { index: 1, reason: 'openTab' },
  'open-tab promotion should continue to work for non-URL queries'
);

const xRootSuggestion = search.createSearchSuggestion({
  title: '(1) نوف | Nouf (@Nouf0633) / X',
  url: 'https://x.com/'
}, 'history', 100);
assert.strictEqual(xRootSuggestion.title, 'X', 'configured site roots should use stable direct titles');

const xProfileSuggestion = search.createSearchSuggestion({
  title: '(1) نوف | Nouf (@Nouf0633) / X',
  url: 'https://x.com/Nouf0633'
}, 'history', 100);
assert.strictEqual(xProfileSuggestion.title, '(1) نوف | Nouf (@Nouf0633) / X', 'configured titles should not replace profile paths');

const xBookmarkSuggestion = search.createSearchSuggestion({
  title: 'My X bookmark',
  url: 'https://x.com/'
}, 'bookmark', 100);
assert.strictEqual(xBookmarkSuggestion.title, 'My X bookmark', 'bookmark titles should remain user controlled');

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

assert.deepStrictEqual(
  search.getSiteSearchProviderDisplayNameMessage({ key: 'dbai' }),
  { messageKey: 'site_search_name_doubao', fallback: 'Doubao' },
  'AI provider display names should resolve from shared mapping'
);
assert.deepStrictEqual(
  search.getSiteSearchProviderDisplayNameMessage({ key: 'jd' }),
  { messageKey: 'site_search_name_juejin', fallback: 'Juejin' },
  'legacy juejin key should resolve from shared mapping'
);
assert.deepStrictEqual(
  search.getSiteSearchProviderDisplayNameMessage({ key: 'wx' }),
  { messageKey: 'site_search_name_wechat', fallback: 'WeChat Official Accounts' },
  'wechat provider display name should describe WeChat Official Accounts search'
);
assert.strictEqual(
  search.getSiteSearchProviderDisplayNameMessage({ key: 'unknown' }),
  null,
  'unknown provider display names should fall back to caller-owned name'
);

const wechatProvider = search.getDefaultSiteSearchProviders().find((provider) => provider.key === 'wx');
assert.strictEqual(
  wechatProvider && wechatProvider.name,
  'WeChat Official Accounts',
  'default wechat provider name should describe WeChat Official Accounts search'
);

assert.strictEqual(
  search.buildSearchUrlFromTemplate('https://example.com/search?q={searchTerms}', 'hello world'),
  'https://example.com/search?q=hello%20world',
  'searchTerms templates should normalize to query templates'
);

const githubProvider = {
  key: 'gh',
  aliases: ['github'],
  name: 'GitHub',
  template: 'https://github.com/search?q={query}'
};
assert.strictEqual(
  search.findSiteSearchProvider('github', [githubProvider]),
  githubProvider,
  'provider aliases should match site-search triggers'
);
assert.strictEqual(
  search.findSiteSearchProviderByInput('docs.github.com lumno', [githubProvider]),
  githubProvider,
  'provider input parsing should match subdomains to provider hosts'
);
assert.deepStrictEqual(
  search.getInlineSiteSearchCandidate('gh lumno extension', [githubProvider]),
  { provider: githubProvider, query: 'lumno extension' },
  'inline site-search parsing should preserve the query after the provider trigger'
);
assert.ok(
  search.suggestionMatchesSiteSearchProvider(
    { type: 'topSite', title: 'GitHub Docs', url: 'https://docs.github.com/' },
    githubProvider
  ),
  'provider host matching should accept subdomain suggestions'
);
assert.strictEqual(
  search.findProviderForSiteSearchSuggestion(
    { type: 'history', title: 'GitHub Docs', url: 'https://docs.github.com/' },
    [githubProvider]
  ),
  githubProvider,
  'provider suggestion matching should work for eligible suggestion types'
);
assert.strictEqual(
  search.getSiteSearchTriggerCandidate(
    'gh',
    [githubProvider],
    { type: 'topSite', title: 'GitLab', url: 'https://gitlab.com/' },
    { matchesTopSitePrefix: () => true }
  ),
  null,
  'short provider triggers should not hijack a mismatched top-site prefix'
);

console.log('search utils tests passed');
