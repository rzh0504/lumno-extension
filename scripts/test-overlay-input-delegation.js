const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');

assert.match(
  overlayJs,
  /let searchInput = inputParts\.input;/,
  'overlay should keep a live search input reference so replaced input nodes can be adopted'
);

assert.match(
  overlayJs,
  /function getLiveSearchInputFromEvent\(event\)[\s\S]*?inputContainer\.contains\(target\)/,
  'overlay should resolve the active input from the bubbling input event target'
);

assert.match(
  overlayJs,
  /function runSearchInputEventOnce\(event, handler\)[\s\S]*?handledSearchInputEvents/,
  'overlay should avoid double-handling delegated and direct input events'
);

assert.match(
  overlayJs,
  /inputContainer\.addEventListener\('input', handleSearchInputEvent, true\);/,
  'overlay should delegate input events through the stable input container'
);

assert.match(
  overlayJs,
  /inputContainer\.addEventListener\('compositionend', handleSearchInputCompositionEnd, true\);/,
  'overlay should delegate composition events through the stable input container'
);

assert.match(
  overlayJs,
  /openTabQuickSwitchEnabled:\s*overlayTabQuickSwitchEnabled/,
  'overlay should pass the local quick-switch setting into search ranking without referencing an undefined variable'
);

assert.doesNotMatch(
  overlayJs,
  /(?<!:)openTabQuickSwitchEnabled,\s*\n/,
  'overlay should not use an undefined openTabQuickSwitchEnabled shorthand'
);

assert.doesNotMatch(
  overlayJs,
  /DIRECT_NAVIGATION_FALLBACK_SINGLE_COLON_PROTOCOLS|getDirectNavigationFallbackProtocol|isExplicitDirectNavigationFallbackUrl/,
  'overlay should use the shared direct URL parser instead of keeping a local protocol fallback'
);

assert.match(
  overlayJs,
  /function getSearchUtilsRuntime\(\)[\s\S]*?window\.LumnoSearchUtils/,
  'overlay should resolve shared search utils dynamically after script injection settles'
);

assert.match(
  overlayJs,
  /function getDirectNavigationUrl\(input\)[\s\S]*?getSearchUtilsRuntime\(\)[\s\S]*?getDirectNavigationUrl\(input\)/,
  'overlay direct URL parsing should use the dynamic shared search utils reference'
);

assert.match(
  overlayJs,
  /function requestTabsAndRender\(filterQuery\)[\s\S]*?const requestQuery = typeof filterQuery === 'string'[\s\S]*?if \(requestQuery !== latestOverlayQuery\) \{[\s\S]*?return;[\s\S]*?\}[\s\S]*?renderTabSuggestions\(filteredTabs\);/,
  'overlay tab suggestions should not overwrite search results after the user has typed a query'
);

assert.match(
  overlayJs,
  /let overlaySuggestionRequestSeq = 0;[\s\S]*let overlayRemoteSuggestionDebounceTimer = null;/,
  'overlay should track a request generation and a separate remote debounce timer'
);

assert.match(
  overlayJs,
  /function requestOverlaySearchSuggestions\(query[\s\S]*action: 'getSearchSuggestions'[\s\S]*updateSearchSuggestions\(localSuggestions, requestQuery\)[\s\S]*action: 'getSearchEngineSuggestions'[\s\S]*localSuggestions:/,
  'overlay should render browser-local suggestions before requesting the remote incremental merge'
);

assert.match(
  overlayJs,
  /requestSeq !== overlaySuggestionRequestSeq \|\| requestQuery !== latestOverlayQuery/,
  'overlay should ignore local or remote callbacks from an older query generation'
);

assert.match(
  overlayJs,
  /remoteResponse\.hasRemoteSuggestions !== true/,
  'overlay should keep the existing local render when the remote request adds no suggestions'
);

assert.match(
  overlayJs,
  /siteSearchProvidersCache = items;\s*updateSearchSuggestions\(lastSuggestionResponse, query\);/,
  'overlay provider reload should re-render the latest incremental response instead of the captured local response'
);

console.log('overlay input delegation tests passed');
