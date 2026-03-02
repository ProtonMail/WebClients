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

    const extractVersion = async () => {
        const didReachMaxRetries = await contentVersionExtractor.didReachMaxRetries();
        if (didReachMaxRetries) {
            await contentVersionExtractor.markMigrationAbandoned();
            return;
        }

        const isComplete = await contentVersionExtractor.validateAllContentMigrated();
        if (isComplete) {
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
