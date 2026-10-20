import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { passwordLockAdapterFactory } from '@proton/pass/lib/auth/lock/password/adapter';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import { AppStatus } from '@proton/pass/types/worker/state';
import type { StorageData } from '@proton/pass/types/worker/storage';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { createMemoryStore } from '@proton/pass/utils/store';
import { TEST_API_URL } from '@proton/pass/utils/tests/backend';
import type { TestPersistedSession } from '@proton/pass/utils/tests/fixtures/session';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';
import noop from '@proton/utils/noop';

import { clearBrowserMocks } from '../__mocks__/webextension-polyfill';
import { WorkerContext } from '../app/worker/context/inject';
import { createAuthService } from '../app/worker/services/auth/auth.service';

const config = { APP_NAME: 'proton-pass-extension', APP_VERSION: '1.0.0', API_URL: TEST_API_URL } as ProtonConfig;

/** Stand-in for the extension storage areas, with the `preserve` option of `clear` */
const createTestStorage = (init: StorageData = {}) => {
    const data = new Map(Object.entries(init));

    return {
        data,
        getItem: async (key: string) => data.get(key) ?? null,
        getItems: async (keys: string[]) =>
            Object.fromEntries(keys.filter((key) => data.has(key)).map((key) => [key, data.get(key)])),
        setItem: async (key: string, value: unknown) => {
            data.set(key, value);
        },
        setItems: async (items: StorageData) => Object.entries(items).forEach(([key, value]) => data.set(key, value)),
        removeItem: async (key: string) => {
            data.delete(key);
        },
        removeItems: async (keys: string[]) => keys.forEach((key) => data.delete(key)),
        clear: async (options?: { preserve: string[] }) =>
            [...data.keys()].filter((key) => !options?.preserve.includes(key)).forEach((key) => data.delete(key)),
    };
};

/** Advances fake timers until `promise` settles: covers `retry-after`
 * waits and request timeouts without real delays. A rejection happening
 * while timers advance is still returned to the caller, not reported unhandled. */
const settle = async <T>(promise: Promise<T>): Promise<T> => {
    promise.catch(noop);
    await jest.advanceTimersByTimeAsync(120_000);
    return promise;
};

afterEach(() => {
    WorkerContext.clear();
    clearBrowserMocks();
});

/** Real API stack and extension auth service over the test backend. Only
 * the worker services the auth flows touch are stubbed, storage is stateful. */
export const setupAuthWorker = ({ encrypted }: TestPersistedSession) => {
    jest.mocked(loadCryptoWorker).mockResolvedValue(undefined);

    const api = exposeApi(createApi({ config }));
    const authStore = exposeAuthStore(createAuthStore(createMemoryStore()));
    const local = createTestStorage({ ps: encrypted });
    const session = createTestStorage();

    const ctx: any = {
        authStore,
        booted: false,
        status: AppStatus.IDLE,
        getState: () => ({ status: ctx.status, booted: ctx.booted }),
        setStatus: (status: AppStatus) => (ctx.status = status),
        setBooted: (booted: boolean) => (ctx.booted = booted),
        service: {
            activation: { boot: jest.fn() },
            apiProxy: { clear: jest.fn().mockResolvedValue(undefined) },
            autofill: { clear: jest.fn() },
            connectivity: {
                online: true,
                status: ConnectivityStatus.ONLINE,
                check: jest.fn(),
                subscribe: jest.fn(() => () => {}),
            },
            featureFlags: { resolve: jest.fn().mockResolvedValue({ features: {}, variants: {} }) },
            formTracker: { clear: jest.fn() },
            logger: { clear: jest.fn().mockResolvedValue(undefined) },
            nativeMessaging: { disconnect: jest.fn() },
            settings: { clear: jest.fn(), resolve: jest.fn().mockResolvedValue({}) },
            spotlight: { reset: jest.fn() },
            storage: { local, session },
            store: { dispatch: jest.fn() },
            telemetry: { stop: jest.fn() },
        },
    };

    WorkerContext.set(ctx);

    const auth = createAuthService(api, authStore);
    ctx.service.auth = auth;
    auth.registerLockAdapter(passwordLockAdapterFactory(auth));
    auth.listen();

    return {
        auth,
        ctx,
        local,
        getPersistedSession: async () => JSON.parse((await local.getItem('ps')) ?? 'null'),
        /** Service worker start, as `activation.ts` resumes the session */
        start: () => settle(auth.init({ forceLock: false, retryable: true })),
        unlock: (password: string) => settle(auth.unlock({ mode: LockMode.PASSWORD, password: obfuscate(password) })),
    };
};
