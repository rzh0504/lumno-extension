# Background Link Opening Design

## Goal

Make every link-like Lumno entry point honor browser-style background opening: Command-click on macOS, Control-click on other platforms, and middle-click open the destination in a background tab without moving focus away from the current page.

## Scope

The change covers the six approved gaps:

1. New Tab shortcut tiles.
2. The New Tab Lumno wordmark link to the Chrome Web Store.
3. Release-note links in the New Tab update notice, overlay update notice, and Options version badge.
4. Action-backed inline links in onboarding.
5. The Discord feedback entry when Discord is the configured community channel.
6. Middle-click support for link-like custom controls, including shortcuts, bookmarks, recent sites, bookmark cascade items, search results, and the entries above.

Utility controls whose primary meaning is an action rather than navigation, such as pagination, theme controls, and shortcut editing, remain unchanged.

## Interaction Contract

| Input | Result |
| --- | --- |
| Normal primary click | Preserve the entry point's current foreground/current-tab behavior |
| Command-click | Open the destination in a background tab |
| Control-click | Open the destination in a background tab |
| Middle-click | Open the destination in a background tab |
| Command/Control + Enter on a focused link-like control | Open the destination in a background tab |
| Plain Enter/Space on a focused button-like control | Preserve its current activation behavior |

Only one navigation request may be emitted for a single gesture. Auxiliary-click handling must not duplicate a primary click or an existing pointer-down navigation.

## Architecture

Add a small shared navigation-disposition module that converts an input event into either the existing foreground disposition or `backgroundTab`. The module remains independent of Chrome APIs and DOM ownership so New Tab, onboarding, Options, overlay, and isolated view modules can reuse the same rule.

Each surface continues to own its navigation side effects:

- New Tab and overlay send `createTab` or their existing navigation messages with the resolved disposition.
- Options and onboarding pass the resolved disposition to their existing background actions.
- Native anchors keep native browser behavior where it is reliable; action-backed anchors are intercepted only when Lumno must route through an extension API.
- Button-like links bind both normal activation and `auxclick`, using the shared rule.

Background message handlers that open release, onboarding, extension, or browser pages accept an optional disposition and default to their current foreground behavior for compatibility.

## Error Handling

Existing fallbacks remain in place. If background messaging or the tabs API is unavailable, the surface uses its current `window.open` or same-page fallback. Modifier handling must not turn a failed background request into an unexpected foreground navigation unless that is already the surface's fallback behavior.

## Testing

Tests will first demonstrate the missing behavior, then cover:

- Command, Control, and middle-click disposition detection.
- Shortcut activation and drag/click suppression compatibility.
- Bookmark, recent-site, cascade-menu, and search-result middle-click behavior.
- Wordmark, release-note, onboarding inline-link, and Discord background opening.
- Foreground behavior remaining unchanged for normal clicks and keyboard activation.
- No duplicate navigation from one gesture.
- Background routing preserving source-tab group behavior through the existing `createTab` path.

