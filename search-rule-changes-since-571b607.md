# `571b60719153ede6cf2aec312bf23e7e8bb62100` 之后搜索匹配/排序规则变更与迁移材料

## 目的

这份文档不是“变更摘要”，而是后续给其他版本回移时可直接参照的迁移材料。

本文尽量覆盖：

- 哪些提交真正改了搜索规则
- 每一组规则改动落在哪些文件
- 当前版本里可直接复用的核心代码片段
- 回移到旧版本时的依赖关系、迁移顺序与风险点

## 结论

从 `571b60719153ede6cf2aec312bf23e7e8bb62100` 到当前 `HEAD`，真正影响插件搜索结果“匹配规则”或“排序结果”的代码改动，核心只有两组：

1. `3761037` `Add local remixicon runtime, update search matching`
2. `0a94ca5` `Refactor site-search AI handling and overlay UI`

其余位于这段区间内的提交，如：

- `b5719fb`
- `024a51f`
- `c0b1fd9`
- `cc8c093`

主要是浮层容器、滚轮、hover、AI 特效挂载/移除等 UI 调整，没有实质改动搜索候选的命中逻辑或排序分数。

## 影响范围

- 搜索候选生成与排序：`background.js`
- 新标签页首位高亮、自动补全、站内搜索触发：`newtab.js`
- provider 保存、归一化、AI 分类：`options.js`

## 先给最终行为结论

### 1. 普通搜索结果的命中逻辑

`3761037` 之后，搜索候选不再主要依赖简单的 `title.includes(query)` / `url.includes(query)`，而是改成更结构化的匹配：

- 标题完整命中
- 标题前缀命中
- 标题 token 精确命中
- 标题 token 前缀命中
- host 精确/前缀命中
- host label 精确/前缀命中
- path token 精确/前缀命中
- 宽松 contains 命中
- 标题拼音命中

并且对短 ASCII 查询收紧了宽松 contains，避免 1 到 2 个英文字符在 URL 中大量误伤。

### 2. 排序分数的核心变化

`3761037` 之后，排序虽然仍然走 `compareSearchSuggestions(...)`，但候选的基础分 `score` 明显变复杂了：

- 先算文本分 `textScore`
- 再加行为分 `behaviorScore`
- 再加来源分 `sourceScore`
- 再加分类/页面类型修正
- 再加 direct navigation 修正
- 最后扣掉扩展自身工具页惩罚

尤其新增了 coverage 概念，多词查询时会判断：

- 候选是否覆盖所有核心 query term
- 如果没覆盖全，首页/代表页不再天然占优

### 3. 新标签页与 overlay 的首位高亮变化

`newtab.js` 中真正影响“第一项是谁”的逻辑主要是：

- 强 navigation match 的提前置顶
- top site 命中的提前置顶
- `searchResultPriorityMode` 控制是“补全优先”还是“搜索优先”
- `siteSearchPrompt` / `inlineSiteSearch` 的插入位置

### 4. AI / site-search provider 的触发变化

`0a94ca5` 之后，AI provider 不再只等同于 Gemini。

新的规则是：

- 只要 `action === 'openAndSubmit'`
- 或者 template 本身不含 `{query}`

都按 AI provider 处理。

此外，自定义 provider 会继承同 key 内置 provider 的 `action` / `submitStrategy`，避免用户只改触发词或名称后把行为字段改丢。

---

## 一、排序主框架没有被推翻

这一点很重要。`571b607` 之后到当前，最终排序主框架没有改掉，仍然是：

```js
function compareSearchSuggestions(a, b) {
  const scoreDiff = ((b.score || 0) + getRecentPopularityBoost(b)) -
    ((a.score || 0) + getRecentPopularityBoost(a));
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
```

因此，这一阶段真正改的不是“最后怎么 compare”，而是：

- 候选能不能进入候选池
- 候选的 `score` 是怎么得出的
- overlay/newtab 首位高亮前的“预先重排”

---

## 二、`3761037` 这组改动的核心材料

### 2.1 这组改动要迁哪些文件

最少需要检查：

- `background.js`
- `newtab.js`

如果目标版本还没带这期拼音基础设施，也要确认：

- `assets/vendor/pinyin-pro.js`
- `background.js` 里相关 `importScripts(...)`

### 2.2 查询上下文结构升级

这是后面所有 coverage / path token / direct navigation 修正的基础。

```js
function splitSearchTerms(value) {
  return Array.from(new Set(
    String(value || '')
      .toLowerCase()
      .split(/[^a-z0-9\u4e00-\u9fff]+/i)
      .map((item) => item.trim())
      .filter(Boolean)
  ));
}

function buildSearchQueryContext(query) {
  const lookupQuery = String(query || '');
  const queryLower = lookupQuery.trim().toLowerCase();
  const normalizedPinyinQuery = shouldUseTitlePinyinMatch(lookupQuery)
    ? normalizeAsciiQueryForPinyin(lookupQuery)
    : '';
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
```

### 2.3 文本匹配从简单 `includes` 升级为结构化匹配

这是 `3761037` 最核心的变化之一。

```js
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
```

#### 迁移要点

- 不能只搬 `matchesSearchQueryText(...)`
- 它依赖：
  - `splitSearchTerms(...)`
  - `normalizeHost(...)`
  - `shouldAllowLooseTextContains(...)`
- 如果目标版本仍是旧的简单 `includes` 方案，必须连 helper 一起搬

### 2.4 短 ASCII 查询收紧规则

```js
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
```

#### 实际效果

- 中文词仍允许 contains
- 超短英文词不再因为 URL/标题里偶然包含该字符串就命中

如果目标版本用户抱怨“输入 1 到 2 个字母时命中太乱”，这段要优先回移。

### 2.5 coverage 统计是多词查询排序变化的关键

```js
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
```

#### 作用

- 这是“多词查询时主页不再天然压过具体内容页”的前提
- 如果只迁前面的 token 匹配，不迁 coverage，排序体感仍会和当前版本差很多

### 2.6 分类页/代表页的修正逻辑

这段决定了：

- root / section / landing / docs 等页面的基础偏好
- utility / action / repo-code 的惩罚
- coverage 是否会反向扣掉代表页

```js
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
```

### 2.7 direct navigation 修正逻辑

这段负责品牌直达、首页偏好、代表页偏好，以及 coverage 不足时对这些代表页做回拉。

```js
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
```

#### 什么时候要优先迁这段

如果旧版本的问题是：

- 品牌词搜索总是把主页顶上去
- 多词查询时 `/release/`、`/docs/`、`/issues/` 等具体页上不来

那这段基本必须一起迁。

### 2.8 基础总分函数

这段是 `3761037` 后普通候选分数计算的核心入口。

```js
function calculateSearchRelevanceScore(item, sourceType, context) {
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
  } catch (e) {}

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
  } catch (e) {}

  coverageStats = getSearchTermCoverageStats(context, {
    titleLower,
    hostname,
    urlLower,
    titleTokens,
    hostLabels,
    pathTokens
  });

  textScore += getTitlePinyinMatchScore(item.title, context.normalizedPinyinQuery).score;

  if (textScore <= 0) {
    return 0;
  }

  if (item.lastVisitTime) {
    const daysSinceVisit = (Date.now() - item.lastVisitTime) / (1000 * 60 * 60 * 24);
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
    const hoursSinceVisit = (Date.now() - item.lastVisitTime) / (1000 * 60 * 60);
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
    getOwnExtensionUtilityPenalty(item, context.hasSettingsIntent);
}
```

### 2.9 搜索候选管线

如果要完整回移 `3761037`，不要只迁打分函数。候选收集管线也变了。

```js
function collectSearchMatches(items, context, searchBlacklistItems) {
  return (Array.isArray(items) ? items : []).filter((item) => (
    (matchesSearchQueryText(item, context) || matchesSearchTitlePinyin(item, context)) &&
    !isUrlBlockedBySearchBlacklist(item && item.url, searchBlacklistItems)
  ));
}
```

```js
async function getSearchSuggestions(query) {
  const suggestions = [];
  const context = buildSearchQueryContext(query);
  if (!context.queryLower) {
    return [];
  }

  const [
    engineSuggestions,
    historyItemsRaw,
    topSites,
    bookmarksRaw,
    fallbackHistoryItems,
    allBookmarks,
    searchBlacklistItems
  ] = await Promise.all([
    ... // 省略外围 IO
  ]);

  const fallbackHistoryMatches = collectSearchMatches(fallbackHistoryItems, context, searchBlacklistItems);
  const historyItemsMerged = mergeItemsByUrl([
    Array.isArray(historyItemsRaw) ? historyItemsRaw : [],
    fallbackHistoryMatches
  ]);
  const historyItems = collectSearchMatches(historyItemsMerged, context, searchBlacklistItems);

  const bookmarkTextMatches = collectSearchMatches(allBookmarks, context, searchBlacklistItems);
  const bookmarksMerged = mergeItemsByUrl([
    Array.isArray(bookmarksRaw) ? bookmarksRaw : [],
    bookmarkTextMatches
  ]);
  const bookmarks = collectSearchMatches(bookmarksMerged, context, searchBlacklistItems);

  // upsertSuggestion(...) -> history / topSite / bookmark
  // buildSearchBrandDirectSuggestion(...)
  // engineSuggestions push

  suggestions.sort(compareSearchSuggestions);

  const uniqueSuggestions = [];
  const seenSuggestionKeys = new Set();
  for (let i = 0; i < suggestions.length && uniqueSuggestions.length < SEARCH_POLICY.candidatePoolLimit; i += 1) {
    const suggestion = suggestions[i];
    const suggestionKey = buildSearchDedupEntryKey(suggestion);
    if (!suggestionKey || seenSuggestionKeys.has(suggestionKey)) {
      continue;
    }
    seenSuggestionKeys.add(suggestionKey);
    uniqueSuggestions.push(suggestion);
  }

  let finalSuggestions = applySearchSuggestionHostDiversity(
    filterBlacklistedSuggestions(uniqueSuggestions, searchBlacklistItems, context.lookupQuery)
  );

  if (finalSuggestions.length === 0 && fallbackTopSites.length > 0) {
    const fallbackResults = fallbackTopSites
      .slice(0, SEARCH_POLICY.fallbackTopSiteLimit)
      .map((site, index) => createSearchSuggestion(site, 'topSite', 1 - index, {
        favicon: buildSearchSuggestionFavicon(site.url),
        reasons: ['来源：常用站点']
      }));
    finalSuggestions = filterBlacklistedSuggestions(fallbackResults, searchBlacklistItems, context.lookupQuery);
  }

  return finalSuggestions;
}
```

#### 关键点

- `history.search()` / `bookmarks.search()` 的直接结果，不再是最终结果
- 现在统一再走一轮 `collectSearchMatches(...)`
- dedup 后还会再经过：
  - `compareSearchSuggestions(...)`
  - 去重池
  - `applySearchSuggestionHostDiversity(...)`
  - blacklist 过滤

### 2.10 brand direct suggestion

如果你发现旧版本里品牌词只能命中若干内页，缺少“站点直达”补位，这段也要一起迁。

核心入口：

```js
function buildSearchBrandDirectSuggestion(candidates, context) {
  if (context.intentType !== 'brand' || context.hasInformationalIntent) {
    return null;
  }
  ...
  return createSearchSuggestion(directItem, sourceType, baseScore + 36, {
    favicon: buildSearchSuggestionFavicon(directUrl),
    reasons,
    isTopSite: true,
    isSyntheticDirect: true
  });
}
```

---

## 三、`newtab.js` 中需要一起迁移的材料

`background.js` 决定候选是什么，`newtab.js` 决定首位是谁、预选谁、Tab 进入什么模式。

如果只迁 `background.js`，会出现：

- 候选列表大体变了
- 但首位高亮、自动补全、站内搜索触发仍旧按旧规则工作

### 3.1 强 navigation match 前置

```js
function getStrongNavigationMatchScore(suggestion, rawQuery) {
  let score = 0;
  const titleTerms = splitNavigationMatchTerms(titleLower);
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

function promoteStrongNavigationMatch(list, rawQuery) {
  if (!Array.isArray(list)) {
    return null;
  }
  let bestIndex = -1;
  let bestScore = 0;
  for (let i = 0; i < list.length; i += 1) {
    const score = getStrongNavigationMatchScore(list[i], rawQuery);
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
```

### 3.2 自动补全逻辑

```js
function applyAutocomplete(allSuggestions, primarySuggestion, primaryHighlightReason) {
  const rawQuery = latestRawQuery;
  const trimmedQuery = rawQuery.trim();
  if (searchResultPriorityMode === 'search') {
    ...
    return;
  }
  if (siteSearchState) {
    clearAutocomplete();
    return;
  }
  if (!isEnglishQuery(trimmedQuery) || !rawQuery) {
    clearAutocomplete();
    return;
  }
  ...
  const shouldForcePrimaryAlignment = Boolean(
    primarySuggestion &&
    primaryHighlightReason &&
    primaryHighlightReason !== 'autocomplete' &&
    primaryHighlightReason !== 'default'
  );
  let candidate = null;
  if (primarySuggestion) {
    candidate = getAutocompleteCandidateFromSuggestion(primarySuggestion, rawQuery);
  }
  if (!candidate && shouldForcePrimaryAlignment) {
    clearAutocomplete();
    return;
  }
  if (!candidate) {
    candidate = getDomainPrefixCandidate(allSuggestions, rawQuery) ||
      getAutocompleteCandidate(allSuggestions, rawQuery);
  }
  ...
}
```

#### 迁移意义

- 首位高亮如果不是普通 autocomplete，而是 `navigation` / `siteSearchPrompt` / `inline`，补全会跟着对齐
- 否则用户会看到“高亮的是 A，但输入框补全成了 B”

### 3.3 top site / site-search prompt / inline 的首位决策

这是 `newtab.js` 中最应该一起迁的一段。

```js
let autocompleteCandidate = null;
let primaryHighlightIndex = -1;
let primaryHighlightReason = 'none';
let strongNavigationMatch = null;
let topSiteMatch = null;
let siteSearchPrompt = null;
let mergedProvider = null;
let primarySuggestion = null;
const inlineEnabled = Boolean(inlineSuggestion);
let siteSearchTrigger = null;
const preferAutocompleteFirst = searchResultPriorityMode !== 'search';

if (!modeCommandActive && !hasCommand) {
  if (!siteSearchState && !inlineEnabled && preferAutocompleteFirst) {
    strongNavigationMatch = promoteStrongNavigationMatch(allSuggestions, latestRawQuery.trim());
    if (strongNavigationMatch) {
      primaryHighlightIndex = 0;
      primaryHighlightReason = 'navigation';
    }
    topSiteMatch = promoteTopSiteMatch(allSuggestions, latestRawQuery.trim());
  }

  siteSearchTrigger = (!siteSearchState && !inlineEnabled)
    ? getSiteSearchTriggerCandidate(rawTagInput, providersForTags, topSiteMatch)
    : null;

  if (siteSearchTrigger && !topSiteMatch && !strongNavigationMatch) {
    siteSearchPrompt = {
      type: 'siteSearchPrompt',
      title: formatMessage('search_in_site', '在 {site} 中搜索', {
        site: getSiteSearchDisplayName(siteSearchTrigger)
      }),
      url: '',
      favicon: getProviderIcon(siteSearchTrigger),
      provider: siteSearchTrigger
    };
    if (!isSuggestionBlockedBySearchBlacklist(siteSearchPrompt)) {
      allSuggestions.unshift(siteSearchPrompt);
      primaryHighlightIndex = 0;
      primaryHighlightReason = 'siteSearchPrompt';
    } else {
      siteSearchPrompt = null;
    }
  }

  if (!siteSearchState && !inlineEnabled && !siteSearchPrompt && !strongNavigationMatch && preferAutocompleteFirst) {
    autocompleteCandidate = getAutocompleteCandidate(allSuggestions, latestRawQuery);
    if (autocompleteCandidate) {
      ...
      primaryHighlightIndex = 0;
      primaryHighlightReason = 'autocomplete';
    }
  }

  if (inlineSuggestion) {
    allSuggestions.unshift(inlineSuggestion);
    allSuggestions = filterBlacklistedSuggestions(allSuggestions, query);
    primaryHighlightIndex = 0;
    primaryHighlightReason = 'inline';
  } else if (!siteSearchPrompt && !strongNavigationMatch && topSiteMatch && preferAutocompleteFirst) {
    primaryHighlightIndex = 0;
    primaryHighlightReason = 'topSite';
  }

  if (query && primaryHighlightIndex < 0 && allSuggestions.length > 0) {
    primaryHighlightIndex = 0;
    primaryHighlightReason = 'default';
  }
}
```

#### 实际优先级

在“补全优先”下，这段大致是：

1. 强 navigation match
2. `siteSearchPrompt`
3. autocomplete
4. inline site search
5. top site
6. 默认第一项

如果目标版本里用户抱怨“按 Tab 进入站内搜索的触发感不对”“首位总不是想要的那一项”，这段通常要和 `background.js` 一起回移。

---

## 四、`0a94ca5` 这组 provider / AI 识别材料

### 4.1 这组改动要迁哪些文件

- `background.js`
- `newtab.js`
- `options.js`

如果只迁其中一个，最容易出现的分叉是：

- 设置页把某 provider 认成 AI
- 但 newtab / overlay 仍按普通站内搜索处理

### 4.2 AI provider 的统一识别规则

这套规则在 `background.js`、`newtab.js`、`options.js` 都要一致。

最基础的版本是：

```js
function hasOpenAndSubmitSiteSearchAction(item) {
  return Boolean(
    item &&
    String(item.action || '').trim() === 'openAndSubmit'
  );
}

function isAiSiteSearchProvider(item) {
  if (!item) {
    return false;
  }
  if (hasOpenAndSubmitSiteSearchAction(item)) {
    return true;
  }
  const template = normalizeSiteSearchTemplate(String(item.template || '').trim());
  return Boolean(template) && !template.includes('{query}');
}
```

在 `newtab.js` / `background.js` 里还会配套：

```js
function isInteractiveSiteSearchProvider(provider) {
  return Boolean(
    hasOpenAndSubmitSiteSearchAction(provider) &&
    String(provider.submitStrategy || '').trim() === 'geminiPrompt'
  );
}
```

#### 含义

- `isAiSiteSearchProvider(...)` 决定 UI / 分类 / AI 装饰 / provider 类型归类
- `isInteractiveSiteSearchProvider(...)` 决定是否走真正的 `openAndSubmit` 交互执行链

### 4.3 provider 归一化与继承

这段是 `options.js` 中回移时最容易漏掉、但也最关键的材料。

```js
function normalizeSiteSearchProvider(item, baseItem) {
  if (!item && !baseItem) {
    return null;
  }
  const key = String((item && item.key) || (baseItem && baseItem.key) || '').trim();
  const template = normalizeSiteSearchTemplate(
    String((item && item.template) || (baseItem && baseItem.template) || '').trim()
  );
  if (!key || !template) {
    return null;
  }
  const aliasSource = Array.isArray(item && item.aliases)
    ? item.aliases
    : Array.isArray(baseItem && baseItem.aliases)
      ? baseItem.aliases
      : [];
  return {
    key,
    aliases: aliasSource.filter(Boolean),
    name: String((item && item.name) || (baseItem && baseItem.name) || key).trim() || key,
    template,
    action: String((item && item.action) || (baseItem && baseItem.action) || '').trim(),
    submitStrategy: String(
      (item && item.submitStrategy) || (baseItem && baseItem.submitStrategy) || ''
    ).trim(),
    disabled: Boolean(item && item.disabled),
    disabledReason: String((item && item.disabledReason) || '').trim(),
    icon: String((item && item.icon) || (baseItem && baseItem.icon) || '').trim(),
    iconUrl: String((item && item.iconUrl) || (baseItem && baseItem.iconUrl) || '').trim()
  };
}
```

如果目标版本结构较简单，也至少要保证：

- `key`
- `aliases`
- `name`
- `template`
- `action`
- `submitStrategy`

这几个字段不会在保存/读取过程中丢失。

### 4.4 自定义 provider 继承内置 provider 行为

`newtab.js` / `background.js` 有轻量版本，`options.js` 有完整归一化版本。核心思想一致：

```js
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
```

#### 为什么必须迁

如果用户把内置 AI provider 改成自定义项，只保留：

- 新 key
- 新 name
- 新 aliases

没有这层继承的话，它很可能就从 AI provider 退化成普通 provider。

### 4.5 设置页读写链路

#### 默认 provider 读取

```js
function loadDefaultSiteSearchProviders() {
  const localUrl = chrome.runtime.getURL('assets/data/site-search.json');
  return fetch(localUrl)
    .then((resp) => resp.json())
    .then((data) => {
      const items = data && Array.isArray(data.items) ? data.items : [];
      const source = items.length > 0 ? items : fallbackSiteSearchProviders;
      return source.map((item) => normalizeSiteSearchProvider(item)).filter(Boolean);
    })
    .catch(() => new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSiteSearchProviders' }, (response) => {
        const items = response && Array.isArray(response.items) ? response.items : [];
        const source = items.length > 0 ? items : fallbackSiteSearchProviders;
        resolve(source.map((item) => normalizeSiteSearchProvider(item)).filter(Boolean));
      });
    }));
}
```

#### 自定义 provider 读取

```js
function loadCustomSiteSearchProviders(baseItems) {
  return new Promise((resolve) => {
    if (!storageArea) {
      resolve([]);
      return;
    }
    storageArea.get([SITE_SEARCH_STORAGE_KEY], (result) => {
      const items = Array.isArray(result[SITE_SEARCH_STORAGE_KEY]) ? result[SITE_SEARCH_STORAGE_KEY] : [];
      const baseMap = new Map((baseItems || []).map((item) => [String(item && item.key ? item.key : '').toLowerCase(), item]));
      resolve(items.map((item) => {
        const key = String(item && item.key ? item.key : '').toLowerCase();
        return normalizeSiteSearchProvider(item, baseMap.get(key));
      }).filter(Boolean));
    });
  });
}
```

#### 自定义 provider 保存

```js
function saveCustomSiteSearchProviders(items) {
  return new Promise((resolve) => {
    if (!storageArea) {
      resolve();
      return;
    }
    const payload = (items || []).map((item) => normalizeSiteSearchProvider(item)).filter(Boolean);
    storageArea.set({ [SITE_SEARCH_STORAGE_KEY]: payload }, () => resolve());
  });
}
```

#### 添加自定义 provider

```js
const nextItem = normalizeSiteSearchProvider({
  key: key,
  name: name || key,
  template: template,
  aliases: aliases
});
```

#### 结论

只要目标版本的设置页还会编辑 provider，这几段最好成组回移，否则很容易出现：

- 设置页看起来保存成功
- 但 `action` / `submitStrategy` 已丢
- newtab / overlay 行为和设置页展示不一致

---

## 五、回移时建议的顺序

### 方案 A：只回移普通搜索结果质量

如果你只想把搜索命中/排序变聪明，不动 AI provider：

1. 迁 `background.js`
2. 至少一起迁：
   - `buildSearchQueryContext(...)`
   - `matchesSearchQueryText(...)`
   - `isShortAsciiSearchTerm(...)`
   - `shouldAllowLooseTextContains(...)`
   - `getSearchTermCoverageStats(...)`
   - `getSearchSuggestionCategoryAdjustment(...)`
   - `getSearchDirectNavigationAdjustment(...)`
   - `calculateSearchRelevanceScore(...)`
   - `collectSearchMatches(...)`
   - `getSearchSuggestions(...)` 管线
3. 再迁 `newtab.js` 中首位高亮相关：
   - `getStrongNavigationMatchScore(...)`
   - `promoteStrongNavigationMatch(...)`
   - `promoteTopSiteMatch(...)`
   - `applyAutocomplete(...)`
   - 首位选择主分支

### 方案 B：连 AI / site-search provider 一起回移

在方案 A 基础上，再加：

1. `options.js`
2. `background.js`
3. `newtab.js`

要保证下面这些 helper 在三个文件里统一：

- `hasOpenAndSubmitSiteSearchAction(...)`
- `isAiSiteSearchProvider(...)`
- `isInteractiveSiteSearchProvider(...)`
- `normalizeSiteSearchTemplate(...)`
- `normalizeSiteSearchProvider(...)`
- `inheritSiteSearchProviderBehavior(...)`

---

## 六、最容易漏掉的依赖

### 1. 只迁打分函数，不迁匹配函数

结果：

- 看起来 `score` 逻辑升级了
- 但候选池仍然是旧的粗粒度 `includes`
- 效果不会接近当前版本

### 2. 只迁 `background.js`，不迁 `newtab.js`

结果：

- 候选排序更合理
- 但首位高亮、默认补全、Tab 触发行为仍旧旧逻辑

### 3. 只迁设置页 provider 分类，不迁读写归一化

结果：

- 设置页里 AI/内置分组看起来正常
- 但保存后行为字段丢失
- 实际触发链路跑偏

### 4. 忽略拼音链路

这一阶段的普通文本匹配升级，并没有替代拼音匹配。

如果目标版本之前已经有拼音链路，回移时不能把：

- `buildTitlePinyinIndex(...)`
- `getTitlePinyinMatchScore(...)`
- `background.js` 中的拼音匹配入口

误删或绕开。

---

## 七、哪些提交不用为这次回移考虑

下面这些提交不是搜索规则本身：

- `b5719fb`：overlay panel 分层、建议列表显隐、`!important` 清理
- `024a51f`：滚轮滚动与 hover 样式
- `c0b1fd9`：AI sweep 裁剪 / overflow
- `cc8c093`：移除 AI sweep / border-beam 视觉效果

如果你的目标只是把搜索结果质量和 provider 触发逻辑带回旧版本，可以先不碰这些 UI 变动。

---

## 八、最小迁移清单

### 普通搜索规则最小集合

- `background.js`
  - `buildSearchQueryContext(...)`
  - `matchesSearchQueryText(...)`
  - `isShortAsciiSearchTerm(...)`
  - `shouldAllowLooseTextContains(...)`
  - `getSearchTermCoverageStats(...)`
  - `getSearchSuggestionCategoryAdjustment(...)`
  - `getSearchDirectNavigationAdjustment(...)`
  - `calculateSearchRelevanceScore(...)`
  - `collectSearchMatches(...)`
  - `getSearchSuggestions(...)`
  - `compareSearchSuggestions(...)`
- `newtab.js`
  - `getStrongNavigationMatchScore(...)`
  - `promoteStrongNavigationMatch(...)`
  - `promoteTopSiteMatch(...)`
  - `applyAutocomplete(...)`
  - 首位高亮主分支

### AI / site-search provider 最小集合

- `options.js`
  - `hasOpenAndSubmitSiteSearchAction(...)`
  - `isAiSiteSearchProvider(...)`
  - `normalizeSiteSearchProvider(...)`
  - `loadDefaultSiteSearchProviders(...)`
  - `loadCustomSiteSearchProviders(...)`
  - `saveCustomSiteSearchProviders(...)`
- `newtab.js`
  - `hasOpenAndSubmitSiteSearchAction(...)`
  - `isAiSiteSearchProvider(...)`
  - `isInteractiveSiteSearchProvider(...)`
  - `inheritSiteSearchProviderBehavior(...)`
  - `getInlineSiteSearchCandidate(...)`
  - `getSiteSearchTriggerCandidate(...)`
- `background.js`
  - 同名 provider helper
  - `siteSearchPrompt` / `inlineSiteSearch` / `runSiteSearchProviderQuery` 相关主链

---

## 九、一句话版本

如果只用一句话概括这段时期的搜索规则演进：

- `3761037` 把搜索从“粗粒度 includes + 旧分数模型”升级成了“标题 token / host / path / coverage / 拼音 共同决定”的结构化匹配与打分
- `0a94ca5` 把 AI / site-search provider 的识别、继承、读写统一起来，避免 `siteSearchPrompt` / `inlineSiteSearch` / AI 触发在不同入口下跑偏

后续如果要在其他版本应用，优先按本文的函数清单和迁移顺序成组回移，不要零散摘几段分数代码单独拼接。
