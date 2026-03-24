import { type LogHandler, LogLevel, type LogRecord } from '@protontech/drive-sdk/dist/telemetry';

import { addSentryBreadcrumb, traceError } from '@proton/shared/lib/helpers/sentry';

export const NO_SENTRY_COMPONENT_DEFINED = 'no-sentry-component-defined';

const LOG_LEVEL_TO_SENTRY = {
    [LogLevel.DEBUG]: 'debug',
    [LogLevel.INFO]: 'info',
    [LogLevel.WARNING]: 'warning',
    [LogLevel.ERROR]: 'error',
} as const;

/**
 * Log handler that records every log line as a Sentry breadcrumb and sends
 * ERROR-level logs as separate Sentry issues.
 */
export class SentryLogHandler implements LogHandler {
    constructor(private readonly component: string = NO_SENTRY_COMPONENT_DEFINED) {}

    log(logRecord: LogRecord): void {
        addSentryBreadcrumb({
            category: 'drive.logger',
            message: logRecord.message,
            level: LOG_LEVEL_TO_SENTRY[logRecord.level],
            timestamp: logRecord.time.getTime() / 1000,
            data: {
                component: this.component,
                loggerName: logRecord.loggerName,
                logLevel: logRecord.level,
            },
        });

        if (logRecord.level !== LogLevel.ERROR) {
            return;
        }

        const error = logRecord.error instanceof Error ? logRecord.error : new Error(logRecord.message);

        traceError(error, {
            level: 'debug', // Debug as we need it only when we investigate issues.
            tags: {
                component: this.component,
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
