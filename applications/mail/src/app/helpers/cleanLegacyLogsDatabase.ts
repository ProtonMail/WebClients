import { deleteDB } from 'idb';

import { LEGACY_LOGGER_DB_PREFIX } from '@proton/logger/constants';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

const isLegacy = (name: string): boolean => {
    return name.startsWith(LEGACY_LOGGER_DB_PREFIX);
};

/**
 * Remove the trace of the old alpha logger IndexedDB databases.
 */
export const cleanLegacyLogsDatabase = async (): Promise<void> => {
    if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
        return;
    }

    try {
        const databases = await indexedDB.databases();
        const legacy = databases
            .map(({ name }) => name)
            .filter((name): name is string => {
                return name !== undefined && isLegacy(name);
            });

        await Promise.all(legacy.map((name) => deleteDB(name)));
    } catch (e) {
        traceInitiativeError(SentryMailInitiatives.LOGGER, e);
        console.error(e);
    }
};
