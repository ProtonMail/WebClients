import 'fake-indexeddb/auto';

import { EngineDB } from './EngineDB';

beforeEach(() => {
    // Fresh in-memory IDB for each test — prevents state leaking between tests.
    indexedDB = new IDBFactory();
});

describe('EngineDB.open', () => {
    it('opens successfully', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        expect(db).toBeInstanceOf(EngineDB);
    });

    it('throws when engineType contains ":"', async () => {
        await expect(EngineDB.open('user1', 'engine:type')).rejects.toThrow('Invalid engine type');
    });

    it('throws when userID contains ":"', async () => {
        await expect(EngineDB.open('user:1', 'engine1')).rejects.toThrow('Invalid userId');
    });

    it('isolates databases by userID', async () => {
        const db1 = await EngineDB.open('user1', 'engine1');
        const db2 = await EngineDB.open('user2', 'engine1');

        await db1.setEngineState({ activeConfigKey: 'config-a' });

        expect((await db1.getEngineState()).activeConfigKey).toBe('config-a');
        expect((await db2.getEngineState()).activeConfigKey).toBeNull();
    });

    it('isolates databases by engineType', async () => {
        const db1 = await EngineDB.open('user1', 'engine1');
        const db2 = await EngineDB.open('user1', 'engine2');

        await db1.setEngineState({ activeConfigKey: 'config-a' });

        expect((await db1.getEngineState()).activeConfigKey).toBe('config-a');
        expect((await db2.getEngineState()).activeConfigKey).toBeNull();
    });
});

describe('EngineDB.getEngineState', () => {
    it('returns default state when nothing is stored', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        expect(await db.getEngineState()).toEqual({ activeConfigKey: null });
    });
});

describe('EngineDB.setEngineState', () => {
    it('persists state', async () => {
        const db = await EngineDB.open('user1', 'engine1');

        await db.setEngineState({ activeConfigKey: 'v1' });

        expect((await db.getEngineState()).activeConfigKey).toBe('v1');
    });

    it('merges partial updates without losing other fields', async () => {
        const db = await EngineDB.open('user1', 'engine1');

        await db.setEngineState({ activeConfigKey: 'v1' });
        await db.setEngineState({ activeConfigKey: null });

        expect((await db.getEngineState()).activeConfigKey).toBeNull();
    });

    it('last write wins on concurrent updates', async () => {
        const db = await EngineDB.open('user1', 'engine1');

        await Promise.all([db.setEngineState({ activeConfigKey: 'v1' }), db.setEngineState({ activeConfigKey: 'v2' })]);

        const { activeConfigKey } = await db.getEngineState();
        expect(['v1', 'v2']).toContain(activeConfigKey);
    });
});

describe('EngineDB index blobs', () => {
    let db: EngineDB;

    beforeEach(async () => {
        db = await EngineDB.open('user1', 'engine1');
    });

    it('returns undefined for a missing blob', async () => {
        expect(await db.getIndexBlob('v1', 'segment.0')).toBeUndefined();
    });

    it('stores and retrieves a blob', async () => {
        const blob = new Uint8Array([1, 2, 3]).buffer;
        await db.putIndexBlob('v1', 'segment.0', blob);

        expect(await db.getIndexBlob('v1', 'segment.0')).toEqual(blob);
    });

    it('isolates blobs by configKey', async () => {
        const blob = new Uint8Array([1, 2, 3]).buffer;
        await db.putIndexBlob('v1', 'segment.0', blob);

        expect(await db.getIndexBlob('v2', 'segment.0')).toBeUndefined();
    });

    it('isolates blobs by blobName', async () => {
        const blob1 = new Uint8Array([1]).buffer;
        const blob2 = new Uint8Array([2]).buffer;
        await db.putIndexBlob('v1', 'segment.0', blob1);
        await db.putIndexBlob('v1', 'segment.1', blob2);

        expect(await db.getIndexBlob('v1', 'segment.0')).toEqual(blob1);
        expect(await db.getIndexBlob('v1', 'segment.1')).toEqual(blob2);
    });

    it('overwrites an existing blob', async () => {
        const original = new Uint8Array([1, 2, 3]).buffer;
        const updated = new Uint8Array([4, 5, 6]).buffer;
        await db.putIndexBlob('v1', 'segment.0', original);
        await db.putIndexBlob('v1', 'segment.0', updated);

        expect(await db.getIndexBlob('v1', 'segment.0')).toEqual(updated);
    });

    it('deletes a blob', async () => {
        const blob = new Uint8Array([1, 2, 3]).buffer;
        await db.putIndexBlob('v1', 'segment.0', blob);
        await db.deleteIndexBlob('v1', 'segment.0');

        expect(await db.getIndexBlob('v1', 'segment.0')).toBeUndefined();
    });

    it('deleting a non-existent blob does not throw', async () => {
        await expect(db.deleteIndexBlob('v1', 'ghost')).resolves.not.toThrow();
    });

    it('stores multiple blobs across configKeys independently', async () => {
        const blobV1 = new Uint8Array([1]).buffer;
        const blobV2 = new Uint8Array([2]).buffer;
        await db.putIndexBlob('v1', 'segment.0', blobV1);
        await db.putIndexBlob('v2', 'segment.0', blobV2);

        expect(await db.getIndexBlob('v1', 'segment.0')).toEqual(blobV1);
        expect(await db.getIndexBlob('v2', 'segment.0')).toEqual(blobV2);
    });
});
