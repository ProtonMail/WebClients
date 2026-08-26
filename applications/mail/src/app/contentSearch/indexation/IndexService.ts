import type { PrivateKeyReference } from '@protontech/crypto';
import type { AesGcmCryptoKey } from '@protontech/crypto/subtle/aesGcm.js';
import { deleteDB } from 'idb';

import { ES_SYNC_ACTIONS } from '@proton/encrypted-search/constants';
import { getIndexKey as getIndexKeyV1 } from '@proton/encrypted-search/esHelpers';
import { hasESDB } from '@proton/encrypted-search/esIDB';
import type { ESEvent } from '@proton/encrypted-search/lib/models';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { ESBaseMessage } from '../../models/encryptedSearch';
import { getOrGenerateIndexKey as getOrGenerateIndexKeyV2 } from '../crypto/indexKey';
import { DatabaseLock } from '../db/DatabaseLock';
import { openContentSearchDB } from '../db/open';
import { ImportHandle } from '../import/ImportHandle';
import { AsyncInit } from '../utils/AsyncInit';

export class IndexService {
    private importHandle?: AsyncInit<ImportHandle | undefined>;
    public readonly dbLock = new DatabaseLock();

    constructor(
        private readonly userId: string,
        private readonly getUserKeys: () => Promise<DecryptedKey<PrivateKeyReference>[]>
    ) {}

    /**
     * Record what an event touched, so a later import knows what to refresh.
     * Returns whether it recorded anything: the mail event loop ticks every 30s or so and most of
     * those events carry no message changes, which is not worth an import (each one spawns a worker
     * and rescans both indexes to discover it has nothing to do).
     */
    async handleEvent(event: ESEvent<ESBaseMessage>): Promise<boolean> {
        if (!event.Items?.length && !event.Refresh) {
            return false;
        }
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
        return true;
    }

    async importFromEncryptedSearch(): Promise<ImportHandle | undefined> {
        if (!this.importHandle || this.importHandle.failed) {
            this.importHandle = new AsyncInit(async () => {
                // The v1 ES DB is the import source. Bail out before touching any v1 read helper
                // when it doesn't exist: those helpers go through openESDB, which *creates* the DB
                // if absent, leaving an empty shell. That shell makes hasESDB report true, so a
                // later enableEncryptedSearch takes the resume branch and fails instead of building
                // a fresh, initialized DB. No v1 DB means there is nothing to import anyway.
                if (!(await hasESDB(this.userId))) {
                    this.importHandle = undefined;
                    return;
                }
                const userKeys = await this.getUserKeys();
                const newIndexKey = await this.getKeyAndDropIndexIfNeeded(userKeys);
                const oldIndexKey = await getIndexKeyV1(userKeys, this.userId);
                if (!oldIndexKey) {
                    this.importHandle = undefined;
                    return;
                }
                const keys = {
                    indexV1Key: oldIndexKey,
                    indexV2Key: newIndexKey,
                };
                const importHandle = new ImportHandle(this.userId, keys, this.dbLock);
                // errors are handled inside start
                void importHandle.start().finally(() => {
                    this.importHandle = undefined;
                });
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
