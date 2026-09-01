import { deleteESDB } from '@proton/encrypted-search/esIDB';
import { logger } from '@proton/logger';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';

import { deleteContentSearchDB } from '../contentSearch/db/delete';

/**
 * Clears presisted application data, used when the user logs out.
 */
export const cleanDataLogout = async (persistedSession: PersistedSession) => {
    // Logger removal
    if (logger.isInitialized()) {
        void logger.clearLogs();
    }

    // Content search dabase removal
    void deleteContentSearchDB(persistedSession.UserID);

    // Encrypted search database removal
    void deleteESDB(persistedSession.UserID);
};
