import { type Logger as BaseLogger, logger as baseLogger } from '@proton/logger';

export type Logger = Pick<BaseLogger, 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'log'>;

const PREFIX = '[ContentSearch] ';

export class LoggerProxy implements Logger {
    constructor(private readonly logger: BaseLogger | undefined) {}
    trace(message: string, ...args: unknown[]): void {
        this.logger?.trace(PREFIX + message, ...args);
    }
    debug(message: string, ...args: unknown[]): void {
        this.logger?.debug(PREFIX + message, ...args);
    }
    info(message: string, ...args: unknown[]): void {
        this.logger?.info(PREFIX + message, ...args);
    }
    warn(message: string, ...args: unknown[]): void {
        this.logger?.warn(PREFIX + message, ...args);
    }
    error(message: string, ...args: unknown[]): void {
        this.logger?.error(PREFIX + message, ...args);
    }
    log(message: string, ...args: unknown[]): void {
        this.logger?.log(PREFIX + message, ...args);
    }
}

export const logger = new LoggerProxy(baseLogger) as Logger;
