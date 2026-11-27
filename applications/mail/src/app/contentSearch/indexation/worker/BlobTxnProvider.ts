import type { IDBPDatabase } from 'idb';

import { BlobCache } from '../../cache/BlobCache';
import { EncryptedBlobTransaction, type OpenBlobTransaction } from '../../crypto/EncryptedBlobTransaction';
import type { Database, DatabaseStores, ReadTransaction } from '../../db/schema';

/** takes care of all the boilerplate of setting up a blob txn so we don't have to do it in each indexer,
 * and also implements a BlobCache lifetime strategy so again we don't have to bother the indexers with that.
 * A short-lived cache only lasts from one `startTxn` to the next, as the incremental indexer applies many small
 * batches whose blobs are hardly read again. */
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

    /**
     * A transaction for reading what was just committed through the cache the last `startTxn` warmed, e.g. to match
     * the written messages against the open searches: a short-lived cache is kept until the next `startTxn`.
     */
    async startReadTxn(db: IDBPDatabase<Database>): Promise<OpenBlobTransaction> {
        if (!this.blobCache) {
            this.blobCache = new BlobCache();
        }
        return EncryptedBlobTransaction.start(this.blobCache, db, this.indexKey);
    }

    dispose() {
        this.blobCache?.free();
        this.blobCache = undefined;
    }
}
