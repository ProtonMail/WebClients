import createStore from '@proton/shared/lib/helpers/store';

import type { PassCoreContextValue } from '../../../../components/Core/PassCoreProvider';
import { createAuthStore } from '../../store';
import { LockMode } from '../types';
import { deleteBiometricsKeyIfNotAppBound } from './cleanup';

const setup = (core: Partial<PassCoreContextValue> = {}) => {
    const authStore = createAuthStore(createStore());
    const syncPersistedSession = jest.fn().mockResolvedValue(undefined);
    const auth = { authStore, syncPersistedSession, config: { authStore } };

    return { authStore, auth: auth as any, core: core as PassCoreContextValue };
};

describe('deleteBiometricsKeyIfNotAppBound', () => {
    beforeEach(() => jest.clearAllMocks());

    test('no-op when the OS store is app-bound (macOS / web)', async () => {
        const { authStore, auth, core } = setup({ biometricsKeyAppBound: true });
        authStore.setLockMode(LockMode.BIOMETRICS);
        authStore.setEncryptedOfflineKD('kd');

        await expect(deleteBiometricsKeyIfNotAppBound(auth, core)).resolves.toBe(false);
        expect(authStore.getEncryptedOfflineKD()).toBe('kd');
        expect(auth.syncPersistedSession).not.toHaveBeenCalled();
    });

    test('no-op when no envelope is stored at rest', async () => {
        const { auth, core } = setup({ biometricsKeyAppBound: false });

        await expect(deleteBiometricsKeyIfNotAppBound(auth, core)).resolves.toBe(false);
        expect(auth.syncPersistedSession).not.toHaveBeenCalled();
    });

    test('deletes envelope and OS secret on app-unbound platforms, keeps lock mode', async () => {
        const removeBiometricsKey = jest.fn().mockResolvedValue(undefined);
        const { authStore, auth, core } = setup({ biometricsKeyAppBound: false, removeBiometricsKey });
        authStore.setLocalID(1);
        authStore.setLockMode(LockMode.BIOMETRICS);
        authStore.setEncryptedOfflineKD('kd');
        authStore.setUnlockRetryCount(2);

        await expect(deleteBiometricsKeyIfNotAppBound(auth, core)).resolves.toBe(true);

        expect(removeBiometricsKey).toHaveBeenCalledWith(authStore);
        expect(authStore.getEncryptedOfflineKD()).toBeUndefined();
        expect(authStore.getUnlockRetryCount()).toBe(0);
        /** Lock mode untouched: Hello stays as a UI lock */
        expect(authStore.getLockMode()).toBe(LockMode.BIOMETRICS);
        expect(auth.syncPersistedSession).toHaveBeenCalledWith(expect.anything(), {
            encryptedOfflineKD: undefined,
            unlockRetryCount: 0,
        });
    });

    test('still clears the envelope when removing the OS secret fails', async () => {
        const removeBiometricsKey = jest.fn().mockRejectedValue(new Error('os store error'));
        const { authStore, auth, core } = setup({ biometricsKeyAppBound: false, removeBiometricsKey });
        authStore.setEncryptedOfflineKD('kd');

        await expect(deleteBiometricsKeyIfNotAppBound(auth, core)).resolves.toBe(true);
        expect(authStore.getEncryptedOfflineKD()).toBeUndefined();
        expect(auth.syncPersistedSession).toHaveBeenCalled();
    });
});
