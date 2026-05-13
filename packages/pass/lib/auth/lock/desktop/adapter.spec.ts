import { desktopLockAdapterFactory } from '@proton/pass/lib/auth/lock/desktop/adapter';
import * as logicExtension from '@proton/pass/lib/auth/lock/desktop/logic.extension';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { createAuthStore } from '@proton/pass/lib/auth/store';
import { getMessageForNativeMessageError } from '@proton/pass/lib/native-messaging/errors';
import { NativeMessageErrorType } from '@proton/pass/types';
import { SilentError } from '@proton/pass/utils/errors/errors';
import * as epoch from '@proton/pass/utils/time/epoch';
import createStore from '@proton/shared/lib/helpers/store';

jest.mock('@proton/pass/lib/auth/lock/desktop/logic.extension');
jest.mock('@proton/pass/utils/time/epoch');

const setupLockSecretMessage = logicExtension.sendSetupLockSecretMessage as jest.Mock;
const unlockMessage = logicExtension.sendUnlockMessage as jest.Mock;
const getEpoch = epoch.getEpoch as jest.Mock;

const setupAdapter = () => {
    const authStore = createAuthStore(createStore());
    const persistSession = jest.fn().mockResolvedValue(undefined);
    const syncLock = jest.fn().mockResolvedValue(undefined);
    const lock = jest.fn().mockResolvedValue(undefined);
    const logout = jest.fn().mockResolvedValue(undefined);
    const auth = { persistSession, syncLock, lock, logout, config: { authStore } };
    const nativeMessaging = {} as any;

    return {
        adapter: desktopLockAdapterFactory(auth as any, nativeMessaging),
        authStore,
        auth,
    };
};

describe('DesktopLock adapter', () => {
    let capturedSecret: string;

    beforeEach(() => {
        jest.clearAllMocks();
        capturedSecret = '';

        getEpoch.mockReturnValue(1700000000);

        setupLockSecretMessage.mockImplementation(async (_nm: any, _store: any, secret: string) => {
            capturedSecret = secret;
        });
    });

    describe('check', () => {
        test('should return proper lock shape', async () => {
            const { adapter, authStore } = setupAdapter();
            authStore.setLockTTL(900);
            const result = await adapter.check();
            expect(result).toEqual({ mode: LockMode.DESKTOP, locked: false, ttl: 900 });
        });
    });

    describe('create', () => {
        test('should store a verifier, not the raw lock secret', async () => {
            const { adapter, authStore } = setupAdapter();
            await adapter.create('', 600);

            const verifier = authStore.getDesktopLockVerifier();
            expect(verifier).toBeDefined();
            expect(verifier).not.toEqual(capturedSecret);
        });

        test('should set lock mode and unlock state', async () => {
            const { adapter, authStore } = setupAdapter();
            await adapter.create('', 600);

            expect(authStore.getLockMode()).toBe(LockMode.DESKTOP);
            expect(authStore.getLocked()).toBe(false);
        });
    });

    describe('delete', () => {
        test('should clear the verifier and reset lock state', async () => {
            const { adapter, authStore } = setupAdapter();
            await adapter.create('', 600);
            expect(authStore.getDesktopLockVerifier()).toBeDefined();

            await adapter.delete('');
            expect(authStore.getDesktopLockVerifier()).toBeUndefined();
            expect(authStore.getLockMode()).toBe(LockMode.NONE);
            expect(authStore.getLocked()).toBe(false);
        });
    });

    describe('unlock', () => {
        test('should throw if no verifier is stored', async () => {
            const { adapter } = setupAdapter();
            const configErr = getMessageForNativeMessageError(NativeMessageErrorType.DESKTOP_LOCK_NOT_CONFIGURED);
            await expect(adapter.unlock('')).rejects.toThrow(configErr);
            expect(unlockMessage).not.toHaveBeenCalled();
        });

        test('should succeed and unlock when desktop returns the correct secret', async () => {
            const { adapter, authStore } = setupAdapter();
            await adapter.create('', 600);
            expect(capturedSecret).not.toBe('');

            const result = await adapter.unlock(capturedSecret);
            expect(result).toEqual(capturedSecret);
            expect(authStore.getLocked()).toBe(false);
        });

        test('should throw if desktop returns a different secret than the one stored', async () => {
            const { adapter } = setupAdapter();
            await adapter.create('', 600);
            unlockMessage.mockResolvedValue('wrong-secret');
            await expect(adapter.unlock('')).rejects.toThrow();
        });

        test('on success: writes single combined syncLock with reset retry count + epoch', async () => {
            const { adapter, auth } = setupAdapter();
            await adapter.create('', 600);

            auth.syncLock.mockClear();
            getEpoch.mockReturnValue(1700001234);

            await adapter.unlock(capturedSecret);
            expect(auth.syncLock).toHaveBeenCalledTimes(1);
            expect(auth.syncLock).toHaveBeenCalledWith({ unlockRetryCount: 0, lockLastExtendTime: 1700001234 });
        });

        test('on empty secret with retryCount < 3: syncs retry count, locks, throws SilentError', async () => {
            const { adapter, auth, authStore } = setupAdapter();
            await adapter.create('', 600);
            authStore.setUnlockRetryCount(1);
            auth.syncLock.mockClear();

            await expect(adapter.unlock('')).rejects.toThrow(SilentError);

            expect(auth.syncLock).toHaveBeenCalledWith({ unlockRetryCount: 2 });
            expect(auth.lock).toHaveBeenCalledWith(LockMode.DESKTOP, { broadcast: true, soft: true });
            expect(auth.logout).not.toHaveBeenCalled();
        });

        test('on wrong secret with retryCount < 3: syncs retry count and throws SECRET_MISMATCH', async () => {
            const { adapter, auth, authStore } = setupAdapter();
            await adapter.create('', 600);
            authStore.setUnlockRetryCount(0);
            auth.syncLock.mockClear();

            const secretErr = getMessageForNativeMessageError(NativeMessageErrorType.SECRET_MISMATCH);
            await expect(adapter.unlock('not-the-right-secret')).rejects.toThrow(secretErr);

            expect(auth.syncLock).toHaveBeenCalledWith({ unlockRetryCount: 1 });
            expect(auth.lock).toHaveBeenCalledWith(LockMode.DESKTOP, { broadcast: true, soft: true });
            expect(auth.logout).not.toHaveBeenCalled();
        });

        test('on 3rd failed attempt: triggers logout and throws "Too many attempts"', async () => {
            const { adapter, auth, authStore } = setupAdapter();
            await adapter.create('', 600);
            authStore.setUnlockRetryCount(2);
            await expect(adapter.unlock('wrong')).rejects.toThrow('Too many attempts');
            expect(auth.logout).toHaveBeenCalledWith({ soft: false, broadcast: true });
        });
    });
});
