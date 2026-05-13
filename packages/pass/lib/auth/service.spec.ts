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
        api.setResumeLock = jest.fn();
        api.reset = jest.fn().mockResolvedValue(undefined);
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

    describe('AuthService::syncLock', () => {
        const baseline = { blob: 'encrypted-blob', lockTTL: 600, unlockRetryCount: 0, lockLastExtendTime: 1000 };

        beforeEach(() => {
            getPersistedSession.mockResolvedValue({ ...baseline });
            authStore.setLocalID(42);
        });

        test('writes `unlockRetryCount` to store and persists merged payload', async () => {
            await auth.syncLock({ unlockRetryCount: 3 });

            expect(authStore.getUnlockRetryCount()).toBe(3);
            expect(getPersistedSession).toHaveBeenCalledWith(42);
            expect(onSessionPersist).toHaveBeenCalledTimes(1);
            expect(onSessionPersist).toHaveBeenCalledWith(JSON.stringify({ ...baseline, unlockRetryCount: 3 }));
        });

        test('writes `lockLastExtendTime` to store and persists merged payload', async () => {
            await auth.syncLock({ lockLastExtendTime: 9999 });

            expect(authStore.getLockLastExtendTime()).toBe(9999);
            expect(getPersistedSession).toHaveBeenCalledWith(42);
            expect(onSessionPersist).toHaveBeenCalledTimes(1);
            expect(onSessionPersist).toHaveBeenCalledWith(JSON.stringify({ ...baseline, lockLastExtendTime: 9999 }));
        });

        test('writes both fields in a single combined persist call', async () => {
            await auth.syncLock({ unlockRetryCount: 0, lockLastExtendTime: 5000 });

            expect(authStore.getUnlockRetryCount()).toBe(0);
            expect(authStore.getLockLastExtendTime()).toBe(5000);
            expect(onSessionPersist).toHaveBeenCalledTimes(1);
            expect(onSessionPersist).toHaveBeenCalledWith(
                JSON.stringify({ ...baseline, unlockRetryCount: 0, lockLastExtendTime: 5000 })
            );
        });

        test('clears `lockLastExtendTime` in store and persisted blob when passed explicitly as `undefined`', async () => {
            authStore.setLockLastExtendTime(1234);
            await auth.syncLock({ lockLastExtendTime: undefined });

            expect(authStore.getLockLastExtendTime()).toBeUndefined();
            expect(onSessionPersist).toHaveBeenCalledTimes(1);
            const [serialized] = onSessionPersist.mock.calls[0];
            const persisted = JSON.parse(serialized);
            expect(persisted.lockLastExtendTime).toBeUndefined();
            expect(persisted.blob).toBe(baseline.blob);
            expect(persisted.lockTTL).toBe(baseline.lockTTL);
        });

        test('leaves both store and persisted blob untouched for omitted keys', async () => {
            authStore.setLockLastExtendTime(1234);
            authStore.setUnlockRetryCount(2);
            await auth.syncLock({});

            expect(authStore.getLockLastExtendTime()).toBe(1234);
            expect(authStore.getUnlockRetryCount()).toBe(2);
            expect(onSessionPersist).toHaveBeenCalledTimes(1);
            expect(onSessionPersist).toHaveBeenCalledWith(JSON.stringify(baseline));
        });

        test('no-op persist when there is no persisted session', async () => {
            getPersistedSession.mockResolvedValueOnce(null);
            await auth.syncLock({ unlockRetryCount: 5, lockLastExtendTime: 1234 });

            expect(authStore.getUnlockRetryCount()).toBe(5);
            expect(authStore.getLockLastExtendTime()).toBe(1234);
            expect(onSessionPersist).not.toHaveBeenCalled();
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

        test('should call `syncLock` with `lockLastExtendTime` after a successful adapter check', async () => {
            registerFakeAdapter(LockMode.SESSION);
            const lock: Lock = { mode: LockMode.SESSION, locked: false, ttl: 600 };
            adapterCheck.mockResolvedValue(lock);

            const syncLock = jest.spyOn(auth, 'syncLock');
            await auth.checkLock();

            expect(syncLock).toHaveBeenCalledTimes(1);
            const [update] = syncLock.mock.calls[0];
            expect(update).toEqual({ lockLastExtendTime: expect.any(Number) });
            expect(onLockUpdate).toHaveBeenCalledWith(lock, 0, false);
        });

        test('should not call `syncLock` when the adapter reports the lock as `locked`', async () => {
            registerFakeAdapter(LockMode.SESSION);
            const lock: Lock = { mode: LockMode.SESSION, locked: true, ttl: 600 };
            adapterCheck.mockResolvedValue(lock);

            const syncLock = jest.spyOn(auth, 'syncLock');
            await auth.checkLock();

            expect(syncLock).not.toHaveBeenCalled();
            expect(onLockUpdate).toHaveBeenCalledWith(lock, 0, false);
        });

        test('should short-circuit on `LockMode.NONE` without persisting', async () => {
            authStore.setLockMode(LockMode.NONE);
            const result = await auth.checkLock();
            expect(result).toEqual({ mode: LockMode.NONE, locked: false });
            expect(onSessionPersist).not.toHaveBeenCalled();
            expect(onLockUpdate).not.toHaveBeenCalled();
        });

        test('should short-circuit via `checkAutoLock` when TTL is expired and skip adapter check', async () => {
            adapterCheck = jest.fn();
            auth.registerLockAdapter({
                type: LockMode.SESSION,
                check: adapterCheck,
                create: jest.fn(),
                delete: jest.fn(),
                lock: jest.fn().mockResolvedValue({ mode: LockMode.SESSION, locked: true, ttl: 600 }),
                unlock: jest.fn(),
            });
            authStore.setLockLastExtendTime(0);
            authStore.setLockTTL(1);

            const result = await auth.checkLock();

            expect(result).toEqual(expect.objectContaining({ locked: true }));
            expect(adapterCheck).not.toHaveBeenCalled();
        });

        test('should not call `syncLock` when adapter returns `LockMode.NONE`', async () => {
            registerFakeAdapter(LockMode.SESSION);
            adapterCheck.mockResolvedValue({ mode: LockMode.NONE, locked: false });

            const syncLock = jest.spyOn(auth, 'syncLock');
            await auth.checkLock();

            expect(syncLock).not.toHaveBeenCalled();
        });

        test('should call `onLockUpdate` with the lock returned by the adapter', async () => {
            registerFakeAdapter(LockMode.SESSION);
            const lock: Lock = { mode: LockMode.SESSION, locked: false, ttl: 600 };
            adapterCheck.mockResolvedValue(lock);

            await auth.checkLock();

            expect(onLockUpdate).toHaveBeenCalledWith(lock, 0, false);
        });
    });

    describe('AuthService::lock', () => {
        test('should not wipe `lockLastExtendTime` on lock', async () => {
            authStore.setLockLastExtendTime(1234);
            auth.registerLockAdapter({
                type: LockMode.SESSION,
                check: jest.fn(),
                create: jest.fn(),
                delete: jest.fn(),
                lock: jest.fn().mockResolvedValue({ mode: LockMode.SESSION, locked: true, ttl: 600 }),
                unlock: jest.fn(),
            });

            await auth.lock(LockMode.SESSION, { soft: true });

            expect(authStore.getLockLastExtendTime()).toBe(1234);
        });
    });

    describe('AuthService::unlock', () => {
        test('should not call `syncPersistedSession` on successful unlock', async () => {
            getPersistedSession.mockResolvedValue({ blob: 'b', lockTTL: 600 });
            authStore.setLocalID(0);
            auth.registerLockAdapter({
                type: LockMode.SESSION,
                check: jest.fn(),
                create: jest.fn(),
                delete: jest.fn(),
                lock: jest.fn(),
                unlock: jest.fn().mockResolvedValue('token'),
            });

            const syncPersistedSession = jest.spyOn(auth, 'syncPersistedSession');
            await auth.unlock({ mode: LockMode.SESSION, pin: '123456' });

            expect(syncPersistedSession).not.toHaveBeenCalled();
            expect(onSessionPersist).not.toHaveBeenCalled();
        });
    });

    describe('AuthService resume-locking', () => {
        test('`logout` should release the resume lock', async () => {
            await auth.logout({ soft: true });
            expect(api.setResumeLock).toHaveBeenCalledWith(false);
        });

        test('`lock` should release the resume lock', async () => {
            auth.registerLockAdapter({ type: LockMode.SESSION, lock: jest.fn().mockResolvedValue({}) } as any);
            await auth.lock(LockMode.SESSION, { soft: true });
            expect(api.setResumeLock).toHaveBeenCalledWith(false);
        });

        test('`lock` with `LockMode.NONE` should be a no-op', async () => {
            await auth.lock(LockMode.NONE, { soft: true });
            expect(api.setResumeLock).not.toHaveBeenCalled();
        });
    });
});
