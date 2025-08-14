import { type LogHandler, LogLevel, type LogRecord } from '@protontech/drive-sdk/dist/telemetry';

import { traceError } from '@proton/shared/lib/helpers/sentry';

/**
 * Log handler that sends error and warning logs to Sentry with drive-sdk-log
 * tag at debug level for further investigation when needed.
 */
export class SentryLogHandler implements LogHandler {
    log(logRecord: LogRecord): void {
        if (logRecord.level !== LogLevel.ERROR && logRecord.level !== LogLevel.WARNING) {
            return;
        }

        const error = logRecord.error instanceof Error ? logRecord.error : new Error(logRecord.message);

        traceError(error, {
            level: 'debug', // Debug as we need it only when we investigate issues.
            tags: {
                component: 'drive-sdk-log',
            },
            extra: {
                loggerName: logRecord.loggerName,
                logTime: logRecord.time.toISOString(),
                logLevel: logRecord.level,
                logMessage: logRecord.message,
            },
        });
    }
}
