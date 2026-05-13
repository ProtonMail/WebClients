import WorkerMessageBroker from 'proton-pass-extension/__mocks__/app/worker/channel';
import browser, { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';
import { WorkerContext } from 'proton-pass-extension/app/worker/context/inject';
import type { WorkerContextInterface } from 'proton-pass-extension/app/worker/context/types';

import { SESSION_RESUME_MAX_RETRIES } from '@proton/pass/lib/auth/scheduler';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import { createAuthStore } from '@proton/pass/lib/auth/store';
import type { ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import { bootIntent, offlineResume } from '@proton/pass/store/actions';
import type { Api, Maybe } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { AppStatus } from '@proton/pass/types/worker/state';
import { createMemoryStore } from '@proton/pass/utils/store';
import { createApiError, createOfflineError } from '@proton/shared/lib/fetch/ApiError';
import { wait } from '@proton/shared/lib/helpers/promise';

import { SESSION_RESUME_ALARM } from './auth.alarms';
import type { ExtensionAuthService } from './auth.service';
import { createAuthService } from './auth.service';

/** Drive `browser.alarms.get` based on the most recent `create`/`clear` calls so
 * the real `AuthAlarms` instance behaves like a stateful scheduler. This is the
 * core of the integration setup: without it, the alarm chain's "skip if pending"
 * guard can't be exercised "end-to-end". */
const wireTestAlarm = () => {
    let scheduledTime: Maybe<number>;

    browser.alarms.create.mockImplementation(async (_, opts: { when: number }) => {
        scheduledTime = opts.when;
        return { scheduledTime };
    });

    browser.alarms.clear.mockImplementation(async () => (scheduledTime = undefined));
    browser.alarms.get.mockImplementation(async () => (scheduledTime ? { scheduledTime } : undefined));

    return {
        getScheduledTime: () => scheduledTime,
        clear: () => (scheduledTime = undefined),
    };
};

const genericError = new Error('unknown');
const offlineError = createOfflineError({});
const connectionError = createApiError('StatusCodeError', { status: 503, statusText: 'Unreachable' } as any, {}, {});

/** The connectivity subscriber dispatches `void alarms.setAutoResume()`:
 * fire-and-forget. `setAutoResume` chains multiple awaits internally
 * (alarms.get, alarms.create), so a single microtask flush isn't enough. */
const flushAsync = () => wait(0);

/** Fire all listeners registered via `browser.alarms.onAlarm.addListener`
 * with the given alarm name to simulate the browser firing the alarm. */
const fireAlarm = (name: string) => {
    const listeners = browser.alarms.onAlarm.addListener.mock.calls.map(([fn]) => fn);
    return Promise.all(listeners.map((listener) => listener({ name })));
};

describe('Auth integration', () => {
    let api: Api;
    let auth: ExtensionAuthService;
    let authStore: AuthStore;
    let connectivity: { -readonly [P in keyof ConnectivityService]: ConnectivityService[P] };
    let ctx: WorkerContextInterface;
    let alarmState: ReturnType<typeof wireTestAlarm>;
    let connectivitySubscriber: ((status: ConnectivityStatus) => void) | undefined;

    /** Plant offline components + a session with `offlineKD` so `unlocked`
     * resolves true via `validOfflineSession(authStore.getSession())`. */
    const setOfflineUnlocked = () => {
        authStore.setOfflineConfig({} as any);
        authStore.setOfflineVerifier('verifier');
        authStore.setSession({ UID: 'uid', UserID: 'user', offlineKD: 'kd' } as any);
    };

    beforeEach(() => {
        jest.clearAllMocks();
        clearBrowserMocks();
        alarmState = wireTestAlarm();

        api = jest.fn() as unknown as Api;
        api.subscribe = jest.fn();
        api.idle = jest.fn().mockResolvedValue(undefined);
        authStore = createAuthStore(createMemoryStore());

        connectivity = {
            online: true,
            status: ConnectivityStatus.ONLINE,
            check: jest.fn().mockResolvedValue(undefined),
            subscribe: jest.fn((sub) => {
                connectivitySubscriber = sub;
                return () => {};
            }),
        } as any;

        ctx = {
            booted: false,
            status: AppStatus.IDLE,
            getState: jest.fn(() => ({ status: ctx.status, booted: ctx.booted })),
            setStatus: jest.fn((value: AppStatus) => (ctx.status = value)),
            setBooted: jest.fn((value: boolean) => (ctx.booted = value)),
            service: {
                activation: { boot: jest.fn() },
                apiProxy: { clear: jest.fn() },
                autofill: { clear: jest.fn() },
                connectivity,
                featureFlags: {
                    resolve: jest
                        .fn()
                        .mockResolvedValue({ features: { [PassFeature.PassExtensionOfflineV1]: true }, variants: {} }),
                },
                formTracker: { clear: jest.fn() },
                logger: { clear: jest.fn() },
                nativeMessaging: { disconnect: jest.fn() },
                settings: { clear: jest.fn() },
                spotlight: { reset: jest.fn() },
                storage: {
                    local: { setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
                    session: {
                        getItems: jest.fn().mockResolvedValue({}),
                        setItems: jest.fn(),
                        removeItems: jest.fn(),
                        clear: jest.fn(),
                    },
                },
                store: { dispatch: jest.fn() },
                telemetry: { stop: jest.fn() },
            },
        } as any;
        WorkerContext.set(ctx);

        auth = createAuthService(api, authStore);
        ctx.service.auth = auth;
        auth.listen();
        WorkerMessageBroker.ports.query.mockReturnValue([]);
    });

    afterEach(() => WorkerContext.clear());

    describe('partial outage → offline fallback', () => {
        test('should boot offline when resume fails on a connection error and offline-unlocked', async () => {
            ctx.status = AppStatus.IDLE;
            setOfflineUnlocked();
            await auth.config.onSessionFailure?.({ retryable: true, unlocked: true }, connectionError);
            expect(ctx.service.store.dispatch).toHaveBeenCalledWith(bootIntent({ offline: true }));
            expect(ctx.setStatus).not.toHaveBeenCalled();
            expect(browser.alarms.create).not.toHaveBeenCalled();
        });

        test('should still arm the retry chain when already offline-booted and resume fails', async () => {
            ctx.status = AppStatus.OFFLINE;
            await auth.config.onSessionFailure?.({ retryable: true }, connectionError);
            expect(browser.alarms.create).toHaveBeenCalledTimes(1);
            expect(ctx.setStatus).not.toHaveBeenCalled();
        });

        test('should land in `ERROR` on non-connection error even with offline components', async () => {
            ctx.status = AppStatus.IDLE;
            setOfflineUnlocked();
            await auth.config.onSessionFailure?.({ retryable: false }, genericError);
            expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.ERROR);
            expect(ctx.service.store.dispatch).not.toHaveBeenCalledWith(bootIntent({ offline: true }));
        });

        test('should land in `PASSWORD_LOCKED` on connection error without unlocked context', async () => {
            ctx.status = AppStatus.IDLE;
            authStore.setOfflineConfig({} as any);
            authStore.setOfflineVerifier('verifier');
            await auth.config.onSessionFailure?.({ retryable: false }, connectionError);
            expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
        });
    });

    describe('SW death recovery in offline mode', () => {
        test('should boot offline immediately when waking up offline with a valid offline memory session', async () => {
            connectivity.online = false;
            ctx.booted = false;
            authStore.setOfflineConfig({} as any);
            authStore.setOfflineVerifier('verifier');
            const memorySession = { UID: 'uid', UserID: 'user', offlineKD: 'kd' };
            const proceed = await auth.config.onResumeStart?.({ hasSession: true, memorySession });
            expect(proceed).toBe(false);
            expect(ctx.service.store.dispatch).toHaveBeenCalledWith(bootIntent({ offline: true }));
            expect(authStore.getSession()).toEqual(expect.objectContaining(memorySession));
        });

        test('should proceed when waking up online even with offline components present', async () => {
            connectivity.online = true;
            authStore.setOfflineConfig({} as any);
            authStore.setOfflineVerifier('verifier');
            const memorySession = { UID: 'uid', UserID: 'user', offlineKD: 'kd' };
            const proceed = await auth.config.onResumeStart?.({ hasSession: true, memorySession });
            expect(proceed).toBe(true);
            expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
            expect(authStore.getSession()).toEqual(expect.objectContaining(memorySession));

            /** Simulate connectivity issue while online resuming: even though we
             * have a valid offline in-memory session, no explicit unlock happened
             * in this resume cycle: fall back to `PASSWORD_LOCKED` and let the
             * user re-unlock rather than implicitly trusting stale memory state. */
            await auth.config.onSessionFailure?.({ retryable: false, unlocked: false }, connectionError);
            expect(ctx.service.store.dispatch).not.toHaveBeenCalledWith(bootIntent({ offline: true }));
            expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
        });
    });

    describe('connectivity flap robustness', () => {
        test('should not push the first scheduled retry out indefinitely when connectivity flaps', async () => {
            ctx.status = AppStatus.OFFLINE;
            ctx.booted = true;
            /** 1. Initial schedule. `setAutoResume` is invoked via the connectivity
             * subscriber for offline-booted clients on `ONLINE` transition. */
            connectivitySubscriber?.(ConnectivityStatus.ONLINE);
            await flushAsync();

            const firstWhen = alarmState.getScheduledTime();
            expect(firstWhen).toBeDefined();
            expect(browser.alarms.create).toHaveBeenCalledTimes(1);

            /** 2. Simulate a flap: 5 ONLINE/OFFLINE transitions. Each ONLINE transition
             * would naively re-schedule and push the retry out further. The `pending`
             * guard inside `setAutoResume` must keep the original `when`. */
            for (let i = 0; i < 5; i++) {
                connectivitySubscriber?.(ConnectivityStatus.OFFLINE);
                connectivitySubscriber?.(ConnectivityStatus.ONLINE);
                await flushAsync();
            }

            expect(browser.alarms.create).toHaveBeenCalledTimes(1);
            expect(alarmState.getScheduledTime()).toBe(firstWhen);
        });

        test('should dispatch `offlineResume` once when alarm fires mid-flap on offline-booted client', async () => {
            ctx.status = AppStatus.OFFLINE;
            ctx.booted = true;

            /** 1. Bootstrap the chain via the subscriber. */
            connectivitySubscriber?.(ConnectivityStatus.ONLINE);
            await flushAsync();
            expect(browser.alarms.create).toHaveBeenCalledTimes(1);

            /** 2. Simulate flap noise around the alarm fire. */
            connectivitySubscriber?.(ConnectivityStatus.OFFLINE);
            connectivitySubscriber?.(ConnectivityStatus.ONLINE);
            await fireAlarm(SESSION_RESUME_ALARM);

            /** 3. Assert offline-resume intent dispatched. */
            expect(ctx.service.store.dispatch).toHaveBeenCalledTimes(1);
            expect(ctx.service.store.dispatch).toHaveBeenCalledWith(
                offlineResume.intent({
                    localID: authStore.getLocalID(),
                    retryable: true,
                    silence: true,
                })
            );
        });
    });

    describe('chain bounded by `SESSION_RESUME_MAX_RETRIES`', () => {
        test('should stop scheduling alarms after exhausting retries on real failures', async () => {
            ctx.status = AppStatus.IDLE;
            const errors = [genericError, offlineError, connectionError];

            for (let i = 0; i < 20; i++) {
                alarmState.clear();
                await auth.config.onSessionFailure?.({ retryable: true }, errors[i % errors.length]);
            }

            expect(browser.alarms.create).toHaveBeenCalledTimes(SESSION_RESUME_MAX_RETRIES);
        });
    });
});
