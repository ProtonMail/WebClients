import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB';
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
    return !isAllMigrated;
};
