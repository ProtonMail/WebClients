import type { PersistedSessionWithLocalID } from '@proton/shared/lib/authentication/SessionInterface';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';

import { sendErrorReport } from './errorHandling';
import { EnrichedError } from './errorHandling/EnrichedError';

export const getLastActivePersistedUserSession = () => {
    try {
        // Last Active Persisted Session in any apps
        let persistedSession: PersistedSessionWithLocalID | null = null;
        for (const data of getPersistedSessions()) {
            if (
                persistedSession === null ||
                !persistedSession.persistent ||
                data.persistedAt > persistedSession.persistedAt
            ) {
                persistedSession = data;
            }
        }
        return persistedSession;
    } catch (e) {
        sendErrorReport(
            new EnrichedError('Failed to parse JSON from localStorage', {
                extra: {
                    e,
                },
            })
        );
        return null;
    }
};
