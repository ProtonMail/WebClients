import { jest } from '@jest/globals';

import type { DriveDocument } from '../../types/documents';

// Real encryption, in-memory storage: what lands in the store is exactly what IndexedDB would hold.
// `jest.doMock` + dynamic import, as in `searchService.keyRecovery.test.ts` (ESM mode).

const CANARY = 'canary-salary-figures-7f3a';

const document = (id: string): DriveDocument => ({
    id,
    name: `${CANARY}-name.md`,
    content: `The ${CANARY} for 2027 are confidential.`,
    mimeType: 'text/markdown',
    size: 0,
    modifiedTime: 0,
    folderId: 'folder',
    folderPath: `/${CANARY}-folder`,
    spaceId: 'space',
});

let userCount = 0;

async function setup(options: { store?: Map<string, unknown>; keyAvailable?: boolean } = {}) {
    const store = options.store ?? new Map<string, unknown>();
    const removed: string[] = [];
    jest.doMock('../../indexedDb/db', () => ({
        DbApi: jest.fn().mockImplementation(() => ({
            initialize: async () => undefined,
            loadSearchBlob: async (name: string) => store.get(name) ?? null,
            saveSearchBlob: async (name: string, data: unknown) => {
                store.set(name, data);
            },
            removeSearchBlob: async (name: string) => {
                removed.push(name);
                store.delete(name);
            },
        })),
    }));
    const crypto = await import('../../crypto');
    const { SearchService } = await import('./searchService');
    return { store, removed, crypto, SearchService };
}

/** A service for one user whose search key is `key`, or unavailable when `key` is null. */
function serviceWithKey(SearchService: any, userId: string, key: string | null) {
    const service = SearchService.get(userId);
    jest.spyOn(service, 'getSearchIndexKey').mockImplementation(async () => {
        if (key === null) {
            throw new Error('User ID and master key required to get search index key');
        }
        return key;
    });
    return service;
}

const storedText = (store: Map<string, unknown>) =>
    [...store.values()].map((value) => (typeof value === 'string' ? value : JSON.stringify(value))).join('\n');

describe('search index at rest', () => {
    afterEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();
    });

    it('stores project file text, names and paths only encrypted, and reads them back', async () => {
        userCount += 1;
        const userId = `at-rest-${userCount}`;
        const { store, crypto, SearchService } = await setup();
        const key = crypto.generateSearchIndexKeyBase64();

        await serviceWithKey(SearchService, userId, key).indexDocuments([document('doc-1')]);

        expect(store.has('drive_manifest')).toBe(true);
        expect(store.has('bm25_index')).toBe(true);
        expect(storedText(store)).not.toContain(CANARY);
        expect(storedText(store)).not.toContain('canary');
        expect(() => JSON.parse(store.get('drive_manifest') as string)).toThrow();

        jest.resetModules();
        const reloaded = await setup({ store });
        const documents = await serviceWithKey(reloaded.SearchService, userId, key).getDriveDocuments();
        expect(documents.map((doc: DriveDocument) => doc.id)).toEqual(['doc-1']);
    });

    it.each([
        ['a string', (json: string) => json],
        ['bytes', (json: string) => new TextEncoder().encode(json)],
    ])('migrates a plaintext manifest stored as %s by older versions to encrypted storage', async (_, encode) => {
        userCount += 1;
        const userId = `at-rest-${userCount}`;
        const store = new Map<string, unknown>([
            ['drive_manifest', encode(JSON.stringify([document('legacy')]))],
            ['bm25_index', JSON.stringify({ legacy: CANARY })],
        ]);
        const { removed, crypto, SearchService } = await setup({ store });
        const key = crypto.generateSearchIndexKeyBase64();

        const documents = await serviceWithKey(SearchService, userId, key).getDriveDocuments();

        expect(documents.map((doc: DriveDocument) => doc.id)).toEqual(['legacy']);
        expect(removed).toEqual([]);
        expect(storedText(store)).not.toContain(CANARY);
        expect(() => JSON.parse(store.get('drive_manifest') as string)).toThrow();

        jest.resetModules();
        const reloaded = await setup({ store });
        const service = serviceWithKey(reloaded.SearchService, userId, key);
        expect((await service.getDriveDocuments()).map((doc: DriveDocument) => doc.id)).toEqual(['legacy']);
    });

    it('drops a manifest that is neither readable ciphertext nor a plaintext manifest', async () => {
        userCount += 1;
        const store = new Map<string, unknown>([
            ['drive_manifest', 'not-json-and-not-ciphertext'],
            ['bm25_index', 'x'],
        ]);
        const { removed, crypto, SearchService } = await setup({ store });

        const service = serviceWithKey(SearchService, `at-rest-${userCount}`, crypto.generateSearchIndexKeyBase64());

        expect(await service.getDriveDocuments()).toEqual([]);
        expect(removed).toEqual(expect.arrayContaining(['drive_manifest', 'bm25_index']));
        expect(store.has('drive_manifest')).toBe(false);
    });

    it('rejects a blob moved in from another name', async () => {
        userCount += 1;
        const userId = `at-rest-${userCount}`;
        const { store, crypto, SearchService } = await setup();
        const key = crypto.generateSearchIndexKeyBase64();
        await serviceWithKey(SearchService, userId, key).indexDocuments([document('doc-1')]);
        store.set('drive_manifest', store.get('bm25_index'));

        jest.resetModules();
        const reloaded = await setup({ store });

        expect(await serviceWithKey(reloaded.SearchService, userId, key).getDriveDocuments()).toEqual([]);
        expect(store.has('drive_manifest')).toBe(false);
    });

    it('writes nothing, and keeps what is stored, while the search key is unavailable', async () => {
        userCount += 1;
        const userId = `at-rest-${userCount}`;
        const { store, crypto, SearchService } = await setup();
        const key = crypto.generateSearchIndexKeyBase64();
        await serviceWithKey(SearchService, userId, key).indexDocuments([document('doc-1')]);
        const before = new Map(store);

        jest.resetModules();
        const locked = await setup({ store });
        const service = serviceWithKey(locked.SearchService, userId, null);
        await service.indexDocuments([document('doc-2')]);

        expect(store).toEqual(before);
        expect(storedText(store)).not.toContain(CANARY);
    });
});
