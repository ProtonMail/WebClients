import { logger } from '@proton/pass/utils/logger';

import type { FileBuffer, FileStorage } from './types';

export class FileStorageOPFS implements FileStorage {
    async readFile(filename: string) {
        try {
            const root = await navigator.storage.getDirectory();
            const fileHandle = await root.getFileHandle(filename);
            return await fileHandle.getFile();
        } catch (err) {
            logger.warn('[fs:OPFS] Could not resolve file', err);
            return;
        }
    }

    async writeFile(filename: string, data: FileBuffer | ReadableStream<FileBuffer>, signal?: AbortSignal) {
        try {
            const root = await navigator.storage.getDirectory();
            const fileHandle = await root.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();

            if (signal) {
                if (signal.aborted) await writable.abort();
                signal.addEventListener('abort', () => writable.abort());
            }

            if (data instanceof ReadableStream) {
                const reader = data.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    await writable.write(value);
                }
            } else await writable.write(data);

            await writable.close();
        } catch (err) {
            logger.warn('[fs:OPFS] Could not write file', err);
        }
    }

    async deleteFile(filename: string) {
        try {
            const root = await navigator.storage.getDirectory();
            await root.removeEntry(filename);
        } catch (err) {
            logger.warn('[fs:OPFS] Could not delete file', err);
        }
    }

    async clearAll() {
        try {
            const root = await navigator.storage.getDirectory();
            for await (const entry of root.values()) {
                await root.removeEntry(entry.name, { recursive: true });
            }
        } catch (err) {
            logger.warn('[fs:OPFS] Could not clear all files', err);
        }
    }
}
