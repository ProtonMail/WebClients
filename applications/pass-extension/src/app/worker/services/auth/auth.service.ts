import config from 'proton-pass-extension/app/config';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import type { MessageHandlerCallback } from 'proton-pass-extension/lib/message/message-broker';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { getMinimalHostPermissions, hasHostPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { isPagePort, isPopupPort } from 'proton-pass-extension/lib/utils/port';
import { safariPullFork, sendSafariMessage } from 'proton-pass-extension/lib/utils/safari';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import {
    AccountForkResponse,
    extractOfflineComponents,
    getAccountForkResponsePayload,
    getStateKey,
} from '@proton/pass/lib/auth/fork';
import { AppStatusFromLockMode, LockMode } from '@proton/pass/lib/auth/lock/types';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import type { AuthService, AuthServiceConfig } from '@proton/pass/lib/auth/service';
import { createAuthService as createCoreAuthService } from '@proton/pass/lib/auth/service';
import { SESSION_KEYS } from '@proton/pass/lib/auth/session';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import { getOfflineVerifier } from '@proton/pass/lib/cache/crypto';
import {
    clientAuthorized,
    clientBooted,
    clientDesktopLocked,
    clientErrored,
    clientOffline,
    clientPasswordLocked,
    clientSessionLocked,
    clientStale,
    clientUnauthorized,
} from '@proton/pass/lib/client';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import browser from '@proton/pass/lib/globals/browser';
import { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { lockSync, unlock } from '@proton/pass/store/actions/creators/auth';
import {
    bootIntent,
    cacheCancel,
    offlineResume,
    stateDestroy,
    stopEventPolling,
} from '@proton/pass/store/actions/creators/client';
import { notification } from '@proton/pass/store/actions/creators/notification';
import type { Api } from '@proton/pass/types/api/api';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { AppStatus } from '@proton/pass/types/worker/state';
import { or } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import type { XorObfuscation } from '@proton/pass/utils/obfuscate/xor';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { deserialize } from '@proton/pass/utils/object/serialize';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import type { AuthAlarms } from './auth.alarms';
import { createAuthAlarms } from './auth.alarms';
import { shouldForceLock, validateExtensionForkPayload } from './auth.utils';

export interface ExtensionAuthService extends AuthService {
    /** Starts extension specific listeners. Moved outside
     * the extension's AuthService factory to ensure it is
     * called once the `WorkerContext` has been set up. */
    alarms: AuthAlarms;
    listen: () => void;
}

export const createAuthService = (api: Api, authStore: AuthStore) => {
    const alarms = createAuthAlarms();

    /** Wraps `bootIntent` dispatch with an auto-resume reset: any
     * successful boot invalidates the pending retry alarm. */
    const boot = withContext<(payload: Parameters<typeof bootIntent>[0]) => void>((ctx, payload) => {
        void alarms.clearAutoResume();
        void alarms.resetAutoResume();
        ctx.service.store.dispatch(bootIntent(payload));
    });

    const authService = createCoreAuthService({
        api,
        authStore,
        onInit: withContext(async (ctx, options) => {
            void alarms.clearAutoResume();
            void alarms.clearAutoLock();

            if (BUILD_TARGET === 'safari') {
                const environment = getSecondLevelDomain(config.SSO_URL);
                void sendSafariMessage({ environment });
            }

            if (clientAuthorized(ctx.status)) return true;
            if (clientUnauthorized(ctx.status)) return false;

            /** Refresh connectivity before attempting a session resume so downstream
             * decisions (offline fallback in `onResumeStart` and `onSessionFailure`)
             * operate on a current status. Skipped on the early-return paths above
             * to avoid an unnecessary `/ping` when no resume will run. */
            await ctx.service.connectivity.check();

            /* If worker is logged out (unauthorized or locked) during an init call,
             * this means the login or resumeSession calls failed - we can safely early
             * return as the authentication store will have been configured. Waits for
             * connectivity check in-order to prompt for offline unlock. */
            if (or(clientDesktopLocked, clientSessionLocked)(ctx.status)) return false;

            return ctx.service.auth.resumeSession(undefined, options);
        }),

        ...(BUILD_TARGET === 'safari' ? { pullFork: safariPullFork } : {}),

        getPersistedSession: withContext(async (ctx, _localID) => {
            const ps = await ctx.service.storage.local.getItem('ps');
            if (!ps) return null;

            const persistedSession = JSON.parse(ps);
            return authStore.validPersistedSession(persistedSession) ? persistedSession : null;
        }),

        getMemorySession: withContext((ctx, _localID) => ctx.service.storage.session.getItems(SESSION_KEYS)),

        onLoginStart: withContext(async (ctx) => {
            await alarms.clearAutoResume();
            if (!ctx.booted) ctx.setStatus(AppStatus.AUTHORIZING);
        }),

        onLoginComplete: withContext(async (ctx, _) => {
            ctx.setStatus(AppStatus.AUTHORIZED);
            boot({ offline: false });
            await ctx.service.storage.local.removeItem('forceLock');
            await ctx.service.storage.session.setItems(authStore.getSession());
            setSentryUID(authStore.getUID());

            if (BUILD_TARGET === 'safari') await sendSafariMessage({ credentials: authStore.getSession() });
        }),

        onLogoutComplete: withContext((ctx, _) => {
            /* important to call setStatus before dispatching the
             * the `stateDestroy` action : we might have active
             * clients currently consuming the store data */
            ctx.setStatus(AppStatus.UNAUTHORIZED);
            ctx.setBooted(false);

            ctx.service.store.dispatch(cacheCancel());
            ctx.service.store.dispatch(stopEventPolling());
            ctx.service.store.dispatch(stateDestroy());

            setSentryUID(undefined);

            ctx.service.formTracker.clear();
            ctx.service.spotlight.reset();
            ctx.service.telemetry?.stop();
            ctx.service.autofill.clear();
            ctx.service.apiProxy.clear?.().catch(noop);
            ctx.service.logger.clear().catch(noop);

            void ctx.service.settings.clear();
            void ctx.service.storage.session.clear();
            void ctx.service.storage.local.clear({ preserve: ['features', 'pass::qa'] });
            void fileStorage.clearAll();
            void alarms.clearAutoLock();
            void alarms.clearAutoResume();
            void alarms.resetAutoResume();
            ctx.service.nativeMessaging.disconnect();

            if (BUILD_TARGET === 'safari') void sendSafariMessage({ credentials: null });
        }),

        onForkConsumeStart: async () => {
            /** Block fork consumption if the extension is already authenticated */
            if (authStore.hasSession()) throw getAccountForkResponsePayload(AccountForkResponse.CONFLICT);
            else await authService.config.onLoginStart?.();
        },

        onForkReauth: withContext(async (ctx, data, state, blob) => {
            switch (data.reauth.type) {
                case ReauthAction.EXPORT_CONFIRM:
                    const exportTabPath = `/settings.html#export?state=${state}`;
                    await browser.tabs.create({ url: browser.runtime.getURL(exportTabPath) });
                    return true;

                case ReauthAction.OFFLINE_SETUP:
                    if (blob?.type === 'offline') {
                        const { offlineKeyPassword: password, offlineKeySalt: salt } = blob;
                        const { offlineKD, offlineConfig } = extractOfflineComponents(password, salt);
                        const offlineVerifier = await getOfflineVerifier(stringToUint8Array(offlineKD));
                        authStore.setOfflineComponents({ offlineKD, offlineConfig, offlineVerifier });
                        await authService.persistSession();
                        ctx.service.store.dispatch(settingsEditIntent('offline', { offlineEnabled: true }, true));
                    }

                    const settingsPath = `/settings.html#?state=${state}`;
                    await browser.tabs.create({ url: browser.runtime.getURL(settingsPath) });
                    return true;

                default:
                    return true;
            }
        }),

        onSessionInvalid: withContext(async (ctx, error, _data) => {
            if (error instanceof InvalidPersistentSessionError) {
                authStore.clear();
                void alarms.resetAutoResume();
                void ctx.service.storage.local.removeItem('ps');
                void ctx.service.storage.session.clear();
            }

            throw error;
        }),

        onSessionEmpty: withContext((ctx) => ctx.setStatus(AppStatus.UNAUTHORIZED)),

        onLockUpdate: withContext(async (ctx, lock) => {
            try {
                ctx.service.store.dispatch(lockSync(lock));

                const { ttl, mode } = lock;
                await alarms.clearAutoLock();
                const booted = clientBooted(ctx.getState().status);

                /* To avoid potential issues during the boot sequence, refrain from
                 * setting the `SESSION_LOCK_ALARM` immediately if the session is locked.
                 * This precaution is taken because the boot process might exceed the lock
                 * TTL duration, leading to an unsuccessful boot for the user */
                if (booted && mode !== LockMode.NONE && ttl) void alarms.setAutoLock(ttl);
            } catch {}
        }),

        onLocked: withContext(async (ctx, mode, _localID, _broadcast) => {
            ctx.setBooted(false);

            const offline = !ctx.service.connectivity.online;
            const forcePasswordLock = offline && authStore.hasOfflineComponents();

            if (forcePasswordLock) ctx.setStatus(AppStatus.PASSWORD_LOCKED);
            else ctx.setStatus(AppStatusFromLockMode[mode]);

            ctx.service.autofill.clear();
            ctx.service.store.dispatch(cacheCancel());
            ctx.service.store.dispatch(stopEventPolling());
            ctx.service.store.dispatch(stateDestroy());

            /** set the `forceLock` flag for subsequent auth inits and
             * clear the in-memory session storage */
            await ctx.service.storage.local.setItem('forceLock', true);
            await ctx.service.storage.session.removeItems(SESSION_KEYS);
            await alarms.clearAutoLock();
        }),

        onResumeStart: withContext<AuthServiceConfig['onResumeStart']>(async (ctx, { hasSession, memorySession }) => {
            /** Early permission check on session resume - this avoids failing
             * with an `Internet connection lost` error if the extension
             * permissions are too strict for session resuming */
            if (!(await hasHostPermissions(getMinimalHostPermissions(config)))) {
                if (!hasSession) authService.config.onSessionEmpty?.();
                else void authService.config.onSessionFailure({ retryable: false }, null);

                authService.config.onNotification?.({ type: 'error', key: NotificationKey.EXT_PERMISSIONS, text: '' });
                return false;
            }

            /** Handle service-worker wake-up with a valid offline memory
             * session. We hydrate `authStore` upfront in two cases:
             *   1. Network unavailable & not booted → boot offline immediately,
             *      skipping online auth which would fail.
             *   2. Network available → proceed with online resume. If it fails
             *      with a connectivity issue, `onSessionFailure` falls back to
             *      offline boot via `validOfflineSession(authStore.getSession())`. */
            const hasOfflineSession = memorySession && authStore.validOfflineSession(memorySession);
            if (hasOfflineSession) authStore.setSession(memorySession);

            const offline = !ctx.service.connectivity.online;
            const booted = ctx.booted;

            if (hasOfflineSession && offline && !booted) {
                if (await shouldForceLock()) ctx.setStatus(AppStatus.PASSWORD_LOCKED);
                else boot({ offline: true });
                return false;
            }

            return true;
        }),

        onUnlocked: withContext(async (ctx, mode, _, localID, offline) => {
            if (clientBooted(ctx.getState().status)) return;

            switch (mode) {
                case LockMode.SESSION:
                case LockMode.DESKTOP:
                    /** If the unlock request was triggered before the authentication
                     * store session was fully hydrated, trigger a session resume. */
                    const validSession = authStore.validSession(authStore.getSession());
                    if (!validSession) await authService.resumeSession(localID, { retryable: false, unlocked: true });
                    else await authService.login(authStore.getSession(), { unlocked: true });
                    break;

                case LockMode.PASSWORD:
                    /** `LockMode.PASSWORD` is only used as an offline booting gate in
                     * the extension. If connectivity was resumed while password locked:
                     * force resume session with offline booting fallback in `onSessionFailure` */
                    if (offline) boot({ offline: true });
                    else await authService.resumeSession(localID, { retryable: false, unlocked: true });
                    break;
            }
        }),

        onSessionPersist: withContext(async (ctx, encryptedSession) => {
            await ctx.service.storage.local.setItem('ps', encryptedSession);
            await ctx.service.storage.session.setItems(authStore.getSession());
        }),

        onSessionFailure: withContext(async (ctx, options, err) => {
            logger.info('[AuthService] Session resume failure');
            await api.idle();

            /** When already OFFLINE-booted, a failed online resume attempt (eg from
             * `offlineResume` dispatched on connectivity restore) must not alter app
             * state: the user stays booted offline. Retry scheduling still runs
             * below if `retryable` is set, so the alarm chain keeps going with
             * backoff rather than relying on another connectivity event. */
            if (!clientOffline(ctx.getState().status)) {
                /** We do not rely on `connectivity` state on session failures in the case
                 * of partial downtime (eg: `/ping` returns 200 but `/auth` routes 5xx) */
                const connectionIssue = getIsConnectionIssue(err);
                const hasOfflineComponents = authStore.hasOfflineComponents();
                const canOfflineUnlock = connectionIssue && hasOfflineComponents;
                const unlocked = options.unlocked && authStore.validOfflineSession(authStore.getSession());

                /** If the user managed to unlock during the sequence but session resuming
                 * failed: fallback to offline booting. `unlocked: true` is set on `onUnlocked`  */
                if (canOfflineUnlock && unlocked) return boot({ offline: true });

                ctx.setStatus(canOfflineUnlock ? AppStatus.PASSWORD_LOCKED : AppStatus.ERROR);
                ctx.setBooted(false);
            }

            if (options.retryable) await alarms.scheduleAutoResume({ extend: false });
            else await alarms.registerResumeFailure();
        }),

        onNotification: withContext((ctx, data) =>
            ctx.service.store.dispatch(
                notification({
                    ...data,
                    type: 'error',
                    key: data.key ?? 'authservice',
                    deduplicate: true,
                })
            )
        ),

        onMissingScope: withContext((ctx) => ctx.setStatus(AppStatus.MISSING_SCOPE)),

        onSessionRefresh: withContext(async (ctx, localID, { AccessToken, RefreshToken, RefreshTime }) => {
            const persistedSession = await ctx.service.auth.config.getPersistedSession(localID);

            if (persistedSession) {
                if (BUILD_TARGET === 'safari') {
                    const refreshCredentials = { AccessToken, RefreshToken, RefreshTime };
                    void sendSafariMessage({ refreshCredentials });
                }

                /* update the persisted session tokens without re-encrypting the
                 * session blob as session refresh may happen before a full login
                 * with a partially hydrated authentication store. */
                persistedSession.AccessToken = AccessToken;
                persistedSession.RefreshToken = RefreshToken;
                persistedSession.RefreshTime = RefreshTime;

                await ctx.service.storage.local.setItem('ps', JSON.stringify(persistedSession));
                await ctx.service.storage.session.setItems({ AccessToken, RefreshToken, RefreshTime });
            }
        }),
    }) as ExtensionAuthService;

    const handleInit = withContext<MessageHandlerCallback<WorkerMessageType.AUTH_INIT>>(async (ctx, { options }) => {
        options.forceLock = await shouldForceLock();
        await ctx.service.auth.init(options);
        return ctx.getState();
    });

    const handleAccountFork = withContext<MessageHandlerCallback<WorkerMessageType.ACCOUNT_FORK>>(
        async ({ service, status }, { payload }, { tab }) => {
            try {
                const stateKey = getStateKey(payload.state);
                const localState: MaybeNull<string> = await service.storage.session
                    .getItem<any>(stateKey)
                    .catch(() => null);

                if (!validateExtensionForkPayload(payload)) throw new Error('Invalid `ExtensionForkPayload`');

                const result = await authService.consumeFork(
                    { mode: 'extension', tabId: tab?.id!, localState, ...payload },
                    `${config.SSO_URL}/api`
                );

                if (result.reauth) {
                    /** On fork reauth remove the account tab to  avoid `/auth-ext`
                     * onboarding redirection. At this point, the extension may be
                     * locked causing the reauth action to be lost. */
                    if (tab?.id) await browser.tabs.remove(tab.id);
                    return getAccountForkResponsePayload(AccountForkResponse.REAUTH);
                }

                if (clientSessionLocked(status)) await service.storage.session.setItems(authStore.getSession());
                return getAccountForkResponsePayload(AccountForkResponse.SUCCESS);
            } catch (error: unknown) {
                if (!(error instanceof Error)) throw error;
                throw getAccountForkResponsePayload(AccountForkResponse.ERROR, error);
            }
        }
    );

    const handleUnlock: MessageHandlerCallback<WorkerMessageType.AUTH_UNLOCK> = withContext((ctx, { payload }) =>
        ctx.service.store.dispatchAsyncRequest(unlock, payload).then((res) => {
            switch (res.type) {
                case 'success':
                    return { ok: true };
                case 'failure':
                    return { ok: false, error: res.error };
            }
        })
    );

    /* only extend the session lock if a lock is registered and we've reached at least 50%
     * of the lock TTL since the last extension. Calling `AuthService::checkLock` will extend
     * the lock via the `checkLock` call */
    const handleAuthCheck: MessageHandlerCallback<WorkerMessageType.AUTH_CHECK> = withContext(
        async (ctx, { payload: { immediate } }) => {
            try {
                const locked = await (async (): Promise<boolean> => {
                    if (immediate) return (await authService.checkLock()).locked;

                    const lockMode = authStore.getLockMode();
                    const registeredLock = lockMode !== LockMode.NONE;
                    const ttl = authStore.getLockTTL();

                    if (clientBooted(ctx.status) && registeredLock && ttl) {
                        const now = getEpoch();
                        const diff = now - (authStore.getLockLastExtendTime() ?? 0);
                        if (diff > ttl * 0.5) return (await authService.checkLock()).locked;
                    }

                    return authStore.getLocked() ?? false;
                })();

                return { ok: true, locked };
            } catch {
                return { ok: false };
            }
        }
    );

    const handlePasswordConfirm: MessageHandlerCallback<WorkerMessageType.AUTH_CONFIRM_PASSWORD> = async (message) => {
        const passwordBuff = deserialize<XorObfuscation>(message.payload.password);
        const password = deobfuscate(passwordBuff, { zeroize: true });
        const confirmed = await authService.confirmPassword(password);
        return { ok: confirmed };
    };

    /** Force password-lock when user explicitly switches to offline mode */
    const handleOfflineSwitch: MessageHandlerCallback<WorkerMessageType.AUTH_OFFLINE_SWITCH> = withContext((ctx) => {
        if (!ctx.service.connectivity.online) {
            ctx.setBooted(false);
            ctx.setStatus(AppStatus.PASSWORD_LOCKED);
        }

        return true;
    });

    authService.listen = withContext<() => void>((ctx) => {
        void alarms.hydrate();

        WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_PROBE, () => true);
        WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_FORK, handleAccountFork);
        WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_CHECK, handleAuthCheck);
        WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_CONFIRM_PASSWORD, handlePasswordConfirm);
        WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_INIT, handleInit);
        WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_OFFLINE_SWITCH, handleOfflineSwitch);
        WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_UNLOCK, handleUnlock);

        authStore.subscribe?.(() => {
            WorkerMessageBroker.ports.broadcast(
                backgroundMessage({
                    type: WorkerMessageType.AUTH_CHANGED,
                    payload: authStore.getSession(),
                }),
                or(isPopupPort, isPagePort)
            );
        });

        /** Auth alarms may be triggered while the service worker is idle,
         * as such, we should check for the app status before triggering any
         * API side-effects to avoid unauthenticated requests being sent out */
        alarms.autoLockAlarm.listen(async () => {
            const booted = clientBooted(ctx.getState().status);
            logger.info(`[AuthService] session lock alarm detected [booted=${booted}]`);
            await ctx.service.storage.local.setItem('forceLock', true);
            if (booted) return authService.lock(authStore.getLockMode(), { soft: false });
            else return authService.init({ forceLock: true, retryable: false });
        });

        alarms.autoResumeAlarm.listen(async () => {
            const { store, connectivity } = ctx.service;
            const localID = authStore.getLocalID();
            const status = ctx.getState().status;

            logger.info(`[AuthService] auto-resume alarm fired [${status}]`);

            if (!connectivity.online) {
                /** DOWNTIME: burn a slot so the chain advances and eventually exhausts.
                 * Extending here would keep the SW alive forever with no progress.
                 * OFFLINE: stop. The connectivity subscriber resumes on reconnect.
                 * popup `CLIENT_INIT` covers manual retries in the meantime. */
                switch (connectivity.status) {
                    case ConnectivityStatus.DOWNTIME:
                        logger.info('[AuthService] deferred auto resume [downtime]');
                        return alarms.scheduleAutoResume({ extend: false });
                    case ConnectivityStatus.OFFLINE:
                        logger.info('[AuthService] stopped auto resume [offline]');
                        return;
                }
            }

            if (clientOffline(status)) {
                /** Offline-booted with connectivity available: silently attempt
                 * an offline resume to promote to online. No popup-open guard
                 * here (unlike password-locked below): the user already has
                 * their data, so a successful resume is a transparent upgrade. */
                return store.dispatch(offlineResume.intent({ localID, retryable: true, silence: true }));
            }

            const hasPopup = WorkerMessageBroker.ports.query(isPopupPort).length > 0;
            const passwordLocked = clientPasswordLocked(status);
            const backgroundPasswordLocked = passwordLocked && !hasPopup;
            const forceResume = backgroundPasswordLocked || or(clientErrored, clientStale)(status);

            if (passwordLocked && hasPopup) {
                /** Password-locked with popup opened: avoid triggering a resume
                 * while the user is trying to offline-unlock. Always extend as
                 * this isn't a real attempt. The the cap stays intact for real failures. */
                logger.info('[AuthService] deferred auto resume [popup-opened]');
                return alarms.scheduleAutoResume({ extend: true });
            }

            if (forceResume) {
                const forceLock = await shouldForceLock();
                return authService.init({ forceLock, retryable: true, silence: true });
            }

            logger.info(`[AuthService] dropped auto resume [${status}]`);
        });

        /** Bootstrap the auto-resume alarm chain for offline-booted clients.
         * If offline boot is dispatched from `onResumeStart` directly, bypassing
         * `onSessionFailure`, no alarm is pending after it. This handler
         * schedules the first retry on the next ONLINE transition. From there
         * `onSessionFailure` keeps the chain going with backoff. */
        ctx.service.connectivity.subscribe((status) => {
            const online = status === ConnectivityStatus.ONLINE;
            const appStatus = ctx.getState().status;
            const shouldResume = online && or(clientOffline, clientPasswordLocked, clientErrored)(appStatus);
            if (shouldResume) void alarms.scheduleAutoResume({ extend: false });
        });
    });

    authService.alarms = alarms;

    return authService;
};
