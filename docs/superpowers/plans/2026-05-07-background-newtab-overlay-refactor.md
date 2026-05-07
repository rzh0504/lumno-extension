# Background Newtab Overlay Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Significantly shrink `src/background/background.js` and `src/newtab/newtab.js`, share the newtab/overlay search input, reduce avoidable `!important`, complete i18n coverage, centralize routes, and keep the visible UI/interaction contract unchanged.

**Architecture:** Keep MV3 entry files and script-loading style, but move self-contained runtime blocks into explicit global helpers loaded by `importScripts(...)`, `newtab.html`, or `chrome.scripting.executeScript({ files })`. Treat `background.js` and `newtab.js` as behavior contracts: shrink them by extracting stable modules, not by rewriting visual timing in place.

**Tech Stack:** Manifest V3 Chromium extension, plain JavaScript globals, Chrome extension APIs, static HTML/CSS, existing Node script tests.

---

## Current Snapshot

Observed from the current worktree on 2026-05-07:

| Area | Current read |
| --- | --- |
| Dirty files before this plan | `src/background/background.js`, `src/newtab/newtab.js` already have user/worktree edits; do not overwrite them during implementation. |
| `background.js` size | 12,315 lines; primary shrink target is the injected overlay controller currently embedded inside the service worker. |
| `newtab.js` size | 9,912 lines; primary shrink targets are recent sites, bookmarks, suggestions UI, input mode prefix, layout, and notices. |
| Existing shared input | `src/overlay/input-ui.js` already powers newtab via `newtab.html`; it should be promoted to a neutral shared component. |
| `!important` hotspots | `background.js`: 1009 literal `!important`, 195 `setProperty(..., 'important')`; `newtab.js`: 530 literal, 92 priority calls. |
| Locale parity | All locale files have 316 keys; `en` has one empty key: `settings_shortcuts_browser_desc_suffix`. |
| Existing route helpers | `src/background/extension-pages.js` and `src/background/newtab-fallback.js` exist, but route strings are still duplicated in background/newtab/tests. |

## Non-Negotiable Guardrails

- Preserve the current visual and interaction result first; file size reduction is valuable only when the extracted boundary is stable and testable.
- Do not bulk-delete `!important`. Every removal needs a replacement mechanism: class, data attribute, CSS variable, or stronger isolation.
- Keep outer injected overlay shell/geometry protections until browser validation proves they are unnecessary.
- Keep existing public globals during migrations, especially `window._x_extension_createSearchInput_2024_unique_`, so old call sites do not break mid-refactor.
- Every new runtime file must be added to load paths, `npm run check:js`, `scripts/check-manifest-resources.js`, `scripts/package-store.js`, and package validation.
- For UI work, validate both newtab and ordinary-page overlay in the same pass.

## Target File Structure

Create these modules gradually:

- `src/shared/extension-routes.js`: extension page paths, URL builders, URL classifiers, and route constants.
- `src/shared/search-input-ui.js`: neutral shared search input component; keeps the legacy global alias.
- `src/shared/search-input-mode.js`: shared site-search/AI prefix pill, Tab hint, mode badge, padding/caret synchronization.
- `src/shared/search-input.css`: static input/prefix CSS loaded by newtab document and overlay shadow root.
- `src/overlay/search-panel.js`: page-side overlay controller extracted from the embedded `toggleBlackRectangle(...)` body.
- `src/overlay/suggestions-view.css`: static shadow-root styles for overlay suggestion rows, action tags, tooltip, delete buttons.
- `src/newtab/page-notice.js`: file-access notice and notice query-param rendering.
- `src/newtab/toast.js`: toast creation, timing, and text update helpers.
- `src/newtab/layout.js`: search/root/bottom-dock measurement and class/data-state toggles.
- `src/newtab/recent-sites-store.js`: pinned/hidden/recent source normalization and cache logic.
- `src/newtab/recent-sites-view.js`: recent card DOM rendering and hover-only controls.
- `src/newtab/bookmarks-store.js`: bookmark tree, folder cache, pagination inputs.
- `src/newtab/bookmarks-view.js`: bookmark cards, breadcrumbs, pager, folder preview DOM.
- `src/newtab/suggestions-view.js`: newtab suggestion rows, action buttons, history delete UI.
- `scripts/audit-style-debt.js`: current `!important` / `cssText` / inline style write counts with an allowlist.
- `scripts/audit-i18n.js`: hardcoded user-facing string scanner with an allowlist.
- `scripts/test-extension-routes.js`: route builder/classifier tests.

Modify these existing files as needed:

- `manifest.json`
- `package.json`
- `scripts/check-manifest-resources.js`
- `scripts/package-store.js`
- `src/background/background.js`
- `src/background/extension-pages.js`
- `src/background/newtab-fallback.js`
- `src/newtab/newtab.html`
- `src/newtab/newtab.js`
- `src/overlay/input-ui.js` only as a compatibility shim if kept temporarily
- `_locales/en/messages.json`
- `_locales/zh_CN/messages.json`
- `_locales/zh_TW/messages.json`
- `_locales/zh_HK/messages.json`

## Visual Baseline Matrix

Before implementation, capture these as the baseline and repeat after each UI-sensitive task:

- Newtab, light and dark: initial load, focused input, query `lumno`, ArrowDown/ArrowUp, Backspace after inline autocomplete, `gm` + Tab, AI query text, Escape exit.
- Overlay on `https://lumno.kubai.design/release/`, light and dark if possible: hotkey open, focused input, query `lumno`, scrollable suggestions, history delete hover, `gm` + Tab, AI query text, Escape close.
- Overlay under hostile page CSS: inject a temporary rule like `body * { display: none !important; transform: rotate(2deg) !important; font-size: 44px !important; }` and confirm host/shadow input/results stay unchanged.
- Extension error page: clear old errors, reproduce newtab + overlay + AI provider, then confirm no new Lumno runtime errors.

Store screenshots and computed-style snapshots under `dist/.checks/refactor-baseline/` and `dist/.checks/refactor-after-task-N/`. Keep those files out of release packaging.

---

### Task 1: Freeze Baseline And Add Audits

**Files:**
- Create: `scripts/audit-style-debt.js`
- Create: `scripts/audit-i18n.js`
- Modify: `package.json`

- [x] Run the current safety checks before touching runtime code.

```bash
npm run check
npm run test:search
npm run test:site-search-store
npm run test:settings
npm run test:shortcut-rules
npm run test:url-guards
git diff --check
```

Expected: all pass. If a check fails before implementation, record the failure as baseline debt and do not mix its fix into a structural extraction commit.

- [x] Add `scripts/audit-style-debt.js` to report per-file counts for `!important`, `style.setProperty(..., 'important')`, `.style.cssText`, `.style.` writes, and `createElement(...)`.

Required output shape:

```text
src/background/background.js lines=12315 important=1009 setPropertyImportant=195 cssText=60 styleWrites=286 createElement=66
```

- [x] Add `scripts/audit-i18n.js` to scan user-facing string sinks: `textContent`, `innerText`, `placeholder`, `title`, `aria-label`, `confirm`, `alert`, static HTML text without `data-i18n`, and fallback arguments to local `t(...)` / `getMessage(...)`.

Allowlist exact categories:

```js
const ALLOWLIST = [
  'brand/provider names in assets/data/site-search.json and provider defaults',
  'AI provider remote page selector probes in src/background/ai-provider-submit.js',
  'browser built-in bookmark folder aliases used only for folder detection',
  'debug-only score reason strings when the debug flag is disabled by default'
];
```

- [x] Add package scripts:

```json
"audit:style": "node scripts/audit-style-debt.js",
"audit:i18n": "node scripts/audit-i18n.js"
```

- [x] Run the new audits and paste the summary into the implementation notes.

```bash
npm run audit:style
npm run audit:i18n
```

Expected: audits may report existing debt, but they must exit successfully unless a malformed locale file is detected.

Commit message: `Add refactor audit scripts`

Implementation note: Task 1 completed on 2026-05-07. Baseline `npm run check`, `npm run test:search`, `npm run test:site-search-store`, `npm run test:settings`, `npm run test:shortcut-rules`, `npm run test:url-guards`, and `git diff --check` passed. `npm run audit:style` reports `TOTAL files=31 lines=44898 important=1637 setPropertyImportant=355 cssText=121 styleWrites=782 createElement=298`. `npm run audit:i18n` reports locale parity is intact, with one existing empty English key `settings_shortcuts_browser_desc_suffix`, and 74 hardcoded string candidates for later i18n review.

---

### Task 2: Centralize Extension Routes

**Files:**
- Create: `src/shared/extension-routes.js`
- Create: `scripts/test-extension-routes.js`
- Modify: `src/background/background.js`
- Modify: `src/background/extension-pages.js`
- Modify: `src/background/newtab-fallback.js`
- Modify: `src/newtab/newtab.html`
- Modify: `src/newtab/newtab.js`
- Modify: `scripts/check-manifest-resources.js`
- Modify: `scripts/package-store.js`
- Modify: `package.json`

- [x] Create `LumnoExtensionRoutes` as a plain global in `src/shared/extension-routes.js`.

Required API:

```js
globalThis.LumnoExtensionRoutes = {
  ROUTE_PATHS: {
    newtab: 'src/newtab/newtab.html',
    options: 'src/options/options.html',
    optionsAppearance: 'src/options/options.html#appearance'
  },
  buildExtensionUrl(chromeApi, path),
  buildNewtabUrl(chromeApi, params),
  buildOptionsUrl(chromeApi, hash),
  isNewtabUrl(url),
  isOptionsUrl(url),
  classifyExtensionUrl(url)
};
```

- [x] Load the route helper before dependents:
  - `background.js`: `importScripts(chrome.runtime.getURL('src/shared/extension-routes.js'))` before background helpers.
  - `newtab.html`: add `<script src="../shared/extension-routes.js"></script>` before `newtab.js`.
  - packaging/resource scripts: add `src/shared/extension-routes.js` to injected/runtime file coverage.

- [x] Replace hardcoded page strings:
  - `src/background/background.js`: newtab/options open actions and Lumno newtab prefix checks.
  - `src/background/extension-pages.js`: options/open helpers.
  - `src/background/newtab-fallback.js`: file-access fallback URL.
  - `src/newtab/newtab.js`: appearance options link and self/options URL classification.
  - `scripts/test-newtab-fallback.js`: expected newtab URLs.

- [x] Add `scripts/test-extension-routes.js` with assertions for:
  - `buildNewtabUrl(chrome, { focus: true })` returns `chrome-extension://abc/src/newtab/newtab.html?focus=1`.
  - `buildNewtabUrl(chrome, { focus: true, notice: 'file-access' })` preserves both params.
  - `classifyExtensionUrl(...)` returns `newtab`, `options`, or `other`.

- [x] Run:

```bash
npm run test-extension-routes
npm run test:newtab-fallback
npm run check
git diff --check
```

Commit message: `Centralize extension routes`

Implementation note: Task 2 completed on 2026-05-07. Added `src/shared/extension-routes.js`, routed background/newtab/newtab-fallback/options fallbacks through it, loaded it in `background.js` and `newtab.html`, and covered it with `scripts/test-extension-routes.js`. Verified with `npm run test:extension-routes`, `npm run test:newtab-fallback`, `npm run check`, and `git diff --check`.

---

### Task 3: Promote The Search Input To Shared UI

**Files:**
- Create: `src/shared/search-input-ui.js`
- Create: `src/shared/search-input.css`
- Modify: `src/overlay/input-ui.js`
- Modify: `src/overlay/shell.js`
- Modify: `src/newtab/newtab.html`
- Modify: `src/newtab/newtab.js`
- Modify: `manifest.json`
- Modify: `scripts/check-manifest-resources.js`
- Modify: `scripts/package-store.js`
- Modify: `package.json`

- [x] Move the reusable input factory from `src/overlay/input-ui.js` to `src/shared/search-input-ui.js`.

Keep this compatibility alias:

```js
window._x_extension_createSearchInput_2024_unique_ = createSearchInput;
globalThis.LumnoSearchInputUI = { createSearchInput };
```

- [x] Move static declarations from `COMPONENT_STYLES` into `src/shared/search-input.css`.

Required class vocabulary:

```text
.x-lumno-search-input
.x-lumno-search-input__container
.x-lumno-search-input__field
.x-lumno-search-input__divider
.x-lumno-search-input__icon
.x-lumno-search-input__right-icon
.x-lumno-search-input__right-icon[data-hover-active="true"]
```

- [x] Keep JS responsible only for dynamic choices:
  - ids;
  - event listeners;
  - `data-visible`;
  - `data-hover-active`;
  - CSS variable overrides;
  - legacy non-isolated inline fallback if an injected page cannot load CSS.

- [x] Make `src/overlay/input-ui.js` a temporary shim that loads no duplicate styles and only forwards to `LumnoSearchInputUI` if older injection order still references it. Remove the shim in a later cleanup commit after all call sites use `src/shared/search-input-ui.js`.

- [x] Update load order:
  - `newtab.html`: load `../shared/search-input-ui.js` instead of `../overlay/input-ui.js`, plus `<link rel="stylesheet" href="../shared/search-input.css" />`.
  - overlay injection: include `src/shared/search-input-ui.js`; overlay shadow root links `src/shared/search-input.css`.
  - `manifest.json`: add `src/shared/search-input.css` to `web_accessible_resources` because the injected overlay shadow root loads it by runtime URL.

- [ ] Browser-check only the input shell before touching mode prefix or suggestions:
  - newtab input size, icon position, right settings icon, placeholder, underline visibility;
  - overlay input size, icon position, settings icon hover, placeholder, underline visibility;
  - hostile CSS overlay case.

- [x] Run:

```bash
node --check src/shared/search-input-ui.js
npm run check
npm run audit:style
git diff --check
```

Commit message: `Promote search input to shared UI`

Implementation note: Task 3 code migration completed on 2026-05-07. Added `src/shared/search-input-ui.js` and `src/shared/search-input.css`, changed `newtab.html` and overlay injection to load the shared input factory, kept `src/overlay/input-ui.js` as a compatibility shim, added the CSS to web-accessible resources, and packaged it successfully. Verified with `node --check src/shared/search-input-ui.js`, `node --check src/overlay/input-ui.js`, `npm run check`, `npm run test:extension-routes`, `npm run test:newtab-fallback`, `npm run audit:style`, `npm run package:store`, and `git diff --check`. Newtab visual smoke screenshot saved at `dist/.checks/refactor-after-task-3/newtab-shared-input.png`; full overlay browser interaction is still pending because Chrome Dev displayed a remote-debugging permission sheet and AppleScript JS/System Events control is disabled on this machine.

---

### Task 4: Share Input Mode Prefix, Tab Hint, And Padding Logic

**Files:**
- Create: `src/shared/search-input-mode.js`
- Modify: `src/background/background.js`
- Modify: `src/newtab/newtab.js`
- Modify: `src/newtab/newtab.html`
- Modify: `scripts/check-manifest-resources.js`
- Modify: `scripts/package-store.js`
- Modify: `package.json`

- [x] Extract duplicated prefix behavior into `LumnoSearchInputMode.createInputModeController(parts, options)`.

Required controller API:

```js
const controller = createInputModeController(inputParts, {
  surface: 'newtab',
  useImportantStyles: false,
  getThemeForMode,
  defaultTheme,
  getProviderIcon,
  getSiteSearchPrefixText,
  isAiSiteSearchProvider,
  attachFaviconData
});

controller.setProviderPrefix(provider, theme, { animate: true });
controller.clearProviderPrefix();
controller.setTabHintVisible(true);
controller.updateLayout();
controller.destroy();
```

- [x] Preserve exact constants unless browser validation proves a current value is wrong:
  - `prefixGap = 8`;
  - current prefix transition string;
  - base padding measured from computed `padding-left`;
  - AI-only prefix entry animation from the current dirty worktree behavior.

- [x] Keep surface differences data-driven:
  - newtab uses normal inline priority and page CSS;
  - overlay uses shadow CSS and only priority writes when host-page isolation requires it;
  - overlay and newtab can use different ids but the same class names.

- [x] Replace duplicated background/newtab prefix blocks with controller calls, preserving current call timing in:
  - site-search activation;
  - site-search exit;
  - `gm`/AI Tab entry;
  - Escape/backspace mode exit;
  - theme update/caret update.

- [ ] Validate:
  - `gm` + Tab prefix appears with the same icon, text, padding-left, caret color, and animation in both surfaces;
  - regular site-search prefix still has no AI icon unless current behavior says it should;
  - reduced motion disables entry animation as before.

Run:

```bash
node --check src/shared/search-input-mode.js
npm run check
npm run test:search
git diff --check
```

Commit message: `Share search input mode controller`

Implementation note: Task 4 code migration completed on 2026-05-07. Added `src/shared/search-input-mode.js`, loaded it in newtab and overlay injection order, and replaced duplicated prefix pill, Tab hint, right-padding, caret, and AI/site-search mode calls in `background.js` and `newtab.js` with `LumnoSearchInputMode.createInputModeController(...)`. Verified with `node --check src/shared/search-input-mode.js`, `node --check src/background/background.js`, `node --check src/newtab/newtab.js`, `npm run check`, `npm run test:search`, `npm run audit:style`, and `git diff --check`. Current style audit summary is `TOTAL files=35 lines=45257 important=1533 setPropertyImportant=334 cssText=115 styleWrites=726 createElement=291`. Newtab renders without a blank page in screenshot `dist/.checks/refactor-after-task-4/newtab-open.png`; DevTools validation confirmed `gm` + Tab enters Gemini mode with prefix visible, input `padding-left: 141px`, caret `rgb(66, 133, 244)`, and AI suggestion rendering, with screenshots `dist/.checks/refactor-after-task-4/newtab-gm-tab-devtools.png` and `dist/.checks/refactor-after-task-4/newtab-gemini-hello-devtools.png`. Overlay hotkey validation reached `shortcut-matched` and `trigger-overlay`, then exposed a helper-global issue (`Lumno: input UI helper not available.`); fixed shared input helpers to install on `window` first for injected overlay compatibility. Full post-fix overlay visual validation remains pending because `chrome.runtime.reload()` closed the selected DevTools target and the MCP session stopped accepting page-selection commands.

---

### Task 5: Extract Overlay Page Controller From Background

**Files:**
- Create: `src/overlay/search-panel.js`
- Modify: `src/background/background.js`
- Modify: `scripts/check-manifest-resources.js`
- Modify: `scripts/package-store.js`
- Modify: `package.json`

- [ ] Move the injected page-side overlay controller currently embedded in `toggleBlackRectangle(...)` into `src/overlay/search-panel.js`.

Required exported global:

```js
window._x_extension_toggleSearchOverlay_2026_unique_ = function(tabs, overlayContext) {
  // Existing page-side overlay behavior, moved with the smallest possible edits.
};
```

- [ ] Keep the service-worker side in `background.js` as orchestration only:
  - collect tabs/context;
  - inject files;
  - call `window._x_extension_toggleSearchOverlay_2026_unique_(tabs, overlayContext)` via `chrome.scripting.executeScript`;
  - handle injection errors and restricted-page fallback.

- [ ] Overlay injection order must become:

```js
[
  'src/shared/settings.js',
  'src/shared/search-utils.js',
  'src/shared/site-search-store.js',
  'src/shared/suggestion-navigation.js',
  'src/shared/search-input-ui.js',
  'src/shared/search-input-mode.js',
  'src/overlay/runtime.js',
  'src/overlay/favicon-view.js',
  'src/overlay/shell.js',
  'src/overlay/lifecycle.js',
  'src/overlay/search-panel.js'
]
```

- [ ] Do not rewrite suggestion rendering in this task. This is a move-only extraction plus call boundary change.

- [ ] Browser validation:
  - ordinary webpage overlay opens from hotkey;
  - input focuses;
  - query suggestions render;
  - `gm` + Tab works;
  - Enter/click actions still close/open as before;
  - Esc closes and cleanup leaves no duplicate overlay host.

Run:

```bash
node --check src/overlay/search-panel.js
npm run check
npm run test:shortcut-rules
npm run test:url-guards
git diff --check
```

Expected size effect: `background.js` should drop by several thousand lines. If it does not, the move boundary was too timid.

Commit message: `Extract overlay search panel runtime`

---

### Task 6: Split Newtab Data Stores From Newtab UI

**Files:**
- Create: `src/newtab/recent-sites-store.js`
- Create: `src/newtab/bookmarks-store.js`
- Modify: `src/newtab/newtab.html`
- Modify: `src/newtab/newtab.js`
- Modify: `package.json`

- [ ] Extract recent-site data logic into `LumnoNewtabRecentSitesStore`.

Required API:

```js
globalThis.LumnoNewtabRecentSitesStore = {
  normalizeRecentCount,
  normalizeRecentSiteItem,
  loadPinnedRecentSites(storage),
  savePinnedRecentSites(storage, items),
  loadHiddenRecentSites(storage),
  saveHiddenRecentSites(storage, items),
  mergeRecentSiteSources({ topSites, historyItems, tabs, pinned, hidden, limit, mode })
};
```

- [ ] Extract bookmark tree/cache logic into `LumnoNewtabBookmarksStore`.

Required API:

```js
globalThis.LumnoNewtabBookmarksStore = {
  findBookmarksBarNode,
  buildBookmarkNodeMap,
  buildBookmarkItemsFromChildren,
  buildBookmarkFolderCache,
  getBookmarkPageItems(items, page, limit)
};
```

- [ ] Keep rendering functions in `newtab.js` for this task. Only move plain object/tree logic.

- [ ] Add Node tests for pure store helpers if the functions can run without Chrome APIs:

```bash
node scripts/test-newtab-stores.js
```

- [ ] Validate newtab:
  - recent sites still respect hidden/pinned/max 3 behavior;
  - bookmarks still find the bookmarks bar in English and Chinese browser folder names;
  - folder navigation and pagination unchanged.

Run:

```bash
node --check src/newtab/recent-sites-store.js
node --check src/newtab/bookmarks-store.js
npm run check
npm run test:settings
git diff --check
```

Commit message: `Extract newtab data stores`

---

### Task 7: Split Newtab Views And Layout State

**Files:**
- Create: `src/newtab/page-notice.js`
- Create: `src/newtab/toast.js`
- Create: `src/newtab/layout.js`
- Create: `src/newtab/recent-sites-view.js`
- Create: `src/newtab/bookmarks-view.js`
- Modify: `src/newtab/newtab.html`
- Modify: `src/newtab/newtab.js`
- Modify: `package.json`

- [ ] Extract the notice banner into `LumnoNewtabPageNotice`.

Required API:

```js
renderPageNotice({
  params,
  chromeApi,
  messages,
  onClose,
  openExtensionDetailsPage
});
```

- [ ] Extract toast helpers into `LumnoNewtabToast.createToastController(toastElement, { t })`.

Required methods:

```js
toast.show(message, options);
toast.hide();
toast.destroy();
```

- [ ] Extract layout writes into `LumnoNewtabLayout.createLayoutController(...)`.

Responsibilities:
  - `updateSearchEntryLayout`;
  - search root width/content width CSS variables;
  - bottom dock placement;
  - suggestions surface/outline positioning;
  - class/data-state toggles instead of display `!important` where safe.

- [ ] Extract recent/bookmark DOM rendering into view modules only after store extraction is stable.

Required view pattern:

```js
const recentView = createRecentSitesView({
  document,
  t,
  formatMessage,
  faviconViewRuntime,
  onOpen,
  onPinToggle,
  onDismiss
});
recentView.render(items, state);
recentView.destroy();
```

- [ ] Validate:
  - no new blank newtab page;
  - focus-on-load still works;
  - recent cards, hover actions, pinned limit toast, and bookmark folder hover previews match baseline screenshots.

Run:

```bash
npm run check
npm run audit:style
git diff --check
```

Expected size effect: `newtab.js` should drop by at least 2,000 lines across Tasks 6 and 7.

Commit message: `Extract newtab layout and card views`

---

### Task 8: Extract Newtab Suggestions View

**Files:**
- Create: `src/newtab/suggestions-view.js`
- Modify: `src/newtab/newtab.html`
- Modify: `src/newtab/newtab.js`
- Modify: `package.json`

- [ ] Move suggestion row DOM rendering, action tags, hover state, history delete button, tooltip attachment, and row icon setup to `LumnoNewtabSuggestionsView`.

Required API:

```js
const suggestionsView = createSuggestionsView({
  document,
  t,
  formatMessage,
  getRiSvg,
  faviconViewRuntime,
  getThemeForSuggestion,
  getImmediateThemeForSuggestion,
  onActivate,
  onDeleteHistory,
  onSetSelectedIndex
});

suggestionsView.render({ suggestions, query, selectedIndex, primarySuggestion, primaryHighlightReason });
suggestionsView.updateSelection(selectedIndex);
suggestionsView.clear();
suggestionsView.destroy();
```

- [ ] Preserve keyboard semantics in `newtab.js`; move DOM painting only.

- [ ] Convert suggestion row visual state to class/data-state where possible:
  - `data-selected`;
  - `data-hover`;
  - `data-autocomplete-top`;
  - `data-history-delete-visible`;
  - CSS variables for theme colors.

- [ ] Validate:
  - first result promotion;
  - inline autocomplete;
  - ArrowUp/ArrowDown wrap and scroll;
  - history delete hover color;
  - site-search prompt activation;
  - command rows for new tab and settings.

Run:

```bash
npm run check
npm run test:search
npm run audit:style
git diff --check
```

Commit message: `Extract newtab suggestions view`

---

### Task 9: Reduce `!important` In Verified Layers

**Files:**
- Modify: `src/newtab/newtab.html`
- Modify: `src/newtab/newtab.js`
- Modify: `src/newtab/suggestions-view.js`
- Modify: `src/newtab/recent-sites-view.js`
- Modify: `src/newtab/bookmarks-view.js`
- Modify: `src/overlay/search-panel.js`
- Modify: `src/overlay/suggestions-view.css`
- Modify: `src/overlay/shell.js`
- Modify: `src/newtab/favicon-view.js`
- Modify: `src/overlay/favicon-view.js`
- Modify: `scripts/audit-style-debt.js`

- [ ] Establish an allowlist in `scripts/audit-style-debt.js`:
  - overlay host fixed geometry;
  - overlay panel z-index/visibility/transform/opacity/filter;
  - overlay viewport/zoom synchronization;
  - favicon optical alignment until class-rendered fallback is verified.

- [ ] Newtab first pass:
  - suggestion row hover/selected/action state to class/data-state;
  - history delete button state to class/data-state;
  - bookmark/recent section visibility to classes;
  - bottom dock static CSS to HTML stylesheet, JS only sets CSS variables.

- [ ] Overlay first pass:
  - move shadow-root suggestion row, tag, tooltip, and visit/delete button styles into `src/overlay/suggestions-view.css`;
  - JS sets `data-selected`, `data-hover`, `data-action-visible`, and CSS variables;
  - preserve external shell protections.

- [ ] Favicon pass:
  - replace display/filter/opacity state writes with classes where both overlay and newtab visual transitions match screenshots.

- [ ] Run audits after each group and record before/after counts in `docs/0.9.9-background-newtab-refactor-audit.md`.

Run:

```bash
npm run audit:style
npm run check
git diff --check
```

Commit message: `Reduce verified inline important styles`

---

### Task 10: Complete I18n Coverage

**Files:**
- Modify: `_locales/en/messages.json`
- Modify: `_locales/zh_CN/messages.json`
- Modify: `_locales/zh_TW/messages.json`
- Modify: `_locales/zh_HK/messages.json`
- Modify: `src/background/background.js`
- Modify: `src/newtab/newtab.js`
- Modify: `src/options/options.js`
- Modify: `scripts/audit-i18n.js`

- [ ] Fix the existing empty English key:

```json
"settings_shortcuts_browser_desc_suffix": {
  "message": "Browser reserved shortcuts may need to be assigned manually."
}
```

- [ ] Convert confirmed user-facing hardcoded strings to message keys:
  - newtab recent heading fallback: `最常访问` / `最近访问`;
  - newtab recent dismiss and unpin/dismiss copy;
  - options confirm dialogs for reset/clear actions;
  - blacklist scope labels/descriptions/examples;
  - background visible ranking/debug reason strings if they can appear in the UI;
  - any placeholder/title/aria-label/textContent literal reported by the audit and not allowlisted.

- [ ] Keep these allowlisted:
  - provider names like `百度`, `搜狗`, `豆包` when they are data/brand labels;
  - remote AI-page selectors in `ai-provider-submit.js`;
  - browser bookmark folder aliases used for detection;
  - one-character separators like `/`, `*`, `Tab`, and keyboard key labels.

- [ ] Keep zh-TW and zh-HK aligned to zh-CN meaning, with script/wording adapted only where needed.

- [ ] Run:

```bash
npm run audit:i18n
npm run check
node -e "for (const l of ['en','zh_CN','zh_TW','zh_HK']) { const p='_locales/'+l+'/messages.json'; JSON.parse(require('fs').readFileSync(p,'utf8')); console.log(l, 'ok'); }"
git diff --check
```

Commit message: `Complete i18n coverage`

---

### Task 11: Final Route And Message Router Cleanup

**Files:**
- Create: `src/background/message-router.js`
- Modify: `src/background/background.js`
- Modify: `scripts/check-manifest-resources.js`
- Modify: `scripts/package-store.js`
- Modify: `package.json`

- [ ] Extract only the generic route dispatch machinery from `background.js` into `src/background/message-router.js`.

Required API:

```js
globalThis.LumnoBackgroundMessageRouter = {
  createRouter(routeGroups),
  dispatch(router, request, sender, sendResponse)
};
```

- [ ] Keep handlers in `background.js` unless a handler group has explicit dependencies and no implicit globals.

- [ ] After extraction, move low-risk handler groups one at a time only if they accept a dependency object:
  - `extensionPages`;
  - `localeAndPermissions`;
  - `shortcuts` rule loading;
  - `newtabFallback`.

- [ ] Do not move search, ranking, favicon resolver, or overlay-open orchestration in this task unless tests and browser validation cover the full path.

Run:

```bash
node --check src/background/message-router.js
npm run check
npm run test:shortcut-rules
npm run test:newtab-fallback
git diff --check
```

Commit message: `Extract background message router`

---

### Task 12: Final Verification And Package Gate

**Files:**
- Modify: `docs/0.9.9-background-newtab-refactor-audit.md`

- [ ] Update the audit doc with:
  - final line counts;
  - final `!important` counts;
  - extracted module map;
  - i18n audit result;
  - route helper coverage;
  - browser validation notes.

- [ ] Run the full automatic suite:

```bash
npm run check
npm run audit:style
npm run audit:i18n
npm run test:search
npm run test:site-search-store
npm run test:settings
npm run test:shortcut-rules
npm run test:url-guards
npm run test:newtab-fallback
npm run package:store
git diff --check
```

- [ ] Browser validation:
  - newtab baseline matrix;
  - overlay baseline matrix;
  - hostile CSS overlay case;
  - extension errors page after repro;
  - packaged zip loads unpacked if package membership changed substantially.

- [ ] Stop if a visual mismatch appears. Fix the mismatch before doing further cleanup, because otherwise later file movement will hide the cause.

Commit message: `Document refactor verification`

---

## Other Worthwhile Optimizations

- Add small fixture tests comparing `getSearchSuggestions` results for overlay and newtab contexts so ranking changes do not silently diverge.
- Add a disposable debug script that lists active extension errors after browser repro, because old Chrome extension errors have previously made refactors look broken after the code was already fixed.
- Replace repeated storage-change listener setup with small lifecycle/disposer helpers, especially in overlay and newtab modules.
- Keep page-side injected globals namespaced under `window.__LumnoRuntime` in a later cleanup once the shared modules are stable.
- Consider a no-bundler build manifest file that lists runtime scripts once, then generates `package.json` check commands and resource allowlists; this would reduce the current duplicate script lists in `package.json`, `check-manifest-resources.js`, and `package-store.js`.

## Completion Criteria

- `background.js` is mostly service-worker orchestration and routing, not page-side overlay rendering.
- `newtab.js` owns page composition and high-level state, not recent/bookmark/suggestion DOM details.
- Newtab and overlay search input share one implementation and one CSS source, with surface-specific options.
- Avoidable `!important` is reduced in self-owned pages and shadow-root internals; protective overlay shell priorities remain documented.
- `npm run audit:i18n` reports no unreviewed user-facing strings.
- Extension routes are centralized and tested.
- Newtab and overlay screenshots/interactions match baseline.
