import { runSaga } from 'redux-saga';

import * as generate from '../../../lib/cache/generate';
import { exposePassCrypto } from '../../../lib/crypto';
import type { PassCryptoWorker } from '../../../types/crypto/pass-crypto';
import type { EncryptedPassCache } from '../../../types/worker/cache';
import { withCache } from '../../actions/enhancers/cache';
import type { RootSagaOptions } from '../../types';
import { sagaSetup } from '../testing';
import { cacheWorker } from './cache.saga';

jest.mock('@proton/pass/lib/cache/generate', () => ({
    ...jest.requireActual('@proton/pass/lib/cache/generate'),
    generateCache: jest.fn(),
}));

const generateCache = jest.mocked(generate.generateCache);

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
