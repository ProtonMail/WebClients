import { flushSync } from 'react-dom';

import type { History } from 'history';
import type { ServiceWorkerClient } from 'proton-pass-web/app/ServiceWorker/client/client';
import { store } from 'proton-pass-web/app/Store/store';
import { B2BEvents } from 'proton-pass-web/lib/b2b';
import { deletePassDB } from 'proton-pass-web/lib/database';
import { spotlight } from 'proton-pass-web/lib/spotlight';
import { clearUserLocalData, localGarbageCollect } from 'proton-pass-web/lib/storage';
import { telemetry } from 'proton-pass-web/lib/telemetry';
import { getThemeForLocalID } from 'proton-pass-web/lib/theme';

import type { CreateNotificationOptions } from '@proton/components';
import type { AppStateContextValue } from '@proton/pass/components/Core/AppStateProvider';
import type { PassCoreContextValue } from '@proton/pass/components/Core/PassCoreProvider';
import {
    type AuthRouteState,
    getBootRedirectPath,
    getLocalPath,
    getRouteError,
} from '@proton/pass/components/Navigation/routing';
import { DEFAULT_LOCK_TTL } from '@proton/pass/constants';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import { api } from '@proton/pass/lib/api/api';
import { biometricsLockAdapterFactory } from '@proton/pass/lib/auth/lock/biometrics/adapter';
import { passwordLockAdapterFactory } from '@proton/pass/lib/auth/lock/password/adapter';
import { sessionLockAdapterFactory } from '@proton/pass/lib/auth/lock/session/adapter';
import { AppStatusFromLockMode, LockMode } from '@proton/pass/lib/auth/lock/types';
import { createAuthService as createCoreAuthService } from '@proton/pass/lib/auth/service';
import { getPersistedSessionKey } from '@proton/pass/lib/auth/session';
import { authStore } from '@proton/pass/lib/auth/store';
import type { AuthSwitchService } from '@proton/pass/lib/auth/switch';
import { getOfflineVerifier } from '@proton/pass/lib/cache/crypto';
import { canLocalUnlock } from '@proton/pass/lib/cache/utils';
import { clientBooted, clientOffline } from '@proton/pass/lib/client';
import { bootIntent, cacheCancel, lockSync, stateDestroy, stopEventPolling } from '@proton/pass/store/actions';
import { AppStatus, type MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { objectHandler } from '@proton/pass/utils/object/handler';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';
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
    getDefaultLocalID,
    getPersistedLocalIDsForUserID,
    getPersistedSession,
    getPersistedSessions,
    getSessionKey,
    getStateKey,
} from './sessions';

type AuthServiceBindings = {
    app: AppStateContextValue;
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
    const route = objectHandler({ redirectPath: getBootRedirectPath(history.location) });

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

            /** if we have mismatch between the path localID and the in-memory
             * one, wipe the auth store. This can happen if a user manually
             * mutates the local path in the URL */
            if (pathLocalID && activeLocalID !== pathLocalID) authStore.clear();

            const localID = pathLocalID ?? authStore.getLocalID() ?? getDefaultLocalID(sessions);
            const error = getRouteError(history.location.search);

            if (error !== null) {
                route.set('redirectPath', '/');
                const pathname = pathLocalID ? `/u/${pathLocalID}` : '/';
                app.setStatus(AppStatus.ERROR);
                history.replace({ search: '', pathname, state: { error } });
                return false;
            } else history.replace({ state: null });

            const persistedSession = await auth.config.getPersistedSession(localID);

            if (persistedSession) {
                /** Configure the authentication store partially in order to
                 * hydrate the userID and offline salts before resuming session. */
                authStore.setSession(persistedSession);

                /** Apply user preferences early */
                core.i18n.setLocale().catch(noop);
                core.setTheme(await getThemeForLocalID(persistedSession.LocalID));

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
                 * In this case, redirect to account through a fork request */
                auth.requestFork({ app: APPS.PROTONPASS, host: config.SSO_URL, localID: pathLocalID });
            }

            return loggedIn;
        },

        onLoginStart: () => {
            if (app.state.booted) return;
            return app.setStatus(AppStatus.AUTHORIZING);
        },

        onLoginComplete: async (_, localID) => {
            app.setAuthorized(true);
            setSentryUID(authStore.getUID());

            /** Repersist the session if sufficient time has elapsed since last use */
            if (getEpoch() - authStore.getLastUsedAt() > UNIX_MINUTE) {
                await auth.persistSession({ regenerateClientKey: false }).catch(noop);
            }

            if (app.state.booted) app.setStatus(AppStatus.READY);
            else {
                const redirect = stripLocalBasenameFromPathname(route.get('redirectPath'));
                history.replace((getBasename(localID) ?? '/') + redirect);
                app.setStatus(AppStatus.AUTHORIZED);
                store.dispatch(bootIntent());
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

            setSentryUID(undefined);

            flushSync(() => {
                app.setBooted(false);
                app.setStatus(AppStatus.UNAUTHORIZED);
                app.setAuthorized(false);
            });

            store.dispatch(stateDestroy());
            history.replace('/');
        },

        onMissingScope: () => {
            flushSync(() => app.setStatus(AppStatus.MISSING_SCOPE));
            history.replace('/');
        },

        onForkConsumed: async (session, { state }) => {
            const { offlineConfig, offlineKD, UserID, LocalID, encryptedOfflineKD } = session;
            history.replace({ hash: '' }); /** removes selector from hash */

            try {
                const data = JSON.parse(sessionStorage.getItem(getStateKey(state))!);
                if ('url' in data && typeof data.url === 'string') route.set('redirectPath', data.url);
            } catch {
                route.set('redirectPath', '/');
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

            if (offlineConfig && offlineKD) {
                logger.info('[AuthServiceProvider] Automatically creating password lock');
                session.lockMode = encryptedOfflineKD ? LockMode.BIOMETRICS : LockMode.PASSWORD;
                session.lockTTL = DEFAULT_LOCK_TTL;
                session.offlineVerifier = await getOfflineVerifier(stringToUint8Array(offlineKD));
                authStore.setLockLastExtendTime(getEpoch());
            }

            authStore.setSession(session);
            await authSwitch.sync({ revalidate: false });
        },

        onForkInvalid: () => history.replace('/'),

        onForkRequest: ({ url, state }) => {
            sessionStorage.setItem(getStateKey(state), JSON.stringify({ url: route.get('redirectPath') }));
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
            if (clientBooted(app.state.status)) return;

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
            if (!(clientOffline(app.state.status) && !getOnline())) {
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

                localStorage.setItem(getSessionKey(localID), JSON.stringify(persistedSession));

                if (broadcast) sw?.send({ type: 'session', localID, data, broadcast });
            }
        },

        onNotification,
    });

    auth.registerLockAdapter(LockMode.SESSION, sessionLockAdapterFactory(auth));
    auth.registerLockAdapter(LockMode.PASSWORD, passwordLockAdapterFactory(auth));
    if (DESKTOP_BUILD) auth.registerLockAdapter(LockMode.BIOMETRICS, biometricsLockAdapterFactory(auth));

    return auth;
};
