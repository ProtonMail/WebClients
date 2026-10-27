import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { passwordLockAdapterFactory } from '@proton/pass/lib/auth/lock/password/adapter';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { bootIntent } from '@proton/pass/store/actions/creators/client';
import type { Maybe } from '@proton/pass/types/utils';
import { AppStatus } from '@proton/pass/types/worker/state';
import type { StorageData } from '@proton/pass/types/worker/storage';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { createMemoryStore } from '@proton/pass/utils/store';
import { TEST_API_URL } from '@proton/pass/utils/tests/backend';
import type { TestPersistedSession } from '@proton/pass/utils/tests/fixtures/session';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';
import noop from '@proton/utils/noop';

import browser, { clearBrowserMocks } from '../__mocks__/webextension-polyfill';
import WorkerMessageBroker from '../app/worker/channel';
import { WorkerContext } from '../app/worker/context/inject';
import { createAuthService } from '../app/worker/services/auth/auth.service';
import { createConnectivityService } from '../app/worker/services/connectivity';

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

/** Stateful `browser.alarms`: `create`, `clear` and `get` share the scheduled
 * times, so the alarm chains of the auth service behave as in a browser */
const wireTestAlarms = (scheduled = new Map<string, number>()) => {
    browser.alarms.create.mockImplementation(async (name: string, { when }: { when: number }) => {
        scheduled.set(name, when);
    });
    browser.alarms.clear.mockImplementation(async (name: string) => scheduled.delete(name));
    browser.alarms.get.mockImplementation(async (name: string) => {
        const scheduledTime = scheduled.get(name);
        return scheduledTime === undefined ? undefined : { name, scheduledTime };
    });

    return {
        scheduled,
        getScheduledTime: (name: string): Maybe<number> => scheduled.get(name),
        /** Runs the listeners as the browser does when the alarm is due */
        fire: (name: string) => {
            scheduled.delete(name);
            const listeners = browser.alarms.onAlarm.addListener.mock.calls.map(([listener]) => listener);
            return settle(Promise.all(listeners.map((listener) => listener({ name }))));
        },
    };
};

let teardown = noop;

afterEach(() => {
    teardown();
    WorkerContext.clear();
    clearBrowserMocks();
});

/** Real API stack, connectivity service and extension auth service over the
 * test backend. Only the worker services the auth flows touch are stubbed,
 * storage and alarms are stateful. The store is a stand-in: a `bootIntent`
 * marks the worker booted the way a successful boot saga does. */
type TestWorkerState = { local: StorageData; session: StorageData; alarms: Map<string, number> };

export const setupAuthWorker = (persisted: TestPersistedSession, state?: TestWorkerState) => {
    jest.mocked(loadCryptoWorker).mockResolvedValue(undefined);

    const api = exposeApi(createApi({ config }));
    const alarms = wireTestAlarms(state?.alarms);
    jest.mocked(WorkerMessageBroker.ports.query).mockReturnValue([]);
    const authStore = exposeAuthStore(createAuthStore(createMemoryStore()));
    const local = createTestStorage(state?.local ?? { ps: persisted.encrypted });
    const session = createTestStorage(state?.session);

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
            connectivity: createConnectivityService(),
            featureFlags: { resolve: jest.fn().mockResolvedValue({ features: {}, variants: {} }) },
            formTracker: { clear: jest.fn() },
            logger: { clear: jest.fn().mockResolvedValue(undefined) },
            nativeMessaging: { disconnect: jest.fn() },
            settings: { clear: jest.fn(), resolve: jest.fn().mockResolvedValue({}) },
            spotlight: { reset: jest.fn() },
            storage: { local, session },
            store: {
                dispatch: jest.fn((action) => {
                    if (bootIntent.match(action)) {
                        ctx.setStatus(action.payload?.offline ? AppStatus.OFFLINE : AppStatus.READY);
                        ctx.setBooted(true);
                    }
                    return action;
                }),
            },
            telemetry: { stop: jest.fn() },
        },
    };

    WorkerContext.set(ctx);
    teardown = ctx.service.connectivity.destroy;

    const auth = createAuthService(api, authStore);
    ctx.service.auth = auth;
    auth.registerLockAdapter(passwordLockAdapterFactory(auth));
    auth.listen();

    return {
        alarms,
        auth,
        ctx,
        local,
        getPersistedSession: async () => JSON.parse((await local.getItem('ps')) ?? 'null'),
        /** Service worker restart: a new worker on the same storage areas and alarms,
         * the in-memory state of this one (auth store, API, connectivity) is lost */
        restart: () => {
            ctx.service.connectivity.destroy();
            browser.alarms.onAlarm.addListener.mockClear();
            return setupAuthWorker(persisted, {
                local: Object.fromEntries(local.data),
                session: Object.fromEntries(session.data),
                alarms: alarms.scheduled,
            });
        },
        /** Authenticated API request, as the event loop or an item write sends them. Failures
         * are swallowed: assertions read the worker state, not the request outcome */
        request: (method: 'get' | 'post', url: string) => settle(api({ method, url }).catch(noop)),
        /** Service worker start, as `activation.ts` resumes the session */
        start: () => settle(auth.init({ forceLock: false, retryable: true })),
        unlock: (password: string) => settle(auth.unlock({ mode: LockMode.PASSWORD, password: obfuscate(password) })),
    };
};
