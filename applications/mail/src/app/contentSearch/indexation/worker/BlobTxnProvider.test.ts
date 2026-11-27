import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import 'fake-indexeddb/auto';
import type { IDBPDatabase } from 'idb';

import { BlobCache } from '../../cache/BlobCache';
import type { OpenBlobTransaction } from '../../crypto/EncryptedBlobTransaction';
import { openContentSearchDB } from '../../db/open';
import type { Database } from '../../db/schema';
import { BlobTxnProvider } from './BlobTxnProvider';

let userCounter = 0;

const cacheOf = (txn: OpenBlobTransaction) => {
    return (txn as unknown as { cache: BlobCache | undefined }).cache;
};

describe('BlobTxnProvider', () => {
    let db: IDBPDatabase<Database>;
    let indexKey: CryptoKey;

    beforeEach(async () => {
        db = await openContentSearchDB(`blob-txn-provider-${userCounter++}`);
        indexKey = await generateAndImportKey();
    });

    afterEach(() => {
        db.close();
    });

    it.each([true, false])(
        'reads back through the cache of the last write transaction (short-lived cache: %s)',
        async (shortLivedCache) => {
            const provider = new BlobTxnProvider(indexKey, { shortLivedCache });
            const free = vi.spyOn(BlobCache.prototype, 'free');

            const write = await provider.startTxn(db);
            const read = await provider.startReadTxn(db);

            expect(cacheOf(read)).toBeDefined();
            expect(cacheOf(read)).toBe(cacheOf(write));
            expect(free).not.toHaveBeenCalled();
            free.mockRestore();
            provider.dispose();
        }
    );

    it('frees a short-lived cache at the next write transaction', async () => {
        const provider = new BlobTxnProvider(indexKey, { shortLivedCache: true });
        const first = await provider.startTxn(db);
        await provider.startReadTxn(db);

        const second = await provider.startTxn(db);

        expect(cacheOf(second)).not.toBe(cacheOf(first));
        provider.dispose();
    });
});
