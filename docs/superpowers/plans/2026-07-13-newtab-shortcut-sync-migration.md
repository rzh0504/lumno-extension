# New-tab Shortcut Sync Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve and merge per-device legacy shortcut lists during the first synchronized release, with strict normalized-URL deduplication and safe default seeding.

**Architecture:** Extend the existing shortcut store with pure merge helpers and a versioned, per-device migration-contribution protocol. Remove shortcuts from the generic local-to-sync copier, run the dedicated migration before new-tab loading, and reconcile newly arriving device contributions in the background.

**Tech Stack:** Chrome Extension Manifest V3 storage APIs, browser-compatible JavaScript, Node.js `assert` test scripts.

---

## File Map

- Modify `src/newtab/shortcuts-store.js`: URL-strict merge policy, migration constants, storage helpers, contribution publication, and reconciliation.
- Modify `src/newtab/newtab.js`: await dedicated migration before loading or seeding shortcuts; remove shortcut key from generic migration.
- Modify `src/background/background.js`: import the shortcut store, remove generic shortcut migration, run reconciliation on startup and contribution changes.
- Modify `src/options/options.js`: remove shortcut key from generic migration.
- Modify `src/content/hotkey-listener.js`: disable page-console debug logging by default.
- Modify `scripts/test-newtab-shortcuts-store.js`: pure merge, cap, missing timestamp, default persistence, and migration protocol tests.
- Create `scripts/test-hotkey-listener-debug-logging.js`: assert page-console debug output is disabled.
- Modify `scripts/test-newtab-shortcuts-ui.js`: assert migration precedes shortcut loading and generic migration no longer handles shortcuts.
- Modify `package.json`: expose the hotkey debug regression test.

### Task 1: Restore the accepted stash through failing regression tests

**Files:**
- Modify: `scripts/test-newtab-shortcuts-store.js`
- Create: `scripts/test-hotkey-listener-debug-logging.js`
- Modify: `package.json`

- [ ] **Step 1: Add the default-persistence assertion**

After the first `loadShortcuts` call, add:

```js
assert.deepStrictEqual(
  storage.data[key],
  missingKeyShortcuts,
  'first run should persist the default shortcuts so sync/export includes them'
);
```

- [ ] **Step 2: Add the hotkey console regression test and package script**

Restore `scripts/test-hotkey-listener-debug-logging.js` from `stash@{0}` and add:

```json
"test:hotkey-listener-debug": "node scripts/test-hotkey-listener-debug-logging.js"
```

- [ ] **Step 3: Run both tests and verify RED**

Run:

```bash
node scripts/test-newtab-shortcuts-store.js
node scripts/test-hotkey-listener-debug-logging.js
```

Expected: the store test fails because the default is not persisted; the hotkey test fails because `[Lumno][hotkey-listener] listener-ready` is logged.

- [ ] **Step 4: Apply the two minimal production changes from the stash**

In `loadShortcuts`, replace the missing-key return with:

```js
const defaults = getDefaultShortcuts(opts);
return storageSet(storage, { [key]: defaults }).then(() => defaults);
```

In `src/content/hotkey-listener.js`, add `const HOTKEY_LISTENER_DEBUG = false;` and return immediately from `logHotkeyListenerDebug` when it is false.

- [ ] **Step 5: Run both tests and verify GREEN**

Run the two commands from Step 3. Expected: both exit 0 and the hotkey test prints `hotkey listener debug logging tests passed`.

- [ ] **Step 6: Commit the accepted baseline fixes**

```bash
git add package.json scripts/test-hotkey-listener-debug-logging.js scripts/test-newtab-shortcuts-store.js src/content/hotkey-listener.js src/newtab/shortcuts-store.js
git commit -m "Fix shortcut defaults and hotkey debug logging"
```

### Task 2: Implement strict merge selection with TDD

**Files:**
- Modify: `scripts/test-newtab-shortcuts-store.js`
- Modify: `src/newtab/shortcuts-store.js`

- [ ] **Step 1: Add failing merge tests**

Add tests calling the wished-for API:

```js
const merged = shortcutsStore.mergeShortcutMigrationSources([
  { sourceId: 'sync', items: syncItems },
  { sourceId: 'device-a', items: localItems }
], { maxShortcuts: 10, now: 999 });
```

Assertions must prove:

```js
assert.strictEqual(merged.filter((item) => item.url === 'https://same.example/a').length, 1);
assert.ok(merged.some((item) => item.url === 'https://same.example/a/'));
assert.strictEqual(merged.find((item) => item.url === 'https://same.example/a').title, 'Newer');
```

Create 12 unique records with `updatedAt` values 1 through 12 and assert that the returned timestamps are 12 through 3. Add a record without `updatedAt` and assert it is discarded before records with valid timestamps when the cap is exceeded.

- [ ] **Step 2: Run the store test and verify RED**

Run `node scripts/test-newtab-shortcuts-store.js`.

Expected: FAIL with `mergeShortcutMigrationSources is not a function`.

- [ ] **Step 3: Implement deterministic merge helpers**

Add and export:

```js
function getStoredUpdatedAt(item) {
  const value = Number(item && item.updatedAt);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function mergeShortcutMigrationSources(sources, options) {
  // Normalize each record with normalizeShortcutItem.
  // Key candidates by the complete normalized item.url string.
  // Replace duplicates only when the candidate has a newer stored updatedAt,
  // with sourceId and original index as stable tie-breakers.
  // Sort candidates by stored updatedAt descending, apply stable URL/source
  // tie-breakers, and return at most getMaxShortcuts(options) records.
}
```

The equality check must be `candidate.item.url === existing.item.url`; do not compare hosts or strip paths, query strings, fragments, protocols, or trailing slashes.

- [ ] **Step 4: Run the store test and verify GREEN**

Run `node scripts/test-newtab-shortcuts-store.js`. Expected: exit 0.

- [ ] **Step 5: Commit the merge policy**

```bash
git add scripts/test-newtab-shortcuts-store.js src/newtab/shortcuts-store.js
git commit -m "Add deterministic shortcut migration merge"
```

### Task 3: Implement per-device contribution reconciliation with TDD

**Files:**
- Modify: `scripts/test-newtab-shortcuts-store.js`
- Modify: `src/newtab/shortcuts-store.js`

- [ ] **Step 1: Extend the in-memory storage fixture**

Support `get(null, callback)` by returning all data, and record `set` calls:

```js
if (keys === null) {
  callback({ ...data });
  return;
}
```

- [ ] **Step 2: Add failing migration tests**

Use separate local and sync fixtures and call:

```js
await shortcutsStore.migrateLegacyShortcuts(syncStorage, localStorage, {
  key,
  maxShortcuts: 10,
  now: 100,
  createDeviceId: () => 'device-a'
});
```

Assert that:

- local A plus canonical sync B produces A+B;
- the device contribution key is unique to `device-a`;
- migration metadata records the consumed contribution ID;
- a second call makes no canonical rewrite;
- two pre-populated device contribution keys produce one merged canonical list;
- local `[]` creates canonical `[]` rather than a default;
- missing local and sync data leaves the canonical key absent for later default seeding.
- passing the same local fallback storage as both arguments performs no migration write.

- [ ] **Step 3: Run the store test and verify RED**

Run `node scripts/test-newtab-shortcuts-store.js`.

Expected: FAIL with `migrateLegacyShortcuts is not a function`.

- [ ] **Step 4: Implement the migration protocol**

Add versioned constants and export them:

```js
const SHORTCUT_MIGRATION_VERSION = 1;
const SHORTCUT_MIGRATION_DEVICE_ID_KEY = '_x_extension_newtab_shortcuts_migration_device_v1_';
const SHORTCUT_MIGRATION_CONTRIBUTION_PREFIX = '_x_extension_newtab_shortcuts_migration_contribution_v1_';
const SHORTCUT_MIGRATION_META_KEY = '_x_extension_newtab_shortcuts_migration_meta_v1_';
```

Implement `migrateLegacyShortcuts(syncStorage, localStorage, options)` to:

1. Return `{ migrated: false, hasLegacyValue: false, shortcuts: null }` without writing when either storage object is unavailable or both arguments reference the same local fallback area.
2. Read the legacy local key and persistent device ID.
3. Create and save an ID only when local contains the shortcut key.
4. Publish the local snapshot under `PREFIX + deviceId` only when that contribution is absent.
5. Read all sync items, find contribution keys absent from `meta.consumedContributionIds`, and merge only those contributions with the canonical list.
6. Write the canonical list and updated metadata in one `storage.set` call.
7. Write canonical `[]` when an explicit empty contribution is consumed.
8. Return `{ migrated, hasLegacyValue, shortcuts }` and serialize same-context calls through a module-level in-flight promise.

- [ ] **Step 5: Run the store test and verify GREEN**

Run `node scripts/test-newtab-shortcuts-store.js`. Expected: exit 0.

- [ ] **Step 6: Commit the migration protocol**

```bash
git add scripts/test-newtab-shortcuts-store.js src/newtab/shortcuts-store.js
git commit -m "Merge per-device shortcut migration contributions"
```

### Task 4: Sequence migration before loading and remove generic races

**Files:**
- Modify: `scripts/test-newtab-shortcuts-ui.js`
- Modify: `src/newtab/newtab.js`
- Modify: `src/background/background.js`
- Modify: `src/options/options.js`

- [ ] **Step 1: Add failing source-level integration assertions**

Assert that:

```js
const loadStart = newtabJs.indexOf('function loadShortcuts()');
const loadEnd = newtabJs.indexOf('function loadNewtabShortcutsVisibility()', loadStart);
const loadBody = newtabJs.slice(loadStart, loadEnd);
assert.ok(loadBody.includes('NEWTAB_SHORTCUTS_STORE.migrateLegacyShortcuts'));
assert.ok(loadBody.indexOf('NEWTAB_SHORTCUTS_STORE.migrateLegacyShortcuts') < loadBody.indexOf('NEWTAB_SHORTCUTS_STORE.loadShortcuts'));
```

Also extract each `migrateStorageIfNeeded([...])` call and assert that its argument text does not contain `NEWTAB_SHORTCUTS_STORAGE_KEY`. Assert that background imports `src/newtab/shortcuts-store.js` and checks changed keys with `SHORTCUT_MIGRATION_CONTRIBUTION_PREFIX`.

- [ ] **Step 2: Run the UI test and verify RED**

Run `node scripts/test-newtab-shortcuts-ui.js`.

Expected: FAIL because the dedicated migration is not integrated and the generic lists still contain the shortcut key.

- [ ] **Step 3: Integrate the migration**

In `loadShortcuts`, use:

```js
return NEWTAB_SHORTCUTS_STORE.migrateLegacyShortcuts(storageArea, localStorageArea, getShortcutStoreOptions())
  .then(() => NEWTAB_SHORTCUTS_STORE.loadShortcuts(storageArea, getShortcutStoreOptions()))
  .then((items) => {
    newtabShortcuts = Array.isArray(items) ? items : [];
    renderShortcuts();
    return newtabShortcuts;
  });
```

Remove `NEWTAB_SHORTCUTS_STORAGE_KEY` from all three generic migration arrays. Import `src/newtab/shortcuts-store.js` in the service worker, invoke migration at startup, and rerun it when a sync change key starts with the exported contribution prefix.

- [ ] **Step 4: Run targeted tests and verify GREEN**

Run:

```bash
node scripts/test-newtab-shortcuts-store.js
node scripts/test-newtab-shortcuts-ui.js
node scripts/test-i18n-and-sync-audit.js
```

Expected: all exit 0.

- [ ] **Step 5: Commit integration**

```bash
git add scripts/test-newtab-shortcuts-ui.js src/newtab/newtab.js src/background/background.js src/options/options.js
git commit -m "Run shortcut migration before sync loading"
```

### Task 5: Full verification and stash cleanup decision

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run syntax and focused regression checks**

```bash
npm run check
npm run test:newtab-shortcuts-store
npm run test:newtab-shortcuts-ui
npm run test:hotkey-listener-debug
npm run test:i18n-sync-audit
```

Expected: every command exits 0 with no syntax errors or assertion failures.

- [ ] **Step 2: Inspect the final diff**

Run `git diff HEAD~3 --check` and `git diff HEAD~3 --stat`. Confirm only the planned shortcut migration, accepted debug logging, tests, package script, and documentation changed.

- [ ] **Step 3: Verify repository state**

Run `git status --short` and `git stash list`. Leave the original stash untouched unless the user explicitly asks to drop it.
