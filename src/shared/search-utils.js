(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSearchUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const SEARCH_POLICY = Object.freeze({
    lookupWindowDays: 180,
    fallbackHistoryWindowDays: 365,
    lookupMaxResults: 120,
    fallbackHistoryMaxResults: 600,
    maxEngineSuggestions: 5,
    candidatePoolLimit: 20,
    finalSuggestionLimit: 12,
    fallbackTopSiteLimit: 5,
    topSiteRepresentativeHostLimit: 1,
    topSiteRepresentativeClusterLimit: 1,
    primaryHostLimit: 3,
    primaryClusterLimit: 1,
    secondaryHostLimit: 5,
    secondaryClusterLimit: 2
  });

  const SEARCH_DEDUP_IGNORED_QUERY_PARAM_NAMES = new Set([
    'entry',
    'reason',
    'ref',
    'ref_src',
    'source',
    'from',
    'from_source',
    'feature',
    'feature_source',
    'campaign',
    'campaign_id',
    'campaign_source',
    'channel',
    'via',
    'trk',
    'track',
    'tracking',
    'tracking_id',
    'spm',
    'si'
  ]);

  const SEARCH_SETTINGS_INTENT_TERMS = new Set([
    'setting',
    'settings',
    'option',
    'options',
    'config',
    'configure',
    'preference',
    'preferences',
    'prefs',
    '设置',
    '选项',
    '配置',
    '偏好',
    '管理'
  ]);

  const SEARCH_PATH_INTENT_TERMS = new Set([
    'release',
    'releases',
    'issue',
    'issues',
    'pull',
    'pulls',
    'docs',
    'doc',
    'wiki',
    'guide',
    'guides',
    'pricing',
    'price',
    'download',
    'admin',
    'bookmark',
    'bookmarks',
    'chat',
    'message',
    'messages',
    'dm',
    'dms',
    'setting',
    'settings',
    'profile',
    'account',
    'notification',
    'notifications',
    '设置',
    '通知',
    '文档',
    '价格',
    '下载',
    '发布'
  ]);

  const SEARCH_INFORMATIONAL_TERMS = new Set([
    'how',
    'what',
    'why',
    'when',
    'where',
    'tutorial',
    'tutorials',
    'guide',
    'guides',
    'learn',
    'docs',
    'doc',
    'help',
    'review',
    'reviews',
    'compare',
    'comparison',
    'price',
    'pricing',
    'news',
    '下载',
    '教程',
    '文档',
    '帮助',
    '对比',
    '价格',
    '评测',
    '为什么',
    '怎么',
    '如何'
  ]);

  const SEARCH_HOME_TITLE_TERMS = new Set([
    'home',
    'homepage',
    'overview',
    'workspace',
    'console',
    'dashboard',
    '首页',
    '主页',
    '概览',
    '控制台',
    '工作台'
  ]);

  const SEARCH_UTILITY_SEGMENTS = new Set([
    'settings',
    'setting',
    'preferences',
    'preference',
    'prefs',
    'profile',
    'profiles',
    'account',
    'accounts',
    'notification',
    'notifications',
    'activity',
    'activities',
    'like',
    'likes',
    'admin',
    'dashboard',
    'manage',
    'management',
    'billing',
    'payment',
    'payments'
  ]);

  const SEARCH_ACTION_SEGMENTS = new Set([
    'new',
    'edit',
    'create',
    'update',
    'delete',
    'compose'
  ]);

  const SEARCH_SITE_CONFIG = {
    'lumno.kubai.design': {
      ignoreAllSearchParamsPaths: new Set(['/', '/release', '/onboarding'])
    },
    'analytics.google.com': {
      directNavigationUrl: 'https://analytics.google.com/analytics/web/',
      directNavigationTitle: 'Google Analytics | 首页'
    },
    'github.com': {
      repoAreaCategories: new Map([
        ['issues', 'repo-issues'],
        ['pulls', 'repo-pulls'],
        ['discussions', 'repo-discussions'],
        ['actions', 'repo-actions'],
        ['wiki', 'repo-wiki'],
        ['releases', 'repo-releases']
      ])
    },
    'x.com': {
      directNavigationUrl: 'https://x.com/',
      directNavigationTitle: 'X'
    }
  };

  function normalizeHost(hostname) {
    return String(hostname || '').toLowerCase().replace(/^www\./, '');
  }

  function splitSearchTerms(value) {
    return Array.from(new Set(
      String(value || '')
        .toLowerCase()
        .split(/[^a-z0-9\u4e00-\u9fff]+/i)
        .map((item) => item.trim())
        .filter(Boolean)
    ));
  }

  function buildSearchQueryContext(query, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const lookupQuery = String(query || '');
    const queryLower = lookupQuery.trim().toLowerCase();
    const normalizedPinyinQuery = String(settings.normalizedPinyinQuery || '').trim();
    const coreQueryTerms = splitSearchTerms(queryLower);
    const queryTerms = splitSearchTerms(queryLower);
    if (queryLower && !queryTerms.includes(queryLower)) {
      queryTerms.unshift(queryLower);
    }
    return {
      lookupQuery,
      queryLower,
      normalizedPinyinQuery,
      useTitlePinyinMatch: Boolean(normalizedPinyinQuery),
      coreQueryTerms,
      queryTerms,
      intentType: classifySearchIntent(lookupQuery, queryTerms),
      hasSettingsIntent: queryTerms.some((term) => SEARCH_SETTINGS_INTENT_TERMS.has(term)),
      hasInformationalIntent: queryTerms.some((term) => SEARCH_INFORMATIONAL_TERMS.has(term))
    };
  }

  function shouldIgnoreSearchDedupQueryParam(paramName) {
    const normalized = String(paramName || '').trim().toLowerCase();
    if (!normalized) {
      return false;
    }
    return normalized.startsWith('utm_') || SEARCH_DEDUP_IGNORED_QUERY_PARAM_NAMES.has(normalized);
  }

  function buildSearchDedupUrlKey(url) {
    if (!url || typeof url !== 'string') {
      return '';
    }
    try {
      const parsed = new URL(url);
      parsed.protocol = String(parsed.protocol || '').toLowerCase();
      parsed.hostname = normalizeHost(parsed.hostname);
      if ((parsed.protocol === 'http:' && parsed.port === '80') || (parsed.protocol === 'https:' && parsed.port === '443')) {
        parsed.port = '';
      }
      parsed.hash = '';
      const normalizedPathname = parsed.pathname !== '/'
        ? (parsed.pathname.replace(/\/+$/, '') || '/')
        : '/';
      parsed.pathname = normalizedPathname;
      const normalizedHost = normalizeHost(parsed.hostname);
      const siteConfig = SEARCH_SITE_CONFIG[normalizedHost] || null;
      const ignoreAllSearchParamsPaths = siteConfig && siteConfig.ignoreAllSearchParamsPaths
        ? siteConfig.ignoreAllSearchParamsPaths
        : null;
      const shouldIgnoreAllSearchParams = Boolean(
        ignoreAllSearchParamsPaths && ignoreAllSearchParamsPaths.has(normalizedPathname)
      );
      const nextParams = new URLSearchParams();
      if (!shouldIgnoreAllSearchParams) {
        Array.from(parsed.searchParams.entries())
          .filter(([key]) => !shouldIgnoreSearchDedupQueryParam(key))
          .sort(([keyA, valueA], [keyB, valueB]) => {
            if (keyA === keyB) {
              return String(valueA).localeCompare(String(valueB));
            }
            return String(keyA).localeCompare(String(keyB));
          })
          .forEach(([key, value]) => {
            nextParams.append(key, value);
          });
      }
      parsed.search = nextParams.toString() ? `?${nextParams.toString()}` : '';
      return parsed.toString();
    } catch (e) {
      return String(url).trim().toLowerCase();
    }
  }

  function shouldReplaceDedupedSearchItem(candidate, existing) {
    if (!existing) {
      return true;
    }
    const candidateVisit = Number(candidate && candidate.lastVisitTime) || 0;
    const existingVisit = Number(existing && existing.lastVisitTime) || 0;
    if (candidateVisit !== existingVisit) {
      return candidateVisit > existingVisit;
    }
    const candidateTyped = Number(candidate && candidate.typedCount) || 0;
    const existingTyped = Number(existing && existing.typedCount) || 0;
    if (candidateTyped !== existingTyped) {
      return candidateTyped > existingTyped;
    }
    const candidateVisitCount = Number(candidate && candidate.visitCount) || 0;
    const existingVisitCount = Number(existing && existing.visitCount) || 0;
    if (candidateVisitCount !== existingVisitCount) {
      return candidateVisitCount > existingVisitCount;
    }
    const candidateTitleLength = String(candidate && candidate.title || '').trim().length;
    const existingTitleLength = String(existing && existing.title || '').trim().length;
    return candidateTitleLength > existingTitleLength;
  }

  function normalizeSearchDedupTitle(title) {
    return String(title || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildSearchDedupEntryKey(item) {
    if (!item) {
      return '';
    }
    const urlKey = typeof item.url === 'string' && item.url
      ? buildSearchDedupUrlKey(item.url)
      : '';
    const titleKey = normalizeSearchDedupTitle(item.title);
    if (urlKey && titleKey) {
      return `url:${urlKey}::title:${titleKey}`;
    }
    if (urlKey) {
      return `url:${urlKey}`;
    }
    if (titleKey) {
      return `title:${titleKey}`;
    }
    return `id:${item.id || ''}:${String(item.title || '').trim()}`;
  }

  function mergeItemsByUrl(itemGroups) {
    const merged = [];
    const mergedIndexByKey = new Map();
    (Array.isArray(itemGroups) ? itemGroups : []).forEach((items) => {
      (Array.isArray(items) ? items : []).forEach((item) => {
        if (!item) {
          return;
        }
        const urlKey = buildSearchDedupEntryKey(item);
        const existingIndex = mergedIndexByKey.get(urlKey);
        if (typeof existingIndex === 'number') {
          if (shouldReplaceDedupedSearchItem(item, merged[existingIndex])) {
            merged[existingIndex] = item;
          }
          return;
        }
        mergedIndexByKey.set(urlKey, merged.length);
        merged.push(item);
      });
    });
    return merged;
  }

  function hasSearchHomeTitle(title) {
    const titleTerms = splitSearchTerms(String(title || '').toLowerCase());
    return titleTerms.some((term) => SEARCH_HOME_TITLE_TERMS.has(term));
  }

  function isSearchLikelyBrandProductQuery(context) {
    if (!context || context.intentType !== 'object') {
      return false;
    }
    if (context.hasInformationalIntent || context.hasSettingsIntent) {
      return false;
    }
    if (!Array.isArray(context.queryTerms) || context.queryTerms.length !== 2) {
      return false;
    }
    return context.queryLower.length <= 28;
  }

  function isSearchLikelyDirectNavigationQuery(context) {
    if (!context || context.hasInformationalIntent) {
      return false;
    }
    return context.intentType === 'brand' || isSearchLikelyBrandProductQuery(context);
  }

  function getSearchBrandHostMatchScore(host, context) {
    if (!host || !context || context.intentType !== 'brand') {
      return 0;
    }
    const query = String(context.queryLower || '').trim();
    if (!query) {
      return 0;
    }
    const hostLabels = normalizeHost(host).split('.').filter(Boolean);
    let score = 0;
    hostLabels.forEach((label) => {
      if (label === query) {
        score = Math.max(score, 100);
        return;
      }
      if (query.length >= 2 && label.startsWith(query)) {
        score = Math.max(score, 60);
      }
    });
    return score;
  }

  function getSearchNavigationRepresentativeSignal(item, context) {
    if (!item || !item.url) {
      return 0;
    }
    const info = getSearchSuggestionClusterInfo(item.url);
    const titleLower = String(item.title || '').toLowerCase();
    const hasHomeTitle = hasSearchHomeTitle(titleLower);
    let signal = 0;

    if (info.category === 'site-root' || info.category === 'repo-root') {
      signal += 4;
    } else if (info.category === 'section' || info.category === 'landing') {
      signal += 3;
    } else if (hasHomeTitle && info.category !== 'utility' && info.category !== 'action') {
      signal += 3;
    } else if (info.category === 'content' && info.depth <= 2) {
      signal += 1;
    }

    if (info.category === 'utility' || info.category === 'action' || info.category === 'user') {
      signal -= 3;
    } else if (info.category === 'content' && info.depth >= 2 && !hasHomeTitle) {
      signal -= 1;
    }

    if (titleLower === context.queryLower) {
      signal += 4;
    } else if (titleLower.startsWith(context.queryLower)) {
      signal += 3;
    } else if (context.queryTerms.every((term) => term && titleLower.includes(term))) {
      signal += 2;
    }

    try {
      const hostLabels = normalizeHost(new URL(item.url).hostname).split('.').filter(Boolean);
      context.queryTerms.forEach((term) => {
        if (!term) {
          return;
        }
        if (hostLabels.includes(term)) {
          signal += 2;
          return;
        }
        if (term.length >= 2 && hostLabels.some((label) => label.startsWith(term))) {
          signal += 1;
        }
      });
    } catch (e) {
      // Ignore invalid URL.
    }

    if (item.type === 'topSite' || item.isTopSite) {
      signal += 1;
    } else if (item.type === 'bookmark') {
      signal += 1;
    }

    return signal;
  }

  function getSearchDirectNavigationAdjustment(item, sourceType, context) {
    if (!isSearchLikelyDirectNavigationQuery(context) || !item || !item.url) {
      return 0;
    }
    const info = getSearchSuggestionClusterInfo(item.url);
    const hasHomeTitle = hasSearchHomeTitle(item.title);
    const representativeSignal = getSearchNavigationRepresentativeSignal(item, context);
    const titleLower = String(item.title || '').toLowerCase();
    const pathTokens = [];
    let hostname = '';
    let hostLabels = [];
    try {
      const parsedUrl = new URL(item.url);
      hostname = normalizeHost(parsedUrl.hostname);
      hostLabels = hostname.split('.').filter(Boolean);
      decodeURIComponent(String(parsedUrl.pathname || '').toLowerCase())
        .split('/')
        .filter(Boolean)
        .forEach((segment) => {
          const segmentTokens = segment.split(/[^a-z0-9\u4e00-\u9fff]+/i).filter(Boolean);
          if (segmentTokens.length > 0) {
            pathTokens.push(...segmentTokens);
          }
        });
    } catch (e) {
      hostname = '';
      hostLabels = [];
    }
    const coverageStats = getSearchTermCoverageStats(context, {
      titleLower,
      hostname,
      urlLower: String(item.url || '').toLowerCase(),
      titleTokens: splitSearchTerms(titleLower),
      hostLabels,
      pathTokens
    });
    let adjustment = 0;

    if (context.intentType === 'brand') {
      if (info.category === 'site-root' || info.category === 'repo-root') {
        adjustment += 70;
      } else if (info.category === 'section' || info.category === 'landing') {
        adjustment += 32;
      } else if (hasHomeTitle) {
        adjustment += 42;
      } else if (info.category === 'content' && info.depth >= 2) {
        adjustment -= 28;
      }
    } else if (isSearchLikelyBrandProductQuery(context)) {
      if (info.category === 'site-root' || info.category === 'repo-root') {
        adjustment += 34;
      } else if (info.category === 'section' || info.category === 'landing' || hasHomeTitle) {
        adjustment += 28;
      } else if (info.category === 'content' && info.depth >= 2) {
        adjustment -= 12;
      }
    }

    if (representativeSignal >= 6) {
      adjustment += 18;
    } else if (representativeSignal <= 0) {
      adjustment -= 12;
    }

    if ((info.category === 'utility' || info.category === 'action' || info.category === 'user') && !context.hasSettingsIntent) {
      adjustment -= 36;
    }

    if (sourceType === 'topSite' && (info.category === 'site-root' || hasHomeTitle)) {
      adjustment += 10;
    }

    if (coverageStats.total >= 2 && !coverageStats.allMatched) {
      if (info.category === 'site-root' || info.category === 'section' || info.category === 'landing') {
        adjustment -= Math.min(42, coverageStats.missingCount * 22);
      }
      if (representativeSignal >= 6) {
        adjustment -= 10;
      }
    }

    return adjustment;
  }

  function getSearchEngineSuggestionScore(context, localSuggestions) {
    const candidates = Array.isArray(localSuggestions) ? localSuggestions : [];
    const hasStrongLocalDirectMatch = candidates.some((suggestion) => (
      suggestion &&
      suggestion.type !== 'googleSuggest' &&
      getSearchNavigationRepresentativeSignal(suggestion, context) >= 6
    ));

    if (context.intentType === 'brand') {
      return hasStrongLocalDirectMatch ? 18 : 48;
    }
    if (isSearchLikelyBrandProductQuery(context)) {
      return hasStrongLocalDirectMatch ? 34 : 78;
    }
    if (context.intentType === 'path' || context.intentType === 'revisit') {
      return 52;
    }
    if (context.hasInformationalIntent) {
      return 220;
    }
    return 160;
  }

  function looksLikeVersionSegment(segment) {
    const value = String(segment || '').trim().toLowerCase();
    if (!value) {
      return false;
    }
    return /^v?\d+(\.\d+){1,3}([.-][a-z0-9]+)?$/i.test(value);
  }

  function looksLikeOpaqueIdSegment(segment) {
    const value = String(segment || '').trim().toLowerCase();
    if (!value) {
      return false;
    }
    if (/^\d+$/.test(value)) {
      return true;
    }
    if (/^[0-9a-f]{8,}$/i.test(value)) {
      return true;
    }
    if (/^[0-9a-f]{8}-[0-9a-f-]{8,}$/i.test(value)) {
      return true;
    }
    return false;
  }

  function normalizeClusterSegment(segment) {
    const value = String(segment || '').trim().toLowerCase();
    if (!value) {
      return '';
    }
    if (looksLikeVersionSegment(value)) {
      return ':version';
    }
    if (looksLikeOpaqueIdSegment(value)) {
      return ':id';
    }
    return value;
  }

  function getSearchSuggestionClusterInfo(url) {
    if (!url) {
      return {
        host: '',
        category: 'unknown',
        clusterKey: '',
        depth: 0,
        path: '/'
      };
    }
    try {
      const parsed = new URL(url);
      const host = normalizeHost(parsed.hostname);
      const path = parsed.pathname !== '/' ? (parsed.pathname.replace(/\/+$/, '') || '/') : '/';
      const rawSegments = path.split('/').filter(Boolean).map((item) => decodeURIComponent(item).toLowerCase());
      const segments = rawSegments.map(normalizeClusterSegment);
      const first = segments[0] || '';
      const second = segments[1] || '';
      const third = segments[2] || '';

      const siteConfig = SEARCH_SITE_CONFIG[host] || null;
      if (host === 'github.com' && segments.length >= 2) {
        const repoBase = `${host}/${segments[0]}/${segments[1]}`;
        if (segments.length === 2) {
          return { host, category: 'repo-root', clusterKey: repoBase, depth: segments.length, path };
        }
        const repoAreaCategories = siteConfig && siteConfig.repoAreaCategories
          ? siteConfig.repoAreaCategories
          : null;
        if (repoAreaCategories && repoAreaCategories.has(third)) {
          return { host, category: repoAreaCategories.get(third), clusterKey: `${repoBase}/${third}`, depth: segments.length, path };
        }
        if (third === 'tree' || third === 'blob') {
          const area = segments[4] || segments[3] || 'root';
          return { host, category: 'repo-code', clusterKey: `${repoBase}/code/${area}`, depth: segments.length, path };
        }
        return { host, category: 'repo-child', clusterKey: `${repoBase}/${third || 'root'}`, depth: segments.length, path };
      }

      if (segments.length === 0) {
        return { host, category: 'site-root', clusterKey: `${host}/`, depth: 0, path };
      }

      if (SEARCH_UTILITY_SEGMENTS.has(first)) {
        return { host, category: 'utility', clusterKey: `${host}/utility/${first}`, depth: segments.length, path };
      }

      if (SEARCH_ACTION_SEGMENTS.has(first)) {
        return { host, category: 'action', clusterKey: `${host}/action/${first}`, depth: segments.length, path };
      }

      if ((first === 'u' || first === 'user' || first === 'users' || first === 'profile' || first === 'profiles') && second) {
        return { host, category: 'user', clusterKey: `${host}/user/${second}`, depth: segments.length, path };
      }

      if (first === 'release' || first === 'releases' || first === 'onboarding' || first === 'changelog') {
        return { host, category: 'landing', clusterKey: `${host}/${first}`, depth: segments.length, path };
      }

      if (first === 'docs' || first === 'doc' || first === 'wiki' || first === 'help' || first === 'guide' || first === 'guides') {
        const docKey = second || 'root';
        return { host, category: 'docs', clusterKey: `${host}/${first}/${docKey}`, depth: segments.length, path };
      }

      if (segments.length === 1) {
        return { host, category: 'section', clusterKey: `${host}/${first}`, depth: segments.length, path };
      }

      return { host, category: 'content', clusterKey: `${host}/${first}/${second}`, depth: segments.length, path };
    } catch (e) {
      return {
        host: '',
        category: 'unknown',
        clusterKey: String(url).trim().toLowerCase(),
        depth: 0,
        path: '/'
      };
    }
  }

  function looksLikeNavigationQuery(query) {
    const value = String(query || '').trim().toLowerCase();
    if (!value) {
      return false;
    }
    if (value.includes('://')) {
      return true;
    }
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/#?].*)?$/i.test(value)) {
      return true;
    }
    return false;
  }

  function classifySearchIntent(query, queryTerms) {
    const raw = String(query || '').trim().toLowerCase();
    const terms = Array.isArray(queryTerms) ? queryTerms.filter(Boolean) : [];
    if (looksLikeNavigationQuery(raw)) {
      return 'navigation';
    }

    if (terms.some((term) => SEARCH_PATH_INTENT_TERMS.has(term))) {
      return 'path';
    }

    if (terms.some((term) => looksLikeVersionSegment(term)) || /v?\d+(\.\d+){1,3}/i.test(raw)) {
      return 'revisit';
    }

    if (terms.length >= 2) {
      if (terms.some((term) => /\d/.test(term))) {
        return 'revisit';
      }
      return 'object';
    }

    if (terms.length === 1) {
      return 'brand';
    }

    return 'object';
  }

  function getSearchSourceAdjustment(sourceType, intentType) {
    const source = String(sourceType || '');
    const intent = String(intentType || 'object');

    if (intent === 'navigation' || intent === 'brand') {
      if (source === 'bookmark') {
        return 24;
      }
      if (source === 'topSite') {
        return 20;
      }
      if (source === 'history') {
        return 4;
      }
    }

    if (intent === 'path' || intent === 'revisit') {
      if (source === 'history') {
        return 18;
      }
      if (source === 'bookmark') {
        return 10;
      }
      if (source === 'topSite') {
        return 8;
      }
    }

    if (intent === 'object') {
      if (source === 'bookmark') {
        return 18;
      }
      if (source === 'history') {
        return 12;
      }
      if (source === 'topSite') {
        return 10;
      }
    }

    return 0;
  }

  function matchesSearchQueryText(item, context) {
    if (!item || !item.url) {
      return false;
    }
    const titleLower = item.title ? item.title.toLowerCase() : '';
    const urlLower = item.url.toLowerCase();
    const titleTokens = splitSearchTerms(titleLower);
    let hostname = '';
    let hostLabels = [];
    try {
      hostname = normalizeHost(new URL(item.url).hostname);
      hostLabels = hostname.split('.').filter(Boolean);
    } catch (e) {
      hostname = '';
      hostLabels = [];
    }
    const matchesTerm = (term) => {
      if (!term) {
        return false;
      }
      if (
        titleLower === term ||
        titleLower.startsWith(term) ||
        titleTokens.includes(term) ||
        titleTokens.some((token) => token.startsWith(term))
      ) {
        return true;
      }
      if (
        hostname.startsWith(term) ||
        hostLabels.includes(term) ||
        hostLabels.some((label) => label.startsWith(term))
      ) {
        return true;
      }
      if (shouldAllowLooseTextContains(term) && (titleLower.includes(term) || urlLower.includes(term))) {
        return true;
      }
      return false;
    };
    if (matchesTerm(context.queryLower)) {
      return true;
    }
    return context.queryTerms.some((term) => matchesTerm(term));
  }

  function isShortAsciiSearchTerm(term) {
    const value = String(term || '').trim().toLowerCase();
    if (!value) {
      return false;
    }
    return /^[a-z0-9]+$/i.test(value) && value.length <= 2;
  }

  function shouldAllowLooseTextContains(term) {
    const value = String(term || '').trim().toLowerCase();
    if (!value) {
      return false;
    }
    if (/[\u4e00-\u9fff]/.test(value)) {
      return true;
    }
    return !isShortAsciiSearchTerm(value);
  }

  function getSearchTermCoverageStats(context, candidateParts) {
    const terms = Array.isArray(context && context.coreQueryTerms) && context.coreQueryTerms.length > 0
      ? context.coreQueryTerms
      : splitSearchTerms(context && context.queryLower ? context.queryLower : '');
    if (terms.length === 0) {
      return {
        total: 0,
        matchedCount: 0,
        missingCount: 0,
        allMatched: false
      };
    }
    const normalizedCandidate = candidateParts && typeof candidateParts === 'object'
      ? candidateParts
      : {};
    const titleLower = String(normalizedCandidate.titleLower || '');
    const hostname = String(normalizedCandidate.hostname || '');
    const urlLower = String(normalizedCandidate.urlLower || '');
    const titleTokens = Array.isArray(normalizedCandidate.titleTokens) ? normalizedCandidate.titleTokens : [];
    const hostLabels = Array.isArray(normalizedCandidate.hostLabels) ? normalizedCandidate.hostLabels : [];
    const pathTokens = Array.isArray(normalizedCandidate.pathTokens) ? normalizedCandidate.pathTokens : [];
    let matchedCount = 0;

    terms.forEach((term) => {
      if (!term) {
        return;
      }
      const matched = (
        titleTokens.includes(term) ||
        hostLabels.includes(term) ||
        pathTokens.includes(term) ||
        titleTokens.some((token) => token.startsWith(term)) ||
        hostLabels.some((label) => label.startsWith(term)) ||
        pathTokens.some((token) => token.startsWith(term)) ||
        (shouldAllowLooseTextContains(term) && (
          titleLower.includes(term) ||
          hostname.includes(term) ||
          urlLower.includes(term)
        ))
      );
      if (matched) {
        matchedCount += 1;
      }
    });

    return {
      total: terms.length,
      matchedCount,
      missingCount: Math.max(0, terms.length - matchedCount),
      allMatched: matchedCount === terms.length
    };
  }

  function getSearchSuggestionCategoryAdjustment(item, context, coverageStats) {
    if (!item || !item.url) {
      return 0;
    }
    const info = getSearchSuggestionClusterInfo(item.url);
    const querySet = new Set(Array.isArray(context && context.queryTerms) ? context.queryTerms : []);
    const hasSettingsIntent = Boolean(context && context.hasSettingsIntent);
    const hasActionIntent = querySet.has('new') || querySet.has('edit') || querySet.has('create') || querySet.has('settings') || querySet.has('设置');
    let adjustment = 0;

    if (info.category === 'site-root' || info.category === 'repo-root') {
      adjustment += 18;
    } else if (info.category === 'section') {
      adjustment += 8;
    } else if (info.category === 'landing' || info.category === 'docs') {
      adjustment += 10;
    }

    if (item.type === 'topSite' || item.isTopSite) {
      if (info.category === 'site-root' || info.category === 'repo-root') {
        adjustment += 20;
      } else if (info.category === 'section' || info.category === 'landing') {
        adjustment += 10;
      } else {
        adjustment += 4;
      }
    }

    if (info.depth >= 3 && info.category !== 'docs' && info.category !== 'repo-code') {
      adjustment -= Math.min(16, (info.depth - 2) * 4);
    }

    if (info.category === 'utility') {
      adjustment -= hasSettingsIntent ? 10 : 95;
    }

    if (info.category === 'action') {
      adjustment -= hasActionIntent ? 8 : 80;
    }

    if (info.category === 'repo-code') {
      adjustment -= 18;
    }

    if (info.category === 'repo-child' && info.depth >= 4) {
      adjustment -= 14;
    }

    if (coverageStats && coverageStats.total >= 2) {
      const isRepresentativePage =
        info.category === 'site-root' ||
        info.category === 'repo-root' ||
        info.category === 'section' ||
        info.category === 'landing';
      if (coverageStats.allMatched) {
        if (info.category === 'repo-root') {
          adjustment += 18;
        } else if (!isRepresentativePage) {
          adjustment += 12;
        }
      } else if (isRepresentativePage) {
        adjustment -= Math.min(36, coverageStats.missingCount * 18);
        if ((item.type === 'topSite' || item.isTopSite) && info.category !== 'repo-root') {
          adjustment -= 6;
        }
      }
    }

    return adjustment;
  }

  function getOwnExtensionUtilityPenalty(item, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const isOwnExtensionUrl = typeof settings.isOwnExtensionUrl === 'function'
      ? settings.isOwnExtensionUrl
      : () => false;
    const hasSettingsIntent = Boolean(settings.hasSettingsIntent);
    if (!item || !item.url || !isOwnExtensionUrl(item.url) || hasSettingsIntent) {
      return 0;
    }
    try {
      const parsedUrl = new URL(item.url);
      const pathnameLower = String(parsedUrl.pathname || '').toLowerCase();
      if (pathnameLower.endsWith('/options.html') || pathnameLower.endsWith('options.html')) {
        return 110;
      }
    } catch (e) {
      return 0;
    }
    return 0;
  }

  function getNow(options) {
    const settings = options && typeof options === 'object' ? options : {};
    return Number(settings.now) || Date.now();
  }

  function getTitlePinyinScore(item, context, options) {
    const settings = options && typeof options === 'object' ? options : {};
    if (typeof settings.getTitlePinyinMatchScore !== 'function') {
      return 0;
    }
    const result = settings.getTitlePinyinMatchScore(item && item.title, context && context.normalizedPinyinQuery);
    return Number(result && result.score) || 0;
  }

  function calculateSearchRelevanceScore(item, sourceType, context, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const titleLower = item.title ? item.title.toLowerCase() : '';
    const urlLower = item.url.toLowerCase();
    let hostname = '';
    let hostLabels = [];
    let titleTokens = [];
    let pathTokens = [];
    let textScore = 0;
    let behaviorScore = 0;
    let sourceScore = 0;
    let coverageStats = null;
    const now = getNow(settings);

    if (titleLower === context.queryLower) textScore += 140;
    if (titleLower.startsWith(context.queryLower)) textScore += 70;

    titleTokens = splitSearchTerms(titleLower);
    if (titleTokens.includes(context.queryLower)) {
      textScore += 45;
    }

    context.queryTerms.forEach((word) => {
      if (!word) {
        return;
      }
      if (titleTokens.includes(word)) {
        textScore += 24;
        return;
      }
      if (titleTokens.some((token) => token.startsWith(word))) {
        textScore += 14;
        return;
      }
      if (shouldAllowLooseTextContains(word) && titleLower.includes(word)) textScore += 8;
    });

    if (shouldAllowLooseTextContains(context.queryLower) && titleLower.includes(context.queryLower)) textScore += 24;

    try {
      hostname = normalizeHost(new URL(item.url).hostname);
      hostLabels = hostname.split('.').filter(Boolean);
      if (shouldAllowLooseTextContains(context.queryLower) && hostname.includes(context.queryLower)) textScore += 14;
      if (hostname.startsWith(context.queryLower)) textScore += 20;
      if (hostLabels.includes(context.queryLower)) {
        textScore += 42;
      }
      context.queryTerms.forEach((word) => {
        if (!word) {
          return;
        }
        if (hostLabels.includes(word)) {
          textScore += 28;
          return;
        }
        if (hostLabels.some((label) => label.startsWith(word))) {
          textScore += 16;
          return;
        }
        if (shouldAllowLooseTextContains(word) && hostname.includes(word)) {
          textScore += 8;
        }
      });
    } catch (e) {
      // Ignore invalid URL.
    }

    if (shouldAllowLooseTextContains(context.queryLower) && urlLower.includes(context.queryLower)) textScore += 10;
    try {
      const parsedUrl = new URL(item.url);
      const pathnameLower = String(parsedUrl.pathname || '').toLowerCase();
      const decodedPathnameLower = decodeURIComponent(pathnameLower);
      const pathSegments = decodedPathnameLower.split('/').filter(Boolean);
      pathSegments.forEach((segment) => {
        const segmentTokens = segment.split(/[^a-z0-9\u4e00-\u9fff]+/i).filter(Boolean);
        if (segmentTokens.length > 0) {
          pathTokens.push(...segmentTokens);
        }
      });
      if (decodedPathnameLower && context.queryTerms.length > 0) {
        context.queryTerms.forEach((word) => {
          if (!word) {
            return;
          }
          if (pathTokens.includes(word)) {
            textScore += 32;
            return;
          }
          if (pathTokens.some((token) => token.startsWith(word))) {
            textScore += 18;
            return;
          }
          if (shouldAllowLooseTextContains(word) && pathTokens.some((token) => token.includes(word))) {
            textScore += 10;
            return;
          }
          if (shouldAllowLooseTextContains(word) && decodedPathnameLower.includes(word)) {
            textScore += 8;
          }
        });
      }
    } catch (e) {
      // Ignore invalid URL parsing/decoding errors.
    }

    coverageStats = getSearchTermCoverageStats(context, {
      titleLower,
      hostname,
      urlLower,
      titleTokens,
      hostLabels,
      pathTokens
    });

    textScore += getTitlePinyinScore(item, context, settings);

    const isLocalNetworkHost = typeof settings.isLocalNetworkHost === 'function'
      ? settings.isLocalNetworkHost
      : () => false;
    if (hostname && isLocalNetworkHost(hostname)) {
      if (titleLower === context.queryLower) textScore += 60;
      else if (titleLower.startsWith(context.queryLower)) textScore += 42;
      else if (shouldAllowLooseTextContains(context.queryLower) && titleLower.includes(context.queryLower)) textScore += 24;
      else if (shouldAllowLooseTextContains(context.queryLower) && urlLower.includes(context.queryLower)) textScore += 20;
    }

    if (textScore <= 0) {
      return 0;
    }

    if (item.lastVisitTime) {
      const daysSinceVisit = (now - item.lastVisitTime) / (1000 * 60 * 60 * 24);
      if (daysSinceVisit < 1) behaviorScore += 10;
      else if (daysSinceVisit < 7) behaviorScore += 5;
      else if (daysSinceVisit < 30) behaviorScore += 2;
    }

    const visitCount = Number(item.visitCount) > 0 ? Number(item.visitCount) : 0;
    const typedCount = Number(item.typedCount) > 0 ? Number(item.typedCount) : 0;
    if (visitCount > 0) {
      behaviorScore += Math.min(18, Math.log2(visitCount + 1) * 4);
    }
    if (typedCount > 0) {
      behaviorScore += Math.min(12, typedCount * 2);
    }
    if (item.lastVisitTime) {
      const hoursSinceVisit = (now - item.lastVisitTime) / (1000 * 60 * 60);
      if (hoursSinceVisit < 2) behaviorScore += 20;
      else if (hoursSinceVisit < 24) behaviorScore += 14;
      else if (hoursSinceVisit < 72) behaviorScore += 8;
    }

    if (sourceType === 'bookmark') {
      sourceScore += 12;
    } else if (sourceType === 'history') {
      sourceScore += 4;
    } else if (sourceType === 'topSite') {
      sourceScore += 6;
    }
    sourceScore += getSearchSourceAdjustment(sourceType, context.intentType);

    return textScore +
      behaviorScore +
      sourceScore +
      getSearchSuggestionCategoryAdjustment(item, context, coverageStats) +
      getSearchDirectNavigationAdjustment(item, sourceType, context) -
      getOwnExtensionUtilityPenalty(item, {
        hasSettingsIntent: context.hasSettingsIntent,
        isOwnExtensionUrl: settings.isOwnExtensionUrl
      });
  }

  function getRecentPopularityBoost(suggestion, options) {
    if (!suggestion) {
      return 0;
    }
    let boost = 0;
    const now = getNow(options);
    const visitCount = Number(suggestion.visitCount) > 0 ? Number(suggestion.visitCount) : 0;
    const typedCount = Number(suggestion.typedCount) > 0 ? Number(suggestion.typedCount) : 0;
    if (visitCount > 0) {
      boost += Math.min(10, Math.log2(visitCount + 1) * 2.5);
    }
    if (typedCount > 0) {
      boost += Math.min(6, typedCount * 1.25);
    }
    const lastVisitTime = Number(suggestion.lastVisitTime) || 0;
    if (lastVisitTime > 0) {
      const hoursSinceVisit = (now - lastVisitTime) / (1000 * 60 * 60);
      if (hoursSinceVisit < 2) boost += 10;
      else if (hoursSinceVisit < 24) boost += 6;
      else if (hoursSinceVisit < 72) boost += 3;
    }
    return boost;
  }

  function getSearchSuggestionSourceRank(suggestion) {
    if (!suggestion) {
      return 0;
    }
    if (suggestion.type === 'bookmark') {
      return 3;
    }
    if (suggestion.type === 'history') {
      return 2;
    }
    if (suggestion.type === 'topSite' || suggestion.isTopSite) {
      return 1;
    }
    return 0;
  }

  function compareSearchSuggestions(a, b, options) {
    const scoreDiff = ((b.score || 0) + getRecentPopularityBoost(b, options)) -
      ((a.score || 0) + getRecentPopularityBoost(a, options));
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    const sourceRankDiff = getSearchSuggestionSourceRank(b) - getSearchSuggestionSourceRank(a);
    if (sourceRankDiff !== 0) {
      return sourceRankDiff;
    }
    const visitDiff = (Number(b.visitCount) || 0) - (Number(a.visitCount) || 0);
    if (visitDiff !== 0) {
      return visitDiff;
    }
    const aVisit = a.lastVisitTime || 0;
    const bVisit = b.lastVisitTime || 0;
    return bVisit - aVisit;
  }

  function createSearchSuggestion(item, sourceType, score, extras) {
    return {
      type: sourceType,
      title: item.title || item.url,
      url: item.url,
      favicon: extras && extras.favicon ? extras.favicon : '',
      score,
      lastVisitTime: Number(item.lastVisitTime) || 0,
      visitCount: Number(item.visitCount) || 0,
      typedCount: Number(item.typedCount) || 0,
      reasons: extras && Array.isArray(extras.reasons) ? extras.reasons : [],
      ...(extras || {})
    };
  }

  function buildSearchBrandDirectSuggestion(candidates, context, options) {
    const settings = options && typeof options === 'object' ? options : {};
    if (context.intentType !== 'brand' || context.hasInformationalIntent) {
      return null;
    }
    const hostGroups = new Map();
    (Array.isArray(candidates) ? candidates : []).forEach((suggestion) => {
      if (!suggestion || !suggestion.url || suggestion.type === 'googleSuggest') {
        return;
      }
      const info = getSearchSuggestionClusterInfo(suggestion.url);
      if (!info.host) {
        return;
      }
      const list = hostGroups.get(info.host) || [];
      list.push(suggestion);
      hostGroups.set(info.host, list);
    });

    let bestGroup = null;
    hostGroups.forEach((group, host) => {
      const hostScore = getSearchBrandHostMatchScore(host, context);
      if (hostScore <= 0) {
        return;
      }
      const sourceSuggestion = group
        .slice()
        .sort((a, b) => {
          const signalDiff = getSearchNavigationRepresentativeSignal(b, context) -
            getSearchNavigationRepresentativeSignal(a, context);
          if (signalDiff !== 0) {
            return signalDiff;
          }
          return (b.score || 0) - (a.score || 0);
        })[0];
      const hasRepresentative = group.some((suggestion) => {
        const info = getSearchSuggestionClusterInfo(suggestion && suggestion.url);
        return info.category === 'site-root' ||
          info.category === 'repo-root' ||
          info.category === 'section' ||
          info.category === 'landing' ||
          hasSearchHomeTitle(suggestion && suggestion.title);
      });
      const totalScore = hostScore +
        Math.max(0, getSearchNavigationRepresentativeSignal(sourceSuggestion, context)) +
        Math.min(8, group.length * 2);
      if (!bestGroup || totalScore > bestGroup.totalScore) {
        bestGroup = {
          host,
          sourceSuggestion,
          hasRepresentative,
          totalScore
        };
      }
    });

    if (!bestGroup || bestGroup.hasRepresentative || !bestGroup.sourceSuggestion) {
      return null;
    }

    const siteConfig = SEARCH_SITE_CONFIG[bestGroup.host] || null;
    const directUrl = siteConfig && siteConfig.directNavigationUrl
      ? siteConfig.directNavigationUrl
      : `https://${bestGroup.host}/`;
    const directTitle = siteConfig && siteConfig.directNavigationTitle
      ? siteConfig.directNavigationTitle
      : (bestGroup.sourceSuggestion.title || bestGroup.host);
    const sourceType = bestGroup.sourceSuggestion.type === 'bookmark'
      ? 'bookmark'
      : ((bestGroup.sourceSuggestion.type === 'topSite' || bestGroup.sourceSuggestion.isTopSite) ? 'topSite' : 'history');
    const directItem = {
      title: directTitle,
      url: directUrl,
      lastVisitTime: bestGroup.sourceSuggestion.lastVisitTime || 0,
      visitCount: Number(bestGroup.sourceSuggestion.visitCount) || 0,
      typedCount: Number(bestGroup.sourceSuggestion.typedCount) || 0
    };
    const baseScore = calculateSearchRelevanceScore(directItem, sourceType, context, settings);
    if (baseScore <= 0) {
      return null;
    }
    const reasons = ['站点直达'];
    if (typeof settings.buildReasons === 'function') {
      reasons.push(...settings.buildReasons(directItem, sourceType, context));
    }
    return createSearchSuggestion(directItem, sourceType, baseScore + 36, {
      favicon: typeof settings.buildFavicon === 'function' ? settings.buildFavicon(directUrl) : '',
      reasons: reasons.slice(0, 3),
      isTopSite: true,
      isSyntheticDirect: true
    });
  }

  function applySearchSuggestionHostDiversity(list) {
    const candidates = Array.isArray(list) ? list : [];
    const selected = [];
    const selectedKeys = new Set();
    const hostCounts = new Map();
    const clusterCounts = new Map();
    const hostHasTopSiteRepresentative = new Set();

    const tryTake = (suggestion, hostLimit, clusterLimit) => {
      if (!suggestion) {
        return false;
      }
      const dedupKey = buildSearchDedupEntryKey(suggestion);
      if (!dedupKey || selectedKeys.has(dedupKey)) {
        return false;
      }
      const info = getSearchSuggestionClusterInfo(suggestion.url);
      const hostKey = info.host || '__nohost__';
      const clusterKey = info.clusterKey || dedupKey;
      const currentHostCount = hostCounts.get(hostKey) || 0;
      const currentClusterCount = clusterCounts.get(clusterKey) || 0;
      if (currentHostCount >= hostLimit || currentClusterCount >= clusterLimit) {
        return false;
      }
      selected.push(suggestion);
      selectedKeys.add(dedupKey);
      hostCounts.set(hostKey, currentHostCount + 1);
      clusterCounts.set(clusterKey, currentClusterCount + 1);
      return true;
    };

    candidates.forEach((suggestion) => {
      if (!suggestion || !(suggestion.type === 'topSite' || suggestion.isTopSite)) {
        return;
      }
      const info = getSearchSuggestionClusterInfo(suggestion.url);
      const hostKey = info.host || '__nohost__';
      if (hostHasTopSiteRepresentative.has(hostKey)) {
        return;
      }
      const isRepresentativeCategory =
        info.category === 'site-root' ||
        info.category === 'repo-root' ||
        info.category === 'section' ||
        info.category === 'landing';
      if (!isRepresentativeCategory) {
        return;
      }
      if (tryTake(
        suggestion,
        SEARCH_POLICY.topSiteRepresentativeHostLimit,
        SEARCH_POLICY.topSiteRepresentativeClusterLimit
      )) {
        hostHasTopSiteRepresentative.add(hostKey);
      }
    });

    candidates.forEach((suggestion) => {
      tryTake(suggestion, SEARCH_POLICY.primaryHostLimit, SEARCH_POLICY.primaryClusterLimit);
    });

    if (selected.length < SEARCH_POLICY.finalSuggestionLimit) {
      candidates.forEach((suggestion) => {
        tryTake(suggestion, SEARCH_POLICY.secondaryHostLimit, SEARCH_POLICY.secondaryClusterLimit);
      });
    }

    return selected.slice(0, SEARCH_POLICY.finalSuggestionLimit);
  }

  function getTitlePinyinMatchResult(item, context, options) {
    const settings = options && typeof options === 'object' ? options : {};
    if (!context || !context.useTitlePinyinMatch || !item || !item.title ||
        typeof settings.getTitlePinyinMatchScore !== 'function') {
      return { score: 0, reason: '' };
    }
    return settings.getTitlePinyinMatchScore(item.title, context.normalizedPinyinQuery) || { score: 0, reason: '' };
  }

  function matchesSearchTitlePinyin(item, context, options) {
    return getTitlePinyinMatchResult(item, context, options).score > 0;
  }

  function collectSearchMatches(items, context, searchBlacklistItems, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const isUrlBlocked = typeof settings.isUrlBlockedBySearchBlacklist === 'function'
      ? settings.isUrlBlockedBySearchBlacklist
      : () => false;
    return (Array.isArray(items) ? items : []).filter((item) => (
      (matchesSearchQueryText(item, context) || matchesSearchTitlePinyin(item, context, settings)) &&
      !isUrlBlocked(item && item.url, searchBlacklistItems)
    ));
  }

  function buildComparableNavigationUrl(url) {
    try {
      const parsed = new URL(String(url || '').trim());
      parsed.protocol = String(parsed.protocol || '').toLowerCase();
      parsed.hostname = normalizeHost(parsed.hostname);
      if ((parsed.protocol === 'http:' && parsed.port === '80') || (parsed.protocol === 'https:' && parsed.port === '443')) {
        parsed.port = '';
      }
      parsed.hash = '';
      parsed.pathname = parsed.pathname !== '/' ? (parsed.pathname.replace(/\/+$/, '') || '/') : '/';
      return parsed.toString();
    } catch (e) {
      return String(url || '').trim().toLowerCase();
    }
  }

  function getNavigationSuggestionPathDepth(url) {
    try {
      return new URL(String(url || '').trim()).pathname.split('/').filter(Boolean).length;
    } catch (e) {
      return Number.MAX_SAFE_INTEGER;
    }
  }

  function getDefaultNavigationUrlDisplay(url) {
    try {
      const parsed = new URL(String(url || '').trim());
      return `${normalizeHost(parsed.hostname)}${parsed.pathname === '/' ? '' : parsed.pathname}`;
    } catch (e) {
      return String(url || '').trim();
    }
  }

  function getStrongNavigationMatchScore(suggestion, rawQuery, options) {
    const settings = options && typeof options === 'object' ? options : {};
    if (!suggestion || !suggestion.url || suggestion.type === 'newtab' || suggestion.type === 'googleSuggest') {
      return 0;
    }
    const query = String(rawQuery || '').trim();
    if (!query) {
      return 0;
    }

    const queryLower = query.toLowerCase();
    const directUrl = typeof settings.getDirectNavigationUrl === 'function'
      ? settings.getDirectNavigationUrl(query)
      : '';
    const getUrlDisplay = typeof settings.getUrlDisplay === 'function'
      ? settings.getUrlDisplay
      : getDefaultNavigationUrlDisplay;
    const suggestionUrlKey = buildComparableNavigationUrl(suggestion.url);
    const suggestionUrlText = (getUrlDisplay(suggestion.url) || '').toLowerCase();
    const titleLower = String(suggestion.title || '').toLowerCase();

    if (directUrl) {
      const directUrlKey = buildComparableNavigationUrl(directUrl);
      if (suggestion.type !== 'directUrl' && suggestionUrlKey === directUrlKey) {
        return 520;
      }
      if (suggestionUrlText && suggestionUrlText === queryLower) {
        return suggestion.type === 'directUrl' ? 420 : 480;
      }
      if (suggestion.type === 'directUrl' && suggestionUrlKey === directUrlKey) {
        return 400;
      }
      if (suggestionUrlText && suggestionUrlText.startsWith(queryLower)) {
        return suggestion.type === 'directUrl' ? 320 : 280;
      }
      return 0;
    }

    if (/\s/.test(query) || queryLower.length < 4) {
      return 0;
    }

    const genericTerms = new Set(['home', 'login', 'account', 'settings', 'dashboard', 'search', 'docs', 'help', 'api']);
    if (genericTerms.has(queryLower)) {
      return 0;
    }

    let score = 0;
    const titleTerms = splitSearchTerms(titleLower);
    if (titleTerms.includes(queryLower)) {
      score += 140;
    } else if (titleLower.startsWith(queryLower)) {
      score += 100;
    } else if (titleLower.includes(queryLower)) {
      score += 42;
    } else {
      return 0;
    }

    const depth = getNavigationSuggestionPathDepth(suggestion.url);
    if (depth === 0) {
      score += 90;
    } else if (depth === 1) {
      score += 36;
    } else if (Number.isFinite(depth)) {
      score -= Math.min(32, (depth - 1) * 8);
    }

    if (/(^|[\s-])(home|首页)([\s-]|$)/i.test(titleLower)) {
      score += 28;
    }
    if (suggestion.type === 'bookmark') {
      score += 16;
    } else if (suggestion.type === 'history') {
      score += 10;
    } else if (suggestion.type === 'topSite' || suggestion.isTopSite) {
      score += 12;
    }

    return score;
  }

  function promoteStrongNavigationMatch(list, rawQuery, options) {
    if (!Array.isArray(list)) {
      return null;
    }
    let bestIndex = -1;
    let bestScore = 0;
    for (let i = 0; i < list.length; i += 1) {
      const score = getStrongNavigationMatchScore(list[i], rawQuery, options);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    if (bestScore < 140 || bestIndex < 0) {
      return null;
    }
    if (bestIndex > 0) {
      const [picked] = list.splice(bestIndex, 1);
      list.unshift(picked);
      return picked;
    }
    return list[0] || null;
  }

  function normalizeSiteSearchTemplate(template) {
    if (!template) {
      return '';
    }
    return String(template)
      .trim()
      .replace(/\{\{\{s\}\}\}/g, '{query}')
      .replace(/\{s\}/g, '{query}')
      .replace(/\{searchTerms\}/g, '{query}');
  }

  function hasOpenAndSubmitSiteSearchAction(provider) {
    return Boolean(
      provider &&
      String(provider.action || '').trim() === 'openAndSubmit'
    );
  }

  function isAiSiteSearchProvider(provider) {
    if (!provider) {
      return false;
    }
    if (hasOpenAndSubmitSiteSearchAction(provider)) {
      return true;
    }
    const template = normalizeSiteSearchTemplate(provider.template);
    return Boolean(template) && !template.includes('{query}');
  }

  function isInteractiveSiteSearchProvider(provider) {
    return Boolean(
      hasOpenAndSubmitSiteSearchAction(provider) &&
      String(provider.submitStrategy || '').trim() === 'geminiPrompt'
    );
  }

  function normalizeSiteSearchProvider(item, baseProvider) {
    if (!item && !baseProvider) {
      return null;
    }
    const key = String((item && item.key) || (baseProvider && baseProvider.key) || '').trim();
    const template = normalizeSiteSearchTemplate(
      (item && item.template) || (baseProvider && baseProvider.template) || ''
    );
    if (!key || !template) {
      return null;
    }
    if (!template.includes('{query}') && !isAiSiteSearchProvider({
      ...(baseProvider || {}),
      ...(item || {}),
      key,
      template
    })) {
      return null;
    }
    const aliasSource = Array.isArray(item && item.aliases)
      ? item.aliases
      : (Array.isArray(baseProvider && baseProvider.aliases) ? baseProvider.aliases : []);
    return {
      key,
      aliases: aliasSource.filter(Boolean),
      name: String((item && item.name) || (baseProvider && baseProvider.name) || key).trim() || key,
      template,
      action: String((item && item.action) || (baseProvider && baseProvider.action) || '').trim(),
      submitStrategy: String(
        (item && item.submitStrategy) || (baseProvider && baseProvider.submitStrategy) || ''
      ).trim(),
      disabled: Boolean(item && item.disabled),
      disabledReason: String((item && item.disabledReason) || '').trim(),
      icon: String((item && item.icon) || (baseProvider && baseProvider.icon) || '').trim(),
      iconUrl: String((item && item.iconUrl) || (baseProvider && baseProvider.iconUrl) || '').trim()
    };
  }

  function sanitizeSiteSearchProviders(items, baseItems) {
    const baseMap = new Map((Array.isArray(baseItems) ? baseItems : []).map((item) => [
      String(item && item.key ? item.key : '').toLowerCase(),
      item
    ]));
    return (Array.isArray(items) ? items : [])
      .map((item) => normalizeSiteSearchProvider(item, baseMap.get(String(item && item.key ? item.key : '').toLowerCase())))
      .filter(Boolean);
  }

  function inheritSiteSearchProviderBehavior(provider, baseProvider) {
    if (!provider) {
      return provider;
    }
    return {
      ...provider,
      action: String(provider.action || (baseProvider && baseProvider.action) || '').trim(),
      submitStrategy: String(
        provider.submitStrategy || (baseProvider && baseProvider.submitStrategy) || ''
      ).trim()
    };
  }

  function mergeCustomProviders(baseItems, customItems) {
    const merged = [];
    const seen = new Set();
    const baseMap = new Map((baseItems || []).map((item) => [String(item && item.key ? item.key : '').toLowerCase(), item]));
    (customItems || []).forEach((item) => {
      if (item && item.disabled) {
        return;
      }
      const key = String(item && item.key ? item.key : '').toLowerCase();
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      merged.push(inheritSiteSearchProviderBehavior(item, baseMap.get(key)));
    });
    (baseItems || []).forEach((item) => {
      const key = String(item && item.key ? item.key : '').toLowerCase();
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      merged.push(item);
    });
    return merged;
  }

  function buildSearchUrlFromTemplate(template, query) {
    const normalizedTemplate = normalizeSiteSearchTemplate(template);
    if (!normalizedTemplate) {
      return '';
    }
    if (!normalizedTemplate.includes('{query}')) {
      return normalizedTemplate;
    }
    return normalizedTemplate.replace(/\{query\}/g, encodeURIComponent(String(query || '')));
  }

  function buildBlacklistProbeUrlFromTemplate(template, query) {
    return buildSearchUrlFromTemplate(template, String(query || '').trim() || 'test');
  }

  return Object.freeze({
    SEARCH_POLICY,
    applySearchSuggestionHostDiversity,
    buildBlacklistProbeUrlFromTemplate,
    buildSearchBrandDirectSuggestion,
    buildSearchDedupEntryKey,
    buildSearchDedupUrlKey,
    buildSearchQueryContext,
    buildSearchUrlFromTemplate,
    buildComparableNavigationUrl,
    calculateSearchRelevanceScore,
    classifySearchIntent,
    collectSearchMatches,
    compareSearchSuggestions,
    createSearchSuggestion,
    getSearchEngineSuggestionScore,
    getSearchNavigationRepresentativeSignal,
    getSearchSuggestionCategoryAdjustment,
    getSearchSuggestionClusterInfo,
    getSearchSuggestionSourceRank,
    getSearchTermCoverageStats,
    getStrongNavigationMatchScore,
    hasOpenAndSubmitSiteSearchAction,
    inheritSiteSearchProviderBehavior,
    isAiSiteSearchProvider,
    isInteractiveSiteSearchProvider,
    isSearchLikelyBrandProductQuery,
    isSearchLikelyDirectNavigationQuery,
    isShortAsciiSearchTerm,
    mergeCustomProviders,
    mergeItemsByUrl,
    matchesSearchQueryText,
    matchesSearchTitlePinyin,
    normalizeHost,
    normalizeSiteSearchProvider,
    normalizeSiteSearchTemplate,
    promoteStrongNavigationMatch,
    sanitizeSiteSearchProviders,
    shouldAllowLooseTextContains
  });
});
