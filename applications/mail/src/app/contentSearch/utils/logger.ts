import { type Logger as BaseLogger, logger as baseLogger } from '@protontech/logger';

export type Logger = Pick<BaseLogger, 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'log'>;

const PREFIX = '[ContentSearch] ';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'log';

export class LoggerProxy implements Logger {
    constructor(
        private readonly logger: BaseLogger | undefined,
        private readonly prefix = PREFIX
    ) {}
    trace(message: string, ...args: unknown[]): void {
        this.logger?.trace(this.prefix + message, ...args);
    }
    debug(message: string, ...args: unknown[]): void {
        this.logger?.debug(this.prefix + message, ...args);
    }
    info(message: string, ...args: unknown[]): void {
        this.logger?.info(this.prefix + message, ...args);
    }
    warn(message: string, ...args: unknown[]): void {
        this.logger?.warn(this.prefix + message, ...args);
    }
    error(message: string, ...args: unknown[]): void {
        this.logger?.error(this.prefix + message, ...args);
    }
    log(message: string, ...args: unknown[]): void {
        this.logger?.log(this.prefix + message, ...args);
    }
}

export const logger = new LoggerProxy(baseLogger) as Logger;

/**
 * A logger whose lines carry an id of its own, created once per tab: the tabs of a user write to the same logs.
 * Workers log through the tab that started them.
 */
export function createTabLogger(): Logger {
    const tabId = Array.from(crypto.getRandomValues(new Uint8Array(4)), (byte) => {
        return byte.toString(16).padStart(2, '0');
    }).join('');
    return new LoggerProxy(baseLogger, `${PREFIX}[tab ${tabId}] `);
}
