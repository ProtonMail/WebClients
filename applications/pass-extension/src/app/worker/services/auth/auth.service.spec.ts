import WorkerMessageBroker, { mockHandlers } from 'proton-pass-extension/__mocks__/app/worker/channel';
import { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';
import { WorkerContext } from 'proton-pass-extension/app/worker/context/inject';
import type { WorkerContextInterface } from 'proton-pass-extension/app/worker/context/types';
import * as permissionUtils from 'proton-pass-extension/lib/utils/permissions';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import { createAuthStore } from '@proton/pass/lib/auth/store';
import type { ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import { bootIntent, offlineResume } from '@proton/pass/store/actions';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { Api } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { AppStatus } from '@proton/pass/types/worker/state';
import { createMemoryStore } from '@proton/pass/utils/store';
import { createOfflineError } from '@proton/shared/lib/fetch/ApiError';

import type { ExtensionAuthService } from './auth.service';
import { createAuthService } from './auth.service';

jest.mock('proton-pass-extension/lib/utils/permissions');
const permissions = permissionUtils as jest.MockedObject<typeof permissionUtils>;

describe('Extension AuthService', () => {
    let api: Api;
    let authStore: AuthStore;
    let connectivity: { -readonly [P in keyof ConnectivityService]: ConnectivityService[P] };
    let ctx: WorkerContextInterface;
    let featureFlags: FeatureFlagState = {};

    beforeEach(() => {
        jest.clearAllMocks();
        clearBrowserMocks();

        api = jest.fn() as unknown as Api;
        api.subscribe = jest.fn();
        api.idle = jest.fn().mockResolvedValue(undefined);
        authStore = createAuthStore(createMemoryStore());

        connectivity = {
            online: true,
            status: ConnectivityStatus.ONLINE,
            check: jest.fn().mockResolvedValue(undefined),
            subscribe: jest.fn(),
        } as any;

        featureFlags = { [PassFeature.PassExtensionOfflineV1]: true };

        ctx = {
            booted: false,
            status: AppStatus.IDLE,
            getState: jest.fn(() => ({ status: ctx.status, booted: ctx.booted })),
            setBooted: jest.fn((value: boolean) => (ctx.booted = value)),
            setStatus: jest.fn((value: AppStatus) => (ctx.status = value)),
            service: {
                activation: { boot: jest.fn() },
                apiProxy: { clear: jest.fn().mockResolvedValue(undefined) },
                autofill: { clear: jest.fn() },
                connectivity,
                featureFlags: { resolve: jest.fn().mockResolvedValue({ features: featureFlags }) },
                formTracker: { clear: jest.fn() },
                logger: { clear: jest.fn().mockResolvedValue(undefined) },
                nativeMessaging: { disconnect: jest.fn() },
                settings: { clear: jest.fn().mockResolvedValue(undefined) },
                spotlight: { reset: jest.fn() },
                storage: {
                    local: {
                        clear: jest.fn().mockResolvedValue(undefined),
                        getItem: jest.fn().mockResolvedValue(undefined),
                        removeItem: jest.fn(),
                        setItem: jest.fn(),
                        setItems: jest.fn(),
                    },
                    session: {
                        clear: jest.fn().mockResolvedValue(undefined),
                        getItems: jest.fn().mockResolvedValue({}),
                        removeItem: jest.fn(),
                        removeItems: jest.fn(),
                        setItems: jest.fn(),
                    },
                },
                store: { dispatch: jest.fn() },
                telemetry: { stop: jest.fn() },
            },
        } as any;

        WorkerContext.set(ctx);
    });

    afterEach(() => {
        WorkerContext.clear();
    });

    describe('Lifecycle hooks', () => {
        let auth: ExtensionAuthService;

        beforeEach(() => {
            auth = createAuthService(api, authStore);
            jest.spyOn(auth.alarms, 'clearAutoResume').mockResolvedValue(undefined);
            jest.spyOn(auth.alarms, 'clearAutoLock').mockResolvedValue(undefined);
            jest.spyOn(auth.alarms, 'scheduleAutoResume').mockResolvedValue(undefined);
            jest.spyOn(auth.alarms, 'registerResumeFailure').mockResolvedValue(undefined);
            jest.spyOn(auth.alarms, 'resetAutoResume');
            auth.resumeSession = jest.fn().mockResolvedValue(false);
            ctx.service.auth = auth;
        });

        describe('`onInit`', () => {
            test('should clear auto-resume and auto-lock alarms', async () => {
                ctx.status = AppStatus.UNAUTHORIZED;
                await auth.config.onInit?.({});
                expect(auth.alarms.clearAutoResume).toHaveBeenCalled();
                expect(auth.alarms.clearAutoLock).toHaveBeenCalled();
            });

            test('should not resume on early-return statuses', async () => {
                ctx.status = AppStatus.UNAUTHORIZED;
                await auth.config.onInit?.({});
                expect(auth.resumeSession).not.toHaveBeenCalled();
            });

            test('should resume when status proceeds', async () => {
                ctx.status = AppStatus.IDLE;
                await auth.config.onInit?.({});
                expect(auth.resumeSession).toHaveBeenCalled();
            });
        });

        describe('`onLocked`', () => {
            const setOfflineComponents = () => {
                authStore.setOfflineConfig({} as any);
                authStore.setOfflineVerifier('test-verifier');
            };

            test('should set `PASSWORD_LOCKED` when offline + components + flag ON', async () => {
                connectivity.online = false;
                setOfflineComponents();
                await auth.config.onLocked?.(LockMode.SESSION, undefined, false);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
            });

            test('should NOT set `PASSWORD_LOCKED` when flag is OFF, even with components + offline', async () => {
                featureFlags.PassExtensionOfflineV1 = false;
                connectivity.online = false;
                setOfflineComponents();
                await auth.config.onLocked?.(LockMode.SESSION, undefined, false);
                expect(ctx.setStatus).not.toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.SESSION_LOCKED);
            });

            test('should fall back to lock-mode status when online (regardless of flag)', async () => {
                connectivity.online = true;
                setOfflineComponents();
                await auth.config.onLocked?.(LockMode.SESSION, undefined, false);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.SESSION_LOCKED);
            });

            test('should reset the resume-scheduler state so post-unlock resumes are not throttled', async () => {
                const resetAutoResume = jest.spyOn(auth.alarms, 'resetAutoResume').mockResolvedValue(undefined);
                await auth.config.onLocked?.(LockMode.SESSION, undefined, false);
                expect(resetAutoResume).toHaveBeenCalled();
            });
        });

        describe('`onLockUpdate`', () => {
            beforeEach(() => {
                jest.spyOn(auth.alarms, 'setAutoLock').mockResolvedValue(undefined);
            });

            test('should clear the auto-lock alarm before any rearm', async () => {
                await auth.config.onLockUpdate?.({ mode: LockMode.SESSION, locked: false, ttl: 600 }, undefined, false);
                expect(auth.alarms.clearAutoLock).toHaveBeenCalled();
            });

            test('should NOT call `setAutoLock` when `LockMode.NONE`', async () => {
                ctx.status = AppStatus.READY;
                ctx.booted = true;
                await auth.config.onLockUpdate?.({ mode: LockMode.NONE, locked: false }, undefined, false);
                expect(auth.alarms.setAutoLock).not.toHaveBeenCalled();
            });

            test('should call `setAutoLock(ttl)` when booted with a valid mode + ttl', async () => {
                ctx.status = AppStatus.READY;
                ctx.booted = true;
                await auth.config.onLockUpdate?.({ mode: LockMode.SESSION, locked: false, ttl: 600 }, undefined, false);
                expect(auth.alarms.setAutoLock).toHaveBeenCalledWith(600);
            });

            test('should NOT call `setAutoLock` when not booted', async () => {
                ctx.status = AppStatus.IDLE;
                ctx.booted = false;
                await auth.config.onLockUpdate?.({ mode: LockMode.SESSION, locked: false, ttl: 600 }, undefined, false);
                expect(auth.alarms.setAutoLock).not.toHaveBeenCalled();
            });

            test('should NOT call `setAutoLock` when `ttl` is missing', async () => {
                ctx.status = AppStatus.READY;
                ctx.booted = true;
                await auth.config.onLockUpdate?.({ mode: LockMode.SESSION, locked: false }, undefined, false);
                expect(auth.alarms.setAutoLock).not.toHaveBeenCalled();
            });
        });

        describe('`onLoginStart`', () => {
            test('should clear auto-resume alarm', async () => {
                await auth.config.onLoginStart?.();
                expect(auth.alarms.clearAutoResume).toHaveBeenCalled();
            });

            test('should set `AUTHORIZING` status when not booted', async () => {
                ctx.booted = false;
                await auth.config.onLoginStart?.();
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.AUTHORIZING);
            });

            test('should not set status when already booted', async () => {
                ctx.booted = true;
                await auth.config.onLoginStart?.();
                expect(ctx.setStatus).not.toHaveBeenCalled();
            });
        });

        describe('`onLoginComplete`', () => {
            test('should set `AUTHORIZED` status and trigger boot when not booted', async () => {
                ctx.booted = false;
                await auth.config.onLoginComplete?.('userId', undefined);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.AUTHORIZED);
                expect(ctx.service.store.dispatch).toHaveBeenCalledWith(bootIntent({ offline: false }));
            });

            test('should set `READY` status and skip boot dispatch when already booted', async () => {
                ctx.booted = true;
                await auth.config.onLoginComplete?.('userId', undefined);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.READY);
                expect(ctx.setStatus).not.toHaveBeenCalledWith(AppStatus.AUTHORIZED);
                expect(ctx.service.store.dispatch).not.toHaveBeenCalledWith(bootIntent({ offline: false }));
            });

            test('should reset auto-resume count on successful login regardless of booted state', async () => {
                ctx.booted = false;
                await auth.config.onLoginComplete?.('userId', undefined);
                expect(auth.alarms.resetAutoResume).toHaveBeenCalled();

                jest.clearAllMocks();

                ctx.booted = true;
                await auth.config.onLoginComplete?.('userId', undefined);
                expect(auth.alarms.resetAutoResume).toHaveBeenCalled();
                expect(auth.alarms.clearAutoResume).toHaveBeenCalled();
            });
        });

        describe('`onLogoutComplete`', () => {
            test('should clear both alarms and reset auto-resume count', () => {
                auth.config.onLogoutComplete?.('userId', undefined, false);
                expect(auth.alarms.clearAutoResume).toHaveBeenCalled();
                expect(auth.alarms.clearAutoLock).toHaveBeenCalled();
                expect(auth.alarms.resetAutoResume).toHaveBeenCalled();
            });

            test('should set `UNAUTHORIZED` status and clear booted flag', () => {
                auth.config.onLogoutComplete?.('userId', undefined, false);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.UNAUTHORIZED);
                expect(ctx.setBooted).toHaveBeenCalledWith(false);
            });
        });

        describe('`onResumeStart`', () => {
            beforeEach(() => {
                auth.config.onSessionEmpty = jest.fn();
                auth.config.onSessionFailure = jest.fn();
                auth.config.onNotification = jest.fn();
            });

            test('should proceed when permissions are available', async () => {
                permissions.hasHostPermissions.mockResolvedValueOnce(true);
                const result = await auth.config.onResumeStart?.({ hasSession: true, memorySession: {} });

                expect(result).toBe(true);
                expect(auth.config.onSessionEmpty).not.toHaveBeenCalled();
                expect(auth.config.onSessionFailure).not.toHaveBeenCalled();
            });

            test('should handle missing permissions with no session', async () => {
                permissions.hasHostPermissions.mockResolvedValueOnce(false);
                const result = await auth.config.onResumeStart?.({ hasSession: false, memorySession: {} });

                expect(result).toBe(false);
                expect(auth.config.onSessionEmpty).toHaveBeenCalled();
                expect(auth.config.onNotification).toHaveBeenCalledWith({
                    type: 'error',
                    key: NotificationKey.EXT_PERMISSIONS,
                    text: '',
                });
            });

            test('should handle missing permissions with existing session', async () => {
                permissions.hasHostPermissions.mockResolvedValueOnce(false);
                const result = await auth.config.onResumeStart?.({ hasSession: true, memorySession: {} });

                expect(result).toBe(false);
                expect(auth.config.onSessionFailure).toHaveBeenCalledWith({ retryable: false }, null);
                expect(auth.config.onNotification).toHaveBeenCalledWith({
                    type: 'error',
                    key: NotificationKey.EXT_PERMISSIONS,
                    text: '',
                });
            });

            test('should restore offline session and boot when offline with valid offline session and not booted', async () => {
                permissions.hasHostPermissions.mockResolvedValueOnce(true);
                connectivity.online = false;
                ctx.booted = false;

                const memorySession = { UID: 'test-uid', UserID: 'test-user-id', offlineKD: 'test-offline-kd' };
                const result = await auth.config.onResumeStart?.({ hasSession: true, memorySession });

                expect(result).toBe(false);
                expect(ctx.service.store.dispatch).toHaveBeenCalledWith(bootIntent({ offline: true }));
            });

            test('should proceed normally when online even with valid offline session', async () => {
                permissions.hasHostPermissions.mockResolvedValueOnce(true);
                connectivity.online = true;
                ctx.booted = false;

                const memorySession = { UID: 'test-uid', UserID: 'test-user-id', offlineKD: 'test-offline-kd' };
                const result = await auth.config.onResumeStart?.({ hasSession: true, memorySession });

                expect(result).toBe(true);
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
            });

            test('should proceed normally when already booted', async () => {
                permissions.hasHostPermissions.mockResolvedValueOnce(true);
                connectivity.online = false;
                ctx.booted = true;

                const memorySession = { UID: 'test-uid', UserID: 'test-user-id', offlineKD: 'test-offline-kd' };
                const result = await auth.config.onResumeStart?.({ hasSession: true, memorySession });

                expect(result).toBe(true);
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
            });

            test('should proceed normally when no valid offline session', async () => {
                permissions.hasHostPermissions.mockResolvedValueOnce(true);
                connectivity.online = false;
                ctx.booted = false;

                const memorySession = { UID: 'test-uid' };
                const result = await auth.config.onResumeStart?.({ hasSession: true, memorySession });

                expect(result).toBe(true);
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
            });

            test('should NOT offline-boot when flag is OFF, even with valid offline session + offline', async () => {
                permissions.hasHostPermissions.mockResolvedValueOnce(true);
                featureFlags.PassExtensionOfflineV1 = false;
                connectivity.online = false;
                ctx.booted = false;

                const memorySession = { UID: 'test-uid', UserID: 'test-user-id', offlineKD: 'test-offline-kd' };
                const result = await auth.config.onResumeStart?.({ hasSession: true, memorySession });

                expect(result).toBe(true);
                expect(ctx.service.store.dispatch).not.toHaveBeenCalledWith(bootIntent({ offline: true }));
            });

            test('should set `PASSWORD_LOCKED` instead of offline-booting when force-locked', async () => {
                permissions.hasHostPermissions.mockResolvedValueOnce(true);
                connectivity.online = false;
                ctx.booted = false;
                (ctx.service.storage.local.getItem as jest.Mock).mockImplementation(async (key: string) =>
                    key === 'forceLock' ? true : undefined
                );

                const memorySession = { UID: 'test-uid', UserID: 'test-user-id', offlineKD: 'test-offline-kd' };
                const result = await auth.config.onResumeStart?.({ hasSession: true, memorySession });

                expect(result).toBe(false);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
                expect(ctx.service.store.dispatch).not.toHaveBeenCalledWith(bootIntent({ offline: true }));
            });

            test('should offline-boot normally when not force-locked', async () => {
                permissions.hasHostPermissions.mockResolvedValueOnce(true);
                connectivity.online = false;
                ctx.booted = false;

                const memorySession = { UID: 'test-uid', UserID: 'test-user-id', offlineKD: 'test-offline-kd' };
                const result = await auth.config.onResumeStart?.({ hasSession: true, memorySession });

                expect(result).toBe(false);
                expect(ctx.service.store.dispatch).toHaveBeenCalledWith(bootIntent({ offline: true }));
                expect(ctx.setStatus).not.toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
            });
        });

        describe('`onUnlocked`', () => {
            beforeEach(() => {
                auth.resumeSession = jest.fn() as any;
                auth.login = jest.fn();
            });

            test('should handle SESSION lock mode with valid session', async () => {
                ctx.status = AppStatus.SESSION_LOCKED;
                authStore.setSession({
                    UID: 'test-uid',
                    UserID: 'test-user-id',
                    keyPassword: 'test-password',
                    AccessToken: 'test-token',
                    RefreshToken: 'test-refresh',
                });

                await auth.config.onUnlocked?.(LockMode.SESSION, undefined, undefined, false);
                expect(auth.login).toHaveBeenCalledWith(authStore.getSession(), { unlocked: true });
                expect(auth.resumeSession).not.toHaveBeenCalled();
            });

            test('should handle SESSION lock mode with invalid session', async () => {
                ctx.status = AppStatus.SESSION_LOCKED;
                authStore.clear();

                await auth.config.onUnlocked?.(LockMode.SESSION, undefined, 123, false);
                expect(auth.resumeSession).toHaveBeenCalledWith(123, { retryable: false, unlocked: true });
                expect(auth.login).not.toHaveBeenCalled();
            });

            test('should handle PASSWORD lock mode', async () => {
                ctx.status = AppStatus.PASSWORD_LOCKED;

                await auth.config.onUnlocked?.(LockMode.PASSWORD, undefined, undefined, true);
                expect(ctx.service.store.dispatch).toHaveBeenCalledWith(bootIntent({ offline: true }));
                expect(auth.resumeSession).not.toHaveBeenCalled();
            });

            test('should not do anything when already booted', async () => {
                ctx.status = AppStatus.READY;

                await auth.config.onUnlocked?.(LockMode.SESSION, undefined, undefined, false);
                expect(auth.login).not.toHaveBeenCalled();
                expect(auth.resumeSession).not.toHaveBeenCalled();
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
            });

            test('should resume online when PASSWORD-locked and connectivity is available', async () => {
                ctx.status = AppStatus.PASSWORD_LOCKED;
                await auth.config.onUnlocked?.(LockMode.PASSWORD, undefined, 123, false);
                expect(auth.resumeSession).toHaveBeenCalledWith(123, { retryable: false, unlocked: true });
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
            });
        });

        describe('`onSessionFailure`', () => {
            const connectionError = { status: 503 };
            const genericError = new Error('test');

            const setOfflineComponents = (offlineKD?: string) => {
                authStore.setOfflineConfig({} as any);
                authStore.setOfflineVerifier('test-verifier');
                authStore.setOfflineKD(offlineKD);
            };

            test('should set `PASSWORD_LOCKED` on connection error with offline components and not unlocked', async () => {
                ctx.status = AppStatus.IDLE;
                setOfflineComponents();
                await auth.config.onSessionFailure?.({ retryable: false }, connectionError);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
                expect(ctx.setBooted).toHaveBeenCalledWith(false);
            });

            test('should set `ERROR` on connection error without offline components', async () => {
                ctx.status = AppStatus.IDLE;
                await auth.config.onSessionFailure?.({ retryable: false }, connectionError);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.ERROR);
                expect(ctx.setBooted).toHaveBeenCalledWith(false);
            });

            test('should set `ERROR` on non-connection error regardless of offline components', async () => {
                ctx.status = AppStatus.IDLE;
                setOfflineComponents();
                await auth.config.onSessionFailure?.({ retryable: false }, genericError);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.ERROR);
                expect(ctx.setBooted).toHaveBeenCalledWith(false);
            });

            test('should fallback to offline boot when connection error + offline components + unlocked + valid offline session', async () => {
                ctx.status = AppStatus.IDLE;
                setOfflineComponents('test-offlineKD-after-unlock');
                authStore.setSession({ UID: 'test-uid', UserID: 'test-user-id' } as any);
                await auth.config.onSessionFailure?.({ retryable: false, unlocked: true }, connectionError);
                expect(ctx.service.store.dispatch).toHaveBeenCalledWith(bootIntent({ offline: true }));
                expect(ctx.setStatus).not.toHaveBeenCalled();
                expect(ctx.setBooted).not.toHaveBeenCalled();
            });

            test('should NOT offline-boot when `unlocked: true` but offline session is invalid (missing offlineKD)', async () => {
                ctx.status = AppStatus.IDLE;
                setOfflineComponents();
                authStore.setSession({ UID: 'test-uid', UserID: 'test-user-id' } as any);
                await auth.config.onSessionFailure?.({ retryable: false, unlocked: true }, connectionError);
                expect(ctx.service.store.dispatch).not.toHaveBeenCalledWith(bootIntent({ offline: true }));
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
                expect(ctx.setBooted).toHaveBeenCalledWith(false);
            });

            test('should NOT offline-boot when offline session is valid but `unlocked` flag is missing', async () => {
                ctx.status = AppStatus.IDLE;
                setOfflineComponents('test-offlineKD-after-unlock');
                authStore.setSession({ UID: 'test-uid', UserID: 'test-user-id' } as any);
                await auth.config.onSessionFailure?.({ retryable: false }, connectionError);
                expect(ctx.service.store.dispatch).not.toHaveBeenCalledWith(bootIntent({ offline: true }));
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
            });

            test('should not mutate status when already offline-booted', async () => {
                ctx.status = AppStatus.OFFLINE;
                await auth.config.onSessionFailure?.({ retryable: false }, connectionError);
                expect(ctx.setStatus).not.toHaveBeenCalled();
                expect(ctx.setBooted).not.toHaveBeenCalled();
            });

            test('should still schedule auto-resume when offline-booted and `retryable`', async () => {
                ctx.status = AppStatus.OFFLINE;
                await auth.config.onSessionFailure?.({ retryable: true }, connectionError);
                expect(auth.alarms.scheduleAutoResume).toHaveBeenCalled();
            });

            test('should schedule auto-resume when `retryable`', async () => {
                ctx.status = AppStatus.IDLE;
                await auth.config.onSessionFailure?.({ retryable: true }, genericError);
                expect(auth.alarms.scheduleAutoResume).toHaveBeenCalled();
            });

            test('should not schedule auto-resume when `retryable: false`', async () => {
                ctx.status = AppStatus.IDLE;
                await auth.config.onSessionFailure?.({ retryable: false }, genericError);
                expect(auth.alarms.scheduleAutoResume).not.toHaveBeenCalled();
            });

            test('should call registerResumeFailure (not scheduleAutoResume) when retryable: false', async () => {
                ctx.status = AppStatus.IDLE;
                await auth.config.onSessionFailure?.({ retryable: false }, genericError);
                expect(auth.alarms.registerResumeFailure).toHaveBeenCalled();
                expect(auth.alarms.scheduleAutoResume).not.toHaveBeenCalled();
            });

            test('should land in `ERROR` (not PASSWORD_LOCKED) on connection error when flag is OFF', async () => {
                ctx.status = AppStatus.IDLE;
                featureFlags.PassExtensionOfflineV1 = false;
                setOfflineComponents();
                await auth.config.onSessionFailure?.({ retryable: false }, connectionError);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.ERROR);
                expect(ctx.setStatus).not.toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
            });

            test('should NOT offline-boot when flag is OFF, even with components + unlocked + connection error', async () => {
                ctx.status = AppStatus.IDLE;
                featureFlags.PassExtensionOfflineV1 = false;
                setOfflineComponents();
                await auth.config.onSessionFailure?.({ retryable: false, unlocked: true }, connectionError);
                expect(ctx.service.store.dispatch).not.toHaveBeenCalledWith(bootIntent({ offline: true }));
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.ERROR);
            });

            test('should always burn a resume-retry slot regardless of error type', async () => {
                ctx.status = AppStatus.IDLE;

                await auth.config.onSessionFailure?.({ retryable: true }, createOfflineError({}));
                await auth.config.onSessionFailure?.({ retryable: true }, { status: 503 });
                await auth.config.onSessionFailure?.({ retryable: true }, genericError);

                /** Each call schedules WITHOUT the `extend` flag (real attempt). */
                const calls = (auth.alarms.scheduleAutoResume as jest.Mock).mock.calls;
                expect(calls).toHaveLength(3);
                calls.forEach(([arg]) => expect(arg).toStrictEqual({ extend: false }));
            });
        });
    });

    describe('Listeners', () => {
        let auth: ExtensionAuthService;

        beforeEach(() => {
            auth = createAuthService(api, authStore);
            auth.listen();
        });

        describe('`listen()`', () => {
            test('should setups listeners', () => {
                expect(auth).toBeDefined();
                expect(api.subscribe).toHaveBeenCalled();
            });

            test.each([
                WorkerMessageType.ACCOUNT_PROBE,
                WorkerMessageType.ACCOUNT_FORK,
                WorkerMessageType.AUTH_CHECK,
                WorkerMessageType.AUTH_CONFIRM_PASSWORD,
                WorkerMessageType.AUTH_INIT,
                WorkerMessageType.AUTH_OFFLINE_SWITCH,
                WorkerMessageType.AUTH_UNLOCK,
            ])('should register `%s` handler', (message) => {
                expect(WorkerMessageBroker.registerMessage).toHaveBeenCalledWith(message, expect.any(Function));
            });
        });

        describe('`AUTH_OFFLINE_SWITCH`', () => {
            test('should set PASSWORD_LOCKED when offline', async () => {
                connectivity.online = false;
                ctx.status = AppStatus.READY;
                ctx.booted = true;

                const handler = mockHandlers.get(WorkerMessageType.AUTH_OFFLINE_SWITCH);
                const result = await handler?.({}, {});

                expect(result).toBe(true);
                expect(ctx.setBooted).toHaveBeenCalledWith(false);
                expect(ctx.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
            });

            test('should not change status when online', async () => {
                connectivity.online = true;
                ctx.status = AppStatus.READY;
                ctx.booted = true;

                const handler = mockHandlers.get(WorkerMessageType.AUTH_OFFLINE_SWITCH);
                const result = await handler?.({}, {});

                expect(result).toBe(true);
                expect(ctx.setBooted).not.toHaveBeenCalled();
                expect(ctx.setStatus).not.toHaveBeenCalled();
            });

            test('should reject the switch when flag is OFF', async () => {
                featureFlags.PassExtensionOfflineV1 = false;
                connectivity.online = false;
                ctx.status = AppStatus.READY;
                ctx.booted = true;

                const handler = mockHandlers.get(WorkerMessageType.AUTH_OFFLINE_SWITCH);
                const result = await handler?.({}, {});

                expect(result).toBe(false);
                expect(ctx.setBooted).not.toHaveBeenCalled();
                expect(ctx.setStatus).not.toHaveBeenCalled();
            });
        });

        describe('Connectivity events', () => {
            let subscriber: (status: ConnectivityStatus) => void;

            beforeEach(() => {
                jest.spyOn(auth.alarms, 'scheduleAutoResume').mockResolvedValue(undefined);
                auth.init = jest.fn().mockResolvedValue(true);
                authStore.setLocalID(123);
                subscriber = (connectivity.subscribe as jest.Mock).mock.calls[0][0];
            });

            test('should bootstrap auto-resume alarm when coming online from offline-booted client', () => {
                ctx.status = AppStatus.OFFLINE;
                ctx.booted = true;
                subscriber(ConnectivityStatus.ONLINE);
                expect(auth.alarms.scheduleAutoResume).toHaveBeenCalled();
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
                expect(auth.init).not.toHaveBeenCalled();
            });

            test('should bootstrap auto-resume alarm when coming online from password-locked status', () => {
                ctx.status = AppStatus.PASSWORD_LOCKED;
                ctx.booted = false;
                subscriber(ConnectivityStatus.ONLINE);
                expect(auth.alarms.scheduleAutoResume).toHaveBeenCalled();
                expect(auth.init).not.toHaveBeenCalled();
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
            });

            test('should bootstrap auto-resume alarm when coming online from errored status', () => {
                ctx.status = AppStatus.ERROR;
                ctx.booted = false;
                subscriber(ConnectivityStatus.ONLINE);
                expect(auth.alarms.scheduleAutoResume).toHaveBeenCalled();
                expect(auth.init).not.toHaveBeenCalled();
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
            });

            test('should noop when network goes offline', () => {
                ctx.status = AppStatus.OFFLINE;
                ctx.booted = true;
                subscriber(ConnectivityStatus.OFFLINE);
                expect(auth.alarms.scheduleAutoResume).not.toHaveBeenCalled();
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
                expect(auth.init).not.toHaveBeenCalled();
            });

            test('should noop when online and already booted online', () => {
                ctx.status = AppStatus.READY;
                ctx.booted = true;
                subscriber(ConnectivityStatus.ONLINE);
                expect(auth.alarms.scheduleAutoResume).not.toHaveBeenCalled();
                expect(auth.init).not.toHaveBeenCalled();
            });

            test('should noop when online but status is idle', () => {
                ctx.status = AppStatus.IDLE;
                ctx.booted = false;
                subscriber(ConnectivityStatus.ONLINE);
                expect(auth.alarms.scheduleAutoResume).not.toHaveBeenCalled();
                expect(auth.init).not.toHaveBeenCalled();
            });
        });

        describe('`autoResumeAlarm`', () => {
            let alarmListener: () => Promise<void>;

            beforeEach(() => {
                auth = createAuthService(api, authStore);
                jest.spyOn(auth.alarms.autoResumeAlarm, 'listen').mockImplementation((cb) => {
                    /** Capture the listener registered inside `auth.listen()` */
                    alarmListener = cb as () => Promise<void>;
                    return jest.fn();
                });
                jest.spyOn(auth.alarms, 'scheduleAutoResume').mockResolvedValue(undefined);
                auth.init = jest.fn().mockResolvedValue(true);
                authStore.setLocalID(123);
                auth.listen();
                WorkerMessageBroker.ports.query.mockReturnValue([]);
            });

            test('should dispatch `offlineResume` intent when client is offline', async () => {
                ctx.status = AppStatus.OFFLINE;
                await alarmListener();
                expect(auth.init).not.toHaveBeenCalled();
                expect(ctx.service.store.dispatch).toHaveBeenCalledWith(
                    offlineResume.intent({
                        localID: 123,
                        retryable: true,
                        silence: true,
                    })
                );
            });

            test('should stop (no schedule) when connectivity is OFFLINE to avoid keeping SW alive', async () => {
                ctx.status = AppStatus.PASSWORD_LOCKED;
                connectivity.online = false;
                connectivity.status = ConnectivityStatus.OFFLINE;
                await alarmListener();
                expect(auth.alarms.scheduleAutoResume).not.toHaveBeenCalled();
                expect(auth.init).not.toHaveBeenCalled();
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
            });

            test('should NOT extend when connectivity is DOWNTIME (servers unreachable)', async () => {
                ctx.status = AppStatus.PASSWORD_LOCKED;
                connectivity.online = false;
                connectivity.status = ConnectivityStatus.DOWNTIME;
                await alarmListener();
                expect(auth.alarms.scheduleAutoResume).toHaveBeenCalledWith({ extend: false });
            });

            test('should extend the auto-resume alarm when password-locked with popup open', async () => {
                ctx.status = AppStatus.PASSWORD_LOCKED;
                (WorkerMessageBroker.ports.query as jest.Mock).mockReturnValue([{}]);
                await alarmListener();
                expect(auth.alarms.scheduleAutoResume).toHaveBeenCalledWith({ extend: true });
                expect(auth.init).not.toHaveBeenCalled();
            });

            test('should call `auth.init` when password-locked in background (no popup)', async () => {
                ctx.status = AppStatus.PASSWORD_LOCKED;
                WorkerMessageBroker.ports.query.mockReturnValue([]);
                await alarmListener();

                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
                expect(auth.init).toHaveBeenCalledWith({
                    forceLock: expect.any(Boolean),
                    retryable: true,
                    silence: true,
                });
            });

            test('should call `auth.init` when client is ERRORED', async () => {
                ctx.status = AppStatus.ERROR;
                await alarmListener();
                expect(auth.init).toHaveBeenCalled();
            });

            test('should call `auth.init` when client is IDLE', async () => {
                ctx.status = AppStatus.IDLE;
                await alarmListener();
                expect(auth.init).toHaveBeenCalled();
            });

            test('should drop silently on healthy statuses (READY) → no init/re-arm', async () => {
                ctx.status = AppStatus.READY;
                await alarmListener();
                expect(ctx.service.store.dispatch).not.toHaveBeenCalled();
                expect(auth.init).not.toHaveBeenCalled();
                expect(auth.alarms.scheduleAutoResume).not.toHaveBeenCalled();
            });

            test('should probe connectivity when worker thinks it is offline', async () => {
                /** Connectivity state may be stale after SW idle-shutdown; the
                 * alarm must probe before trusting the offline gate. */
                ctx.status = AppStatus.PASSWORD_LOCKED;
                connectivity.online = false;
                connectivity.status = ConnectivityStatus.OFFLINE;
                await alarmListener();
                expect(connectivity.check).toHaveBeenCalledTimes(1);
            });

            test('should skip the probe when worker already reports online', async () => {
                ctx.status = AppStatus.PASSWORD_LOCKED;
                connectivity.online = true;
                connectivity.status = ConnectivityStatus.ONLINE;
                await alarmListener();
                expect(connectivity.check).not.toHaveBeenCalled();
            });

            test('post-probe ONLINE drives the resume path (stale OFFLINE recovered)', async () => {
                /** Probe flips the stale OFFLINE status to ONLINE — the alarm must
                 * proceed with the resume instead of returning via the OFFLINE switch. */
                ctx.status = AppStatus.PASSWORD_LOCKED;
                connectivity.online = false;
                connectivity.status = ConnectivityStatus.OFFLINE;
                (connectivity.check as jest.Mock).mockImplementationOnce(async () => {
                    connectivity.online = true;
                    connectivity.status = ConnectivityStatus.ONLINE;
                });
                await alarmListener();
                expect(auth.init).toHaveBeenCalledWith({
                    forceLock: expect.any(Boolean),
                    retryable: true,
                    silence: true,
                });
                expect(auth.alarms.scheduleAutoResume).not.toHaveBeenCalled();
            });
        });
    });
});
