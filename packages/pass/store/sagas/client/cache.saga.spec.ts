import { runSaga } from 'redux-saga';

import * as generate from '@proton/pass/lib/cache/generate';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { sagaSetup } from '@proton/pass/store/sagas/testing';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { PassCryptoWorker } from '@proton/pass/types/crypto/pass-crypto';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';

import { cacheWorker } from './cache.saga';

const generateCache = jest.spyOn(generate, 'generateCache');

const makeOptions = (appState: { booted: boolean; authorized: boolean }) => {
    const authStore = {
        getPassword: jest.fn(() => 'pw'),
        hasSession: jest.fn(() => true),
        getLockToken: jest.fn(),
        getOfflineKD: jest.fn(),
    };

    return {
        setCache: jest.fn(),
        getAppState: () => appState,
        getAuthStore: () => authStore,
    } as unknown as RootSagaOptions;
};

const runWorker = (options: RootSagaOptions) =>
    runSaga(sagaSetup().options, cacheWorker, withCache({ type: 'test_cache_action' }), options).toPromise();

beforeEach(() => {
    jest.clearAllMocks();
    exposePassCrypto({ ready: true } as PassCryptoWorker);
    generateCache.mockReturnValue(async () => ({}) as EncryptedPassCache);
});

describe('Cache saga worker', () => {
    test('does not write cache while booting', async () => {
        const options = makeOptions({ booted: false, authorized: true });
        await runWorker(options);
        expect(options.setCache).not.toHaveBeenCalled();
    });

    test('does not write cache when unauthorized', async () => {
        const options = makeOptions({ booted: true, authorized: false });
        await runWorker(options);
        expect(options.setCache).not.toHaveBeenCalled();
    });

    test('does not write cache without a valid session', async () => {
        const options = makeOptions({ booted: true, authorized: true });
        (options.getAuthStore().getPassword as jest.Mock).mockReturnValue(undefined);
        await runWorker(options);
        expect(options.setCache).not.toHaveBeenCalled();
    });

    test('does not write cache when crypto is not ready', async () => {
        exposePassCrypto({ ready: false } as PassCryptoWorker);
        const options = makeOptions({ booted: true, authorized: true });
        await runWorker(options);
        expect(options.setCache).not.toHaveBeenCalled();
    });

    test('writes cache once booted and authorized with a valid session', async () => {
        const options = makeOptions({ booted: true, authorized: true });
        await runWorker(options);
        expect(options.setCache).toHaveBeenCalled();
    });
});
