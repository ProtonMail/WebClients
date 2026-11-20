import 'fake-indexeddb/auto';
import { readEnabled } from '@proton/encrypted-search/esIDB/configObjectStore';
import { hasESDB } from '@proton/encrypted-search/esIDB/indexedDB';

import { deleteContentSearchDB } from '../db/delete';
import { openContentSearchDB } from '../db/open';
import type { IndexStatus } from '../db/schema';
import type { Logger } from '../utils/logger';
import { dropImportedIndex, dropIndexationIndex } from './switchIndexPath';

vi.mock('@proton/encrypted-search/esIDB/configObjectStore', () => {
    return { readEnabled: vi.fn() };
});
vi.mock('@proton/encrypted-search/esIDB/indexedDB', () => {
    return { hasESDB: vi.fn() };
});
vi.mock('../db/delete', async () => {
    const actual = await vi.importActual<any>('../db/delete');
    return { deleteContentSearchDB: vi.fn(actual.deleteContentSearchDB) };
});

const logger: Logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
};

const mockV1 = ({ exists, enabled }: { exists: boolean; enabled?: boolean }) => {
    vi.mocked(hasESDB).mockResolvedValue(exists);
    vi.mocked(readEnabled).mockResolvedValue(enabled);
};

/** What the import path leaves behind: a key, blobs and recorded changes, but no status. */
const seedImportedIndex = async (userId: string) => {
    const db = await openContentSearchDB(userId);
    const txn = db.transaction(['config', 'index_blobs', 'outdated_import_ids'], 'readwrite');
    void txn.objectStore('config').put('imported-key', 'indexKey');
    void txn.objectStore('index_blobs').put(new Uint8Array([1]), 'blob-0');
    void txn.objectStore('outdated_import_ids').put({ deleted: false }, 'message-0');
    await txn.done;
    db.close();
};

const seedIndexedIndex = async (userId: string, status: IndexStatus) => {
    const db = await openContentSearchDB(userId);
    const txn = db.transaction(['config', 'index_blobs', 'anchors'], 'readwrite');
    void txn.objectStore('config').put('indexer-key', 'indexKey');
    void txn.objectStore('config').put(status, 'status');
    void txn.objectStore('index_blobs').put(new Uint8Array([1]), 'blob-0');
    void txn.objectStore('anchors').put({ eof: true }, 'historic');
    await txn.done;
    db.close();
};

const readDB = async (userId: string) => {
    const db = await openContentSearchDB(userId);
    try {
        return {
            status: await db.get('config', 'status'),
            indexKey: await db.get('config', 'indexKey'),
            blobs: await db.count('index_blobs'),
            outdated: await db.count('outdated_import_ids'),
            anchor: await db.get('anchors', 'historic'),
        };
    } finally {
        db.close();
    }
};

describe('switchIndexPath', () => {
    let userCounter = 0;
    let userId: string;

    beforeEach(() => {
        userId = `switch-index-path-user-${userCounter++}`;
        vi.clearAllMocks();
    });

    describe('dropImportedIndex', () => {
        it('drops an imported index and enables the indexer when v1 search is enabled', async () => {
            mockV1({ exists: true, enabled: true });
            await seedImportedIndex(userId);

            await dropImportedIndex(userId, logger);

            expect(await readDB(userId)).toEqual({
                status: 'enabled',
                indexKey: undefined,
                blobs: 0,
                outdated: 0,
                anchor: undefined,
            });
        });

        it('drops an imported index without enabling the indexer when v1 search is disabled', async () => {
            mockV1({ exists: true, enabled: false });
            await seedImportedIndex(userId);

            await dropImportedIndex(userId, logger);

            expect(await readDB(userId)).toEqual({
                status: undefined,
                indexKey: undefined,
                blobs: 0,
                outdated: 0,
                anchor: undefined,
            });
        });

        it('does not read the v1 config when there is no v1 database', async () => {
            mockV1({ exists: false });
            await seedImportedIndex(userId);

            await dropImportedIndex(userId, logger);

            expect(readEnabled).not.toHaveBeenCalled();
            expect((await readDB(userId)).status).toBeUndefined();
        });

        it.each<IndexStatus>(['enabled', 'paused', 'disabled'])(
            'keeps an index built by the indexer with status %s',
            async (status) => {
                mockV1({ exists: true, enabled: true });
                await seedIndexedIndex(userId, status);

                await dropImportedIndex(userId, logger);

                expect(await readDB(userId)).toEqual({
                    status,
                    indexKey: 'indexer-key',
                    blobs: 1,
                    outdated: 0,
                    anchor: { eof: true },
                });
            }
        );

        it('leaves an imported index without a status when the delete fails', async () => {
            mockV1({ exists: true, enabled: true });
            await seedImportedIndex(userId);
            vi.mocked(deleteContentSearchDB).mockRejectedValueOnce(new Error('delete failed'));

            await expect(dropImportedIndex(userId, logger)).rejects.toThrow('delete failed');

            expect(await readDB(userId)).toEqual({
                status: undefined,
                indexKey: 'imported-key',
                blobs: 1,
                outdated: 1,
                anchor: undefined,
            });
        });

        it('does not enable the indexer when there is no index at all', async () => {
            mockV1({ exists: true, enabled: true });

            await dropImportedIndex(userId, logger);

            expect((await readDB(userId)).status).toBeUndefined();
        });
    });

    describe('dropIndexationIndex', () => {
        it('drops an index built by the indexer, and tells the other tabs', async () => {
            await seedIndexedIndex(userId, 'enabled');
            const beforeDelete = vi.fn();

            await dropIndexationIndex(userId, logger, beforeDelete);

            expect(beforeDelete).toHaveBeenCalledTimes(1);
            expect(await readDB(userId)).toEqual({
                status: undefined,
                indexKey: undefined,
                blobs: 0,
                outdated: 0,
                anchor: undefined,
            });
        });

        it('keeps an imported index', async () => {
            await seedImportedIndex(userId);
            const beforeDelete = vi.fn();

            await dropIndexationIndex(userId, logger, beforeDelete);

            expect(beforeDelete).not.toHaveBeenCalled();
            expect(await readDB(userId)).toEqual({
                status: undefined,
                indexKey: 'imported-key',
                blobs: 1,
                outdated: 1,
                anchor: undefined,
            });
        });
    });
});
