# Plan: Simplify `@proton/shared/lib/logger`

**Created:** 2026-08-03 **Status:** Complete — 43/43 tests passing, typecheck + lint clean. **Decisions:** IndexedDB-only persistence. When IndexedDB is unavailable, persistence degrades **silently** (console output continues, no warning surfaced).

**Result:** 1,192 → 639 lines of source across 6 files. Tests 735 → 618 lines across 2 files, now exercising real IndexedDB. `loglevel` removed from `@proton/shared` dependencies.

---

## Goal

Reduce ~1,192 lines across 8 files to ~400 lines across 6 files, keeping exactly the behaviour the 5 real consumers depend on, with the one surviving persistence path actually under test.

## Consumers that must keep working

| File | API used |
| --- | --- |
| `applications/mail/src/app/bootstrap.ts` | `loggerManager.createLogger('mail', {...})` |
| `applications/mail/src/app/mailLogger.ts` | `loggerManager.getLogger('mail')` + `.debug/.info/.warn/.error` |
| `applications/mail/src/app/components/debug/DebugModalLogs.tsx` | `getLogger`, `getLogs`, `clearLogs`, `downloadLogs` |
| `applications/mail/src/app/components/drawer/MailQuickSettings.tsx` | `clearAllLogs`, `downloadAllLogs` |
| `packages/components/containers/support/BugModal.tsx` | `preCacheAllLogs`, `getAllCachedLogs`, `downloadAllLogs` → **migrates to `getAllLogs`** |

---

## Changes

### 1. IndexedDB only

Delete `storage/LocalStorage.ts`, `storage/MemoryStorage.ts`, `storage/types.ts`, `storage/index.ts`, the `Storage` interface, `tryFallbackStorage()`, the `detectStorageCapabilities()` call, and `forceMemoryStorage`. `detectStorageCapabilities` itself stays in `helpers/browser.ts` — used by `encrypted-search` and mail. IndexedDB unavailable ⇒ `store()` throws ⇒ caught and swallowed in `persist()`. Console logging unaffected.

### 2. Drop `loglevel`

The class sets `setLevel('trace')`, disabling loglevel's filtering, then reimplements gating and the method surface itself. `rawMethod` reduces to a bound console method. Removes `methodFactory`, `rebuild()`, `assignLoggingMethods()`, `getLoglevelInstance()`, `setupPersistencePlugin()`. Replace `LogLevelNumbers` with a local `LogLevel` string union.

### 3. Remove the cache layer

Delete `cachedLogs`, `cacheInvalidated`, `preCachingPromise`, `preCacheLogs()`, `performPreCaching()`, `getCachedLogs()`, `preCacheAllLogs()`, `getAllCachedLogs()`. The cache was invalidated on every persisted line, so it was near-permanently stale. `getLogs()` gains in-flight dedupe. BugModal owns its own warm-up: kick off `getAllLogs()` on open, await that promise on submit.

### 4. Stable logging methods

Delete `createStubMethod` + `assignLoggingMethods`. `debug/info/warn/error/trace/log` become real methods branching on `initialized` internally — stable identity, destroy-safe.

### 5. One encrypt per entry

`LogEntry` becomes `{ id, timestamp, level, data }` where `data` is the AES-GCM ciphertext of `JSON.stringify({ message, args })`. Was 1 + N encrypts and base64 encodes per line. Deletes `processArgs()`. DB schema version bumped to 2; old entries dropped on upgrade (7-day diagnostic data, no migration).

### 6. Never delete the database

`removeOlderThan` no longer deletes the DB when empty; `clear()` uses `db.clear('logs')`. Removes the "detect deletion via a throwing `getCount()` then re-initialize" path in `removeOldLogs()` and the reinit in `clearLogs()`.

### 7. Bound entries on the cleanup tick

Move `enforceMaxEntries()` out of the per-write path into the daily cleanup, alongside `removeOlderThan`. Saves a `count()` round-trip per log line.

### 8. Global error handler via `addEventListener`

Replace the `window.onerror` / `window.onunhandledrejection` save-chain-restore with `addEventListener('error')` / `('unhandledrejection')` + an `AbortController` for teardown. **Enable in `initialize()`, not the constructor** — currently the module-scope default logger patches global handlers as an import side effect.

### 9. Single pending queue

Delete `logOrQueue` (ignores its `level` arg and always calls `error()`). `processPendingLogs` currently replays through the level switch, re-stamping `Date.now()` and discarding the queued timestamp. Replaced by persisting buffered entries directly with their original timestamps.

### 10. Config in one place

`maxEntries` / `retentionDays` / console levels are accepted only by `initialize()`, not by both the constructor and `initialize()`.

### 11. Remove dead API

`getLoglevelInstance()` (zero references repo-wide), `getEncryptionContextString()`, `getName()`, `getAllLoggers()`, `triggerCleanup()`. Kept: `isInitialized()`, `destroy()`, `removeLogger()`, `destroyAll()`.

---

## Target layout

```
packages/shared/lib/logger/
  index.ts       # public surface
  logger.ts      # Logger class            (~200 lines)
  manager.ts     # LoggerManager           (~70 lines)
  storage.ts     # IndexedDBStorage        (~75 lines)
  types.ts       # LogLevel, LogEntry, LoggerOptions
  constants.ts   # trimmed
```

Deleted: `storage/` directory (5 files).

---

## Testing

`packages/shared` runs **vitest in real Chromium** (playwright browser mode) — real IndexedDB is available, so no `fake-indexeddb` and no memory-storage test double is needed. This is what makes removing `forceMemoryStorage` viable.

- `test/logger/logger.spec.ts` — behaviour: init, queueing, levels, encryption round-trip, retention, download, destroy.
- `test/logger/storage.spec.ts` — `IndexedDBStorage` in isolation.
- Inject `now()` into `Logger` so retention tests are deterministic without timer mocks.
- Each test uses a unique `loggerID` so databases don't collide across tests.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| Mail loses logs where IndexedDB is blocked | Accepted (explicit decision). Console output unaffected. |
| BugModal submit slower without pre-cache | BugModal owns the warm-up promise; per-entry decrypt cost drops ~6× from change 5. |
| Old log DBs orphaned by schema bump | Version 2 upgrade clears the store; old `proton-logger-*` DBs from the localStorage fallback are unreachable anyway. |
| `loglevel` still in `packages/shared` deps | Remove from `package.json` only if lockfile can be regenerated cleanly; otherwise flag as follow-up. |

---

## Progress

| #   | Change                           | Status |
| --- | -------------------------------- | ------ |
| 1   | IndexedDB only                   | Done   |
| 2   | Drop loglevel                    | Done   |
| 3   | Remove cache layer               | Done   |
| 4   | Stable logging methods           | Done   |
| 5   | One encrypt per entry            | Done   |
| 6   | Never delete the database        | Done   |
| 7   | Bound entries on cleanup tick    | Done   |
| 8   | Global error handler rewrite     | Done   |
| 9   | Single pending queue             | Done   |
| 10  | Config in one place              | Done   |
| 11  | Remove dead API                  | Done   |
| —   | Update BugModal                  | Done   |
| —   | Rewrite tests                    | Done   |
| —   | Update usage docs                | Done   |
| —   | Remove `loglevel` dep + lockfile | Done   |
| —   | Typecheck + tests green          | Done   |

## Found during implementation (not in the original plan)

**Entry ordering was broken for same-millisecond writes.** The `by-timestamp` index falls back to the primary key for ties, and the key ended in `Math.random()`, so lines emitted within one millisecond read back in arbitrary order. Caught by the "writes lines in the order they were emitted" test. Fixed by making the key `${timestamp}-${paddedSequence}-${random}`, where the per-logger sequence carries insertion order. This bug also existed in the original implementation.

## Behaviour changes to be aware of

- **Global error capture now starts at `initialize()`**, not at construction. Importing the module no longer patches the host page's error handling. `captureGlobalErrors()` is public so bootstrap can opt in earlier; pre-init lines are buffered, so nothing is lost.
- **Pre-init lines are now echoed to the console** as they are emitted, instead of being silently queued behind a one-time "logger not authorized" warning.
- **BugModal owns its log warm-up.** It kicks off `getAllLogs()` on open and awaits that same promise on submit, replacing `preCacheAllLogs()` / `getAllCachedLogs()`.
- **Old log databases are dropped** on first run via the v2 schema upgrade.
