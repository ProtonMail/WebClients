import type { FileStorage } from '@proton/pass/lib/file-storage/types';
import type { AnyStorage, StorageData } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logId, logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

export class FileStorageGarbageCollector {
    static STORAGE_KEY = 'fs::gc';

    private fs: FileStorage;

    private storage: AnyStorage<StorageData>;

    private pendingDeletions: Map<string, NodeJS.Timeout>;

    constructor(fs: FileStorage, storage: AnyStorage<StorageData>) {
        logger.info(`[fs::${fs.type}] Attaching garbage collector`);

        this.fs = fs;
        this.storage = storage;
        this.pendingDeletions = new Map();
    }

    private async getLocalQueue(): Promise<Set<string>> {
        const data = await this.storage.getItem(FileStorageGarbageCollector.STORAGE_KEY);
        const pending: string[] = safeCall(() => (data ? JSON.parse(data) : []))() ?? [];

        return new Set(pending);
    }

    private async setLocalQueue(pending: string[]): Promise<void> {
        await this.storage.setItem(FileStorageGarbageCollector.STORAGE_KEY, JSON.stringify(pending));
    }

    async clearLocalQueue() {
        const pending = await this.getLocalQueue();

        if (pending.size > 0) {
            logger.info(`[fs::${this.fs.type}] Clearing ${pending.size} files in queue`);
            for (const filename of pending) await this.fs.deleteFile(filename).catch(noop);
        }

        await this.setLocalQueue([]);
    }

    private async pushToLocalQueue(filename: string) {
        const pending = await this.getLocalQueue();
        pending.add(filename);

        await this.setLocalQueue(Array.from(pending));
    }

    private async popFromLocalQueue(filename: string) {
        const pending = await this.getLocalQueue();
        pending.delete(filename);

        await this.setLocalQueue(Array.from(pending));
    }

    /** Creates a TransformStream that extends the lifetime of a file being written.
     * Each chunk processed will reset the file's deletion timer by calling `push()`.
     * This prevents premature deletion of files during streaming operations */
    stream(filename: string) {
        const gc = this;
        return new TransformStream({
            transform(chunk, controller) {
                gc.push(filename);
                controller.enqueue(chunk);
            },
        });
    }

    push(filename: string, timeout: number = 4e4 /* 40 seconds */) {
        const pending = this.pendingDeletions.get(filename);
        if (pending) clearTimeout(pending);

        this.pendingDeletions.set(
            filename,
            setTimeout(() => {
                this.fs.deleteFile(filename).catch(noop);
            }, timeout)
        );

        if (!pending) {
            void this.pushToLocalQueue(filename);
            logger.debug(`[fs::${this.fs.type}] ${logId(filename)} queued for deletion`);
        }
    }

    pop(filename: string) {
        const pending = this.pendingDeletions.get(filename);

        if (pending) {
            clearTimeout(pending);
            this.pendingDeletions.delete(filename);

            void this.popFromLocalQueue(filename);
        }
    }

    async clear() {
        for (const [filename, timeout] of this.pendingDeletions) {
            clearTimeout(timeout);
            await this.fs.deleteFile(filename).catch(noop);
        }

        this.pendingDeletions.clear();
    }

    queued(): string[] {
        return Array.from(this.pendingDeletions.keys());
    }
}
