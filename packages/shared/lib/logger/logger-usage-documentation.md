# Logger Usage Documentation

## Overview

Encrypted, persistent client-side logging. Lines are echoed to the console and written to IndexedDB, encrypted with a session-bound AES-GCM key.

Persistence is **best-effort**: where IndexedDB is unavailable (private browsing, blocked storage, some webviews) writes are dropped silently and console output is unaffected.

> **Never log private or sensitive data.** Logs are attached to bug reports at the user's choice, and the encryption key is session-bound, not a guarantee of confidentiality against anyone with access to the device.

## 1. Initialization

### Step 1 — generate a session-bound key

```typescript
import { createAuthentication } from '@proton/account/bootstrap';
import { generateLoggerKey } from '@proton/shared/lib/authentication/loggerKey';

const authentication = createAuthentication();
const { key: loggerKey, ID: loggerID } = await generateLoggerKey(authentication);
```

### Step 2 — create the logger

```typescript
import { loggerManager } from '@proton/shared/lib/logger';

const logger = await loggerManager.createLogger('mail', {
    encryptionKey: loggerKey, // required: AES-GCM key
    appName: 'mail', // required: part of the encryption context
    loggerID, // required: part of the database name
    loggerName: 'mail', // optional: encryption context, defaults to the logger name
    maxEntries: 10_000, // optional, default 10 000
    retentionDays: 7, // optional, default 7
    consoleLevels: ['error'], // optional, default ['error'] outside development
});
```

Read the same instance back anywhere with `loggerManager.getLogger('mail')`.

### Pre-initialization logging

Lines emitted before `initialize()` resolves are buffered (up to 1 000) and written once it does, **keeping their original timestamps**. They are echoed to the console immediately.

```typescript
const logger = loggerManager.getLogger('api');
logger.info('buffered until initialize() resolves');
await logger.initialize(options);
```

## 2. Writing logs

```typescript
logger.trace('Function entry', { fn: 'processMessage' });
logger.debug('Processing request', { userId: 123 });
logger.info('User logged in', { sessionId: 'abc123' });
logger.warn('Rate limit approaching', { remaining: 10 });
logger.error('Failed to save', error, { messageId: 'msg_456' });
logger.log('Equivalent to info');
```

Arguments are serialized before encryption: `Error`s keep their stack, strings pass through, everything else is JSON-stringified. Circular structures fall back to `String(value)` rather than discarding the line.

In development every level goes to the console. Otherwise only the levels in `consoleLevels` do — errors by default. Persistence is unaffected by console filtering.

## 3. Reading, downloading, clearing

```typescript
// One logger
const logs = await logger.getLogs();
// 2026-01-02T03:04:05.000Z INFO [mail]: User logged in {"sessionId":"abc123"}

// Every initialized logger, separated by a blank line
const allLogs = await loggerManager.getAllLogs();

await logger.downloadLogs(); // mail-logs-2026-01-02T03-04-05-000Z.log
await logger.downloadLogs('custom.log');
await loggerManager.downloadAllLogs();

await logger.clearLogs();
await loggerManager.clearAllLogs();
```

`getLogs()` awaits any pending writes first, so a line is always visible to the read that follows it. Concurrent calls share one read.

If entries cannot be decrypted — typically a database left by a previous session — they are cleared and an empty string is returned.

## 4. Lifecycle

```typescript
logger.isInitialized();

// Resolves once every line emitted so far has been written. Mainly useful in tests.
await logger.flush();

await logger.destroy(); // stops cleanup, closes storage
await loggerManager.removeLogger('mail'); // destroy and forget
await loggerManager.destroyAll();
```

The logger records only what you pass it. It attaches no `window` listeners, so uncaught errors and unhandled rejections are not captured — log them explicitly from your own handler if you want them.

## 5. Retention

A cleanup pass runs at initialization and then daily. It removes entries older than `retentionDays`, then trims the oldest until at most `maxEntries` remain. Cleanup never runs on the per-line write path.

## Testing

`packages/shared` runs vitest in real Chromium, so tests exercise genuine IndexedDB — there is no memory or localStorage backend to substitute.

```typescript
// Inject a clock to test retention without timer mocks
const logger = new Logger('test', () => fixedTimestamp);
await logger.initialize({ encryptionKey, appName: 'test-app', loggerID: uniqueId });

logger.info('a line');
await logger.flush(); // or just await getLogs(), which flushes first

// Use a unique loggerID per test so databases never collide
```
