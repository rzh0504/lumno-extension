
try {
  importScripts(chrome.runtime.getURL('src/shared/blacklist-utils.js'));
} catch (error) {
  console.warn('Lumno: failed to load blacklist utils.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/url-guards.js'));
} catch (error) {
  console.warn('Lumno: failed to load URL guards.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/favicon-utils.js'));
} catch (error) {
  console.warn('Lumno: failed to load favicon utils.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/extension-routes.js'));
} catch (error) {
  console.warn('Lumno: failed to load extension routes.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/settings.js'));
} catch (error) {
  console.warn('Lumno: failed to load settings utils.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/search-utils.js'));
} catch (error) {
  console.warn('Lumno: failed to load search utils.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/site-search-store.js'));
} catch (error) {
  console.warn('Lumno: failed to load site search store.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/background/ai-provider-submit.js'));
} catch (error) {
  console.warn('Lumno: failed to load AI provider submit runtime.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/background/extension-pages.js'));
} catch (error) {
  console.warn('Lumno: failed to load extension page helpers.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/background/message-router.js'));
} catch (error) {
  console.warn('Lumno: failed to load background message router.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/background/newtab-fallback.js'));
} catch (error) {
  console.warn('Lumno: failed to load newtab fallback helpers.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/background/shortcut-rules.js'));
} catch (error) {
  console.warn('Lumno: failed to load shortcut rules helpers.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/background/pip-ownership.js'));
} catch (error) {
  console.warn('Lumno: failed to load PiP ownership utils.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/background/pip-main-world.js'));
} catch (error) {
  console.warn('Lumno: failed to load PiP main-world utils.', error);
}

try {
  importScripts(chrome.runtime.getURL('assets/vendor/pinyin-pro.js'));
} catch (error) {
  console.warn('Lumno: failed to load pinyin support.', error);
}

const BACKGROUND_PAGES = globalThis.LumnoBackgroundPages || {};
const getExtensionDetailsUrl = BACKGROUND_PAGES.getExtensionDetailsUrl;
const openExtensionOptionsPage = BACKGROUND_PAGES.openExtensionOptionsPage;
const openOnboardingPage = BACKGROUND_PAGES.openOnboardingPage;
const openReleasePage = BACKGROUND_PAGES.openReleasePage;
const openBookmarkManagerPage = BACKGROUND_PAGES.openBookmarkManagerPage;
const openExtensionShortcutsPage = BACKGROUND_PAGES.openExtensionShortcutsPage;
const BACKGROUND_MESSAGE_ROUTER = globalThis.LumnoBackgroundMessageRouter || {};
const EXTENSION_ROUTES = globalThis.LumnoExtensionRoutes || {};
const FAVICON_UTILS = globalThis.LumnoFaviconUtils || {};
const BACKGROUND_NEWTAB_FALLBACK = globalThis.LumnoBackgroundNewtabFallback || {};
const isLocalFileLikeTargetUrl = BACKGROUND_NEWTAB_FALLBACK.isLocalFileLikeTargetUrl;
const checkFileSchemeAccess = BACKGROUND_NEWTAB_FALLBACK.checkFileSchemeAccess;
const openNewtabFallback = BACKGROUND_NEWTAB_FALLBACK.openNewtabFallback;
const openNewtabFallbackForUrl = BACKGROUND_NEWTAB_FALLBACK.openNewtabFallbackForUrl;
const BACKGROUND_SHORTCUT_RULES = globalThis.LumnoShortcutRules || {};
const shortcutRules = BACKGROUND_SHORTCUT_RULES && typeof BACKGROUND_SHORTCUT_RULES.create === 'function'
  ? BACKGROUND_SHORTCUT_RULES.create({
    chromeApi: chrome,
    fetchImpl: fetch,
    navigatorLike: navigator
  })
  : null;
const loadShortcutRules = shortcutRules && typeof shortcutRules.loadShortcutRules === 'function'
  ? shortcutRules.loadShortcutRules
  : () => Promise.resolve([]);
const getShortcutUrl = shortcutRules && typeof shortcutRules.getShortcutUrl === 'function'
  ? shortcutRules.getShortcutUrl
  : () => null;

function isBrowserExtensionProtocol(protocol) {
  const guards = globalThis.LumnoUrlGuards || {};
  if (typeof guards.isBrowserExtensionProtocol === 'function') {
    return guards.isBrowserExtensionProtocol(protocol);
  }
  const normalized = String(protocol || '').toLowerCase();
  return normalized === 'chrome-extension:' ||
    normalized === 'moz-extension:' ||
    normalized === 'ms-browser-extension:';
}

function isRestrictedUrl(url) {
  const guards = globalThis.LumnoUrlGuards || {};
  if (typeof guards.isRestrictedUrl === 'function') {
    return guards.isRestrictedUrl(url);
  }
  if (!url) {
    return true;
  }
  const lower = String(url).toLowerCase();
  if (lower.startsWith('chrome://') ||
    lower.startsWith('edge://') ||
    lower.startsWith('brave://') ||
    lower.startsWith('vivaldi://') ||
    lower.startsWith('opera://') ||
    lower.startsWith('about:')) {
    return true;
  }
  try {
    const parsed = new URL(url);
    const protocol = String(parsed.protocol || '').toLowerCase();
    if (isBrowserExtensionProtocol(protocol)) {
      return true;
    }
    if (protocol !== 'http:' && protocol !== 'https:') {
      return true;
    }
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if ((host === 'chrome.google.com' && path.startsWith('/webstore')) ||
        host === 'chromewebstore.google.com' ||
        (host === 'microsoftedge.microsoft.com' && path.startsWith('/addons')) ||
        host === 'addons.opera.com') {
      return true;
    }
  } catch (e) {
    return true;
  }
  return false;
}

function canOpenOverlayOnUrl(url) {
  const guards = globalThis.LumnoUrlGuards || {};
  if (typeof guards.canOpenOverlayOnUrl === 'function') {
    return guards.canOpenOverlayOnUrl(url);
  }
  if (!url) {
    return false;
  }
  const lower = String(url).toLowerCase();
  if (lower.startsWith('chrome://') ||
    lower.startsWith('edge://') ||
    lower.startsWith('brave://') ||
    lower.startsWith('vivaldi://') ||
    lower.startsWith('opera://') ||
    lower.startsWith('about:')) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const protocol = String(parsed.protocol || '').toLowerCase();
    if (isBrowserExtensionProtocol(protocol)) {
      return false;
    }
    if (protocol === 'file:') {
      return true;
    }
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if ((host === 'chrome.google.com' && path.startsWith('/webstore')) ||
        host === 'chromewebstore.google.com' ||
        (host === 'microsoftedge.microsoft.com' && path.startsWith('/addons')) ||
        host === 'addons.opera.com') {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}

function canFetchPageForFavicon(url) {
  const guards = globalThis.LumnoUrlGuards || {};
  if (typeof guards.canFetchPageForFavicon === 'function') {
    return guards.canFetchPageForFavicon(url);
  }
  return !isRestrictedUrl(url);
}

function getResolvedTabUrl(tab) {
  if (!tab || typeof tab !== 'object') {
    return '';
  }
  const directUrl = typeof tab.url === 'string' ? String(tab.url).trim() : '';
  if (directUrl) {
    return directUrl;
  }
  const pendingUrl = typeof tab.pendingUrl === 'string' ? String(tab.pendingUrl).trim() : '';
  return pendingUrl;
}

const pipOwnership = globalThis.LumnoPipOwnership && typeof globalThis.LumnoPipOwnership.create === 'function'
  ? globalThis.LumnoPipOwnership.create({
    chromeApi: chrome,
    getResolvedTabUrl: getResolvedTabUrl
  })
  : null;

const pipMainWorld = globalThis.LumnoPipMainWorld && typeof globalThis.LumnoPipMainWorld.create === 'function'
  ? globalThis.LumnoPipMainWorld.create({
    chromeApi: chrome
  })
  : null;

async function requestGlobalPipOwnership(sender, kind) {
  if (!pipOwnership || typeof pipOwnership.requestGlobalPipOwnership !== 'function') {
    return { ok: false, granted: false, reason: 'pip-ownership-unavailable' };
  }
  return pipOwnership.requestGlobalPipOwnership(sender, kind);
}

async function releaseGlobalPipOwnership(sender, token) {
  if (!pipOwnership || typeof pipOwnership.releaseGlobalPipOwnership !== 'function') {
    return { ok: false, released: false, reason: 'pip-ownership-unavailable' };
  }
  return pipOwnership.releaseGlobalPipOwnership(sender, token);
}

function clearGlobalPipOwnerForTabId(tabId) {
  if (!pipOwnership || typeof pipOwnership.clearGlobalPipOwnerForTabId !== 'function') {
    return;
  }
  pipOwnership.clearGlobalPipOwnerForTabId(tabId);
}

function isLumnoNewtabUrl(url) {
  const value = String(url || '');
  if (!value || !chrome || !chrome.runtime || typeof chrome.runtime.getURL !== 'function') {
    return false;
  }
  const lumnoNewtabPrefix = typeof EXTENSION_ROUTES.buildNewtabUrl === 'function'
    ? EXTENSION_ROUTES.buildNewtabUrl(chrome)
    : chrome.runtime.getURL('src/newtab/newtab.html');
  return value === lumnoNewtabPrefix || value.startsWith(`${lumnoNewtabPrefix}?`);
}

function isBrowserNewtabUrl(url) {
  const lower = String(url || '').toLowerCase();
  return lower === 'chrome://newtab/' ||
    lower === 'chrome://new-tab-page/' ||
    lower === 'edge://newtab/' ||
    lower === 'brave://newtab/' ||
    lower === 'opera://startpage/';
}

function isOwnExtensionUrl(url) {
  if (!url || !chrome || !chrome.runtime || !chrome.runtime.id) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const protocol = String(parsed.protocol || '').toLowerCase();
    return isBrowserExtensionProtocol(protocol) &&
      String(parsed.hostname || '') === String(chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

function getOwnExtensionFaviconUrl() {
  if (!chrome || !chrome.runtime || typeof chrome.runtime.getURL !== 'function') {
    return '';
  }
  return chrome.runtime.getURL('assets/images/lumno.png');
}

function shouldRecoverFromCommandNewtab(activeTab, source) {
  if (source !== 'commands' || !activeTab) {
    return false;
  }
  const activeUrl = getResolvedTabUrl(activeTab);
  return isLumnoNewtabUrl(activeUrl) || isBrowserNewtabUrl(activeUrl);
}

function pickRecoveryTargetTab(activeTab, tabs) {
  const tabList = Array.isArray(tabs) ? tabs : [];
  if (!activeTab || typeof activeTab.id !== 'number') {
    return null;
  }
  const openerTabId = typeof activeTab.openerTabId === 'number' ? activeTab.openerTabId : null;
  if (typeof openerTabId === 'number') {
    const openerTab = tabList.find((item) =>
      item &&
      item.id === openerTabId &&
      canOpenOverlayOnUrl(item.url || '')
    );
    if (openerTab) {
      return openerTab;
    }
  }
  const candidates = tabList
    .filter((item) =>
      item &&
      typeof item.id === 'number' &&
      item.id !== activeTab.id &&
      canOpenOverlayOnUrl(item.url || '')
    )
    .sort((a, b) => Number(b.lastAccessed || 0) - Number(a.lastAccessed || 0));
  return candidates[0] || null;
}

function recoverOverlayTargetFromCommandNewtab(activeTab, tabs, source) {
  if (!shouldRecoverFromCommandNewtab(activeTab, source)) {
    return false;
  }
  const targetTab = pickRecoveryTargetTab(activeTab, tabs);
  if (!targetTab || typeof targetTab.id !== 'number') {
    logHotkeyDebug('command-newtab-recover-missed', {
      reason: 'no-target',
      tabId: activeTab && typeof activeTab.id === 'number' ? activeTab.id : null,
      source: source || ''
    });
    return false;
  }
  logHotkeyDebug('command-newtab-recover-start', {
    source: source || '',
    fromTabId: activeTab.id,
    toTabId: targetTab.id,
    fromUrl: activeTab.url || '',
    toUrl: targetTab.url || ''
  });
  chrome.tabs.update(targetTab.id, { active: true }, () => {
    if (chrome.runtime && chrome.runtime.lastError) {
      logHotkeyDebug('command-newtab-recover-failed', {
        source: source || '',
        targetTabId: targetTab.id,
        error: chrome.runtime.lastError.message || 'unknown'
      });
      return;
    }
    if (typeof activeTab.id === 'number') {
      chrome.tabs.remove(activeTab.id, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          logHotkeyDebug('command-newtab-close-failed', {
            source: source || '',
            tabId: activeTab.id,
            error: chrome.runtime.lastError.message || 'unknown'
          });
        }
      });
    }
    openOverlayOnTab(targetTab, tabs, 'commands-recover');
  });
  return true;
}

function isSearchCommandSource(source) {
  return source === 'commands' || source === 'commands-prefill';
}

function requestFocusVisibleNewtabInput(source, tabId) {
  const payload = {
    action: 'lumno:newtab-focus-input',
    source: source || '',
    tabId: typeof tabId === 'number' ? tabId : null
  };
  try {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        logHotkeyDebug('command-newtab-focus-send-failed', {
          source: source || '',
          tabId: typeof tabId === 'number' ? tabId : null,
          error: chrome.runtime.lastError.message || 'unknown'
        });
        return;
      }
      logHotkeyDebug('command-newtab-focus-send-done', {
        source: source || '',
        tabId: typeof tabId === 'number' ? tabId : null,
        ok: Boolean(response && response.ok)
      });
    });
  } catch (e) {
    logHotkeyDebug('command-newtab-focus-send-error', {
      source: source || '',
      tabId: typeof tabId === 'number' ? tabId : null,
      error: e && e.message ? e.message : String(e || '')
    });
  }
}

function logHotkeyDebug(stage, payload) {
  try {
    const detail = payload && typeof payload === 'object' ? payload : {};
    console.log(`[Lumno][hotkey] ${stage}`, detail);
  } catch (e) {
    // Ignore logging errors.
  }
}

const storageArea = (chrome && chrome.storage && chrome.storage.sync)
  ? chrome.storage.sync
  : (chrome && chrome.storage ? chrome.storage.local : null);
const localStorageArea = (chrome && chrome.storage && chrome.storage.local)
  ? chrome.storage.local
  : storageArea;
const storageAreaName = storageArea
  ? (storageArea === (chrome && chrome.storage ? chrome.storage.sync : null) ? 'sync' : 'local')
  : null;
const THEME_STORAGE_KEY = '_x_extension_theme_mode_2024_unique_';
const LANGUAGE_STORAGE_KEY = '_x_extension_language_2024_unique_';
const LANGUAGE_MESSAGES_STORAGE_KEY = '_x_extension_language_messages_2024_unique_';
const RECENT_MODE_STORAGE_KEY = '_x_extension_recent_mode_2024_unique_';
const RECENT_COUNT_STORAGE_KEY = '_x_extension_recent_count_2024_unique_';
const NEWTAB_WIDTH_MODE_STORAGE_KEY = '_x_extension_newtab_width_mode_2026_unique_';
const NEWTAB_SEARCH_WIDTH_STORAGE_KEY = '_x_extension_newtab_search_width_2026_unique_';
const NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY = '_x_extension_newtab_wordmark_visible_2026_unique_';
const NEWTAB_THEME_MODE_STORAGE_KEY = '_x_extension_newtab_theme_mode_2026_unique_';
const NEWTAB_THEME_SCOPE_STORAGE_KEY = '_x_extension_newtab_theme_scope_2026_unique_';
const NEWTAB_WALLPAPER_STORAGE_KEY = '_x_extension_newtab_wallpaper_2026_unique_';
const NEWTAB_WALLPAPER_OVERLAY_STORAGE_KEY = '_x_extension_newtab_wallpaper_overlay_2026_unique_';
const NEWTAB_WALLPAPER_EFFECT_STORAGE_KEY = '_x_extension_newtab_wallpaper_effect_2026_unique_';
const OVERLAY_SIZE_MODE_STORAGE_KEY = '_x_extension_overlay_size_mode_2026_unique_';
const BOOKMARK_COUNT_STORAGE_KEY = '_x_extension_bookmark_count_2024_unique_';
const BOOKMARK_COLUMNS_STORAGE_KEY = '_x_extension_bookmark_columns_2024_unique_';
const PINNED_RECENT_SITES_STORAGE_KEY = '_x_extension_newtab_pinned_recent_sites_2026_unique_';
const HIDDEN_RECENT_SITES_STORAGE_KEY = '_x_extension_newtab_hidden_recent_sites_2026_unique_';
const RESTRICTED_ACTION_STORAGE_KEY = '_x_extension_restricted_action_2024_unique_';
const OVERLAY_TAB_PRIORITY_STORAGE_KEY = '_x_extension_overlay_tab_priority_2024_unique_';
const TAB_RANK_SCORE_DEBUG_STORAGE_KEY = '_x_extension_tab_rank_score_debug_2026_unique_';
const AUTO_PIP_ENABLED_STORAGE_KEY = '_x_extension_auto_pip_enabled_2026_unique_';
const DOCUMENT_PIP_ENABLED_STORAGE_KEY = '_x_extension_document_pip_enabled_2026_unique_';
const PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY = '_x_extension_pinned_tab_recovery_enabled_2026_unique_';
const FALLBACK_SHORTCUT_STORAGE_KEY = '_x_extension_fallback_hotkey_2024_unique_';
const SEARCH_RESULT_PRIORITY_STORAGE_KEY = '_x_extension_search_result_priority_2026_unique_';
const SEARCH_RESULT_SOURCE_TYPES_STORAGE_KEY = '_x_extension_search_result_source_types_2026_unique_';
const SEARCH_SELECTION_STATS_STORAGE_KEY = '_x_extension_search_selection_stats_2026_unique_';
const FAVICON_VISIT_DIRTY_STORAGE_KEY = '_x_extension_favicon_visit_dirty_2026_unique_';
const FAVICON_VISIT_DIRTY_TTL_MS = 1000 * 60 * 60 * 24;
const FAVICON_VISIT_DIRTY_MAX_ENTRIES = 600;
const FAVICON_RESOLVE_STORAGE_KEY = '_x_extension_favicon_resolve_cache_2026_unique_';
const FAVICON_RESOLVE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const FAVICON_RESOLVE_MAX_ENTRIES = 800;
const PINNED_TAB_SNAPSHOT_STORAGE_KEY = '_x_extension_pinned_tab_snapshot_2026_unique_';
const REMOVED_AI_SYNC_STORAGE_KEYS = [
  '_x_extension_ai_search_mode_2026_unique_',
  '_x_extension_ai_provider_2026_unique_',
  '_x_extension_ai_entitlement_cache_2026_unique_'
];
const REMOVED_AI_LOCAL_STORAGE_KEYS = [
  '_x_extension_ai_api_key_2026_unique_'
];
const SHOW_SEARCH_COMMAND_NAME = 'show-search';
const SHOW_SEARCH_PREFILL_COMMAND_NAME = 'show-search-prefill';
const SHOW_SEARCH_PREFILL_V_COMMAND_NAME = 'show-search-prefill-v';
const HOTKEY_DUP_GUARD_MS = 180;
const PAGE_HOTKEY_NEWTAB_RECOVER_MS = 1200;
const TAB_SWITCH_WINDOW_SHORT_MS = 30 * 60 * 1000;
const TAB_SWITCH_WINDOW_DAY_MS = 24 * 60 * 60 * 1000;
const TAB_SWITCH_HIGH_FREQ_SHORT_THRESHOLD = 2;
const TAB_SWITCH_HIGH_FREQ_DAY_THRESHOLD = 5;
const TAB_SWITCH_EVENT_HISTORY_LIMIT = 60;
const TAB_SWITCH_STATS_STORAGE_KEY = '_x_extension_tab_switch_stats_2026_unique_';
const PINNED_TAB_SNAPSHOT_DEBOUNCE_MS = 600;
const PINNED_TAB_RESTORE_MAX_TABS = 24;
let restrictedActionCache = 'default';
let documentPipEnabledCache = false;
let pinnedTabRecoveryEnabledCache = false;
const hotkeyInvokeAtByTabId = new Map();
let lastPageHotkeyContext = null;
const tabSwitchEventsByTabId = new Map();
const tabLastAccessedByTabId = new Map();
let tabSwitchEventDebugTotal = 0;
let tabOverlayFetchSeq = 0;
let tabSwitchStatsLoaded = false;
let tabSwitchStatsLoadPromise = null;
let pinnedTabSnapshotTimer = null;
let pinnedTabRestoreAttempted = false;
const faviconVisitDirtyWriteDebounceMs = 400;
const faviconVisitDirtyMarkThrottleMs = 2 * 60 * 1000;
const faviconVisitDirtyMarkCache = new Map();
let faviconVisitDirtyPersistTimer = null;

function normalizeFaviconVisitDirtyHost(hostname) {
  if (!hostname) {
    return '';
  }
  return normalizeHost(String(hostname).trim());
}

function getFaviconVisitDirtyStorageArea() {
  if (!chrome || !chrome.storage || !chrome.storage.local) {
    return null;
  }
  return chrome.storage.local;
}

function getValidFaviconVisitDirtyEntries(rawEntries) {
  const now = Date.now();
  const input = rawEntries && typeof rawEntries === 'object' ? rawEntries : {};
  const valid = [];
  Object.keys(input).forEach((key) => {
    const updatedAt = Number(input[key] || 0);
    if (!key || !Number.isFinite(updatedAt)) {
      return;
    }
    if (now - updatedAt > FAVICON_VISIT_DIRTY_TTL_MS) {
      return;
    }
    valid.push({ key, updatedAt });
  });
  valid.sort((a, b) => b.updatedAt - a.updatedAt);
  return valid.slice(0, FAVICON_VISIT_DIRTY_MAX_ENTRIES);
}

function schedulePersistFaviconVisitDirtyHost(hostname) {
  const host = normalizeFaviconVisitDirtyHost(hostname);
  const storageArea = getFaviconVisitDirtyStorageArea();
  if (!host || !storageArea) {
    return;
  }
  const now = Date.now();
  const lastMarkedAt = Number(faviconVisitDirtyMarkCache.get(host) || 0);
  if (lastMarkedAt && (now - lastMarkedAt) < faviconVisitDirtyMarkThrottleMs) {
    return;
  }
  faviconVisitDirtyMarkCache.set(host, now);
  if (faviconVisitDirtyPersistTimer !== null) {
    clearTimeout(faviconVisitDirtyPersistTimer);
  }
  faviconVisitDirtyPersistTimer = setTimeout(() => {
    faviconVisitDirtyPersistTimer = null;
    storageArea.get([FAVICON_VISIT_DIRTY_STORAGE_KEY], (result) => {
      const payload = result && result[FAVICON_VISIT_DIRTY_STORAGE_KEY];
      const existing = getValidFaviconVisitDirtyEntries(payload && payload.entries ? payload.entries : null);
      const merged = new Map(existing.map((item) => [item.key, item.updatedAt]));
      faviconVisitDirtyMarkCache.forEach((updatedAt, key) => {
        merged.set(key, updatedAt);
      });
      const serializedEntries = Array.from(merged.entries())
        .map(([key, updatedAt]) => ({
          key: String(key || ''),
          updatedAt: Number(updatedAt || 0)
        }))
        .filter((item) => item.key && Number.isFinite(item.updatedAt))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, FAVICON_VISIT_DIRTY_MAX_ENTRIES);
      const serialized = {};
      serializedEntries.forEach((item) => {
        serialized[item.key] = item.updatedAt;
      });
      storageArea.set({
        [FAVICON_VISIT_DIRTY_STORAGE_KEY]: {
          version: 1,
          entries: serialized,
          updatedAt: Date.now()
        }
      }, () => {
        faviconVisitDirtyMarkCache.clear();
      });
    });
  }, faviconVisitDirtyWriteDebounceMs);
}

function markFaviconDirtyForUrl(url) {
  if (!url) {
    return;
  }
  let parsed = null;
  try {
    parsed = new URL(url);
  } catch (e) {
    return;
  }
  if (!/^https?:$/i.test(parsed.protocol)) {
    return;
  }
  const host = normalizeFaviconVisitDirtyHost(parsed.hostname);
  if (!host || shouldBlockFaviconForHost(host)) {
    return;
  }
  schedulePersistFaviconVisitDirtyHost(host);
}

function cleanupRemovedAiStorageKeys() {
  if (!chrome || !chrome.storage) {
    return;
  }
  const syncArea = chrome.storage.sync;
  const localArea = chrome.storage.local;
  if (syncArea && typeof syncArea.remove === 'function') {
    syncArea.remove(REMOVED_AI_SYNC_STORAGE_KEYS, () => {});
  }
  if (localArea && typeof localArea.remove === 'function') {
    localArea.remove(REMOVED_AI_LOCAL_STORAGE_KEYS, () => {});
  }
}

function getTabSwitchStorageArea() {
  if (!chrome || !chrome.storage) {
    return null;
  }
  if (chrome.storage.session) {
    return chrome.storage.session;
  }
  if (chrome.storage.local) {
    return chrome.storage.local;
  }
  return null;
}

function normalizeTabSwitchStatEntry(raw, now) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const minTs = now - TAB_SWITCH_WINDOW_DAY_MS;
  const rawEvents = Array.isArray(raw.events) ? raw.events : [];
  const events = rawEvents
    .map((item) => Number(item) || 0)
    .filter((item) => item >= minTs)
    .sort((a, b) => a - b)
    .slice(-TAB_SWITCH_EVENT_HISTORY_LIMIT);
  const lastSwitchAtRaw = Number(raw.lastSwitchAt) || 0;
  const lastSwitchAt = Math.max(lastSwitchAtRaw, events.length > 0 ? events[events.length - 1] : 0);
  if (events.length <= 0 && lastSwitchAt <= 0) {
    return null;
  }
  return {
    events: events,
    lastSwitchAt: lastSwitchAt
  };
}

function mergeTabSwitchStat(target, incoming, now) {
  const left = normalizeTabSwitchStatEntry(target, now) || { events: [], lastSwitchAt: 0 };
  const right = normalizeTabSwitchStatEntry(incoming, now) || { events: [], lastSwitchAt: 0 };
  const mergedEvents = left.events.concat(right.events)
    .filter((item) => typeof item === 'number' && item > 0)
    .sort((a, b) => a - b)
    .slice(-TAB_SWITCH_EVENT_HISTORY_LIMIT);
  const lastSwitchAt = Math.max(left.lastSwitchAt || 0, right.lastSwitchAt || 0, mergedEvents.length > 0 ? mergedEvents[mergedEvents.length - 1] : 0);
  if (mergedEvents.length <= 0 && lastSwitchAt <= 0) {
    return null;
  }
  return {
    events: mergedEvents,
    lastSwitchAt: lastSwitchAt
  };
}

function applyPersistedTabSwitchStats(payload) {
  const now = Date.now();
  if (!payload || typeof payload !== 'object') {
    return;
  }
  Object.keys(payload).forEach((tabIdKey) => {
    const tabId = Number.parseInt(tabIdKey, 10);
    if (!Number.isFinite(tabId)) {
      return;
    }
    const incoming = normalizeTabSwitchStatEntry(payload[tabIdKey], now);
    if (!incoming) {
      return;
    }
    const existing = tabSwitchEventsByTabId.get(tabId) || null;
    const merged = mergeTabSwitchStat(existing, incoming, now);
    if (merged) {
      tabSwitchEventsByTabId.set(tabId, merged);
    }
  });
}

function exportTabSwitchStatsSnapshot() {
  const now = Date.now();
  const out = {};
  tabSwitchEventsByTabId.forEach((stat, tabId) => {
    if (typeof tabId !== 'number') {
      return;
    }
    const normalized = normalizeTabSwitchStatEntry(stat, now);
    if (!normalized) {
      return;
    }
    out[String(tabId)] = normalized;
  });
  return out;
}

function persistTabSwitchStatsNow() {
  const area = getTabSwitchStorageArea();
  if (!area) {
    return Promise.resolve(false);
  }
  const snapshot = exportTabSwitchStatsSnapshot();
  return new Promise((resolve) => {
    area.set({ [TAB_SWITCH_STATS_STORAGE_KEY]: snapshot }, () => {
      resolve(!(chrome.runtime && chrome.runtime.lastError));
    });
  });
}

function ensureTabSwitchStatsLoaded() {
  if (tabSwitchStatsLoaded) {
    return Promise.resolve();
  }
  if (tabSwitchStatsLoadPromise) {
    return tabSwitchStatsLoadPromise;
  }
  const area = getTabSwitchStorageArea();
  if (!area) {
    tabSwitchStatsLoaded = true;
    return Promise.resolve();
  }
  tabSwitchStatsLoadPromise = new Promise((resolve) => {
    area.get([TAB_SWITCH_STATS_STORAGE_KEY], (result) => {
      const payload = result ? result[TAB_SWITCH_STATS_STORAGE_KEY] : null;
      applyPersistedTabSwitchStats(payload);
      tabSwitchStatsLoaded = true;
      tabSwitchStatsLoadPromise = null;
      resolve();
    });
  });
  return tabSwitchStatsLoadPromise;
}

function queryTabsForPinnedSnapshot(queryInfo) {
  return new Promise((resolve) => {
    if (!chrome || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
      resolve([]);
      return;
    }
    chrome.tabs.query(queryInfo || {}, (tabs) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve([]);
        return;
      }
      resolve(Array.isArray(tabs) ? tabs : []);
    });
  });
}

function getPinnedSnapshotFromStorage() {
  return new Promise((resolve) => {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      resolve(null);
      return;
    }
    chrome.storage.local.get([PINNED_TAB_SNAPSHOT_STORAGE_KEY], (result) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(result ? result[PINNED_TAB_SNAPSHOT_STORAGE_KEY] : null);
    });
  });
}

function setPinnedSnapshotToStorage(snapshot) {
  return new Promise((resolve) => {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      resolve(false);
      return;
    }
    chrome.storage.local.set({ [PINNED_TAB_SNAPSHOT_STORAGE_KEY]: snapshot }, () => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

function createPinnedTabForRestore(url, windowId) {
  return new Promise((resolve) => {
    if (!chrome || !chrome.tabs || typeof chrome.tabs.create !== 'function') {
      resolve(false);
      return;
    }
    const createWithWindow = (typeof windowId === 'number')
      ? { windowId, url, pinned: true, active: false }
      : { url, pinned: true, active: false };
    chrome.tabs.create(createWithWindow, () => {
      if (!(chrome.runtime && chrome.runtime.lastError)) {
        resolve(true);
        return;
      }
      if (typeof windowId !== 'number') {
        resolve(false);
        return;
      }
      chrome.tabs.create({ url, pinned: true, active: false }, () => {
        resolve(!(chrome.runtime && chrome.runtime.lastError));
      });
    });
  });
}

function getLastFocusedWindowIdForRestore() {
  return new Promise((resolve) => {
    if (!chrome || !chrome.windows || typeof chrome.windows.getLastFocused !== 'function') {
      resolve(null);
      return;
    }
    chrome.windows.getLastFocused({}, (windowInfo) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      const canUse = windowInfo &&
        typeof windowInfo.id === 'number' &&
        windowInfo.incognito !== true &&
        (!windowInfo.type || windowInfo.type === 'normal');
      resolve(canUse ? windowInfo.id : null);
    });
  });
}

function normalizePinnedTabSnapshot(rawValue) {
  const urls = [];
  if (Array.isArray(rawValue)) {
    rawValue.forEach((item) => {
      const url = String(item || '').trim();
      if (url && !isRestrictedUrl(url)) {
        urls.push(url);
      }
    });
    return urls.slice(0, PINNED_TAB_RESTORE_MAX_TABS);
  }
  if (!rawValue || typeof rawValue !== 'object' || !Array.isArray(rawValue.urls)) {
    return [];
  }
  rawValue.urls.forEach((item) => {
    const url = String(item || '').trim();
    if (url && !isRestrictedUrl(url)) {
      urls.push(url);
    }
  });
  return urls.slice(0, PINNED_TAB_RESTORE_MAX_TABS);
}

function countUrls(urls) {
  const map = new Map();
  urls.forEach((url) => {
    const current = map.get(url) || 0;
    map.set(url, current + 1);
  });
  return map;
}

async function persistPinnedTabSnapshotNow() {
  if (!pinnedTabRecoveryEnabledCache) {
    return;
  }
  const tabs = await queryTabsForPinnedSnapshot({ pinned: true });
  const urls = tabs
    .filter((tab) => tab && tab.incognito !== true)
    .sort((a, b) => {
      const winA = typeof a.windowId === 'number' ? a.windowId : 0;
      const winB = typeof b.windowId === 'number' ? b.windowId : 0;
      if (winA !== winB) {
        return winA - winB;
      }
      const indexA = typeof a.index === 'number' ? a.index : 0;
      const indexB = typeof b.index === 'number' ? b.index : 0;
      return indexA - indexB;
    })
    .map((tab) => getResolvedTabUrl(tab))
    .filter((url) => Boolean(url) && !isRestrictedUrl(url))
    .slice(0, PINNED_TAB_RESTORE_MAX_TABS);
  await setPinnedSnapshotToStorage({
    urls,
    capturedAt: Date.now()
  });
}

function schedulePersistPinnedTabSnapshot() {
  if (!pinnedTabRecoveryEnabledCache) {
    if (pinnedTabSnapshotTimer !== null) {
      clearTimeout(pinnedTabSnapshotTimer);
      pinnedTabSnapshotTimer = null;
    }
    return;
  }
  if (pinnedTabSnapshotTimer !== null) {
    clearTimeout(pinnedTabSnapshotTimer);
  }
  pinnedTabSnapshotTimer = setTimeout(() => {
    pinnedTabSnapshotTimer = null;
    persistPinnedTabSnapshotNow().catch(() => {});
  }, PINNED_TAB_SNAPSHOT_DEBOUNCE_MS);
}

async function restorePinnedTabsFromSnapshotOnStartup() {
  if (!pinnedTabRecoveryEnabledCache) {
    return;
  }
  if (pinnedTabRestoreAttempted) {
    return;
  }
  pinnedTabRestoreAttempted = true;
  const savedRaw = await getPinnedSnapshotFromStorage();
  const savedUrls = normalizePinnedTabSnapshot(savedRaw);
  if (!savedUrls.length) {
    return;
  }
  const currentTabs = await queryTabsForPinnedSnapshot({});
  const existingPinnedUrls = currentTabs
    .filter((tab) => tab && tab.pinned && tab.incognito !== true)
    .map((tab) => getResolvedTabUrl(tab))
    .filter((url) => Boolean(url) && !isRestrictedUrl(url));
  const required = countUrls(savedUrls);
  const existing = countUrls(existingPinnedUrls);
  const missingUrls = [];
  required.forEach((needCount, url) => {
    const existingCount = existing.get(url) || 0;
    for (let i = existingCount; i < needCount; i += 1) {
      missingUrls.push(url);
    }
  });
  if (!missingUrls.length) {
    return;
  }
  const targetWindowId = await getLastFocusedWindowIdForRestore();
  for (let i = 0; i < missingUrls.length && i < PINNED_TAB_RESTORE_MAX_TABS; i += 1) {
    await createPinnedTabForRestore(missingUrls[i], targetWindowId);
  }
  setTimeout(() => {
    schedulePersistPinnedTabSnapshot();
  }, 800);
}

function getTabSwitchStat(tabId, createIfMissing) {
  if (typeof tabId !== 'number') {
    return null;
  }
  const existing = tabSwitchEventsByTabId.get(tabId);
  if (existing || !createIfMissing) {
    return existing || null;
  }
  const created = {
    events: [],
    lastSwitchAt: 0
  };
  tabSwitchEventsByTabId.set(tabId, created);
  return created;
}

function pruneTabSwitchStat(stat, now) {
  if (!stat || !Array.isArray(stat.events)) {
    return;
  }
  const minTs = now - TAB_SWITCH_WINDOW_DAY_MS;
  stat.events = stat.events.filter((ts) => typeof ts === 'number' && ts >= minTs);
  if (stat.events.length > TAB_SWITCH_EVENT_HISTORY_LIMIT) {
    stat.events = stat.events.slice(-TAB_SWITCH_EVENT_HISTORY_LIMIT);
  }
}

function recordTabSwitchEvent(tabId, at) {
  const stat = getTabSwitchStat(tabId, true);
  if (!stat) {
    return;
  }
  const now = typeof at === 'number' ? at : Date.now();
  const lastRecordedAt = Number(stat.lastSwitchAt) || 0;
  if (lastRecordedAt > 0 && Math.abs(now - lastRecordedAt) < 450) {
    return;
  }
  stat.events.push(now);
  stat.lastSwitchAt = now;
  tabSwitchEventDebugTotal += 1;
  pruneTabSwitchStat(stat, now);
  persistTabSwitchStatsNow().catch(() => {});
}

function clearTabSwitchStat(tabId) {
  if (typeof tabId !== 'number') {
    return;
  }
  tabLastAccessedByTabId.delete(tabId);
  if (tabSwitchEventsByTabId.delete(tabId)) {
    persistTabSwitchStatsNow().catch(() => {});
  }
}

function syncTabSwitchStatsFromTabList(tabs) {
  const list = Array.isArray(tabs) ? tabs : [];
  const aliveIds = new Set();
  let mostRecentTabId = null;
  let mostRecentLastAccessed = 0;
  for (let i = 0; i < list.length; i += 1) {
    const tab = list[i];
    if (!tab || typeof tab.id !== 'number') {
      continue;
    }
    const tabId = tab.id;
    aliveIds.add(tabId);
    const lastAccessed = Number(tab.lastAccessed) || 0;
    if (lastAccessed <= 0) {
      continue;
    }
    if (lastAccessed > mostRecentLastAccessed) {
      mostRecentLastAccessed = lastAccessed;
      mostRecentTabId = tabId;
    }
    const previous = Number(tabLastAccessedByTabId.get(tabId)) || 0;
    tabLastAccessedByTabId.set(tabId, lastAccessed);
    if (previous > 0 && lastAccessed > previous + 250) {
      recordTabSwitchEvent(tabId, lastAccessed);
    }
  }
  const staleIds = [];
  tabLastAccessedByTabId.forEach((_, tabId) => {
    if (!aliveIds.has(tabId)) {
      staleIds.push(tabId);
    }
  });
  staleIds.forEach((tabId) => {
    tabLastAccessedByTabId.delete(tabId);
  });
  if (typeof mostRecentTabId === 'number' && mostRecentLastAccessed > 0) {
    const existing = getTabSwitchStat(mostRecentTabId, false);
    const lastRecordedAt = Number(existing && existing.lastSwitchAt) || 0;
    if (mostRecentLastAccessed > (lastRecordedAt + 250)) {
      recordTabSwitchEvent(mostRecentTabId, mostRecentLastAccessed);
    }
  }
}

function getTabSwitchRank(tab, now) {
  const safeNow = typeof now === 'number' ? now : Date.now();
  const stat = getTabSwitchStat(tab && typeof tab.id === 'number' ? tab.id : null, false);
  if (!stat) {
    return {
      score: 0,
      shortCount: 0,
      dayCount: 0,
      highFreq: false,
      hint: '',
      lastSwitchAt: 0
    };
  }
  pruneTabSwitchStat(stat, safeNow);
  const shortBoundary = safeNow - TAB_SWITCH_WINDOW_SHORT_MS;
  const dayBoundary = safeNow - TAB_SWITCH_WINDOW_DAY_MS;
  let shortCount = 0;
  let dayCount = 0;
  for (let i = 0; i < stat.events.length; i += 1) {
    const ts = Number(stat.events[i]) || 0;
    if (ts >= dayBoundary) {
      dayCount += 1;
    }
    if (ts >= shortBoundary) {
      shortCount += 1;
    }
  }
  const lastSwitchAt = Number(stat.lastSwitchAt) || 0;
  const minutesSinceSwitch = lastSwitchAt > 0 ? (safeNow - lastSwitchAt) / 60000 : 999999;
  const recencyBoost = Math.exp(-Math.max(0, minutesSinceSwitch) / 16);
  const score = (shortCount * 8) + (dayCount * 2.6) + (recencyBoost * 3.2);
  const highFreq = shortCount >= TAB_SWITCH_HIGH_FREQ_SHORT_THRESHOLD || dayCount >= TAB_SWITCH_HIGH_FREQ_DAY_THRESHOLD;
  const hint = highFreq
    ? (shortCount >= TAB_SWITCH_HIGH_FREQ_SHORT_THRESHOLD
      ? `近30分钟切换${shortCount}次`
      : `近24小时切换${dayCount}次`)
    : '';
  return {
    score: score,
    shortCount: shortCount,
    dayCount: dayCount,
    highFreq: highFreq,
    hint: hint,
    lastSwitchAt: lastSwitchAt
  };
}

function sortTabsForOverlay(tabs) {
  const list = Array.isArray(tabs) ? tabs.slice() : [];
  const now = Date.now();
  const sortAt = now;
  return list
    .map((tab, index) => {
      const rank = getTabSwitchRank(tab, now);
      const lastAccessed = Number(tab && tab.lastAccessed) || 0;
      const idleMinutes = lastAccessed > 0 ? (now - lastAccessed) / 60000 : 999999;
      const accessBoost = Math.exp(-Math.max(0, idleMinutes) / 30);
      return {
        tab: {
          ...tab,
          _xTabRankScore: rank.score,
          _xTabSwitchCount30m: rank.shortCount,
          _xTabSwitchCount24h: rank.dayCount,
          _xTabDebugEventTotal: tabSwitchEventDebugTotal,
          _xTabLastAccessedRaw: lastAccessed,
          _xTabSortAt: sortAt,
          _xTabRankHighFreq: rank.highFreq,
          _xTabRankHint: rank.hint
        },
        score: rank.score + accessBoost,
        lastAccessed: lastAccessed,
        index: index
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.lastAccessed !== a.lastAccessed) {
        return b.lastAccessed - a.lastAccessed;
      }
      return a.index - b.index;
    })
    .map((item) => item.tab);
}

if (storageArea) {
  storageArea.get([RESTRICTED_ACTION_STORAGE_KEY, DOCUMENT_PIP_ENABLED_STORAGE_KEY, PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY], (result) => {
    const stored = result[RESTRICTED_ACTION_STORAGE_KEY];
    const normalized = stored === 'none' ? 'none' : 'default';
    if (normalized !== stored) {
      storageArea.set({ [RESTRICTED_ACTION_STORAGE_KEY]: normalized });
    }
    restrictedActionCache = normalized;
    const documentPipStored = result[DOCUMENT_PIP_ENABLED_STORAGE_KEY];
    const normalizedDocumentPip = documentPipStored === true;
    if (documentPipStored !== normalizedDocumentPip) {
      storageArea.set({ [DOCUMENT_PIP_ENABLED_STORAGE_KEY]: normalizedDocumentPip });
    }
    documentPipEnabledCache = normalizedDocumentPip;
    const pinnedTabRecoveryStored = result[PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY];
    const normalizedPinnedTabRecovery = pinnedTabRecoveryStored === true;
    if (pinnedTabRecoveryStored !== normalizedPinnedTabRecovery) {
      storageArea.set({ [PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY]: normalizedPinnedTabRecovery });
    }
    pinnedTabRecoveryEnabledCache = normalizedPinnedTabRecovery;
    if (pinnedTabRecoveryEnabledCache) {
      schedulePersistPinnedTabSnapshot();
    }
  });
}

function migrateStorageIfNeeded(keys) {
  if (!storageArea || !chrome || !chrome.storage || !chrome.storage.local) {
    return;
  }
  if (storageArea === chrome.storage.local) {
    return;
  }
  chrome.storage.local.get(keys, (localResult) => {
    const hasLocal = keys.some((key) => typeof localResult[key] !== 'undefined');
    if (!hasLocal) {
      return;
    }
    storageArea.get(keys, (syncResult) => {
      const missingSyncValues = {};
      keys.forEach((key) => {
        if (typeof localResult[key] !== 'undefined' && typeof syncResult[key] === 'undefined') {
          missingSyncValues[key] = localResult[key];
        }
      });
      if (Object.keys(missingSyncValues).length === 0) {
        return;
      }
      storageArea.set(missingSyncValues);
    });
  });
}

function shouldIgnoreDuplicateHotkey(tabId) {
  if (typeof tabId !== 'number') {
    return false;
  }
  const now = Date.now();
  const lastAt = hotkeyInvokeAtByTabId.get(tabId) || 0;
  hotkeyInvokeAtByTabId.set(tabId, now);
  return (now - lastAt) <= HOTKEY_DUP_GUARD_MS;
}

function rememberPageHotkeyContext(tab) {
  if (!tab || typeof tab.id !== 'number' || typeof tab.windowId !== 'number') {
    lastPageHotkeyContext = null;
    return;
  }
  lastPageHotkeyContext = {
    at: Date.now(),
    tabId: tab.id,
    windowId: tab.windowId
  };
}

function getRecentPageHotkeyContext(windowId) {
  if (!lastPageHotkeyContext) {
    return null;
  }
  const age = Date.now() - Number(lastPageHotkeyContext.at || 0);
  if (age > PAGE_HOTKEY_NEWTAB_RECOVER_MS) {
    lastPageHotkeyContext = null;
    return null;
  }
  if (typeof windowId === 'number' && lastPageHotkeyContext.windowId !== windowId) {
    return null;
  }
  return lastPageHotkeyContext;
}

function clearRecentPageHotkeyContext() {
  lastPageHotkeyContext = null;
}

function buildPrefillQueryForCurrentPage(tab) {
  return getResolvedTabUrl(tab);
}

function getOverlayPrefillQueryForSource(tab, source) {
  if (source !== 'page-hotkey-prefill' && source !== 'commands-prefill') {
    return '';
  }
  return buildPrefillQueryForCurrentPage(tab);
}

function recoverFromPageHotkeyNewtab(newTabId, windowId) {
  const recentContext = getRecentPageHotkeyContext(windowId);
  if (!recentContext || typeof newTabId !== 'number') {
    return;
  }
  chrome.tabs.query({ windowId: recentContext.windowId }, (tabs) => {
    const tabList = Array.isArray(tabs) ? tabs : [];
    const newTab = tabList.find((item) => item && item.id === newTabId) || null;
    const sourceTab = tabList.find((item) => item && item.id === recentContext.tabId) || null;
    const newTabUrl = getResolvedTabUrl(newTab);
    if (!newTab || (!isLumnoNewtabUrl(newTabUrl) && !isBrowserNewtabUrl(newTabUrl))) {
      return;
    }
    if (!sourceTab || !canOpenOverlayOnUrl(getResolvedTabUrl(sourceTab))) {
      clearRecentPageHotkeyContext();
      return;
    }
    clearRecentPageHotkeyContext();
    logHotkeyDebug('page-hotkey-newtab-recover-start', {
      windowId: recentContext.windowId,
      sourceTabId: sourceTab.id,
      newTabId: newTab.id,
      sourceUrl: getResolvedTabUrl(sourceTab),
      newTabUrl: newTabUrl
    });
    chrome.tabs.update(sourceTab.id, { active: true }, () => {
      if (chrome.runtime && chrome.runtime.lastError) {
        logHotkeyDebug('page-hotkey-newtab-recover-failed', {
          step: 'activate-source',
          sourceTabId: sourceTab.id,
          error: chrome.runtime.lastError.message || 'unknown'
        });
        return;
      }
      chrome.tabs.remove(newTab.id, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          logHotkeyDebug('page-hotkey-newtab-close-failed', {
            newTabId: newTab.id,
            error: chrome.runtime.lastError.message || 'unknown'
          });
        }
      });
    });
  });
}

function openOverlayOnTab(activeTab, tabs, source) {
  if (!activeTab || typeof activeTab.id !== 'number') {
    logHotkeyDebug('no-active-tab', { source: source || '' });
    openNewtabFallback();
    return;
  }
  if (shouldIgnoreDuplicateHotkey(activeTab.id)) {
    logHotkeyDebug('duplicate-ignored', { tabId: activeTab.id, source: source || '' });
    return;
  }
  const activeUrl = getResolvedTabUrl(activeTab);
  const rawUrl = typeof activeTab.url === 'string' ? activeTab.url : '';
  const rawPendingUrl = typeof activeTab.pendingUrl === 'string' ? activeTab.pendingUrl : '';
  const restricted = !canOpenOverlayOnUrl(activeUrl);
  logHotkeyDebug('active-tab', {
    tabId: activeTab.id,
    resolvedUrl: activeUrl,
    tabUrl: rawUrl,
    pendingUrl: rawPendingUrl,
    url: activeUrl,
    restricted: restricted,
    source: source || ''
  });
  if (restricted) {
    if (isSearchCommandSource(source) && (isLumnoNewtabUrl(activeUrl) || isBrowserNewtabUrl(activeUrl))) {
      requestFocusVisibleNewtabInput(source, activeTab.id);
      return;
    }
    if (recoverOverlayTargetFromCommandNewtab(activeTab, tabs, source)) {
      return;
    }
    const action = restrictedActionCache || 'default';
    logHotkeyDebug('restricted-url', {
      action: action,
      url: activeUrl,
      source: source || ''
    });
    if (action === 'none') {
      logHotkeyDebug('suppressed', { reason: 'restricted_action_none', source: source || '' });
      return;
    }
    if (action === 'default') {
      logHotkeyDebug('fallback-open-create-newtab', { reason: 'restricted_url', source: source || '' });
      openNewtabFallbackForUrl(activeUrl);
      return;
    }
    logHotkeyDebug('fallback-open-lumno-newtab', { reason: 'restricted_url', source: source || '' });
    openNewtabFallbackForUrl(activeUrl);
    return;
  }
  const overlayInjectionFiles = [
    'src/shared/settings.js',
    'src/shared/search-utils.js',
    'src/shared/site-search-store.js',
    'src/shared/suggestion-action-model.js',
    'src/shared/suggestion-navigation.js',
    'src/shared/search-input-ui.js',
    'src/shared/search-input-mode.js',
    'src/shared/tooltip.js',
    'src/overlay/runtime.js',
    'src/shared/favicon-utils.js',
    'src/shared/favicon-cache.js',
    'src/shared/favicon-view-core.js',
    'src/overlay/favicon-view.js',
    'src/overlay/shell.js',
    'src/overlay/lifecycle.js',
    'src/overlay/site-fixes.js',
    'src/overlay/search-panel.js'
  ];
  logHotkeyDebug('inject-start', { tabId: activeTab.id, file: overlayInjectionFiles.join(','), source: source || '' });
  chrome.scripting.executeScript({
    target: {tabId: activeTab.id},
    files: overlayInjectionFiles
  }, function() {
    if (chrome.runtime.lastError) {
      logHotkeyDebug('inject-failed', {
        step: overlayInjectionFiles.join(','),
        tabId: activeTab.id,
        error: chrome.runtime.lastError.message || 'unknown',
        source: source || ''
      });
      openNewtabFallbackForUrl(activeUrl);
      return;
    }
    const runOverlayScript = (tabZoomFactor) => {
      const prefillQuery = getOverlayPrefillQueryForSource(activeTab, source);
      const prioritizeCurrentPageMatch = source === 'page-hotkey-prefill';
      loadSiteSearchProviders()
        .catch(() => [])
        .then((siteSearchProviders) => {
          chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: (overlayTabs, overlayPanelContext) => {
              const toggleOverlay = window._x_extension_toggleSearchOverlay_2026_unique_;
              if (typeof toggleOverlay !== 'function') {
                console.warn('Lumno: overlay search panel helper not available.');
                return { ok: false, reason: 'search_panel_missing' };
              }
              toggleOverlay(overlayTabs, overlayPanelContext);
              return { ok: true };
            },
            args: [tabs, {
              tabZoomFactor: tabZoomFactor,
              prefillQuery: prefillQuery,
              prioritizeCurrentPageMatch: prioritizeCurrentPageMatch,
              currentTabId: typeof activeTab.id === 'number' ? activeTab.id : null,
              currentTabUrl: getResolvedTabUrl(activeTab),
              siteSearchProviders: Array.isArray(siteSearchProviders) ? siteSearchProviders : []
            }]
          }, function(results) {
            if (chrome.runtime.lastError) {
              logHotkeyDebug('inject-failed', {
                step: 'src/overlay/search-panel.js',
                tabId: activeTab.id,
                error: chrome.runtime.lastError.message || 'unknown',
                source: source || ''
              });
              openNewtabFallback();
              return;
            }
            const result = Array.isArray(results) && results[0] ? results[0].result : null;
            if (result && result.ok === false) {
              logHotkeyDebug('inject-failed', {
                step: 'src/overlay/search-panel.js',
                tabId: activeTab.id,
                error: result.reason || 'unknown',
                source: source || ''
              });
              openNewtabFallback();
              return;
            }
            logHotkeyDebug('overlay-opened', {
              tabId: activeTab.id,
              tabCount: Array.isArray(tabs) ? tabs.length : 0,
              source: source || '',
              tabZoomFactor: tabZoomFactor,
              siteSearchProviderCount: Array.isArray(siteSearchProviders) ? siteSearchProviders.length : 0
            });
          });
        });
    };
    if (chrome.tabs && typeof chrome.tabs.getZoom === 'function') {
      chrome.tabs.getZoom(activeTab.id, (zoomFactor) => {
        const zoom = Number.isFinite(Number(zoomFactor)) && Number(zoomFactor) > 0
          ? Number(zoomFactor)
          : 1;
        runOverlayScript(zoom);
      });
      return;
    }
    runOverlayScript(1);
  });
}

function triggerShowSearchForTab(tab, source) {
  if (!tab || typeof tab.id !== 'number') {
    logHotkeyDebug('no-active-tab', { source: source || '' });
    openNewtabFallback();
    return;
  }
  const windowQuery = (typeof tab.windowId === 'number')
    ? { windowId: tab.windowId }
    : { currentWindow: true };
  chrome.tabs.query(windowQuery, (tabs) => {
    const tabList = Array.isArray(tabs) ? tabs : [];
    const resolvedTab = tabList.find((item) => item && item.id === tab.id) || tab;
    openOverlayOnTab(resolvedTab, tabList, source);
  });
}

function detectAnyActiveVideoPiP(callback) {
  chrome.tabs.query({}, (tabs) => {
    const tabList = Array.isArray(tabs) ? tabs : [];
    const candidates = tabList.filter((tab) => {
      if (!tab || typeof tab.id !== 'number') {
        return false;
      }
      const tabUrl = getResolvedTabUrl(tab);
      if (isRestrictedUrl(tabUrl)) {
        return false;
      }
      return true;
    });
    if (!candidates.length) {
      callback(false, { checked: 0, foundTabId: null });
      return;
    }
    let pending = candidates.length;
    let finished = false;
    let checked = 0;
    const done = (active, tabId) => {
      if (finished) {
        return;
      }
      finished = true;
      callback(Boolean(active), {
        checked: checked,
        foundTabId: typeof tabId === 'number' ? tabId : null
      });
    };
    candidates.forEach((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: () => {
          const pipElement = document.pictureInPictureElement;
          return {
            hasPiP: Boolean(pipElement),
            isVideoPiP: Boolean(pipElement && pipElement.tagName === 'VIDEO')
          };
        }
      }, (results) => {
        checked += 1;
        pending -= 1;
        if (finished) {
          return;
        }
        if (!chrome.runtime.lastError) {
          const payload = Array.isArray(results) && results[0] ? results[0].result : null;
          if (payload && payload.hasPiP && payload.isVideoPiP) {
            done(true, tab.id);
            return;
          }
        }
        if (pending <= 0) {
          done(false, null);
        }
      });
    });
  });
}

function openDocumentPipPickerOnTab(activeTab, source) {
  if (!documentPipEnabledCache) {
    logHotkeyDebug('document-pip-disabled', { source: source || '' });
    openExtensionOptionsPage();
    return;
  }
  if (!activeTab || typeof activeTab.id !== 'number') {
    logHotkeyDebug('document-pip-no-active-tab', { source: source || '' });
    openExtensionOptionsPage();
    return;
  }
  const activeUrl = getResolvedTabUrl(activeTab);
  const restricted = isRestrictedUrl(activeUrl);
  logHotkeyDebug('document-pip-active-tab', {
    tabId: activeTab.id,
    url: activeUrl,
    restricted: restricted,
    source: source || ''
  });
  if (restricted) {
    logHotkeyDebug('document-pip-restricted-url', {
      tabId: activeTab.id,
      url: activeUrl,
      source: source || ''
    });
    openExtensionOptionsPage();
    return;
  }
  const injectAndInvoke = (invokeMode) => {
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ['src/content/document-pip-picker.js']
    }, () => {
      if (chrome.runtime.lastError) {
        logHotkeyDebug('document-pip-inject-failed', {
          step: 'src/content/document-pip-picker.js',
          tabId: activeTab.id,
          error: chrome.runtime.lastError.message || 'unknown',
          source: source || ''
        });
        openExtensionOptionsPage();
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: (mode) => {
          const controller = window.__lumnoDocumentPiPPicker2026;
          if (!controller || typeof controller.toggle !== 'function') {
            return { ok: false, reason: 'picker-missing' };
          }
          if (mode === 'conflict-toast') {
            if (typeof controller.notifyVideoPiPConflict === 'function') {
              return controller.notifyVideoPiPConflict();
            }
            return { ok: false, reason: 'picker-conflict-handler-missing' };
          }
          return controller.toggle();
        },
        args: [invokeMode]
      }, (results) => {
        if (chrome.runtime.lastError) {
          logHotkeyDebug('document-pip-toggle-failed', {
            step: 'toggle',
            tabId: activeTab.id,
            error: chrome.runtime.lastError.message || 'unknown',
            source: source || '',
            mode: invokeMode || 'toggle'
          });
          return;
        }
        const result = Array.isArray(results) && results[0] ? results[0].result : null;
        logHotkeyDebug('document-pip-toggle', {
          tabId: activeTab.id,
          source: source || '',
          mode: invokeMode || 'toggle',
          result: result && typeof result === 'object' ? result : {}
        });
      });
    });
  };

  detectAnyActiveVideoPiP((hasActiveVideoPiP, detail) => {
    if (hasActiveVideoPiP) {
      logHotkeyDebug('document-pip-blocked-by-active-video-pip', {
        tabId: activeTab.id,
        source: source || '',
        checkedTabs: detail && typeof detail.checked === 'number' ? detail.checked : 0,
        pipTabId: detail && typeof detail.foundTabId === 'number' ? detail.foundTabId : null
      });
      injectAndInvoke('conflict-toast');
      return;
    }
    injectAndInvoke('toggle');
  });
}

function getDefaultFallbackShortcutByPlatform(platformOs) {
  return platformOs === 'mac' ? 'Command+Shift+K' : 'Ctrl+Shift+K';
}

function getDefaultFallbackShortcut(callback) {
  if (!chrome || !chrome.runtime || typeof chrome.runtime.getPlatformInfo !== 'function') {
    callback('Ctrl+Shift+K');
    return;
  }
  chrome.runtime.getPlatformInfo((info) => {
    const os = info && typeof info.os === 'string' ? info.os : '';
    callback(getDefaultFallbackShortcutByPlatform(os));
  });
}

function getConfiguredFallbackShortcut(callback) {
  getDefaultFallbackShortcut((defaultShortcut) => {
    if (!chrome || !chrome.commands || typeof chrome.commands.getAll !== 'function') {
      callback(defaultShortcut);
      return;
    }
    chrome.commands.getAll((commands) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        callback(defaultShortcut);
        return;
      }
      const items = Array.isArray(commands) ? commands : [];
      const command = items.find((item) => item && item.name === SHOW_SEARCH_COMMAND_NAME);
      const shortcut = command && typeof command.shortcut === 'string'
        ? normalizeShortcutFromCommandsValue(command.shortcut)
        : '';
      callback(shortcut || defaultShortcut);
    });
  });
}

function normalizeShortcutFromCommandsValue(value) {
  const text = String(value || '').trim();
  if (!text || text.includes('%')) {
    return '';
  }
  const parts = text.split('+').map((item) => String(item || '').trim()).filter(Boolean);
  if (parts.length < 2) {
    return '';
  }
  const keyToken = parts[parts.length - 1];
  if (!/^[A-Za-z0-9]$/.test(keyToken) && !/^F\d{1,2}$/i.test(keyToken)) {
    const specialKeys = new Set([
      'Tab', 'Enter', 'Return', 'Escape', 'Esc', 'Space', 'Spacebar',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      ',', '.', '/', ';', '\'', '-', '+', '\\', '`', '[', ']'
    ]);
    if (!specialKeys.has(keyToken)) {
      return '';
    }
  }
  let hasModifier = false;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const token = parts[i].toLowerCase();
    const isModifier =
      token === 'ctrl' ||
      token === 'control' ||
      token === 'macctrl' ||
      token === 'alt' ||
      token === 'option' ||
      token === 'shift' ||
      token === 'command' ||
      token === 'cmd' ||
      token === 'meta' ||
      token === 'super';
    if (!isModifier) {
      return '';
    }
    hasModifier = true;
  }
  return hasModifier ? text : '';
}

function getConfiguredCopyUrlCommandShortcut(callback) {
  if (!chrome || !chrome.commands || typeof chrome.commands.getAll !== 'function') {
    callback('');
    return;
  }
  chrome.commands.getAll((commands) => {
    if (chrome.runtime && chrome.runtime.lastError) {
      callback('');
      return;
    }
    const items = Array.isArray(commands) ? commands : [];
    const command = items.find((item) => item && item.name === SHOW_SEARCH_PREFILL_V_COMMAND_NAME);
    const shortcut = command && typeof command.shortcut === 'string'
      ? normalizeShortcutFromCommandsValue(command.shortcut)
      : '';
    callback(shortcut || '');
  });
}

function triggerCopyCurrentUrlForTab(activeTab, source) {
  if (!activeTab || typeof activeTab.id !== 'number') {
    logHotkeyDebug('copy-url-no-active-tab', { source: source || '' });
    return;
  }
  chrome.tabs.sendMessage(activeTab.id, { action: 'copyCurrentPageUrlFromCommand' }, (response) => {
    if (chrome.runtime && chrome.runtime.lastError) {
      logHotkeyDebug('copy-url-send-message-failed', {
        tabId: activeTab.id,
        source: source || '',
        error: chrome.runtime.lastError.message || 'unknown'
      });
      return;
    }
    logHotkeyDebug('copy-url-triggered', {
      tabId: activeTab.id,
      source: source || '',
      ok: Boolean(response && response.ok)
    });
  });
}

chrome.commands.onCommand.addListener(function(command) {
  if (
    command !== SHOW_SEARCH_COMMAND_NAME &&
    command !== SHOW_SEARCH_PREFILL_COMMAND_NAME &&
    command !== SHOW_SEARCH_PREFILL_V_COMMAND_NAME
  ) {
    return;
  }
  const source = command === SHOW_SEARCH_COMMAND_NAME
    ? 'commands'
    : (command === SHOW_SEARCH_PREFILL_COMMAND_NAME ? 'commands-prefill' : 'commands-copy-url');
  logHotkeyDebug('received', { command: command, source: source });
  chrome.tabs.query({active: true, currentWindow: true}, function(activeTabs) {
    if (command === SHOW_SEARCH_PREFILL_V_COMMAND_NAME) {
      triggerCopyCurrentUrlForTab(activeTabs[0], source);
      return;
    }
    triggerShowSearchForTab(activeTabs[0], source);
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  const recentContext = getRecentPageHotkeyContext(tab && typeof tab.windowId === 'number' ? tab.windowId : null);
  if (!recentContext || !tab || typeof tab.id !== 'number') {
    schedulePersistPinnedTabSnapshot();
    return;
  }
  setTimeout(() => {
    recoverFromPageHotkeyNewtab(tab.id, recentContext.windowId);
  }, 120);
  schedulePersistPinnedTabSnapshot();
});

chrome.runtime.onInstalled.addListener((details) => {
  if (!details) {
    schedulePersistPinnedTabSnapshot();
    return;
  }
  const reason = String(details.reason || '');
  if (reason === 'install') {
    openOnboardingPage({ reason: 'install' });
    schedulePersistPinnedTabSnapshot();
    return;
  }
  if (reason === 'update') {
    openReleasePage({ reason: 'update', oncePerVersion: true });
  }
  schedulePersistPinnedTabSnapshot();
});

if (chrome && chrome.runtime && chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    restorePinnedTabsFromSnapshotOnStartup().catch(() => {});
    schedulePersistPinnedTabSnapshot();
  });
}
schedulePersistPinnedTabSnapshot();
ensureTabSwitchStatsLoaded().catch(() => {});
cleanupRemovedAiStorageKeys();

if (chrome.action && chrome.action.onClicked) {
  chrome.action.onClicked.addListener((tab) => {
    openDocumentPipPickerOnTab(tab, 'action');
  });
}

if (chrome && chrome.tabs && chrome.tabs.onActivated) {
  chrome.tabs.onActivated.addListener((activeInfo) => {
    if (!activeInfo || typeof activeInfo.tabId !== 'number') {
      return;
    }
    recordTabSwitchEvent(activeInfo.tabId);
  });
}

if (chrome && chrome.tabs && chrome.tabs.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => {
    clearTabSwitchStat(tabId);
    schedulePersistPinnedTabSnapshot();
    clearGlobalPipOwnerForTabId(tabId);
  });
}

if (chrome && chrome.tabs && chrome.tabs.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!changeInfo) {
      return;
    }
    if (typeof changeInfo.url === 'string') {
      // URL changed means the tab semantic target changed; reset historical switch stats.
      clearTabSwitchStat(tabId);
      clearGlobalPipOwnerForTabId(tabId);
    }
    if (changeInfo.pinned !== undefined || typeof changeInfo.url === 'string' || changeInfo.status === 'complete') {
      schedulePersistPinnedTabSnapshot();
    }
    if (typeof changeInfo.favIconUrl === 'string' && changeInfo.favIconUrl) {
      const completedUrl = typeof changeInfo.url === 'string'
        ? changeInfo.url
        : (tab && typeof tab.url === 'string' ? tab.url : '');
      markFaviconDirtyForUrl(completedUrl);
    } else if (changeInfo.status === 'complete' && !(tab && tab.favIconUrl)) {
      const completedUrl = typeof changeInfo.url === 'string'
        ? changeInfo.url
        : (tab && typeof tab.url === 'string' ? tab.url : '');
      markFaviconDirtyForUrl(completedUrl);
    }
  });
}

if (chrome && chrome.tabs && chrome.tabs.onMoved) {
  chrome.tabs.onMoved.addListener(() => {
    schedulePersistPinnedTabSnapshot();
  });
}

function waitForTabComplete(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = null;
    const finish = (tab, error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      if (error) {
        reject(error);
        return;
      }
      resolve(tab || null);
    };
    const handleUpdated = (updatedTabId, changeInfo, tab) => {
      if (updatedTabId !== tabId) {
        return;
      }
      if (changeInfo && changeInfo.status === 'complete') {
        finish(tab || null);
      }
    };
    chrome.tabs.onUpdated.addListener(handleUpdated);
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        finish(null, new Error(chrome.runtime.lastError.message || 'tab-unavailable'));
        return;
      }
      if (tab && tab.status === 'complete') {
        finish(tab);
      }
    });
    timeoutId = setTimeout(() => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          finish(null, new Error(chrome.runtime.lastError.message || 'tab-unavailable'));
          return;
        }
        finish(tab || null);
      });
    }, Math.max(1000, Number(timeoutMs) || 15000));
  });
}

function runInteractiveSiteSearchProvider(provider, query, sender, disposition) {
  const prompt = String(query || '').trim();
  const entryUrl = getSiteSearchProviderEntryUrl(provider, prompt);
  const submitStrategy = String((provider && provider.submitStrategy) || '').trim();
  const targetDisposition = disposition === 'currentTab' ? 'currentTab' : 'newTab';
  return new Promise((resolve) => {
    if (!entryUrl || !prompt || !isInteractiveSiteSearchProvider(provider)) {
      resolve({ ok: false, reason: 'invalid-provider-request' });
      return;
    }
    if (typeof AI_PROVIDER_SUBMIT.submitPromptInTab !== 'function') {
      resolve({ ok: false, reason: 'submit-runtime-unavailable' });
      return;
    }
    const finish = (result) => {
      resolve(result && typeof result === 'object' ? result : { ok: false, reason: 'unknown' });
    };
    const handleReadyTab = (tab) => {
      if (!tab || typeof tab.id !== 'number') {
        finish({ ok: false, reason: 'tab-unavailable' });
        return;
      }
      waitForTabComplete(tab.id, 15000)
        .catch(() => tab)
        .then(() => AI_PROVIDER_SUBMIT.submitPromptInTab(chrome, tab.id, prompt, submitStrategy))
        .then((result) => {
          finish({
            ok: Boolean(result && result.ok),
            tabId: tab.id,
            url: entryUrl,
            strategy: submitStrategy,
            method: result && result.method ? result.method : '',
            reason: result && result.reason ? result.reason : ''
          });
        })
        .catch((error) => {
          finish({
            ok: false,
            tabId: tab.id,
            url: entryUrl,
            reason: error && error.message ? error.message : 'interactive-site-search-failed'
          });
        });
    };
    const updateTab = (tabId) => {
      chrome.tabs.update(tabId, { url: entryUrl, active: true }, (tab) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          finish({ ok: false, reason: chrome.runtime.lastError.message || 'tab-update-failed' });
          return;
        }
        handleReadyTab(tab);
      });
    };
    if (targetDisposition === 'currentTab') {
      if (sender && sender.tab && typeof sender.tab.id === 'number') {
        updateTab(sender.tab.id);
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          finish({ ok: false, reason: chrome.runtime.lastError.message || 'active-tab-unavailable' });
          return;
        }
        const activeTab = Array.isArray(tabs) && tabs.length > 0 ? tabs[0] : null;
        if (activeTab && typeof activeTab.id === 'number') {
          updateTab(activeTab.id);
          return;
        }
        finish({ ok: false, reason: 'active-tab-unavailable' });
      });
      return;
    }
    chrome.tabs.create({ url: entryUrl, active: true }, (tab) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        finish({ ok: false, reason: chrome.runtime.lastError.message || 'tab-create-failed' });
        return;
      }
      handleReadyTab(tab);
    });
  });
}

// Route message actions by feature area before invoking the original handlers.
const BACKGROUND_MESSAGE_ROUTE_GROUPS = Object.freeze({
  tabs: {
    actions: [
      'switchToTab',
      'reportTabVisible',
      'getTabsForOverlay',
      'trackSearchTab',
      'closeOtherTabsForOverlay'
    ],
    handler: handleTabMessage
  },
  shortcuts: {
    actions: [
      'getShowSearchShortcut',
      'getCopyCurrentUrlCommandShortcut',
      'triggerShowSearchFromPageHotkey',
      'getShortcutRules'
    ],
    handler: handleShortcutMessage
  },
  pip: {
    actions: [
      'pipRequestOwnership',
      'pipReleaseOwnership',
      'siteTryEnterPiPInMainWorld',
      'iqiyiTryEnterPiPInMainWorld',
      'iqiyiSetupAutoPiPInMainWorld',
      'forceExitPiPInMainWorld',
      'ytForceExitPiPInMainWorld'
    ],
    handler: handlePipMessage
  },
  search: {
    actions: [
      'searchOrNavigate',
      'getSearchSuggestions',
      'recordSearchSuggestionSelection',
      'deleteHistoryUrl'
    ],
    handler: handleSearchMessage
  },
  siteSearch: {
    actions: [
      'getSiteSearchProviders',
      'runSiteSearchProviderQuery'
    ],
    handler: handleSiteSearchMessage
  },
  localeAndPermissions: {
    actions: [
      'getLocaleMessages',
      'getFileSchemeAccessStatus'
    ],
    handler: handleLocaleAndPermissionMessage
  },
  extensionPages: {
    actions: [
      'openOptionsPage',
      'openOnboardingPage',
      'openExtensionShortcutsPage',
      'openBookmarkManager',
      'createTab',
      'openNewTab',
      'openExtensionDetailsPage'
    ],
    handler: handleExtensionPageMessage
  },
  favicon: {
    actions: [
      'resolveFaviconCandidates',
      'getFaviconData',
      'resolveSiteThemeColor'
    ],
    handler: handleFaviconMessage
  }
});

const backgroundMessageRouter = typeof BACKGROUND_MESSAGE_ROUTER.createRouter === 'function'
  ? BACKGROUND_MESSAGE_ROUTER.createRouter(BACKGROUND_MESSAGE_ROUTE_GROUPS)
  : null;

function sendUnknownBackgroundMessageResponse(sendResponse) {
  sendResponse({ ok: false });
  return;
}

function dispatchBackgroundMessage(request, sender, sendResponse) {
  if (backgroundMessageRouter && typeof BACKGROUND_MESSAGE_ROUTER.dispatch === 'function') {
    return BACKGROUND_MESSAGE_ROUTER.dispatch(backgroundMessageRouter, request, sender, sendResponse);
  }
  return sendUnknownBackgroundMessageResponse(sendResponse);
}

// Listen for extension runtime messages.
chrome.runtime.onMessage.addListener(dispatchBackgroundMessage);

function handleTabMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'switchToTab': {
      if (typeof request.tabId === 'number') {
        recordTabSwitchEvent(request.tabId);
      }
      chrome.tabs.update(request.tabId, {active: true});
      sendResponse({ ok: true });
      return;
    }
    case 'reportTabVisible': {
      const senderTab = sender && sender.tab ? sender.tab : null;
      if (senderTab && typeof senderTab.id === 'number') {
        const at = Number(request && request.at);
        recordTabSwitchEvent(senderTab.id, Number.isFinite(at) ? at : Date.now());
      }
      sendResponse({ ok: true });
      return;
    }
    case 'getTabsForOverlay': {
      ensureTabSwitchStatsLoaded()
        .catch(() => {})
        .finally(() => {
          const currentTabId = sender && sender.tab && typeof sender.tab.id === 'number'
            ? sender.tab.id
            : null;
          chrome.tabs.query({}, (tabs) => {
            const normalizedTabs = (Array.isArray(tabs) ? tabs : [])
              .map((tab) => {
                const resolvedUrl = getResolvedTabUrl(tab);
                return {
                  ...tab,
                  url: resolvedUrl || ''
                };
              })
              .filter((tab) => (
                tab &&
                tab.incognito !== true
              ));
            syncTabSwitchStatsFromTabList(normalizedTabs);
            const sortedTabs = sortTabsForOverlay(normalizedTabs);
            tabOverlayFetchSeq += 1;
            const withSeq = sortedTabs.map((tab) => ({
              ...tab,
              _xTabFetchSeq: tabOverlayFetchSeq
            }));
            sendResponse({ tabs: withSeq, currentTabId: currentTabId });
          });
        });
      return true;
    }
    case 'trackSearchTab': {
      if (typeof request.tabId === 'number') {
        markPendingSearchTab(request.tabId);
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false });
      }
      return true;
    }
    case 'closeOtherTabsForOverlay': {
      const senderTab = sender && sender.tab ? sender.tab : null;
      if (!senderTab || typeof senderTab.id !== 'number' || typeof senderTab.windowId !== 'number') {
        sendResponse({ ok: false, reason: 'invalid-sender' });
        return;
      }
      chrome.tabs.query({ windowId: senderTab.windowId }, (tabs) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          sendResponse({ ok: false, reason: chrome.runtime.lastError.message || 'query-failed' });
          return;
        }
        const ungroupedId = chrome && chrome.tabGroups && typeof chrome.tabGroups.TAB_GROUP_ID_NONE === 'number'
          ? chrome.tabGroups.TAB_GROUP_ID_NONE
          : -1;
        const toCloseIds = (Array.isArray(tabs) ? tabs : [])
          .filter((tab) => {
            if (!tab || typeof tab.id !== 'number') {
              return false;
            }
            if (tab.id === senderTab.id) {
              return false;
            }
            if (tab.pinned) {
              return false;
            }
            if (typeof tab.groupId === 'number' && tab.groupId !== ungroupedId) {
              return false;
            }
            return true;
          })
          .map((tab) => tab.id);
        if (toCloseIds.length <= 0) {
          sendResponse({ ok: true, closedCount: 0 });
          return;
        }
        chrome.tabs.remove(toCloseIds, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            sendResponse({ ok: false, reason: chrome.runtime.lastError.message || 'remove-failed' });
            return;
          }
          sendResponse({ ok: true, closedCount: toCloseIds.length });
        });
      });
      return true;
    }
    default:
      return sendUnknownBackgroundMessageResponse(sendResponse);
  }
}

function handleShortcutMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'getShowSearchShortcut': {
      getConfiguredFallbackShortcut((shortcut) => {
        sendResponse({ shortcut: shortcut || '' });
      });
      return true;
    }
    case 'getCopyCurrentUrlCommandShortcut': {
      getConfiguredCopyUrlCommandShortcut((shortcut) => {
        sendResponse({ shortcut: shortcut || '' });
      });
      return true;
    }
    case 'triggerShowSearchFromPageHotkey': {
      const senderTab = sender && sender.tab ? sender.tab : null;
      if (!senderTab || typeof senderTab.id !== 'number') {
        logHotkeyDebug('page-hotkey-invalid-sender', {
          hasSender: Boolean(sender),
          hasTab: Boolean(sender && sender.tab)
        });
        sendResponse({ ok: false });
        return;
      }
      const shouldPrefillCurrentUrl = Boolean(request && request.prefillCurrentUrl);
      const triggerSource = shouldPrefillCurrentUrl ? 'page-hotkey-prefill' : 'page-hotkey';
      logHotkeyDebug('received', {
        command: SHOW_SEARCH_COMMAND_NAME,
        source: triggerSource,
        tabId: senderTab.id,
        url: senderTab.url || '',
        pendingUrl: senderTab.pendingUrl || '',
        prefillCurrentUrl: shouldPrefillCurrentUrl
      });
      rememberPageHotkeyContext(senderTab);
      triggerShowSearchForTab(senderTab, triggerSource);
      sendResponse({ ok: true });
      return;
    }
    case 'getShortcutRules': {
      loadShortcutRules().then((items) => {
        sendResponse({ items: items });
      });
      return true;
    }
    default:
      return sendUnknownBackgroundMessageResponse(sendResponse);
  }
}

function sendPipMainWorldResponse(methodName, sender, sendResponse) {
  if (!pipMainWorld || typeof pipMainWorld[methodName] !== 'function') {
    sendResponse({ ok: false, reason: 'pip-main-world-unavailable' });
    return;
  }
  pipMainWorld[methodName](sender)
    .then((result) => {
      sendResponse(result);
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        reason: error && error.message ? error.message : String(error || 'pip-main-world-failed')
      });
    });
}

function handlePipMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'pipRequestOwnership': {
      requestGlobalPipOwnership(sender, request && request.kind ? String(request.kind) : '')
        .then((result) => {
          sendResponse(result);
        })
        .catch((error) => {
          sendResponse({
            ok: false,
            granted: false,
            reason: error && error.message ? error.message : String(error || 'ownership-request-failed')
          });
        });
      return true;
    }
    case 'pipReleaseOwnership': {
      releaseGlobalPipOwnership(sender, request && request.token ? String(request.token) : '')
        .then((result) => {
          sendResponse(result);
        })
        .catch((error) => {
          sendResponse({
            ok: false,
            released: false,
            reason: error && error.message ? error.message : String(error || 'ownership-release-failed')
          });
        });
      return true;
    }
    case 'siteTryEnterPiPInMainWorld': {
      sendPipMainWorldResponse('siteTryEnterPiPInMainWorld', sender, sendResponse);
      return true;
    }
    case 'iqiyiTryEnterPiPInMainWorld': {
      sendPipMainWorldResponse('iqiyiTryEnterPiPInMainWorld', sender, sendResponse);
      return true;
    }
    case 'iqiyiSetupAutoPiPInMainWorld': {
      sendPipMainWorldResponse('iqiyiSetupAutoPiPInMainWorld', sender, sendResponse);
      return true;
    }
    case 'forceExitPiPInMainWorld': {
      sendPipMainWorldResponse('forceExitPiPInMainWorld', sender, sendResponse);
      return true;
    }
    case 'ytForceExitPiPInMainWorld': {
      sendPipMainWorldResponse('youtubeForceExitPiPInMainWorld', sender, sendResponse);
      return true;
    }
    default:
      return sendUnknownBackgroundMessageResponse(sendResponse);
  }
}

function handleSearchMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'searchOrNavigate': {
      const query = request.query ? String(request.query) : '';
      const forceSearch = Boolean(request.forceSearch);
      loadShortcutRules().then((rules) => {
        const shortcutUrl = getShortcutUrl(query, rules);
        if (shortcutUrl) {
          chrome.tabs.create({ url: shortcutUrl });
          sendResponse({ ok: true, url: shortcutUrl });
          return;
        }
        const directUrl = !forceSearch ? getDirectNavigationUrl(query) : '';
        if (directUrl) {
          chrome.tabs.create({ url: directUrl });
          sendResponse({ ok: true, url: directUrl });
        } else {
          // It's a search query - use browser default search engine
          const fallbackUrl = buildDefaultSearchUrl(query);
          if (chrome && chrome.search && typeof chrome.search.query === 'function') {
            markPendingSearchTab(null);
            try {
              chrome.search.query({ text: query, disposition: 'NEW_TAB' }, () => {
                if (chrome.runtime && chrome.runtime.lastError) {
                  pendingSearchAt = 0;
                  pendingSearchTabId = null;
                  chrome.tabs.create({ url: fallbackUrl });
                  sendResponse({ ok: true, url: fallbackUrl });
                  return;
                }
                sendResponse({ ok: true, url: fallbackUrl });
              });
              return;
            } catch (e) {
              pendingSearchAt = 0;
              pendingSearchTabId = null;
            }
          }
          chrome.tabs.create({ url: fallbackUrl });
          sendResponse({ ok: true, url: fallbackUrl });
        }
      });
      return true;
    }
    case 'getSearchSuggestions': {
      const query = request.query;
      getSearchSuggestions(query).then(suggestions => {
        sendResponse({ suggestions: suggestions });
      }).catch(() => {
        sendResponse({ suggestions: [] });
      });
      return true; // Keep the message channel open for async response
    }
    case 'recordSearchSuggestionSelection': {
      recordSearchSuggestionSelection(request)
        .then((result) => {
          sendResponse(result);
        })
        .catch((error) => {
          sendResponse({
            ok: false,
            reason: error && error.message ? error.message : 'record-selection-failed'
          });
        });
      return true;
    }
    case 'deleteHistoryUrl': {
      const targetUrl = typeof request.url === 'string' ? request.url : '';
      if (!targetUrl) {
        sendResponse({ ok: false, reason: 'invalid-url' });
        return;
      }
      if (!chrome.history || typeof chrome.history.deleteUrl !== 'function') {
        sendResponse({ ok: false, reason: 'history-api-unavailable' });
        return;
      }
      chrome.history.deleteUrl({ url: targetUrl }, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          sendResponse({ ok: false, reason: chrome.runtime.lastError.message || 'delete-history-failed' });
          return;
        }
        sendResponse({ ok: true, url: targetUrl });
      });
      return true;
    }
    default:
      return sendUnknownBackgroundMessageResponse(sendResponse);
  }
}

function handleSiteSearchMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'getSiteSearchProviders': {
      loadSiteSearchProviders().then((items) => {
        sendResponse({ items: items });
      });
      return true;
    }
    case 'runSiteSearchProviderQuery': {
      runInteractiveSiteSearchProvider(
        request.provider,
        request.query,
        sender,
        request.disposition
      ).then((result) => {
        sendResponse(result);
      }).catch((error) => {
        sendResponse({
          ok: false,
          reason: error && error.message ? error.message : 'interactive-site-search-failed'
        });
      });
      return true;
    }
    default:
      return sendUnknownBackgroundMessageResponse(sendResponse);
  }
}

function handleLocaleAndPermissionMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'getLocaleMessages': {
      const locale = normalizeLocaleForMessages(request.locale);
      const localePath = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
      fetch(localePath)
        .then((response) => response.json())
        .then((messages) => {
          sendResponse({ messages: messages || {} });
        })
        .catch(() => {
          sendResponse({ messages: {} });
        });
      return true;
    }
    case 'getFileSchemeAccessStatus': {
      checkFileSchemeAccess((isAllowed) => {
        sendResponse({
          ok: true,
          allowed: isAllowed === true,
          supported: isAllowed !== null,
          detailsUrl: getExtensionDetailsUrl()
        });
      });
      return true;
    }
    default:
      return sendUnknownBackgroundMessageResponse(sendResponse);
  }
}

function handleExtensionPageMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'openOptionsPage': {
      openExtensionOptionsPage((ok) => {
        sendResponse({ ok: ok !== false });
      });
      return true;
    }
    case 'openOnboardingPage': {
      openOnboardingPage({ reason: 'manual' }, (ok) => {
        sendResponse({ ok: ok !== false });
      });
      return true;
    }
    case 'openExtensionShortcutsPage': {
      openExtensionShortcutsPage((ok) => {
        sendResponse({ ok: ok !== false });
      });
      return true;
    }
    case 'openBookmarkManager': {
      openBookmarkManagerPage().then((url) => {
        sendResponse({ ok: true, url: url });
      }).catch(() => {
        sendResponse({ ok: false });
      });
      return true;
    }
    case 'createTab': {
      const targetUrl = typeof request.url === 'string' ? request.url : '';
      if (!targetUrl) {
        sendResponse({ ok: false });
        return;
      }
      chrome.tabs.create({ url: targetUrl }, () => {
        sendResponse({ ok: !(chrome.runtime && chrome.runtime.lastError) });
      });
      return true;
    }
    case 'openNewTab': {
      const newtabUrl = typeof EXTENSION_ROUTES.buildNewtabUrl === 'function'
        ? EXTENSION_ROUTES.buildNewtabUrl(chrome, { focus: true })
        : chrome.runtime.getURL('src/newtab/newtab.html?focus=1');
      chrome.tabs.create({ url: newtabUrl }, () => {
        sendResponse({ ok: !(chrome.runtime && chrome.runtime.lastError) });
      });
      return true;
    }
    case 'openExtensionDetailsPage': {
      const detailsUrl = getExtensionDetailsUrl();
      chrome.tabs.create({ url: detailsUrl }, () => {
        sendResponse({ ok: !(chrome.runtime && chrome.runtime.lastError), url: detailsUrl });
      });
      return true;
    }
    default:
      return sendUnknownBackgroundMessageResponse(sendResponse);
  }
}

function handleFaviconMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'resolveFaviconCandidates': {
      const targetUrl = request.url || '';
      const hostOverride = request.host || '';
      const fallbackUrl = request.fallbackUrl || '';
      const preferredTheme = request.preferredTheme || '';
      const options = {
        includeChromeFallback: request.excludeChromeFallback ? false : true,
        forceFresh: request.forceFresh === true
      };
      resolveFaviconCandidates(targetUrl, hostOverride, fallbackUrl, preferredTheme, options).then((urls) => {
        sendResponse({ urls: Array.isArray(urls) ? urls : [] });
      }).catch(() => {
        sendResponse({ urls: [] });
      });
      return true;
    }
    case 'getFaviconData': {
      const targetUrl = request.url || '';
      if (!targetUrl || typeof targetUrl !== 'string' || targetUrl.startsWith('data:') || isBlockedLocalFaviconUrl(targetUrl)) {
        if (targetUrl && isBlockedLocalFaviconUrl(targetUrl)) {
          logBlockedLocalFavicon(targetUrl, 'message:getFaviconData');
        }
        sendResponse({ data: '' });
        return;
      }
      try {
        const targetHost = new URL(targetUrl).hostname;
        if (shouldBlockFaviconForHost(targetHost)) {
          sendResponse({ data: '' });
          return;
        }
      } catch (e) {
        // Ignore parse failures and continue with non-local handling.
      }
      fetchFaviconData(targetUrl).then((dataUrl) => {
        sendResponse({ data: dataUrl || '' });
      }).catch(() => {
        sendResponse({ data: '' });
      });
      return true;
    }
    case 'resolveSiteThemeColor': {
      const targetUrl = request.url || '';
      const hostOverride = request.host || '';
      const preferredTheme = request.preferredTheme || '';
      resolveSiteThemeColor(targetUrl, hostOverride, preferredTheme).then((result) => {
        sendResponse(result || { accentRgb: null, source: '' });
      }).catch(() => {
        sendResponse({ accentRgb: null, source: '' });
      });
      return true;
    }
    default:
      return sendUnknownBackgroundMessageResponse(sendResponse);
  }
}

let siteSearchCache = null;
let siteSearchPromise = null;
let searchBlacklistCache = null;
let searchBlacklistPromise = null;
let searchResultSourceTypesCache = null;
let searchResultSourceTypesPromise = null;
let searchSelectionStatsCache = null;
let searchSelectionStatsPromise = null;
const SEARCH_ENGINE_SUGGEST_TIMEOUT_MS = 180;
const LOCAL_SUGGEST_SOURCE_TIMEOUT_MS = 800;
const HISTORY_FALLBACK_CACHE_TTL_MS = 45 * 1000;
const TOP_SITES_CACHE_TTL_MS = 30 * 1000;
const BOOKMARK_TREE_CACHE_TTL_MS = 2 * 60 * 1000;
let historyFallbackCache = {
  expiresAt: 0,
  items: []
};
let topSitesCache = {
  expiresAt: 0,
  items: []
};
let bookmarkTreeIndexCache = {
  expiresAt: 0,
  map: null
};
let bookmarkItemsCache = {
  expiresAt: 0,
  items: []
};
let bookmarkTreeIndexPromise = null;
let bookmarkItemsPromise = null;
let bookmarkTreeCacheListenersBound = false;
const SITE_SEARCH_STORAGE_KEY = '_x_extension_site_search_custom_2024_unique_';
const SITE_SEARCH_DISABLED_STORAGE_KEY = '_x_extension_site_search_disabled_2024_unique_';
const SEARCH_BLACKLIST_STORAGE_KEY = '_x_extension_search_blacklist_2026_unique_';
const BLACKLIST_UTILS = globalThis.LumnoBlacklistUtils || {};
const SEARCH_UTILS = globalThis.LumnoSearchUtils || {};
const AI_PROVIDER_SUBMIT = globalThis.LumnoAiProviderSubmit || {};
const DEFAULT_SEARCH_ENGINE_STORAGE_KEY = '_x_extension_default_search_engine_2024_unique_';
migrateStorageIfNeeded([
  THEME_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LANGUAGE_MESSAGES_STORAGE_KEY,
  RECENT_MODE_STORAGE_KEY,
  RECENT_COUNT_STORAGE_KEY,
  NEWTAB_WIDTH_MODE_STORAGE_KEY,
  NEWTAB_SEARCH_WIDTH_STORAGE_KEY,
  NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY,
  NEWTAB_THEME_MODE_STORAGE_KEY,
  NEWTAB_THEME_SCOPE_STORAGE_KEY,
  NEWTAB_WALLPAPER_STORAGE_KEY,
  NEWTAB_WALLPAPER_OVERLAY_STORAGE_KEY,
  NEWTAB_WALLPAPER_EFFECT_STORAGE_KEY,
  OVERLAY_SIZE_MODE_STORAGE_KEY,
  BOOKMARK_COUNT_STORAGE_KEY,
  BOOKMARK_COLUMNS_STORAGE_KEY,
  PINNED_RECENT_SITES_STORAGE_KEY,
  HIDDEN_RECENT_SITES_STORAGE_KEY,
  AUTO_PIP_ENABLED_STORAGE_KEY,
  DOCUMENT_PIP_ENABLED_STORAGE_KEY,
  PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY,
  DEFAULT_SEARCH_ENGINE_STORAGE_KEY,
  OVERLAY_TAB_PRIORITY_STORAGE_KEY,
  TAB_RANK_SCORE_DEBUG_STORAGE_KEY,
  RESTRICTED_ACTION_STORAGE_KEY,
  FALLBACK_SHORTCUT_STORAGE_KEY,
  SEARCH_RESULT_PRIORITY_STORAGE_KEY,
  SEARCH_RESULT_SOURCE_TYPES_STORAGE_KEY,
  SITE_SEARCH_STORAGE_KEY,
  SITE_SEARCH_DISABLED_STORAGE_KEY,
  SEARCH_BLACKLIST_STORAGE_KEY
]);
const FAVICON_GOOGLE_SIZE = 128;
const faviconDataCache = new Map();
const faviconPending = new Map();
const titlePinyinCache = new Map();
const faviconResolveCache = new Map();
const faviconResolvePending = new Map();
const faviconResolvePersistCache = new Map();
let faviconResolvePersistLoaded = false;
let faviconResolvePersistLoadPromise = null;
let faviconResolvePersistWriteTimer = null;
const siteThemeColorCache = new Map();
const siteThemeColorPending = new Map();
const blockedLocalFaviconLogCache = new Set();

function logBlockedLocalFavicon(url, source) {
  const key = `${source || 'unknown'}::${String(url || '')}`;
  if (blockedLocalFaviconLogCache.has(key)) {
    return;
  }
  blockedLocalFaviconLogCache.add(key);
  console.log('[Lumno][favicon-blocked-local]', {
    source: source || 'unknown',
    url: String(url || '')
  });
}

const SEARCH_ENGINE_DEFS = [
  {
    id: 'google',
    name: 'Google',
    hostMatches: ['google.'],
    searchTemplate: 'https://www.google.com/search?q={query}',
    searchUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`
  },
  {
    id: 'bing',
    name: 'Bing',
    hostMatches: ['bing.com'],
    searchTemplate: 'https://www.bing.com/search?q={query}',
    searchUrl: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`
  },
  {
    id: 'baidu',
    name: 'Baidu',
    hostMatches: ['baidu.com'],
    searchTemplate: 'https://www.baidu.com/s?wd={query}',
    searchUrl: (query) => `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    hostMatches: ['duckduckgo.com'],
    searchTemplate: 'https://duckduckgo.com/?q={query}',
    searchUrl: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    hostMatches: ['search.yahoo.com'],
    searchTemplate: 'https://search.yahoo.com/search?p={query}',
    searchUrl: (query) => `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`
  },
  {
    id: 'yandex',
    name: 'Yandex',
    hostMatches: ['yandex.com'],
    searchTemplate: 'https://yandex.com/search/?text={query}',
    searchUrl: (query) => `https://yandex.com/search/?text=${encodeURIComponent(query)}`
  },
  {
    id: 'sogou',
    name: '搜狗',
    hostMatches: ['sogou.com'],
    searchTemplate: 'https://www.sogou.com/web?query={query}',
    searchUrl: (query) => `https://www.sogou.com/web?query=${encodeURIComponent(query)}`
  },
  {
    id: 'so',
    name: '360搜索',
    hostMatches: ['so.com'],
    searchTemplate: 'https://www.so.com/s?q={query}',
    searchUrl: (query) => `https://www.so.com/s?q=${encodeURIComponent(query)}`
  },
  {
    id: 'shenma',
    name: '神马',
    hostMatches: ['sm.cn'],
    searchTemplate: 'https://m.sm.cn/s?q={query}',
    searchUrl: (query) => `https://m.sm.cn/s?q=${encodeURIComponent(query)}`
  }
];

let defaultSearchEngineState = {
  id: '',
  name: '',
  host: '',
  searchTemplate: '',
  updatedAt: 0
};

let pendingSearchAt = 0;
let pendingSearchTabId = null;

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function getGoogleFaviconUrl(hostname) {
  const normalized = normalizeFaviconHost(hostname);
  if (!normalized) {
    return '';
  }
  if (normalized === 'lumno.kubai.design') {
    return (chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function')
      ? chrome.runtime.getURL('assets/images/lumno.png')
      : 'https://lumno.kubai.design/favicon.png';
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(normalized)}&sz=${FAVICON_GOOGLE_SIZE}`;
}

function getFaviconIsUrl(hostname) {
  const normalized = normalizeFaviconHost(hostname);
  if (!normalized) {
    return '';
  }
  return `https://favicon.is/${encodeURIComponent(normalized)}`;
}

function isFaviconProxyUrl(url) {
  return typeof FAVICON_UTILS.isFaviconProxyUrl === 'function'
    ? FAVICON_UTILS.isFaviconProxyUrl(url)
    : false;
}

function isPersistableResolvedFaviconUrl(url) {
  const value = String(url || '').trim();
  if (!value || value.startsWith('data:') || /^chrome:\/\/favicon2\//i.test(value)) {
    return false;
  }
  if (isBlockedLocalFaviconUrl(value)) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return /^https?:$/i.test(parsed.protocol) && !shouldBlockFaviconForHost(parsed.hostname);
  } catch (e) {
    return false;
  }
}

function normalizeResolvedFaviconUrlsForPersist(urls) {
  const seen = new Set();
  const result = [];
  (Array.isArray(urls) ? urls : []).forEach((url) => {
    const value = String(url || '').trim();
    if (!isPersistableResolvedFaviconUrl(value) || seen.has(value)) {
      return;
    }
    seen.add(value);
    result.push(value);
  });
  return result.slice(0, 8);
}

function getValidFaviconResolvePersistEntries(rawEntries) {
  const now = Date.now();
  const input = rawEntries && typeof rawEntries === 'object' ? rawEntries : {};
  const valid = [];
  Object.keys(input).forEach((key) => {
    const item = input[key];
    if (!item || typeof item !== 'object') {
      return;
    }
    const updatedAt = Number(item.updatedAt || 0);
    const urls = normalizeResolvedFaviconUrlsForPersist(item.urls);
    if (!key || urls.length === 0 || !Number.isFinite(updatedAt)) {
      return;
    }
    if (now - updatedAt > FAVICON_RESOLVE_TTL_MS) {
      return;
    }
    valid.push({ key, urls, updatedAt });
  });
  valid.sort((a, b) => b.updatedAt - a.updatedAt);
  return valid.slice(0, FAVICON_RESOLVE_MAX_ENTRIES);
}

function loadFaviconResolvePersistCache() {
  if (faviconResolvePersistLoadPromise) {
    return faviconResolvePersistLoadPromise;
  }
  if (!localStorageArea) {
    faviconResolvePersistLoaded = true;
    faviconResolvePersistLoadPromise = Promise.resolve();
    return faviconResolvePersistLoadPromise;
  }
  if (faviconResolvePersistLoaded) {
    faviconResolvePersistLoadPromise = Promise.resolve();
    return faviconResolvePersistLoadPromise;
  }
  faviconResolvePersistLoadPromise = new Promise((resolve) => {
    localStorageArea.get([FAVICON_RESOLVE_STORAGE_KEY], (result) => {
      const payload = result && result[FAVICON_RESOLVE_STORAGE_KEY];
      const entries = getValidFaviconResolvePersistEntries(payload && payload.entries ? payload.entries : null);
      entries.forEach((item) => {
        faviconResolvePersistCache.set(item.key, {
          urls: item.urls,
          updatedAt: item.updatedAt
        });
      });
      faviconResolvePersistLoaded = true;
      resolve();
    });
  }).catch(() => undefined);
  return faviconResolvePersistLoadPromise;
}

function schedulePersistFaviconResolveCache() {
  if (!localStorageArea) {
    return;
  }
  if (faviconResolvePersistWriteTimer !== null) {
    return;
  }
  faviconResolvePersistWriteTimer = setTimeout(() => {
    faviconResolvePersistWriteTimer = null;
    const entries = Array.from(faviconResolvePersistCache.entries())
      .map(([key, value]) => ({
        key: String(key || ''),
        urls: normalizeResolvedFaviconUrlsForPersist(value && value.urls),
        updatedAt: Number(value && value.updatedAt ? value.updatedAt : 0)
      }))
      .filter((item) => item.key && item.urls.length > 0 && Number.isFinite(item.updatedAt))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, FAVICON_RESOLVE_MAX_ENTRIES);
    const serialized = {};
    entries.forEach((item) => {
      serialized[item.key] = {
        urls: item.urls,
        updatedAt: item.updatedAt
      };
    });
    localStorageArea.set({
      [FAVICON_RESOLVE_STORAGE_KEY]: {
        version: 1,
        entries: serialized,
        updatedAt: Date.now()
      }
    });
  }, 800);
}

function getPersistedFaviconResolveUrls(cacheKey) {
  const key = String(cacheKey || '');
  if (!key) {
    return Promise.resolve([]);
  }
  return loadFaviconResolvePersistCache().then(() => {
    const entry = faviconResolvePersistCache.get(key);
    if (!entry) {
      return [];
    }
    const updatedAt = Number(entry.updatedAt || 0);
    if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > FAVICON_RESOLVE_TTL_MS) {
      faviconResolvePersistCache.delete(key);
      schedulePersistFaviconResolveCache();
      return [];
    }
    return normalizeResolvedFaviconUrlsForPersist(entry.urls);
  }).catch(() => []);
}

function setPersistedFaviconResolveUrls(cacheKey, urls) {
  const key = String(cacheKey || '');
  const normalizedUrls = normalizeResolvedFaviconUrlsForPersist(urls);
  if (!key || normalizedUrls.length === 0) {
    return;
  }
  faviconResolvePersistCache.set(key, {
    urls: normalizedUrls,
    updatedAt: Date.now()
  });
  if (faviconResolvePersistCache.size > FAVICON_RESOLVE_MAX_ENTRIES * 2) {
    const compact = Array.from(faviconResolvePersistCache.entries())
      .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
      .slice(0, FAVICON_RESOLVE_MAX_ENTRIES);
    faviconResolvePersistCache.clear();
    compact.forEach(([keyItem, value]) => faviconResolvePersistCache.set(keyItem, value));
  }
  schedulePersistFaviconResolveCache();
}

function normalizeHost(hostname) {
  if (!hostname) {
    return '';
  }
  const lower = String(hostname).toLowerCase();
  const stripped = lower.replace(/^www\./i, '');
  if (stripped === 'my.feishu.cn') {
    return 'feishu.cn';
  }
  return stripped;
}

function getSearchEngineByHostname(hostname) {
  const normalized = normalizeHost(hostname);
  if (!normalized) {
    return null;
  }
  return SEARCH_ENGINE_DEFS.find((engine) =>
    engine.hostMatches.some((match) => normalized.includes(match))
  ) || null;
}

function getSearchEngineById(id) {
  if (!id) {
    return null;
  }
  return SEARCH_ENGINE_DEFS.find((engine) => engine.id === id) || null;
}

function setDefaultSearchEngineState(nextState, shouldPersist) {
  if (!nextState || !nextState.id) {
    return;
  }
  const engine = getSearchEngineById(nextState.id);
  const updated = {
    id: nextState.id,
    name: nextState.name || '',
    host: nextState.host || '',
    searchTemplate: nextState.searchTemplate || (engine ? engine.searchTemplate : ''),
    updatedAt: nextState.updatedAt || Date.now()
  };
  defaultSearchEngineState = updated;
  if (shouldPersist && storageArea) {
    storageArea.set({ [DEFAULT_SEARCH_ENGINE_STORAGE_KEY]: updated });
  }
}

function loadDefaultSearchEngineState() {
  if (!storageArea) {
    return;
  }
  storageArea.get([DEFAULT_SEARCH_ENGINE_STORAGE_KEY], (result) => {
    const stored = result ? result[DEFAULT_SEARCH_ENGINE_STORAGE_KEY] : null;
    if (stored && stored.id) {
      setDefaultSearchEngineState(stored, false);
    }
  });
}

function isSearchEngineResultUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const path = parsedUrl.pathname.toLowerCase();
    const isKnownHost = SEARCH_ENGINE_DEFS.some((engine) =>
      engine.hostMatches.some((match) => hostname.includes(match))
    );
    if (!isKnownHost) {
      return false;
    }
    const searchPaths = [
      '/search',
      '/s',
      '/s/2',
      '/web',
      '/?'
    ];
    if (path === '/' && parsedUrl.searchParams.has('q')) {
      return true;
    }
    if (path === '/' && parsedUrl.searchParams.has('wd')) {
      return true;
    }
    if (path === '/' && parsedUrl.searchParams.has('query')) {
      return true;
    }
    if (searchPaths.some((prefix) => path.startsWith(prefix))) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

function updateDefaultSearchEngineFromUrl(url) {
  if (!url || !isSearchEngineResultUrl(url)) {
    return false;
  }
  try {
    const parsedUrl = new URL(url);
    const engine = getSearchEngineByHostname(parsedUrl.hostname);
    if (!engine) {
      return false;
    }
    setDefaultSearchEngineState({
      id: engine.id,
      name: engine.name,
      host: normalizeHost(parsedUrl.hostname),
      searchTemplate: engine.searchTemplate,
      updatedAt: Date.now()
    }, true);
    return true;
  } catch (e) {
    return false;
  }
}

function buildDefaultSearchUrl(query) {
  const engine = getSearchEngineById(defaultSearchEngineState.id);
  if (engine && typeof engine.searchUrl === 'function') {
    return engine.searchUrl(query);
  }
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function isNumericHostLike(hostname) {
  if (!hostname) {
    return false;
  }
  if (!/^(\d{1,3})(\.\d{1,3}){0,3}$/.test(hostname)) {
    return false;
  }
  const parts = hostname.split('.');
  if (parts.length < 1 || parts.length > 4) {
    return false;
  }
  if (parts.length === 1) {
    return parts[0] === '127';
  }
  return parts.every((part) => {
    const value = Number(part);
    return Number.isInteger(value) && value >= 0 && value <= 255;
  });
}

function extractHostFromInput(rawInput) {
  const withoutScheme = String(rawInput || '').replace(/^https?:\/\//i, '');
  const authority = withoutScheme.split(/[/?#]/)[0] || '';
  if (!authority) {
    return '';
  }
  if (authority.startsWith('[')) {
    const endBracket = authority.indexOf(']');
    if (endBracket > 1) {
      return authority.slice(1, endBracket).toLowerCase();
    }
    return '';
  }
  if (authority.includes('::') && !authority.includes('.')) {
    return authority.toLowerCase();
  }
  return (authority.split(':')[0] || '').toLowerCase();
}

function isDevHostLike(hostname) {
  if (!hostname) {
    return false;
  }
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return true;
  }
  if (hostname === 'host.docker.internal') {
    return true;
  }
  if (
    hostname.endsWith('.local') ||
    hostname.endsWith('.test') ||
    hostname.endsWith('.localdev') ||
    hostname.endsWith('.internal')
  ) {
    return true;
  }
  return hostname === '::1' || hostname === '0:0:0:0:0:0:0:1';
}

function getDirectNavigationUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) {
    return '';
  }
  const lower = raw.toLowerCase();
  const isInternal = ['chrome://', 'edge://', 'brave://', 'vivaldi://', 'opera://'].some((prefix) =>
    lower.startsWith(prefix)
  );
  let normalizedInput = raw.match(/^(\d{1,3})([.\s]\d{1,3}){0,3}(?::\d{1,5})?(?:[/?#].*)?$/)
    ? raw.replace(/\s+/g, '.').replace(/\.{2,}/g, '.')
    : raw;
  const hostOnly = extractHostFromInput(normalizedInput);
  const isDevHost = isDevHostLike(hostOnly);
  const isNumericLike = isNumericHostLike(hostOnly);
  const looksLikeUrl = (normalizedInput.includes('.') && !normalizedInput.includes(' ')) || isInternal || isDevHost || isNumericLike;
  if (!looksLikeUrl) {
    return '';
  }
  if (hostOnly.includes(':') && !/^https?:\/\//i.test(normalizedInput) && !normalizedInput.startsWith('[')) {
    normalizedInput = `[${normalizedInput}]`;
  }
  if (!isInternal && !normalizedInput.startsWith('http://') && !normalizedInput.startsWith('https://')) {
    return `https://${normalizedInput}`;
  }
  return normalizedInput;
}

function getDefaultSearchEngineThemeUrl() {
  const engine = getSearchEngineById(defaultSearchEngineState.id);
  if (engine && typeof engine.searchUrl === 'function') {
    return engine.searchUrl('test');
  }
  return 'https://www.google.com';
}

function getDefaultSearchEngineFaviconUrl() {
  if (defaultSearchEngineState.host) {
    return `https://${defaultSearchEngineState.host}/favicon.ico`;
  }
  const engine = getSearchEngineById(defaultSearchEngineState.id);
  if (engine) {
    try {
      const host = new URL(engine.searchUrl('test')).hostname;
      return `https://${host}/favicon.ico`;
    } catch (e) {
      return '';
    }
  }
  return 'https://www.google.com/favicon.ico';
}

function parseJsonpPayload(text) {
  if (!text) {
    return null;
  }
  const start = text.indexOf('(');
  const end = text.lastIndexOf(')');
  if (start < 0 || end <= start) {
    return null;
  }
  const payload = text.slice(start + 1, end);
  try {
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

function extractJsonArray(text) {
  if (!text) {
    return null;
  }
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) {
    return null;
  }
  const payload = text.slice(start, end + 1);
  try {
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

async function fetchJson(url) {
  if (!url) {
    return null;
  }
  const response = await fetch(url);
  if (!response || !response.ok) {
    return null;
  }
  return response.json();
}

async function fetchText(url) {
  if (!url) {
    return '';
  }
  const response = await fetch(url);
  if (!response || !response.ok) {
    return '';
  }
  return response.text();
}

async function fetchSearchSuggestionsForEngine(query) {
  const engineId = defaultSearchEngineState.id;
  if (!query || !engineId) {
    return [];
  }
  try {
    if (engineId === 'google') {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1];
      }
      return [];
    }
    if (engineId === 'bing') {
      const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1];
      }
      return [];
    }
    if (engineId === 'baidu') {
      const url = `https://www.baidu.com/sugrec?ie=utf-8&json=1&prod=pc&wd=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (data && Array.isArray(data.g)) {
        return data.g.map((item) => item && item.q).filter(Boolean);
      }
      return [];
    }
    if (engineId === 'sogou') {
      const url = `https://sor.html5.qq.com/api/getsug?m=searxng&key=${encodeURIComponent(query)}`;
      const text = await fetchText(url);
      const data = extractJsonArray(text);
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1];
      }
      return [];
    }
    if (engineId === 'so') {
      const url = `https://sug.so.360.cn/suggest?format=json&word=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (data && Array.isArray(data.result)) {
        return data.result
          .map((item) => (item && (item.word || item.w)) || '')
          .filter(Boolean);
      }
      return [];
    }
    if (engineId === 'duckduckgo') {
      const url = `https://duckduckgo.com/ac/?type=list&q=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (Array.isArray(data)) {
        if (Array.isArray(data[1])) {
          return data[1];
        }
        return data.map((item) => item && item.phrase).filter(Boolean);
      }
      return [];
    }
    if (engineId === 'yandex') {
      const url = `https://suggest.yandex.com/suggest-ff.cgi?part=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1];
      }
      return [];
    }
    if (engineId === 'quark') {
      const url = `https://sugs.m.sm.cn/web?q=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (data && Array.isArray(data.r)) {
        return data.r.map((item) => item && item.w).filter(Boolean);
      }
      return [];
    }
    if (engineId === 'shenma') {
      const url = `https://sugs.m.sm.cn/web?q=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (data && Array.isArray(data.r)) {
        return data.r.map((item) => item && item.w).filter(Boolean);
      }
      return [];
    }
    if (engineId === 'yahoo') {
      const url = `https://search.yahoo.com/sugg/gossip/gossip-us-ura/?output=sd1&command=${encodeURIComponent(query)}`;
      const text = await fetchText(url);
      const data = parseJsonpPayload(text) || extractJsonArray(text);
      if (Array.isArray(data)) {
        if (Array.isArray(data[1])) {
          return data[1];
        }
        if (data[0] && Array.isArray(data[0])) {
          return data[0];
        }
      }
      if (data && Array.isArray(data.gossip && data.gossip.results)) {
        return data.gossip.results.map((item) => item && item.key).filter(Boolean);
      }
      return [];
    }
    return [];
  } catch (e) {
    return [];
  }
}

function markPendingSearchTab(tabId) {
  pendingSearchAt = Date.now();
  pendingSearchTabId = typeof tabId === 'number' ? tabId : null;
}

loadDefaultSearchEngineState();

if (chrome && chrome.tabs) {
  chrome.tabs.onCreated.addListener((tab) => {
    if (!pendingSearchAt || !tab || typeof tab.id !== 'number') {
      return;
    }
    if (Date.now() - pendingSearchAt > 5000) {
      return;
    }
    pendingSearchTabId = tab.id;
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (!changeInfo || !changeInfo.url) {
      return;
    }
    if (!pendingSearchAt || (Date.now() - pendingSearchAt > 10000)) {
      return;
    }
    if (pendingSearchTabId !== null && tabId !== pendingSearchTabId) {
      return;
    }
    const updated = updateDefaultSearchEngineFromUrl(changeInfo.url);
    if (updated) {
      pendingSearchTabId = null;
      pendingSearchAt = 0;
    }
  });
}

function normalizeLocaleForMessages(locale) {
  const settings = globalThis.LumnoSettings || {};
  return typeof settings.normalizeLocale === 'function'
    ? settings.normalizeLocale(locale)
    : 'en';
}

function isLocalNetworkHost(hostname) {
  return typeof FAVICON_UTILS.isLocalNetworkHost === 'function'
    ? FAVICON_UTILS.isLocalNetworkHost(hostname)
    : false;
}

function isSuspiciousLocalFaviconHost(hostname) {
  return typeof FAVICON_UTILS.isSuspiciousLocalFaviconHost === 'function'
    ? FAVICON_UTILS.isSuspiciousLocalFaviconHost(hostname)
    : false;
}

function shouldBlockFaviconForHost(hostname) {
  return typeof FAVICON_UTILS.shouldBlockFaviconForHost === 'function'
    ? FAVICON_UTILS.shouldBlockFaviconForHost(hostname)
    : false;
}

function isBlockedLocalFaviconUrl(url) {
  return typeof FAVICON_UTILS.isBlockedLocalFaviconUrl === 'function'
    ? FAVICON_UTILS.isBlockedLocalFaviconUrl(url)
    : false;
}

function normalizeFaviconHost(hostname) {
  return typeof FAVICON_UTILS.normalizeFaviconHost === 'function'
    ? FAVICON_UTILS.normalizeFaviconHost(hostname)
    : String(hostname || '').toLowerCase().replace(/^www\./i, '');
}

function getChromeFaviconUrl(url) {
  return typeof FAVICON_UTILS.getChromeFaviconUrl === 'function'
    ? FAVICON_UTILS.getChromeFaviconUrl(url)
    : '';
}

function normalizeThemePreference(theme) {
  const settings = globalThis.LumnoSettings || {};
  return typeof settings.normalizeThemePreference === 'function'
    ? settings.normalizeThemePreference(theme)
    : '';
}

function hasThemeTokenInUrl(url, token) {
  return typeof FAVICON_UTILS.hasThemeTokenInUrl === 'function'
    ? FAVICON_UTILS.hasThemeTokenInUrl(url, token)
    : false;
}

function shouldSkipThemeUpgradeCandidate(candidateUrl, preferredTheme, currentUrl) {
  return typeof FAVICON_UTILS.shouldSkipThemeUpgradeCandidate === 'function'
    ? FAVICON_UTILS.shouldSkipThemeUpgradeCandidate(candidateUrl, normalizeThemePreference(preferredTheme), currentUrl)
    : false;
}

function getKnownThemedFaviconCandidates(hostname, preferredTheme) {
  return typeof FAVICON_UTILS.getKnownThemedFaviconCandidateScores === 'function'
    ? FAVICON_UTILS.getKnownThemedFaviconCandidateScores(hostname, normalizeThemePreference(preferredTheme), {
      getRuntimeUrl: (path) => chrome.runtime.getURL(path)
    })
    : [];
}

function buildRootFaviconCandidates(hostname, preferredTheme) {
  return typeof FAVICON_UTILS.getRootFaviconCandidateScores === 'function'
    ? FAVICON_UTILS.getRootFaviconCandidateScores(hostname, normalizeThemePreference(preferredTheme))
    : [];
}

function parseHtmlIconCandidates(html, pageUrl, preferredTheme) {
  return typeof FAVICON_UTILS.parseHtmlIconCandidateScores === 'function'
    ? FAVICON_UTILS.parseHtmlIconCandidateScores(html, pageUrl, normalizeThemePreference(preferredTheme))
    : [];
}

function parseCssThemeColor(color) {
  return typeof FAVICON_UTILS.parseCssThemeColor === 'function'
    ? FAVICON_UTILS.parseCssThemeColor(color)
    : null;
}

function parseHtmlThemeColorCandidates(html, pageUrl, preferredTheme) {
  return typeof FAVICON_UTILS.parseHtmlThemeColorCandidates === 'function'
    ? FAVICON_UTILS.parseHtmlThemeColorCandidates(html, pageUrl, normalizeThemePreference(preferredTheme))
    : [];
}

function pickBestThemeColorCandidate(candidates) {
  return typeof FAVICON_UTILS.pickBestThemeColorCandidate === 'function'
    ? FAVICON_UTILS.pickBestThemeColorCandidate(candidates)
    : null;
}

function normalizeThemeAccentRgb(value) {
  if (!Array.isArray(value) || value.length !== 3) {
    return null;
  }
  const rgb = value.map((channel) => Math.round(Number(channel)));
  return rgb.every((channel) => Number.isFinite(channel) && channel >= 0 && channel <= 255)
    ? rgb
    : null;
}

function getThemeColorConfidence(accentRgb) {
  return typeof FAVICON_UTILS.getThemeColorConfidence === 'function'
    ? FAVICON_UTILS.getThemeColorConfidence(accentRgb)
    : 'color';
}

function buildSiteThemeColorResult(accentRgb, source, options) {
  const rgb = normalizeThemeAccentRgb(accentRgb);
  if (!rgb) {
    return null;
  }
  const confidence = options && options.confidence
    ? String(options.confidence)
    : getThemeColorConfidence(rgb);
  const neutral = options && typeof options.neutral === 'boolean'
    ? options.neutral
    : confidence === 'neutral';
  return {
    accentRgb: rgb,
    source: source || 'meta',
    neutral,
    confidence
  };
}

function fetchManifestThemeColor(manifestUrl) {
  if (!manifestUrl || isBlockedLocalFaviconUrl(manifestUrl)) {
    return Promise.resolve(null);
  }
  try {
    const parsed = new URL(manifestUrl);
    if (!/^https?:$/i.test(parsed.protocol) || shouldBlockFaviconForHost(parsed.hostname)) {
      return Promise.resolve(null);
    }
  } catch (e) {
    return Promise.resolve(null);
  }
  return fetch(manifestUrl, { cache: 'force-cache' })
    .then((response) => {
      if (!response || !response.ok) {
        return null;
      }
      return response.json();
    })
    .then((manifest) => {
      const accentRgb = parseCssThemeColor(manifest && (manifest.theme_color || manifest.background_color));
      return accentRgb ? buildSiteThemeColorResult(accentRgb, 'manifest') : null;
    })
    .catch(() => null);
}

function resolveThemeColorCandidates(candidates) {
  const sorted = (Array.isArray(candidates) ? candidates : [])
    .filter((item) => item && (item.accentRgb || item.manifestUrl))
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  let index = 0;
  const next = () => {
    const candidate = sorted[index];
    index += 1;
    if (!candidate) {
      return Promise.resolve(null);
    }
    if (candidate.accentRgb) {
      return Promise.resolve(buildSiteThemeColorResult(candidate.accentRgb, candidate.source || 'meta', {
        neutral: candidate.neutral,
        confidence: candidate.confidence
      }));
    }
    if (candidate.manifestUrl) {
      return fetchManifestThemeColor(candidate.manifestUrl).then((result) => result || next());
    }
    return next();
  };
  return next();
}

function resolveSiteThemeColor(targetUrl, hostOverride, preferredTheme) {
  const inputUrl = String(targetUrl || '').trim();
  if (!inputUrl) {
    return Promise.resolve(null);
  }
  let parsed = null;
  try {
    parsed = new URL(inputUrl);
  } catch (e) {
    return Promise.resolve(null);
  }
  if (!/^https?:$/i.test(parsed.protocol)) {
    return Promise.resolve(null);
  }
  if (shouldBlockFaviconForHost(parsed.hostname) || (hostOverride && shouldBlockFaviconForHost(hostOverride))) {
    logBlockedLocalFavicon(targetUrl || hostOverride || '', 'resolveSiteThemeColor');
    return Promise.resolve(null);
  }
  const normalizedHost = normalizeFaviconHost(hostOverride || parsed.hostname);
  const normalizedTheme = normalizeThemePreference(preferredTheme);
  const cacheKey = `${normalizedHost}::${parsed.origin}::${normalizedTheme || 'auto'}`;
  if (siteThemeColorCache.has(cacheKey)) {
    return Promise.resolve(siteThemeColorCache.get(cacheKey));
  }
  if (siteThemeColorPending.has(cacheKey)) {
    return siteThemeColorPending.get(cacheKey);
  }
  if (!canFetchPageForFavicon(inputUrl)) {
    siteThemeColorCache.set(cacheKey, null);
    return Promise.resolve(null);
  }
  const promise = fetch(inputUrl, { cache: 'force-cache' })
    .then((response) => {
      if (!response || !response.ok) {
        return '';
      }
      return response.text();
    })
    .then((html) => {
      const candidates = parseHtmlThemeColorCandidates(html, inputUrl, normalizedTheme);
      return resolveThemeColorCandidates(candidates);
    })
    .then((result) => {
      siteThemeColorCache.set(cacheKey, result || null);
      siteThemeColorPending.delete(cacheKey);
      return result || null;
    })
    .catch(() => {
      siteThemeColorCache.set(cacheKey, null);
      siteThemeColorPending.delete(cacheKey);
      return null;
    });
  siteThemeColorPending.set(cacheKey, promise);
  return promise;
}

function buildFaviconFallbackCandidates(pageUrl, hostOverride, fallbackUrl, preferredTheme, options) {
  const includeChromeFallback = !options || options.includeChromeFallback !== false;
  const normalizedTheme = normalizeThemePreference(preferredTheme);
  const candidates = [];
  const inputUrl = String(pageUrl || '').trim();
  const fallback = String(fallbackUrl || '').trim();
  let host = normalizeFaviconHost(hostOverride || '');
  if (!host && inputUrl) {
    try {
      host = normalizeFaviconHost(new URL(inputUrl).hostname);
    } catch (e) {
      host = '';
    }
  }
  if (host && shouldBlockFaviconForHost(host)) {
    return [];
  }
  if (host) {
    candidates.push(...getKnownThemedFaviconCandidates(host, normalizedTheme));
    candidates.push(...buildRootFaviconCandidates(host, normalizedTheme));
    candidates.push({ url: getGoogleFaviconUrl(host), score: 8 });
    candidates.push({ url: getFaviconIsUrl(host), score: 1 });
  }
  if (inputUrl && includeChromeFallback) {
    // Keep Chrome's built-in favicon resolver as a last-resort runtime fallback.
    candidates.push({ url: getChromeFaviconUrl(inputUrl), score: -4 });
  }
  if (fallback) {
    candidates.push({ url: fallback, score: 10 });
  }
  return candidates.filter((item) => item && item.url);
}

function dedupeAndSortFaviconCandidates(candidates) {
  const byUrl = new Map();
  (candidates || []).forEach((item) => {
    if (!item || !item.url) {
      return;
    }
    const key = String(item.url);
    const current = byUrl.get(key);
    if (!current || Number(item.score || 0) > Number(current.score || 0)) {
      byUrl.set(key, { url: key, score: Number(item.score || 0) });
    }
  });
  return Array.from(byUrl.values())
    .sort((a, b) => b.score - a.score)
    .map((item) => item.url);
}

function resolveFaviconCandidates(targetUrl, hostOverride, fallbackUrl, preferredTheme, options) {
  const includeChromeFallback = !options || options.includeChromeFallback !== false;
  const forceFresh = Boolean(options && options.forceFresh);
  const inputUrl = String(targetUrl || '').trim();
  if (!inputUrl) {
    return Promise.resolve([]);
  }
  let parsed = null;
  try {
    parsed = new URL(inputUrl);
  } catch (e) {
    return Promise.resolve([]);
  }
  if (!/^https?:$/i.test(parsed.protocol)) {
    return Promise.resolve([]);
  }
  if (shouldBlockFaviconForHost(parsed.hostname) || (hostOverride && shouldBlockFaviconForHost(hostOverride))) {
    logBlockedLocalFavicon(targetUrl || hostOverride || '', 'resolveFaviconCandidates');
    return Promise.resolve([]);
  }
  const normalizedTheme = normalizeThemePreference(preferredTheme);
  const normalizedHost = normalizeFaviconHost(hostOverride || parsed.hostname);
  const cacheKey = `${normalizedHost}::${parsed.origin}::${normalizedTheme || 'auto'}::chrome=${includeChromeFallback ? '1' : '0'}`;
  const buildResolvedWithExtra = (urls, cachedScore) => {
    const extra = buildFaviconFallbackCandidates(inputUrl, hostOverride, fallbackUrl, normalizedTheme, { includeChromeFallback: includeChromeFallback });
    return dedupeAndSortFaviconCandidates([
      ...((Array.isArray(urls) ? urls : []).map((url) => ({ url: url, score: cachedScore }))),
      ...extra
    ]);
  };
  if (!forceFresh && faviconResolveCache.has(cacheKey)) {
    return Promise.resolve(buildResolvedWithExtra(faviconResolveCache.get(cacheKey), 80));
  }
  if (!forceFresh && faviconResolvePending.has(cacheKey)) {
    return faviconResolvePending.get(cacheKey);
  }
  const resolveFreshCandidates = () => {
    if (!canFetchPageForFavicon(inputUrl)) {
      const fallbackCandidates = buildFaviconFallbackCandidates(inputUrl, hostOverride, fallbackUrl, normalizedTheme, { includeChromeFallback: includeChromeFallback });
      const resolved = dedupeAndSortFaviconCandidates(fallbackCandidates);
      faviconResolveCache.set(cacheKey, resolved.slice(0, 8));
      setPersistedFaviconResolveUrls(cacheKey, resolved);
      return Promise.resolve(resolved);
    }
    return fetch(inputUrl, { cache: forceFresh ? 'reload' : 'force-cache' })
      .then((response) => {
        if (!response || !response.ok) {
          return '';
        }
        return response.text();
      })
      .then((html) => {
        const parsedCandidates = parseHtmlIconCandidates(html, inputUrl, normalizedTheme);
        const fallbackCandidates = buildFaviconFallbackCandidates(inputUrl, hostOverride, fallbackUrl, normalizedTheme, { includeChromeFallback: includeChromeFallback });
        const resolved = dedupeAndSortFaviconCandidates([...parsedCandidates, ...fallbackCandidates]);
        faviconResolveCache.set(cacheKey, resolved.slice(0, 8));
        setPersistedFaviconResolveUrls(cacheKey, resolved);
        return resolved;
      })
      .catch(() => {
        const fallbackCandidates = buildFaviconFallbackCandidates(inputUrl, hostOverride, fallbackUrl, normalizedTheme, { includeChromeFallback: includeChromeFallback });
        const resolved = dedupeAndSortFaviconCandidates(fallbackCandidates);
        faviconResolveCache.set(cacheKey, resolved.slice(0, 8));
        setPersistedFaviconResolveUrls(cacheKey, resolved);
        return resolved;
      });
  };
  const promise = (forceFresh ? Promise.resolve([]) : getPersistedFaviconResolveUrls(cacheKey))
    .then((persistedUrls) => {
      if (persistedUrls.length > 0) {
        faviconResolveCache.set(cacheKey, persistedUrls.slice(0, 8));
        return buildResolvedWithExtra(persistedUrls, 80);
      }
      return resolveFreshCandidates();
    })
    .then((resolved) => {
      if (!forceFresh) {
        faviconResolvePending.delete(cacheKey);
      }
      return resolved;
    })
    .catch(() => {
      if (!forceFresh) {
        faviconResolvePending.delete(cacheKey);
      }
      return resolveFreshCandidates();
    });
  if (!forceFresh) {
    faviconResolvePending.set(cacheKey, promise);
  }
  return promise;
}

function escapeRegExp(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeDisplayText(text) {
  const raw = String(text || '');
  const withoutSpecial = raw.replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\uFFF9-\uFFFD]|\p{Co}/gu, '');
  return withoutSpecial.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

function renderHighlightedText(target, text, query, styles) {
  const safeText = sanitizeDisplayText(text);
  const needle = String(query || '').trim();
  if (!needle) {
    target.textContent = safeText;
    return;
  }
  const parts = safeText.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'));
  if (parts.length === 1) {
    target.textContent = safeText;
    return;
  }
  parts.forEach((part) => {
    if (!part) {
      return;
    }
    if (part.toLowerCase() === needle.toLowerCase()) {
      const mark = document.createElement('mark');
      mark.style.background = styles && styles.background
        ? styles.background
        : 'var(--x-ext-mark-bg, #CFE8FF)';
      mark.style.color = styles && styles.color
        ? styles.color
        : 'var(--x-ext-mark-text, #1E3A8A)';
      mark.style.padding = '0 1px';
      mark.style.borderRadius = '2px';
      mark.style.lineHeight = 'inherit';
      mark.style.fontFamily = "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
      mark.textContent = part;
      target.appendChild(mark);
    } else {
      target.appendChild(document.createTextNode(part));
    }
  });
}

function fetchFaviconData(url) {
  if (!url) {
    return Promise.resolve(null);
  }
  if (isBlockedLocalFaviconUrl(url)) {
    logBlockedLocalFavicon(url, 'fetchFaviconData');
    return Promise.resolve(null);
  }
  try {
    const parsed = new URL(url);
    if (shouldBlockFaviconForHost(parsed.hostname)) {
      return Promise.resolve(null);
    }
  } catch (e) {
    // Keep existing behavior for non-standard URL formats.
  }
  if (faviconDataCache.has(url)) {
    return Promise.resolve(faviconDataCache.get(url));
  }
  if (faviconPending.has(url)) {
    return faviconPending.get(url);
  }
  const promise = fetch(url, { cache: 'force-cache' })
    .then((response) => {
      if (!response || !response.ok) {
        return null;
      }
      return response.blob();
    })
    .then((blob) => {
      if (!blob || blob.size > 256 * 1024) {
        return null;
      }
      return blob.arrayBuffer().then((buffer) => {
        const base64 = arrayBufferToBase64(buffer);
        return `data:${blob.type || 'image/png'};base64,${base64}`;
      });
    })
    .then((dataUrl) => {
      if (dataUrl) {
        faviconDataCache.set(url, dataUrl);
      }
      faviconPending.delete(url);
      return dataUrl;
    })
    .catch(() => {
      faviconPending.delete(url);
      return null;
    });
  faviconPending.set(url, promise);
  return promise;
}

function normalizeSiteSearchTemplate(template) {
  if (typeof SEARCH_UTILS.normalizeSiteSearchTemplate === 'function') {
    return SEARCH_UTILS.normalizeSiteSearchTemplate(template);
  }
  return String(template || '')
    .trim()
    .replace(/\{\{\{s\}\}\}/g, '{query}')
    .replace(/\{s\}/g, '{query}')
    .replace(/\{searchTerms\}/g, '{query}');
}

function isAiSiteSearchProvider(provider) {
  if (typeof SEARCH_UTILS.isAiSiteSearchProvider === 'function') {
    return SEARCH_UTILS.isAiSiteSearchProvider(provider);
  }
  const template = normalizeSiteSearchTemplate(provider && provider.template);
  return Boolean(provider && (
    String(provider.action || '').trim() === 'openAndSubmit' ||
    (template && !template.includes('{query}'))
  ));
}

function isInteractiveSiteSearchProvider(provider) {
  if (typeof SEARCH_UTILS.isInteractiveSiteSearchProvider === 'function') {
    return SEARCH_UTILS.isInteractiveSiteSearchProvider(provider);
  }
  return Boolean(
    isAiSiteSearchProvider(provider) &&
    String((provider && provider.action) || '').trim() === 'openAndSubmit' &&
    (
      typeof SEARCH_UTILS.isInteractiveSiteSearchSubmitStrategy === 'function'
        ? SEARCH_UTILS.isInteractiveSiteSearchSubmitStrategy(provider && provider.submitStrategy)
        : ['geminiPrompt', 'chatgptPrompt', 'doubaoPrompt', 'qianwenQuery', 'yuanbaoPrompt', 'minimaxPrompt', 'deepseekPrompt', 'kimiPrompt'].includes(String((provider && provider.submitStrategy) || '').trim())
    )
  );
}

function sanitizeSiteSearchProviders(items) {
  if (typeof SEARCH_UTILS.sanitizeSiteSearchProviders === 'function') {
    return SEARCH_UTILS.sanitizeSiteSearchProviders(items);
  }
  return (Array.isArray(items) ? items : [])
    .filter((item) => item && item.key && item.template)
    .map((item) => {
      const template = normalizeSiteSearchTemplate(item.template);
      return {
        key: String(item.key).trim(),
        aliases: Array.isArray(item.aliases) ? item.aliases.filter(Boolean) : [],
        name: item.name || item.key,
        template,
        action: String(item.action || '').trim(),
        submitStrategy: String(item.submitStrategy || '').trim()
      };
    })
    .filter((item) => item.key && item.template && (item.template.includes('{query}') || isAiSiteSearchProvider(item)));
}

function loadCustomSiteSearchProviders() {
  return new Promise((resolve) => {
    if (!storageArea) {
      resolve([]);
      return;
    }
    storageArea.get([SITE_SEARCH_STORAGE_KEY], (result) => {
      const items = sanitizeSiteSearchProviders(result[SITE_SEARCH_STORAGE_KEY]);
      resolve(items);
    });
  });
}

function loadDisabledSiteSearchKeys() {
  return new Promise((resolve) => {
    if (!storageArea) {
      resolve([]);
      return;
    }
    storageArea.get([SITE_SEARCH_DISABLED_STORAGE_KEY], (result) => {
      const items = Array.isArray(result[SITE_SEARCH_DISABLED_STORAGE_KEY])
        ? result[SITE_SEARCH_DISABLED_STORAGE_KEY]
        : [];
      resolve(items.map((item) => String(item).toLowerCase()).filter(Boolean));
    });
  });
}

function normalizeSearchBlacklistMatchModes(value) {
  if (BLACKLIST_UTILS.normalizeMatchModes) {
    return BLACKLIST_UTILS.normalizeMatchModes(value, 'prefix');
  }
  return ['prefix'];
}

function normalizeSearchBlacklistItems(items) {
  if (BLACKLIST_UTILS.normalizeItems) {
    return BLACKLIST_UTILS.normalizeItems(items, 'prefix');
  }
  return [];
}

function normalizeSearchResultSourceTypes(value) {
  const settings = globalThis.LumnoSettings || {};
  if (typeof settings.normalizeSearchResultSourceTypes === 'function') {
    return settings.normalizeSearchResultSourceTypes(value);
  }
  const rawItems = Array.isArray(value) ? value : [];
  const selected = [];
  rawItems.forEach((item) => {
    const raw = String(item || '').trim();
    const type = raw === 'topSite' || raw === 'bookmark' || raw === 'history' ? raw : '';
    if (type && !selected.includes(type)) {
      selected.push(type);
    }
  });
  return selected.length > 0 ? selected : ['topSite', 'bookmark', 'history'];
}

function areStringArraysEqual(a, b) {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i += 1) {
    if (String(left[i]) !== String(right[i])) {
      return false;
    }
  }
  return true;
}

function loadSearchResultSourceTypes() {
  if (searchResultSourceTypesCache) {
    return Promise.resolve(searchResultSourceTypesCache);
  }
  if (searchResultSourceTypesPromise) {
    return searchResultSourceTypesPromise;
  }
  searchResultSourceTypesPromise = new Promise((resolve) => {
    if (!storageArea) {
      const defaults = normalizeSearchResultSourceTypes(null);
      searchResultSourceTypesCache = defaults;
      resolve(defaults);
      return;
    }
    storageArea.get([SEARCH_RESULT_SOURCE_TYPES_STORAGE_KEY], (result) => {
      const raw = result && result[SEARCH_RESULT_SOURCE_TYPES_STORAGE_KEY];
      const normalized = normalizeSearchResultSourceTypes(raw);
      searchResultSourceTypesCache = normalized;
      if (!areStringArraysEqual(raw, normalized)) {
        storageArea.set({ [SEARCH_RESULT_SOURCE_TYPES_STORAGE_KEY]: normalized });
      }
      resolve(normalized);
    });
  }).finally(() => {
    searchResultSourceTypesPromise = null;
  });
  return searchResultSourceTypesPromise;
}

function loadSearchBlacklistItems() {
  if (searchBlacklistCache) {
    return Promise.resolve(searchBlacklistCache);
  }
  if (searchBlacklistPromise) {
    return searchBlacklistPromise;
  }
  searchBlacklistPromise = new Promise((resolve) => {
    if (!storageArea) {
      resolve([]);
      return;
    }
    storageArea.get([SEARCH_BLACKLIST_STORAGE_KEY], (result) => {
      const items = normalizeSearchBlacklistItems(result && result[SEARCH_BLACKLIST_STORAGE_KEY]);
      searchBlacklistCache = items;
      resolve(items);
    });
  }).finally(() => {
    searchBlacklistPromise = null;
  });
  return searchBlacklistPromise;
}

function normalizeSearchSelectionStats(rawStats) {
  if (typeof SEARCH_UTILS.normalizeSearchSelectionStats === 'function') {
    return SEARCH_UTILS.normalizeSearchSelectionStats(rawStats);
  }
  return { version: 1, updatedAt: 0, queries: {} };
}

function loadSearchSelectionStats() {
  if (searchSelectionStatsCache) {
    return Promise.resolve(searchSelectionStatsCache);
  }
  if (searchSelectionStatsPromise) {
    return searchSelectionStatsPromise;
  }
  searchSelectionStatsPromise = new Promise((resolve) => {
    if (!localStorageArea) {
      const emptyStats = normalizeSearchSelectionStats(null);
      searchSelectionStatsCache = emptyStats;
      resolve(emptyStats);
      return;
    }
    localStorageArea.get([SEARCH_SELECTION_STATS_STORAGE_KEY], (result) => {
      const stats = normalizeSearchSelectionStats(result && result[SEARCH_SELECTION_STATS_STORAGE_KEY]);
      searchSelectionStatsCache = stats;
      resolve(stats);
    });
  }).finally(() => {
    searchSelectionStatsPromise = null;
  });
  return searchSelectionStatsPromise;
}

function saveSearchSelectionStats(stats) {
  const normalizedStats = normalizeSearchSelectionStats(stats);
  searchSelectionStatsCache = normalizedStats;
  return new Promise((resolve) => {
    if (!localStorageArea) {
      resolve(false);
      return;
    }
    localStorageArea.set({ [SEARCH_SELECTION_STATS_STORAGE_KEY]: normalizedStats }, () => {
      resolve(!(chrome.runtime && chrome.runtime.lastError));
    });
  });
}

function shouldRecordSearchSuggestionSelectionPayload(selection) {
  if (!selection || typeof selection !== 'object') {
    return false;
  }
  const query = String(selection.query || '').trim();
  const url = String(selection.url || '').trim();
  if (!query || !url) {
    return false;
  }
  const type = String(selection.type || '').trim();
  if (type === 'newtab' ||
      type === 'googleSuggest' ||
      type === 'siteSearch' ||
      type === 'inlineSiteSearch' ||
      type === 'siteSearchPrompt' ||
      type === 'modeSwitch' ||
      type === 'commandNewTab' ||
      type === 'commandSettings') {
    return false;
  }
  return true;
}

function recordSearchSuggestionSelection(selection) {
  if (!shouldRecordSearchSuggestionSelectionPayload(selection) ||
      typeof SEARCH_UTILS.recordSearchSelectionInStats !== 'function') {
    return Promise.resolve({ ok: false, reason: 'invalid-selection' });
  }
  return loadSearchSelectionStats()
    .then((stats) => {
      const updatedStats = SEARCH_UTILS.recordSearchSelectionInStats(stats, selection);
      return saveSearchSelectionStats(updatedStats);
    })
    .then((ok) => ({ ok: ok === true }));
}

function recordSearchSuggestionSelectionFromSuggestion(suggestion, query, source) {
  if (!suggestion || suggestion.forceSearch || suggestion.provider || !suggestion.url) {
    return;
  }
  recordSearchSuggestionSelection({
    query,
    url: suggestion.url,
    title: suggestion.title || '',
    type: suggestion.type || 'history',
    source: source || 'overlay'
  }).catch(() => {});
}

function getSearchSelectionBoost(item, context, stats, options) {
  if (typeof SEARCH_UTILS.getSearchSelectionBoost !== 'function') {
    return 0;
  }
  return SEARCH_UTILS.getSearchSelectionBoost(item, context, stats, options);
}

function isUrlBlockedBySearchBlacklist(url, items) {
  if (BLACKLIST_UTILS.isUrlBlocked) {
    return BLACKLIST_UTILS.isUrlBlocked(url, items);
  }
  return false;
}

function isSuggestionBlockedBySearchBlacklist(suggestion, items, queryForProvider) {
  if (!suggestion) {
    return false;
  }
  if (
    suggestion.type === 'newtab' ||
    suggestion.type === 'siteSearch' ||
    suggestion.type === 'inlineSiteSearch' ||
    suggestion.type === 'siteSearchPrompt'
  ) {
    return false;
  }
  if (suggestion.url && isUrlBlockedBySearchBlacklist(suggestion.url, items)) {
    return true;
  }
  return false;
}

function filterBlacklistedSuggestions(list, items, queryForProvider) {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  return list.filter((suggestion) => !isSuggestionBlockedBySearchBlacklist(suggestion, items, queryForProvider));
}

function mergeCustomProviders(baseItems, customItems) {
  if (typeof SEARCH_UTILS.mergeCustomProviders === 'function') {
    return SEARCH_UTILS.mergeCustomProviders(baseItems, customItems);
  }
  const merged = [];
  const seen = new Set();
  const baseMap = new Map((baseItems || []).map((item) => [String(item && item.key ? item.key : '').toLowerCase(), item]));
  customItems.forEach((item) => {
    if (item && item.disabled) {
      return;
    }
    const key = String(item.key || '').toLowerCase();
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push({
      ...item,
      action: String(item.action || (baseMap.get(key) && baseMap.get(key).action) || '').trim(),
      submitStrategy: String(item.submitStrategy || (baseMap.get(key) && baseMap.get(key).submitStrategy) || '').trim()
    });
  });
  baseItems.forEach((item) => {
    const key = String(item.key || '').toLowerCase();
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(item);
  });
  return merged;
}

function getSiteSearchProviderEntryUrl(provider, query) {
  if (!provider || !provider.template) {
    return '';
  }
  if (typeof SEARCH_UTILS.buildSearchUrlFromTemplate === 'function') {
    return SEARCH_UTILS.buildSearchUrlFromTemplate(provider.template, query || '');
  }
  return normalizeSiteSearchTemplate(provider.template).replace(/\{query\}/g, encodeURIComponent(String(query || '')));
}

function getTemplateDomain(template) {
  if (!template) {
    return '';
  }
  try {
    const url = template.replace(/\{query\}/g, 'test');
    return normalizeHost(new URL(url).hostname);
  } catch (e) {
    return '';
  }
}

function mergeSiteSearchProviders(localItems, bangList) {
  if (!Array.isArray(localItems) || localItems.length === 0) {
    return [];
  }
  if (!Array.isArray(bangList) || bangList.length === 0) {
    return localItems;
  }
  return localItems.map((item) => {
    const aliases = Array.isArray(item.aliases) ? item.aliases : [];
    const keys = [item.key, ...aliases].filter(Boolean).map((key) => String(key).toLowerCase());
    const domain = getTemplateDomain(item.template);
    let match = bangList.find((bang) => bang && keys.includes(String(bang.t || '').toLowerCase()));
    if (!match && domain) {
      match = bangList.find((bang) => bang && String(bang.d || '').toLowerCase().includes(domain));
    }
    if (!match || !match.u) {
      return item;
    }
    return {
      key: item.key,
      aliases: item.aliases || [],
      name: item.name || match.s || item.key,
      template: normalizeSiteSearchTemplate(match.u)
    };
  });
}

function parseBangList(text) {
  if (!text) {
    return [];
  }
  let jsonText = text.trim();
  if (jsonText.startsWith('/*')) {
    jsonText = jsonText.replace(/^\/\*.*?\*\/\s*/s, '');
  }
  if (!jsonText.startsWith('[')) {
    return [];
  }
  try {
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function loadSiteSearchProviders() {
  if (siteSearchCache) {
    return Promise.resolve(siteSearchCache);
  }
  if (siteSearchPromise) {
    return siteSearchPromise;
  }
  const localUrl = chrome.runtime.getURL('assets/data/site-search.json');
  const fallbackDefaults = typeof SEARCH_UTILS.getDefaultSiteSearchProviders === 'function'
    ? SEARCH_UTILS.getDefaultSiteSearchProviders()
    : [];
  siteSearchPromise = fetch(localUrl)
    .then((response) => response.json())
    .then((data) => {
      const items = data && Array.isArray(data.items) ? data.items : [];
      const source = items.length > 0 ? items : fallbackDefaults;
      return sanitizeSiteSearchProviders(source);
    })
    .catch(() => sanitizeSiteSearchProviders(fallbackDefaults));
  siteSearchPromise = siteSearchPromise.then((localItems) => {
    return localItems;
  }).then((items) => Promise.all([loadCustomSiteSearchProviders(), loadDisabledSiteSearchKeys()])
    .then(([customItems, disabledKeys]) => {
      const filteredBase = items.filter((item) => {
        const key = String(item && item.key ? item.key : '').toLowerCase();
        return key && !disabledKeys.includes(key);
      });
      const merged = mergeCustomProviders(filteredBase, customItems);
      siteSearchCache = merged;
      return merged;
    })).catch(() => {
    return loadCustomSiteSearchProviders().then((customItems) => {
      siteSearchCache = customItems;
      return customItems;
    });
  });
  return siteSearchPromise;
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (!storageAreaName || areaName !== storageAreaName) {
    return;
  }
  if (changes[RESTRICTED_ACTION_STORAGE_KEY]) {
    const next = changes[RESTRICTED_ACTION_STORAGE_KEY].newValue;
    restrictedActionCache = next === 'none' ? 'none' : 'default';
    if (typeof next !== 'undefined' && next !== restrictedActionCache && storageArea) {
      storageArea.set({ [RESTRICTED_ACTION_STORAGE_KEY]: restrictedActionCache });
    }
  }
  if (changes[DOCUMENT_PIP_ENABLED_STORAGE_KEY]) {
    const next = changes[DOCUMENT_PIP_ENABLED_STORAGE_KEY].newValue;
    const normalized = next === true;
    documentPipEnabledCache = normalized;
    if (typeof next !== 'undefined' && next !== normalized && storageArea) {
      storageArea.set({ [DOCUMENT_PIP_ENABLED_STORAGE_KEY]: normalized });
    }
  }
  if (changes[PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY]) {
    const next = changes[PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY].newValue;
    const normalized = next === true;
    pinnedTabRecoveryEnabledCache = normalized;
    if (typeof next !== 'undefined' && next !== normalized && storageArea) {
      storageArea.set({ [PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY]: normalized });
    }
    if (normalized) {
      schedulePersistPinnedTabSnapshot();
    }
  }
  if (changes[SITE_SEARCH_STORAGE_KEY] || changes[SITE_SEARCH_DISABLED_STORAGE_KEY]) {
    siteSearchCache = null;
    siteSearchPromise = null;
  }
  if (changes[SEARCH_BLACKLIST_STORAGE_KEY]) {
    searchBlacklistCache = null;
    searchBlacklistPromise = null;
  }
  if (changes[SEARCH_RESULT_SOURCE_TYPES_STORAGE_KEY]) {
    searchResultSourceTypesCache = null;
    searchResultSourceTypesPromise = null;
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[SEARCH_SELECTION_STATS_STORAGE_KEY]) {
    return;
  }
  searchSelectionStatsCache = normalizeSearchSelectionStats(
    changes[SEARCH_SELECTION_STATS_STORAGE_KEY].newValue
  );
  searchSelectionStatsPromise = null;
});

function withTimeout(promise, timeoutMs, fallbackValue) {
  const safePromise = promise
    .then((value) => value)
    .catch(() => fallbackValue);
  if (!timeoutMs || timeoutMs <= 0) {
    return safePromise;
  }
  return Promise.race([
    safePromise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallbackValue), timeoutMs);
    })
  ]);
}

function callChromeApiWithTimeout(invoke, fallbackValue, timeoutMs) {
  return withTimeout(new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };
    try {
      invoke(finish);
    } catch (e) {
      finish(fallbackValue);
    }
  }), timeoutMs, fallbackValue);
}

function invalidateBookmarkTreeCache() {
  bookmarkTreeIndexCache = {
    expiresAt: 0,
    map: null
  };
  bookmarkItemsCache = {
    expiresAt: 0,
    items: []
  };
  bookmarkTreeIndexPromise = null;
  bookmarkItemsPromise = null;
}

function ensureBookmarkTreeCacheListeners() {
  if (bookmarkTreeCacheListenersBound || !chrome || !chrome.bookmarks) {
    return;
  }
  const events = [
    chrome.bookmarks.onCreated,
    chrome.bookmarks.onRemoved,
    chrome.bookmarks.onChanged,
    chrome.bookmarks.onMoved,
    chrome.bookmarks.onChildrenReordered,
    chrome.bookmarks.onImportEnded
  ];
  events.forEach((eventTarget) => {
    if (eventTarget && typeof eventTarget.addListener === 'function') {
      eventTarget.addListener(invalidateBookmarkTreeCache);
    }
  });
  bookmarkTreeCacheListenersBound = true;
}

function buildBookmarkNodeMap(tree) {
  const bookmarkNodeMap = new Map();
  function indexBookmarkNodes(node, parentId) {
    if (!node || !node.id) {
      return;
    }
    bookmarkNodeMap.set(node.id, {
      title: node.title || '',
      parentId: parentId || null,
      hasUrl: Boolean(node.url)
    });
    if (Array.isArray(node.children)) {
      node.children.forEach((child) => indexBookmarkNodes(child, node.id));
    }
  }
  if (Array.isArray(tree)) {
    tree.forEach((node) => indexBookmarkNodes(node, null));
  }
  return bookmarkNodeMap;
}

function buildBookmarkItems(tree) {
  const items = [];
  function collectBookmarkNodes(node) {
    if (!node || !node.id) {
      return;
    }
    if (node.url) {
      items.push({
        id: node.id,
        parentId: node.parentId || null,
        title: node.title || '',
        url: node.url
      });
    }
    if (Array.isArray(node.children)) {
      node.children.forEach((child) => collectBookmarkNodes(child));
    }
  }
  if (Array.isArray(tree)) {
    tree.forEach((node) => collectBookmarkNodes(node));
  }
  return items;
}

function getBookmarkNodeMapCached() {
  const now = Date.now();
  if (bookmarkTreeIndexCache.map && bookmarkTreeIndexCache.expiresAt > now) {
    return Promise.resolve(bookmarkTreeIndexCache.map);
  }
  if (bookmarkTreeIndexPromise) {
    return bookmarkTreeIndexPromise;
  }
  if (!chrome || !chrome.bookmarks || typeof chrome.bookmarks.getTree !== 'function') {
    return Promise.resolve(new Map());
  }
  ensureBookmarkTreeCacheListeners();
  bookmarkTreeIndexPromise = callChromeApiWithTimeout((done) => {
    chrome.bookmarks.getTree((tree) => {
      const map = buildBookmarkNodeMap(tree);
      bookmarkTreeIndexCache = {
        map: map,
        expiresAt: Date.now() + BOOKMARK_TREE_CACHE_TTL_MS
      };
      bookmarkTreeIndexPromise = null;
      done(map);
    });
  }, new Map(), LOCAL_SUGGEST_SOURCE_TIMEOUT_MS).catch(() => {
    bookmarkTreeIndexPromise = null;
    return new Map();
  });
  return bookmarkTreeIndexPromise;
}

function getAllBookmarksCached() {
  const now = Date.now();
  if (Array.isArray(bookmarkItemsCache.items) && bookmarkItemsCache.expiresAt > now) {
    return Promise.resolve(bookmarkItemsCache.items);
  }
  if (bookmarkItemsPromise) {
    return bookmarkItemsPromise;
  }
  if (!chrome || !chrome.bookmarks || typeof chrome.bookmarks.getTree !== 'function') {
    return Promise.resolve([]);
  }
  ensureBookmarkTreeCacheListeners();
  bookmarkItemsPromise = callChromeApiWithTimeout((done) => {
    chrome.bookmarks.getTree((tree) => {
      const items = buildBookmarkItems(tree);
      bookmarkItemsCache = {
        items: items,
        expiresAt: Date.now() + BOOKMARK_TREE_CACHE_TTL_MS
      };
      bookmarkItemsPromise = null;
      done(items);
    });
  }, [], LOCAL_SUGGEST_SOURCE_TIMEOUT_MS).catch(() => {
    bookmarkItemsPromise = null;
    return [];
  });
  return bookmarkItemsPromise;
}

function getTopSitesCached() {
  const now = Date.now();
  if (topSitesCache.expiresAt > now && Array.isArray(topSitesCache.items)) {
    return Promise.resolve(topSitesCache.items);
  }
  if (!chrome || !chrome.topSites || typeof chrome.topSites.get !== 'function') {
    return Promise.resolve([]);
  }
  return callChromeApiWithTimeout((done) => {
    chrome.topSites.get((items) => {
      const list = Array.isArray(items) ? items : [];
      topSitesCache = {
        items: list,
        expiresAt: Date.now() + TOP_SITES_CACHE_TTL_MS
      };
      done(list);
    });
  }, [], LOCAL_SUGGEST_SOURCE_TIMEOUT_MS).catch(() => []);
}

function getFallbackHistoryItemsCached() {
  const now = Date.now();
  if (historyFallbackCache.expiresAt > now && Array.isArray(historyFallbackCache.items)) {
    return Promise.resolve(historyFallbackCache.items);
  }
  if (!chrome || !chrome.history || typeof chrome.history.search !== 'function') {
    return Promise.resolve([]);
  }
  return callChromeApiWithTimeout((done) => {
    chrome.history.search({
      text: '',
      maxResults: 240,
      startTime: Date.now() - (90 * 24 * 60 * 60 * 1000)
    }, (items) => {
      const list = Array.isArray(items) ? items : [];
      historyFallbackCache = {
        items: list,
        expiresAt: Date.now() + HISTORY_FALLBACK_CACHE_TTL_MS
      };
      done(list);
    });
  }, [], LOCAL_SUGGEST_SOURCE_TIMEOUT_MS).catch(() => []);
}

function normalizeAsciiQueryForPinyin(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

function shouldUseTitlePinyinMatch(value) {
  const normalized = normalizeAsciiQueryForPinyin(value);
  return Boolean(normalized) && /^[a-z]+$/.test(normalized);
}

function getChineseCharacters(text) {
  const matches = String(text || '').match(/[\u4e00-\u9fff]/g);
  return Array.isArray(matches) ? matches : [];
}

function buildTitlePinyinIndex(title) {
  const rawTitle = String(title || '').trim();
  if (!rawTitle) {
    return {
      full: '',
      initials: '',
      chineseLength: 0
    };
  }
  if (titlePinyinCache.has(rawTitle)) {
    return titlePinyinCache.get(rawTitle);
  }
  let full = '';
  let initials = '';
  const chineseChars = getChineseCharacters(rawTitle);
  try {
    if (globalThis.pinyinPro && typeof globalThis.pinyinPro.pinyin === 'function') {
      const converted = globalThis.pinyinPro.pinyin(rawTitle, {
        toneType: 'none',
        type: 'array',
        nonZh: 'removed',
        v: false
      });
      const syllables = (Array.isArray(converted) ? converted : [])
        .map((item) => String(item || '').toLowerCase().replace(/[^a-z]+/g, ''))
        .filter(Boolean);
      full = syllables.join('');
      initials = syllables.map((item) => item.charAt(0)).join('');
    }
  } catch (error) {
    full = '';
    initials = '';
  }
  const result = {
    full: full,
    initials: initials,
    chineseLength: chineseChars.length
  };
  titlePinyinCache.set(rawTitle, result);
  return result;
}

function getTitlePinyinMatchScore(title, normalizedQuery) {
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return {
      score: 0,
      reason: ''
    };
  }
  const index = buildTitlePinyinIndex(title);
  if (!index || (!index.full && !index.initials)) {
    return {
      score: 0,
      reason: ''
    };
  }
  if (index.full === normalizedQuery) {
    return {
      score: 42,
      reason: 'full-exact'
    };
  }
  if (index.full.startsWith(normalizedQuery)) {
    return {
      score: 28,
      reason: 'full-prefix'
    };
  }
  if (index.full.includes(normalizedQuery)) {
    return {
      score: 14,
      reason: 'full-contains'
    };
  }
  const canUseInitials = index.chineseLength >= 2 && normalizedQuery.length >= 2;
  if (canUseInitials && index.initials === normalizedQuery) {
    return {
      score: 18,
      reason: 'initials-exact'
    };
  }
  if (canUseInitials && index.initials.startsWith(normalizedQuery)) {
    return {
      score: 12,
      reason: 'initials-prefix'
    };
  }
  return {
    score: 0,
    reason: ''
  };
}

function mergeItemsByUrl(itemGroups) {
  const merged = [];
  const seenKeys = new Set();
  (Array.isArray(itemGroups) ? itemGroups : []).forEach((items) => {
    (Array.isArray(items) ? items : []).forEach((item) => {
      if (!item) {
        return;
      }
      const urlKey = typeof item.url === 'string' && item.url
        ? `url:${item.url}`
        : `id:${item.id || ''}:${item.title || ''}`;
      if (seenKeys.has(urlKey)) {
        return;
      }
      seenKeys.add(urlKey);
      merged.push(item);
    });
  });
  return merged;
}

// Function to get search suggestions from history and top sites
async function getSearchSuggestions(query) {
  const suggestions = [];
  const searchUtils = SEARCH_UTILS;
  const searchPolicy = searchUtils.SEARCH_POLICY || {
    lookupWindowDays: 180,
    lookupMaxResults: 120,
    maxEngineSuggestions: 5,
    candidatePoolLimit: 20,
    finalSuggestionLimit: 12,
    fallbackTopSiteLimit: 5
  };
  const context = typeof searchUtils.buildSearchQueryContext === 'function'
    ? searchUtils.buildSearchQueryContext(query, {
      normalizedPinyinQuery: shouldUseTitlePinyinMatch(query)
        ? normalizeAsciiQueryForPinyin(query)
        : ''
    })
    : {
      lookupQuery: String(query || ''),
      queryLower: String(query || '').trim().toLowerCase(),
      normalizedPinyinQuery: shouldUseTitlePinyinMatch(query)
        ? normalizeAsciiQueryForPinyin(query)
        : '',
      useTitlePinyinMatch: shouldUseTitlePinyinMatch(query),
      queryTerms: String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean),
      coreQueryTerms: String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean),
      intentType: 'object',
      hasSettingsIntent: false,
      hasInformationalIntent: false
    };
  if (!context.queryLower) {
    return [];
  }
  const lookupStartTime = Date.now() - (searchPolicy.lookupWindowDays * 24 * 60 * 60 * 1000);
  const lookupEndTime = Date.now();
  const lookupMaxResults = searchPolicy.lookupMaxResults || 120;
  const searchScoreOptions = {
    getTitlePinyinMatchScore,
    isLocalNetworkHost: shouldBlockFaviconForHost,
    isOwnExtensionUrl
  };
  const sourceTypes = await loadSearchResultSourceTypes();
  const sourceTypeSet = new Set(sourceTypes);
  const allowTopSites = sourceTypeSet.has('topSite');
  const allowBookmarks = sourceTypeSet.has('bookmark');
  const allowHistory = sourceTypeSet.has('history');

  try {
    const [
      engineSuggestions,
      historyItemsRaw,
      topSites,
      bookmarksRaw,
      fallbackHistoryItems,
      allBookmarks,
      searchBlacklistItems,
      searchSelectionStats
    ] = await Promise.all([
      withTimeout(
        fetchSearchSuggestionsForEngine(query)
        .then((items) => (Array.isArray(items) ? items.slice(0, searchPolicy.maxEngineSuggestions || 5) : []))
        .catch(() => []),
        SEARCH_ENGINE_SUGGEST_TIMEOUT_MS,
        []
      ),
      allowHistory
        ? callChromeApiWithTimeout((done) => {
          chrome.history.search({
            text: context.lookupQuery,
            maxResults: lookupMaxResults,
            startTime: lookupStartTime,
            endTime: lookupEndTime
          }, done);
        }, [], LOCAL_SUGGEST_SOURCE_TIMEOUT_MS)
        : Promise.resolve([]),
      allowTopSites ? getTopSitesCached() : Promise.resolve([]),
      allowBookmarks
        ? callChromeApiWithTimeout((done) => {
          chrome.bookmarks.search({ query: context.lookupQuery }, done);
        }, [], LOCAL_SUGGEST_SOURCE_TIMEOUT_MS)
        : Promise.resolve([]),
      allowHistory ? getFallbackHistoryItemsCached() : Promise.resolve([]),
      allowBookmarks ? getAllBookmarksCached() : Promise.resolve([]),
      loadSearchBlacklistItems(),
      loadSearchSelectionStats()
    ]);
    const collectSearchMatches = (items) => {
      if (typeof searchUtils.collectSearchMatches === 'function') {
        return searchUtils.collectSearchMatches(items, context, searchBlacklistItems, {
          getTitlePinyinMatchScore,
          isUrlBlockedBySearchBlacklist
        });
      }
      return (Array.isArray(items) ? items : []).filter((item) => {
        if (!item || !item.url || isUrlBlockedBySearchBlacklist(item.url, searchBlacklistItems)) {
          return false;
        }
        const titleLower = item.title ? item.title.toLowerCase() : '';
        const urlLower = item.url.toLowerCase();
        const pinyinMatch = context.useTitlePinyinMatch && item.title
          ? getTitlePinyinMatchScore(item.title, context.normalizedPinyinQuery).score > 0
          : false;
        return pinyinMatch || titleLower.includes(context.queryLower) || urlLower.includes(context.queryLower);
      });
    };
    const mergeSearchItems = typeof searchUtils.mergeItemsByUrl === 'function'
      ? searchUtils.mergeItemsByUrl
      : mergeItemsByUrl;
    const fallbackHistoryMatches = collectSearchMatches(fallbackHistoryItems);
    const historyItems = collectSearchMatches(mergeSearchItems([
      Array.isArray(historyItemsRaw) ? historyItemsRaw : [],
      fallbackHistoryMatches
    ]));
    const bookmarkTextMatches = collectSearchMatches(allBookmarks);
    const bookmarks = collectSearchMatches(mergeSearchItems([
      Array.isArray(bookmarksRaw) ? bookmarksRaw : [],
      bookmarkTextMatches
    ]));

    const bookmarkNodeMap = (Array.isArray(bookmarks) && bookmarks.length > 0)
      ? await getBookmarkNodeMapCached()
      : new Map();

    const rootFolderTitles = new Set([
      'Bookmarks bar',
      'Other bookmarks',
      'Mobile bookmarks',
      '书签栏',
      '其他书签',
      '移动设备书签'
    ]);

    function buildSuggestionReasons(item, sourceType) {
      const reasons = [];
      if (sourceType === 'bookmark') {
        reasons.push('来源：书签');
      } else if (sourceType === 'topSite') {
        reasons.push('来源：常用站点');
      } else if (sourceType === 'history') {
        reasons.push('来源：浏览历史');
      }
      const pinyinMatch = getTitlePinyinMatchScore(item && item.title, context.normalizedPinyinQuery);
      if (pinyinMatch.reason === 'initials-exact' || pinyinMatch.reason === 'initials-prefix') {
        reasons.push('标题首字母匹配');
      } else if (pinyinMatch.score > 0) {
        reasons.push('标题拼音匹配');
      }
      if (item && item.lastVisitTime) {
        const hoursSinceVisit = (Date.now() - item.lastVisitTime) / (1000 * 60 * 60);
        if (hoursSinceVisit < 24) {
          reasons.push('最近 24 小时访问');
        } else if (hoursSinceVisit < 72) {
          reasons.push('最近 3 天访问');
        }
      }
      const visitCount = Number(item && item.visitCount) || 0;
      if (visitCount > 1) {
        reasons.push(`访问 ${visitCount} 次`);
      }
      return reasons.slice(0, 3);
    }

    function buildSearchSuggestionFavicon(url) {
      if (isOwnExtensionUrl(url)) {
        return getOwnExtensionFaviconUrl();
      }
      try {
        const urlObj = new URL(url);
        const host = normalizeHost(urlObj.hostname);
        return shouldBlockFaviconForHost(host) ? '' : getGoogleFaviconUrl(host);
      } catch (e) {
        const fallbackHost = extractHostFromInput(url);
        return shouldBlockFaviconForHost(fallbackHost) ? '' : `${url}/favicon.ico`;
      }
    }

    function createSearchSuggestion(item, sourceType, score, extras) {
      if (typeof searchUtils.createSearchSuggestion === 'function') {
        return searchUtils.createSearchSuggestion(item, sourceType, score, extras);
      }
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

    function calculateSearchRelevanceScore(item, sourceType) {
      if (typeof searchUtils.calculateSearchRelevanceScore === 'function') {
        return searchUtils.calculateSearchRelevanceScore(item, sourceType, context, searchScoreOptions);
      }
      return 0;
    }

    function buildBookmarkPath(bookmark) {
      const pathParts = [];
      let parentId = bookmark && bookmark.parentId ? bookmark.parentId : bookmark && bookmark.id;
      while (parentId) {
        const node = bookmarkNodeMap.get(parentId);
        if (!node) {
          break;
        }
        const isRootFolder = !node.parentId && rootFolderTitles.has(node.title);
        if (!node.hasUrl && node.title && !isRootFolder) {
          pathParts.unshift(node.title);
        }
        parentId = node.parentId;
      }
      return pathParts.join('/');
    }

    const suggestionIndexByKey = new Map();
    const fallbackTopSites = [];

    function getSuggestionKey(item) {
      return typeof searchUtils.buildSearchDedupEntryKey === 'function'
        ? searchUtils.buildSearchDedupEntryKey(item)
        : (item && item.url ? item.url : '');
    }

    function upsertSuggestion(item, sourceType, extras) {
      if (!item || !item.url) {
        return null;
      }
      const itemKey = getSuggestionKey(item);
      const baseScore = calculateSearchRelevanceScore(item, sourceType);
      if (baseScore <= 0) {
        return null;
      }
      const normalizedExtras = extras && typeof extras === 'object' ? { ...extras } : {};
      const scoreAdjustment = Number(normalizedExtras.scoreAdjustment) || 0;
      delete normalizedExtras.scoreAdjustment;
      const selectionBoost = getSearchSelectionBoost(item, context, searchSelectionStats, searchScoreOptions);
      if (selectionBoost > 0) {
        normalizedExtras.selectionBoost = selectionBoost;
      }
      const suggestion = createSearchSuggestion(item, sourceType, baseScore + scoreAdjustment + selectionBoost, {
        favicon: buildSearchSuggestionFavicon(item.url),
        reasons: buildSuggestionReasons(item, sourceType),
        ...normalizedExtras
      });
      const existingIndex = suggestionIndexByKey.get(itemKey);
      if (typeof existingIndex === 'number') {
        suggestions[existingIndex] = suggestion;
      } else {
        suggestionIndexByKey.set(itemKey, suggestions.length);
        suggestions.push(suggestion);
      }
      return suggestion;
    }

    historyItems.forEach((item) => {
      if (!item || !item.title || isSearchEngineResultUrl(item.url)) {
        return;
      }
      upsertSuggestion(item, 'history');
    });

    (Array.isArray(topSites) ? topSites : []).forEach((site) => {
      if (!site || !site.url || isUrlBlockedBySearchBlacklist(site.url, searchBlacklistItems)) {
        return;
      }
      const itemKey = getSuggestionKey(site);
      const existingIndex = suggestionIndexByKey.get(itemKey);
      if (typeof existingIndex === 'number') {
        const existing = suggestions[existingIndex];
        suggestions[existingIndex] = {
          ...existing,
          isTopSite: true,
          score: (existing.score || 0) + 6
        };
        return;
      }

      const titleLower = site.title ? site.title.toLowerCase() : '';
      let scoreAdjustment = 4;
      try {
        const hostname = normalizeHost(new URL(site.url).hostname);
        if (hostname.startsWith(context.queryLower)) {
          scoreAdjustment += 8;
        }
      } catch (e) {
        // Ignore invalid URLs.
      }
      if (titleLower.startsWith(context.queryLower)) {
        scoreAdjustment += 6;
      }
      const suggestion = upsertSuggestion(site, 'topSite', { isTopSite: true, scoreAdjustment });
      if (!suggestion) {
        fallbackTopSites.push(site);
      }
    });

    bookmarks.forEach((bookmark) => {
      if (!bookmark || !bookmark.url) {
        return;
      }
      upsertSuggestion(bookmark, 'bookmark', {
        path: buildBookmarkPath(bookmark),
        scoreAdjustment: 4
      });
    });

    if (typeof searchUtils.buildSearchBrandDirectSuggestion === 'function') {
      const brandDirectSuggestion = searchUtils.buildSearchBrandDirectSuggestion(suggestions, context, {
        ...searchScoreOptions,
        buildFavicon: buildSearchSuggestionFavicon,
        buildReasons: buildSuggestionReasons
      });
      if (brandDirectSuggestion) {
        const directKey = getSuggestionKey(brandDirectSuggestion);
        const existingIndex = suggestionIndexByKey.get(directKey);
        if (typeof existingIndex === 'number') {
          suggestions[existingIndex] = brandDirectSuggestion;
        } else {
          suggestionIndexByKey.set(directKey, suggestions.length);
          suggestions.push(brandDirectSuggestion);
        }
      }
    }

    const engineSuggestionScore = typeof searchUtils.getSearchEngineSuggestionScore === 'function'
      ? searchUtils.getSearchEngineSuggestionScore(context, suggestions)
      : 160;
    engineSuggestions.forEach((suggestion) => {
      if (suggestion && suggestion !== context.lookupQuery) {
        const suggestionItem = {
          type: 'googleSuggest',
          title: suggestion,
          url: buildDefaultSearchUrl(suggestion),
          favicon: getDefaultSearchEngineFaviconUrl(),
          score: engineSuggestionScore,
          searchQuery: suggestion,
          forceSearch: true,
          reasons: ['来源：搜索建议']
        };
        if (!isSuggestionBlockedBySearchBlacklist(suggestionItem, searchBlacklistItems, suggestion)) {
          suggestions.push(suggestionItem);
        }
      }
    });

    suggestions.sort((a, b) => {
      if (typeof searchUtils.compareSearchSuggestions === 'function') {
        return searchUtils.compareSearchSuggestions(a, b);
      }
      return (b.score || 0) - (a.score || 0);
    });

    const uniqueSuggestions = [];
    const seenSuggestionKeys = new Set();
    for (let i = 0; i < suggestions.length && uniqueSuggestions.length < (searchPolicy.candidatePoolLimit || 20); i += 1) {
      const suggestion = suggestions[i];
      const suggestionKey = getSuggestionKey(suggestion);
      if (!suggestionKey || seenSuggestionKeys.has(suggestionKey)) {
        continue;
      }
      seenSuggestionKeys.add(suggestionKey);
      uniqueSuggestions.push(suggestion);
    }

    let finalSuggestions = filterBlacklistedSuggestions(uniqueSuggestions, searchBlacklistItems, context.lookupQuery);
    if (typeof searchUtils.filterSearchSuggestionsBySourceTypes === 'function') {
      finalSuggestions = searchUtils.filterSearchSuggestionsBySourceTypes(finalSuggestions, sourceTypes);
    }
    if (typeof searchUtils.applySearchSuggestionHostDiversity === 'function') {
      finalSuggestions = searchUtils.applySearchSuggestionHostDiversity(finalSuggestions);
    } else {
      finalSuggestions = finalSuggestions.slice(0, searchPolicy.finalSuggestionLimit || 12);
    }

    if (finalSuggestions.length === 0 && fallbackTopSites.length > 0) {
      const fallbackResults = fallbackTopSites
        .slice(0, searchPolicy.fallbackTopSiteLimit || 5)
        .map((site, index) => createSearchSuggestion(site, 'topSite', 1 - index, {
          favicon: buildSearchSuggestionFavicon(site.url),
          reasons: ['来源：常用站点']
        }));
      finalSuggestions = filterBlacklistedSuggestions(fallbackResults, searchBlacklistItems, context.lookupQuery);
    }

    return finalSuggestions;

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}
