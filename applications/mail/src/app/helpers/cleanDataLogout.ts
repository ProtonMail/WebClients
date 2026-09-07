import { logger } from '@proton/logger';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';

import { getExistingIndexService } from '../contentSearch/indexation/IndexService';

/**
 * Clears persisted application data, used when the user logs out.
 * The encrypted search database is not deleted to avoid re-indexing the whole mailbox
 */
export const cleanDataLogout = async (persistedSession: PersistedSession) => {
    const indexService = getExistingIndexService(persistedSession.UserID);

    await Promise.allSettled([
        // Logger removal
        logger.isInitialized() ? logger.clearLogs() : undefined,
        // Content search database removal
        indexService ? indexService.deleteIndex() : undefined,
    ]);
};
