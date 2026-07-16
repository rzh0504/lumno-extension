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

### B. Mobile single-page flow

Use a shared `640px` mobile breakpoint. At and below it, calculate one grid column in JavaScript, switch the bottom dock into normal document flow, and apply mobile spacing, safe-area, touch, and no-hover rules. This keeps all existing content and interactions while changing only their narrow-screen layout.

This is the selected approach.

### C. Priority-based collapsed sections

Keep search and shortcuts on the first screen and collapse bookmarks and recent sites behind disclosure rows. This is visually compact but changes content discovery, state, and keyboard behavior. It is out of scope for an adaptive-layout fix.

## Responsive model

### Breakpoints

- `0-640px`: mobile single-page flow and one-column content grids.
- `641-860px`: existing compact two-column behavior.
- `861px+`: existing adaptive desktop behavior.

The breakpoint is content-driven: below `640px`, two recent-site cards are too narrow for their title and action content, while one column leaves usable inline padding.

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

`src/newtab/newtab.js` passes the shared mobile breakpoint to both bookmark and recent-site column calculations and to the dock runtime.

## Mobile presentation

Within the `640px` media query:

- Use `16px` inline gutters plus `env(safe-area-inset-*)` where relevant.
- Give the wordmark, search surface, shortcuts, and content dock the available width rather than `90vw` or `96vw`.
- Keep bookmark and recent-site grids at one column.
- Make the dock and dock scroller static, height-unconstrained, and overflow-visible.
- Reserve bottom space so wallpaper and feedback controls do not cover the last card.
- Make fixed utility controls at least `44px` square and offset them from the bottom safe area.
- Keep wallpaper and feedback panels inside the visual viewport.
- Disable hover-only card lifting on devices that report `hover: none`; keyboard focus styling remains unchanged.

Search suggestions remain fixed to the measured search surface. Their existing `visualViewport` calculation continues to cap the list above the software keyboard.

## Interaction and accessibility

- DOM order remains unchanged, so keyboard and screen-reader order matches the new visual flow.
- Existing click, keyboard, drag, and context-menu behavior remains in place.
- Mobile utility controls meet the 44px minimum target size.
- Hover effects are not used as the only feedback on touch input.
- `prefers-reduced-motion` behavior remains unchanged.

## Testing

Add regression coverage to `scripts/test-newtab-layout.js` before production changes:

- A phone viewport returns one grid column.
- A compact tablet viewport still returns two columns.
- A mobile layout pass sets flow state, clears fixed-dock height, and releases computed body top padding.
- A wider layout pass retains the fixed dock and height-based density.
- CSS contains the mobile flow, one-column, safe-area, 44px control, and no-hover contracts.

Verification includes the focused layout test, the repository check, the full test suite, `git diff --check`, and headless viewport screenshots at representative phone portrait, phone landscape, tablet, and desktop sizes.

## Success criteria

- A `375px`-wide viewport renders one bookmark and one recent-site column, and JavaScript paginates using the same column count.
- The mobile page has a single vertical scroll owner and no fixed-dock content clipping.
- Search suggestions remain bounded by the visible viewport when the software keyboard reduces it.
- Utility controls do not overlap the final content and remain at least `44px` square.
- `768px` compact and desktop layouts keep their current two-column/fixed-dock and adaptive desktop behavior.
