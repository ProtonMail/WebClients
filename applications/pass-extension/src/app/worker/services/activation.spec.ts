import WorkerMessageBroker, { mockHandlers } from 'proton-pass-extension/__mocks__/app/worker/channel';
import { getMockState } from 'proton-pass-extension/__mocks__/mocks';
import { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';
import { WorkerContext } from 'proton-pass-extension/app/worker/context/inject';
import type { WorkerContextInterface } from 'proton-pass-extension/app/worker/context/types';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { AuthStore } from '@proton/pass/lib/auth/store';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import type { ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import { offlineResume } from '@proton/pass/store/actions';
import type { ClientEndpoint } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types/worker/state';
import { createMemoryStore } from '@proton/pass/utils/store';

import { createActivationService } from './activation';

describe('Activation service - `CLIENT_INIT`', () => {
    let authStore: AuthStore;
    let connectivity: { -readonly [P in keyof ConnectivityService]: ConnectivityService[P] };
    let ctx: WorkerContextInterface;
    let handler: any;

    const initMessage = (sender: ClientEndpoint, tabId = 1) => ({
        type: WorkerMessageType.CLIENT_INIT,
        sender,
        payload: { tabId },
    });

    beforeEach(() => {
        jest.clearAllMocks();
        clearBrowserMocks();

        authStore = createAuthStore(createMemoryStore());
        authStore.setLocalID(123);
        exposeAuthStore(authStore);

        connectivity = {
            online: true,
            status: ConnectivityStatus.ONLINE,
            check: jest.fn().mockResolvedValue(undefined),
            subscribe: jest.fn(),
        } as any;

        ctx = {
            booted: false,
            status: AppStatus.IDLE,
            getState: jest.fn(() => ({ status: ctx.status })),
            setStatus: jest.fn((value: AppStatus) => (ctx.status = value)),
            setBooted: jest.fn(),
            service: {
                auth: {
                    init: jest.fn().mockResolvedValue(true),
                    alarms: { isResumeThrottled: jest.fn().mockResolvedValue(false) },
                    config: { authStore },
                },
                autofill: { getLoginCandidates: jest.fn(() => []) },
                connectivity,
                featureFlags: { resolve: jest.fn().mockResolvedValue({ features: {} }) },
                settings: { resolve: jest.fn().mockResolvedValue({}) },
                storage: { local: { getItem: jest.fn() } },
                store: {
                    dispatch: jest.fn(),
                    dispatchAsyncRequest: jest.fn().mockResolvedValue(undefined),
                    getState: jest.fn(() => getMockState()),
                },
            },
        } as any;

        WorkerContext.set(ctx);
        (WorkerMessageBroker.buffer.flush as jest.Mock).mockReturnValue([]);
        (WorkerMessageBroker.ports.query as jest.Mock).mockReturnValue([]);

        createActivationService();
        handler = mockHandlers.get(WorkerMessageType.CLIENT_INIT);
    });

    afterEach(() => WorkerContext.clear());

    describe('`shouldResume`', () => {
        test('should resume on stale (`IDLE`) status regardless of sender', async () => {
            ctx.status = AppStatus.IDLE;
            await handler(initMessage('contentscript'), {});
            expect(ctx.service.auth.init).toHaveBeenCalled();
        });

        test('should resume on PASSWORD_LOCKED + popup + online', async () => {
            ctx.status = AppStatus.PASSWORD_LOCKED;
            connectivity.online = true;
            await handler(initMessage('popup'), {});
            expect(ctx.service.auth.init).toHaveBeenCalled();
        });

        test('should not resume on PASSWORD_LOCKED + popup + offline', async () => {
            ctx.status = AppStatus.PASSWORD_LOCKED;
            connectivity.online = false;
            await handler(initMessage('popup'), {});
            expect(ctx.service.auth.init).not.toHaveBeenCalled();
        });

        test('should not resume on PASSWORD_LOCKED + non-popup when throttled', async () => {
            ctx.status = AppStatus.PASSWORD_LOCKED;
            (ctx.service.auth.alarms.isResumeThrottled as jest.Mock).mockResolvedValueOnce(true);
            await handler(initMessage('contentscript'), {});
            expect(ctx.service.auth.init).not.toHaveBeenCalled();
        });

        test('should resume on PASSWORD_LOCKED + non-popup when not throttled', async () => {
            ctx.status = AppStatus.PASSWORD_LOCKED;
            (ctx.service.auth.alarms.isResumeThrottled as jest.Mock).mockResolvedValueOnce(false);
            await handler(initMessage('contentscript'), {});
            expect(ctx.service.auth.init).toHaveBeenCalled();
        });

        test('should resume on ERROR + popup unconditionally', async () => {
            ctx.status = AppStatus.ERROR;
            await handler(initMessage('popup'), {});
            expect(ctx.service.auth.init).toHaveBeenCalled();
            expect(ctx.service.auth.alarms.isResumeThrottled).not.toHaveBeenCalled();
        });

        test('should defer to `isResumeThrottled` on PASSWORD_LOCKED + non-popup', async () => {
            ctx.status = AppStatus.PASSWORD_LOCKED;
            (ctx.service.auth.alarms.isResumeThrottled as jest.Mock).mockResolvedValueOnce(true);
            await handler(initMessage('contentscript'), {});
            expect(ctx.service.auth.alarms.isResumeThrottled).toHaveBeenCalled();
            expect(ctx.service.auth.init).not.toHaveBeenCalled();
        });

        test('should defer to `isResumeThrottled` on ERROR + non-popup', async () => {
            ctx.status = AppStatus.ERROR;
            (ctx.service.auth.alarms.isResumeThrottled as jest.Mock).mockResolvedValueOnce(true);
            await handler(initMessage('contentscript'), {});
            expect(ctx.service.auth.alarms.isResumeThrottled).toHaveBeenCalled();
            expect(ctx.service.auth.init).not.toHaveBeenCalled();
        });

        test('should resume on ERROR + non-popup when not throttled', async () => {
            ctx.status = AppStatus.ERROR;
            (ctx.service.auth.alarms.isResumeThrottled as jest.Mock).mockResolvedValueOnce(false);
            await handler(initMessage('contentscript'), {});
            expect(ctx.service.auth.init).toHaveBeenCalled();
        });

        test('should not resume on healthy statuses (READY)', async () => {
            ctx.status = AppStatus.READY;
            await handler(initMessage('popup'), {});
            expect(ctx.service.auth.init).not.toHaveBeenCalled();
        });

        test('should pass `retryable: false`: CLIENT_INIT must never bootstrap the alarm chain', async () => {
            ctx.status = AppStatus.IDLE;
            await handler(initMessage('popup'), {});
            expect(ctx.service.auth.init).toHaveBeenCalledWith({
                forceLock: expect.any(Boolean),
                retryable: false,
            });
        });
    });

    describe('popup-driven offline resume', () => {
        test('should dispatch `offlineResume.intent` when offline-booted and connectivity is back', async () => {
            ctx.status = AppStatus.OFFLINE;
            connectivity.online = true;
            await handler(initMessage('popup'), {});

            expect(ctx.service.store.dispatch).toHaveBeenCalledWith(
                offlineResume.intent({
                    localID: 123,
                    silence: true,
                    retryable: false,
                })
            );
        });

        test('should not dispatch when popup opens offline-booted but still offline', async () => {
            ctx.status = AppStatus.OFFLINE;
            connectivity.online = false;
            await handler(initMessage('popup'), {});
            expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
        });

        test('should not dispatch when not offline-booted', async () => {
            ctx.status = AppStatus.READY;
            connectivity.online = true;
            await handler(initMessage('popup'), {});
            expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
        });

        test('should not dispatch from non-popup senders even if offline-booted with connectivity', async () => {
            ctx.status = AppStatus.OFFLINE;
            connectivity.online = true;
            await handler(initMessage('contentscript'), {});
            expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
        });

        test('should pass `retryable: false`: popup-driven resume must NOT bootstrap the alarm chain', async () => {
            /** The alarm chain is reserved for background-driven retries. A user-initiated
             * popup open shouldn't kick off a 7-step Fibonacci retry sequence; if the
             * resume fails the user can simply close/reopen the popup. */
            ctx.status = AppStatus.OFFLINE;
            connectivity.online = true;
            await handler(initMessage('popup'), {});

            expect(ctx.service.store.dispatch).toHaveBeenCalledWith(
                offlineResume.intent({
                    localID: 123,
                    retryable: false,
                    silence: true,
                })
            );
        });
    });

    describe('popup-driven connectivity probe', () => {
        test('probes connectivity when popup wakes offline', async () => {
            ctx.status = AppStatus.READY;
            connectivity.online = false;
            await handler(initMessage('popup'), {});
            expect(connectivity.check).toHaveBeenCalledTimes(1);
        });

        test('probes regardless of AppStatus when worker reports offline connectivity', async () => {
            ctx.status = AppStatus.PASSWORD_LOCKED;
            connectivity.online = false;
            await handler(initMessage('popup'), {});
            expect(connectivity.check).toHaveBeenCalledTimes(1);
        });

        test('skips probe when popup wakes already online', async () => {
            ctx.status = AppStatus.OFFLINE;
            connectivity.online = true;
            await handler(initMessage('popup'), {});
            expect(connectivity.check).not.toHaveBeenCalled();
        });

        test('skips probe for non-popup senders even when offline', async () => {
            ctx.status = AppStatus.OFFLINE;
            connectivity.online = false;
            await handler(initMessage('contentscript'), {});
            expect(connectivity.check).not.toHaveBeenCalled();
        });

        test('post-probe online state drives the offline-resume gate', async () => {
            ctx.status = AppStatus.OFFLINE;
            connectivity.online = false;
            (connectivity.check as jest.Mock).mockImplementationOnce(async () => {
                connectivity.online = true;
                connectivity.status = ConnectivityStatus.ONLINE;
            });

            await handler(initMessage('popup'), {});
            expect(ctx.service.store.dispatch).toHaveBeenCalledWith(
                offlineResume.intent({
                    localID: 123,
                    silence: true,
                    retryable: false,
                })
            );
        });
    });
});
