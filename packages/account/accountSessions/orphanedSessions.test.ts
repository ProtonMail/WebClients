import type { DefaultPersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import type { LocalSessionResponse } from '@proton/shared/lib/authentication/interface';
import { SessionAccessTypeFlag, selfAccessTypeMask } from '@proton/shared/lib/authentication/sessionAccessType';

import {
    cleanupOrphanedDuplicateSessions,
    getOrphanedDuplicateSessions,
    getRevokedSessionUIDs,
} from './orphanedSessions';

const getPersisted = (
    value: Partial<DefaultPersistedSession> & Pick<DefaultPersistedSession, 'localID'>
): DefaultPersistedSession => ({
    UserID: 'user-1',
    UID: `uid-${value.localID}`,
    accessTypeMask: selfAccessTypeMask,
    source: SessionSource.Proton,
    persistent: true,
    trusted: false,
    payloadVersion: 2,
    payloadType: 'default',
    persistedAt: 0,
    ...value,
});

// `AccessType` is a bitmask here, so 0 is a plain self session
const getRemote = (value: Partial<LocalSessionResponse> & Pick<LocalSessionResponse, 'LocalID'>) => ({
    UID: `uid-${value.LocalID}`,
    DisplayName: 'display-name',
    UserID: 'user-1',
    AccessType: 0,
    ...value,
});

describe('getOrphanedDuplicateSessions', () => {
    it('returns a remote session with no persisted session when the same user is persisted elsewhere', () => {
        const orphan = getRemote({ LocalID: 1 });

        expect(
            getOrphanedDuplicateSessions({
                remoteSessions: [orphan, getRemote({ LocalID: 3 })],
                persistedSessions: [getPersisted({ localID: 3 })],
            })
        ).toEqual([orphan]);
    });

    it('ignores remote sessions that are persisted', () => {
        expect(
            getOrphanedDuplicateSessions({
                remoteSessions: [getRemote({ LocalID: 1 }), getRemote({ LocalID: 3 })],
                persistedSessions: [getPersisted({ localID: 1 }), getPersisted({ localID: 3 })],
            })
        ).toEqual([]);
    });

    it('ignores an orphan whose user is not persisted at all', () => {
        expect(
            getOrphanedDuplicateSessions({
                remoteSessions: [getRemote({ LocalID: 1, UserID: 'user-1' })],
                persistedSessions: [getPersisted({ localID: 3, UserID: 'user-2', UID: 'uid-3' })],
            })
        ).toEqual([]);
    });

    it('ignores an orphan whose duplicate is persisted with another access type', () => {
        expect(
            getOrphanedDuplicateSessions({
                remoteSessions: [getRemote({ LocalID: 1, AccessType: SessionAccessTypeFlag.AdminAccess })],
                persistedSessions: [getPersisted({ localID: 3, accessTypeMask: selfAccessTypeMask })],
            })
        ).toEqual([]);
    });

    it('matches an orphan whose twin in the response has an identical access type', () => {
        const orphan = getRemote({ LocalID: 1, AccessType: SessionAccessTypeFlag.OrgAccess });
        const twin = getRemote({ LocalID: 3, AccessType: SessionAccessTypeFlag.OrgAccess });

        expect(
            getOrphanedDuplicateSessions({
                remoteSessions: [orphan, twin],
                persistedSessions: [getPersisted({ localID: 3 })],
            })
        ).toEqual([orphan]);
    });

    it('ignores a remote session whose UID is persisted under another local id', () => {
        // The UID identifies the session; the local id is only the slot it was stored under
        const drifted = getRemote({ LocalID: 1 });
        const twin = getRemote({ LocalID: 3 });

        expect(
            getOrphanedDuplicateSessions({
                remoteSessions: [drifted, twin],
                persistedSessions: [
                    getPersisted({ localID: 5, UID: drifted.UID }),
                    getPersisted({ localID: 3, UID: twin.UID }),
                ],
            })
        ).toEqual([]);
    });

    it('ignores an orphan whose only twin is persisted but absent from the response', () => {
        const orphan = getRemote({ LocalID: 1, AccessType: SessionAccessTypeFlag.OrgAccess });

        expect(
            getOrphanedDuplicateSessions({
                remoteSessions: [orphan],
                persistedSessions: [getPersisted({ localID: 3 })],
            })
        ).toEqual([]);
    });

    it('does not match a twin that merely collapses to the same access type', () => {
        const combined = SessionAccessTypeFlag.AdminAccess | SessionAccessTypeFlag.DelegatedAccess;
        const orphan = getRemote({ LocalID: 1, AccessType: combined });
        const persistedSessions = [getPersisted({ localID: 3 })];

        // Both collapse to AdminAccess, but the orphan is delegated access as well, so revoking it
        // on the strength of the admin-access session alone would be revoking something else
        expect(
            getOrphanedDuplicateSessions({
                remoteSessions: [orphan, getRemote({ LocalID: 3, AccessType: SessionAccessTypeFlag.AdminAccess })],
                persistedSessions,
            })
        ).toEqual([]);
        expect(
            getOrphanedDuplicateSessions({
                remoteSessions: [orphan, getRemote({ LocalID: 3, AccessType: combined })],
                persistedSessions,
            })
        ).toEqual([orphan]);
    });
});

describe('cleanupOrphanedDuplicateSessions', () => {
    const remoteSessions = [getRemote({ LocalID: 1 }), getRemote({ LocalID: 3 })];
    const persistedSessions = [getPersisted({ localID: 3 })];

    beforeEach(() => {
        window.localStorage.clear();
    });

    const run = (api: jest.Mock) =>
        cleanupOrphanedDuplicateSessions({ api, remoteSessions, persistedSessions, delay: 0 });

    it('revokes the orphan with its own UID and records it as done', async () => {
        const api = jest.fn().mockResolvedValue({ Code: 1000 });

        await run(api);

        expect(api).toHaveBeenCalledTimes(1);
        const [config] = api.mock.calls[0];
        expect(config.method).toBe('delete');
        expect(config.headers['x-pm-uid']).toBe('uid-1');
        expect(getRevokedSessionUIDs()).toEqual(['uid-1']);
    });

    it.each([400, 401, 422])('records the orphan as done on %i', async (status) => {
        const api = jest.fn().mockRejectedValue({ status });

        await run(api);

        expect(getRevokedSessionUIDs()).toEqual(['uid-1']);
    });

    it.each([500, undefined])('leaves the orphan to be retried on %s', async (status) => {
        const api = jest.fn().mockRejectedValue({ status });

        await run(api);

        expect(getRevokedSessionUIDs()).toEqual([]);
    });

    it('does not attempt an orphan that has already been recorded', async () => {
        const api = jest.fn().mockResolvedValue({ Code: 1000 });

        await run(api);
        await run(api);

        expect(api).toHaveBeenCalledTimes(1);
    });

    it('does not wait after the last orphan', async () => {
        const api = jest.fn().mockResolvedValue({ Code: 1000 });

        // A trailing wait would leave this pending for the full delay and time the test out
        await expect(
            cleanupOrphanedDuplicateSessions({ api, remoteSessions, persistedSessions, delay: 60_000 })
        ).resolves.toEqual({ revoked: 1, failed: 0 });
    });

    it('does nothing when there is nothing to do', async () => {
        const api = jest.fn();

        await expect(
            cleanupOrphanedDuplicateSessions({ api, remoteSessions: [], persistedSessions: [], delay: 0 })
        ).resolves.toEqual({ revoked: 0, failed: 0 });
        expect(api).not.toHaveBeenCalled();
    });
});
