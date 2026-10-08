import createStore from '@proton/shared/lib/helpers/store';

import { NativeMessageErrorType } from '../../../../types';
import * as epoch from '../../../../utils/time/epoch';
import { NativeMessageError, getMessageForNativeMessageError } from '../../../native-messaging/errors';
import { createAuthStore } from '../../store';
import { LockMode } from '../types';
import { desktopLockAdapterFactory } from './adapter';
import * as logicExtension from './logic.extension';

jest.mock('./logic.extension');
jest.mock('../../../../utils/time/epoch');

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
            return 'uid-1-user-1';
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

        test('should persist the identifier returned by the setup message', async () => {
            const { adapter, authStore } = setupAdapter();
            await adapter.create('', 600);

            expect(authStore.getDesktopLockUserIdentifier()).toBe('uid-1-user-1');
        });
    });

    describe('delete', () => {
        test('should clear the verifier and reset lock state', async () => {
            const { adapter, authStore } = setupAdapter();
            await adapter.create('', 600);
            expect(authStore.getDesktopLockVerifier()).toBeDefined();

            await adapter.delete('');
            expect(authStore.getDesktopLockVerifier()).toBeUndefined();
            expect(authStore.getDesktopLockUserIdentifier()).toBeUndefined();
            expect(authStore.getLockMode()).toBe(LockMode.NONE);
            expect(authStore.getLocked()).toBe(false);
        });
    });

    describe('unlock', () => {
        test('should throw without fetching the secret if no verifier is stored', async () => {
            const { adapter } = setupAdapter();
            const configErr = getMessageForNativeMessageError(NativeMessageErrorType.DESKTOP_LOCK_NOT_CONFIGURED);
            await expect(adapter.unlock('')).rejects.toThrow(configErr);
            expect(unlockMessage).not.toHaveBeenCalled();
        });

        test('should fetch the secret from the desktop app and unlock when it matches', async () => {
            const { adapter, authStore } = setupAdapter();
            await adapter.create('', 600);
            expect(capturedSecret).not.toBe('');
            unlockMessage.mockResolvedValue(capturedSecret);

            const result = await adapter.unlock('');
            expect(unlockMessage).toHaveBeenCalledTimes(1);
            expect(result).toEqual(capturedSecret);
            expect(authStore.getLocked()).toBe(false);
        });

        test('should throw if the desktop app returns a different secret than the one stored', async () => {
            const { adapter } = setupAdapter();
            await adapter.create('', 600);
            unlockMessage.mockResolvedValue('wrong-secret');
            await expect(adapter.unlock('')).rejects.toThrow();
        });

        test('on success: writes single combined syncLock with reset retry count + epoch', async () => {
            const { adapter, auth } = setupAdapter();
            await adapter.create('', 600);
            unlockMessage.mockResolvedValue(capturedSecret);

            auth.syncLock.mockClear();
            getEpoch.mockReturnValue(1700001234);

            await adapter.unlock('');
            expect(auth.syncLock).toHaveBeenCalledTimes(1);
            expect(auth.syncLock).toHaveBeenCalledWith({ unlockRetryCount: 0, lockLastExtendTime: 1700001234 });
        });

        test('on empty secret with retryCount < 3: syncs retry count, locks, throws BIOMETRICS_FAILED', async () => {
            const { adapter, auth, authStore } = setupAdapter();
            await adapter.create('', 600);
            authStore.setUnlockRetryCount(1);
            unlockMessage.mockResolvedValue('');
            auth.syncLock.mockClear();

            const error = await adapter.unlock('').catch((err) => err);
            expect(error).toBeInstanceOf(NativeMessageError);
            expect(error.type).toBe(NativeMessageErrorType.BIOMETRICS_FAILED);

            expect(auth.syncLock).toHaveBeenCalledWith({ unlockRetryCount: 2 });
            expect(auth.lock).toHaveBeenCalledWith(LockMode.DESKTOP, { broadcast: true, soft: true });
            expect(auth.logout).not.toHaveBeenCalled();
        });

        test('on an infrastructure error (timeout): rethrows the type without counting a failed attempt', async () => {
            const { adapter, auth } = setupAdapter();
            await adapter.create('', 600);
            unlockMessage.mockRejectedValue(new NativeMessageError(NativeMessageErrorType.TIMEOUT));
            auth.syncLock.mockClear();

            const error = await adapter.unlock('').catch((err) => err);
            expect(error).toBeInstanceOf(NativeMessageError);
            expect(error.type).toBe(NativeMessageErrorType.TIMEOUT);

            /** Infra errors mean the biometric check never ran: no retry increment, no lock, no logout. */
            expect(auth.syncLock).not.toHaveBeenCalled();
            expect(auth.lock).not.toHaveBeenCalled();
            expect(auth.logout).not.toHaveBeenCalled();
        });

        test('on wrong secret with retryCount < 3: syncs retry count and throws SECRET_MISMATCH', async () => {
            const { adapter, auth, authStore } = setupAdapter();
            await adapter.create('', 600);
            authStore.setUnlockRetryCount(0);
            unlockMessage.mockResolvedValue('not-the-right-secret');
            auth.syncLock.mockClear();

            const secretErr = getMessageForNativeMessageError(NativeMessageErrorType.SECRET_MISMATCH);
            await expect(adapter.unlock('')).rejects.toThrow(secretErr);

            expect(auth.syncLock).toHaveBeenCalledWith({ unlockRetryCount: 1 });
            expect(auth.lock).toHaveBeenCalledWith(LockMode.DESKTOP, { broadcast: true, soft: true });
            expect(auth.logout).not.toHaveBeenCalled();
        });

        test('on 3rd failed attempt: triggers logout and throws "Too many attempts"', async () => {
            const { adapter, auth, authStore } = setupAdapter();
            await adapter.create('', 600);
            authStore.setUnlockRetryCount(2);
            unlockMessage.mockResolvedValue('wrong');
            await expect(adapter.unlock('')).rejects.toThrow('Too many attempts');
            expect(auth.logout).toHaveBeenCalledWith({ soft: false, broadcast: true });
        });
    });
});
