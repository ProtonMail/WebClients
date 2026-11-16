import type { IDBPDatabase } from 'idb';

import { BlobCache } from '../../cache/BlobCache';
import { EncryptedBlobTransaction, type OpenBlobTransaction } from '../../crypto/EncryptedBlobTransaction';
import type { Database, DatabaseStores, ReadTransaction } from '../../db/schema';

export type StartBlobTxnFn = BlobTxnProvider['startTxn'];

/** takes care of all the boilerplate of setting up a blob txn so we don't have to do it in each indexer,
 * and also implements a BlobCache lifetime strategy so again we don't have to bother the indexers with that. */
export class BlobTxnProvider {
    private blobCache?: BlobCache;

    constructor(
        private readonly indexKey: CryptoKey,
        private readonly options: { shortLivedCache: boolean }
    ) {}

    async startTxn<Stores extends DatabaseStores>(
        db: IDBPDatabase<Database>,
        idbTxn?: ReadTransaction<Stores, 'config'> | undefined
    ): Promise<OpenBlobTransaction> {
        if (this.options.shortLivedCache) {
            this.blobCache?.free();
            this.blobCache = undefined;
        }
        if (!this.blobCache) {
            this.blobCache = new BlobCache();
        }
        return EncryptedBlobTransaction.start(this.blobCache, db, this.indexKey, idbTxn);
    }

    dispose() {
        this.blobCache?.free();
        this.blobCache = undefined;
    }
}
