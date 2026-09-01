import { deleteESDB } from '@proton/encrypted-search/esIDB';
import { logger } from '@proton/logger';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';

import { deleteContentSearchDB } from '../contentSearch/db/delete';

/**
 * Clears persisted application data, used when the user logs out.
 */
export const cleanDataLogout = async (persistedSession: PersistedSession) => {
    await Promise.allSettled([
        // Logger removal
        logger.isInitialized() ? logger.clearLogs() : undefined,
        // Content search database removal
        deleteContentSearchDB(persistedSession.UserID),
        // Encrypted search database removal
        deleteESDB(persistedSession.UserID),
    ]);
};
