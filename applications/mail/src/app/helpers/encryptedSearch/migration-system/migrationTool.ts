import { expose } from 'comlink';

import { getIndexKey } from '@proton/encrypted-search/esHelpers';
import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';

import { ContentVersionExtractor } from './ContentVersionExtractor';
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

    const contentVersionExtractor = new ContentVersionExtractor(user.ID, esDB, indexKey);

    const extractVersion = async () => {
        console.log('Starting content version extraction');
        const didReachMaxRetries = await contentVersionExtractor.didReachMaxRetries();
        if (didReachMaxRetries) {
            return;
        }

        const isComplete = await contentVersionExtractor.validateAllContentMigrated();
        if (isComplete) {
            console.log('Content version already extracted');
            return;
        }

        const checkpoint = await contentVersionExtractor.getLatestCheckpoint();
        await contentVersionExtractor.extractVersionsAndSaveUpdatedESItem(checkpoint);
        const isCompleteAfterExtract = await contentVersionExtractor.validateAllContentMigrated();
        if (!isCompleteAfterExtract) {
            await contentVersionExtractor.incrementRetryCount();
            await extractVersion();
            return;
        }

        console.log('Content version migration extraction complete');
    };

    const upgradeContent = async () => {
        console.log('Starting content version upgrade');
    };

    const migrationComplete = await esDB.get('config', 'contentVersionMigrationCompleted');
    const migrationAbandoned = await esDB.get('config', 'contentVersionMigrationAbandoned');

    if (!migrationComplete && !migrationAbandoned) {
        await extractVersion();
    } else {
        await upgradeContent();
    }
};

expose(migrationTool);
