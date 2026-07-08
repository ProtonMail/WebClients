import { runSaga } from 'redux-saga';

import { generateOfflineComponents } from '@proton/pass/lib/cache/crypto';
import { passwordOnLaunchToggle } from '@proton/pass/store/actions';
import { sagaSetup } from '@proton/pass/store/sagas/testing';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

import watcher from './password-on-launch.saga';

jest.mock('@proton/pass/lib/cache/crypto', () => ({
    generateOfflineComponents: jest.fn(),
}));

describe('password-on-launch saga', () => {
    const components = {
        offlineConfig: { salt: 'salt', params: {} },
        offlineKD: 'offline-kd',
        offlineVerifier: 'offline-verifier',
    };

    const authService = {
        confirmPassword: jest.fn().mockResolvedValue(true),
        persistSession: jest.fn().mockResolvedValue(undefined),
    };
    const authStore = {
        getLockPasswordOnLaunch: jest.fn().mockReturnValue(false),
        hasOfflinePassword: jest.fn().mockReturnValue(false),
        setOfflineComponents: jest.fn(),
        setLockPasswordOnLaunch: jest.fn(),
    };
    const options = { getAuthService: () => authService, getAuthStore: () => authStore } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(generateOfflineComponents).mockResolvedValue(components as any);
    });

    const runToggle = async (enabled: boolean) => {
        const payload = { enabled, password: obfuscate('test-secret') };
        const intent = passwordOnLaunchToggle.intent(payload);
        const saga = sagaSetup();
        const task = runSaga(saga.options, watcher, options);

        saga.options.dispatch(intent);
        await saga.nextTick();
        task.cancel();

        return { intent, payload, saga };
    };

    test('sets up password material when enabling launch password lock', async () => {
        const { intent, saga } = await runToggle(true);
        const success = passwordOnLaunchToggle.success(intent.meta.request.id, true);

        expect(authService.confirmPassword).toHaveBeenCalledWith('test-secret');
        expect(generateOfflineComponents).toHaveBeenCalledWith('test-secret');
        expect(authStore.setOfflineComponents).toHaveBeenCalledWith(components);
        expect(authStore.setLockPasswordOnLaunch).toHaveBeenCalledWith(true);
        expect(authService.persistSession).toHaveBeenCalledWith({ throwOnFailure: true });
        expect(saga.dispatched).toContainEqual(success);
    });

    test('persists explicit false when disabling launch password lock', async () => {
        authStore.hasOfflinePassword.mockReturnValueOnce(true);

        const { intent, saga } = await runToggle(false);
        const success = passwordOnLaunchToggle.success(intent.meta.request.id, false);

        expect(authService.confirmPassword).toHaveBeenCalledWith('test-secret');
        expect(generateOfflineComponents).not.toHaveBeenCalled();
        expect(authStore.setLockPasswordOnLaunch).toHaveBeenCalledWith(false);
        expect(authService.persistSession).toHaveBeenCalledWith({ throwOnFailure: true });
        expect(saga.dispatched).toContainEqual(success);
    });

    test('restores previous launch password state when secure persist fails', async () => {
        const error = new Error('persist failed');

        authStore.getLockPasswordOnLaunch.mockReturnValueOnce(false);
        authService.persistSession.mockRejectedValueOnce(error);

        const { intent, saga } = await runToggle(true);
        const failure = passwordOnLaunchToggle.failure(intent.meta.request.id, error, intent);

        expect(authStore.setLockPasswordOnLaunch).toHaveBeenCalledWith(true);
        expect(authStore.setLockPasswordOnLaunch).toHaveBeenCalledWith(false);
        expect(saga.dispatched).toContainEqual(failure);
    });
});
