import type { AuthStore } from '@proton/pass/lib/auth/store';
import { createAuthStore } from '@proton/pass/lib/auth/store';
import type { Api } from '@proton/pass/types';
import { createMemoryStore } from '@proton/pass/utils/store';

import type { Lock } from './lock/types';
import { LockMode } from './lock/types';
import type { AuthService } from './service';
import { createAuthService } from './service';

describe('Core AuthService', () => {
    let api: Api;
    let authStore: AuthStore;
    let auth: AuthService;
    let onSessionPersist: jest.Mock;
    let getPersistedSession: jest.Mock;
    let getMemorySession: jest.Mock;
    let onResumeStart: jest.Mock;
    let onLockUpdate: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        api = jest.fn() as unknown as Api;
        api.subscribe = jest.fn();
        authStore = createAuthStore(createMemoryStore());

        onSessionPersist = jest.fn().mockResolvedValue(undefined);
        getPersistedSession = jest.fn().mockResolvedValue(null);
        getMemorySession = jest.fn().mockResolvedValue({});
        onResumeStart = jest.fn().mockResolvedValue(true);
        onLockUpdate = jest.fn().mockResolvedValue(undefined);

        auth = createAuthService({
            api,
            authStore,
            onInit: jest.fn(),
            getPersistedSession,
            getMemorySession,
            onSessionPersist,
            onResumeStart,
            onLockUpdate,
            onSessionFailure: jest.fn(),
        });
    });

    describe('AuthService::resumeSession', () => {
        test('should halt resume when `onResumeStart` returns `false`', async () => {
            onResumeStart.mockResolvedValueOnce(false);
            const result = await auth.resumeSession(0, {});

            expect(result).toBe(false);
            expect(onResumeStart).toHaveBeenCalledWith({ hasSession: false, memorySession: {} });
        });

        test('should proceed when `onResumeStart` returns `true`', async () => {
            getMemorySession.mockResolvedValueOnce({ LocalID: 0 });
            jest.spyOn(auth, 'login').mockResolvedValueOnce(true);
            jest.spyOn(authStore, 'validSession').mockReturnValueOnce(true);
            const result = await auth.resumeSession(0, {});

            expect(result).toBe(true);
            expect(onResumeStart).toHaveBeenCalledWith({ hasSession: true, memorySession: { LocalID: 0 } });
        });
    });

    describe('AuthService::syncPersistedSession', () => {
        test('should no-op when there is no persisted session', async () => {
            await auth.syncPersistedSession(0, { lockLastExtendTime: 1234 });
            expect(onSessionPersist).not.toHaveBeenCalled();
        });

        test('should merge update onto persisted session and trigger `onSessionPersist`', async () => {
            getPersistedSession.mockResolvedValue({ blob: 'encrypted-blob', lockTTL: 600, lockLastExtendTime: 1000 });
            await auth.syncPersistedSession(0, { lockLastExtendTime: 2000 });
            expect(onSessionPersist).toHaveBeenCalledTimes(1);
            const [serialized] = onSessionPersist.mock.calls[0];
            expect(JSON.parse(serialized)).toEqual({ blob: 'encrypted-blob', lockTTL: 600, lockLastExtendTime: 2000 });
        });

        test('should preserve the encrypted blob (no re-encryption)', async () => {
            const blob = 'untouched-encrypted-blob';
            getPersistedSession.mockResolvedValue({ blob, lockTTL: 600 });
            await auth.syncPersistedSession(0, { unlockRetryCount: 3 });
            const [serialized] = onSessionPersist.mock.calls[0];
            expect(JSON.parse(serialized).blob).toBe(blob);
        });
    });

    describe('AuthService::checkLock', () => {
        let adapterCheck: jest.Mock;

        const registerFakeAdapter = (mode: LockMode) => {
            adapterCheck = jest.fn();
            auth.registerLockAdapter({
                type: mode,
                check: adapterCheck,
                create: jest.fn(),
                delete: jest.fn(),
                lock: jest.fn(),
                unlock: jest.fn(),
            });
        };

        beforeEach(() => {
            getPersistedSession.mockResolvedValue({ blob: 'b', lockTTL: 600 });
            authStore.setLockMode(LockMode.SESSION);
            authStore.setLockTTL(600);
            authStore.setLocalID(0);
        });

        test('should sync `lockLastExtendTime` to persisted session after a successful adapter check', async () => {
            registerFakeAdapter(LockMode.SESSION);
            const lock: Lock = { mode: LockMode.SESSION, locked: false, ttl: 600 };

            adapterCheck.mockImplementation(async () => {
                authStore.setLockLastExtendTime(9999);
                return lock;
            });

            await auth.checkLock();
            expect(onSessionPersist).toHaveBeenCalledTimes(1);
            const [serialized] = onSessionPersist.mock.calls[0];
            expect(JSON.parse(serialized).lockLastExtendTime).toBe(9999);
            expect(onLockUpdate).toHaveBeenCalledWith(lock, 0, false);
        });

        test('should short-circuit on `LockMode.NONE` without persisting', async () => {
            authStore.setLockMode(LockMode.NONE);
            const result = await auth.checkLock();
            expect(result).toEqual({ mode: LockMode.NONE, locked: false });
            expect(onSessionPersist).not.toHaveBeenCalled();
            expect(onLockUpdate).not.toHaveBeenCalled();
        });
    });
});
