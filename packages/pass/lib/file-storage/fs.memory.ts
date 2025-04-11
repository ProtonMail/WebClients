import { FileStorageGarbageCollector } from '@proton/pass/lib/file-storage/fs.gc';
import type { AnyStorage, Maybe, StorageData } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';

import type { FileBuffer, FileStorage } from './types';

type MemoryStore = Map<string, FileBuffer[]>;

export const MemoryWritableStream = (store: MemoryStore, filename: string) => {
    return new WritableStream({
        write: async (chunk) => {
            const chunks = store.get(filename) ?? [];
            store.set(filename, chunks);
            chunks.push(chunk);
        },
    });
};

export class FileStorageMemory implements FileStorage {
    gc: Maybe<FileStorageGarbageCollector>;

    type: string = 'Memory';

    files: MemoryStore = new Map();

    attachGarbageCollector(storage: AnyStorage<StorageData>) {
        this.gc = new FileStorageGarbageCollector(this, storage);
    }

    async readFile(filename: string, type?: string) {
        try {
            const blobs = this.files.get(filename);
            if (!blobs) throw new Error('Not found');

            /** Auto de-reference the blob from the storage instance
             * when we have built the file for proper garbage-collection */
            const file = new File(blobs, filename, { type });
            void this.deleteFile(filename);

            return file;
        } catch (err) {
            logger.debug('[fs::Memory] Could not resolve file.', err);
            return;
        }
    }

    async writeFile(filename: string, data: FileBuffer | ReadableStream<FileBuffer>, signal: AbortSignal) {
        try {
            if (signal.aborted) throw new DOMException('Write operation aborted', 'AbortError');

            if (data instanceof ReadableStream) {
                const writable = MemoryWritableStream(this.files, filename);
                const stream = this.gc ? data.pipeThrough(this.gc.stream(filename)) : data;
                await stream.pipeTo(writable, { signal });
            } else this.files.set(filename, [data]);

            this.gc?.push(filename, { enqueueForDeletion: true });
            logger.debug(`[fs::Memory] Saved ${logId(filename)}`);
        } catch (err) {
            logger.debug('[fs::Memory] Could not write file.', err);
            this.files.delete(filename);
            this.gc?.pop(filename);

            throw err;
        }
    }

    async deleteFile(filename: string) {
        this.files.delete(filename);
        this.gc?.pop(filename);
        logger.debug(`[fs::Memory] Deleted ${logId(filename)}`);
    }

    async clearAll() {
        try {
            this.files.clear();
            await this.gc?.clearLocalQueue();
            logger.debug(`[fs::Memory] Storage cleared`);
        } catch {}
    }
}
