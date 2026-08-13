/* eslint-disable no-console */
import type { AesGcmCryptoKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { decryptData } from '@protontech/crypto/subtle/aesGcm.ts';
import { uint8ArrayToUtf8String } from '@protontech/crypto/utils';

import { IndexedDBStorage } from './storage';
import type { LogEntry } from './types';

/**
 * Everything the reader needs to turn stored bytes back into log lines.
 *
 * Only structured-clone-safe primitives, deliberately: `@protontech/crypto` registers a
 * Comlink transfer handler for `Uint8Array` in the main thread, and Comlink's handler
 * registry is a module-level singleton shared by every endpoint in the app. A `Uint8Array`
 * argument would therefore be serialised with a handler this worker has not registered,
 * and the call would fail inside the worker before ever reaching us.
 */
export interface LogReaderOptions {
    name: string;
    loggerID: string;
    encryptionKey: AesGcmCryptoKey;
    /** Base64 of the AES-GCM context, rather than the bytes. See above. */
    encryptionContext: string;
}

/** A stored entry could not be turned back into a log line, whatever the reason. */
class UnreadableEntryError extends Error {
    constructor(cause: unknown) {
        super('Log entry could not be decoded', { cause });
        this.name = 'UnreadableEntryError';
    }
}

/**
 * Decodes one stored payload. Base64, AES-GCM and JSON failures all mean the same
 * thing here — the bytes on disk are not readable by this session — so they are
 * reported as one error rather than inspected individually.
 */
const decodeEntryOrThrow = async (
    key: AesGcmCryptoKey,
    data: string,
    context: Uint8Array<ArrayBuffer>
): Promise<{ message: string; args: string[] }> => {
    try {
        const decrypted = await decryptData(key, Uint8Array.fromBase64(data), context);
        return JSON.parse(uint8ArrayToUtf8String(decrypted)) as { message: string; args: string[] };
    } catch (error) {
        throw new UnreadableEntryError(error);
    }
};

/** Renders one stored entry as the line it was written as. */
const formatEntry = async (
    entry: LogEntry,
    { name, encryptionKey, encryptionContext }: ResolvedOptions
): Promise<string> => {
    const { message, args } = await decodeEntryOrThrow(encryptionKey, entry.data, encryptionContext);

    const timestamp = new Date(entry.timestamp).toISOString();
    const suffix = args.length > 0 ? ` ${args.join(' ')}` : '';

    return `${timestamp} ${entry.level.toUpperCase()} [${name}]: ${message}${suffix}`;
};

/** `encryptionContext` decoded back to bytes once, rather than per entry. */
type ResolvedOptions = Omit<LogReaderOptions, 'encryptionContext'> & { encryptionContext: Uint8Array<ArrayBuffer> };

/**
 * Reads and decrypts stored log lines, off the main thread.
 *
 * Exposed over Comlink by `logger.worker.ts`. One instance per worker: `init` has to be
 * awaited before `getLogs`, which is what the caller in `Logger.getLogs` does.
 */
export default class LogReader {
    private options: ResolvedOptions | null = null;

    private storage: IndexedDBStorage | null = null;

    init({ name, loggerID, encryptionKey, encryptionContext }: LogReaderOptions) {
        this.options = { name, loggerID, encryptionKey, encryptionContext: Uint8Array.fromBase64(encryptionContext) };
        this.storage = new IndexedDBStorage(name, loggerID);
    }

    async getLogs(): Promise<string> {
        if (!this.options || !this.storage) {
            throw new Error('LogReader.init must be awaited before reading');
        }

        const options = this.options;
        const { name } = options;

        performance.mark(`logger-${name}:readLogs:start`);
        try {
            const entries = await this.storage.retrieve();

            performance.mark(`logger-${name}:readLogs:decode:start`);
            const lines = await Promise.all(entries.map((entry) => formatEntry(entry, options)));
            performance.measure(`logger-${name}:readLogs:decode`, `logger-${name}:readLogs:decode:start`);

            return lines.join('\n');
        } catch (error) {
            if (error instanceof UnreadableEntryError) {
                // Most likely written under a different session key, content is unrecoverable and would keep failing on every read.
                console.warn(`[${name}] failed to decrypt logs, clearing:`, error);
                await this.storage.clear();
                return '';
            }
            console.error(`[${name}] failed to read logs:`, error);
            return '';
        } finally {
            performance.measure(`logger-${name}:readLogs`, `logger-${name}:readLogs:start`);
        }
    }
}
