import type { IDBPTransaction } from 'idb';
import { type DBSchema, type IDBPDatabase, deleteDB, openDB } from 'idb';

import { FileStorageGarbageCollector } from '@proton/pass/lib/file-storage/fs.gc';
import type { AnyStorage, Maybe, MaybeNull, StorageData } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import type { FileBuffer, FileStorage } from './types';

type IDBFileID = string;

export interface PassFileDB extends DBSchema {
    files: { key: IDBFileID; value: FileBuffer };
    metadata: { key: IDBFileID; value: { totalChunks: number } };
}

const FILE_DB_VERSION = 1;
const FILE_DB_NAME = 'pass:files';

const getFileChunkName = (filename: string, index: number) => `${filename}:${index}`;

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

/** Turns a chunked IDB file into a readable stream.
 * We're currently consuming it as a raw buffer, but once
 * we implement a proper stream-saver service worker, this
 * will allow streaming downloads from IDB without loading
 * the entire file into memory. */
export const createIDBFileReadableStream = (filename: string): ReadableStream<FileBuffer> => {
    let db: MaybeNull<IDBPDatabase<PassFileDB>> = null;
    let currentChunk = 0;
    let totalChunks = 0;

    return new ReadableStream<FileBuffer>({
        async start(controller) {
            try {
                db = await openPassFileDB();
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

                const chunkKey = getFileChunkName(filename, currentChunk);
                const chunk = await db.get('files', chunkKey);

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

/** Removes all stored chunks and metadata for a given file.
 * Handles cleaning-up partial writes that may have failed. */
const getFileRemoveTransaction =
    (tx: IDBPTransaction<PassFileDB, ['files', 'metadata'], 'readwrite'>) => (filename: string, length: number) => [
        tx.objectStore('metadata').delete(filename).catch(noop),
        ...Array.from({ length }).map((_, idx) =>
            tx.objectStore('files').delete(getFileChunkName(filename, idx)).catch(noop)
        ),
        tx.done,
    ];

export class FileStorageIDB implements FileStorage {
    gc: Maybe<FileStorageGarbageCollector>;

    type: string = 'IDB';

    attachGarbageCollector(storage: AnyStorage<StorageData>) {
        this.gc = new FileStorageGarbageCollector(this, storage);
    }

    async readFile(filename: string) {
        try {
            const stream = createIDBFileReadableStream(filename);
            const blobParts: FileBuffer[] = [];
            const reader = stream.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                blobParts.push(value);
            }

            return new File(blobParts, filename);
        } catch (err) {
            logger.warn('[fs::IDB] Could not resolve file', err);
            return;
        }
    }

    async writeFile(filename: string, file: FileBuffer | ReadableStream<FileBuffer>, signal?: AbortSignal) {
        const db = await openPassFileDB();
        let chunkIndex = 0;

        try {
            if (signal) {
                if (signal.aborted) db.close();
                signal.addEventListener('abort', () => db.close());
            }

            /** If we're dealing with a readable stream append
             * chunks until we consume the stream completely
             * and write the appropriate metadata on done */
            if (file instanceof ReadableStream) {
                const reader = file.getReader();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const tx = db.transaction(['files', 'metadata'], 'readwrite');
                    const fileKey = getFileChunkName(filename, chunkIndex);
                    chunkIndex++;

                    await Promise.all([
                        tx.objectStore('files').put(value, fileKey),
                        tx.objectStore('metadata').put({ totalChunks: chunkIndex }, filename),
                        tx.done,
                    ]);

                    this.gc?.push(filename);
                }
            } else {
                /** When dealing with a blob : store the file
                 * as a single database entry. */
                const tx = db.transaction(['files', 'metadata'], 'readwrite');
                const fileKey = getFileChunkName(filename, chunkIndex);
                await Promise.all([
                    tx.objectStore('metadata').put({ totalChunks: 1 }, filename),
                    tx.objectStore('files').put(file, fileKey),
                    tx.done,
                ]);
            }

            db.close();
            this.gc?.push(filename);
        } catch (err) {
            logger.warn('[fs::IDB] Could not write file', err);

            /** Remove any partial data thay may have been written.
             * Metadata may have not been written, use `chunkIndex`
             * to remove possible stale chunks. */
            const tx = db.transaction(['files', 'metadata'], 'readwrite');
            await Promise.all(getFileRemoveTransaction(tx)(filename, chunkIndex));
            this.gc?.pop(filename);

            throw err;
        }
    }

    async deleteFile(filename: string) {
        try {
            const db = await openPassFileDB();
            if (!db) throw new Error('No database found');

            const tx = db.transaction(['files', 'metadata'], 'readwrite');
            const metadata = await tx.objectStore('metadata').get(filename);

            if (metadata) {
                const { totalChunks } = metadata;
                await Promise.all(getFileRemoveTransaction(tx)(filename, totalChunks));
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
