import { decryptData, encryptData, generateKey, importKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { uint8ArrayToUtf8String, utf8StringToUint8Array } from '@protontech/crypto/utils';

import { base64ToMasterKey, computeSha256AsBase64, unwrapAesKeyWithMasterKeys, wrapAesKey } from '../crypto';
import { deleteIndexedDB } from '../helpers/indexedDBVersionHandler';
import type { MasterKeysBundle } from '../types';
import { getIndexedDB, requestToPromise } from './util';

interface RecoveryRow {
    id: string;
    expiresAt: number;
    jobId?: string;
    data: Uint8Array<ArrayBuffer>;
    wrappedKey?: Uint8Array<ArrayBuffer>;
}

export async function deleteGuestGenerationRecovery(): Promise<void> {
    const scope = await computeSha256AsBase64('guest');
    if (!(await deleteIndexedDB(`LumoRecovery_${scope}`))) {
        throw new Error('Guest recovery cleanup is blocked or unavailable');
    }
}

export class GenerationRecoveryDb {
    private database?: Promise<IDBDatabase>;

    private disposed = false;

    constructor(
        private readonly userId: string | undefined,
        private readonly getMasterKeys?: () => MasterKeysBundle | undefined
    ) {}

    private assertActive(): void {
        if (this.disposed) {
            throw new Error('Recovery storage is closed');
        }
    }

    private open(): Promise<IDBDatabase> {
        this.assertActive();
        this.database ??= this.openDatabase().catch((error) => {
            this.database = undefined;
            throw error;
        });
        return this.database;
    }

    private async openDatabase(): Promise<IDBDatabase> {
        if (this.userId === undefined) {
            throw new Error('Generation recovery requires a signed-in account');
        }
        const scope = await computeSha256AsBase64(this.userId);
        const request = getIndexedDB().open(`LumoRecovery_${scope}`, 2);
        request.onupgradeneeded = () => {
            // Discard checkpoints written before account-key protection was introduced.
            for (const name of Array.from(request.result.objectStoreNames)) {
                request.result.deleteObjectStore(name);
            }
            request.result.createObjectStore('records', { keyPath: 'id' }).createIndex('expiresAt', 'expiresAt');
            request.result.createObjectStore('keys');
        };
        const database = await requestToPromise(request);
        database.onversionchange = () => {
            database.close();
            this.database = undefined;
        };
        return database;
    }

    private async key(
        wrappedKey?: Uint8Array<ArrayBuffer>
    ): Promise<{ key: CryptoKey; wrappedKey?: Uint8Array<ArrayBuffer> }> {
        this.assertActive();
        const masterKeys = this.getMasterKeys?.();
        if (!masterKeys) {
            throw new Error('Account must be unlocked to access generation recovery');
        }
        const primary = await base64ToMasterKey(masterKeys.primaryMasterKey);
        if (wrappedKey === undefined) {
            const key = await importKey(generateKey(), { extractable: true });
            return { key, wrappedKey: await wrapAesKey({ type: 'AesGcmCryptoKey', encryptKey: key }, primary) };
        }
        const legacy = await Promise.all(
            Object.entries(masterKeys.masterKeys)
                .filter(([id]) => id !== masterKeys.primaryMasterKeyId)
                .map(([, key]) => base64ToMasterKey(key))
        );
        const { key } = await unwrapAesKeyWithMasterKeys(wrappedKey, primary, legacy);
        this.assertActive();
        return { key: key.encryptKey };
    }

    async save(id: string, value: unknown, expiresAt: number, jobId?: string): Promise<void> {
        const { key, wrappedKey } = await this.key();
        const data = await encryptData(key, utf8StringToUint8Array(JSON.stringify(value)), this.associatedData(id));
        await this.write((store) => store.put({ id, expiresAt, jobId, data, wrappedKey } satisfies RecoveryRow));
    }

    async get<T>(id: string): Promise<T | undefined> {
        const db = await this.open();
        const row = await requestToPromise<RecoveryRow | undefined>(
            db.transaction('records').objectStore('records').get(id)
        );
        if (!row) {
            return undefined;
        }
        if (row.expiresAt <= Date.now()) {
            return undefined;
        }
        if (row.wrappedKey === undefined) {
            throw new Error('Account recovery record has no wrapped key');
        }
        const { key } = await this.key(row.wrappedKey);
        const bytes = await decryptData(key, row.data, this.associatedData(id));
        this.assertActive();
        return JSON.parse(uint8ArrayToUtf8String(bytes)) as T;
    }

    private async idsByExpiry(range: IDBKeyRange): Promise<string[]> {
        const db = await this.open();
        const keys = await requestToPromise(
            db.transaction('records').objectStore('records').index('expiresAt').getAllKeys(range)
        );
        return keys.filter((key): key is string => typeof key === 'string');
    }

    async expiredIds(): Promise<string[]> {
        const expired = await this.idsByExpiry(IDBKeyRange.upperBound(Date.now()));
        await Promise.all(expired.map((id) => this.remove(id)));
        return expired;
    }

    async ids(): Promise<string[]> {
        return this.idsByExpiry(IDBKeyRange.lowerBound(Date.now(), true));
    }

    async remove(id: string, expectedJobId?: string): Promise<void> {
        if (!expectedJobId) {
            await this.write((store) => store.delete(id));
            return;
        }
        const db = await this.open();
        this.assertActive();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('records', 'readwrite');
            const store = tx.objectStore('records');
            const read = store.get(id);
            read.onsuccess = () => {
                if ((read.result as RecoveryRow | undefined)?.jobId === expectedJobId) {
                    store.delete(id);
                }
            };
            tx.oncomplete = () => resolve();
            tx.onabort = () => reject(tx.error ?? new Error('Recovery transaction failed'));
        });
    }

    private associatedData(id: string): Uint8Array<ArrayBuffer> {
        return utf8StringToUint8Array(JSON.stringify([this.userId, id]));
    }

    async clear(): Promise<void> {
        await this.clearDatabase(await this.open());
    }

    async dispose(): Promise<void> {
        this.disposed = true;
        const db = await (this.database ?? this.openDatabase());
        await this.clearDatabase(db);
        db.close();
    }

    private clearDatabase(db: IDBDatabase): Promise<void> {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['records', 'keys'], 'readwrite');
            tx.objectStore('records').clear();
            tx.objectStore('keys').clear();
            tx.oncomplete = () => resolve();
            tx.onabort = () => reject(tx.error ?? new Error('Recovery cleanup failed'));
        });
    }

    private async write(action: (store: IDBObjectStore) => IDBRequest): Promise<void> {
        const db = await this.open();
        this.assertActive();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('records', 'readwrite');
            action(tx.objectStore('records'));
            tx.oncomplete = () => resolve();
            tx.onabort = () => reject(tx.error ?? new Error('Recovery transaction failed'));
        });
    }
}
