import type { PrivateKeyReference } from '@protontech/crypto';
import type { AesGcmCryptoKey } from '@protontech/crypto/subtle/aesGcm.js';
import * as Comlink from 'comlink';
import { deleteDB } from 'idb';

import { ES_SYNC_ACTIONS } from '@proton/encrypted-search/constants';
import { getIndexKey as getIndexKeyV1 } from '@proton/encrypted-search/esHelpers';
import type { ESEvent } from '@proton/encrypted-search/lib/models';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { ESBaseMessage } from '../../models/encryptedSearch';

import { getOrGenerateIndexKey as getOrGenerateIndexKeyV2 } from '../crypto/indexKey';
import { openContentSearchDB } from '../db/open';
import { ImportHandle } from '../import/ImportHandle';
import type ImportWorker from '../import/ImportWorker';
import { AsyncInit } from '../utils/AsyncInit';

export class IndexService {
    private importHandle?: AsyncInit<ImportHandle>;

    constructor(
        private readonly userId: string,
        private readonly getUserKeys: () => Promise<DecryptedKey<PrivateKeyReference>[]>
    ) {}

    async handleEvent(event: ESEvent<ESBaseMessage>) {
        const db = await openContentSearchDB(this.userId);
        try {
            const txn = db.transaction('outdated_import_ids', 'readwrite');
            const outdatedStore = txn.objectStore('outdated_import_ids');
            if (event.Items) {
                for (const i of event.Items) {
                    void outdatedStore.put({ deleted: i.Action === ES_SYNC_ACTIONS.DELETE }, i.ID);
                }
            }
            if (event.Refresh) {
                void outdatedStore.put('', 'refresh');
            }
            await txn.done;
        } finally {
            db.close();
        }
    }

    async importFromEncryptedSearch(): Promise<ImportHandle> {
        if (!this.importHandle || this.importHandle.failed) {
            this.importHandle = new AsyncInit(async () => {
                const userKeys = await this.getUserKeys();
                const newIndexKey = await this.getKeyAndDropIndexIfNeeded(userKeys);
                const oldIndexKey = await getIndexKeyV1(userKeys, this.userId);
                if (!oldIndexKey) {
                    throw new Error('could not get ES db key');
                }
                const keys = {
                    indexV1Key: oldIndexKey,
                    indexV2Key: newIndexKey,
                };
                const worker = new Worker(new URL('../import/import.worker.ts', import.meta.url));
                const wrappedWorker = Comlink.wrap<ImportWorker>(worker);
                const importHandle = new ImportHandle(wrappedWorker, () => {
                    worker.terminate();
                    this.importHandle = undefined;
                });
                await importHandle.start(this.userId, keys);
                return importHandle;
            });
        }
        return this.importHandle.promise;
    }

    private async getKeyAndDropIndexIfNeeded(userKeys: DecryptedKey<PrivateKeyReference>[]): Promise<AesGcmCryptoKey> {
        {
            const db = await openContentSearchDB(this.userId);
            const dbName = db.name;
            let failedToDecrypt = false;
            try {
                return await getOrGenerateIndexKeyV2(db, userKeys);
            } catch (err) {
                failedToDecrypt = true;
            } finally {
                db.close();
            }
            if (failedToDecrypt) {
                await deleteDB(dbName, {
                    blocked() {
                        throw new Error(
                            "content search: failed to drop index after key couldn't be decrypted: blocked"
                        );
                    },
                });
            }
        }
        {
            const db = await openContentSearchDB(this.userId);
            try {
                return await getOrGenerateIndexKeyV2(db, userKeys);
            } finally {
                db.close();
            }
        }
    }

    get currentImport(): ImportHandle | undefined {
        return this.importHandle?.value;
    }
}

let sharedIndexService: IndexService | undefined;
export function getSharedIndexService(userId: string, getUserKeys: () => Promise<DecryptedKey<PrivateKeyReference>[]>) {
    if (!sharedIndexService) {
        sharedIndexService = new IndexService(userId, getUserKeys);
    }
    return sharedIndexService;
}
