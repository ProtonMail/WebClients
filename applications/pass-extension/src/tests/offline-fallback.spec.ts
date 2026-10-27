/**
 * @jest-environment-options {"abortSignal": true}
 */
import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import { bootIntent, offlineResume } from '@proton/pass/store/actions/creators/client';
import type { Maybe } from '@proton/pass/types/utils';
import { AppStatus } from '@proton/pass/types/worker/state';
import {
    BACKEND_FAILURES,
    createTestBackend,
    getSessionResumeHandlers,
    respond,
} from '@proton/pass/utils/tests/backend';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/utils/tests/fixtures/crypto';
import type { TestPersistedSession } from '@proton/pass/utils/tests/fixtures/session';
import {
    TEST_OFFLINE_PASSWORD,
    createTestOfflineComponents,
    createTestPersistedSession,
    createTestSession,
} from '@proton/pass/utils/tests/fixtures/session';
import { RETRY_ATTEMPTS_MAX } from '@proton/shared/lib/constants';

import browser from '../__mocks__/webextension-polyfill';
import { SESSION_RESUME_ALARM } from '../app/worker/services/auth/auth.alarms';
import { setupAuthWorker } from './auth';

jest.mock('../app/worker/channel');

const SESSION_RESUME_ROUTES = ['auth/v4/sessions/local/key', 'core/v4/users'];

/** API contract for `POST /auth/refresh`: only these statuses mean "log in again" */
const REFRESH_INVALID_STATUSES = [400, 401, 422];
const REFRESH_FAILURES = BACKEND_FAILURES.filter(
    ({ status }) => status === null || !REFRESH_INVALID_STATUSES.includes(status)
);

describe('Offline fallback on backend errors', () => {
    const backend = createTestBackend();
    let persisted: TestPersistedSession;

    const setup = () => {
        const worker = setupAuthWorker(persisted);
        backend.use(...getSessionResumeHandlers(persisted));
        return worker;
    };

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        persisted = await createTestPersistedSession(createTestSession(await createTestOfflineComponents()));
    });

    afterAll(releaseCryptoProxy);

    /** `updateServerTime` keeps the latest server time module-wide: the fake clock must never
     * go back between tests, or every response looks older than the last one and is ignored */
    let clock = Date.now();

    beforeEach(() => jest.useFakeTimers({ now: clock, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }));

    afterEach(() => {
        clock = Date.now();
        jest.useRealTimers();
    });

    describe('Service worker start', () => {
        test('healthy backend resumes the session and boots online', async () => {
            const { ctx, local, start } = setup();
            await start();

            expect(ctx.status).toBe(AppStatus.READY);
            expect(ctx.service.store.dispatch).toHaveBeenCalledWith(bootIntent({ offline: false }));
            expect(await local.getItem('ps')).toBe(persisted.encrypted);
        });

        test('an invalidated session logs out and clears the local data', async () => {
            const { ctx, local, start } = setup();
            backend.on('get', 'core/v4/users', () => respond.error(401, { Code: PassErrorCode.SESSION_ERROR }));
            await start();

            expect(ctx.status).toBe(AppStatus.UNAUTHORIZED);
            expect(await local.getItem('ps')).toBeNull();
        });

        describe.each(SESSION_RESUME_ROUTES)('%s failing', (route) => {
            test.each(BACKEND_FAILURES)('$label keeps the session and offers the offline unlock', async (failure) => {
                const { ctx, local, start } = setup();
                backend.on('get', route, failure.respond);
                await start();

                expect(ctx.status).toBe(AppStatus.PASSWORD_LOCKED);
                expect(await local.getItem('ps')).toBe(persisted.encrypted);
                expect(browser.alarms.create).toHaveBeenCalledWith(SESSION_RESUME_ALARM, expect.anything());
                expect(backend.countRequests(route)).toBeLessThanOrEqual(RETRY_ATTEMPTS_MAX);
            });
        });

        describe('expired access token', () => {
            const setupExpiredToken = () => {
                const worker = setup();
                backend.on('get', 'core/v4/users', () => respond.error(401));
                return worker;
            };

            test.each(REFRESH_INVALID_STATUSES)(
                'refresh %s invalidates the session and clears the local data',
                async (status) => {
                    const { ctx, local, start } = setupExpiredToken();
                    backend.on('post', 'auth/refresh', () => respond.error(status));
                    await start();

                    expect(ctx.status).toBe(AppStatus.UNAUTHORIZED);
                    expect(await local.getItem('ps')).toBeNull();
                }
            );

            test.each(REFRESH_FAILURES)(
                'refresh $label keeps the session and offers the offline unlock',
                async (failure) => {
                    const { ctx, local, start } = setupExpiredToken();
                    backend.on('post', 'auth/refresh', failure.respond);
                    await start();

                    expect(ctx.status).toBe(AppStatus.PASSWORD_LOCKED);
                    expect(await local.getItem('ps')).toBe(persisted.encrypted);
                    expect(browser.alarms.create).toHaveBeenCalledWith(SESSION_RESUME_ALARM, expect.anything());
                    expect(backend.countRequests('auth/refresh')).toBeLessThanOrEqual(RETRY_ATTEMPTS_MAX);
                }
            );
        });

        test('a short retry-after is honoured before resuming online', async () => {
            const { auth, ctx } = setup();
            let userRequests = 0;
            backend.on('get', 'core/v4/users', () =>
                ++userRequests === 1
                    ? respond.error(429, {}, { 'retry-after': '5' })
                    : respond.ok({ User: { ID: persisted.session.UserID, Keys: [] } })
            );

            const init = auth.init({ forceLock: false, retryable: true });
            await jest.advanceTimersByTimeAsync(4_900);
            expect(userRequests).toBe(1);

            await jest.advanceTimersByTimeAsync(200);
            await init;
            expect(userRequests).toBe(2);
            expect(ctx.status).toBe(AppStatus.READY);
        });
    });

    describe('Offline unlock during an outage', () => {
        const setupOutage = async () => {
            const worker = setup();
            backend.on('get', 'core/v4/users', () => respond.error(503));
            await worker.start();
            return worker;
        };

        test('the offline password boots offline and keeps the offline components', async () => {
            const { ctx, getPersistedSession, unlock } = await setupOutage();
            await unlock(TEST_OFFLINE_PASSWORD);

            expect(ctx.service.store.dispatch).toHaveBeenCalledWith(bootIntent({ offline: true }));
            expect(await getPersistedSession()).toMatchObject({
                offlineConfig: persisted.session.offlineConfig,
                offlineVerifier: persisted.session.offlineVerifier,
                unlockRetryCount: 0,
            });
        });

        test('a wrong password is rejected without booting nor clearing the local data', async () => {
            const { ctx, getPersistedSession, unlock } = await setupOutage();
            await expect(unlock('wrong-password')).rejects.toThrow();

            expect(ctx.status).toBe(AppStatus.PASSWORD_LOCKED);
            expect(ctx.service.store.dispatch).not.toHaveBeenCalledWith(bootIntent({ offline: true }));
            expect(await getPersistedSession()).toMatchObject({
                offlineVerifier: persisted.session.offlineVerifier,
                unlockRetryCount: 1,
            });
        });
    });

    describe('Sustained outage', () => {
        /** A 200 with a non-JSON body is left out: its parse error carries no status, so it
         * never counts toward the API failure threshold. Connectivity stays `ONLINE` and every
         * auto-resume alarm retries a full session resume. */
        const DOWNTIME_FAILURES = BACKEND_FAILURES.filter(({ status }) => status !== null && status !== 200);
        const OFFLINE_FAILURES = BACKEND_FAILURES.filter(({ status }) => status === null);

        test.each(DOWNTIME_FAILURES)(
            '$label on every route reads as downtime after the resume retry, then stops retrying',
            async (failure) => {
                const { alarms, ctx, local, start } = setup();
                backend.on('all', '*', failure.respond);
                await start();
                await alarms.fire(SESSION_RESUME_ALARM);

                expect(ctx.status).toBe(AppStatus.PASSWORD_LOCKED);
                expect(ctx.service.connectivity.status).toBe(ConnectivityStatus.DOWNTIME);
                expect(await local.getItem('ps')).toBe(persisted.encrypted);

                const userRequests = backend.countRequests('core/v4/users');
                await alarms.fire(SESSION_RESUME_ALARM);

                expect(backend.countRequests('core/v4/users')).toBe(userRequests);
                expect(alarms.getScheduledTime(SESSION_RESUME_ALARM)).toBeDefined();
            }
        );

        test.each(OFFLINE_FAILURES)(
            '$label on every route reads as offline and stops the resume chain',
            async (failure) => {
                const { alarms, ctx, local, start } = setup();
                backend.on('all', '*', failure.respond);
                await start();

                expect(ctx.status).toBe(AppStatus.PASSWORD_LOCKED);
                expect(ctx.service.connectivity.status).toBe(ConnectivityStatus.OFFLINE);
                expect(await local.getItem('ps')).toBe(persisted.encrypted);

                const userRequests = backend.countRequests('core/v4/users');
                await alarms.fire(SESSION_RESUME_ALARM);

                expect(backend.countRequests('core/v4/users')).toBe(userRequests);
                expect(alarms.getScheduledTime(SESSION_RESUME_ALARM)).toBeUndefined();
            }
        );
    });

    describe('Service worker wake-up after an offline unlock', () => {
        let navigatorOnline: Maybe<jest.SpyInstance>;
        afterEach(() => navigatorOnline?.mockRestore());

        const setupOfflineUnlocked = async () => {
            const worker = setup();
            backend.on('all', '*', () => respond.error(503));
            await worker.start();
            await worker.unlock(TEST_OFFLINE_PASSWORD);
            return worker;
        };

        test('device offline: boots offline right away without resuming the session', async () => {
            const worker = await setupOfflineUnlocked();
            navigatorOnline = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
            const { ctx, local, start } = worker.restart();
            backend.requests.length = 0;
            await start();

            expect(ctx.status).toBe(AppStatus.OFFLINE);
            expect(ctx.service.store.dispatch).toHaveBeenCalledWith(bootIntent({ offline: true }));
            expect(backend.requests.filter((request) => request !== 'tests/ping')).toEqual([]);
            expect(await local.getItem('ps')).not.toBeNull();
        });

        test('device online, backend down: asks for the offline password again, nothing wiped', async () => {
            const worker = await setupOfflineUnlocked();
            const { ctx, getPersistedSession, start } = worker.restart();
            await start();

            expect(ctx.status).toBe(AppStatus.PASSWORD_LOCKED);
            expect(ctx.service.store.dispatch).not.toHaveBeenCalledWith(bootIntent({ offline: true }));
            expect(await getPersistedSession()).toMatchObject({
                offlineConfig: persisted.session.offlineConfig,
                offlineVerifier: persisted.session.offlineVerifier,
            });
        });
    });

    describe('Running app', () => {
        const BUSINESS_REQUESTS = [
            { label: 'event polling', method: 'get', route: 'pass/v1/share' },
            { label: 'item write', method: 'post', route: 'pass/v1/share/test-share-id/item' },
        ] as const;

        const setupRunning = async () => {
            const worker = setup();
            await worker.start();
            return worker;
        };

        test('an invalidated session logs out and clears the local data', async () => {
            const { ctx, local, request } = await setupRunning();
            backend.on('get', 'pass/v1/share', () => respond.error(401, { Code: PassErrorCode.SESSION_ERROR }));
            await request('get', 'pass/v1/share');

            expect(ctx.status).toBe(AppStatus.UNAUTHORIZED);
            expect(await local.getItem('ps')).toBeNull();
        });

        describe.each(BUSINESS_REQUESTS)('$label failing', ({ method, route }) => {
            test.each(BACKEND_FAILURES)('$label keeps the app running and the session', async (failure) => {
                const { ctx, local, request } = await setupRunning();
                backend.on(method, route, failure.respond);
                await request(method, route);

                expect(backend.countRequests(route)).toBeGreaterThan(0);
                expect(ctx.status).toBe(AppStatus.READY);
                expect(ctx.authStore.hasSession()).toBe(true);
                expect(await local.getItem('ps')).toBe(persisted.encrypted);
            });

            test.each(REFRESH_FAILURES)(
                'expired access token, refresh $label keeps the app running and the session',
                async (failure) => {
                    const { ctx, local, request } = await setupRunning();
                    backend.on(method, route, () => respond.error(401));
                    backend.on('post', 'auth/refresh', failure.respond);
                    await request(method, route);

                    expect(backend.countRequests('auth/refresh')).toBeGreaterThan(0);
                    expect(ctx.status).toBe(AppStatus.READY);
                    expect(ctx.authStore.hasSession()).toBe(true);
                    expect(await local.getItem('ps')).toBe(persisted.encrypted);
                }
            );
        });
    });

    describe('Recovery', () => {
        test('an offline-booted worker resumes online once the backend is back', async () => {
            const { alarms, ctx, start, unlock } = setup();
            backend.on('all', '*', () => respond.error(503));
            await start();
            await unlock(TEST_OFFLINE_PASSWORD);

            expect(ctx.status).toBe(AppStatus.OFFLINE);
            expect(ctx.service.connectivity.status).toBe(ConnectivityStatus.DOWNTIME);
            expect(alarms.getScheduledTime(SESSION_RESUME_ALARM)).toBeUndefined();

            backend.reset();
            backend.use(...getSessionResumeHandlers(persisted));
            await jest.advanceTimersByTimeAsync(120_000);

            const getResumes = () =>
                ctx.service.store.dispatch.mock.calls.filter(([action]: any) => offlineResume.intent.match(action));

            expect(ctx.service.connectivity.status).toBe(ConnectivityStatus.ONLINE);
            expect(alarms.getScheduledTime(SESSION_RESUME_ALARM)).toBeDefined();
            expect(getResumes()).toHaveLength(0);

            await alarms.fire(SESSION_RESUME_ALARM);

            expect(getResumes()).toHaveLength(1);
            expect(getResumes()[0][0].payload).toMatchObject({ retryable: true });
        });
    });
});
