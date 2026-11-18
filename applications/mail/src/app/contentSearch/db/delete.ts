import { deleteDB } from 'idb';

import { esSentryReport } from '@proton/encrypted-search/esHelpers/esReporting';
import { SentryCommonInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { getDBName } from './schema';

/**
 * Resolves once the database is deleted. A delete waits for every open connection to close; connections
 * opened through `openContentSearchDB` close themselves when asked, so being blocked means another one
 * didn't, e.g. a tab still running an older build. It's reported, and the delete goes through once that
 * connection closes. Waiting is no slower than not waiting, as any later open of the database waits too.
 * Rejects when the delete fails, after reporting it: the database is still there, so callers must not go on
 * as if it were gone.
 */
export async function deleteContentSearchDB(userId: string) {
    const dbName = getDBName(userId);
    try {
        await deleteDB(dbName, {
            blocked: () => {
                esSentryReport('deleteContentSearchDB: waiting for another open connection to close', { dbName });
            },
        });
    } catch (e) {
        traceInitiativeError(SentryCommonInitiatives.ENCRYPTED_SEARCH, e);
        throw e;
    }
}
