import { binaryStringToUint8Array, uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';
import createStore from '@proton/shared/lib/helpers/store';

import type { PassCoreContextValue } from '../../../../components/Core/PassCoreProvider';
import type { State } from '../../../../store/types';
import type { PassCryptoWorker } from '../../../../types/crypto/pass-crypto';
import { PassEncryptionTag } from '../../../../types/crypto/pass-types';
import { SilentError, UnlockDeclinedError, UnlockFailedError } from '../../../../utils/errors/errors';
import { serialize } from '../../../../utils/object/serialize';
import { generateCache } from '../../../cache/generate';
import { getCacheKey } from '../../../cache/keys';
import { exposePassCrypto } from '../../../crypto';
import { decryptData, generateKey } from '../../../crypto/utils/crypto-helpers';
import type { AuthService } from '../../service';
import { createAuthStore } from '../../store';
import { LockMode } from '../types';
import { biometricsLockAdapterFactory, generateBiometricsKey, getBiometricsUnlockKey } from './adapter';

jest.mock('../../../../store/selectors/cache', () => ({ selectCachableState: (state: unknown) => state }));

const setup = (core: Partial<PassCoreContextValue>) => {
    const authStore = createAuthStore(createStore());
    const api = { reset: jest.fn().mockResolvedValue(undefined) };
    const syncLock = jest.fn().mockResolvedValue(undefined);
    const lock = jest.fn().mockResolvedValue(undefined);
    const auth = { syncLock, lock, config: { authStore, api } } as unknown as AuthService;

    authStore.setLocalID(1);
    authStore.setLockMode(LockMode.BIOMETRICS);
    authStore.setLocked(true);

    return { authStore, syncLock, lock, adapter: biometricsLockAdapterFactory(auth, core as PassCoreContextValue) };
};

describe('biometricsLockAdapterFactory::unlock [app-unbound platform]', () => {
    beforeEach(() => jest.clearAllMocks());

    test('a verified gesture unlocks without yielding an `offlineKD`', async () => {
        const promptBiometricsCheck = jest.fn().mockResolvedValue(undefined);
        const { authStore, syncLock, adapter } = setup({
            biometricsKeyAppBound: false,
            promptBiometricsCheck,
        });

        await expect(adapter.unlock('')).resolves.toBeUndefined();

        expect(promptBiometricsCheck).toHaveBeenCalled();
        expect(authStore.getLocked()).toBe(false);
        expect(authStore.getOfflineKD()).toBeUndefined();
        expect(syncLock).toHaveBeenCalledWith({ unlockRetryCount: 0, lockLastExtendTime: expect.any(Number) });
    });

    test('a failed prompt throws `UnlockFailedError` with its message and burns no retry', async () => {
        const promptBiometricsCheck = jest
            .fn()
            .mockRejectedValue(new Error('There have been too many failed attempts.'));
        const { authStore, syncLock, lock, adapter } = setup({
            biometricsKeyAppBound: false,
            promptBiometricsCheck,
        });

        authStore.setUnlockRetryCount(1);

        const error = await adapter.unlock('').catch((err) => err);

        expect(error).toBeInstanceOf(UnlockFailedError);
        expect(error).not.toBeInstanceOf(SilentError);
        expect(error.message).toBe('There have been too many failed attempts.');
        expect(authStore.getUnlockRetryCount()).toBe(1);
        expect(authStore.getLocked()).toBe(true);
        expect(syncLock).not.toHaveBeenCalled();
        expect(lock).not.toHaveBeenCalled();
    });

    test('a dismissed prompt throws `UnlockDeclinedError` and burns no retry', async () => {
        const promptBiometricsCheck = jest.fn().mockRejectedValue(new UnlockDeclinedError());
        const { authStore, syncLock, lock, adapter } = setup({
            biometricsKeyAppBound: false,
            promptBiometricsCheck,
        });

        authStore.setUnlockRetryCount(1);

        await expect(adapter.unlock('')).rejects.toBeInstanceOf(UnlockDeclinedError);

        expect(authStore.getUnlockRetryCount()).toBe(1);
        expect(authStore.getLocked()).toBe(true);
        expect(syncLock).not.toHaveBeenCalled();
        expect(lock).not.toHaveBeenCalled();
    });

    test.each([LockMode.PASSWORD, LockMode.SESSION, LockMode.NONE])(
        'a %s lock mode is never cleared by a gesture',
        async (lockMode) => {
            const promptBiometricsCheck = jest.fn().mockResolvedValue(undefined);
            const { authStore, syncLock, adapter } = setup({
                biometricsKeyAppBound: false,
                promptBiometricsCheck,
            });

            authStore.setLockMode(lockMode);

            await expect(adapter.unlock('')).rejects.toBeInstanceOf(SilentError);

            expect(promptBiometricsCheck).not.toHaveBeenCalled();
            expect(authStore.getLocked()).toBe(true);
            expect(syncLock).not.toHaveBeenCalled();
        }
    );

    test('an absent presence capability denies the unlock without reporting a declined prompt', async () => {
        const { authStore, adapter } = setup({ biometricsKeyAppBound: false });

        const error = await adapter.unlock('').catch((err) => err);

        expect(error).toBeInstanceOf(SilentError);
        expect(error).not.toBeInstanceOf(UnlockDeclinedError);
        expect(authStore.getLocked()).toBe(true);
    });
});

describe('biometricsLockAdapterFactory::lock', () => {
    test('app-unbound: a cache written after a lock and unlock round trip decrypts on an offline cold boot', async () => {
        exposePassCrypto({ serialize: () => ({}) } as unknown as PassCryptoWorker);

        const promptBiometricsCheck = jest.fn().mockResolvedValue(undefined);
        const { authStore, adapter } = setup({ biometricsKeyAppBound: false, promptBiometricsCheck });
        const offlineKD = uint8ArrayToBinaryString(generateKey());
        const state = { items: { byShareId: { share: { item: 'secret' } } } } as unknown as State;

        authStore.setPassword(uint8ArrayToBinaryString(generateKey()));
        authStore.setOfflineKD(offlineKD);
        authStore.setLocked(false);

        await adapter.lock({ soft: true });
        await adapter.unlock('');

        const cache = await generateCache({
            keyPassword: authStore.getPassword()!,
            offlineKD: authStore.getOfflineKD(),
        })(state);

        /** Offline cold boot: no `keyPassword`, only the `offlineKD` rebuilt from the password */
        const coldBootStore = createAuthStore(createStore());
        coldBootStore.setOfflineKD(offlineKD);

        const cacheKey = await getCacheKey(cache, coldBootStore);
        const decrypted = await decryptData(cacheKey!, binaryStringToUint8Array(cache.state), PassEncryptionTag.Cache);

        expect(new TextDecoder().decode(decrypted)).toEqual(serialize(state));
    });

    test('app-unbound: the store holds no `offlineKD` while locked, the gesture restores it', async () => {
        const promptBiometricsCheck = jest.fn().mockResolvedValue(undefined);
        const { authStore, adapter } = setup({ biometricsKeyAppBound: false, promptBiometricsCheck });

        authStore.setOfflineKD('offline-kd');
        authStore.setLocked(false);

        await adapter.lock({ soft: true });
        expect(authStore.getLocked()).toBe(true);
        expect(authStore.getOfflineKD()).toBeUndefined();

        await adapter.unlock('');
        expect(authStore.getLocked()).toBe(false);
        expect(authStore.getOfflineKD()).toBe('offline-kd');
    });

    test('app-unbound: a denied gesture keeps the `offlineKD` out of the store', async () => {
        const promptBiometricsCheck = jest
            .fn()
            .mockRejectedValueOnce(new UnlockDeclinedError())
            .mockResolvedValueOnce(undefined);
        const { authStore, adapter } = setup({ biometricsKeyAppBound: false, promptBiometricsCheck });

        authStore.setOfflineKD('offline-kd');
        authStore.setLocked(false);

        await adapter.lock({ soft: true });
        await expect(adapter.unlock('')).rejects.toBeInstanceOf(SilentError);
        expect(authStore.getOfflineKD()).toBeUndefined();

        await adapter.unlock('');
        expect(authStore.getOfflineKD()).toBe('offline-kd');
    });

    test('app-unbound: a second lock while locked keeps the held `offlineKD`', async () => {
        const promptBiometricsCheck = jest.fn().mockResolvedValue(undefined);
        const { authStore, adapter } = setup({ biometricsKeyAppBound: false, promptBiometricsCheck });

        authStore.setOfflineKD('offline-kd');
        authStore.setLocked(false);

        await adapter.lock({ soft: true });
        await adapter.lock({ soft: true });
        await adapter.unlock('');

        expect(authStore.getOfflineKD()).toBe('offline-kd');
    });

    test('app-bound: locking wipes the `offlineKD`', async () => {
        const { authStore, adapter } = setup({ biometricsKeyAppBound: true });

        authStore.setOfflineKD('offline-kd');
        authStore.setLocked(false);

        await adapter.lock({ soft: true });
        expect(authStore.getLocked()).toBe(true);
        expect(authStore.getOfflineKD()).toBeUndefined();
    });
});

describe('generateBiometricsKey', () => {
    test('refuses to generate key material where the key is not app-bound', async () => {
        const core = { biometricsKeyAppBound: false, generateBiometricsKey: jest.fn() };

        await expect(generateBiometricsKey(core as unknown as PassCoreContextValue, 'offline-kd')).rejects.toThrow(
            'Biometrics key is not app-bound'
        );
        expect(core.generateBiometricsKey).not.toHaveBeenCalled();
    });
});

describe('getBiometricsUnlockKey', () => {
    const authStore = createAuthStore(createStore());

    test('resolves an empty key without prompting where the key is not app-bound', async () => {
        const core = { biometricsKeyAppBound: false, getBiometricsKey: jest.fn() };

        await expect(getBiometricsUnlockKey(core as unknown as PassCoreContextValue, authStore)).resolves.toBe('');
        expect(core.getBiometricsKey).not.toHaveBeenCalled();
    });

    test('reads the key from the platform store where the key is app-bound', async () => {
        const core = { biometricsKeyAppBound: true, getBiometricsKey: jest.fn().mockResolvedValue('biometrics-key') };

        await expect(getBiometricsUnlockKey(core as unknown as PassCoreContextValue, authStore)).resolves.toBe(
            'biometrics-key'
        );
        expect(core.getBiometricsKey).toHaveBeenCalledWith(authStore);
    });

    test('propagates a failed platform store read', async () => {
        const core = {
            biometricsKeyAppBound: true,
            getBiometricsKey: jest.fn().mockRejectedValue(new Error('denied')),
        };

        await expect(getBiometricsUnlockKey(core as unknown as PassCoreContextValue, authStore)).rejects.toThrow(
            'denied'
        );
    });
});
