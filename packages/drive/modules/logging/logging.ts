import type { LogHandler, LogRecord } from '@protontech/drive-sdk/dist/telemetry';
import { ConsoleLogHandler, LogLevel, MemoryLogHandler } from '@protontech/drive-sdk/dist/telemetry';

import { SentryLogHandler } from './sentryLogHandler';

/**
 * The logging system for the Drive SDK.
 *
 * It combines log handlers into a single log handler that sends all log
 * messages to the console, memory (for later retrieval) and Sentry log
 * handlers.
 *
 * It acts as a logger factory, log handler and log provider.
 *
 * You can use it to create a logger instance to log messages to default log
 * handlers. Call `getLogger` to get a logger instance.
 *
 * ```typescript
 * const logger = loggingSingleton.getLogger('my-module');
 * logger.info('Module initialized');
 * ```
 *
 * You can also use it as a unified log handler supported by the Drive SDK
 * telemetry system. Call `log` to capture any log message from the Drive SDK.
 *
 * ```typescript
 * const sdkTelemetry = new Telemetry({
 *     logHandlers: [loggingSingleton],
 *     // ...
 * });
 * ```
 *
 * Finally, you can retrieve all logs (both from your own loggers or from
 * the Drive SDK) collected in memory using `getLogs`.
 *
 * ```typescript
 * const logs = loggingSingleton.getLogs();
 * console.log(logs);
 * ```
 */
type LoggingOptions = {
    sentryComponent?: string;
};

export class Logging implements LogHandler {
    private logHandlers: LogHandler[];

    private memoryLogHandler: MemoryLogHandler;

    constructor(options: LoggingOptions = {}) {
        this.memoryLogHandler = new MemoryLogHandler();
        const sentryLogHandler = new SentryLogHandler(options.sentryComponent);

        this.logHandlers = [new ConsoleLogHandler(), this.memoryLogHandler, sentryLogHandler];
    }

    getLogger(name: string): Logger {
        return new Logger(name, this);
    }

    log(logRecord: LogRecord): void {
        this.logHandlers.forEach((handler) => handler.log(logRecord));
    }

    getLogs(): string[] {
        return this.memoryLogHandler.getLogs();
    }
}

class Logger {
    constructor(
        private name: string,
        private handler: LogHandler
    ) {
        this.name = name;
        this.handler = handler;
    }

    debug(message: string) {
        this.handler.log({
            time: new Date(),
            level: LogLevel.DEBUG,
            loggerName: this.name,
            message,
        });
    }

    info(message: string) {
        this.handler.log({
            time: new Date(),
            level: LogLevel.INFO,
            loggerName: this.name,
            message,
        });
    }

    warn(message: string) {
        this.handler.log({
            time: new Date(),
            level: LogLevel.WARNING,
            loggerName: this.name,
            message,
        });
    }

    error(message: string, error?: unknown) {
        this.handler.log({
            time: new Date(),
            level: LogLevel.ERROR,
            loggerName: this.name,
            message,
            error,
        });
    }
}
