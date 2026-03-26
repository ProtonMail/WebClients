import { desktopLockAdapterFactory } from '@proton/pass/lib/auth/lock/desktop/adapter';
import * as logicExtension from '@proton/pass/lib/auth/lock/desktop/logic.extension';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { createAuthStore } from '@proton/pass/lib/auth/store';
import createStore from '@proton/shared/lib/helpers/store';

jest.mock('@proton/pass/lib/auth/lock/desktop/logic.extension');

const setupLockSecretMessage = logicExtension.sendSetupLockSecretMessage as jest.Mock;
const unlockMessage = logicExtension.sendUnlockMessage as jest.Mock;

const setupAdapter = () => {
    const authStore = createAuthStore(createStore());
    const persistSession = jest.fn().mockResolvedValue(undefined);
    const auth = { persistSession, config: { authStore } };
    const nativeMessaging = {} as any;

    return {
        adapter: desktopLockAdapterFactory(auth as any, nativeMessaging),
        authStore,
    };
};

describe('DesktopLock adapter', () => {
    let capturedSecret: string;

    beforeEach(() => {
        jest.clearAllMocks();
        capturedSecret = '';

        setupLockSecretMessage.mockImplementation(async (_nm: any, _store: any, secret: string) => {
            capturedSecret = secret;
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
            await expect(adapter.unlock('')).rejects.toThrow('No desktop lock verifier found');
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
    });
});
