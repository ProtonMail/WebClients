import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { UserModel } from '@proton/shared/lib/interfaces';

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

    const isAllMigrated = await isAllContentUpToDate(esDB);
    esDB.close();

    return !isAllMigrated;
};

export const canLoadRunner = () => {
    if (typeof Worker === 'undefined') {
        traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, new Error('Worker is not available'));
        return false;
    }

    if (typeof indexedDB === 'undefined') {
        traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, new Error('IndexedDB is not available'));
        return false;
    }

    return true;
};
