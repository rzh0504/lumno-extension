# New Tab Mobile Responsive Design

## Goal

Make the Lumno new-tab page behave as one coherent mobile layout on narrow, touch-capable viewports without changing the existing desktop composition.

The implementation targets responsive rendering of the extension page. It does not claim that every mobile browser supports Chromium extensions or new-tab overrides.

## Existing behavior and root cause

The page currently mixes two responsive systems:

- CSS collapses bookmark and recent-site grids to one column at `520px`.
- JavaScript returns two columns for every viewport at or below `860px`.
- The bottom content dock remains fixed and internally scrollable, even when the whole mobile page would be easier to use as one document flow.
- Short-height density rules can reduce controls below comfortable touch sizing.

The CSS/JavaScript column mismatch means visual columns and pagination limits can disagree. The fixed dock also creates a nested-scroll layout that competes with the software keyboard and bottom utility controls.

## Considered approaches

### A. Conservative compression

Keep the fixed desktop canvas and only reduce widths, gaps, and grid columns. This has the smallest diff, but preserves nested scrolling and does not solve the underlying CSS/JavaScript breakpoint mismatch by itself.

### B. Density-budgeted mobile single-page flow

Use a shared `640px` mobile breakpoint. At and below it, calculate two bookmark columns and one recent-site column in JavaScript, switch the bottom dock into normal document flow, and apply mobile spacing, safe-area, touch, and no-hover rules. Allocate the vertical budget across the top inset, search, shortcuts, sections, and fixed utility controls so the default content fits within roughly one to one-and-a-half phone screens.

This is the selected approach.

### C. Priority-based collapsed sections

Keep search and shortcuts on the first screen and collapse bookmarks and recent sites behind disclosure rows. This is visually compact but changes content discovery, state, and keyboard behavior. It is out of scope for an adaptive-layout fix.

## Responsive model

### Breakpoints

- `0-640px`: mobile single-page flow, two bookmark columns, and one recent-site column.
- `641-860px`: existing compact two-column behavior.
- `861px+`: existing adaptive desktop behavior.

The breakpoint is content-driven: bookmark rows remain readable as two compact columns, while recent-site cards need one full-width column for their title and action content.

### Layout flow

On mobile:

1. Wordmark
2. Search surface
3. Shortcut row
4. Bookmarks
5. Recent sites
6. Bottom content padding for fixed utility controls and the device safe area

The body becomes a naturally scrolling document. The bottom dock becomes a static flex container, and its internal scroller no longer owns vertical scrolling or a viewport-derived maximum height.

Desktop and tablet layouts retain the current fixed bottom dock and height-based density behavior.

## Layout controller changes

`src/newtab/layout.js` remains the source of layout calculations.

- Extend `getAdaptiveGridColumnCount()` with an optional mobile tier: `mobileBreakpointPx` and `mobileColumns`.
- Resolve mobile before the existing compact tier.
- Add `mobileFlowBreakpointPx` to the layout controller constants.
- During `updateBottomDockLayout()`, expose `x-nt-mobile-flow` on the body and `data-layout="flow"` on the dock when the viewport is at or below the mobile breakpoint.
- In flow mode, remove the dock's inline `max-height` and the body's computed inline `padding-top` so mobile CSS owns document spacing.
- Use a `mobile` dock density in flow mode so height-based `tiny` density never produces sub-44px touch rows.
- Preserve the existing fixed-dock calculation for wider viewports.

`src/newtab/newtab.js` passes the shared mobile breakpoint to both column calculations and to the dock runtime, with independent mobile column values: `2` for bookmarks and `1` for recent sites.

## Mobile presentation

Within the `640px` media query:

- Use `16px` inline gutters plus `env(safe-area-inset-*)` where relevant.
- Use a `32px` minimum top inset so the wordmark does not sit against the browser chrome or device cutout.
- Give the wordmark, search surface, shortcuts, and content dock the available width rather than `90vw` or `96vw`.
- Render bookmarks in two columns and recent sites in one column.
- Make the dock and dock scroller static, height-unconstrained, and overflow-visible.
- Reduce section gaps, card heights, and the dock's bottom reserve while preserving `44px` interactive targets. With default settings, the visible page contains four bookmarks and one recent site and should stay within roughly `1-1.5` screens at `375x667` and `390x844`.
- Reserve only the space needed for the wallpaper and feedback controls plus the bottom safe area so they do not cover the last card.
- Make fixed utility controls at least `44px` square and offset them from the bottom safe area.
- Give the mobile wallpaper button a stable, visible surface rather than relying on hover feedback.
- Render the wallpaper panel as a fixed, safe-area-aware mobile popover: `12px` side gutters, compact internal spacing, its own vertical scroll, and a bottom offset that leaves the trigger visible.
- Disable hover-only card lifting on devices that report `hover: none`; keyboard focus styling remains unchanged.

Search suggestions remain fixed to the measured search surface. Their existing `visualViewport` calculation continues to cap the list above the software keyboard.

## Interaction and accessibility

- DOM order remains unchanged, so keyboard and screen-reader order matches the new visual flow.
- Existing click, keyboard, drag, and context-menu behavior remains in place.
- Mobile utility controls meet the 44px minimum target size.
- The mobile wallpaper trigger remains visible above content and stays accessible while its panel is open.
- The mobile wallpaper panel never extends outside the visual viewport and scrolls internally when its content is taller than the available space.
- Hover effects are not used as the only feedback on touch input.
- `prefers-reduced-motion` behavior remains unchanged.

## Testing

Add regression coverage to `scripts/test-newtab-layout.js` before production changes:

- A phone viewport returns two bookmark columns and one recent-site column.
- A compact tablet viewport still returns two columns.
- A mobile layout pass sets flow state, clears fixed-dock height, and releases computed body top padding.
- A wider layout pass retains the fixed dock and height-based density.
- CSS contains the mobile flow, `32px` top inset, two-column bookmark, one-column recent-site, compact density, safe-area, fixed wallpaper panel, 44px control, and no-hover contracts.

Verification includes the focused layout test, the repository check, the full test suite, `git diff --check`, and headless viewport screenshots at representative phone portrait, phone landscape, tablet, and desktop sizes.

## Success criteria

- A `375px`-wide viewport renders two bookmark columns and one recent-site column, and JavaScript paginates using the same column counts.
- With default counts, the content ends within `1.5` viewport heights at both `375x667` and `390x844`.
- The mobile page has a single vertical scroll owner and no fixed-dock content clipping.
- Search suggestions remain bounded by the visible viewport when the software keyboard reduces it.
- Utility controls do not overlap the final content and remain at least `44px` square.
- The mobile wallpaper panel stays within `12px` side gutters, clears the top and bottom safe areas, and leaves its trigger unobscured.
- `768px` compact and desktop layouts keep their current two-column/fixed-dock and adaptive desktop behavior.
