import { type DBSchema, type IDBPDatabase, deleteDB, openDB } from 'idb';

import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import type { FileStorage } from './types';

type IDBFileID = string;

export interface PassFileDB extends DBSchema {
    files: { key: IDBFileID; value: Blob };
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

export const createIDBFileReadableStream = (filename: string): ReadableStream<Blob> => {
    let db: MaybeNull<IDBPDatabase<PassFileDB>> = null;
    let currentChunk = 0;
    let totalChunks = 0;

    return new ReadableStream<Blob>({
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

export class FileStorageIDB implements FileStorage {
    async readFile(filename: string) {
        try {
            const stream = createIDBFileReadableStream(filename);
            const blobParts: Blob[] = [];
            const reader = stream.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                blobParts.push(value);
            }

            return new File(blobParts, filename);
        } catch (err) {
            logger.warn('[fs:IDB] Could not resolve file', err);
            return;
        }
    }

    async writeFile(filename: string, file: Blob | ReadableStream<Blob>) {
        try {
            const db = await openPassFileDB();
            if (!db) throw new Error('No database found');

            const tx = db.transaction(['files', 'metadata'], 'readwrite');

            /** When dealing with a blob : store the file
             * as a single database entry. */
            if (file instanceof Blob) {
                const fileKey = getFileChunkName(filename, 0);
                await tx.objectStore('metadata').put({ totalChunks: 1 }, filename);
                await tx.objectStore('files').put(file, fileKey);
            }

            /** If we're dealing with a readable stream append
             * chunks until we consume the stream completely
             * and write the appropriate metadata on done */
            if (file instanceof ReadableStream) {
                let chunkIndex = 0;
                const reader = file.getReader();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const fileKey = getFileChunkName(filename, chunkIndex);
                    await tx.objectStore('files').put(value, fileKey);
                    chunkIndex++;
                }

                await tx.objectStore('metadata').put({ totalChunks: chunkIndex }, filename);
            }

            await tx.done;
            db.close();
        } catch (err) {
            logger.warn('[fs:IDB] Could not write file', err);
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
                await tx.objectStore('metadata').delete(filename);

                /** Delete each chunk sequentially */
                for (let idx = 0; idx < totalChunks; idx++) {
                    await tx.objectStore('files').delete(getFileChunkName(filename, idx));
                }
            }

            await tx.done;
            db.close();
        } catch (err) {
            logger.warn('[fs:IDB] Could not delete file', err);
        }
    }

    async clearAll() {
        await deleteDB(FILE_DB_NAME).catch((err) => logger.warn('[fs:IDB] Could not clear all files', err));
    }
}
