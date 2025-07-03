import { type LogHandler, LogLevel, type LogRecord } from '@protontech/drive-sdk/dist/telemetry';

import { traceError } from '@proton/shared/lib/helpers/sentry';

/**
 * Log handler that sends drive-sdk ERROR level logs to Sentry.
 * TODO: This can be improved later by improving categorization of errors for exemple
 */
export class SentryLogHandler implements LogHandler {
    log(logRecord: LogRecord): void {
        // Only send ERROR logs to Sentry for now
        if (logRecord.level !== LogLevel.ERROR) {
            return;
        }

        const tags = {
            loggerName: logRecord.loggerName,
            component: 'drive-sdk',
        };

        const error = logRecord.error instanceof Error ? logRecord.error : new Error(logRecord.message);

        const extra = {
            time: logRecord.time.toISOString(),
        };

        traceError(error, { tags, extra });
    }
}
