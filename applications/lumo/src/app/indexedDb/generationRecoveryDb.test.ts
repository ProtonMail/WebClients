import type { MasterKeysBundle } from '../types';
import { GenerationRecoveryDb, deleteGuestGenerationRecovery } from './generationRecoveryDb';

jest.mock('../crypto', () => ({
    ...jest.requireActual('../crypto'),
    computeSha256AsBase64: async (input: string) => Buffer.from(input).toString('base64'),
}));

const masterKeys: MasterKeysBundle = {
    primaryMasterKeyId: 'master-1',
    primaryMasterKey: Buffer.alloc(32, 1).toString('base64'),
    masterKeys: { 'master-1': Buffer.alloc(32, 1).toString('base64') },
};
const accountDb = (userId: string, getMasterKeys = () => masterKeys as MasterKeysBundle | undefined) =>
    new GenerationRecoveryDb(userId, getMasterKeys);

const readRows = async (userId: string) => {
    const request = indexedDB.open(`LumoRecovery_${Buffer.from(userId).toString('base64')}`, 2);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    const rows = db.transaction('records').objectStore('records').getAll();
    return new Promise<any[]>((resolve, reject) => {
        rows.onsuccess = () => {
            db.close();
            resolve(rows.result);
        };
        rows.onerror = () => reject(rows.error);
    });
};

describe('generation recovery storage', () => {
    it('encrypts checkpoints and restores their contents across instances', async () => {
        const user = 'recovery-roundtrip';
        const record = { requestKey: 'secret request key', response: 'private completion', jobId: 'job-1' };
        await accountDb(user).save('conversation', record, Date.now() + 60_000);
        expect(await accountDb(user).get('conversation')).toEqual(record);
        const [row] = await readRows(user);
        expect(new TextDecoder().decode(row.data)).not.toContain('private completion');
        expect(new TextDecoder().decode(row.data)).not.toContain('secret request key');
        expect(row.id).toBe('conversation');
    });

    it('chooses the same encryption key for simultaneous first writes', async () => {
        const first = accountDb('recovery-race');
        const second = accountDb('recovery-race');
        await Promise.all([
            first.save('one', { text: 'first response' }, Date.now() + 60_000),
            second.save('two', { text: 'second response' }, Date.now() + 60_000),
        ]);
        expect(await second.get('one')).toEqual({ text: 'first response' });
        expect(await first.get('two')).toEqual({ text: 'second response' });
    });

    it('keeps a newer job when an older message save finishes late', async () => {
        const db = accountDb('recovery-late-save');
        await db.save('conversation', { answer: 'old' }, Date.now() + 60_000, 'old-job');
        await db.save('conversation', { answer: 'new' }, Date.now() + 60_000, 'new-job');
        await db.remove('conversation', 'old-job');
        expect(await db.get('conversation')).toEqual({ answer: 'new' });
        await db.remove('conversation', 'new-job');
        expect(await db.get('conversation')).toBeUndefined();
    });

    it('expires jobs and keeps user scopes separate', async () => {
        const db = accountDb('recovery-expiry');
        await db.save('old', { text: 'expired' }, Date.now() - 1);
        await db.save('live', { text: 'recoverable' }, Date.now() + 60_000);
        expect(await db.expiredIds()).toEqual(['old']);
        expect(await db.get('old')).toBeUndefined();
        expect(await db.ids()).toEqual(['live']);
        expect(await accountDb('another-user').get('live')).toBeUndefined();
        await db.clear();
        expect(await db.ids()).toEqual([]);
    });
});

it('requires account credentials even when the stored wrapped key is available', async () => {
    const user = 'account-protected';
    const record = { spaceKey: 'private space key', history: 'private history' };
    await accountDb(user).save('chat', record, Date.now() + 60_000);
    await expect(accountDb(user, () => undefined).get('chat')).rejects.toThrow('Account must be unlocked');
    const wrongKeys = { ...masterKeys, primaryMasterKey: Buffer.alloc(32, 2).toString('base64'), masterKeys: {} };
    await expect(accountDb(user, () => wrongKeys).get('chat')).rejects.toThrow('no master key');
    expect(await accountDb(user).get('chat')).toEqual(record);
    const request = indexedDB.open(`LumoRecovery_${Buffer.from(user).toString('base64')}`, 2);
    const db = await new Promise<IDBDatabase>((resolve) => {
        request.onsuccess = () => resolve(request.result);
    });
    const keys = db.transaction('keys').objectStore('keys').getAll();
    const stored = await new Promise<unknown[]>((resolve) => {
        keys.onsuccess = () => resolve(keys.result);
    });
    expect(stored).toEqual([]);
    const [row] = await readRows(user);
    expect(row.wrappedKey).toBeInstanceOf(Uint8Array);
    expect(row.wrappedKey).not.toHaveProperty('usages');
    db.close();
});

it('can recover with a retained master key after rotation', async () => {
    const user = 'key-rotation';
    const record = { answer: 'before rotation' };
    await accountDb(user).save('chat', record, Date.now() + 60_000);
    const rotated = {
        primaryMasterKeyId: 'master-2',
        primaryMasterKey: Buffer.alloc(32, 2).toString('base64'),
        masterKeys: masterKeys.masterKeys,
    };
    expect(await accountDb(user, () => rotated).get('chat')).toEqual(record);
    await accountDb(user, () => rotated).save('new', { answer: 'after rotation' }, Date.now() + 60_000);
    const currentOnly = { ...rotated, masterKeys: {} };
    expect(await accountDb(user, () => currentOnly).get('new')).toEqual({ answer: 'after rotation' });
});

it('clears records and keys on logout and rejects late checkpoint writes', async () => {
    const user = 'logout';
    const db = accountDb(user);
    await db.save('chat', { history: 'private history' }, Date.now() + 60_000);
    const saving = db.save('late', { history: 'late checkpoint' }, Date.now() + 60_000);
    const disposing = db.dispose();
    await expect(saving).rejects.toThrow();
    await disposing;
    expect(await readRows(user)).toEqual([]);
    await expect(db.save('later', {}, Date.now() + 60_000)).rejects.toThrow('closed');
    await expect(accountDb(user, () => undefined).get('chat')).resolves.toBeUndefined();
});

it('discards checkpoints and usable device keys from the unprotected schema', async () => {
    const user = 'legacy-recovery';
    const request = indexedDB.open(`LumoRecovery_${Buffer.from(user).toString('base64')}`, 1);
    request.onupgradeneeded = () => {
        request.result.createObjectStore('records', { keyPath: 'id' });
        request.result.createObjectStore('keys');
    };
    const db = await new Promise<IDBDatabase>((resolve) => {
        request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction(['records', 'keys'], 'readwrite');
    tx.objectStore('records').put({ id: 'old', expiresAt: Date.now() + 60_000, data: 'old ciphertext' });
    tx.objectStore('keys').put('old usable key', 'device');
    await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
    });
    db.close();
    const upgraded = accountDb(user);
    expect(await upgraded.ids()).toEqual([]);
    await upgraded.save('new', { answer: 'protected' }, Date.now() + 60_000);
    expect(await accountDb(user).get('new')).toEqual({ answer: 'protected' });
});

it('rejects guest storage even if account key material is accidentally supplied', async () => {
    const open = jest.spyOn(indexedDB, 'open');
    try {
        const db = new GenerationRecoveryDb(undefined, () => masterKeys);
        await expect(db.save('chat', { answer: 'private guest answer' }, Date.now() + 60_000)).rejects.toThrow(
            'requires a signed-in account'
        );
        await expect(db.get('chat')).rejects.toThrow('requires a signed-in account');
        expect(open).not.toHaveBeenCalled();
    } finally {
        open.mockRestore();
    }
});

it('deletes legacy guest records and device keys while preserving account checkpoints', async () => {
    const name = `LumoRecovery_${Buffer.from('guest').toString('base64')}`;
    const request = indexedDB.open(name, 2);
    request.onupgradeneeded = () => {
        request.result.createObjectStore('records', { keyPath: 'id' });
        request.result.createObjectStore('keys');
    };
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction(['records', 'keys'], 'readwrite');
    transaction.objectStore('records').put({ id: 'guest-chat', data: 'legacy guest ciphertext' });
    transaction.objectStore('keys').put('legacy guest device key', 'device');
    await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
    });
    database.close();
    const account = accountDb('guest-cleanup-account');
    await account.save('chat', { answer: 'account answer' }, Date.now() + 60_000);
    await deleteGuestGenerationRecovery();
    expect((await indexedDB.databases()).map((database) => database.name)).not.toContain(name);
    expect(await account.get('chat')).toEqual({ answer: 'account answer' });
    const open = jest.spyOn(indexedDB, 'open');
    try {
        await deleteGuestGenerationRecovery();
        expect(open).not.toHaveBeenCalled();
        expect((await indexedDB.databases()).map((database) => database.name)).not.toContain(name);
    } finally {
        open.mockRestore();
    }
});
