import { CryptoProxy } from '@protontech/crypto';

import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import createStore from '@proton/shared/lib/helpers/store';

import { obfuscate } from '../../../../utils/obfuscate/xor';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../utils/tests/fixtures/crypto';
import { TEST_OFFLINE_PASSWORD, createTestOfflineComponents } from '../../../../utils/tests/fixtures/session';
import { createAuthStore } from '../../store';
import { LockMode } from '../types';
import { passwordLockAdapterFactory } from './adapter';

const setupAdapter = async () => {
    const authStore = createAuthStore(createStore());
    authStore.setOfflineComponents(await createTestOfflineComponents());
    authStore.setLockMode(LockMode.PASSWORD);

    const syncLock = jest.fn(async (update: { unlockRetryCount?: number }) => {
        if (update.unlockRetryCount !== undefined) authStore.setUnlockRetryCount(update.unlockRetryCount);
    });
    const lock = jest.fn().mockResolvedValue(undefined);
    const logout = jest.fn().mockResolvedValue(undefined);
    const api = { reset: jest.fn().mockResolvedValue(undefined) };
    const auth = { syncLock, lock, logout, config: { authStore, api } };

    return { adapter: passwordLockAdapterFactory(auth as any), authStore, auth };
};

describe('PasswordLock adapter', () => {
    beforeAll(() => setupCryptoProxyForTesting());
    afterAll(releaseCryptoProxy);

    beforeEach(() => {
        jest.mocked(loadCryptoWorker).mockResolvedValue(undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    describe('unlock', () => {
        test('the offline password unlocks and resets the failed attempts', async () => {
            const { adapter, authStore, auth } = await setupAdapter();
            authStore.setUnlockRetryCount(2);

            const offlineKD = await adapter.unlock(obfuscate(TEST_OFFLINE_PASSWORD));

            expect(authStore.getOfflineKD()).toBe(offlineKD);
            expect(authStore.getLocked()).toBe(false);
            expect(auth.syncLock).toHaveBeenCalledWith(expect.objectContaining({ unlockRetryCount: 0 }));
            expect(auth.logout).not.toHaveBeenCalled();
        });

        test('a wrong password counts as a failed attempt and locks again', async () => {
            const { adapter, auth } = await setupAdapter();

            await expect(adapter.unlock(obfuscate('wrong-password'))).rejects.toThrow();

            expect(auth.syncLock).toHaveBeenCalledWith({ unlockRetryCount: 1 });
            expect(auth.lock).toHaveBeenCalledWith(LockMode.PASSWORD, { broadcast: true, soft: true });
            expect(auth.logout).not.toHaveBeenCalled();
        });

        test('the third wrong password logs out and wipes the local data', async () => {
            const { adapter, authStore, auth } = await setupAdapter();
            authStore.setUnlockRetryCount(2);

            await expect(adapter.unlock(obfuscate('wrong-password'))).rejects.toThrow('Too many attempts');

            expect(auth.logout).toHaveBeenCalledWith({ soft: false, broadcast: true });
        });

        /** The desktop lock adapter already leaves the counter alone when the check never ran
         * (`desktop/adapter.spec.ts`). Known gap: the password adapter counts any key derivation
         * failure (crypto worker crash, out of memory) as a wrong password. At the third one it
         * wipes the local data, including the offline components. */
        test.failing('a failing key derivation does not count as a wrong password', async () => {
            const { adapter, auth } = await setupAdapter();
            jest.spyOn(CryptoProxy, 'computeArgon2').mockRejectedValue(new Error('crypto worker crashed'));

            await adapter.unlock(obfuscate(TEST_OFFLINE_PASSWORD)).catch(() => {});

            expect(auth.syncLock).not.toHaveBeenCalledWith({ unlockRetryCount: 1 });
        });
    });
});
