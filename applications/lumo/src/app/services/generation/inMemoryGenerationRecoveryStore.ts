import type { GenerationRecoveryDb } from '../../indexedDb/generationRecoveryDb';
import { attachmentDataCache } from '../attachmentDataCache';

export type GenerationRecoveryStorage = Pick<
    GenerationRecoveryDb,
    'get' | 'ids' | 'expiredIds' | 'remove' | 'dispose'
> & {
    save(id: string, value: unknown, expiresAt: number, jobId?: string, attachmentIds?: string[]): Promise<void>;
};

interface InMemoryRecoveryEntry {
    value: unknown;
    expiresAt: number;
    jobId?: string;
    attachmentIds: string[];
}

export class InMemoryGenerationRecoveryStore implements GenerationRecoveryStorage {
    private readonly records = new Map<string, InMemoryRecoveryEntry>();
    private disposed = false;

    private assertActive(): void {
        if (this.disposed) {
            throw new Error('Recovery storage is closed');
        }
    }

    private releaseAttachments(id: string, retainedIds: ReadonlySet<string> = new Set()): void {
        const record = this.records.get(id);
        if (record !== undefined) {
            for (const attachmentId of record.attachmentIds) {
                if (!retainedIds.has(attachmentId)) {
                    attachmentDataCache.release(attachmentId, id);
                }
            }
        }
    }

    async save(
        id: string,
        value: unknown,
        expiresAt: number,
        jobId?: string,
        attachmentIds: string[] = []
    ): Promise<void> {
        this.assertActive();
        const snapshot = structuredClone(value);
        for (const attachmentId of attachmentIds) {
            attachmentDataCache.retain(attachmentId, id);
        }
        this.releaseAttachments(id, new Set(attachmentIds));
        this.records.set(id, { value: snapshot, expiresAt, jobId, attachmentIds });
    }

    async get<T>(id: string): Promise<T | undefined> {
        this.assertActive();
        const record = this.records.get(id);
        if (record === undefined || record.expiresAt <= Date.now()) {
            return undefined;
        }
        return structuredClone(record.value) as T;
    }

    async ids(): Promise<string[]> {
        this.assertActive();
        return Array.from(this.records)
            .filter(([, record]) => record.expiresAt > Date.now())
            .map(([id]) => id);
    }

    async expiredIds(): Promise<string[]> {
        this.assertActive();
        const ids = Array.from(this.records)
            .filter(([, record]) => record.expiresAt <= Date.now())
            .map(([id]) => id);
        for (const id of ids) {
            this.releaseAttachments(id);
            this.records.delete(id);
        }
        return ids;
    }

    async remove(id: string, expectedJobId?: string): Promise<void> {
        this.assertActive();
        if (expectedJobId === undefined || this.records.get(id)?.jobId === expectedJobId) {
            this.releaseAttachments(id);
            this.records.delete(id);
        }
    }

    async dispose(): Promise<void> {
        this.disposed = true;
        for (const id of this.records.keys()) {
            this.releaseAttachments(id);
        }
        this.records.clear();
    }
}
