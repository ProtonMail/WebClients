import { deleteAssistantCachedFiles } from '@proton/llm/lib/downloader';
import { logger } from '@proton/logger';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';

import { getExistingIndexService } from '../contentSearch/indexation/IndexService';

export interface CleanDataOptions {
    logs?: boolean;
    /** v2 content search index */
    contentSearch?: boolean;
    assistantFiles?: boolean;
    /**
     * Full v1 encrypted search teardown: aborts indexing and searching, resets cache and status,
     * deletes the database. Pass `esDelete` from `useEncryptedSearchContext` (see `useCleanData`).
     * Dropping the database on its own would leave running jobs, cache and status out of sync,
     * so this is a callback rather than a boolean: you cannot ask for the wipe without the teardown.
     */
    esDelete?: () => Promise<void>;
}

/**
 * Deletes the persisted data the options ask for.
 * Each cleanup runs independently: one failing does not stop the others.
 */
export const cleanData = async (userID: string, options: CleanDataOptions) => {
    const cleanups = [];

    if (options.logs && logger.isInitialized()) {
        cleanups.push(logger.clearLogs());
    }
    if (options.contentSearch) {
        cleanups.push(getExistingIndexService(userID)?.deleteIndex());
    }
    if (options.esDelete) {
        cleanups.push(options.esDelete());
    }
    if (options.assistantFiles) {
        cleanups.push(deleteAssistantCachedFiles());
    }

    await Promise.allSettled(cleanups);
};

/**
 * Clears persisted application data, used when the user logs out.
 * The encrypted search database is kept to avoid re-indexing the whole mailbox.
 */
export const cleanDataLogout = async (persistedSession: PersistedSession) => {
    await cleanData(persistedSession.UserID, { logs: true, contentSearch: true });
};
