# New-tab Shortcut Sync Migration Design

## Goal

Migrate device-local shortcut lists into Chrome sync storage without silently choosing one device's list over another. Preserve existing shortcuts where possible, deduplicate only identical normalized URL strings, and seed the default Lumno shortcut only when neither legacy nor synchronized data exists.

## Existing Problem

The released version may have different shortcut arrays in `chrome.storage.local` on different devices. The current generic migration writes a local value only when the sync key is missing. Concurrent upgrades can therefore make one device win by timing. The proposed stash change can also seed the default shortcut before the legacy migration finishes, causing the migration to treat sync as already populated.

## Approaches Considered

1. One-shot local-plus-sync merge. This is small, but simultaneous device upgrades can still overwrite one another.
2. Per-device migration contributions with an idempotent reconciler. This adds migration metadata but prevents devices from writing the same staging item and allows later reconciliation. This is the selected approach.
3. Ask the user to choose one device's list. This avoids automatic ambiguity but adds a disruptive upgrade flow.

## Storage Model

- Canonical shortcut key: `_x_extension_newtab_shortcuts_2026_unique_`.
- Local device ID key: a versioned migration-only key in `chrome.storage.local`.
- Contribution key: a versioned prefix plus the device ID in `chrome.storage.sync`. Each device writes only its own contribution key.
- Migration metadata key: a versioned sync item containing the contribution IDs already incorporated into the canonical list.

Contribution records contain the device ID, migration version, publication time, and the device's legacy local shortcut array. Contribution records remain available for recovery during this migration version. Once their IDs appear in migration metadata, ordinary startup does not merge them again, so later user deletions are not continually resurrected.

## Migration Flow

1. Remove the shortcut key from the existing generic local-to-sync migration lists in the background, new-tab, and options contexts.
2. Before the new-tab page loads shortcuts, run the dedicated shortcut migration.
3. If this device has a legacy local shortcut key, create or reuse its persistent migration device ID and publish one contribution under its device-specific sync key.
4. Read the canonical shortcut list, migration metadata, and all contribution keys.
5. If there are unconsumed contributions, merge the current canonical list with only those contributions, write the merged canonical list, and record the consumed contribution IDs.
6. Reconcile again when a new contribution arrives through `chrome.storage.onChanged`. This allows simultaneous A/B upgrades to converge after both contribution keys propagate.
7. Load the canonical shortcut key only after the local migration attempt completes. Seed the default Lumno shortcut only when the canonical key is absent and no local legacy value or migration contribution exists.

The migration is idempotent: a consumed contribution is not merged repeatedly, and publishing the same device contribution key does not create duplicate sources.

## Merge Rules

1. Validate and normalize each URL with the existing shortcut URL normalizer.
2. Compare the complete normalized URL strings with strict equality (`===`). There is no hostname, path, protocol, or trailing-slash fuzzy matching.
3. For identical URL strings, retain the record with the greater stored `updatedAt` value.
4. A missing or invalid `updatedAt` ranks as `0`, so missing legacy timestamps are treated as oldest.
5. If timestamps tie, use stable source and item ordering so every device produces the same result.
6. If more than 10 unique records remain, select the 10 greatest `updatedAt` values. Apply stable URL and source tie-breakers when needed.
7. An explicitly stored empty local or sync array is data, not a missing value, and therefore prevents default seeding.

Examples of distinct URL strings after the existing normalization step include different protocols, paths, query strings, fragments, and `/a` versus `/a/`.

## Failure Handling

- If sync storage is unavailable, retain the existing local fallback behavior and do not delete legacy data.
- If contribution publication or reconciliation fails, the new-tab page may display the best available local/canonical data, but it must not overwrite existing data with the default shortcut.
- Never remove the legacy local shortcut key as part of this change. It remains a recovery source.
- Reconciliation writes are serialized per runtime context to reduce redundant writes; all operations remain safe to retry.

## Testing

Add focused tests that prove:

- sync and local lists are merged;
- exact normalized URL duplicates collapse to one item and the newer record wins;
- similar but non-identical URLs remain separate;
- more than 10 items retain the latest 10;
- missing timestamps rank as oldest;
- an explicit empty list prevents default seeding;
- a migration contribution is consumed only once;
- two device contributions converge into one canonical list;
- default seeding waits for migration and happens only when no legacy or synchronized data exists;
- existing shortcut store and new-tab UI behavior remains green;
- hotkey listener debug logging remains disabled by default.

## Non-goals

- General-purpose cross-device conflict resolution after the legacy migration.
- Fuzzy URL equivalence.
- Deleting migration recovery data in this release.
- Changing the normal shortcut limit or redesigning shortcut ordering outside migration selection.
