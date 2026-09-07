import { deleteDB } from 'idb';

import { esSentryReport } from '@proton/encrypted-search/esHelpers';
import { SentryCommonInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { getDBName } from './schema';

const DB_BLOCKED_TIMEOUT = 5_000;

export async function deleteContentSearchDB(userId: string) {
    const dbName = getDBName(userId);
    let wasBlocked = false;

    const deletion = deleteDB(dbName, {
        blocked: () => {
            wasBlocked = true;
            esSentryReport('deleteContentSearchDB: blocked by another open connection', { dbName });
        },
    }).catch((e) => traceInitiativeError(SentryCommonInitiatives.ENCRYPTED_SEARCH, e));

    const timeout = new Promise<void>((resolve) => setTimeout(resolve, DB_BLOCKED_TIMEOUT));

    await Promise.race([deletion, timeout]);

    if (wasBlocked) {
        esSentryReport('deleteContentSearchDB: gave up waiting for blocked delete to complete', { dbName });
    }
}
