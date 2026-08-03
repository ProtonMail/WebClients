import { DEFAULT_LOGGER_NAME } from './constants';
import { Logger, downloadLogFile } from './logger';
import type { LoggerOptions } from './types';

/**
 * Registry of named `Logger` instances.
 *
 * Apps typically create one logger per area in bootstrap and read them back by name
 * elsewhere. The `all*` helpers exist for support flows that need every logger at once.
 */
class LoggerManager {
    private loggers = new Map<string, Logger>();

    /** Returns the logger for `name`, creating an uninitialized one if needed. */
    getLogger(name: string = DEFAULT_LOGGER_NAME): Logger {
        const existing = this.loggers.get(name);
        if (existing) {
            return existing;
        }

        const logger = new Logger(name);
        this.loggers.set(name, logger);
        return logger;
    }

    async createLogger(name: string, options: LoggerOptions): Promise<Logger> {
        const logger = this.getLogger(name);
        await logger.initialize(options);
        return logger;
    }

    private initializedLoggers(): Logger[] {
        return [...this.loggers.values()].filter((logger) => logger.isInitialized());
    }

    async getAllLogs(): Promise<string> {
        const logs = await Promise.all(this.initializedLoggers().map((logger) => logger.getLogs()));
        return logs.filter((entry) => entry.trim()).join('\n\n');
    }

    async clearAllLogs(): Promise<void> {
        await Promise.all(this.initializedLoggers().map((logger) => logger.clearLogs()));
    }

    async downloadAllLogs(filename?: string): Promise<void> {
        const logs = await this.getAllLogs();
        downloadLogFile(logs, filename ?? `all-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
    }

    async removeLogger(name: string): Promise<void> {
        const logger = this.loggers.get(name);
        if (!logger) {
            return;
        }

        await logger.destroy();
        this.loggers.delete(name);
    }

    async destroyAll(): Promise<void> {
        await Promise.all([...this.loggers.values()].map((logger) => logger.destroy()));
        this.loggers.clear();
    }
}

export const loggerManager = new LoggerManager();

/** Convenience singleton for apps that only need one logger. */
export const logger = loggerManager.getLogger(DEFAULT_LOGGER_NAME);
