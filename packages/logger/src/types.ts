import type { AesGcmCryptoKey } from '@protontech/crypto/subtle/aesGcm.ts';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'log';

/**
 * A persisted log line.
 *
 * `data` is the base64 AES-GCM ciphertext of `JSON.stringify({ message, args })`.
 * Message and arguments share a single ciphertext so that writing a line costs one
 * crypto operation regardless of how many arguments it carries.
 */
export interface LogEntry {
    id: string;
    timestamp: number;
    level: LogLevel;
    data: string;
}

export interface LoggerOptions {
    /** Session-bound AES-GCM key, see `generateLoggerKey`. */
    encryptionKey: AesGcmCryptoKey;
    /** Combined with the logger name to form the AES-GCM context. */
    appName: string;
    /** Defaults to the name the logger was created with. Only affects the encryption context. */
    loggerName?: string;
    /** Session-scoped identifier, forms part of the IndexedDB database name. */
    loggerID: string;
    /** Entries kept before the oldest are dropped. Default: 10 000. */
    maxEntries?: number;
    /** Days an entry is kept before cleanup removes it. Default: 7. */
    retentionDays?: number;
    /** Levels echoed to the console outside development. Default: `['error']`. */
    consoleLevels?: LogLevel[];
}
