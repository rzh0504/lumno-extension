# Repository Guidelines

## Project Structure & Module Organization
Lumno is a Manifest V3 Chromium extension. `manifest.json` is the entry map. Runtime code lives in `src/`: `background/` for the service worker and injected helpers, `content/` for page integrations, `overlay/` for the floating command UI, `newtab/` for the replacement page, `options/` for settings, and `shared/` for reusable helpers. Locales live in `_locales/`, assets in `assets/`, release zips in `dist/`, and maintenance scripts in `scripts/`.

## Build, Test, and Development Commands
Use `npm run check` before handing off changes. It runs JavaScript syntax checks plus manifest/resource validation. Run focused tests when touching related modules:

- `npm run test:search` checks shared search scoring and matching.
- `npm run test:site-search-store` checks site-search provider storage.
- `npm run test:settings` checks settings defaults and persistence helpers.
- `npm run test:shortcut-rules` checks shortcut eligibility and duplicate handling.
- `npm run test:url-guards` checks URL safety helpers.
- `npm run package:store` creates and validates `dist/lumno-store-v<version>.zip`.

Manual test by loading this repo unpacked from `chrome://extensions`.

## Coding Style & Naming Conventions
Use plain JavaScript, two-space indentation, semicolons, and descriptive camelCase names. Keep shared logic in `src/shared/` rather than duplicating it across background, overlay, and newtab entry points. Prefer small helpers for scoring, URL handling, storage normalization, and keyboard navigation. Avoid adding `!important` in owned pages; solve styling with stable classes, containment, CSS variables, and clear layer ownership.

## Testing Guidelines
When changing search suggestions, scoring, site-search behavior, recent-site ranking, or keyboard navigation, check both background and newtab paths because the newtab usually reuses `chrome.runtime.sendMessage({ action: 'getSearchSuggestions' })`. Add or update `scripts/test-*.js` for shared helpers. For release preparation, run `npm run check` and `npm run package:store`, then inspect the zip if package membership changed.

## Commit & Pull Request Guidelines
Follow the existing concise, imperative commit style, for example `Add site theme color resolution` or `Fix favicon cache load timing`. Keep PRs scoped to one behavior or refactor, describe user-visible changes, list validation commands, and include screenshots or short recordings for UI changes. Note any Chrome extension permission, manifest, locale, or packaging impact explicitly.

## Agent-Specific Instructions
Do not overwrite unrelated working-tree changes. Treat injected overlay UI as isolated extension-owned UI, and avoid relying on host-page CSS or icon fonts for critical controls. For Chrome Web Store packaging, use `npm run package:store` so forbidden files such as `.git/`, `.github/`, `.vscode/`, `README.md`, `AGENTS.md`, and `.DS_Store` stay out of the release archive.
