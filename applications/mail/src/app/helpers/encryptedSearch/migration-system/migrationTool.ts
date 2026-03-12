import { expose } from 'comlink';

import { getIndexKey } from '@proton/encrypted-search/esHelpers';
import { openESDB } from '@proton/encrypted-search/esIDB';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';

import { migrateContent } from './helpers/migrationHelpers';
import type { CleanTextFn, MigrationToolAPI, MigrationToolParams } from './interface';
import { setupCryptoProxy } from './setupCryptoProxy';

export const migration = async ({ user, keyPassword }: MigrationToolParams, cleanText: CleanTextFn) => {
    const esDB = await openESDB(user.ID);
    if (!esDB) {
        return;
    }

    await setupCryptoProxy();
    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
    const indexKey = await getIndexKey(userKeys, user.ID);
    if (!indexKey) {
        return;
    }

    await migrateContent({ esDB, indexKey, cleanText });
};

expose({ migration } satisfies MigrationToolAPI);
