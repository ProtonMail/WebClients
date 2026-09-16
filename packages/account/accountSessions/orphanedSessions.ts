import { revoke } from '@proton/shared/lib/api/auth';
import { getSilentApi, getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import type { LocalSessionResponse } from '@proton/shared/lib/authentication/interface';
import { getPersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import type { Api } from '@proton/shared/lib/interfaces';

const storageKey = 'revoked-sessions';

const maxStoredUIDs = 20;

export const getRevokedSessionUIDs = (): string[] => {
    try {
        const parsedValue = JSON.parse(getItem(storageKey) || '');
        if (!Array.isArray(parsedValue)) {
            return [];
        }
        return parsedValue.filter((value): value is string => typeof value === 'string');
    } catch (e: any) {
        return [];
    }
};

const addRevokedSessionUID = (UID: string) => {
    const UIDs = getRevokedSessionUIDs().filter((value) => value !== UID);
    setItem(storageKey, JSON.stringify([...UIDs, UID].slice(-maxStoredUIDs)));
};

/**
 * `auth/v4/sessions/local` can list sessions this client has no `ps-` entry for, when the session
 * cookie outlived the persisted session. Signing in again leaves the first one behind: unreachable
 * here, still alive on the server.
 *
 * A duplicate is two sessions in the response for the same user and access type. Only the one this
 * client no longer holds is returned, and only if its twin is persisted - otherwise this would sign
 * out the user's only session.
 *
 * Holding it is decided on the UID as well as the local id, since the UID is what identifies a
 * session and the local id is only the slot it was stored under. If the two ever drift apart, a
 * session the user is signed into would otherwise look unpersisted here and be revoked.
 */
export const getOrphanedDuplicateSessions = ({
    remoteSessions,
    persistedSessions,
}: {
    remoteSessions: LocalSessionResponse[];
    persistedSessions: PersistedSession[];
}) => {
    const persistedLocalIDs = new Set(persistedSessions.map(({ localID }) => localID));
    const persistedUIDs = new Set(persistedSessions.map(({ UID }) => UID));

    const isPersisted = (session: LocalSessionResponse) => {
        return persistedLocalIDs.has(session.LocalID) || persistedUIDs.has(session.UID);
    };

    const isDuplicateOf = (a: LocalSessionResponse, b: LocalSessionResponse) => {
        return a.LocalID !== b.LocalID && a.UserID === b.UserID && a.AccessType === b.AccessType;
    };

    return remoteSessions.filter((remoteSession) => {
        if (isPersisted(remoteSession)) {
            return false;
        }
        return remoteSessions.some((other) => isDuplicateOf(remoteSession, other) && isPersisted(other));
    });
};

// The API will never accept the revocation. Anything else (offline, 5xx) is retried on a later run.
const permanentRevokeFailureStatuses = [400, 401, 422];

const revokeOrphanedSession = async ({ api, UID }: { api: Api; UID: string }) => {
    try {
        await getSilentApi(getUIDApi(UID, api))(revoke());
        return true;
    } catch (e: any) {
        return permanentRevokeFailureStatuses.includes(e?.status);
    }
};

/**
 * Revokes each session from {@link getOrphanedDuplicateSessions}, recording the UIDs the API
 * answered definitively so they aren't attempted again on every boot.
 */
export const cleanupOrphanedDuplicateSessions = async ({
    api,
    remoteSessions,
    persistedSessions,
    delay = 2_000,
}: {
    api: Api;
    remoteSessions: LocalSessionResponse[];
    persistedSessions: PersistedSession[];
    delay?: number;
}) => {
    const revokedUIDs = new Set(getRevokedSessionUIDs());

    const orphanedSessions = getOrphanedDuplicateSessions({ remoteSessions, persistedSessions }).filter(
        ({ UID }) => !revokedUIDs.has(UID)
    );

    let revoked = 0;
    let failed = 0;

    for (const orphanedSession of orphanedSessions) {
        // Another tab may have signed in at that local id while this was waiting
        if (getPersistedSession(orphanedSession.LocalID)) {
            continue;
        }
        // Spaces out the API calls, without leaving a timer pending after the last one
        if (revoked || failed) {
            await wait(delay);
        }
        if (await revokeOrphanedSession({ api, UID: orphanedSession.UID })) {
            addRevokedSessionUID(orphanedSession.UID);
            revoked++;
        } else {
            failed++;
        }
    }

    /**
     * Only a run that revoked something reports. A failure isn't recorded, so reporting those too
     * would repeat on every boot for as long as the API keeps refusing one; a success is recorded,
     * which bounds this to once per orphan.
     */
    if (revoked > 0) {
        captureMessage('Revoked orphaned duplicate sessions', { level: 'info', extra: { revoked, failed } });
    }

    return { revoked, failed };
};
