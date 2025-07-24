import { flushSync } from 'react-dom';

import type { History, LocationDescriptorObject } from 'history';
import type { ServiceWorkerClient } from 'proton-pass-web/app/ServiceWorker/client/client';
import { store } from 'proton-pass-web/app/Store/store';
import { B2BEvents } from 'proton-pass-web/lib/b2b';
import { deletePassDB } from 'proton-pass-web/lib/database';
import { logStore } from 'proton-pass-web/lib/logger';
import { spotlight } from 'proton-pass-web/lib/spotlight';
import { clearUserLocalData, localGarbageCollect } from 'proton-pass-web/lib/storage';
import { telemetry } from 'proton-pass-web/lib/telemetry';
import { getThemeForLocalID } from 'proton-pass-web/lib/theme';
import { c } from 'ttag';

import type { CreateNotificationOptions } from '@proton/components';
import type { AppStateService } from '@proton/pass/components/Core/AppStateManager';
import type { PassCoreContextValue } from '@proton/pass/components/Core/PassCoreProvider';
import {
    type AuthRouteState,
    getBootRedirection,
    getLocalPath,
    getRouteError,
} from '@proton/pass/components/Navigation/routing';
import { DEFAULT_LOCK_TTL } from '@proton/pass/constants';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import { api } from '@proton/pass/lib/api/api';
import { extractOfflineComponents, getStateKey } from '@proton/pass/lib/auth/fork';
import { biometricsLockAdapterFactory, generateBiometricsKey } from '@proton/pass/lib/auth/lock/biometrics/adapter';
import { passwordLockAdapterFactory } from '@proton/pass/lib/auth/lock/password/adapter';
import { sessionLockAdapterFactory } from '@proton/pass/lib/auth/lock/session/adapter';
import { AppStatusFromLockMode, LockMode } from '@proton/pass/lib/auth/lock/types';
import { ReauthAction, isSSOBackupPasswordReauth } from '@proton/pass/lib/auth/reauth';
import { createAuthService as createCoreAuthService } from '@proton/pass/lib/auth/service';
import { getPersistedSessionKey } from '@proton/pass/lib/auth/session';
import { authStore } from '@proton/pass/lib/auth/store';
import type { AuthSwitchService } from '@proton/pass/lib/auth/switch';
import { getOfflineVerifier } from '@proton/pass/lib/cache/crypto';
import { canLocalUnlock } from '@proton/pass/lib/cache/utils';
import { clientBooted, clientOffline } from '@proton/pass/lib/client';
import { bootIntent, cacheCancel, lockSync, stateDestroy, stopEventPolling } from '@proton/pass/store/actions';
import { AppStatus, AuthMode, type MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { objectHandler } from '@proton/pass/utils/object/handler';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { revoke } from '@proton/shared/lib/api/auth';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    getBasename,
    getLocalIDFromPathname,
    stripLocalBasenameFromPathname,
} from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS } from '@proton/shared/lib/constants';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { omit } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import {
    clearPendingRevocations,
    getDefaultLocalID,
    getPendingRevocations,
    getPersistedLocalIDsForUserID,
    getPersistedSession,
    getPersistedSessions,
    getSessionKey,
    setPendingRevocation,
} from './sessions';

type AuthServiceBindings = {
    app: AppStateService;
    authSwitch: AuthSwitchService;
    config: PassConfig;
    core: PassCoreContextValue;
    history: History<MaybeNull<AuthRouteState>>;
    sw: MaybeNull<ServiceWorkerClient>;
    getOnline: () => boolean;
    onNotification: (notification: CreateNotificationOptions) => void;
};

export const createAuthService = ({
    app,
    authSwitch,
    config,
    core,
    history,
    sw,
    getOnline,
    onNotification,
}: AuthServiceBindings) => {
    const redirect = objectHandler(getBootRedirection(history.location));

    const auth = createCoreAuthService({
        api,
        authStore,

        getPersistedSession,

        onInit: async (options) => {
            if (DESKTOP_BUILD && core.isFirstLaunch?.()) return false;

            const sessions = getPersistedSessions();
            await localGarbageCollect(sessions).catch(noop);

            const activeLocalID = authStore.getLocalID();
            const pathLocalID = getLocalIDFromPathname(history.location.pathname);
            const validLocalID = activeLocalID === pathLocalID;
            const validActiveSession = authStore.validSession(authStore.getSession());

            /** Clear auth store if URL `localID` was tampered with */
            if (!validLocalID) authStore.clear();

            /** Force lock unless: matching localID + valid session + online.
             * Allows bypassing locks on page refresh when localID is preserved */
            options.forceLock = options.forceLock ?? !(validLocalID && validActiveSession && getOnline());

            const localID = pathLocalID ?? authStore.getLocalID() ?? getDefaultLocalID(sessions);
            const error = getRouteError(history.location.search);

            if (error !== null) {
                redirect.set('pathname', '/');
                redirect.set('search', '');
                redirect.set('hash', '');
                const pathname = pathLocalID ? `/u/${pathLocalID}` : '/';
                app.setStatus(AppStatus.ERROR);
                history.replace({ search: '', pathname, state: { error } });
                return false;
            } else history.replace({ ...history.location, ...redirect.data, state: null });

            const persistedSession = await auth.config.getPersistedSession(localID);

            if (persistedSession) {
                /** Configure the authentication store partially in order to
                 * hydrate the userID and offline salts before resuming session. */
                authStore.setSession(persistedSession);

                /** Apply user preferences early */
                core.i18n.setLocale().catch(noop);
                const theme = await getThemeForLocalID(persistedSession.LocalID);
                if (theme) core.theme.setState(theme);

                const cookieUpgrade = authStore.shouldCookieUpgrade(persistedSession);
                const onlineAndSessionReady = getOnline() && !cookieUpgrade;
                await authSwitch.sync({ revalidate: onlineAndSessionReady });

                if (onlineAndSessionReady) {
                    /** If no cookie upgrade is required, then the persisted session is now
                     * cookie-based. As such, if the user is online, resolve the `clientKey`
                     * as soon as possible in order to make an authenticated API call before
                     * applying the `forceLock` option. This allows detecting stale sessions
                     * before allowing the user to password unlock. */
                    await getPersistedSessionKey(api, authStore).catch((err) => {
                        app.setStatus(AppStatus.ERROR);
                        throw err;
                    });
                }
            }

            if (options.forceLock) {
                /** if we had an in-memory session - most likely due to a
                 * soft reload - clear the session lock token and offlineKD
                 * to force the user to unlock on boot */
                authStore.setLocked(false);
                authStore.setLockToken(undefined);
                authStore.setOfflineKD(undefined);

                const localUnlockableOpts = {
                    lockMode: authStore.getLockMode(),
                    offline: !getOnline(),
                    offlineConfig: authStore.getOfflineConfig(),
                    offlineVerifier: authStore.getOfflineVerifier(),
                    offlineEnabled: (await core.settings.resolve(localID))?.offlineEnabled ?? false,
                    encryptedOfflineKD: authStore.getEncryptedOfflineKD(),
                };

                if (canLocalUnlock(localUnlockableOpts)) {
                    authStore.setPassword(undefined);
                    const appStatus =
                        localUnlockableOpts.lockMode === LockMode.BIOMETRICS
                            ? AppStatus.BIOMETRICS_LOCKED
                            : AppStatus.PASSWORD_LOCKED;

                    app.setStatus(appStatus);
                    return false;
                }
            }

            const session = authStore.getSession();

            const loggedIn = await (authStore.hasSession(localID) && authStore.validSession(session)
                ? auth.login(session, options)
                : auth.resumeSession(localID, options));

            const locked = authStore.getLocked();
            const validSession = authStore.validSession(session) && session.LocalID === localID;
            const autoFork = !loggedIn && !locked && pathLocalID !== undefined && !validSession;

            if (!getOnline() && authStore.hasSession()) app.setStatus(AppStatus.ERROR);
            else if (autoFork) {
                /* If the session could not be resumed from the LocalID from path,
                 * we are likely dealing with an app-switch request from another app.
                 * In this case, redirect to account through a fork request. On
                 * auto-fork tolerate `offline-bypass` for smoother UX. */
                auth.requestFork({
                    app: APPS.PROTONPASS,
                    host: config.SSO_URL,
                    localID: pathLocalID,
                    promptType: 'offline-bypass',
                });
            }

            return loggedIn;
        },

        onLoginStart: () => {
            if (app.getState().booted) return;
            return app.setStatus(AppStatus.AUTHORIZING);
        },

        onLoginComplete: async (_, localID, reauth) => {
            app.setAuthorized(true);
            setSentryUID(authStore.getUID());

            const persistedSession = await auth.config.getPersistedSession(localID);
            /** Updates session timestamp to track last login, ensuring
             * this session loads first when opening new tabs */
            if (persistedSession) {
                persistedSession.lastUsedAt = getEpoch();
                const lastUsedSession = JSON.stringify(persistedSession);
                void auth.config.onSessionPersist?.(lastUsedSession);
            }

            if (app.getState().booted) app.setStatus(AppStatus.READY);
            else {
                const route = ((): Partial<LocationDescriptorObject<MaybeNull<AuthRouteState>>> => {
                    const base = getBasename(localID) ?? '/';
                    switch (reauth?.type) {
                        case ReauthAction.SSO_EXPORT:
                            return { pathname: base + '/settings', hash: 'export' };
                        case ReauthAction.SSO_PW_LOCK:
                        case ReauthAction.SSO_BIOMETRICS:
                            return { pathname: base + '/settings', hash: 'security' };
                        case ReauthAction.SSO_OFFLINE:
                            return { pathname: base + '/settings', hash: 'general' };
                        default:
                            return {
                                pathname: base + stripLocalBasenameFromPathname(redirect.get('pathname')),
                                search: redirect.get('search'),
                                hash: redirect.get('hash'),
                            };
                    }
                })();

                history.replace({ ...history.location, ...route });
                app.setStatus(AppStatus.AUTHORIZED);
                store.dispatch(bootIntent({ reauth }));
            }
        },

        onLogoutStart: () => {
            /** These services use the LocalID from the authentication store
             * to index their storage keys in the web-app. We must trigger
             * their clean-up functions before the auth store is cleared
             * in the `onLogoutComplete` hook. */
            spotlight.reset();
            telemetry.stop();
            B2BEvents.stop();

            store.dispatch(cacheCancel());
            store.dispatch(stopEventPolling());
        },

        onLogoutComplete: async (userID, localID, broadcast) => {
            if (broadcast) sw?.send({ type: 'unauthorized', localID, broadcast });
            if (userID) deletePassDB(userID).catch(noop);
            if (localID !== undefined) clearUserLocalData(localID);

            await authSwitch.sync({ revalidate: false });
            await logStore.clear().catch(noop);

            setSentryUID(undefined);

            flushSync(() => {
                app.setBooted(false);
                app.setStatus(AppStatus.UNAUTHORIZED);
                app.setAuthorized(false);
            });

            store.dispatch(stateDestroy());
            core.theme.sync();

            history.replace('/');
        },

        onLogoutFailure: setPendingRevocation,

        onMissingScope: () => {
            flushSync(() => app.setStatus(AppStatus.MISSING_SCOPE));
            history.replace('/');
        },

        onForkConsumeStart: () => auth.config.onLoginStart?.(),

        onForkConsumeComplete: async (session, { state }) => {
            const { offlineConfig, offlineKD, UserID, LocalID } = session;
            history.replace({ hash: '' }); /** removes selector from hash */

            try {
                const data = JSON.parse(sessionStorage.getItem(getStateKey(state))!);
                if ('pathname' in data && typeof data.pathname === 'string') redirect.set('pathname', data.pathname);
                if ('search' in data && typeof data.search === 'string') redirect.set('search', data.search);
                if ('hash' in data && typeof data.hash === 'string') redirect.set('hash', data.hash);
            } catch {
                redirect.set('pathname', '/');
                redirect.set('search', '');
                redirect.set('hash', '');
            }

            /** If any on-going persisted sessions are present for the forked
             * UserID session : delete them and wipe the local database. This
             * ensures incoming forks always take precedence */
            const localIDs = getPersistedLocalIDsForUserID(UserID);

            if (localIDs.length > 0) {
                logger.info(`[AuthServiceProvider] clearing sessions for user ${UserID}`);
                await deletePassDB(UserID).catch(noop);
                localIDs.forEach(clearUserLocalData);
            }

            sw?.send({ type: 'fork', localID: LocalID, userID: UserID, broadcast: true });

            /** Automatically create the password lock if we have the necessary
             * offline components when consuming the fork. Disabled for SSO users
             * as this would require using the backup password (bad UX) */
            if (offlineConfig && offlineKD) {
                session.offlineVerifier = await getOfflineVerifier(stringToUint8Array(offlineKD));

                if (!session.sso) {
                    logger.info('[AuthServiceProvider] Automatically creating password lock');
                    session.lockMode = LockMode.PASSWORD;
                    session.lockTTL = DEFAULT_LOCK_TTL;
                    authStore.setLockLastExtendTime(getEpoch());
                }
            }

            authStore.setSession(session);
            await authSwitch.sync({ revalidate: false });
        },

        onForkReauth: (fork, _, blob) =>
            auth.resumeSession(fork.localID, {
                reauth: fork.reauth,
                onComplete: async (userID, localID) => {
                    await authSwitch.sync({ revalidate: false });
                    const action = ReauthAction[fork.reauth.type];

                    try {
                        if (blob?.type === 'offline') {
                            const { offlineKD, offlineConfig } = extractOfflineComponents(blob);
                            const offlineVerifier = await getOfflineVerifier(stringToUint8Array(offlineKD));

                            authStore.setOfflineKD(offlineKD);
                            authStore.setOfflineConfig(offlineConfig);
                            authStore.setOfflineVerifier(offlineVerifier);

                            switch (fork.reauth.type) {
                                case ReauthAction.SSO_PW_LOCK: {
                                    const { current, ttl } = fork.reauth.data;
                                    if (current) await auth.deleteLock(authStore.getLockMode(), current);
                                    authStore.setLockMode(LockMode.PASSWORD);
                                    authStore.setLockTTL(ttl);
                                    break;
                                }
                                case ReauthAction.SSO_BIOMETRICS: {
                                    const { current, ttl } = fork.reauth.data;
                                    if (current) await auth.deleteLock(authStore.getLockMode(), current);
                                    const encryptedOfflineKD = await generateBiometricsKey(core, offlineKD);
                                    authStore.setEncryptedOfflineKD(encryptedOfflineKD);
                                    authStore.setLockMode(LockMode.BIOMETRICS);
                                    authStore.setLockTTL(ttl);
                                    break;
                                }
                            }

                            await auth.persistSession();

                            /** Session has been persisted at this point so
                             * it's safe to mutate the `offlineEnabled` setting */
                            if (fork.reauth.type === ReauthAction.SSO_OFFLINE) {
                                const localID = authStore.getLocalID();
                                const settings = await core.settings.resolve(localID);
                                await core.settings.sync({ ...settings, offlineEnabled: true }, localID);
                            }
                        } else if (isSSOBackupPasswordReauth(fork.reauth)) {
                            /** Ensure SSO backup password reauth has required
                             * offline components, otherwise throw an error */
                            throw new Error('Invalid SSO backup password reauth');
                        }
                    } catch (err) {
                        /** If there was a failure processing the `reauth` payload
                         * do not pass it to the default completion handler. This
                         * avoids triggering the reauth handlers after boot. */
                        logger.warn(`[AuthServiceProvider] Failed reauth for "${action}"`, err);
                        onNotification({ type: 'error', text: c('Warning').t`Identity could not be confirmed` });
                        return auth.config.onLoginComplete?.(userID, localID);
                    }

                    logger.info(`[AuthServiceProvider] Successful reauth for "${action}"`);
                    return auth.config.onLoginComplete?.(userID, localID, fork.reauth);
                },
            }),

        onForkInvalid: ({ reauth }) => {
            history.replace('/');
            /** If the reauth fork could not be consumed - reinitialize
             * the authentication service to resume the latest session */
            if (reauth) void auth.init({ forceLock: true, forcePersist: true });
        },

        onForkRequest: async ({ url, state }, data) => {
            const revokedUIDs = getPendingRevocations();

            /** When requesting a fork, attempt to revoke any pending sessions that were
             * flagged during offline mode. This ensures sessions revoked locally are
             * also revoked BE-side before proceeding with the request and forcing reauth. */
            for (const UID of revokedUIDs) {
                await api({ ...revoke(), sideEffects: false, auth: { type: AuthMode.COOKIE, UID } })
                    .then(() => logger.info(`[AuthServiceProvider] Revoked ${UID}`))
                    .catch(noop);
            }

            clearPendingRevocations();
            sessionStorage.setItem(getStateKey(state), JSON.stringify(data ?? redirect.data));

            window.location.replace(url);
        },

        onSessionEmpty: () => {
            history.replace('/');
            app.setStatus(AppStatus.UNAUTHORIZED);
        },

        /** This retry handling is crucial to handle an edge case where the session might be
         * mutated by another tab while the same session is resumed multiple times. In the web
         * app, local key requests always follow a predictable order due to a queuing mechanism.
         * If the 'getPersistedSessionKey' call was queued by another tab updating the local key
         * and persisted session, this process prevents retries to ensure decryption of the most
         * recent session blob */
        onSessionInvalid: async (error, { localID, invalidSession, retry }) => {
            if (error instanceof InvalidPersistentSessionError) {
                await wait(randomIntFromInterval(0, 500));

                const persistedSession = await auth.config.getPersistedSession(localID);
                const shouldRetry = persistedSession && !isDeepEqual(persistedSession, invalidSession);
                if (shouldRetry) return retry(persistedSession);

                authStore.clear();
                localStorage.removeItem(getSessionKey(localID));
            }

            throw error;
        },

        onLocked: async (mode, localID, broadcast, userInitiatedLock) => {
            if (broadcast) sw?.send({ type: 'locked', localID, mode, broadcast });

            if (userInitiatedLock) history.replace({ ...history.location, state: { userInitiatedLock } });

            flushSync(() => {
                app.setBooted(false);
                app.setStatus(AppStatusFromLockMode[mode]);
            });

            store.dispatch(stateDestroy());
            store.dispatch(cacheCancel());
            store.dispatch(stopEventPolling());

            history.replace({ ...history.location, pathname: getLocalPath() });
        },

        onUnlocked: async (mode, _, localID) => {
            if (clientBooted(app.getState().status)) return;

            const validSession = authStore.validSession(authStore.getSession());

            if (mode === LockMode.SESSION) {
                /** If the unlock request was triggered before the authentication
                 * store session was fully hydrated, trigger a session resume. */
                if (!validSession) await auth.resumeSession(localID, { retryable: false, unlocked: true });
                else await auth.login(authStore.getSession(), { unlocked: true });
            }

            if ([LockMode.PASSWORD, LockMode.BIOMETRICS].includes(mode)) {
                const offlineEnabled = (await core.settings.resolve(localID))?.offlineEnabled ?? false;
                if (!getOnline() && offlineEnabled) store.dispatch(bootIntent({ offline: true }));
                else {
                    /** User may have resumed connection while trying to offline-unlock,
                     * as such force-lock if the lock mode requires it */
                    const forceLock = authStore.getLockMode() === LockMode.SESSION;
                    await auth.resumeSession(localID, { retryable: false, forceLock });
                }
            }
        },

        onLockUpdate: (lock, localID, broadcast) => {
            store.dispatch(lockSync(lock));

            if (broadcast) {
                switch (lock.mode) {
                    case LockMode.PASSWORD:
                    case LockMode.BIOMETRICS:
                    case LockMode.SESSION:
                        return sw?.send({ broadcast, localID, mode: lock.mode, type: 'locked' });
                    case LockMode.NONE:
                        return sw?.send({ broadcast, localID, mode: lock.mode, type: 'lock_deleted' });
                }
            }
        },

        onSessionPersist: (encrypted) => {
            localStorage.setItem(getSessionKey(authStore.getLocalID()), encrypted);

            /** Broadcast the session update to other tabs :
             * Sensitive components from the encrypted session blob are not synced.
             * Changes to security features (e.g., pin lock, password lock) should be
             * recomputed via explicit user action rather than auto-synced */
            const localID = authStore.getLocalID();
            const data = omit(authStore.getSession(), ['keyPassword', 'sessionLockToken', 'offlineKD']);

            sw?.send({ type: 'session', localID, data, broadcast: true });
        },

        onSessionFailure: () => {
            logger.info('[AuthServiceProvider] Session resume failure');
            if (!(clientOffline(app.getState().status) && !getOnline())) {
                app.setStatus(AppStatus.ERROR);
                app.setBooted(false);
            }
        },

        onSessionRefresh: async (localID, data, broadcast) => {
            logger.info('[AuthServiceProvider] Session tokens have been refreshed');
            const persistedSession = await auth.config.getPersistedSession(localID);

            if (persistedSession) {
                const { AccessToken, RefreshTime, RefreshToken, cookies } = data;
                /* update the persisted session tokens without re-encrypting the
                 * session blob as session refresh may happen before a full login
                 * with a partially hydrated authentication store. */
                persistedSession.AccessToken = AccessToken;
                persistedSession.RefreshToken = RefreshToken;
                persistedSession.RefreshTime = RefreshTime;
                persistedSession.cookies = cookies;

                /** Session refresh handler bypasses `auth.config.onSessionPersist` callback.
                 * - Auth store updates AFTER session persistence, not before
                 * - Prevents stale auth store data if persistence fails
                 * - Order: persist -> broadcast -> auth store update
                 * Note: This design accommodates an edge case in core auth service
                 * related to extension handling. While this edge case doesn't impact
                 * the web-app directly, this approach ensures data consistency. */
                const refreshedSession = JSON.stringify(persistedSession);
                localStorage.setItem(getSessionKey(localID), refreshedSession);
                if (broadcast) sw?.send({ type: 'session', localID, data, broadcast });
            }
        },

        onNotification,
    });

    auth.registerLockAdapter(LockMode.SESSION, sessionLockAdapterFactory(auth));
    auth.registerLockAdapter(LockMode.PASSWORD, passwordLockAdapterFactory(auth));
    if (!EXTENSION_BUILD) auth.registerLockAdapter(LockMode.BIOMETRICS, biometricsLockAdapterFactory(auth, core));

    return auth;
};
