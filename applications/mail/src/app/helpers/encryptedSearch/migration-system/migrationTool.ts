import { expose } from 'comlink';

import { getIndexKey } from '@proton/encrypted-search/esHelpers';
import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';

import { isAllContentUpToDate } from './helpers/contentVersionHelpers';
import { migrateContent } from './helpers/migrationHelpers';
import type { CleanTextFn, MigrationToolAPI, MigrationToolParams } from './interface';
import { setupCryptoProxy } from './setupCryptoProxy';

export const migration = async ({ user, keyPassword }: MigrationToolParams, cleanText: CleanTextFn) => {
    console.log('migration started');
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

    const isAllMigrated = await isAllContentUpToDate(esDB);
    console.log(`isAllMigrated: ${isAllMigrated}`);
    if (isAllMigrated) {
        return;
    }

    const start = performance.now();
    await migrateContent({ esDB, indexKey, cleanText });
    const end = performance.now();
    console.log(`migration finished in ${end - start}ms`);
};

expose({ migration } satisfies MigrationToolAPI);
