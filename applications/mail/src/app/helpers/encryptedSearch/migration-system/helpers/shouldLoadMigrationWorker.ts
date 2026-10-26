import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB/indexedDB';
import { detectStorageCapabilities } from '@proton/shared/lib/helpers/browser';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { isAllContentUpToDate } from './contentVersionHelpers';

export const shouldLoadMigrationWorker = async (user: UserModel) => {
    const databaseExist = await hasESDB(user.ID);
    if (!databaseExist) {
        return false;
    }

    const esDB = await openESDB(user.ID);
    if (!esDB) {
        return false;
    }

    let isAllMigrated = false;
    try {
        isAllMigrated = await isAllContentUpToDate(esDB);
    } finally {
        esDB.close();
    }

    return !isAllMigrated;
};

export const canLoadRunner = async () => {
    if (typeof Worker === 'undefined') {
        traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, new Error('Worker is not available'));
        return false;
    }

    const { hasIndexedDB, isAccessible } = await detectStorageCapabilities();

    // Expected in browsers without IndexedDB support or with storage restrictions
    // For example WebKit with "Block All Cookies", Lockdown Mode or private mode
    if (!hasIndexedDB || !isAccessible) {
        return false;
    }

    return true;
};
