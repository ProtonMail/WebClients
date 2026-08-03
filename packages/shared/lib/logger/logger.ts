import { decryptData, encryptData } from '@protontech/crypto/subtle/aesGcm.ts';
import { uint8ArrayToUtf8String, utf8StringToUint8Array } from '@protontech/crypto/utils';

import { DAY } from '@proton/shared/lib/constants';

import {
    CLEANUP_INTERVAL_MS,
    DEFAULT_CONSOLE_LEVELS,
    DEFAULT_LOGGER_NAME,
    DEFAULT_MAX_ENTRIES,
    DEFAULT_RETENTION_DAYS,
    MAX_PENDING_LOGS,
} from './constants';
import { IndexedDBStorage } from './storage';
import type { LogEntry, LogLevel, LoggerOptions } from './types';

/** A line that has been emitted but not yet written to storage. */
interface PendingLog {
    level: LogLevel;
    message: string;
    args: unknown[];
    timestamp: number;
}

const consoleFor = (level: LogLevel): ((...args: unknown[]) => void) => {
    // eslint-disable-next-line no-console
    const method = console[level];
    // eslint-disable-next-line no-console
    return (method ?? console.log).bind(console);
};

/** WebCrypto reports every decryption failure as a DOMException, usually `OperationError`. */
const isDecryptionError = (error: unknown): boolean =>
    error instanceof DOMException ||
    (error instanceof Error && ['OperationError', 'InvalidAccessError', 'DataError'].includes(error.name));

const serializeArg = (arg: unknown): string => {
    if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack}`;
    }
    if (typeof arg === 'string') {
        return arg;
    }
    try {
        return JSON.stringify(arg) ?? String(arg);
    } catch {
        // Circular references and BigInt would otherwise throw away the whole line.
        return String(arg);
    }
};

const timestampedFilename = (prefix: string) => `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;

export const downloadLogFile = (contents: string, filename: string): void => {
    const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain' }));

    try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    } finally {
        URL.revokeObjectURL(url);
    }
};

/**
 * Encrypted, persistent application logger.
 *
 * Lines are echoed to the console (errors only outside development) and written to
 * IndexedDB encrypted with a session-bound AES-GCM key. Persistence is best-effort:
 * where IndexedDB is unavailable, writes are dropped silently and console output is
 * unaffected.
 *
 * Lines emitted before `initialize()` are buffered and written once it resolves,
 * keeping their original timestamps.
 */
export class Logger {
    private readonly name: string;

    private readonly now: () => number;

    private storage: IndexedDBStorage | null = null;

    private encryptionKey: LoggerOptions['encryptionKey'] | null = null;

    private encryptionContext: Uint8Array<ArrayBuffer> | null = null;

    private maxEntries = DEFAULT_MAX_ENTRIES;

    private retentionDays = DEFAULT_RETENTION_DAYS;

    private consoleLevels: LogLevel[] = DEFAULT_CONSOLE_LEVELS;

    private initialized = false;

    private pending: PendingLog[] = [];

    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    private globalErrors: AbortController | null = null;

    /** Serialises storage writes so ordering is deterministic and reads can await them. */
    private writes: Promise<void> = Promise.resolve();

    /** De-duplicates concurrent `getLogs()` calls. */
    private read: Promise<string> | null = null;

    /**
     * Breaks ties between entries sharing a millisecond. The `by-timestamp` index falls
     * back to the primary key, so the key has to carry insertion order to read back in
     * the order lines were emitted.
     */
    private sequence = 0;

    /** `now` is injectable so retention behaviour can be tested without timer mocks. */
    constructor(name: string = DEFAULT_LOGGER_NAME, now: () => number = Date.now) {
        this.name = name;
        this.now = now;
    }

    public async initialize(options: LoggerOptions): Promise<void> {
        if (this.initialized) {
            // eslint-disable-next-line no-console
            console.warn(`Logger '${this.name}' already initialized, ignoring subsequent initialization`);
            return;
        }

        this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
        this.retentionDays = options.retentionDays ?? DEFAULT_RETENTION_DAYS;
        this.consoleLevels = options.consoleLevels ?? DEFAULT_CONSOLE_LEVELS;
        this.encryptionKey = options.encryptionKey;
        this.encryptionContext = utf8StringToUint8Array(`${options.appName}#${options.loggerName || this.name}`);
        this.storage = new IndexedDBStorage(this.name, options.loggerID);
        this.initialized = true;

        this.captureGlobalErrors();
        this.drainPending();
        this.startCleanup();
    }

    trace(message: string, ...args: unknown[]): void {
        this.emit('trace', message, args);
    }

    debug(message: string, ...args: unknown[]): void {
        this.emit('debug', message, args);
    }

    info(message: string, ...args: unknown[]): void {
        this.emit('info', message, args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.emit('warn', message, args);
    }

    error(message: string, ...args: unknown[]): void {
        this.emit('error', message, args);
    }

    log(message: string, ...args: unknown[]): void {
        this.emit('info', message, args);
    }

    private emit(level: LogLevel, message: string, args: unknown[]): void {
        if (process.env.NODE_ENV === 'development' || this.consoleLevels.includes(level)) {
            consoleFor(level)(`[${this.name}]`, message, ...args);
        }

        const entry: PendingLog = { level, message, args, timestamp: this.now() };

        if (!this.initialized) {
            this.pending.push(entry);
            if (this.pending.length > MAX_PENDING_LOGS) {
                this.pending.shift();
            }
            return;
        }

        this.enqueue(() => this.persist(entry));
    }

    /**
     * Appends to the write chain. Failures are swallowed: losing a diagnostic line is
     * never worth breaking the caller, and IndexedDB being unavailable is expected.
     */
    private enqueue(task: () => Promise<void>): void {
        this.writes = this.writes.then(task).catch((error) => {
            // eslint-disable-next-line no-console
            console.warn(`[${this.name}] failed to write logs:`, error);
        });
    }

    private drainPending(): void {
        const pending = this.pending;
        this.pending = [];
        // Already echoed to the console when emitted, so only persistence is replayed.
        pending.forEach((entry) => this.enqueue(() => this.persist(entry)));
    }

    private async persist({ level, message, args, timestamp }: PendingLog): Promise<void> {
        if (!this.storage || !this.encryptionKey || !this.encryptionContext) {
            return;
        }

        const payload = JSON.stringify({ message, args: args.map(serializeArg) });
        const data = await encryptData(this.encryptionKey, utf8StringToUint8Array(payload), this.encryptionContext);

        // Fixed-width sequence so the key compares in insertion order, plus a random
        // suffix so two loggers writing to one database cannot overwrite each other.
        const sequence = String(this.sequence++).padStart(12, '0');

        await this.storage.store({
            id: `${timestamp}-${sequence}-${Math.random().toString(36).slice(2, 11)}`,
            timestamp,
            level,
            data: data.toBase64(),
        });
    }

    /** Resolves once every line emitted so far has been written. */
    async flush(): Promise<void> {
        await this.writes;
    }

    async getLogs(): Promise<string> {
        if (!this.initialized) {
            return '';
        }

        if (!this.read) {
            this.read = this.readLogs().finally(() => {
                this.read = null;
            });
        }

        return this.read;
    }

    private async readLogs(): Promise<string> {
        await this.writes;

        if (!this.storage) {
            return '';
        }

        try {
            const entries = await this.storage.retrieve();
            const lines = await Promise.all(entries.map((entry) => this.format(entry)));
            return lines.join('\n');
        } catch (error) {
            if (isDecryptionError(error)) {
                // Written under a different session key, so the contents are unrecoverable.
                // eslint-disable-next-line no-console
                console.warn(`[${this.name}] failed to decrypt logs, clearing:`, error);
                await this.clearLogs();
                return '';
            }
            // eslint-disable-next-line no-console
            console.error(`[${this.name}] failed to read logs:`, error);
            return '';
        }
    }

    private async format(entry: LogEntry): Promise<string> {
        const decrypted = await decryptData(
            this.encryptionKey!,
            Uint8Array.fromBase64(entry.data),
            this.encryptionContext!
        ).then(uint8ArrayToUtf8String);

        const { message, args } = JSON.parse(decrypted) as { message: string; args: string[] };
        const timestamp = new Date(entry.timestamp).toISOString();
        const suffix = args.length > 0 ? ` ${args.join(' ')}` : '';

        return `${timestamp} ${entry.level.toUpperCase()} [${this.name}]: ${message}${suffix}`;
    }

    async clearLogs(): Promise<void> {
        if (!this.storage) {
            return;
        }

        try {
            await this.writes;
            await this.storage.clear();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`[${this.name}] failed to clear logs:`, error);
        }
    }

    async downloadLogs(filename?: string): Promise<void> {
        downloadLogFile(await this.getLogs(), filename ?? timestampedFilename(`${this.name}-logs`));
    }

    /**
     * Routes uncaught errors and unhandled rejections into this logger. Called by
     * `initialize()`; call it earlier to capture errors during bootstrap, since lines
     * emitted before initialization are buffered rather than dropped.
     */
    captureGlobalErrors(): void {
        if (typeof window === 'undefined' || this.globalErrors) {
            return;
        }

        this.globalErrors = new AbortController();
        const { signal } = this.globalErrors;

        window.addEventListener(
            'error',
            (event) => {
                this.error(
                    'Uncaught error',
                    event.message,
                    event.filename,
                    event.lineno,
                    event.colno,
                    event.error?.stack
                );
            },
            { signal }
        );

        window.addEventListener(
            'unhandledrejection',
            (event) => {
                const { reason } = event;
                this.error(
                    'Unhandled promise rejection',
                    reason instanceof Error ? `${reason.message}\n${reason.stack}` : String(reason)
                );
            },
            { signal }
        );
    }

    private startCleanup(): void {
        this.enqueue(() => this.cleanup());
        this.cleanupInterval = setInterval(() => this.enqueue(() => this.cleanup()), CLEANUP_INTERVAL_MS);
        // Keeps Node test runners from hanging on the interval.
        (this.cleanupInterval as unknown as { unref?: () => void }).unref?.();
    }

    /** Trims by age first, then by count. Runs on the write chain, never per line. */
    private async cleanup(): Promise<void> {
        if (!this.storage) {
            return;
        }

        await this.storage.removeOlderThan(this.now() - this.retentionDays * DAY);

        const count = await this.storage.count();
        if (count > this.maxEntries) {
            await this.storage.removeOldest(count - this.maxEntries);
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    async destroy(): Promise<void> {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        this.globalErrors?.abort();
        this.globalErrors = null;

        await this.writes;

        try {
            await this.storage?.close();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`[${this.name}] failed to close storage:`, error);
        }

        this.initialized = false;
        this.storage = null;
        this.encryptionKey = null;
        this.encryptionContext = null;
        this.pending = [];
        this.read = null;
        this.writes = Promise.resolve();
    }
}
