/* eslint-disable no-console */
import { encryptData } from '@protontech/crypto/subtle/aesGcm.ts';
import { utf8StringToUint8Array } from '@protontech/crypto/utils';

import {
    CLEANUP_INTERVAL_MS,
    DAY,
    DEFAULT_CONSOLE_LEVELS,
    DEFAULT_LOGGER_NAME,
    DEFAULT_MAX_ENTRIES,
    DEFAULT_RETENTION_DAYS,
    MAX_PENDING_LOGS,
} from './constants';
import { IndexedDBStorage } from './storage';
import type { LogLevel, LoggerOptions } from './types';
import type { LogReaderOptions } from './worker/LogReader';

/** A line that has been emitted but not yet written to storage. */
interface PendingLog {
    level: LogLevel;
    message: string;
    args: unknown[];
    timestamp: number;
}

const consoleFor = (level: LogLevel): ((...args: unknown[]) => void) => {
    const method = console[level];
    return (method ?? console.log).bind(console);
};

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
    performance.mark(`logger:downloadLogFile:start`);
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
        performance.measure(`logger:downloadLogFile`, `logger:downloadLogFile:start`);
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
 *
 * One instance per application: every area logging to the same database is what keeps the
 * lines in one chronological order. Use the exported `logger` rather than constructing this,
 * outside of tests.
 */
export class Logger {
    /** Prefixes log lines and names the database. Replaced by `initialize`. */
    private name: string = DEFAULT_LOGGER_NAME;

    private loggerID: string | null = null;

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

    /**
     * `now` is injectable so retention behaviour can be tested without timer mocks.
     * `readLogsInWorker` is injectable so tests can read through an in-process `LogReader`
     * instead of a real worker. Left undefined by default and imported lazily in `readLogs`,
     * so importing `Logger` doesn't pull in the worker module.
     */
    constructor(
        now: () => number = Date.now,
        private readLogsInWorker?: (options: LogReaderOptions) => Promise<string>
    ) {
        this.now = now;
    }

    public async initialize(options: LoggerOptions): Promise<void> {
        if (this.initialized) {
            console.warn(`Logger '${this.name}' already initialized, ignoring subsequent initialization`);
            return;
        }

        this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
        this.retentionDays = options.retentionDays ?? DEFAULT_RETENTION_DAYS;
        this.consoleLevels = options.consoleLevels ?? DEFAULT_CONSOLE_LEVELS;
        this.encryptionKey = options.encryptionKey;
        this.name = options.loggerName ?? options.appName;
        this.loggerID = options.loggerID ?? null;
        this.encryptionContext = utf8StringToUint8Array(`${options.appName}#${this.name}`);
        this.storage = new IndexedDBStorage(this.name, options.loggerID);
        this.initialized = true;

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

        // Kept apart from `storage.store`'s own mark so crypto cost can be told apart from IndexedDB.
        performance.mark(`logger-${this.name}:persist:encrypt:start`);
        const data = await encryptData(this.encryptionKey, utf8StringToUint8Array(payload), this.encryptionContext);
        performance.measure(`logger-${this.name}:persist:encrypt`, `logger-${this.name}:persist:encrypt:start`);

        // Fixed-width sequence so the key compares in insertion order. The sequence restarts
        // at zero on every page load, so the random suffix keeps a new session from overwriting
        // an entry a previous one wrote in the same millisecond.
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

    /**
     * Reads every stored line back, decrypted, oldest first.
     */
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

    /**
     * Decrypts in a worker, so that reading a large history cannot stall the UI.
     */
    private async readLogs(): Promise<string> {
        if (!this.loggerID || !this.encryptionKey || !this.encryptionContext) {
            return '';
        }

        performance.mark(`logger-${this.name}:readLogs:waitForWrites:start`);
        await this.writes;
        performance.measure(
            `logger-${this.name}:readLogs:waitForWrites`,
            `logger-${this.name}:readLogs:waitForWrites:start`
        );

        try {
            const readLogsInWorker =
                this.readLogsInWorker ?? (await import('./worker/readLogsInWorker')).readLogsInWorker;
            return await readLogsInWorker({
                name: this.name,
                loggerID: this.loggerID,
                encryptionKey: this.encryptionKey,
                encryptionContext: this.encryptionContext.toBase64(),
            });
        } catch (error) {
            console.error(`[${this.name}] failed to read logs in worker:`, error);
            return '';
        }
    }

    async clearLogs(): Promise<void> {
        if (!this.storage) {
            return;
        }

        try {
            await this.writes;
            await this.storage.clear();
        } catch (error) {
            console.warn(`[${this.name}] failed to clear logs:`, error);
        }
    }

    async downloadLogs(filename?: string): Promise<void> {
        const logs = await this.getLogs();
        downloadLogFile(logs, filename ?? timestampedFilename(`${this.name}-logs`));
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

        performance.mark(`logger-${this.name}:cleanup:start`);
        await this.storage.removeOlderThan(this.now() - this.retentionDays * DAY);

        const count = await this.storage.count();
        if (count > this.maxEntries) {
            await this.storage.removeOldest(count - this.maxEntries);
        }
        performance.measure(`logger-${this.name}:cleanup`, `logger-${this.name}:cleanup:start`);
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    async destroy(): Promise<void> {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        await this.writes;

        try {
            await this.storage?.close();
        } catch (error) {
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

/**
 * The application's logger.
 *
 * Created uninitialized so module-level code can hold a reference to it, and initialized from
 * bootstrap once the session key is available. Lines logged in between are buffered.
 */
export const logger = new Logger();
