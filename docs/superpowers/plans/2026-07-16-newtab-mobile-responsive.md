# New Tab Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the new-tab page a single-column, naturally scrolling mobile layout whose JavaScript pagination matches its CSS grid.

**Architecture:** Extend the existing pure layout runtime with a mobile grid tier and mobile flow state. Keep width/height decisions in `src/newtab/layout.js`, pass one shared breakpoint from `src/newtab/newtab.js`, and let a scoped media query in `src/newtab/newtab.html` own mobile presentation.

**Tech Stack:** Vanilla JavaScript, inline page CSS, Node `assert` regression tests, headless Chromium viewport checks.

---

### Task 1: Align mobile grid calculation with the rendered grid

**Files:**
- Modify: `scripts/test-newtab-layout.js`
- Modify: `src/newtab/layout.js`
- Modify: `src/newtab/newtab.js`

- [ ] **Step 1: Write the failing mobile grid test**

Add this case before the existing wide-grid assertions in `scripts/test-newtab-layout.js`:

```js
function testAdaptiveGridUsesMobileTierBeforeCompactTier() {
  const config = {
    mobileBreakpointPx: 640,
    mobileColumns: 1,
    compactBreakpointPx: 860,
    compactColumns: 2,
    contentMaxWidth: 1040,
    targetColumnWidth: 248,
    gap: 12,
    minColumns: 4,
    maxColumns: 6
  };

  assert.strictEqual(
    layoutRuntime.getAdaptiveGridColumnCount({ ...config, viewportWidth: 375 }),
    1,
    'phone viewports should use one data column'
  );
  assert.strictEqual(
    layoutRuntime.getAdaptiveGridColumnCount({ ...config, viewportWidth: 768 }),
    2,
    'compact tablet viewports should retain two data columns'
  );
}

testAdaptiveGridUsesMobileTierBeforeCompactTier();
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node scripts/test-newtab-layout.js`

Expected: FAIL because the `375px` case returns the existing compact value `2`.

- [ ] **Step 3: Implement the mobile tier in the pure layout helper**

At the start of `getAdaptiveGridColumnCount()` in `src/newtab/layout.js`, before the compact breakpoint branch, add:

```js
const mobileBreakpointPx = Math.max(0, getFiniteNumber(config.mobileBreakpointPx, 0));
if (mobileBreakpointPx > 0 && viewportWidth <= mobileBreakpointPx) {
  return Math.max(1, Math.floor(getFiniteNumber(config.mobileColumns, 1)));
}
```

- [ ] **Step 4: Use one shared mobile breakpoint in the app entry**

Add this layout constant beside the existing grid constants in `src/newtab/newtab.js`:

```js
const NEWTAB_MOBILE_FLOW_BREAKPOINT_PX = 640;
```

Pass the following properties in both `getBookmarkGridColumnCount()` and `getRecentGridColumnCount()`:

```js
mobileBreakpointPx: NEWTAB_MOBILE_FLOW_BREAKPOINT_PX,
mobileColumns: 1,
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `node scripts/test-newtab-layout.js`

Expected: PASS with `newtab layout tests passed`.

- [ ] **Step 6: Commit the grid contract**

```bash
git add scripts/test-newtab-layout.js src/newtab/layout.js src/newtab/newtab.js
git commit -m "fix: align mobile new tab grid columns"
```

### Task 2: Switch the bottom dock to document flow on mobile

**Files:**
- Modify: `scripts/test-newtab-layout.js`
- Modify: `src/newtab/layout.js`
- Modify: `src/newtab/newtab.js`

- [ ] **Step 1: Extend the fake style object for priority-independent cleanup**

The existing `FakeStyle.removeProperty()` already supports the production cleanup. Keep it and add no test-only production API.

- [ ] **Step 2: Write the failing mobile flow test**

Return `windowObj` from `createFixture()`, then add these regressions to `scripts/test-newtab-layout.js`:

```js
function testMobileViewportReleasesFixedDockLayout() {
  const { body, bottomDock, controller } = createFixture({
    innerWidth: 375,
    innerHeight: 667,
    constants: {
      mobileFlowBreakpointPx: 640
    }
  });
  body.style.setProperty('padding-top', '120px');
  bottomDock.style.setProperty('max-height', '427px');

  controller.updateBottomDockLayout();

  assert.strictEqual(body.classList.contains('x-nt-mobile-flow'), true);
  assert.strictEqual(body.getAttribute('data-nt-bottom-dock-density'), 'mobile');
  assert.strictEqual(bottomDock.getAttribute('data-layout'), 'flow');
  assert.strictEqual(bottomDock.style.getPropertyValue('max-height'), '');
  assert.strictEqual(body.style.getPropertyValue('padding-top'), '');
}

function testResizeOutOfMobileRestoresFixedDockLayout() {
  const { body, bottomDock, controller, windowObj } = createFixture({
    innerWidth: 375,
    innerHeight: 667,
    constants: {
      mobileFlowBreakpointPx: 640
    }
  });

  controller.updateBottomDockLayout();
  windowObj.innerWidth = 1024;
  controller.updateBottomDockLayout();

  assert.strictEqual(body.classList.contains('x-nt-mobile-flow'), false);
  assert.strictEqual(bottomDock.getAttribute('data-layout'), 'fixed');
  assert.match(bottomDock.style.getPropertyValue('max-height'), /^\d+px$/);
  assert.match(body.style.getPropertyValue('padding-top'), /^\d+px$/);
}

testMobileViewportReleasesFixedDockLayout();
testResizeOutOfMobileRestoresFixedDockLayout();
```

- [ ] **Step 3: Run the focused test and verify RED**

Run: `node scripts/test-newtab-layout.js`

Expected: FAIL because `x-nt-mobile-flow`, `data-layout="flow"`, and `mobile` density do not exist.

- [ ] **Step 4: Add mobile flow state to the layout controller**

Read `mobileFlowBreakpointPx` with the other controller constants:

```js
const mobileFlowBreakpointPx = getOptionNumber(constants, 'mobileFlowBreakpointPx', 0);
```

Add a helper inside `createLayoutController()`:

```js
function isMobileFlowViewport() {
  const viewportWidth = Math.max(0, windowObj.innerWidth || 0);
  return mobileFlowBreakpointPx > 0 && viewportWidth <= mobileFlowBreakpointPx;
}
```

At the start of `updateSearchEntryLayout()`, after validating `body` and `root`, release desktop positioning in mobile flow:

```js
if (isMobileFlowViewport()) {
  body.style.removeProperty('padding-top');
  return;
}
```

In `updateBottomDockLayout()`, branch after reading viewport dimensions:

```js
const mobileFlow = isMobileFlowViewport();
body.classList.toggle('x-nt-mobile-flow', mobileFlow);
bottomDock.setAttribute('data-layout', mobileFlow ? 'flow' : 'fixed');
```

Choose density with mobile first:

```js
const dockDensity = mobileFlow
  ? 'mobile'
  : bottomDockMaxHeight <= 260
    ? 'tiny'
    : bottomDockMaxHeight <= 360
      ? 'compact'
      : 'default';
```

Replace the unconditional dock max-height assignment with:

```js
if (mobileFlow) {
  bottomDock.style.removeProperty('max-height');
} else {
  bottomDock.style.setProperty('max-height', `${bottomDockMaxHeight}px`, 'important');
}
```

- [ ] **Step 5: Pass the breakpoint into the dock runtime**

Add this property to the dock `constants` object in `src/newtab/newtab.js`:

```js
mobileFlowBreakpointPx: NEWTAB_MOBILE_FLOW_BREAKPOINT_PX,
```

- [ ] **Step 6: Run the focused test and verify GREEN**

Run: `node scripts/test-newtab-layout.js`

Expected: PASS with `newtab layout tests passed`.

- [ ] **Step 7: Commit the flow controller**

```bash
git add scripts/test-newtab-layout.js src/newtab/layout.js src/newtab/newtab.js
git commit -m "feat: add mobile flow state to new tab"
```

### Task 3: Add mobile presentation, touch, and safe-area rules

**Files:**
- Modify: `scripts/test-newtab-layout.js`
- Modify: `src/newtab/newtab.html`

- [ ] **Step 1: Write failing CSS contract tests**

Add assertions to `testBottomDockCssDefinesAdaptiveDensityVariables()` for the `640px` mobile query:

```js
assert.match(
  newtabHtml,
  /@media \(max-width:\s*640px\)[\s\S]*?body\.x-nt-mobile-flow\s*\{[\s\S]*?min-height:\s*100dvh;[\s\S]*?padding-inline:[\s\S]*?safe-area-inset-left[\s\S]*?overflow-y:\s*auto;/,
  'mobile flow should use one safe-area-aware document scroller'
);
assert.match(
  newtabHtml,
  /@media \(max-width:\s*640px\)[\s\S]*?#_x_extension_newtab_bottom_dock_2024_unique_\s*\{[\s\S]*?position:\s*static;[\s\S]*?transform:\s*none;[\s\S]*?max-height:\s*none;/,
  'mobile bottom dock should participate in document flow'
);
assert.match(
  newtabHtml,
  /@media \(max-width:\s*640px\)[\s\S]*?#_x_extension_newtab_bookmarks_grid_2024_unique_,\s*#_x_extension_newtab_recent_sites_grid_2024_unique_\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
  'mobile content grids should render one column'
);
assert.match(
  newtabHtml,
  /@media \(max-width:\s*640px\)[\s\S]*?\.x-nt-wallpaper-button,\s*\.x-nt-feedback-button\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/,
  'mobile utility controls should meet the 44px touch target'
);
assert.match(
  newtabHtml,
  /@media \(hover:\s*none\)[\s\S]*?\.x-nt-recent-card:hover\s*\{[\s\S]*?transform:\s*none;/,
  'touch input should not retain hover-only recent-card movement'
);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node scripts/test-newtab-layout.js`

Expected: FAIL because the `640px` flow and touch contracts are absent.

- [ ] **Step 3: Add mobile flow CSS**

Insert a new `@media (max-width: 640px)` block near the existing width media queries in `src/newtab/newtab.html`. It must contain these rules:

```css
@media (max-width: 640px) {
  :root {
    --x-nt-content-viewport-width: 100%;
    --x-nt-section-inner-gap: 14px;
    --x-nt-grid-row-gap: 12px;
    --x-nt-bottom-dock-section-gap: 24px;
    --x-nt-bottom-dock-top-padding: 18px;
    --x-nt-bottom-dock-bottom-padding: calc(88px + env(safe-area-inset-bottom));
  }
  body.x-nt-mobile-flow {
    width: 100%;
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    align-items: stretch;
    padding-top: max(20px, env(safe-area-inset-top));
    padding-right: max(16px, env(safe-area-inset-right));
    padding-bottom: 0;
    padding-left: max(16px, env(safe-area-inset-left));
    padding-inline: max(16px, env(safe-area-inset-left)) max(16px, env(safe-area-inset-right));
    overflow-x: hidden;
    overflow-y: auto;
  }
  body.x-nt-mobile-flow #_x_extension_newtab_wordmark_2026_unique_,
  body.x-nt-mobile-flow #_x_extension_newtab_root_2024_unique_,
  body.x-nt-mobile-flow .x-nt-shortcuts-section,
  body.x-nt-mobile-flow #_x_extension_newtab_bottom_dock_2024_unique_ {
    width: 100%;
    max-width: none;
  }
  #_x_extension_newtab_bottom_dock_2024_unique_ {
    position: static;
    left: auto;
    bottom: auto;
    transform: none;
    max-height: none;
    margin-top: 10px;
    overflow: visible;
  }
  #_x_extension_newtab_bottom_dock_scroller_2024_unique_ {
    width: 100%;
    max-height: none;
    margin: 0;
    padding: var(--x-nt-bottom-dock-top-padding) 0 var(--x-nt-bottom-dock-bottom-padding);
    overflow: visible;
    overscroll-behavior: auto;
  }
  #_x_extension_newtab_bookmarks_grid_2024_unique_,
  #_x_extension_newtab_recent_sites_grid_2024_unique_ {
    grid-template-columns: minmax(0, 1fr);
  }
  .x-nt-wallpaper-control,
  .x-nt-feedback-control {
    bottom: max(10px, env(safe-area-inset-bottom));
    width: 44px;
  }
  .x-nt-wallpaper-control { right: max(10px, env(safe-area-inset-right)); }
  .x-nt-feedback-control { right: calc(max(10px, env(safe-area-inset-right)) + 52px); }
  .x-nt-wallpaper-button,
  .x-nt-feedback-button {
    width: 44px;
    height: 44px;
  }
  .x-nt-wallpaper-panel {
    max-width: calc(100vw - 24px);
    max-height: calc(100dvh - 76px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  }
}
```

Add comfortable `mobile` density variables beside the other dock density blocks:

```css
#_x_extension_newtab_bottom_dock_2024_unique_[data-density="mobile"] {
  --x-nt-dock-bookmark-card-height: 48px;
  --x-nt-dock-recent-inner-height: 92px;
  --x-nt-dock-recent-inner-hover-height: 92px;
  --x-nt-dock-recent-inner-hover-offset: 0px;
}
```

- [ ] **Step 4: Add no-hover input adaptation**

Add this independent media query after the mobile query:

```css
@media (hover: none) {
  .x-nt-recent-card:hover {
    transform: none;
    box-shadow: var(--x-nt-recent-card-shadow);
    --x-nt-recent-title-lines: var(--x-nt-dock-recent-title-lines, 3);
  }
  .x-nt-recent-card:hover .x-nt-recent-inner {
    height: var(--x-nt-dock-recent-inner-height, 104px);
    transform: none;
    margin-bottom: 0;
  }
}
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `node scripts/test-newtab-layout.js`

Expected: PASS with `newtab layout tests passed`.

- [ ] **Step 6: Commit the mobile presentation**

```bash
git add scripts/test-newtab-layout.js src/newtab/newtab.html
git commit -m "feat: adapt new tab layout for mobile viewports"
```

### Task 4: Verify behavior across viewport classes

**Files:**
- Verify: `src/newtab/layout.js`
- Verify: `src/newtab/newtab.js`
- Verify: `src/newtab/newtab.html`
- Verify: `scripts/test-newtab-layout.js`

- [ ] **Step 1: Run the focused layout regression**

Run: `npm run test:newtab-layout`

Expected: PASS with `newtab layout tests passed`.

- [ ] **Step 2: Run repository syntax and manifest checks**

Run: `npm run check`

Expected: exit `0`, including `manifest resources ok`.

- [ ] **Step 3: Run the complete test suite**

Run: `npm test`

Expected: exit `0` with every registered script passing.

- [ ] **Step 4: Check patch hygiene**

Run: `git diff --check`

Expected: no output and exit `0`.

- [ ] **Step 5: Perform headless viewport checks**

Load the unpacked extension in a temporary Chromium profile, navigate to its `src/newtab/newtab.html`, and capture these viewports:

- `375x667`: body has `x-nt-mobile-flow`; one-column grids; static dock; no horizontal overflow.
- `667x375`: wider-than-mobile breakpoint keeps compact layout while short-height density prevents overlap.
- `768x1024`: two-column compact grid and fixed dock remain active.
- `1440x900`: existing desktop fixed dock and adaptive columns remain active.

For the phone portrait page, evaluate:

```js
({
  mobileFlow: document.body.classList.contains('x-nt-mobile-flow'),
  bodyOverflowX: document.body.scrollWidth - document.body.clientWidth,
  bookmarkColumns: getComputedStyle(document.querySelector('#_x_extension_newtab_bookmarks_grid_2024_unique_')).gridTemplateColumns,
  recentColumns: getComputedStyle(document.querySelector('#_x_extension_newtab_recent_sites_grid_2024_unique_')).gridTemplateColumns,
  dockPosition: getComputedStyle(document.querySelector('#_x_extension_newtab_bottom_dock_2024_unique_')).position
})
```

Expected: `mobileFlow: true`, horizontal overflow `0`, one computed track for each grid, and `dockPosition: "static"`.

- [ ] **Step 6: Review final diff against the design criteria**

Run:

```bash
git status --short
git diff HEAD~3 -- src/newtab/layout.js src/newtab/newtab.js src/newtab/newtab.html scripts/test-newtab-layout.js
```

Expected: only the responsive implementation and its tests are present; visual-companion scratch files remain untracked or are removed before handoff.
