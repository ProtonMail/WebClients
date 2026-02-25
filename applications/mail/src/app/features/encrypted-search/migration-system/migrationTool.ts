import { expose } from 'comlink';

import { getIndexKey } from '@proton/encrypted-search/esHelpers';
import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';

import type { MigrationToolParams } from './interface';

export const migrationTool = async ({ user, keyPassword }: MigrationToolParams) => {
    console.log('Welcome from the migration tool');

    const userHasESDB = await hasESDB(user.ID);
    if (!userHasESDB) {
        return;
    }

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
