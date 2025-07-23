# Logger Usage Documentation

## Overview

The Proton logger utility provides encrypted, persistent logging with support for multiple storage backends (IndexedDB, LocalStorage, Memory). It's designed for secure client-side logging with session-bound encryption using AES-GCM.

## 1. How to Initialize the Logger with Authentication

### Step 1: Generate Encryption Key

```typescript
import { createAuthentication } from '@proton/account/bootstrap';
import { generateLoggerKey } from '@proton/shared/lib/authentication/loggerKey';

// Create authentication store
const authentication = createAuthentication();

// Generate session-bound encryption key
const { key: loggerKey, ID: loggerID } = await generateLoggerKey(authentication);
```

### Step 2: Initialize Logger

```typescript
import logger from '@proton/shared/lib/logger';

// Initialize default logger
await logger.initialize({
    encryptionKey: loggerKey, // Required: AES-GCM encryption key
    appName: 'mail', // Required: Application name for encryption context
    loggerName: 'main', // Optional: Logger instance name (default: 'default')
    loggerID: loggerID, // Optional: Unique ID for database naming
    maxEntries: 10000, // Optional: Maximum log entries (default: 10000)
    retentionDays: 7, // Optional: Log retention period (default: 7 days)
});
```

### Multiple Logger Instances

```typescript
import { loggerManager } from '@proton/shared/lib/logger';

// Create specific logger for API calls
const apiLogger = await loggerManager.createLogger('api', {
    encryptionKey: loggerKey,
    appName: 'mail',
    loggerName: 'api-client',
    loggerID: loggerID,
});

// Create UI-specific logger
const uiLogger = await loggerManager.createLogger('ui', {
    encryptionKey: loggerKey,
    appName: 'mail',
    loggerName: 'ui-events',
    loggerID: loggerID,
});
```

### Pre-initialization Logging

Logs can be added before initialization - they'll be queued and processed once the logger is initialized:

```typescript
const myLogger = new Logger('api');
myLogger.info('This will be queued'); // Queued until initialize() is called

await myLogger.initialize(options);
// Queued logs are now processed and persisted
```

## 2. How to Add Logs

### Standard Log Levels

```typescript
// Debug level - detailed diagnostic information
logger.debug('Processing user request', { userId: 123, action: 'fetch_emails' });

// Info level - general information
logger.info('User successfully logged in', { timestamp: Date.now(), sessionId: 'abc123' });

// Warning level - potentially harmful situations
logger.warn('API rate limit approaching', { remaining: 10, resetTime: Date.now() + 60000 });

// Error level - error events
logger.error('Failed to save message', error, { messageId: 'msg_456', retryCount: 3 });

// Trace level - finest-grained informational events
logger.trace('Function entry', { functionName: 'processMessage', args: ['arg1', 'arg2'] });

// General log (equivalent to info)
logger.log('General log message');
```

### Error Logging

```typescript
// Errors are automatically formatted with stack traces
try {
    await riskyOperation();
} catch (error) {
    logger.error('Operation failed', error, {
        operation: 'riskyOperation',
        userId: currentUser.id,
    });
    // Output: "Operation failed Error: Something went wrong\n[stack trace]"
}
```

### Logging with Context

```typescript
// Add contextual information as additional arguments
logger.info('Email sent successfully', {
    recipient: 'user@example.com',
    messageId: 'msg_789',
    size: 1024,
    attachments: 2,
});

// Multiple context objects
logger.debug(
    'Processing batch',
    { batchId: 'batch_001', size: 50 },
    { startTime: Date.now(), memory: process.memoryUsage() }
);
```

## 3. How to Fetch and Download Logs

### Retrieve Logs as String

```typescript
// Get logs from single logger instance
const logs = await logger.getLogs();
console.log(logs);
// Output format: [2024-01-15T10:30:00.000Z] INFO: User logged in userId=123

// Get logs from all logger instances
const allLogs = await loggerManager.getAllLogs();
// Output includes headers separating each logger instance
```

### Download Logs to File

```typescript
// Download single logger's logs with custom filename
await logger.downloadLogs('my-app-logs.txt');

// Download with auto-generated filename
await logger.downloadLogs();
// Downloads as: main-logs-2024-01-15T10-30-00-000Z.txt

// Download combined logs from all logger instances
await loggerManager.downloadAllLogs('complete-app-logs.txt');

// Download specific logger instance
const apiLogger = loggerManager.getLogger('api');
await apiLogger.downloadLogs('api-logs.txt');
```

### Clear Logs

```typescript
// Clear logs from single logger
await logger.clearLogs();

// Clear logs from all logger instances
await loggerManager.clearAllLogs();

// Clear specific logger
const apiLogger = loggerManager.getLogger('api');
await apiLogger.clearLogs();
```

## Advanced Usage

### Logger Management

```typescript
// Check if logger is initialized
if (logger.isInitialized()) {
    logger.info('Logger is ready');
}

// Get logger information
const loggerName = logger.getName(); // Returns: 'main'
const encryptionContext = logger.getEncryptionContextString(); // Returns: 'mail#main'

// Manual cleanup of old logs
await logger.triggerCleanup();

// Destroy logger and clean up resources
logger.destroy();
```

### Logger Manager Operations

```typescript
// Get existing logger or create new one
const uiLogger = loggerManager.getLogger('ui') || (await loggerManager.createLogger('ui', options));

// Get all managed loggers
const allLoggers = loggerManager.getAllLoggers();
console.log('Active loggers:', Object.keys(allLoggers));

// Remove specific logger
loggerManager.removeLogger('api');

// Destroy all loggers
loggerManager.destroyAll();
```

### Global Error Handling

```typescript
// Check if global error handler is enabled (enabled by default)
const isEnabled = logger.globalErrorHandler?.isEnabled();

// Disable global error capturing
logger.globalErrorHandler?.disable();

// Re-enable global error capturing
logger.globalErrorHandler?.enable();
```

## Complete Example: Mail Application Setup

```typescript
import { createAuthentication } from '@proton/account/bootstrap';
import { generateLoggerKey } from '@proton/shared/lib/authentication/loggerKey';
import logger from '@proton/shared/lib/logger';
import { loggerManager } from '@proton/shared/lib/logger';

async function initializeLogging() {
    // 1. Create authentication and generate encryption key
    const authentication = createAuthentication();
    const { key: loggerKey, ID: loggerID } = await generateLoggerKey(authentication);

    // 2. Initialize main application logger
    await logger.initialize({
        encryptionKey: loggerKey,
        appName: 'mail',
        loggerID: loggerID,
        loggerName: 'main',
        maxEntries: 15000,
        retentionDays: 14,
    });

    // 3. Create specialized loggers
    const apiLogger = await loggerManager.createLogger('api', {
        encryptionKey: loggerKey,
        appName: 'mail',
        loggerName: 'api-client',
        loggerID: loggerID,
    });

    const uiLogger = await loggerManager.createLogger('ui', {
        encryptionKey: loggerKey,
        appName: 'mail',
        loggerName: 'ui-events',
        loggerID: loggerID,
    });

    // 4. Start logging
    logger.info('Mail application logging initialized');
    apiLogger.info('API logger ready');
    uiLogger.info('UI logger ready');

    return { logger, apiLogger, uiLogger };
}

// Usage throughout the application
async function exampleUsage() {
    const { logger, apiLogger, uiLogger } = await initializeLogging();

    // Log application events
    logger.info('User session started', { userId: 'user123' });

    // Log API calls
    apiLogger.debug('Fetching user emails', { folderId: 'inbox', limit: 50 });

    // Log UI interactions
    uiLogger.trace('Button clicked', { button: 'compose', location: 'toolbar' });

    // Handle errors
    try {
        await sendEmail();
    } catch (error) {
        apiLogger.error('Failed to send email', error, {
            recipient: 'user@example.com',
            attemptNumber: 1,
        });
    }

    // Download logs when needed
    await loggerManager.downloadAllLogs('mail-debug-logs.txt');
}
```

## Storage and Security

### Storage Backends

The logger automatically selects the best available storage:

1. **IndexedDB** (preferred) - Database: `proton-logger-{loggerName}-{loggerID}`
2. **LocalStorage** (fallback) - Key: `proton-logger-{loggerName}-{loggerID}-logs`
3. **Memory** (last resort) - Volatile storage

### Encryption

- Uses **AES-GCM** encryption with session-bound keys
- Encryption context: `{appName}#{loggerName}`
- Keys derived from user authentication using HKDF
- Each log entry and its arguments are encrypted separately
- Logs are only accessible with the correct encryption key

### Automatic Cleanup

- Old logs are automatically cleaned up based on `retentionDays` and `maxEntries`
- Cleanup runs daily (every 24 hours) and can be triggered manually with `triggerCleanup()`
- **Cross-Database Cleanup**: Each logger instance also cleans up old logs from ALL other `proton-logger-*` databases during cleanup
    - Ensures consistent retention policy across all logger instances
    - Prevents accumulation of logs from inactive or destroyed logger instances
    - Uses the same `retentionDays` setting for all databases
    - Handles locked/busy databases gracefully (continues if one database fails)

### Global Error Handling

The logger automatically captures and logs global JavaScript errors and unhandled promise rejections:

```typescript
// Global error handler is enabled by default when logger is created
const logger = new Logger('myApp'); // Global error handler enabled immediately

// Errors are captured even before initialization
throw new Error('This will be captured'); // Queued until initialization

await logger.initialize(options); // Queued errors are now processed and logged

// Check global error handler status
console.log('Global errors enabled:', logger.globalErrorHandler?.isEnabled());

// Manually control global error handling
logger.globalErrorHandler?.disable(); // Stop capturing global errors
logger.globalErrorHandler?.enable(); // Resume capturing global errors
```

**What gets captured:**

- `window.onerror` - JavaScript runtime errors with file, line, column info
- `window.onunhandledrejection` - Unhandled promise rejections with stack traces
- Errors are logged with level `error` and include stack traces when available
- Original error handlers are preserved and called after logging
