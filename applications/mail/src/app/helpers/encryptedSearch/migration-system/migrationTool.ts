import { expose } from 'comlink';

import { getIndexKey } from '@proton/encrypted-search/esHelpers';
import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';

import { ContentUpgrade } from './ContentUpgrade';
import type { MigrationToolAPI, MigrationToolParams } from './interface';
import { setupCryptoProxy } from './setupCryptoProxy';

export const migration = async ({ user, keyPassword }: MigrationToolParams) => {
    const databaseExist = await hasESDB(user.ID);
    if (!databaseExist) {
        return;
    }

    await setupCryptoProxy();
    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
    const indexKey = await getIndexKey(userKeys, user.ID);
    if (!indexKey) {
        return;
    }

    const esDB = await openESDB(user.ID);
    if (!esDB) {
        return;
    }

    const contentUpgrade = new ContentUpgrade(esDB, indexKey);
    const isAllMigrated = await contentUpgrade.isAllContentUpdated();
    if (isAllMigrated) {
        return;
    }

    await contentUpgrade.migrateContent();
};

expose({ migration } satisfies MigrationToolAPI);
