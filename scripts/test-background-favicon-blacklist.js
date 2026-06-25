const assert = require('assert');
const fs = require('fs');
const path = require('path');

const blacklistUtils = require('../src/shared/blacklist-utils.js');

const repoRoot = path.resolve(__dirname, '..');
const backgroundSource = fs.readFileSync(path.join(repoRoot, 'src/background/background.js'), 'utf8');

function extractFunctionSource(source, name) {
  const needle = `function ${name}(`;
  const start = source.indexOf(needle);
  assert.notStrictEqual(start, -1, `missing function ${name}`);
  const openBrace = source.indexOf('{', start);
  assert.notStrictEqual(openBrace, -1, `missing opening brace for ${name}`);
  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error(`unterminated function ${name}`);
}

const extractedFunctions = [
  'normalizeFaviconRequestBlacklistItems',
  'loadFaviconRequestBlacklistItems',
  'getFaviconRequestMatchUrl',
  'isUrlBlockedByFaviconRequestBlacklist',
  'resolveSiteThemeColor',
  'buildFaviconFallbackCandidates',
  'dedupeAndSortFaviconCandidates',
  'resolveFaviconCandidates',
  'fetchFaviconData'
].map((name) => extractFunctionSource(backgroundSource, name)).join('\n\n');

const factory = new Function('deps', 'Buffer', `
  const BLACKLIST_UTILS = deps.BLACKLIST_UTILS;
  const FAVICON_UTILS = deps.FAVICON_UTILS;
  let faviconRequestBlacklistCache = deps.faviconRequestBlacklistCache;
  let faviconRequestBlacklistPromise = null;
  const FAVICON_REQUEST_BLACKLIST_STORAGE_KEY = '_x_extension_favicon_request_blacklist_2026_unique_';
  const storageArea = deps.storageArea;
  const faviconDataCache = new Map();
  const faviconPending = new Map();
  const siteThemeColorCache = new Map();
  const siteThemeColorPending = new Map();

  function logBlockedLocalFavicon(url, source) {
    deps.blockedLogs.push({ url, source });
  }

  function shouldBlockFaviconForHost() {
    return false;
  }

  function normalizeFaviconHost(hostname) {
    return String(hostname || '').trim().toLowerCase().replace(/^www\\./i, '');
  }

  function normalizeThemePreference(theme) {
    return String(theme || '').trim().toLowerCase();
  }

  function canFetchPageForFavicon() {
    return true;
  }

  function parseHtmlThemeColorCandidates() {
    deps.themeParseCalls += 1;
    return [];
  }

  function resolveThemeColorCandidates() {
    deps.themeResolveCalls += 1;
    return Promise.resolve(null);
  }

  function persistSiteThemeColorForSwitcher() {
    deps.persistCalls += 1;
  }

  function getExtensionFaviconUrl(pageUrl) {
    return 'chrome-extension://test/_favicon/?pageUrl=' + encodeURIComponent(pageUrl);
  }

  function getGstaticFaviconUrl(pageUrl) {
    return 'https://t2.gstatic.cn/faviconV2?url=' + encodeURIComponent(pageUrl);
  }

  function isBlockedLocalFaviconUrl(url) {
    const blockedByLocalRules = typeof FAVICON_UTILS.isBlockedLocalFaviconUrl === 'function'
      ? FAVICON_UTILS.isBlockedLocalFaviconUrl(url)
      : false;
    return blockedByLocalRules || isUrlBlockedByFaviconRequestBlacklist(url);
  }

  function arrayBufferToBase64(buffer) {
    return Buffer.from(buffer).toString('base64');
  }

  function fetch(url, options) {
    deps.fetchCalls.push({ url, options });
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('<html></html>'),
      blob: () => Promise.resolve({
        size: 4,
        type: 'image/png',
        arrayBuffer: () => Promise.resolve(Uint8Array.from([1, 2, 3, 4]).buffer)
      })
    });
  }

  ${extractedFunctions}

  return {
    isUrlBlockedByFaviconRequestBlacklist,
    resolveSiteThemeColor,
    resolveFaviconCandidates,
    fetchFaviconData
  };
`);

async function run() {
  const deps = {
    BLACKLIST_UTILS: blacklistUtils,
    FAVICON_UTILS: {
      getCanonicalPageUrlForFavicon(url) {
        return String(url || '').trim();
      },
      isBlockedLocalFaviconUrl() {
        return false;
      }
    },
    faviconRequestBlacklistCache: blacklistUtils.normalizeItems([
      { pattern: 'blocked.example.com', matchModes: ['suffix'] },
      { pattern: 'vpn.example.com/private', matchModes: ['prefix'] },
      { pattern: 'exact.example.com/only-this', matchModes: ['exact'] }
    ], 'prefix'),
    storageArea: {
      get(_keys, callback) {
        callback({
          _x_extension_favicon_request_blacklist_2026_unique_: []
        });
      }
    },
    blockedLogs: [],
    fetchCalls: [],
    themeParseCalls: 0,
    themeResolveCalls: 0,
    persistCalls: 0
  };

  const api = factory(deps, Buffer);

  assert.strictEqual(
    api.isUrlBlockedByFaviconRequestBlacklist('https://foo.blocked.example.com/path'),
    true,
    'suffix favicon exclusion should match subdomains'
  );
  assert.strictEqual(
    api.isUrlBlockedByFaviconRequestBlacklist('https://vpn.example.com/private/doc'),
    true,
    'prefix favicon exclusion should match child paths'
  );
  assert.strictEqual(
    api.isUrlBlockedByFaviconRequestBlacklist('https://exact.example.com/only-this'),
    true,
    'exact favicon exclusion should match the exact page URL'
  );
  assert.strictEqual(
    api.isUrlBlockedByFaviconRequestBlacklist('https://public.example.com/path'),
    false,
    'non-matching URLs should remain fetchable'
  );

  let result = await api.resolveSiteThemeColor('https://foo.blocked.example.com/page', '', 'dark');
  assert.strictEqual(result, null, 'theme color resolution should stop for excluded page URLs');
  assert.strictEqual(deps.fetchCalls.length, 0, 'blocked theme color resolution should not fetch the page');

  result = await api.resolveFaviconCandidates('https://vpn.example.com/private/doc', '', '');
  assert.deepStrictEqual(result, [], 'favicon candidate resolution should stop for excluded page URLs');
  assert.strictEqual(deps.fetchCalls.length, 0, 'blocked favicon candidate resolution should not fetch anything');

  result = await api.fetchFaviconData('https://foo.blocked.example.com/favicon.ico');
  assert.strictEqual(result, null, 'favicon data fetch should stop for excluded favicon URLs');
  assert.strictEqual(deps.fetchCalls.length, 0, 'blocked favicon data fetch should not fetch the icon');

  result = await api.resolveSiteThemeColor('https://public.example.com/page', '', 'light');
  assert.strictEqual(result, null, 'control theme color resolution should still run through the parser path');
  assert.strictEqual(deps.fetchCalls.length, 1, 'non-blocked theme color resolution should fetch once');
  assert.strictEqual(deps.themeParseCalls, 1, 'non-blocked theme color resolution should parse HTML candidates');

  result = await api.fetchFaviconData('https://public.example.com/favicon.ico');
  assert.ok(
    typeof result === 'string' && result.startsWith('data:image/png;base64,'),
    'non-blocked favicon data fetch should return a data URL'
  );
  assert.strictEqual(deps.fetchCalls.length, 2, 'non-blocked favicon data fetch should reach the network path');

  console.log('background favicon blacklist tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
