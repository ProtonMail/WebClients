import { runSaga } from 'redux-saga';
import type { Mock } from 'vitest';

import * as generate from '../../../lib/cache/generate';
import { exposePassCrypto } from '../../../lib/crypto';
import type { PassCryptoWorker } from '../../../types/crypto/pass-crypto';
import type { EncryptedPassCache } from '../../../types/worker/cache';
import { sagaSetup } from '../../../utils/tests/saga';
import { withCache } from '../../actions/enhancers/cache';
import type { RootSagaOptions } from '../../types';
import { cacheWorker } from './cache.saga';

vi.mock('@proton/pass/lib/cache/generate', async () => ({
    ...(await vi.importActual('@proton/pass/lib/cache/generate')),
    generateCache: vi.fn(),
}));

const generateCache = vi.mocked(generate.generateCache);

const makeOptions = (appState: { booted: boolean; authorized: boolean }) => {
    const authStore = {
        getPassword: vi.fn(() => 'pw'),
        hasSession: vi.fn(() => true),
        getLockToken: vi.fn(),
        getOfflineKD: vi.fn(),
    };

    return {
        setCache: vi.fn(),
        getAppState: () => appState,
        getAuthStore: () => authStore,
    } as unknown as RootSagaOptions;
};

const runWorker = (options: RootSagaOptions) =>
    runSaga(sagaSetup().options, cacheWorker, withCache({ type: 'test_cache_action' }), options).toPromise();

beforeEach(() => {
    vi.clearAllMocks();
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
        (options.getAuthStore().getPassword as Mock).mockReturnValue(undefined);
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
