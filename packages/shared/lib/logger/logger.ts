import log, { type Logger as LogLevelLogger } from 'loglevel';

import { type AesGcmCryptoKey, decryptData, encryptData } from '@proton/crypto/lib/subtle/aesGcm';
import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import { DAY } from '@proton/shared/lib/constants';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import {
    CLEANUP_INTERVAL_MS,
    DEFAULT_LOGGER_NAME,
    DEFAULT_MAX_ENTRIES,
    DEFAULT_RETENTION_DAYS,
    LOGGER_DB_PREFIX,
    MAX_PENDING_LOGS,
    PENDING_LOGS_TRIM_SIZE,
} from './constants';
import { IndexedDBStorage } from './storage/IndexedDBStorage';
import type { LogEntry, Storage } from './storage/types';

export interface LoggerOptions {
    maxEntries?: number;
    retentionDays?: number;
    encryptionKey: AesGcmCryptoKey;
    appName: string;
    loggerName?: string;
    loggerID: string;
    forceMemoryStorage?: boolean; // For testing - bypasses IndexedDB
}
export interface GlobalErrorHandler {
    enable(): void;
    disable(): void;
    isEnabled(): boolean;
}

/**
 * The Logger class is a singleton that provides a global logging interface for the application.
 * Features:
 * - Log messages to the console and to a database
 * - Capture global errors and unhandled promise rejections
 * - Persist encrypted logs to a database and retrieve them later
 * - Log retention: 7 days by default, configurable
 * - Log retention: 10000 logs by default, configurable
 * - Download logs as a text file (all logs or from a specific logger)
 */
export class Logger {
    private storage: Storage | null = null;

    private storageInitialized: Promise<void> | null = null;

    private maxEntries: number = DEFAULT_MAX_ENTRIES;

    private retentionDays: number = DEFAULT_RETENTION_DAYS;

    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    private initialized: boolean = false;

    private pendingLogs: { level: string; message: string; args: any[]; timestamp: number }[] = [];

    private loggerName: string;

    private loglevelInstance: LogLevelLogger | null = null;

    private hasShownAuthWarning: boolean = false;

    public globalErrorHandler: GlobalErrorHandler | null = null;

    private cachedLogs: string | null = null;

    private cacheInvalidated: boolean = true;

    private preCachingPromise: Promise<void> | null = null;

    // Direct logging methods - will be assigned after plugin setup
    debug: typeof log.debug = this.createStubMethod('debug');

    info: typeof log.info = this.createStubMethod('info');

    warn: typeof log.warn = this.createStubMethod('warn');

    error: typeof log.error = this.createStubMethod('error');

    trace: typeof log.trace = this.createStubMethod('trace');

    log: typeof log.info = this.createStubMethod('info');

    private encryptionKey: AesGcmCryptoKey | null = null;

    private encryptionContext: Uint8Array<ArrayBuffer> | null = null;

    private loggerID?: string;

    private forceMemoryStorage: boolean = false;

    constructor(
        name: string = DEFAULT_LOGGER_NAME,
        options?: Partial<Pick<LoggerOptions, 'maxEntries' | 'retentionDays'>>
    ) {
        this.loggerName = name;
        this.maxEntries = options?.maxEntries ?? DEFAULT_MAX_ENTRIES;
        this.retentionDays = options?.retentionDays ?? DEFAULT_RETENTION_DAYS;
        // Create and enable global error handler immediately to capture errors before initialization
        this.globalErrorHandler = this.createGlobalErrorHandler();
        this.globalErrorHandler.enable();
    }

    private queuePendingLog(level: string, message: string, args: any[], timestamp?: number): void {
        this.pendingLogs.push({
            level,
            message,
            args,
            timestamp: timestamp ?? Date.now(),
        });
        // Limit pending logs to prevent memory issues
        if (this.pendingLogs.length > MAX_PENDING_LOGS) {
            this.pendingLogs = this.pendingLogs.slice(-PENDING_LOGS_TRIM_SIZE);
        }
    }

    private logOrQueue(level: string, message: string, ...args: any[]): void {
        if (this.initialized) {
            this.error(message, ...args);
        } else {
            this.queuePendingLog(level, message, args);
        }
    }

    private extractErrorDetails(error: any): { message: string; stack?: string } {
        if (error instanceof Error) {
            return {
                message: error.message,
                stack: error.stack,
            };
        }
        return {
            message: String(error),
            stack: undefined,
        };
    }

    private createGlobalErrorHandler(): GlobalErrorHandler {
        const logger = this;
        let isEnabled = false;
        let originalOnError: OnErrorEventHandler | null = null;
        let originalOnUnhandledRejection: ((this: WindowEventHandlers, ev: PromiseRejectionEvent) => any) | null = null;

        const isWindowAvailable = () => {
            return typeof window !== 'undefined' && window !== null && window !== (undefined as any);
        };

        const handleError = (
            message: string | Event,
            source?: string,
            lineno?: number,
            colno?: number,
            error?: Error
        ) => {
            try {
                const errorMessage = typeof message === 'string' ? message : message.type;
                logger.logOrQueue('error', 'Global Error Caught', errorMessage, source, lineno, colno, error?.stack);
            } catch {
                // Silent fail to prevent infinite loops
            }
            // Call original handler if it existed
            if (originalOnError) {
                return originalOnError.call(window, message, source, lineno, colno, error);
            }
            return false;
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            try {
                const errorDetails = logger.extractErrorDetails(event.reason);
                logger.logOrQueue('error', 'Unhandled Promise Rejection', errorDetails.message, errorDetails.stack);
            } catch {
                // Silent fail to prevent infinite loops
            }
            // Call original handler if it existed
            if (originalOnUnhandledRejection) {
                return originalOnUnhandledRejection.call(window, event);
            }
        };

        return {
            enable() {
                if (isEnabled || !isWindowAvailable()) {
                    return;
                }
                isEnabled = true;
                originalOnError = window.onerror;
                originalOnUnhandledRejection = window.onunhandledrejection;

                window.onerror = handleError;
                window.onunhandledrejection = handleUnhandledRejection;
            },
            disable() {
                if (!isEnabled || !isWindowAvailable()) {
                    return;
                }
                isEnabled = false;
                window.onerror = originalOnError;
                window.onunhandledrejection = originalOnUnhandledRejection;
                originalOnError = null;
                originalOnUnhandledRejection = null;
            },
            isEnabled() {
                return isEnabled && isWindowAvailable();
            },
        };
    }

    private setupPersistencePlugin(): void {
        if (!this.loglevelInstance) {
            throw new Error('Cannot setup persistence plugin: loglevel instance not created');
        }

        const originalFactory = this.loglevelInstance.methodFactory;
        const loggerInstance = this;

        // Apply the plugin to this specific loglevel instance
        this.loglevelInstance.methodFactory = function (
            methodName: any,
            logLevel: number,
            loggerName: string | symbol
        ) {
            const rawMethod = originalFactory(methodName, logLevel as any, loggerName);

            return function (message: string, ...args: any[]) {
                // Console output with logger name prefix
                rawMethod(`[${loggerInstance.loggerName}]`, message, ...args);
                void loggerInstance.persistLog(String(methodName), message, args);
            };
        };

        // Set level and rebuild for this specific instance
        this.loglevelInstance.setLevel('trace');
        this.loglevelInstance.rebuild();
    }

    private assignLoggingMethods(): void {
        if (!this.loglevelInstance) {
            throw new Error('Cannot assign logging methods: loglevel instance not created');
        }

        // Assign methods from the specific loglevel instance AFTER plugin setup
        this.debug = this.loglevelInstance.debug;
        this.info = this.loglevelInstance.info;
        this.warn = this.loglevelInstance.warn;
        this.error = this.loglevelInstance.error;
        this.trace = this.loglevelInstance.trace;
        this.log = this.loglevelInstance.info;
    }

    private async processPendingLogs(): Promise<void> {
        if (!this.initialized || this.pendingLogs.length === 0) {
            return;
        }

        const logsToProcess = [...this.pendingLogs];
        this.pendingLogs = [];

        // Process pending logs through the proper logging methods to ensure correct console output
        for (const { level, message, args } of logsToProcess) {
            switch (level) {
                case 'error':
                    this.error(message, ...args);
                    break;
                case 'warn':
                    this.warn(message, ...args);
                    break;
                case 'info':
                    this.info(message, ...args);
                    break;
                case 'debug':
                    this.debug(message, ...args);
                    break;
                case 'trace':
                    this.trace(message, ...args);
                    break;
                default:
                    this.log(message, ...args);
            }
        }
    }

    private async initializeStorage(): Promise<void> {
        // If memory storage is forced (for testing), skip IndexedDB
        if (this.forceMemoryStorage) {
            const { MemoryStorage } = await import('./storage/MemoryStorage');
            this.storage = new MemoryStorage(this.maxEntries);
            return;
        }

        try {
            this.storage = new IndexedDBStorage(this.loggerName, this.loggerID ?? '');
            return;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('IndexedDB initialization failed:', error);
        }

        await this.tryFallbackStorage();
    }

    private async tryFallbackStorage(): Promise<void> {
        if (typeof localStorage !== 'undefined') {
            try {
                const { LocalStorage } = await import('./storage/LocalStorage');
                this.storage = new LocalStorage(this.loggerName, this.loggerID ?? '');
                return;
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn('LocalStorage initialization failed:', error);
            }
        }

        // Final fallback to memory storage
        const { MemoryStorage } = await import('./storage/MemoryStorage');
        this.storage = new MemoryStorage(this.maxEntries);
    }

    private async persistLog(level: string, message: string, args: any[]): Promise<void> {
        const timestamp = Date.now();

        if (!this.initialized || !this.encryptionKey) {
            // Queue the log for later processing
            this.queuePendingLog(level, message, args, timestamp);
            return;
        }

        return this.persistLogWithTimestamp(level, message, args, timestamp);
    }

    private async persistLogWithTimestamp(
        level: string,
        message: string,
        args: any[],
        timestamp: number
    ): Promise<void> {
        try {
            if (!this.storageInitialized) {
                return;
            }
            await this.storageInitialized;

            if (!this.storage || !this.encryptionKey || !this.encryptionContext) {
                return;
            }

            const entry: LogEntry = {
                id: `${timestamp}-${Math.random().toString(36).substring(2, 11)}`,
                timestamp,
                level,
                encryptedMessage: uint8ArrayToBase64String(
                    await encryptData(this.encryptionKey, stringToUtf8Array(message), this.encryptionContext)
                ),
                encryptedArgs: await this.processArgs(args),
            };

            await this.storage.store(entry);
            await this.enforceMaxEntries();

            // Invalidate cache since new log was added
            this.cacheInvalidated = true;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Error persisting log:', e);
        }
    }

    private async processArgs(args: any[]): Promise<string[]> {
        const processedArgs = args.map((arg) => {
            if (arg instanceof Error) {
                return `${arg.name}: ${arg.message}\n${arg.stack}`;
            }
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
        });

        return Promise.all(
            processedArgs.map(async (arg) =>
                uint8ArrayToBase64String(
                    await encryptData(this.encryptionKey!, stringToUtf8Array(arg), this.encryptionContext!)
                )
            )
        );
    }

    private async enforceMaxEntries(): Promise<void> {
        if (!this.storage) {
            return;
        }

        const count = await this.storage.getCount();
        if (count > this.maxEntries) {
            await this.storage.removeOldest(count - this.maxEntries);
        }
    }

    private async discoverLoggerDatabases(): Promise<string[]> {
        try {
            // Try to use the modern indexedDB.databases() API
            if ('databases' in indexedDB && typeof indexedDB.databases === 'function') {
                const databases = await indexedDB.databases();
                return databases
                    .map((db) => db.name)
                    .filter((name): name is string => name !== undefined && name.startsWith(LOGGER_DB_PREFIX));
            }
        } catch {
            // Fall back to manual discovery if the API is not available
        }

        // Fallback: return just the current database name since we can't discover others
        if (this.storage instanceof IndexedDBStorage) {
            const currentDbName = (this.storage as any).dbName;
            return currentDbName ? [currentDbName] : [];
        }

        return [];
    }

    private async removeOldLogsFromAllDatabases(): Promise<void> {
        try {
            const databases = await this.discoverLoggerDatabases();
            const cutoffTime = Date.now() - this.retentionDays * DAY;

            // Process databases in parallel but handle errors individually
            await Promise.allSettled(
                databases.map(async (dbName) => {
                    try {
                        // Extract logger name from database name
                        const loggerName = dbName.replace(new RegExp(`^${LOGGER_DB_PREFIX}`), '');
                        const tempStorage = new IndexedDBStorage(loggerName, '');
                        await tempStorage.removeOlderThan(cutoffTime);
                    } catch (error) {
                        // Log but don't fail - database might be locked by another instance
                        // eslint-disable-next-line no-console
                        console.warn(`Failed to clean database ${dbName}:`, error);
                    }
                })
            );
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('Error during global database cleanup:', error);
        }
    }

    private startCleanup(): void {
        void this.removeOldLogs();
        this.cleanupInterval = setInterval(() => {
            void this.removeOldLogs();
        }, CLEANUP_INTERVAL_MS);
        // Ensure the interval doesn't block Node.js from exiting
        if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
            this.cleanupInterval.unref();
        }
    }

    private async removeOldLogs(): Promise<void> {
        try {
            if (!this.storage) {
                return;
            }

            const cutoffTime = Date.now() - this.retentionDays * DAY;
            await this.storage.removeOlderThan(cutoffTime);

            // If storage was deleted (empty database), reinitialize
            if (this.storage instanceof IndexedDBStorage) {
                try {
                    await this.storage.getCount();
                } catch (error) {
                    // Database was deleted, reinitialize
                    this.storage = null;
                    this.storageInitialized = this.initializeStorage();
                    await this.storageInitialized;
                    // eslint-disable-next-line no-console
                    console.warn(`IndexedDB storage corrupted for logger '${this.loggerName}', reinitializing:`, error);
                }
            }

            // Also clean up old logs from all other logger databases
            await this.removeOldLogsFromAllDatabases();
        } catch (error) {
            // Log the error for debugging purposes
            // eslint-disable-next-line no-console
            console.warn('Error removing old logs:', error);
        }
    }

    async getLogs(): Promise<string> {
        if (!this.initialized || !this.encryptionKey || !this.encryptionContext) {
            return '';
        }

        if (!this.storageInitialized) {
            return '';
        }
        await this.storageInitialized;
        if (!this.storage) {
            return '';
        }

        try {
            const logs = await this.storage.retrieve();
            const serializedLogs = await Promise.all(
                logs.map(async (log) => {
                    const timestamp = new Date(log.timestamp).toISOString();
                    const level = log.level.toUpperCase();
                    const message = await decryptData(
                        this.encryptionKey!,
                        base64StringToUint8Array(log.encryptedMessage),
                        this.encryptionContext!
                    ).then(utf8ArrayToString);
                    const decryptedArgs = await Promise.all(
                        log.encryptedArgs.map(async (encryptedArg) =>
                            decryptData(
                                this.encryptionKey!,
                                base64StringToUint8Array(encryptedArg),
                                this.encryptionContext!
                            ).then(utf8ArrayToString)
                        )
                    );
                    const argsStr = decryptedArgs.length > 0 ? ' ' + decryptedArgs.join(' ') : '';
                    return `[${timestamp}] ${level}: ${message}${argsStr}`;
                })
            );
            return serializedLogs.join('\n');
        } catch (error) {
            // Check if this is a decryption error
            // WebCrypto API throws DOMException for crypto operations
            const isDecryptionError =
                error instanceof DOMException ||
                (error instanceof Error &&
                    (error.name === 'OperationError' ||
                        error.name === 'InvalidAccessError' ||
                        error.name === 'DataError' ||
                        // Some browsers might still include 'decrypt' in the message
                        error.message.toLowerCase().includes('decrypt')));

            if (isDecryptionError) {
                // eslint-disable-next-line no-console
                console.warn('Failed to decrypt logs, clearing database:', error.name);
                await this.clearLogs(); // Delete the entire database
                return '';
            }
            // For other errors, just return empty string
            // eslint-disable-next-line no-console
            console.error('Error retrieving logs:', error);
            return '';
        }
    }

    async preCacheLogs(): Promise<void> {
        if (!this.initialized || this.preCachingPromise) {
            return;
        }

        this.preCachingPromise = this.performPreCaching();
        await this.preCachingPromise;
        this.preCachingPromise = null;
    }

    private async performPreCaching(): Promise<void> {
        try {
            const logs = await this.getLogs();
            this.cachedLogs = logs;
            this.cacheInvalidated = false;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`[${this.loggerName}] Error pre-caching logs:`, error);
            this.cachedLogs = null;
        }
    }

    async getCachedLogs(): Promise<string> {
        if (!this.initialized) {
            return '';
        }

        // If cache is invalid or null, we need to refresh it
        if (this.cacheInvalidated || this.cachedLogs === null) {
            // If pre-caching is already in progress, wait for it to complete
            if (this.preCachingPromise) {
                await this.preCachingPromise;
            } else {
                // Otherwise, just get logs directly (no separate pre-caching)
                this.cachedLogs = await this.getLogs();
                this.cacheInvalidated = false;
            }
        }

        return this.cachedLogs || '';
    }

    async clearLogs(): Promise<void> {
        if (!this.storageInitialized) {
            return;
        }
        try {
            await this.storageInitialized;
            if (!this.storage) {
                return;
            }
            await this.storage.clear(); // This now deletes the entire database

            // Reinitialize storage after deletion
            this.storage = null;
            this.storageInitialized = this.initializeStorage();
            await this.storageInitialized;

            // Clear cache since logs were deleted
            this.cachedLogs = null;
            this.cacheInvalidated = true;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`Failed to clear logs for logger ${this.loggerName}:`, error);
        }
    }

    async downloadLogs(filename?: string): Promise<void> {
        const logs = await this.getCachedLogs();

        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        try {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `${this.loggerName}-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    async triggerCleanup(): Promise<void> {
        if (!this.storageInitialized) {
            return;
        }
        await this.removeOldLogs();
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    getName(): string {
        return this.loggerName;
    }

    /**
     * Get the underlying loglevel instance (for advanced usage)
     */
    getLoglevelInstance(): LogLevelLogger | null {
        return this.loglevelInstance;
    }

    /**
     * Get the encryption context as a string for debugging
     */
    getEncryptionContextString(): string | null {
        if (!this.encryptionContext) {
            return null;
        }
        return utf8ArrayToString(this.encryptionContext);
    }

    async destroy(): Promise<void> {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        // Properly await storage closure
        if (this.storage) {
            try {
                await this.storage.close();
            } catch (error) {
                // Log but don't fail - we still want to clean up the instance
                // eslint-disable-next-line no-console
                console.warn('Error closing storage during destroy:', error);
            }
            this.storage = null;
        }

        this.initialized = false;
        this.storage = null;
        this.encryptionKey = null;
        this.encryptionContext = null;
        this.pendingLogs = [];
        this.storageInitialized = null;
        this.loglevelInstance = null;
        this.cachedLogs = null;
        this.cacheInvalidated = true;
        this.preCachingPromise = null;
    }

    private createStubMethod(level: string) {
        return (message: string, ...args: any[]) => {
            if (!this.initialized) {
                // Show warning only once per logger instance to avoid spam
                if (!this.hasShownAuthWarning) {
                    // eslint-disable-next-line no-console
                    console.warn(
                        `[Logger:${this.loggerName}] Logger not authorized - call initialize() first. Queuing logs for later processing.`
                    );
                    this.hasShownAuthWarning = true;
                }

                // Queue the log for later processing
                const timestamp = Date.now();
                this.pendingLogs.push({ level, message, args, timestamp });
                // Limit pending logs to prevent memory issues
                if (this.pendingLogs.length > MAX_PENDING_LOGS) {
                    this.pendingLogs = this.pendingLogs.slice(-PENDING_LOGS_TRIM_SIZE);
                }
            }
        };
    }

    /**
     * Initialize the logger with encryption key and options.
     */
    public async initialize(options: LoggerOptions): Promise<void> {
        if (this.initialized) {
            // eslint-disable-next-line no-console
            console.warn(`Logger '${this.loggerName}' already initialized, ignoring subsequent initialization`);
            return;
        }

        this.maxEntries = options.maxEntries ?? this.maxEntries;
        this.retentionDays = options.retentionDays ?? this.retentionDays;
        this.forceMemoryStorage = options.forceMemoryStorage ?? false;

        // Store logger ID for database naming
        this.loggerID = options.loggerID;

        // Use provided encryption key
        this.encryptionKey = options.encryptionKey;

        // Create encryption context
        const loggerName = options.loggerName || this.loggerName;
        const contextString = `${options.appName}#${loggerName}`;
        this.encryptionContext = stringToUtf8Array(contextString);

        // Create loglevel instance with unique name
        this.loglevelInstance = log.getLogger(contextString);

        // Initialize storage now that we have all required parameters including loggerID
        this.storageInitialized = this.initializeStorage();

        // Start cleanup after storage is ready
        void this.storageInitialized.then(() => this.startCleanup());

        // Set up persistence plugin and assign logging methods
        this.setupPersistencePlugin();
        this.assignLoggingMethods();

        this.initialized = true;

        void this.processPendingLogs();
    }
}

// Logger Manager for handling multiple instances
class LoggerManager {
    private static instance: LoggerManager | null = null;

    private loggers: Map<string, Logger> = new Map();

    public static getInstance(): LoggerManager {
        if (!LoggerManager.instance) {
            LoggerManager.instance = new LoggerManager();
        }
        return LoggerManager.instance;
    }

    /**
     * Create or get a logger instance by name
     */
    public getLogger(
        name: string = DEFAULT_LOGGER_NAME,
        constructorOptions?: Partial<Pick<LoggerOptions, 'maxEntries' | 'retentionDays'>>
    ): Logger {
        if (!this.loggers.has(name)) {
            this.loggers.set(name, new Logger(name, constructorOptions));
        }
        return this.loggers.get(name)!;
    }

    /**
     * Create and initialize a logger in one step
     */
    public async createLogger(name: string, options: LoggerOptions): Promise<Logger> {
        const constructorOptions = {
            maxEntries: options.maxEntries,
            retentionDays: options.retentionDays,
        };
        const logger = this.getLogger(name, constructorOptions);
        await logger.initialize(options);
        return logger;
    }

    /**
     * Get all logger instances
     */
    public getAllLoggers(): Logger[] {
        return Array.from(this.loggers.values());
    }

    /**
     * Get logs from all logger instances combined
     */
    public async getAllLogs(): Promise<string> {
        const allLogs: string[] = [];

        for (const logger of Array.from(this.loggers.values())) {
            if (logger.isInitialized()) {
                const logs = await logger.getLogs();
                if (logs.trim()) {
                    allLogs.push(
                        `=== Logger: ${logger.getName()} (${logger.getEncryptionContextString()}) ===\n${logs}`
                    );
                }
            }
        }

        return allLogs.join('\n\n');
    }

    /**
     * Pre-cache logs from all logger instances
     */
    public async preCacheAllLogs(): Promise<void> {
        const precachePromises = Array.from(this.loggers.values())
            .filter((logger) => logger.isInitialized())
            .map((logger) => logger.preCacheLogs());

        await Promise.all(precachePromises);
    }

    /**
     * Get cached logs from all logger instances combined
     */
    public async getAllCachedLogs(): Promise<string> {
        const allLogs: string[] = [];

        for (const logger of Array.from(this.loggers.values())) {
            if (logger.isInitialized()) {
                const logs = await logger.getCachedLogs();
                if (logs.trim()) {
                    allLogs.push(
                        `=== Logger: ${logger.getName()} (${logger.getEncryptionContextString()}) ===\n${logs}`
                    );
                }
            }
        }

        return allLogs.join('\n\n');
    }

    /**
     * Clear logs from all logger instances
     */
    public async clearAllLogs(): Promise<void> {
        const clearPromises = Array.from(this.loggers.values())
            .filter((logger) => logger.isInitialized())
            .map((logger) => logger.clearLogs());
        await Promise.all(clearPromises);
    }

    /**
     * Download combined logs from all instances
     */
    public async downloadAllLogs(filename?: string): Promise<void> {
        // Simply get cached logs - this will handle waiting for any ongoing pre-caching
        const logs = await this.getAllCachedLogs();

        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        try {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `all-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Remove a logger instance
     */
    public async removeLogger(name: string): Promise<void> {
        const logger = this.loggers.get(name);
        if (logger) {
            await logger.destroy();
            this.loggers.delete(name);
        }
    }

    /**
     * Destroy all logger instances
     */
    public async destroyAll(): Promise<void> {
        const destroyPromises = Array.from(this.loggers.values()).map((logger) => logger.destroy());
        await Promise.all(destroyPromises);
        this.loggers.clear();
        LoggerManager.instance = null;
    }
}

// Export the manager instance and default logger
export const loggerManager = LoggerManager.getInstance();
export const logger = loggerManager.getLogger(DEFAULT_LOGGER_NAME); // Default singleton for convenience
export default logger;

export type { LogEntry } from './storage/types';
