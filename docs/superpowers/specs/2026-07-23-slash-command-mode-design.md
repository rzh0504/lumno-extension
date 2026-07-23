# Slash Command Mode Design

## Goal

Make `/` a dedicated Lumno command surface. Slash-prefixed input must never fall back to web search, and the menu should expose only immediate Lumno actions rather than duplicate browser-page keywords.

## Product Principle

Lumno combines a focused search command bar with a minimal New Tab page. The slash menu therefore represents actions that change Lumno state or invoke a Lumno capability. Browser destinations such as bookmarks, history, downloads, and extension shortcuts remain available through the existing keyword system and do not become slash commands.

## Command-Mode Entry and Exit

- Trim leading and trailing whitespace before classification.
- Any non-empty input whose first character is `/` enters slash command mode, even when no command matches.
- While slash command mode is active, do not render web-search, direct-URL, browser-page, history, bookmark, open-tab, site-search, AI-provider, or remote search-engine suggestions.
- Do not send `getSearchSuggestions` or `getSearchEngineSuggestions` requests for slash-prefixed input.
- Filter the command list continuously as the user types.
- When no command matches, show the localized empty state `无匹配命令`; do not offer to search for the slash text.
- Existing Escape, blur, arrow-key, Tab-completion, and Enter-selection behavior remains unchanged unless a command below specifies otherwise.

## Available Commands

### New Tab

| Command | Result | Availability |
| --- | --- | --- |
| `/new` | Open a focused Lumno New Tab | Always |
| `/settings` | Open Lumno settings | Always |
| `/mode` | Cycle to the next visible theme mode | Always |
| `/zen` | Enter or leave Zen mode | Always |

No new New Tab commands are added. Appearance and wallpaper controls remain discoverable through their existing visible control, while browser destinations remain keyword results.

### Web Overlay

| Command | Result | Availability |
| --- | --- | --- |
| `/new` | Open a focused Lumno New Tab | Always |
| `/settings` | Open Lumno settings | Always |
| `/mode` | Cycle to the next overlay theme mode | Always |
| `/tabs` | Enter the existing open-tabs-only search mode | Always |
| `/copy` | Copy the current page URL using Lumno's existing copy-and-toast behavior | Whenever the web overlay is open |
| `/clip` | Start the existing Document Picture-in-Picture page picker | When webpage clipping is enabled in Lumno settings |

The legacy exact inputs `clip`, `webclip`, and `web clip` remain supported for backward compatibility, but only `/clip` appears in slash command discovery.

## Interaction Details

- `/tabs` keeps the overlay open, clears the slash query, activates the existing open-tabs prefix, and immediately renders open tabs. Escape or Backspace on an empty query leaves that mode through the existing path.
- `/copy` closes the overlay after invoking the existing current-page URL copy behavior. Success or failure continues to use the existing page toast. Add only a background message bridge; do not create a second clipboard implementation.
- `/clip` closes the overlay and starts the existing clipping picker. It is omitted from discovery when the feature setting is disabled. Existing picker handling remains responsible for page- or browser-level limitations.
- Exact `/mode` keeps focus in the command surface after changing the theme, matching current behavior.
- Commands are surface-specific: New Tab does not show `/tabs`, `/copy`, or `/clip`; the web overlay does not show `/zen`.

## Presentation

- Keep the existing two-line command row: command on the first line and the localized result title on the second line.
- Keep every command row at the existing `52px` height with the current typography budget and `border-box` sizing.
- Removing the web-search row reduces the bare-slash New Tab menu from five visible rows to four.
- The overlay may show up to six command rows. Existing panel height limits and scrolling behavior remain authoritative; no command-specific panel height is introduced.
- Command rows keep their existing icons and active/hover treatment. New commands use the closest existing Remix icon: tabs, link/copy, and scissors.

## Implementation Boundaries

- Introduce one explicit slash-command-mode predicate and use it consistently in input routing and suggestion composition on both surfaces.
- Command-mode rendering must depend on slash-mode state, not on whether at least one command matched. This prevents unknown input such as `/unknown` from falling back to search.
- Reuse the existing open-tabs mode, copy-current-page path, Document PiP picker, theme switcher, and background page-opening actions.
- Keep command metadata, construction, execution, icon, action-label, and autocomplete branches aligned for every new command type.
- Add localized user-facing command titles, action labels, and the no-matching-command empty state to all supported locales.
- Do not change keyword rules, search ranking, provider lists, browser-page routing, or the global `52px` suggestion-row contract.

## Validation

- Bare `/` shows only the commands available on the current surface.
- `/n`, `/m`, `/t`, `/co`, and `/cl` filter the list as expected for their surfaces.
- `/unknown` shows the command empty state and never shows or requests search-engine results.
- Slash input never sends local or remote search-suggestion messages.
- `/tabs`, `/copy`, and `/clip` execute through their existing capability paths.
- Plain `clip`, `webclip`, and `web clip` continue to work where currently supported.
- New Tab and overlay command rows remain exactly `52px` high.
- Ordinary text, URL, keyword, site-search, history, bookmark, and open-tab searches behave unchanged.
- Run the slash-command, New Tab suggestion-view, mode, Zen, overlay viewport-size, copy-current-URL, Document PiP, full syntax, and full test suites, followed by `git diff --check`.

## Out of Scope

- Slash aliases for bookmarks, history, downloads, browser settings, extension shortcuts, or site-search providers.
- A new open-tabs-only mode on New Tab.
- New wallpaper, appearance, help, feedback, or configuration commands.
- Reordering commands based on usage or user customization.
