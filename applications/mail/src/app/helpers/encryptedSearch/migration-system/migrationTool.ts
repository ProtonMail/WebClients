import { expose } from 'comlink';

import { getIndexKey } from '@proton/encrypted-search/esHelpers';
import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';

import { ContentVersionExtractor } from './ContentVersionExtractor';
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

    const contentVersionExtractor = new ContentVersionExtractor(user.ID, esDB, indexKey);

    // Range query with the index
    // From value undefined to value 2 (version before current version)
    // Will let me know if I need to do something or not (the array is empty)
    // This could be done in the main thread, no crypto needed it's only IDB calls
    //
    // If crypto error, reindex the item or move them to latest version.
    // When re-indexing is available, go over the items and re-index them.
    // Make it clear in the code that this is precoucious more than experience.
    //
    // Check if any work needs key cursor on version index, check if anything is not currentVersion.
    // Get items with specific version use the value cursor, iterate over them and re-index.

    const extractVersion = async () => {
        const didReachMaxRetries = await contentVersionExtractor.didReachMaxRetries();
        if (didReachMaxRetries) {
            await contentVersionExtractor.markMigrationAbandoned();
            return;
        }

        const isComplete = await contentVersionExtractor.validateAllContentMigrated();
        if (isComplete) {
            await contentVersionExtractor.markMigrationCompleted();
            return;
        }

        const checkpoint = await contentVersionExtractor.getLatestCheckpoint();
        await contentVersionExtractor.runMigrationPass(checkpoint);
        const isCompleteAfterExtract = await contentVersionExtractor.validateAllContentMigrated();
        if (!isCompleteAfterExtract) {
            await contentVersionExtractor.incrementRetryCount();
            await extractVersion();

            traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, "Migration didn't extract all versions");
            return;
        }
    };

    const upgradeContent = async () => {};

    const migrationComplete = await esDB.get('config', 'contentVersionMigrationCompleted');
    const migrationAbandoned = await esDB.get('config', 'contentVersionMigrationAbandoned');

    if (!migrationComplete && !migrationAbandoned) {
        await extractVersion();
    } else {
        await upgradeContent();
    }
};

expose({ migration } satisfies MigrationToolAPI);
