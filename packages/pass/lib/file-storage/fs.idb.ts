import type { IDBPTransaction } from 'idb';
import { type DBSchema, type IDBPDatabase, deleteDB, openDB } from 'idb';

import { FileStorageGarbageCollector } from '@proton/pass/lib/file-storage/fs.gc';
import type { AnyStorage, Maybe, StorageData } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import type { FileBuffer, FileStorage } from './types';

/** File name type used as keys in IndexedDB */
type IDBFileName = string;
export interface PassFileDB extends DBSchema {
    files: { key: IDBFileName; value: FileBuffer };
    metadata: { key: IDBFileName; value: { totalChunks: number } };
}

const FILE_DB_VERSION = 1;
const FILE_DB_NAME = 'pass:files';
export const getFileChunkName = (filename: string, index: number) => `${filename}:${index}`;

export const openPassFileDB = async (): Promise<IDBPDatabase<PassFileDB>> => {
    try {
        return await openDB<PassFileDB>(FILE_DB_NAME, FILE_DB_VERSION, {
            upgrade: (db) => {
                db.createObjectStore('files', { keyPath: null });
                db.createObjectStore('metadata', { keyPath: null });
            },
        });
    } catch {
        throw new Error('Failed to open database');
    }
};

/** Removes all stored chunks and metadata for a given file.
 * Handles cleaning up partial writes that may have failed. */
export const removeIDBFileChunks =
    (tx: IDBPTransaction<PassFileDB, ['files', 'metadata'], 'readwrite'>) => (filename: string, length: number) => [
        tx.objectStore('metadata').delete(filename).catch(noop),
        ...Array.from({ length }).map((_, idx) =>
            tx.objectStore('files').delete(getFileChunkName(filename, idx)).catch(noop)
        ),
        tx.done,
    ];

/** Writes a chunk to IndexedDB and updates the associated metadata */
export const writeIDBFileChunk =
    (tx: IDBPTransaction<PassFileDB, ['files', 'metadata'], 'readwrite'>) =>
    async (filename: string, index: number, chunk: FileBuffer) => {
        await Promise.all([
            tx.objectStore('files').put(chunk, getFileChunkName(filename, index)),
            tx.objectStore('metadata').put({ totalChunks: index + 1 }, filename),
            tx.done,
        ]);
    };

/** Creates a ReadableStream from chunked files in IndexedDB.
 * Currently buffers in memory during `readFile`, but enables future
 * service worker download streaming without API changes. */
export const IDBReadableStream = (db: IDBPDatabase<PassFileDB>, filename: string): ReadableStream<FileBuffer> => {
    let currentChunk = 0;
    let totalChunks = 0;

    return new ReadableStream<FileBuffer>({
        async start(controller) {
            try {
                const metadata = await db.get('metadata', filename);
                if (!metadata) throw new Error(`File "${filename}" not found`);
                totalChunks = metadata.totalChunks;
                if (!totalChunks) throw new Error(`File "${filename}" is empty`);
            } catch (error) {
                controller.error(error);
                db?.close();
            }
        },

        async pull(controller) {
            try {
                if (!db) throw new Error('Database not initialized');

                if (currentChunk >= totalChunks) {
                    controller.close();
                    db.close();
                    return;
                }

                const chunk = await db.get('files', getFileChunkName(filename, currentChunk));
                if (!chunk) throw new Error(`Chunk ${currentChunk} of file "${filename}" not found`);

                controller.enqueue(chunk);
                currentChunk++;
            } catch (error) {
                controller.error(error);
                db?.close();
            }
        },

        cancel() {
            db?.close();
        },
    });
};

/** Creates a WritableStream that stores each chunk in IndexedDB.
 * Maintains metadata tracking and handles resource cleanup. */
export const IDBWritableStream = (db: IDBPDatabase<PassFileDB>, filename: string, gc?: FileStorageGarbageCollector) => {
    let chunkIndex = 0;

    return new WritableStream({
        write: async (chunk) => {
            const tx = db.transaction(['files', 'metadata'], 'readwrite');
            await writeIDBFileChunk(tx)(filename, chunkIndex, chunk);
            chunkIndex++;
        },

        abort: async (reason) => {
            logger.warn('[fs::IDB] Write stream aborted.', reason);
            const tx = db.transaction(['files', 'metadata'], 'readwrite');
            await Promise.all(removeIDBFileChunks(tx)(filename, chunkIndex));
            db.close();
            gc?.pop(filename);
        },

        close: () => {
            db.close();
            gc?.push(filename);
        },
    });
};

export class FileStorageIDB implements FileStorage {
    gc: Maybe<FileStorageGarbageCollector>;

    type: string = 'IDB';

    attachGarbageCollector(storage: AnyStorage<StorageData>) {
        this.gc = new FileStorageGarbageCollector(this, storage);
    }

    async readFile(filename: string, type?: string) {
        try {
            const db = await openPassFileDB();
            const blobs: FileBuffer[] = [];
            const writableStream = new WritableStream({
                write(chunk) {
                    blobs.push(chunk);
                },
            });

            await IDBReadableStream(db, filename).pipeTo(writableStream);
            return new File(blobs, filename, { type });
        } catch (err) {
            logger.warn('[fs::IDB] Could not resolve file.', err);
            return;
        }
    }

    async writeFile(filename: string, file: FileBuffer | ReadableStream<FileBuffer>, signal: AbortSignal) {
        try {
            const db = await openPassFileDB();
            if (signal.aborted) db.close();

            if (file instanceof ReadableStream) {
                const writable = IDBWritableStream(db, filename);
                const stream = this.gc ? file.pipeThrough(this.gc.stream(filename)) : file;
                await stream.pipeTo(writable, { signal });
            } else {
                const tx = db.transaction(['files', 'metadata'], 'readwrite');
                await writeIDBFileChunk(tx)(filename, 0, file);
                db.close();
                this.gc?.push(filename);
            }
        } catch (err) {
            logger.warn('[fs::IDB] Could not write file.', err);
            await this.deleteFile(filename).catch(noop);
            throw err;
        }
    }

    async deleteFile(filename: string) {
        try {
            const db = await openPassFileDB();
            const tx = db.transaction(['files', 'metadata'], 'readwrite');
            const metadata = await tx.objectStore('metadata').get(filename);

            if (metadata) {
                const { totalChunks } = metadata;
                await Promise.all(removeIDBFileChunks(tx)(filename, totalChunks));
            }

            db.close();
            this.gc?.pop(filename);
        } catch {}
    }

    async clearAll() {
        try {
            await this.gc?.clearLocalQueue();
            await deleteDB(FILE_DB_NAME);
        } catch {}
    }
}
