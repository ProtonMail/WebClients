import { FileStorageGarbageCollector } from '@proton/pass/lib/file-storage/fs.gc';
import type { AnyStorage, Maybe, StorageData } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import type { FileBuffer, FileStorage } from './types';

export class FileStorageOPFS implements FileStorage {
    gc: Maybe<FileStorageGarbageCollector>;

    type: string = 'OPFS';

    attachGarbageCollector(storage: AnyStorage<StorageData>) {
        this.gc = new FileStorageGarbageCollector(this, storage);
    }

    async readFile(filename: string) {
        try {
            const root = await navigator.storage.getDirectory();
            const fileHandle = await root.getFileHandle(filename);
            return await fileHandle.getFile();
        } catch (err) {
            logger.debug('[fs::OPFS] Could not resolve file.', err);
            return;
        }
    }

    async writeFile(filename: string, data: FileBuffer | ReadableStream<FileBuffer>, signal: AbortSignal) {
        const root = await navigator.storage.getDirectory();

        try {
            if (signal.aborted) throw new DOMException('Write operation aborted', 'AbortError');

            const fileHandle = await root.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();

            if (data instanceof ReadableStream) {
                const stream = this.gc ? data.pipeThrough(this.gc.stream(filename)) : data;
                await stream.pipeTo(writable, { signal });
            } else {
                await writable.write(data);
                await writable.close();
            }

            this.gc?.push(filename, { enqueueForDeletion: true });
            logger.debug(`[fs::OPFS] Saved ${logId(filename)}`);
        } catch (err) {
            logger.debug('[fs::OPFS] Could not write file.', err);
            await root.removeEntry(filename).catch(noop);
            this.gc?.pop(filename);

            throw err;
        }
    }

    async deleteFile(filename: string) {
        try {
            const root = await navigator.storage.getDirectory();
            await root.removeEntry(filename);
            this.gc?.pop(filename);
            logger.debug(`[fs::OPFS] Deleted ${logId(filename)}`);
        } catch {}
    }

    async clearAll() {
        try {
            await this.gc?.clearLocalQueue();
            const root = await navigator.storage.getDirectory();

            for await (const entry of root.values()) {
                await root.removeEntry(entry.name, { recursive: true });
            }

            logger.debug(`[fs::OPFS] Storage cleared`);
        } catch {}
    }
}
