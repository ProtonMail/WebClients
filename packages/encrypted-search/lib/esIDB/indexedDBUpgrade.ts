import type { OpenDBCallbacks } from 'idb';

import type { EncryptedSearchDB } from '../models';

type UpgradeCallback = NonNullable<OpenDBCallbacks<EncryptedSearchDB>['upgrade']>;

export const upgrade: UpgradeCallback = async (database, oldVersion: number, newVersion: number, transaction) => {
    const shouldRunMigration = (versionNumber: number) => oldVersion < versionNumber && newVersion >= versionNumber;

    // Database created before version 3 wasn't consistently opened with an upgrade callback.
    // Resulting in potentially non-complete schema.
    if (shouldRunMigration(3)) {
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
    }

    if (shouldRunMigration(4)) {
        // We know the content store exists, it was created in version 3
        const contentStore = transaction.objectStore('content');
        // TODO check the default values of the options and remove if they match
        contentStore.createIndex('version', 'version', { unique: false, multiEntry: false });

        // Set default version -1 for all existing content without version, this is helping index queries
        const cursor = await contentStore.openCursor();
        while (cursor) {
            const value = cursor.value;
            if (value.version === undefined) {
                value.version = -1;
                await cursor.update(value);
            }
            await cursor.continue();
        }
    }
};
