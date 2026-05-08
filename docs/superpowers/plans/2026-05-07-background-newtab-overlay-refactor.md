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

- [x] Validate:
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

Implementation note: Task 4 code migration completed on 2026-05-07. Added `src/shared/search-input-mode.js`, loaded it in newtab and overlay injection order, and replaced duplicated prefix pill, Tab hint, right-padding, caret, and AI/site-search mode calls in `background.js` and `newtab.js` with `LumnoSearchInputMode.createInputModeController(...)`. Verified with `node --check src/shared/search-input-mode.js`, `node --check src/background/background.js`, `node --check src/newtab/newtab.js`, `npm run check`, `npm run test:search`, `npm run audit:style`, and `git diff --check`. Current style audit summary is `TOTAL files=35 lines=45257 important=1533 setPropertyImportant=334 cssText=115 styleWrites=726 createElement=291`. Newtab renders without a blank page in screenshot `dist/.checks/refactor-after-task-4/newtab-open.png`; DevTools validation confirmed `gm` + Tab enters Gemini mode with prefix visible, input `padding-left: 141px`, caret `rgb(66, 133, 244)`, and AI suggestion rendering, with screenshots `dist/.checks/refactor-after-task-4/newtab-gm-tab-devtools.png` and `dist/.checks/refactor-after-task-4/newtab-gemini-hello-devtools.png`. Overlay hotkey validation reached `shortcut-matched` and `trigger-overlay`, then exposed a helper-global issue (`Lumno: input UI helper not available.`); fixed shared input helpers to install on `window` first for injected overlay compatibility. Post-fix overlay validation was completed with Computer Use against the existing Chrome Dev session on `https://lumno.kubai.design/release/`. `chrome://extensions/shortcuts` showed this browser's Lumno command is `⌘T`, not `⌘⇧K`; pressing `⌘T` opened the overlay on an ordinary webpage, focused the shared input, and rendered suggestions. `gm` + Tab showed the Gemini prefix with stable padding/positioning, entering `hello` rendered the AI suggestion, and Escape closed the overlay cleanly. Screenshots are saved at `dist/.checks/refactor-after-task-4/overlay-open-real-shortcut.png`, `dist/.checks/refactor-after-task-4/overlay-gm-tab-real-shortcut.png`, and `dist/.checks/refactor-after-task-4/overlay-gemini-hello-real-shortcut.png`. During this validation, Gemini prompt submit needed a small runtime fix: after Enter, the helper now keeps watching briefly for Gemini's nearby send button, covered by `scripts/test-ai-provider-submit.js`.

Follow-up validation after the Gemini submit and prefix padding fixes passed on 2026-05-07 with `npm run check`, `npm run test:search`, `npm run test:ai-provider-submit`, `npm run test:extension-routes`, `npm run test:newtab-fallback`, `npm run test:shortcut-rules`, `npm run test:url-guards`, `npm run audit:style`, `npm run audit:i18n`, and `git diff --check`. The current style audit summary is `TOTAL files=35 lines=45276 important=1533 setPropertyImportant=334 cssText=115 styleWrites=726 createElement=291`; the i18n audit still reports locale parity intact, one existing empty English key `settings_shortcuts_browser_desc_suffix`, and 74 hardcoded string candidates.

---

### Task 5: Extract Overlay Page Controller From Background

**Files:**
- Create: `src/overlay/search-panel.js`
- Modify: `src/background/background.js`
- Modify: `scripts/check-manifest-resources.js`
- Modify: `scripts/package-store.js`
- Modify: `package.json`

- [x] Move the injected page-side overlay controller currently embedded in `toggleBlackRectangle(...)` into `src/overlay/search-panel.js`.

Required exported global:

```js
window._x_extension_toggleSearchOverlay_2026_unique_ = function(tabs, overlayContext) {
  // Existing page-side overlay behavior, moved with the smallest possible edits.
};
```

- [x] Keep the service-worker side in `background.js` as orchestration only:
  - collect tabs/context;
  - inject files;
  - call `window._x_extension_toggleSearchOverlay_2026_unique_(tabs, overlayContext)` via `chrome.scripting.executeScript`;
  - handle injection errors and restricted-page fallback.

- [x] Overlay injection order must become:

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

- [x] Do not rewrite suggestion rendering in this task. This is a move-only extraction plus call boundary change.

- [x] Browser validation:
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

Implementation note: Task 5 completed on 2026-05-07. Extracted the 6,762-line page-side overlay controller from `src/background/background.js` into `src/overlay/search-panel.js` as `window._x_extension_toggleSearchOverlay_2026_unique_`. `background.js` now builds an `overlayInjectionFiles` list, injects `src/overlay/search-panel.js` after the existing shared/overlay helpers, and calls the global helper through `chrome.scripting.executeScript(...)` with fallback handling if the helper is missing. Added the new file to `package.json` syntax checks plus `scripts/check-manifest-resources.js` and `scripts/package-store.js`. Size effect: `src/background/background.js` is now 5,328 lines, and `src/overlay/search-panel.js` is 6,764 lines. Verified with `node --check src/background/background.js`, `node --check src/overlay/search-panel.js`, `npm run check`, `npm run test:search`, `npm run test:ai-provider-submit`, `npm run test:extension-routes`, `npm run test:newtab-fallback`, `npm run test:shortcut-rules`, `npm run test:url-guards`, `npm run audit:style`, `npm run audit:i18n`, `git diff --check`, and `npm run package:store`. The style audit summary after extraction is `TOTAL files=36 lines=45310 important=1533 setPropertyImportant=334 cssText=115 styleWrites=726 createElement=291`; `background.js` now has `important=0` and `setPropertyImportant=0`, with the remaining overlay style debt living in `src/overlay/search-panel.js`. Browser validation used the existing Chrome Dev session on `https://lumno.kubai.design/release/`: `⌘T` opened the overlay, the input focused, suggestions rendered, `gm` + Tab entered Gemini mode, typing `hello` rendered the AI suggestion, Escape closed cleanly, and clicking the first open-tab switch action closed the overlay and switched to the target tab. Screenshots are saved at `dist/.checks/refactor-after-task-5/overlay-open-after-search-panel.png`, `dist/.checks/refactor-after-task-5/overlay-gm-tab-after-search-panel.png`, and `dist/.checks/refactor-after-task-5/overlay-gemini-hello-after-search-panel.png`.

---

### Task 6: Split Newtab Data Stores From Newtab UI

**Files:**
- Create: `src/newtab/recent-sites-store.js`
- Create: `src/newtab/bookmarks-store.js`
- Modify: `src/newtab/newtab.html`
- Modify: `src/newtab/newtab.js`
- Modify: `package.json`

- [x] Extract recent-site data logic into `LumnoNewtabRecentSitesStore`.

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

- [x] Extract bookmark tree/cache logic into `LumnoNewtabBookmarksStore`.

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

- [x] Keep rendering functions in `newtab.js` for this task. Only move plain object/tree logic.

- [x] Add Node tests for pure store helpers if the functions can run without Chrome APIs:

```bash
node scripts/test-newtab-stores.js
```

- [x] Validate newtab:
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

Implementation note: Task 6 completed on 2026-05-07. Added `src/newtab/recent-sites-store.js` for recent count normalization, pinned/hidden persistence normalization, recent-site identity checks, source merging, and pinned merge behavior; added `src/newtab/bookmarks-store.js` for bookmarks-bar detection, bookmark node/folder caches, folder paths, and pagination. `newtab.js` now delegates those pure data paths while keeping DOM rendering and interaction wiring in place for the next view/layout split. Size effect: `src/newtab/newtab.js` is now 9,264 lines, with `recent-sites-store.js` at 395 lines and `bookmarks-store.js` at 260 lines. Verified with `node --check src/newtab/recent-sites-store.js`, `node --check src/newtab/bookmarks-store.js`, `node --check src/newtab/newtab.js`, `node --check scripts/test-newtab-stores.js`, `npm run test:newtab-stores`, `npm run test:settings`, `npm run test:search`, `npm run check`, `npm run audit:style`, `npm run audit:i18n`, `git diff --check`, and `npm run package:store`. Browser validation used the existing Chrome Dev session: after clearing old extension errors, the newtab rendered the shared search input, bookmarks, and recent sites; typing `gm` showed suggestions and the Tab hint, pressing Tab entered Gemini mode, typing `hello` rendered the AI suggestion, and no `ReferenceError`/initialization errors reappeared. Screenshot saved at `dist/.checks/refactor-after-task-6/newtab-gemini-hello-clean-errors.png`. A separate pre-existing/newly reproducible CloudFront CSP noise remains visible on the extension errors page and should be investigated separately from this data-store extraction.

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

- [x] Extract the notice banner into `LumnoNewtabPageNotice`.

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

- [x] Extract toast helpers into `LumnoNewtabToast.createToastController(toastElement, { t })`.

Required methods:

```js
toast.show(message, options);
toast.hide();
toast.destroy();
```

- [x] Extract layout writes into `LumnoNewtabLayout.createLayoutController(...)`.

Responsibilities:
  - `updateSearchEntryLayout`;
  - search root width/content width CSS variables;
  - bottom dock placement;
  - suggestions surface/outline positioning;
  - class/data-state toggles instead of display `!important` where safe.

- [x] Extract recent/bookmark DOM rendering into view modules only after store extraction is stable.

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

- [x] Validate:
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

Implementation note: Task 7 partial progress on 2026-05-07. Added `src/newtab/page-notice.js` for the file-access notice renderer and `src/newtab/toast.js` for toast timing/state; `newtab.js` now keeps the file-access permission decision and delegates banner/toast DOM helpers. This intentionally leaves layout writes and recent/bookmark card views in `newtab.js` for a separate, more visual validation pass. Size effect for this slice: `src/newtab/newtab.js` dropped from 9,263 to 9,217 lines. Verified with `node --check src/newtab/page-notice.js`, `node --check src/newtab/toast.js`, `node --check src/newtab/newtab.js`, `npm run check`, `npm run audit:style`, `npm run test:newtab-stores`, `git diff --check`, and `npm run package:store`. Browser validation used Chrome Dev: newtab loaded without a blank page, focus-on-load still landed in the input, `gm` + Tab entered Gemini mode, `hello` rendered the AI suggestion, and the `notice=file-access` URL path rewrote back to `focus=1` on this machine because file URL access is already allowed. Screenshot saved at `dist/.checks/refactor-after-task-7/newtab-notice-toast-slice.png`.

Implementation note: Task 7 layout slice completed on 2026-05-07. Added `src/newtab/layout.js` with `LumnoNewtabLayout.createLayoutController(...)` for search/content width variables, search vertical placement, bottom dock visibility/measurement, and suggestions surface/outline positioning. `newtab.js` keeps its existing wrapper function names and delegates to the controller so existing rendering and event flow stay stable. This slice intentionally does not remove display-related `!important` from the bottom dock/suggestions path yet because those values are layout-sensitive and need a dedicated parity pass. Size effect for this slice: `src/newtab/newtab.js` dropped from 9,217 to 9,032 lines; `src/newtab/layout.js` is 358 lines. Verified with `node --check src/newtab/layout.js`, `node --check src/newtab/newtab.js`, `npm run check`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:newtab-stores`, `npm run test:search`, `git diff --check`, and `npm run package:store`. Browser validation used the existing Chrome Dev window without starting a second Chrome instance: the newtab loaded without a blank page, focus-on-load landed in the input, `gm` showed the suggestions dropdown with Gemini/history/bookmark results, and bookmarks/recent cards remained visible and aligned. DevTools MCP had a stale closed-page handle during this pass, so validation used Computer Use accessibility state plus a screenshot at `dist/.checks/refactor-after-task-7/newtab-layout-gm-suggestions.png`.

Implementation note: Task 7 recent/bookmark card-view slice completed on 2026-05-07. Added `src/newtab/recent-sites-view.js` and `src/newtab/bookmarks-view.js` so recent card DOM, pin/dismiss button wiring, bookmark card DOM, folder preview hover behavior, empty-folder rendering, and bookmark card cache trimming live outside `newtab.js`. `newtab.js` keeps data loading, hidden/pinned persistence, pagination state, section visibility, and layout refresh callbacks. Size effect: style audit now reads `src/newtab/newtab.js lines=7245`, `src/newtab/recent-sites-view.js lines=435`, and `src/newtab/bookmarks-view.js lines=377`; `newtab.js` style writes dropped from `83` to `81` and `createElement` dropped from `47` to `27`, while total audited style debt stayed at `TOTAL important=1003 setPropertyImportant=237 cssText=81 styleWrites=606 createElement=283`. Verified with `node --check src/newtab/recent-sites-view.js`, `node --check src/newtab/bookmarks-view.js`, `node --check src/newtab/newtab.js`, `npm run check`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:newtab-stores`, and `npm run test:search`. Browser validation used the existing Chrome Dev window: after reloading the unpacked extension, the newtab loaded without blanking, bookmarks/recent cards stayed aligned, `gm` rendered suggestions, `Tab` entered Gemini mode, `hello` rendered the Gemini suggestion row, bookmark folder navigation showed breadcrumbs and folder contents, and clicking an unpinned recent-site pin at the 3-card cap showed the existing max-limit toast. Screenshot saved at `dist/.checks/refactor-after-task-7/newtab-card-views.png`.

---

### Task 8: Extract Newtab Suggestions View

**Files:**
- Create: `src/newtab/suggestions-view.js`
- Modify: `src/newtab/newtab.html`
- Modify: `src/newtab/newtab.js`
- Modify: `package.json`

- [x] Move suggestion row DOM rendering, action tags, hover state, history delete button, tooltip attachment, and row icon setup to `LumnoNewtabSuggestionsView`.

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

- [x] Preserve keyboard semantics in `newtab.js`; move DOM painting only.

- [x] Convert suggestion row visual state to class/data-state where possible:
  - `data-selected`;
  - `data-hover`;
  - `data-autocomplete-top`;
  - `data-history-delete-visible`;
  - CSS variables for theme colors.

- [x] Validate:
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

Implementation note: Task 8 completed on 2026-05-07. Added `src/newtab/suggestions-view.js` with `LumnoNewtabSuggestionsView.createSuggestionsView(...)`, moved search suggestion rows, open-tab switch rows, action tags, history delete controls, tooltip attachment, row icon setup, and selected/hover painting out of `newtab.js`. `newtab.js` keeps suggestion ranking, autocomplete, selected-index movement, scrolling, and activation semantics. Moved suggestion favicon, mark, URL line, action tag, tab switch button, and non-favicon icon emphasis styling into `newtab.html` classes/data attributes. Size and style effect: style audit now reads `src/newtab/newtab.js lines=7716` and `src/newtab/suggestions-view.js lines=875`; style audit changed from `TOTAL important=1186 setPropertyImportant=250 cssText=95 styleWrites=639` to `TOTAL important=1003 setPropertyImportant=237 cssText=81 styleWrites=606`; `src/newtab/newtab.js` changed from `important=183 setPropertyImportant=13 cssText=19 styleWrites=135` to `important=0 setPropertyImportant=0 cssText=5 styleWrites=83`. Verified with `node --check src/newtab/suggestions-view.js`, `node --check src/newtab/newtab.js`, `npm run check`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run test:newtab-stores`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: the newtab loaded without blanking, `gm` rendered the suggestions list, ArrowDown/ArrowUp moved highlight, `Tab` entered Gemini mode, `hello` rendered the AI suggestion row, `/s` rendered the settings command row, and `/n` rendered the new-tab command row. DevTools MCP still reported a stale closed selected page, so console inspection was not available in this pass; screenshot saved at `dist/.checks/refactor-after-task-8/newtab-suggestions-view-gemini.png`.

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

- [x] Establish an allowlist in `scripts/audit-style-debt.js`:
  - overlay host fixed geometry;
  - overlay panel z-index/visibility/transform/opacity/filter;
  - overlay viewport/zoom synchronization;
  - favicon optical alignment until class-rendered fallback is verified.

- [x] Newtab first pass:
  - suggestion row hover/selected/action state to class/data-state;
  - history delete button state to class/data-state;
  - bookmark/recent section visibility to classes;
  - bottom dock static CSS to HTML stylesheet, JS only sets CSS variables.

- [ ] Overlay first pass:
  - move shadow-root suggestion row, tag, tooltip, and visit/delete button styles into `src/overlay/suggestions-view.css`;
  - JS sets `data-selected`, `data-hover`, `data-action-visible`, and CSS variables;
  - preserve external shell protections.

- [x] Favicon pass:
  - replace display/filter/opacity state writes with classes where both overlay and newtab visual transitions match screenshots.

- [ ] Run audits after each group and record before/after counts in `docs/0.9.9-background-newtab-refactor-audit.md`.

Run:

```bash
npm run audit:style
npm run check
git diff --check
```

Commit message: `Reduce verified inline important styles`

Implementation note: Task 9 newtab bottom-dock slice completed on 2026-05-07. Moved the fixed `bottomDock`, `bottomDockScroller`, and `sectionSafeCorridor` styles from `newtab.js` `style.cssText` blocks into static `newtab.html` CSS without reintroducing `!important` in the stylesheet. JS still owns dynamic `display` and `max-height` through the layout controller. Removed now-unused section spacing constants from `newtab.js`. Style audit changed from `TOTAL important=1533 cssText=115 styleWrites=726` after the layout extraction to `TOTAL important=1496 cssText=112 styleWrites=723`; `src/newtab/newtab.js` moved from `important=530 cssText=39 styleWrites=219` to `important=493 cssText=36 styleWrites=216`. Verified with `node --check src/newtab/newtab.js`, `npm run audit:style`, `npm run check`, `npm run test:newtab-stores`, `git diff --check`, and `npm run package:store`. Browser validation used the existing Chrome Dev window after reload; the newtab rendered without a blank page and bottom dock bookmarks/recent cards stayed aligned. Screenshot saved at `dist/.checks/refactor-after-task-9/newtab-bottom-dock-static-css.png`.

Implementation note: Task 9 newtab section-visibility slice completed on 2026-05-07. Moved bookmark/recent section visibility from inline `display: ... !important` writes to `data-visible` attributes plus static `newtab.html` CSS, and taught the layout controller to read the data attribute before falling back to legacy inline display state. Static bottom-dock width/margin/pointer-event ownership stays in CSS. Style audit stayed at `TOTAL important=1496 cssText=112` and reduced priority/style-write counts from `setPropertyImportant=334 styleWrites=723` after the previous Task 9 slice to `setPropertyImportant=313 styleWrites=698`; `src/newtab/newtab.js` moved from `setPropertyImportant=97 styleWrites=216` to `setPropertyImportant=76 styleWrites=194`. Verified with `node --check src/newtab/layout.js`, `node --check src/newtab/newtab.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:newtab-stores`, `npm run test:search`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: reloaded the unpacked extension, opened a fresh Lumno newtab, confirmed bookmarks/recent cards stayed bottom-aligned, clicked the newtab input, typed `gm`, and confirmed the suggestions list plus right-side Tab guidance still rendered. DevTools still held a stale closed page handle, so this pass used Computer Use visual/accessibility state instead of a saved DevTools screenshot.

Implementation note: Task 9 newtab suggestion action/delete-state slice completed on 2026-05-07. Moved suggestion action tag visibility and history delete button/slot visibility from inline `!important` writes to `x-nt-*` classes plus `data-active`, `data-has-action-tags`, and `data-history-delete-visible` state attributes. JS now only supplies dynamic CSS variables for themed delete-button colors and hover colors. Style audit changed from `TOTAL important=1496 setPropertyImportant=313 cssText=112 styleWrites=698` after the previous Task 9 slice to `TOTAL important=1435 setPropertyImportant=276 cssText=109 styleWrites=672`; `src/newtab/newtab.js` moved from `important=493 setPropertyImportant=76 cssText=36 styleWrites=194` to `important=432 setPropertyImportant=39 cssText=33 styleWrites=168`. Verified with `node --check src/newtab/newtab.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run test:newtab-stores`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window without starting another Chrome: reloaded the current Lumno newtab, typed `gm`, confirmed suggestions and the right-side Tab guidance, hovered a history row and confirmed the delete button appeared in the row, pressed `Tab` to enter Gemini mode, typed `hello`, confirmed the AI suggestion row rendered, and pressed ArrowDown/ArrowUp without visual or interaction regressions.

Implementation note: Task 9 newtab suggestion tag slice completed on 2026-05-07. Moved the `历史` / `书签` / `常用` suggestion tags from three duplicated inline `cssText !important` blocks to shared `.x-nt-suggestion-tag` CSS, and changed selected-state tag color updates from direct background/color/border `important` writes to CSS variables. Style audit changed from `TOTAL important=1435 setPropertyImportant=276 cssText=109 styleWrites=672` after the previous Task 9 slice to `TOTAL important=1384 setPropertyImportant=258 cssText=106 styleWrites=654`; `src/newtab/newtab.js` moved from `important=432 setPropertyImportant=39 cssText=33 styleWrites=168` to `important=381 setPropertyImportant=21 cssText=30 styleWrites=150`. Verified with `node --check src/newtab/newtab.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run test:newtab-stores`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: reloaded the Lumno newtab, typed `gm`, confirmed default tag styling in the suggestions list, used ArrowDown to select tagged rows and confirm themed selected-state tags, hovered a history row and confirmed the delete button still appeared, and pressed `Tab` to confirm Gemini mode still entered with the prefix intact.

Implementation note: Task 9 newtab suggestion inline-icon slice completed on 2026-05-07. Reused `.x-nt-suggestion-inline-icon` for plain Remix suggestion icons (`window`, `add`, `settings`, search/link fallbacks) instead of constructing repeated inline `cssText !important` blocks or setting subtext color with priority writes. Style audit changed from `TOTAL important=1384 setPropertyImportant=258 cssText=106 styleWrites=654` after the previous Task 9 slice to `TOTAL important=1330 setPropertyImportant=253 cssText=103 styleWrites=646`; `src/newtab/newtab.js` moved from `important=381 setPropertyImportant=21 cssText=30 styleWrites=150` to `important=327 setPropertyImportant=16 cssText=27 styleWrites=142`. Browser validation used the existing Chrome Dev window: reloaded the Lumno newtab, typed `gm`, and confirmed the search/bookmark/history suggestion icons still aligned and the suggestions surface remained visually stable.

Implementation note: Task 9 newtab suggestion row-state slice completed on 2026-05-07. Moved the search-suggestion row shell from a JS inline `cssText !important` block to `.x-nt-suggestion-item` CSS with `data-last`, and changed search suggestion highlight/hover updates to use `data-row-state` with themed row colors supplied by existing theme variables. The tab-switch suggestion row path intentionally keeps its existing inline styling for a separate pass. Style audit changed from `TOTAL important=1330 setPropertyImportant=253 cssText=103 styleWrites=646` after the previous Task 9 slice to `TOTAL important=1309 setPropertyImportant=251 cssText=102 styleWrites=647`; `src/newtab/newtab.js` moved from `important=327 setPropertyImportant=16 cssText=27 styleWrites=142` to `important=306 setPropertyImportant=14 cssText=26 styleWrites=143`. Verified with `node --check src/newtab/newtab.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run test:newtab-stores`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: reloaded the Lumno newtab, typed `gm`, confirmed the suggestion list and row layout, pressed ArrowDown to verify selected-row highlight, pressed `Tab` to enter Gemini mode, typed `hello`, and confirmed the Gemini suggestion row rendered.

Implementation note: Task 9 newtab suggestion inner-structure slice completed on 2026-05-07. Moved the search-suggestion row's internal wrapper styles from inline `cssText !important` blocks to `.x-nt-suggestion-left`, `.x-nt-suggestion-icon-slot`, `.x-nt-suggestion-text`, and `.x-nt-suggestion-right` CSS classes. The tab-switch suggestion row path intentionally keeps its existing inline styling for a separate pass. Style audit changed from `TOTAL important=1309 setPropertyImportant=251 cssText=102 styleWrites=647` after the previous Task 9 slice to `TOTAL important=1231 setPropertyImportant=251 cssText=98 styleWrites=643`; `src/newtab/newtab.js` moved from `important=306 setPropertyImportant=14 cssText=26 styleWrites=143` to `important=228 setPropertyImportant=14 cssText=22 styleWrites=139`. Verified with `node --check src/newtab/newtab.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run test:newtab-stores`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: reloaded the Lumno newtab, typed `gm`, confirmed the suggestion list and row layout, pressed ArrowDown to verify selected-row highlight, pressed `Tab` to enter Gemini mode, typed `hello`, and confirmed the Gemini suggestion row rendered.

Implementation note: Task 9 newtab suggestion text-style slice completed on 2026-05-07. Moved search-suggestion title, debug reason, and bookmark-path text styling from inline `cssText !important` blocks to `.x-nt-suggestion-title`, `.x-nt-suggestion-reason`, and `.x-nt-suggestion-bookmark-path` CSS classes; selected search-title weight is now driven by `[data-row-state="active"]`. The tab-switch suggestion row path intentionally keeps its existing title styling for a separate pass. Style audit changed from `TOTAL important=1231 setPropertyImportant=251 cssText=98 styleWrites=643` after the previous Task 9 slice to `TOTAL important=1186 setPropertyImportant=250 cssText=95 styleWrites=639`; `src/newtab/newtab.js` moved from `important=228 setPropertyImportant=14 cssText=22 styleWrites=139` to `important=183 setPropertyImportant=13 cssText=19 styleWrites=135`. Verified with `node --check src/newtab/newtab.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run test:newtab-stores`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: reloaded the Lumno newtab, typed `gm`, confirmed the suggestion list and row layout, pressed ArrowDown to verify selected-row highlight, pressed `Tab` to enter Gemini mode, typed `hello`, and confirmed the Gemini suggestion row rendered.

Implementation note: Task 9 style-audit allowlist completed on 2026-05-07. `scripts/audit-style-debt.js` now preserves the existing per-file and total counts, then prints allowlisted and remaining important debt separately. The current allowlist covers `src/overlay/shell.js` host/panel isolation and entry/exit protections, `src/overlay/lifecycle.js` viewport/zoom synchronization, and `src/newtab/favicon-view.js` / `src/overlay/favicon-view.js` favicon fallback display and optical-alignment priorities until the favicon pass verifies class-rendered fallbacks. Current audit summary is `TOTAL important=1003 setPropertyImportant=237`, `TOTAL_ALLOWLIST important=97 setPropertyImportant=47`, and `TOTAL_REMAINING important=906 setPropertyImportant=190`. Verified with `node --check scripts/audit-style-debt.js` and `npm run audit:style`.

Implementation note: Task 9 overlay first CSS slice completed on 2026-05-08 as a low-risk partial pass. Added `src/overlay/suggestions-view.css`, loaded it through `LumnoOverlayShell.appendOverlayStyleNodes(...)`, exposed it in `manifest.json`, and added it to the resource/package validation lists. Moved the overlay suggestions container, action tags/keycaps, inline label/icon pairs, search/link helper icons, top action tooltip base styling, and the close-other-tabs button base/hover state out of inline JS style blocks. Overlay host/panel geometry and lifecycle protections remain unchanged. Style audit changed from `TOTAL important=1003 setPropertyImportant=237 cssText=81 styleWrites=606` to `TOTAL important=853 setPropertyImportant=207 cssText=71 styleWrites=573`; `TOTAL_REMAINING` changed from `important=906 setPropertyImportant=190` to `important=756 setPropertyImportant=160`; `src/overlay/search-panel.js` changed from `important=904 setPropertyImportant=186 cssText=54 styleWrites=250` to `important=754 setPropertyImportant=156 cssText=44 styleWrites=217`. Verified with `node --check src/overlay/search-panel.js`, `node --check src/overlay/shell.js`, `node --check scripts/check-manifest-resources.js`, `node --check scripts/package-store.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser side: reloaded the unpacked extension in the existing Chrome Dev window and confirmed the extension page/update flow still opened normally; the available automation path could not reliably trigger the overlay shortcut or current DevTools page target, so overlay visual parity is intentionally left as a follow-up gate before moving row, visit-button, and history-delete styles.

Implementation note: Task 9 favicon state CSS slice completed on 2026-05-08. Moved newtab favicon fallback display, fallback sizing/color, favicon load blur/fade state, and overlay favicon visibility/load state from inline priority styles to CSS classes/data attributes and CSS variables. `src/newtab/favicon-view.js` now drives `.x-nt-favicon-fallback`, `data-visible`, and `data-favicon-load-state`; `src/overlay/favicon-view.js` now drives `data-favicon-visibility` and `data-favicon-load-state`; `src/overlay/search-panel.js` reuses `.x-ov-suggestion-favicon` and `createSearchIcon('subtext')` instead of repeated inline favicon/search-icon style blocks. Style audit changed from `TOTAL important=853 setPropertyImportant=207 cssText=71 styleWrites=573` after the previous overlay CSS slice to `TOTAL important=785 setPropertyImportant=162 cssText=66 styleWrites=549`; `TOTAL_REMAINING` changed from `important=756 setPropertyImportant=160` to `important=704 setPropertyImportant=157`; `src/newtab/favicon-view.js` and `src/overlay/favicon-view.js` now both report `important=0 setPropertyImportant=0 cssText=0`, and `src/overlay/search-panel.js` moved to `important=702 setPropertyImportant=153 cssText=41 styleWrites=211`. Verified with `node --check src/newtab/favicon-view.js`, `node --check src/overlay/favicon-view.js`, `node --check src/overlay/search-panel.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: the newtab loaded without blanking, bookmarks/recent cards and favicons stayed visible, `gm` suggestions rendered, `Tab` entered Gemini mode, and `hello` rendered the Gemini AI row; on `https://lumno.kubai.design/release/`, `⌘T` opened the overlay, `gm` rendered suggestions with icons, `Tab` entered Gemini mode, `hello` rendered the AI row with icon, and Escape closed the overlay. Screenshot saved at `dist/.checks/refactor-after-task-9/overlay-favicon-css-gemini.png`. DevTools MCP still returned `Error: The selected page has been closed`, so this pass used Computer Use against Chrome Dev.

Implementation note: Task 9 overlay row-structure CSS slice completed on 2026-05-08. Moved overlay empty state, suggestion row shell, left/right wrappers, icon slots, text wrappers, title/debug/bookmark-path text, row highlight colors, title active weight, and action-tag visibility from inline `cssText !important` / priority writes into `src/overlay/suggestions-view.css` classes, data attributes, and CSS variables. This deliberately leaves overlay shell/geometry, visit-button, and history-delete styling for later focused passes. Style audit changed from `TOTAL important=785 setPropertyImportant=162 cssText=66 styleWrites=549` after the favicon slice to `TOTAL important=374 setPropertyImportant=147 cssText=42 styleWrites=513`; `TOTAL_REMAINING` changed from `important=704 setPropertyImportant=157` to `important=293 setPropertyImportant=142`; `src/overlay/search-panel.js` moved from `important=702 setPropertyImportant=153 cssText=41 styleWrites=211` to `important=291 setPropertyImportant=138 cssText=17 styleWrites=175`, and `src/overlay/suggestions-view.css` still reports `important=0`. Verified with `node --check src/overlay/search-panel.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window on `https://lumno.kubai.design/release/`: `gm` rendered aligned rows/icons/tags, ArrowDown/ArrowUp moved highlight, `Tab` entered Gemini mode, `hello` rendered the AI row, and Escape closed the overlay. Screenshot saved at `dist/.checks/refactor-after-task-9/overlay-row-structure-css-gemini.png`.

Implementation note: Task 9 overlay source-tag CSS slice completed on 2026-05-08. Moved the overlay `历史` / `书签` / `常用` / `已打开` source tags from duplicated inline `cssText !important` blocks and priority background/color/border/display writes to `.x-ov-suggestion-source-tag`, `data-visible`, and CSS variables. Visit-button and history-delete styles remain untouched for their own validation pass. Style audit changed from `TOTAL important=374 setPropertyImportant=147 cssText=42 styleWrites=513` after the row-structure slice to `TOTAL important=306 setPropertyImportant=119 cssText=38 styleWrites=484`; `TOTAL_REMAINING` changed from `important=293 setPropertyImportant=142` to `important=225 setPropertyImportant=114`; `src/overlay/search-panel.js` moved from `important=291 setPropertyImportant=138 cssText=17 styleWrites=175` to `important=223 setPropertyImportant=110 cssText=13 styleWrites=146`, and `src/overlay/suggestions-view.css` still reports `important=0`. Verified with `node --check src/overlay/search-panel.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: after reloading the unpacked extension, `⌘T` opened the overlay, `gm` showed default and selected source-tag styling, `Tab` entered Gemini mode, `hello` rendered the AI row, and Escape closed the overlay. Screenshot saved at `dist/.checks/refactor-after-task-9/overlay-source-tags-css-gm.png`.

Implementation note: Task 9 overlay visit-button CSS slice completed on 2026-05-08. Moved the overlay right-side visit and open-tab switch buttons from inline `cssText !important` blocks plus priority display/color/background/border writes into `.x-ov-suggestion-action-button`, `.x-ov-suggestion-visit-button`, `.x-ov-suggestion-switch-button`, `data-visible`, and CSS variables. History-delete styling remains untouched for a separate hover/tooltip validation pass. Style audit changed from `TOTAL important=306 setPropertyImportant=119 cssText=38 styleWrites=484` after the source-tag slice to `TOTAL important=236 setPropertyImportant=105 cssText=33 styleWrites=468`; `TOTAL_REMAINING` changed from `important=225 setPropertyImportant=114` to `important=155 setPropertyImportant=100`; `src/overlay/search-panel.js` moved from `important=223 setPropertyImportant=110 cssText=13 styleWrites=146` to `important=153 setPropertyImportant=96 cssText=8 styleWrites=130`, and `src/overlay/suggestions-view.css` still reports `important=0`. Verified with `node --check src/overlay/search-panel.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: after reloading the unpacked extension, `⌘T` opened the overlay, `gm` showed right-side visit buttons with selected-state styling, ArrowDown moved the selected row, `Tab` entered Gemini mode, `hello` rendered the AI row, and Escape closed the overlay. Screenshot saved at `dist/.checks/refactor-after-task-9/overlay-visit-button-css-gemini.png`.

Implementation note: Task 9 overlay history-delete CSS slice completed on 2026-05-08. Moved overlay history delete slot/button/icon base styling, visibility, opacity, transform, hover scale, and themed surface colors from inline `cssText !important` / priority writes into `.x-ov-history-delete-slot`, `.x-ov-history-delete-button`, `data-visible`, `data-hover-active`, and CSS variables. JS now controls only state attributes and dynamic color variables. The hover reset was tightened so selection refreshes do not clear the delete-button hover state while the button is visible. Style audit changed from `TOTAL important=236 setPropertyImportant=105 cssText=33 styleWrites=468` after the visit-button slice to `TOTAL important=193 setPropertyImportant=72 cssText=31 styleWrites=438`; `TOTAL_REMAINING` changed from `important=155 setPropertyImportant=100` to `important=112 setPropertyImportant=67`; `src/overlay/search-panel.js` moved from `important=153 setPropertyImportant=96 cssText=8 styleWrites=130` to `important=110 setPropertyImportant=63 cssText=6 styleWrites=100`, and `src/overlay/suggestions-view.css` still reports `important=0`. Verified with `node --check src/overlay/search-panel.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window on `https://lumno.kubai.design/release/`: after reloading the unpacked extension, `⌘T` opened the overlay, `gm` rendered history rows, `Tab` entered Gemini mode, `hello` rendered the AI row, and Escape closed the overlay. Screenshots saved at `dist/.checks/refactor-after-task-9/overlay-history-delete-css-gm.png` and `dist/.checks/refactor-after-task-9/overlay-history-delete-css-ai-regression.png`. Automation could not reliably trigger a pure hover over the history delete button, so exact hover/tooltip visual parity remains a manual checkpoint.

Implementation note: Task 9 shared mode-badge CSS slice completed on 2026-05-08. Moved the duplicated newtab and overlay `/mode` badge shell from `newtab.js` / `search-panel.js` inline style blocks into `.x-lumno-search-input-mode__badge` in `src/shared/search-input.css`, with `data-surface` selecting newtab vs overlay tokens and `data-visible` controlling display. `src/shared/search-input-mode.js` now treats explicit `data-visible` state as visible for right-padding layout calculations before falling back to legacy inline display checks. Style audit changed from `TOTAL important=193 setPropertyImportant=72 cssText=31 styleWrites=438` after the history-delete slice to `TOTAL important=169 setPropertyImportant=70 cssText=29 styleWrites=432`; `TOTAL_REMAINING` changed from `important=112 setPropertyImportant=67` to `important=88 setPropertyImportant=65`; `src/overlay/search-panel.js` moved from `important=110 setPropertyImportant=63 cssText=6 styleWrites=100` to `important=86 setPropertyImportant=61 cssText=5 styleWrites=97`; `src/newtab/newtab.js` moved from `cssText=5 styleWrites=81` to `cssText=4 styleWrites=78`. Verified with `node --check src/overlay/search-panel.js`, `node --check src/newtab/newtab.js`, `node --check src/shared/search-input-mode.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: reloaded the unpacked extension, opened a fresh Lumno newtab, set the input to `/mode`, confirmed the badge and command row rendered with stable right-side spacing, then opened the overlay on `https://lumno.kubai.design/release/`, set the overlay input to `/mode`, confirmed the overlay badge and command row rendered, and closed with Escape. Screenshots saved at `dist/.checks/refactor-after-task-9/newtab-mode-badge-shared-css.png` and `dist/.checks/refactor-after-task-9/overlay-mode-badge-shared-css.png`.

Implementation note: Task 9 overlay URL-line/debug-badge CSS slice completed on 2026-05-08. Moved the overlay suggestion URL preview line and tab-rank debug badge from `search-panel.js` inline `cssText !important` blocks to `.x-ov-suggestion-url-line` and `.x-ov-tab-rank-debug` in `src/overlay/suggestions-view.css`. Style audit changed from `TOTAL important=169 setPropertyImportant=70 cssText=29 styleWrites=432` after the shared mode-badge slice to `TOTAL important=140 setPropertyImportant=70 cssText=27 styleWrites=430`; `TOTAL_REMAINING` changed from `important=88 setPropertyImportant=65` to `important=59 setPropertyImportant=65`; `src/overlay/search-panel.js` moved from `important=86 setPropertyImportant=61 cssText=5 styleWrites=97` to `important=57 setPropertyImportant=61 cssText=3 styleWrites=95`, and `src/overlay/suggestions-view.css` still reports `important=0`. Browser validation used the existing Chrome Dev window on `https://lumno.kubai.design/release/`: the overlay was open, entering `lumno` rendered history/bookmark/top-site rows with URL preview lines still aligned, blue, single-line, and truncated correctly, then Escape closed the overlay. Screenshot saved at `dist/.checks/refactor-after-task-9/overlay-url-line-css-lumno.png`. The tab-rank debug badge path remains behind the existing storage debug flag, so this pass covered it through syntax/style audit rather than enabling the hidden debug UI.

Implementation note: Task 9 overlay command-icon CSS slice completed on 2026-05-08. Reused the existing `.x-ov-suggestion-inline-icon` class through a small `createSuggestionInlineIcon(...)` helper, replacing the remaining `/n`, `/s`, and browser-page inline icon `cssText !important` blocks in `search-panel.js`. Style audit changed from `TOTAL important=140 setPropertyImportant=70 cssText=27 styleWrites=430` after the URL-line slice to `TOTAL important=86 setPropertyImportant=70 cssText=24 styleWrites=427`; `TOTAL_REMAINING` changed from `important=59 setPropertyImportant=65` to `important=5 setPropertyImportant=65`; `src/overlay/search-panel.js` moved from `important=57 setPropertyImportant=61 cssText=3 styleWrites=95 createElement=54` to `important=3 setPropertyImportant=61 cssText=0 styleWrites=92 createElement=50`. Browser validation used the existing Chrome Dev window after reloading the unpacked extension: `⌘T` opened the overlay on `https://lumno.kubai.design/release/`, `/n` rendered the new-tab command with the plus icon aligned in the existing icon slot, `/s` rendered the settings command with the gear icon aligned, and Escape closed the overlay. Screenshots saved at `dist/.checks/refactor-after-task-9/overlay-command-icons-css-newtab.png` and `dist/.checks/refactor-after-task-9/overlay-command-icons-css-settings.png`.

Implementation note: Task 9 overlay theme-variable priority slice completed on 2026-05-08. Removed unnecessary `important` priorities from overlay-owned CSS variable writes in `applyOverlayThemeVariables(...)`, `applyThemeVariables(...)`, `applyMarkVariables(...)`, and entry action-tag palette updates. This leaves overlay shell/geometry, height animation, and open animation priority writes untouched because those are still protected visual/positioning paths. Style audit changed from `TOTAL important=86 setPropertyImportant=70 cssText=24 styleWrites=427` after the command-icon slice to `TOTAL important=86 setPropertyImportant=25 cssText=24 styleWrites=427`; `TOTAL_REMAINING` changed from `important=5 setPropertyImportant=65` to `important=5 setPropertyImportant=20`; `src/overlay/search-panel.js` moved from `important=3 setPropertyImportant=61 cssText=0 styleWrites=92` to `important=3 setPropertyImportant=16 cssText=0 styleWrites=92`. Verified first with `node --check src/overlay/search-panel.js` and `npm run audit:style`; browser validation used the existing Chrome Dev window after reloading the unpacked extension: `⌘T` opened the overlay on `https://lumno.kubai.design/release/`, entering `lumno` rendered selected rows and URL lines with the existing colors, `gm` + Tab entered Gemini mode, `hello` rendered the AI suggestion row with the Gemini prefix and stable caret/spacing, and Escape closed the overlay. Screenshot saved at `dist/.checks/refactor-after-task-9/overlay-theme-vars-no-priority-gemini.png`.

Implementation note: Task 9 overlay inner-priority cleanup slice completed on 2026-05-08. Removed the last avoidable literal `!important` inside `src/overlay/search-panel.js` by moving the Remix icon reset into `src/overlay/suggestions-view.css`, and replaced a few internal priority writes with normal shadow-root-owned writes or existing state hooks: non-favicon icon background, direct-tab icon color, action-tag cursor via `data-clickable`, and hover row colors via `setSuggestionRowColors(...)`. Overlay shell/geometry, shared input non-isolated compatibility, suggestion height animation, and open animation priority writes remain untouched. Style audit changed from `TOTAL important=86 setPropertyImportant=25 cssText=24 styleWrites=427` after the theme-variable slice to `TOTAL important=83 setPropertyImportant=20 cssText=24 styleWrites=424`; `TOTAL_REMAINING` changed from `important=5 setPropertyImportant=20` to `important=2 setPropertyImportant=15`; `src/overlay/search-panel.js` moved from `important=3 setPropertyImportant=16 cssText=0 styleWrites=92` to `important=0 setPropertyImportant=11 cssText=0 styleWrites=89`. Verified with `node --check src/overlay/search-panel.js`, `npm run audit:style`, `npm run audit:i18n`, `npm run test:search`, `npm run check`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: the overlay rendered `/n` and `/s` command rows with aligned plus/settings icons, `gm` showed regular rows and the Gemini Tab hint, `Tab` entered Gemini mode, `hello` rendered the AI row with stable prefix spacing, and Escape closed the overlay. Screenshots saved at `dist/.checks/refactor-after-task-9/overlay-inner-priority-cleanup-settings.png` and `dist/.checks/refactor-after-task-9/overlay-inner-priority-cleanup-gemini.png`.

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

- [x] Fix the existing empty English key:

```json
"settings_shortcuts_browser_desc_suffix": {
  "message": "Browser reserved shortcuts may need to be assigned manually."
}
```

- [x] Convert confirmed user-facing hardcoded strings to message keys:
  - newtab recent heading fallback: `最常访问` / `最近访问`;
  - newtab recent dismiss and unpin/dismiss copy;
  - options confirm dialogs for reset/clear actions;
  - blacklist scope labels/descriptions/examples;
  - background visible ranking/debug reason strings if they can appear in the UI;
  - any placeholder/title/aria-label/textContent literal reported by the audit and not allowlisted.

- [x] Keep these allowlisted:
  - provider names like `百度`, `搜狗`, `豆包` when they are data/brand labels;
  - remote AI-page selectors in `ai-provider-submit.js`;
  - browser bookmark folder aliases used for detection;
  - one-character separators like `/`, `*`, `Tab`, and keyboard key labels.

- [x] Keep zh-TW and zh-HK aligned to zh-CN meaning, with script/wording adapted only where needed.

- [x] Run:

```bash
npm run audit:i18n
npm run check
node -e "for (const l of ['en','zh_CN','zh_TW','zh_HK']) { const p='_locales/'+l+'/messages.json'; JSON.parse(require('fs').readFileSync(p,'utf8')); console.log(l, 'ok'); }"
git diff --check
```

Commit message: `Complete i18n coverage`

Implementation note: Task 10 completed on 2026-05-07. Filled the empty English `settings_shortcuts_browser_desc_suffix` key, added missing `data-i18n` coverage for options language entries, shortcut status, and confirm buttons, and changed runtime fallback strings in newtab, overlay, options, and bookmarks-store from Chinese to English so fallback text stays locale-neutral when message lookup is unavailable. Expanded `scripts/audit-i18n.js` to understand multi-line i18n helper calls and multi-line `data-i18n-*` HTML tags, while keeping allowlists scoped to provider/search data, bookmark-folder detection aliases, Chinese search-intent scoring tokens, and debug-only ranking hints. Verified with `npm run audit:i18n`, `npm run check`, `node --check scripts/audit-i18n.js`, `node --check src/newtab/newtab.js`, `node --check src/overlay/search-panel.js`, and `git diff --check`; `npm run audit:i18n` now reports locale parity intact with `empty=0` for every locale and `i18n audit candidate count=0`.

---

### Task 11: Final Route And Message Router Cleanup

**Files:**
- Create: `src/background/message-router.js`
- Modify: `src/background/background.js`
- Modify: `scripts/check-manifest-resources.js`
- Modify: `scripts/package-store.js`
- Modify: `package.json`

- [x] Extract only the generic route dispatch machinery from `background.js` into `src/background/message-router.js`.

Required API:

```js
globalThis.LumnoBackgroundMessageRouter = {
  createRouter(routeGroups),
  dispatch(router, request, sender, sendResponse)
};
```

- [x] Keep handlers in `background.js` unless a handler group has explicit dependencies and no implicit globals.

- [x] After extraction, move low-risk handler groups one at a time only if they accept a dependency object:
  - `extensionPages`;
  - `localeAndPermissions`;
  - `shortcuts` rule loading;
  - `newtabFallback`.

- [x] Do not move search, ranking, favicon resolver, or overlay-open orchestration in this task unless tests and browser validation cover the full path.

Run:

```bash
node --check src/background/message-router.js
npm run check
npm run test:shortcut-rules
npm run test:newtab-fallback
git diff --check
```

Commit message: `Extract background message router`

Implementation note: Task 11 completed on 2026-05-07. Added `src/background/message-router.js` with `LumnoBackgroundMessageRouter.createRouter(...)` and `dispatch(...)`, loaded it before background runtime message registration, and changed `background.js` to keep only the route group configuration plus the existing handler functions. Search, ranking, favicon resolution, and overlay-open orchestration remain in `background.js`; this slice intentionally moved only the generic action-to-handler dispatch machinery. Added `scripts/test-message-router.js` and `npm run test:message-router` for direct coverage of successful dispatch, unknown action responses, and duplicate action detection. Added the new runtime file to `npm run check:js`, `scripts/check-manifest-resources.js`, and `scripts/package-store.js`. Verified with `node --check src/background/message-router.js`, `node --check src/background/background.js`, `node --check scripts/test-message-router.js`, `npm run test:message-router`, `npm run test:shortcut-rules`, `npm run test:newtab-fallback`, `npm run check`, `npm run audit:style`, `npm run audit:i18n`, `npm run package:store`, and `git diff --check`. Browser validation used the existing Chrome Dev window: reloaded the unpacked Lumno extension from `chrome://extensions/?id=nkbkcafoocmnnconoijmhloecgamfcai`, opened a fresh newtab, and confirmed the page rendered plus `gm` suggestions appeared under the new message router.

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
