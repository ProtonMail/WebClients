/**
 * @jest-environment-options {"abortSignal": true}
 */
import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { bootIntent } from '@proton/pass/store/actions/creators/client';
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

    beforeEach(() => jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }));
    afterEach(() => jest.useRealTimers());

    describe('Service worker start', () => {
        test('healthy backend resumes the session and boots online', async () => {
            const { ctx, local, start } = setup();
            await start();

            expect(ctx.status).toBe(AppStatus.AUTHORIZED);
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
            expect(ctx.status).toBe(AppStatus.AUTHORIZED);
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
});
