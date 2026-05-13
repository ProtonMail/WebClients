import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { sessionLockAdapterFactory } from '@proton/pass/lib/auth/lock/session/adapter';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import * as authSession from '@proton/pass/lib/auth/session';
import { createAuthStore } from '@proton/pass/lib/auth/store';
import { createMemoryStore } from '@proton/pass/utils/store';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import * as lockRequests from './lock.requests';

jest.mock('./lock.requests');
jest.mock('@proton/pass/utils/time/epoch');
jest.mock('@proton/pass/lib/auth/session', () => ({
    ...jest.requireActual('@proton/pass/lib/auth/session'),
    decryptSessionBlob: jest.fn(),
    getPersistedSessionKey: jest.fn(),
}));

const unlockSessionMock = lockRequests.unlockSession as jest.Mock;
const checkSessionLockMock = lockRequests.checkSessionLock as jest.Mock;
const getEpochMock = getEpoch as jest.Mock;
const decryptSessionBlobMock = authSession.decryptSessionBlob as jest.Mock;
const getPersistedSessionKeyMock = authSession.getPersistedSessionKey as jest.Mock;

const TOKEN = 'session-lock-token';

const setupAdapter = () => {
    const api = { reset: jest.fn() };
    const authStore = createAuthStore(createMemoryStore());
    const onNotification = jest.fn();
    const getPersistedSession = jest.fn().mockResolvedValue({ blob: 'blob' });
    const persistSession = jest.fn().mockResolvedValue(undefined);
    const syncLock = jest.fn().mockResolvedValue(undefined);
    const onLockUpdate = jest.fn();
    const logout = jest.fn();
    const lock = jest.fn();

    const config = { api, authStore, onNotification, getPersistedSession };
    const auth = { persistSession, syncLock, onLockUpdate, lock, logout };

    return { adapter: sessionLockAdapterFactory({ ...auth, config } as any), api, authStore, config, auth };
};

describe('SessionLock adapter', () => {
    beforeEach(() => {
        getEpochMock.mockReturnValue(1000);
        getPersistedSessionKeyMock.mockResolvedValue('client-key');
        decryptSessionBlobMock.mockResolvedValue({ sessionLockToken: TOKEN });
    });

    afterEach(() => jest.clearAllMocks());

    describe('Factory', () => {
        test('should set correct lock mode type', () => {
            const { adapter } = setupAdapter();
            expect(adapter.type).toEqual(LockMode.SESSION);
        });
    });

    describe('SessionLockAdapter::check', () => {
        test('should bump `lockLastExtendTime` in-memory to current epoch', async () => {
            const { adapter, authStore } = setupAdapter();
            authStore.setLockMode(LockMode.SESSION);
            checkSessionLockMock.mockResolvedValue({ mode: LockMode.SESSION, locked: false, ttl: 60 });
            await adapter.check();
            expect(authStore.getLockLastExtendTime()).toEqual(1000);
        });

        test('should return non-locked fallback on connection issue', async () => {
            const { adapter, authStore } = setupAdapter();
            authStore.setLockMode(LockMode.SESSION);
            authStore.setLockTTL(120);
            const err: any = new Error('offline');
            err.name = 'OfflineError';
            checkSessionLockMock.mockRejectedValue(err);
            const result = await adapter.check();
            expect(result).toEqual({ mode: LockMode.SESSION, ttl: 120, locked: false });
        });

        test('should rethrow on non-connection errors', async () => {
            const { adapter, authStore } = setupAdapter();
            authStore.setLockMode(LockMode.SESSION);
            checkSessionLockMock.mockRejectedValue(new Error('boom'));
            await expect(adapter.check()).rejects.toThrow('boom');
        });

        test('should call `auth.lock(SESSION)` when mode switches to SESSION from another mode', async () => {
            const { adapter, authStore, auth } = setupAdapter();
            authStore.setLockMode(LockMode.NONE);
            checkSessionLockMock.mockResolvedValue({ mode: LockMode.SESSION, locked: false, ttl: 60 });
            await adapter.check();
            expect(auth.lock).toHaveBeenCalledWith(LockMode.SESSION, { broadcast: true, soft: true });
        });

        test('should clear lock token and extend time when mode changes to NONE', async () => {
            const { adapter, authStore, auth } = setupAdapter();
            authStore.setLockMode(LockMode.SESSION);
            authStore.setLockToken('token');
            authStore.setLockLastExtendTime(1000);
            checkSessionLockMock.mockResolvedValue({ mode: LockMode.NONE, locked: false, ttl: 0 });

            await adapter.check();
            expect(authStore.getLockToken()).toBeUndefined();
            expect(authStore.getLockLastExtendTime()).toBeUndefined();
            expect(authStore.getLockMode()).toEqual(LockMode.NONE);
            expect(auth.persistSession).toHaveBeenCalled();
        });
    });

    describe('SessionLockAdapter::unlock', () => {
        test('should set state and `persistSession` when mode changed', async () => {
            const { adapter, authStore, auth } = setupAdapter();
            unlockSessionMock.mockResolvedValue(TOKEN);
            jest.spyOn(authStore, 'validSession').mockReturnValue(true);
            authStore.setLockMode(LockMode.NONE);

            const token = await adapter.unlock('123456');

            expect(token).toEqual(TOKEN);
            expect(authStore.getLockToken()).toEqual(TOKEN);
            expect(authStore.getLockMode()).toEqual(LockMode.SESSION);
            expect(authStore.getLockLastExtendTime()).toEqual(1000);
            expect(auth.persistSession).toHaveBeenCalled();
            expect(auth.syncLock).not.toHaveBeenCalled();
        });

        test('should `syncLock` without full persist when already in SESSION mode with matching token', async () => {
            const { adapter, authStore, auth } = setupAdapter();
            unlockSessionMock.mockResolvedValue(TOKEN);
            jest.spyOn(authStore, 'validSession').mockReturnValue(true);
            authStore.setLockMode(LockMode.SESSION);
            authStore.setLockToken(TOKEN);

            const token = await adapter.unlock('123456');

            expect(token).toEqual(TOKEN);
            expect(auth.persistSession).not.toHaveBeenCalled();
            expect(auth.syncLock).toHaveBeenCalledWith({ unlockRetryCount: 0, lockLastExtendTime: 1000 });
        });

        test('should logout and throw when unlock token mismatches persisted token', async () => {
            const { adapter, authStore, auth } = setupAdapter();
            unlockSessionMock.mockResolvedValue('mismatching-token');
            authStore.setLockMode(LockMode.SESSION);

            await expect(adapter.unlock('123456')).rejects.toThrow('Invalid session unlock response');
            expect(auth.logout).toHaveBeenCalledWith({ soft: false, broadcast: true });
        });

        test('should notify and reset lock state when API returns 400 + SESSION_LOCKED', async () => {
            const { adapter, authStore, config } = setupAdapter();
            const apiError: any = new Error('lock removed');
            apiError.status = 400;
            apiError.data = { Error: 'lock removed', Code: PassErrorCode.SESSION_LOCKED };
            unlockSessionMock.mockRejectedValue(apiError);

            /* Short-circuit `getPersistedToken` so we don't reach the trailing logic */
            config.getPersistedSession.mockResolvedValue(undefined);
            authStore.setLocked(true);
            authStore.setLockLastExtendTime(500);
            authStore.setLockMode(LockMode.SESSION);
            authStore.setLockTTL(60);

            await expect(adapter.unlock('123456')).rejects.toThrow();
            expect(authStore.getLocked()).toBe(false);
            expect(authStore.getLockLastExtendTime()).toBeUndefined();
            expect(authStore.getLockMode()).toEqual(LockMode.NONE);
            expect(authStore.getLockTTL()).toBeUndefined();
        });
    });
});
