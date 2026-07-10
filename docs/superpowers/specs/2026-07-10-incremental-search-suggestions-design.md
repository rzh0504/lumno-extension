# Incremental Search Suggestions Design

## Goal

Make Lumno show browser-local search results without waiting for search-engine suggestions, while preserving the longer remote timeout that improves keyword suggestion coverage.

## Current problem

`getSearchSuggestions` waits for history, bookmarks, top sites, open tabs, settings, and the remote search-engine endpoint in one `Promise.all`. A slow remote endpoint therefore delays every result. New-tab search also adds its input debounce before this combined request, while the page overlay can create overlapping remote requests for successive keystrokes.

## Chosen architecture

Use two independent request phases for each query:

1. **Local phase:** request history, bookmarks, top sites, and open-tab matches immediately. Render this response as soon as it arrives.
2. **Remote phase:** after a short input debounce, request search-engine suggestions separately. The background ranks them against the already-returned local suggestions and returns a merged response. Render that response only when its query generation is still current.

The public message actions are:

- `getSearchSuggestions`: browser-local suggestions only.
- `getSearchEngineSuggestions`: remote search-engine suggestions merged with the supplied local response.

The background owns ranking, blacklist filtering, deduplication, and result limits so new-tab and overlay clients stay consistent.

## Request lifecycle

- Every non-empty input increments a client request sequence.
- The local request starts immediately.
- The remote request starts only after the local response is available and a 120 ms remote debounce has elapsed.
- A new remote request aborts the previous in-flight remote fetch for the same sender and UI context.
- Both callbacks verify the request sequence and query before rendering.
- Remote failure or timeout leaves the local response visible; it never clears successful local results.

## UI behavior

- Local suggestions become visible as soon as the browser APIs respond.
- Remote suggestions appear as an incremental list update without resetting the input, selection, or autocomplete state for a newer query.
- Ranking remains compatible with the current policy: keep at most one engine suggestion when local results exist, and allow the configured engine-suggestion limit when no local result exists.

## Error handling

- Missing default search engine returns the local response unchanged.
- Aborted and stale remote requests produce no UI update.
- Network errors and the 900 ms remote timeout preserve the local response.
- Invalid client-supplied local suggestions are normalized to a bounded array before merging.

## Tests

- Background local suggestions return before a deliberately delayed remote endpoint.
- The separate remote action adds delayed engine suggestions to the local response.
- A newer remote request aborts the previous request in the same context.
- New-tab and overlay source contracts request local and remote suggestions separately and reject stale responses.
- Existing ranking, deletion, tab matching, and search UI tests continue to pass.

## Alternatives considered

- **Lower the timeout back to 180 ms:** faster, but loses valid delayed engine suggestions.
- **Keep one request and stream runtime messages:** more complex routing and lifecycle management for no user-visible advantage over two request actions.
- **Client-side ranking and merging:** duplicates policy across new-tab and overlay and risks inconsistent ordering.
