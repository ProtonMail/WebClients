import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import { STORAGE_PREFIX } from '@proton/shared/lib/authentication/persistedSessionStorage';

import { LAST_ACTIVE_PING } from '../store/_user/useActivePing';
import { sendErrorReport } from './errorHandling';
import { EnrichedError } from './errorHandling/EnrichedError';

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

export const getLastPersistedLocalID = (): number => {
    try {
        const storageKeys = Object.keys(localStorage);
        // Get localID from last active session
        // This support multi tabs and multi accounts
        const lastActiveUserId = getLastActiveUserId();
        if (lastActiveUserId) {
            for (const k of storageKeys) {
                if (k.startsWith(STORAGE_PREFIX)) {
                    const data = JSON.parse(localStorage[k]);
                    if (data.UserID === lastActiveUserId && data.UID) {
                        return Number(k.substring(STORAGE_PREFIX.length));
                    }
                }
            }
        }

        // Fallback: rely on last storage prefix
        // This does not support multi tabs
        let lastLocalID: { ID: number; persistedAt: number } | null = null;
        for (const k of storageKeys) {
            if (k.startsWith(STORAGE_PREFIX)) {
                const data = JSON.parse(localStorage[k]) as { persistedAt: number };
                if (lastLocalID === null || data.persistedAt > lastLocalID.persistedAt) {
                    lastLocalID = {
                        persistedAt: data.persistedAt,
                        ID: Number(k.substring(STORAGE_PREFIX.length)),
                    };
                }
            }
        }

        return lastLocalID?.ID || 0;
    } catch (e) {
        sendErrorReport(
            new EnrichedError('Failed to parse JSON from localStorage', {
                extra: {
                    e,
                },
            })
        );
        return 0;
    }
};

export const getLastActivePersistedUserSessionUID = (): string | null => {
    try {
        // Last Active Persisted Session in Drive apps
        const storageKeys = Object.keys(localStorage);
        const lastActiveUserId = getLastActiveUserId();
        if (lastActiveUserId) {
            for (const k of storageKeys) {
                if (k.startsWith(STORAGE_PREFIX)) {
                    const data = JSON.parse(localStorage[k]);
                    if (data.UserID === lastActiveUserId && data.UID) {
                        return data.UID;
                    }
                }
            }
        }

        // Last Active Persisted Session in any apps
        let persistedSession: PersistedSession | null = null;
        for (const k of storageKeys) {
            if (k.startsWith(STORAGE_PREFIX)) {
                const data = JSON.parse(localStorage[k]) as PersistedSession;
                if (persistedSession === null || data.persistedAt > persistedSession.persistedAt) {
                    persistedSession = data;
                }
            }
        }

        return persistedSession?.UID ?? null;
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
