import type { OpenDBCallbacks } from 'idb';

import type { EncryptedSearchDB } from '../models';

type UpgradeCallback = NonNullable<OpenDBCallbacks<EncryptedSearchDB>['upgrade']>;

export const upgrade: UpgradeCallback = async (database, oldVersion: number, newVersion: number, transaction) => {
    const shouldRunMigration = (versionNumber: number) => oldVersion < versionNumber && newVersion >= versionNumber;

    // Store creation is not gated behind shouldRunMigration.
    // This gives us the opportunity to repair the schema regardless of the recorded version
    // every time we run an upgrade transaction.
    if (!database.objectStoreNames.contains('content')) {
        database.createObjectStore('content');
    }

    if (!database.objectStoreNames.contains('metadata')) {
        const metadata = database.createObjectStore('metadata');
        metadata.createIndex('temporal', 'timepoint', { unique: true, multiEntry: false });
    }

    if (!database.objectStoreNames.contains('config')) {
        database.createObjectStore('config');
    }

    if (!database.objectStoreNames.contains('events')) {
        database.createObjectStore('events');
    }

    if (!database.objectStoreNames.contains('indexingProgress')) {
        database.createObjectStore('indexingProgress');
    }

    if (shouldRunMigration(4)) {
        // The content store may have just been (re)created above rather than in a prior version-3
        // upgrade, so its indexes can't be assumed to exist either.
        const contentStore = transaction.objectStore('content');
        if (!contentStore.indexNames.contains('byVersion')) {
            contentStore.createIndex('byVersion', 'version');
        }

        // Set default version -1 for all existing content without version, this is helping index queries
        let cursor = await contentStore.openCursor();
        while (cursor) {
            const value = cursor.value;
            if (value.version === undefined) {
                value.version = -1;
                void cursor.update(value);
            }
            cursor = await cursor.continue();
        }
    }
};
