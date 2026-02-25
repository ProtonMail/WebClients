import { expose } from 'comlink';

import { getIndexKey } from '@proton/encrypted-search/esHelpers';
import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';

import type { MigrationToolParams } from './interface';
import { setupCryptoProxy } from './setupCryptoProxy';

export const migrationTool = async ({ user, keyPassword }: MigrationToolParams) => {
    console.log('Welcome from the migration tool');

    const databaseExist = await hasESDB(user.ID);
    if (!databaseExist) {
        console.log('No ESDB');
        return;
    }

    await setupCryptoProxy();
    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
    const indexKey = await getIndexKey(userKeys, user.ID);
    if (!indexKey) {
        throw new Error('No index key found');
    }

    const esDB = await openESDB(user.ID);
    if (!esDB) {
        throw new Error('No encrypted search database found');
    }

    console.log({ esDB });
};

expose(migrationTool);
