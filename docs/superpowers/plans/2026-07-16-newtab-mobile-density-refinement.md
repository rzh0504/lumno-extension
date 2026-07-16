# New Tab Mobile Density Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the new-tab mobile layout with more top breathing room, two-column bookmarks, one-column recent sites, a one-to-one-and-a-half-screen default height budget, and a robust mobile appearance control.

**Architecture:** Keep the existing `640px` mobile flow breakpoint and separate bookmark/recent column values at their existing call sites. Express the mobile height budget and appearance popover entirely through the scoped mobile CSS, while retaining `src/newtab/layout.js` as the general layout runtime.

**Tech Stack:** Vanilla JavaScript, inline page CSS, Node `assert` regression tests, headless Chromium viewport verification.

---

### Task 1: Split bookmark and recent-site mobile columns

**Files:**
- Modify: `scripts/test-newtab-layout.js`
- Modify: `src/newtab/newtab.js`
- Modify: `src/newtab/newtab.html`

- [ ] **Step 1: Write failing JavaScript and CSS column contracts**

Add a source-contract test to `scripts/test-newtab-layout.js`:

```js
function testNewtabUsesDistinctMobileGridColumns() {
  const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
  const bookmarkColumnsSource = newtabJs.slice(
    newtabJs.indexOf('function getBookmarkGridColumnCount()'),
    newtabJs.indexOf('function getNewtabWidthModeBaseConfig()')
  );
  const recentColumnsSource = newtabJs.slice(
    newtabJs.indexOf('function getRecentGridColumnCount()'),
    newtabJs.indexOf('function clearPageNoticeQueryParam()')
  );

  assert.match(bookmarkColumnsSource, /mobileColumns:\s*2,/);
  assert.match(recentColumnsSource, /mobileColumns:\s*1,/);
}

testNewtabUsesDistinctMobileGridColumns();
```

Replace the existing combined mobile-grid CSS assertion with:

```js
assert.match(
  newtabHtml,
  /@media \(max-width:\s*640px\)[\s\S]*?#_x_extension_newtab_bookmarks_grid_2024_unique_\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/,
  'mobile bookmarks should render two columns'
);
assert.match(
  newtabHtml,
  /@media \(max-width:\s*640px\)[\s\S]*?#_x_extension_newtab_recent_sites_grid_2024_unique_\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
  'mobile recent sites should remain one column'
);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node scripts/test-newtab-layout.js`

Expected: FAIL because the bookmark mobile value and CSS are both still one column.

- [ ] **Step 3: Implement independent mobile columns**

In `getBookmarkGridColumnCount()` inside `src/newtab/newtab.js`, change only the mobile value:

```js
mobileColumns: 2,
```

In the `@media (max-width: 640px)` block in `src/newtab/newtab.html`, split the combined selector:

```css
#_x_extension_newtab_bookmarks_grid_2024_unique_ {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
#_x_extension_newtab_recent_sites_grid_2024_unique_ {
  grid-template-columns: minmax(0, 1fr);
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node scripts/test-newtab-layout.js`

Expected: PASS with `newtab layout tests passed`.

- [ ] **Step 5: Commit the column behavior**

```bash
git add scripts/test-newtab-layout.js src/newtab/newtab.js src/newtab/newtab.html
git commit -m "fix: show two bookmark columns on mobile"
```

### Task 2: Apply the mobile vertical density budget

**Files:**
- Modify: `scripts/test-newtab-layout.js`
- Modify: `src/newtab/newtab.html`

- [ ] **Step 1: Write failing mobile spacing and density contracts**

Add these assertions to `testBottomDockCssDefinesAdaptiveDensityVariables()`:

```js
assert.match(
  newtabHtml,
  /@media \(max-width:\s*640px\)[\s\S]*?:root\s*\{[\s\S]*?--x-nt-section-inner-gap:\s*10px;[\s\S]*?--x-nt-grid-row-gap:\s*8px;[\s\S]*?--x-nt-bottom-dock-section-gap:\s*10px;[\s\S]*?--x-nt-bottom-dock-corridor-size:\s*0px;[\s\S]*?--x-nt-bottom-dock-top-padding:\s*12px;[\s\S]*?--x-nt-bottom-dock-bottom-padding:\s*calc\(72px \+ env\(safe-area-inset-bottom\)\);/,
  'mobile flow should use the compact vertical spacing budget'
);
assert.match(
  newtabHtml,
  /@media \(max-width:\s*640px\)[\s\S]*?body\.x-nt-mobile-flow\s*\{[\s\S]*?padding-top:\s*max\(32px,\s*env\(safe-area-inset-top\)\);/,
  'mobile flow should keep a 32px minimum top inset'
);
assert.match(
  newtabHtml,
  /#_x_extension_newtab_bottom_dock_2024_unique_\[data-density="mobile"\]\s*\{[\s\S]*?--x-nt-dock-bookmark-card-height:\s*44px;[\s\S]*?--x-nt-dock-recent-card-padding:\s*6px 6px 8px;[\s\S]*?--x-nt-dock-recent-card-gap:\s*6px;[\s\S]*?--x-nt-dock-recent-inner-height:\s*82px;[\s\S]*?--x-nt-dock-recent-inner-hover-height:\s*82px;/,
  'mobile density should compact cards without dropping below touch size'
);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node scripts/test-newtab-layout.js`

Expected: FAIL because the current top inset is `20px` and the dock spacing is larger.

- [ ] **Step 3: Implement the mobile spacing tokens**

Change the mobile density block to:

```css
#_x_extension_newtab_bottom_dock_2024_unique_[data-density="mobile"] {
  --x-nt-dock-bookmark-card-height: 44px;
  --x-nt-dock-bookmark-card-padding: 8px 10px;
  --x-nt-dock-bookmark-icon-size: 20px;
  --x-nt-dock-bookmark-title-size: 13px;
  --x-nt-dock-recent-card-padding: 6px 6px 8px;
  --x-nt-dock-recent-card-gap: 6px;
  --x-nt-dock-recent-card-radius: 22px;
  --x-nt-dock-recent-inner-height: 82px;
  --x-nt-dock-recent-inner-hover-height: 82px;
  --x-nt-dock-recent-inner-hover-offset: 0px;
  --x-nt-dock-recent-inner-padding: 10px 10px 11px 12px;
  --x-nt-dock-recent-inner-radius: 16px;
  --x-nt-dock-recent-title-lines: 2;
  --x-nt-dock-recent-title-hover-lines: 2;
}
```

Change the mobile query tokens and body top inset to:

```css
:root {
  --x-nt-content-viewport-width: 100%;
  --x-nt-section-inner-gap: 10px;
  --x-nt-grid-row-gap: 8px;
  --x-nt-bottom-dock-section-gap: 10px;
  --x-nt-bottom-dock-corridor-size: 0px;
  --x-nt-bottom-dock-top-padding: 12px;
  --x-nt-bottom-dock-bottom-padding: calc(72px + env(safe-area-inset-bottom));
  --x-nt-shortcuts-reserved-height: 64px;
  --x-nt-shortcuts-section-margin-top: 10px;
  --x-nt-shortcut-tile-size: 52px;
  --x-nt-shortcut-icon-size: 40px;
}

body.x-nt-mobile-flow {
  padding-top: max(32px, env(safe-area-inset-top));
}

#_x_extension_newtab_bottom_dock_2024_unique_ {
  margin-top: 4px;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node scripts/test-newtab-layout.js`

Expected: PASS with `newtab layout tests passed`.

- [ ] **Step 5: Commit the density budget**

```bash
git add scripts/test-newtab-layout.js src/newtab/newtab.html
git commit -m "fix: tighten mobile new tab density"
```

### Task 3: Stabilize the mobile appearance trigger and panel

**Files:**
- Modify: `scripts/test-newtab-layout.js`
- Modify: `src/newtab/newtab.html`

- [ ] **Step 1: Write failing appearance-control CSS contracts**

Add these assertions to `testBottomDockCssDefinesAdaptiveDensityVariables()`:

```js
assert.match(
  newtabHtml,
  /@media \(max-width:\s*640px\)[\s\S]*?\.x-nt-wallpaper-button\s*\{[\s\S]*?background:\s*var\(--control-bg\);[\s\S]*?border-color:\s*var\(--tab-border\);[\s\S]*?backdrop-filter:\s*blur\(16px\);/,
  'mobile appearance trigger should have a stable visible surface'
);
assert.match(
  newtabHtml,
  /@media \(max-width:\s*640px\)[\s\S]*?\.x-nt-wallpaper-panel\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?left:\s*max\(12px,\s*env\(safe-area-inset-left\)\);[\s\S]*?right:\s*max\(12px,\s*env\(safe-area-inset-right\)\);[\s\S]*?bottom:\s*calc\(max\(12px,\s*env\(safe-area-inset-bottom\)\) \+ 56px\);[\s\S]*?width:\s*auto;[\s\S]*?max-width:\s*none;[\s\S]*?max-height:\s*calc\(100dvh - 100px - env\(safe-area-inset-top\) - env\(safe-area-inset-bottom\)\);[\s\S]*?padding:\s*16px;[\s\S]*?border-radius:\s*22px;[\s\S]*?scrollbar-gutter:\s*auto;/,
  'mobile appearance panel should be fixed inside safe-area gutters'
);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node scripts/test-newtab-layout.js`

Expected: FAIL because the current panel remains absolutely positioned and the trigger is transparent.

- [ ] **Step 3: Implement the mobile appearance surface**

Inside `@media (max-width: 640px)`, add:

```css
.x-nt-wallpaper-button {
  background: var(--control-bg);
  border-color: var(--tab-border);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.x-nt-wallpaper-panel {
  --x-nt-panel-divider-gap: 14px;
  --x-nt-panel-header-gap: 12px;
  --x-nt-panel-inline-gap: 12px;
  --x-nt-panel-item-gap: 16px;
  --x-nt-panel-control-gap: 12px;
  --x-nt-panel-field-gap: 12px;
  --x-nt-panel-option-gap: 10px;
  --x-nt-panel-tab-gap: 5px;
  --x-nt-panel-grid-gap: 12px;
  position: fixed;
  left: max(12px, env(safe-area-inset-left));
  right: max(12px, env(safe-area-inset-right));
  bottom: calc(max(12px, env(safe-area-inset-bottom)) + 56px);
  width: auto;
  max-width: none;
  max-height: calc(100dvh - 100px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  padding: 16px;
  border-radius: 22px;
  scrollbar-gutter: auto;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node scripts/test-newtab-layout.js`

Expected: PASS with `newtab layout tests passed`.

- [ ] **Step 5: Commit the appearance UI**

```bash
git add scripts/test-newtab-layout.js src/newtab/newtab.html
git commit -m "fix: stabilize mobile appearance controls"
```

### Task 4: Verify the mobile height and appearance boundaries

**Files:**
- Verify: `src/newtab/newtab.js`
- Verify: `src/newtab/newtab.html`
- Verify: `scripts/test-newtab-layout.js`

- [ ] **Step 1: Run focused and full automated checks**

Run:

```bash
npm run test:newtab-layout
npm run check
npm test
git diff --check
```

Expected: focused test passes, manifest resources are valid, all registered test files pass, and `git diff --check` emits no output.

- [ ] **Step 2: Verify phone viewport budgets in headless Chromium**

Using the existing local Chrome mock harness, render four default bookmarks and one recent site at `375x667` and `390x844`. Evaluate:

```js
({
  pageHeight: document.documentElement.scrollHeight,
  viewportHeight: window.innerHeight,
  screenRatio: document.documentElement.scrollHeight / window.innerHeight,
  bookmarkColumns: document.querySelector('#_x_extension_newtab_bookmarks_grid_2024_unique_')
    .style.getPropertyValue('--x-nt-bookmark-columns'),
  recentColumns: document.querySelector('#_x_extension_newtab_recent_sites_grid_2024_unique_')
    .style.getPropertyValue('--x-nt-recent-columns'),
  horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth
})
```

Expected at both viewports: `screenRatio <= 1.5`, bookmark columns `2`, recent columns `1`, and horizontal overflow `0`.

- [ ] **Step 3: Verify the opened appearance panel**

Open the wallpaper panel at `375x667` and evaluate its rectangle against the viewport and trigger:

```js
const panel = document.querySelector('.x-nt-wallpaper-panel').getBoundingClientRect();
const trigger = document.querySelector('.x-nt-wallpaper-button').getBoundingClientRect();
({
  panel,
  trigger,
  insideViewport: panel.left >= 12 && panel.right <= window.innerWidth - 12 && panel.top >= 0 && panel.bottom <= window.innerHeight,
  clearsTrigger: panel.bottom <= trigger.top,
  triggerSize: [trigger.width, trigger.height]
});
```

Expected: the panel is inside the viewport, does not cover the trigger, and the trigger is `44x44`.

- [ ] **Step 4: Confirm desktop behavior and workspace hygiene**

At `768x1024` and `1440x900`, confirm the dock remains fixed and existing column behavior is unchanged. Then run:

```bash
git status --short
git log -6 --oneline
```

Expected: the implementation worktree is clean and only the planned commits follow the specification update.
