import type { OpenDBCallbacks } from 'idb';

import type { EncryptedSearchDB } from '../models';

type UpgradeCallback = NonNullable<OpenDBCallbacks<EncryptedSearchDB>['upgrade']>;

export const upgrade: UpgradeCallback = (database, oldVersion: number, _newVersion: number, transaction) => {
    // Database created before version 3 wasn't consistently opened with an upgrade callback.
    // Resulting in potentially non-complete schema.
    if (oldVersion < 3) {
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

    if (oldVersion < 4) {
        // We know the content store exists, it was created in version 3
        const contentStore = transaction.objectStore('content');
        contentStore.createIndex('version', 'version', { unique: false, multiEntry: false });
    }
};
