import { EnrichedError, sendErrorReport } from '@proton/drive/legacy/errorHandling';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';

import { LAST_ACTIVE_PING } from '../legacy/store/_user/useActivePing';

const getLastActiveUserId = () => {
    const storageKeys = Object.keys(localStorage);
    let lastActiveUserId = '';
    let lastAccess = 0;

    for (const k of storageKeys) {
        if (k.startsWith(LAST_ACTIVE_PING)) {
            const data = JSON.parse(localStorage[k]);
            const lastPing = Number(data.value);
            if (lastAccess < lastPing) {
                lastAccess = lastPing;
                lastActiveUserId = k.substring(k.indexOf(LAST_ACTIVE_PING) + LAST_ACTIVE_PING.length + 1);
            }
        }
    }
    return lastActiveUserId || null;
};

export const getLastActivePersistedUserSession = () => {
    try {
        // Last Active Persisted Session in any apps
        let persistedSession: PersistedSession | null = null;
        const lastActiveUserId = getLastActiveUserId();
        const persistedSessions = getPersistedSessions();
        const lastPersitedSessionFromPing = persistedSessions.find(
            (persistedSession) => persistedSession.UserID === lastActiveUserId
        );
        if (lastPersitedSessionFromPing) {
            return lastPersitedSessionFromPing;
        }
        for (const data of getPersistedSessions()) {
            if (persistedSession === null || data.persistedAt > persistedSession.persistedAt) {
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
