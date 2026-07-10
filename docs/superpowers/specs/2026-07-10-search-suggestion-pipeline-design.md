# Search Suggestion Pipeline Design

## Goal

Make browser-local search results feel immediate while allowing search-engine suggestions to arrive later without blocking, replacing, or reducing the local result set.

## Result Types

- Local results: open tabs, browser history, bookmarks, and top sites.
- Search action: the existing row that searches the exact input using the selected engine.
- Remote suggestions: keyword completions returned by the selected search engine.

## User-visible Behavior

1. A query immediately starts the local lookup. Cold auxiliary indexes may wait for at most 80 ms and then continue warming in the background.
2. The first render contains the exact-query search action plus any available local results. It never waits for the search-engine request.
3. After the existing short input debounce, remote suggestions are merged additively:
   - when local results exist, keep up to 3 remote suggestions;
   - when no local results exist, keep up to 5 remote suggestions;
   - the exact-query search action is not counted in the remote-suggestion limit, so this state may show 1 search action plus 5 completions.
4. Local results remain ahead of remote completions according to the existing ranking rules. Remote responses do not remove local rows.
5. The visible list keeps the existing overall display cap.

## Data Flow

`newtab` and `overlay` continue to use the same two-stage contract:

1. `getSearchSuggestions` returns browser-local results only.
2. The client renders that response immediately.
3. `getSearchEngineSuggestions` receives the local response, loads the active engine state, fetches remote completions, applies the 3-or-5 limit, deduplicates the merged set, and returns it.
4. The client accepts the response only when its query and generation still match the current input.

The selected search-engine state must always be usable. A stored engine wins; when no engine has been stored, both the UI and background use Google as the same fallback.

## Failure and Race Handling

- Empty, failed, aborted, or timed-out remote responses are no-ops and preserve the current local render.
- A newer query aborts the prior remote request for the same sender and context.
- Composition start, query clear, and overlay removal invalidate pending client generations.
- Remote results are deduplicated by the shared suggestion key before display limiting.

## Test Contract

- Cold full-history and bookmark indexes do not delay direct local results beyond the fast-path budget.
- A delayed stored engine still produces multiple remote completions.
- An unconfigured engine uses the Google fallback and produces multiple completions.
- No-local-result queries return up to 5 remote suggestions, excluding the exact-query action.
- Queries with local results return up to 3 remote suggestions and retain all local rows.
- Empty and aborted remote responses preserve local results.
- Newtab and overlay keep stale-response and composition invalidation guards.

## Scope

This change is limited to search suggestion timing, merge policy, default-engine readiness, and regression coverage. It does not change result visuals, keyboard behavior, source settings, or provider configuration UI.
