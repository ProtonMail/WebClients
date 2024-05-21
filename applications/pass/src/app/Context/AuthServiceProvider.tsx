import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useHistory, useRouteMatch } from 'react-router-dom';

import type { ServiceWorkerMessageHandler } from 'proton-pass-web/app/ServiceWorker/ServiceWorkerProvider';
import { useServiceWorker } from 'proton-pass-web/app/ServiceWorker/ServiceWorkerProvider';
import { store } from 'proton-pass-web/app/Store/store';
import { deletePassDB, getDBCache, getEncryptedCacheKey } from 'proton-pass-web/lib/database';
import { onboarding } from 'proton-pass-web/lib/onboarding';
import { settings } from 'proton-pass-web/lib/settings';
import { telemetry } from 'proton-pass-web/lib/telemetry';

import { useNotifications } from '@proton/components/hooks';
import { UnlockProvider } from '@proton/pass/components/Lock/UnlockProvider';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { api } from '@proton/pass/lib/api/api';
import { isOffline, isOnline } from '@proton/pass/lib/api/utils';
import { getConsumeForkParameters } from '@proton/pass/lib/auth/fork';
import { passwordLockAdapterFactory } from '@proton/pass/lib/auth/lock/password/adapter';
import { sessionLockAdapterFactory } from '@proton/pass/lib/auth/lock/session/adapter';
import { AppStatusFromLockMode, LockMode, type UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import { type AuthService, createAuthService } from '@proton/pass/lib/auth/service';
import { isValidPersistedSession, isValidSession, resumeSession } from '@proton/pass/lib/auth/session';
import { authStore } from '@proton/pass/lib/auth/store';
import { canPasswordUnlock } from '@proton/pass/lib/cache/utils';
import { bootIntent, cacheCancel, lockSync, stateDestroy, stopEventPolling } from '@proton/pass/store/actions';
import { AppStatus, type Maybe } from '@proton/pass/types';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { logger } from '@proton/pass/utils/logger';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    getBasename,
    getLocalIDFromPathname,
    stripLocalBasenameFromPathname,
} from '@proton/shared/lib/authentication/pathnameHelper';
import { STORAGE_PREFIX } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { wait } from '@proton/shared/lib/helpers/promise';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { useClientRef } from './ClientProvider';

const getSessionKey = (localId?: number) => `${STORAGE_PREFIX}${localId ?? 0}`;
const getStateKey = (state: string) => `f${state}`;

const getDefaultLocalID = (): Maybe<number> => {
    const defaultKey = Object.keys(localStorage).find((key) => key.startsWith(STORAGE_PREFIX));
    if (defaultKey) return parseInt(defaultKey.replace(STORAGE_PREFIX, ''), 10);
};

const getOfflineEnabled = async (): Promise<boolean> => (await settings.resolve()).offlineEnabled ?? false;

export const AuthServiceContext = createContext<Maybe<AuthService>>(undefined);

export const useAuthService = (): AuthService => {
    const authService = useContext(AuthServiceContext);
    if (authService === undefined) throw new Error('authentication service not initialized');
    return authService;
};

/** The only reason we have to wrap the AuthenticationService to a react context is
 * to be able to leverage the history object provided by `react-router-dom` and the
 * notifications handler. Ideally this could live outside of react-land by moving the
 * authentication service to an event-bus architecture.. */
export const AuthServiceProvider: FC<PropsWithChildren> = ({ children }) => {
    const sw = useServiceWorker();
    const client = useClientRef();
    const history = useHistory();
    const config = usePassConfig();
    const { createNotification } = useNotifications();
    const { getCurrentLocation } = useNavigation();

    const matchConsumeFork = useRouteMatch(SSO_PATHS.FORK);
    const redirectPath = useRef(stripLocalBasenameFromPathname(getCurrentLocation()));
    const setRedirectPath = (redirect: string) => (redirectPath.current = redirect);

    const authService = useMemo(() => {
        const auth = createAuthService({
            api,
            authStore,

            getPersistedSession: (localID) => {
                const encryptedSession = localStorage.getItem(getSessionKey(localID));
                if (!encryptedSession) return null;

                const persistedSession = JSON.parse(encryptedSession);
                return isValidPersistedSession(persistedSession) ? persistedSession : null;
            },

            onInit: async () => {
                const pathLocalID = getLocalIDFromPathname(location.pathname);
                const initialLocalID = pathLocalID ?? getDefaultLocalID();
                const persistedSession = await auth.config.getPersistedSession(initialLocalID);

                /** configure the authentication store partially in order to
                 * hydrate the userID and offline salts properties */
                if (persistedSession) authStore.setSession(persistedSession);

                /** if we had an in-memory session - most likely due to a
                 * soft reload - clear the session lock token and offlineKD
                 * to force the user to unlock on boot */
                authStore.setLocked(false);
                authStore.setLockToken(undefined);
                authStore.setOfflineKD(undefined);

                const passwordUnlockable = canPasswordUnlock({
                    cache: await getDBCache(authStore.getUserID()!),
                    lockMode: authStore.getLockMode(),
                    offline: isOffline(),
                    offlineConfig: authStore.getOfflineConfig(),
                    offlineEnabled: await getOfflineEnabled(),
                });

                if (passwordUnlockable) {
                    authStore.setPassword(undefined);
                    client.current.setStatus(AppStatus.PASSWORD_LOCKED);
                    return false;
                }

                const session = authStore.getSession();

                const loggedIn = await (authStore.hasSession(pathLocalID) && isValidSession(session)
                    ? auth.login(session, { forceLock: true })
                    : auth.resumeSession(initialLocalID, { forceLock: true }));

                const locked = authStore.getLocked();
                const hasLocalID = pathLocalID !== undefined;
                const validSession = isValidSession(session) && session.LocalID === initialLocalID;
                const autoFork = !loggedIn && !locked && hasLocalID && !validSession;

                if (isOffline()) client.current.setStatus(AppStatus.ERROR);

                if (autoFork && isOnline()) {
                    /* If the session could not be resumed from the LocalID from path,
                     * we are likely dealing with an app-switch request from another client.
                     * In this case, redirect to account through a fork request */
                    authService.requestFork({ app: APPS.PROTONPASS, host: config.SSO_URL, localID: pathLocalID });
                }

                return loggedIn;
            },

            onAuthorize: () => {
                if (client.current.state.booted) return;
                return client.current.setStatus(AppStatus.AUTHORIZING);
            },

            onAuthorized: async (_, localID) => {
                client.current.setLoggedIn(true);
                onboarding.init().catch(noop);
                setSentryUID(authStore.getUID());

                if (client.current.state.booted) client.current.setStatus(AppStatus.READY);
                else {
                    const redirect = stripLocalBasenameFromPathname(redirectPath.current);
                    history.replace((getBasename(localID) ?? '/') + redirect);
                    client.current.setStatus(AppStatus.AUTHORIZED);
                    store.dispatch(bootIntent());
                }
            },

            onUnauthorized: (userID, localID, broadcast) => {
                if (broadcast) sw?.send({ type: 'unauthorized', localID, broadcast: true });

                /* wipe the local DB cache and session data */
                if (userID) deletePassDB(userID).catch(noop);
                localStorage.removeItem(getSessionKey(localID));

                onboarding.reset();
                telemetry.stop();
                void settings.clear();
                setSentryUID(undefined);

                flushSync(() => {
                    client.current.setBooted(false);
                    client.current.setStatus(AppStatus.UNAUTHORIZED);
                });

                store.dispatch(cacheCancel());
                store.dispatch(stopEventPolling());
                store.dispatch(stateDestroy());
                history.replace('/');
            },

            onForkConsumed: async (_, state) => {
                history.replace({ hash: '' }); /** removes selector from hash */

                try {
                    const data = JSON.parse(sessionStorage.getItem(getStateKey(state))!);
                    if ('url' in data && typeof data.url === 'string') setRedirectPath(data.url);
                } catch {
                    setRedirectPath('/');
                }
            },

            onForkInvalid: () => history.replace('/'),

            onForkRequest: ({ url, state }) => {
                sessionStorage.setItem(getStateKey(state), JSON.stringify({ url: redirectPath.current }));
                window.location.replace(url);
            },

            onSessionEmpty: async () => {
                history.replace('/');
                client.current.setStatus(AppStatus.UNAUTHORIZED);
            },

            /** This retry handling is crucial to handle an edge case where the session might be
             * mutated by another tab while the same session is resumed multiple times. In the web
             * app, local key requests always follow a predictable order due to a queuing mechanism.
             * If the 'getPersistedSessionKey' call was queued by another tab updating the local key
             * and persisted session, this process prevents retries to ensure decryption of the most
             * recent session blob */
            onSessionInvalid: async (error, { localID, invalidSession }) => {
                if (error instanceof InvalidPersistentSessionError) {
                    await wait(randomIntFromInterval(0, 500));

                    const persistedSession = await authService.config.getPersistedSession(localID);
                    const shouldRetry = persistedSession && !isDeepEqual(persistedSession, invalidSession);
                    if (shouldRetry) return resumeSession(persistedSession, localID, authService.config);

                    authStore.clear();
                    localStorage.removeItem(getSessionKey(localID));
                }

                throw error;
            },

            onLocked: async (mode, localID, broadcast) => {
                flushSync(() => {
                    client.current.setBooted(false);
                    client.current.setStatus(AppStatusFromLockMode[mode]);
                });

                if (broadcast) sw?.send({ type: 'locked', localID, mode, broadcast: true });

                if (client.current.state.booted) {
                    store.dispatch(stateDestroy());
                    store.dispatch(cacheCancel());
                }

                store.dispatch(stopEventPolling());
                history.replace('/');
            },

            onUnlocked: async (mode, _, localID) => {
                const validSession = isValidSession(authStore.getSession());

                if (mode === LockMode.SESSION) {
                    /** If the unlock request was triggered before the authentication
                     * store session was fully hydrated, trigger a session resume. */
                    if (!validSession) await authService.resumeSession(localID, { retryable: false });
                    else await authService.login(authStore.getSession());
                }

                if (mode === LockMode.PASSWORD) {
                    if (isOffline() && (await getOfflineEnabled())) store.dispatch(bootIntent({ offline: true }));
                    else await authService.resumeSession(localID, { retryable: false });
                }
            },

            onLockUpdate: (lock, localID, broadcast) => {
                store.dispatch(lockSync(lock));

                if (broadcast) {
                    switch (lock.mode) {
                        case LockMode.PASSWORD:
                        case LockMode.SESSION:
                            return sw?.send({ broadcast: true, localID, mode: lock.mode, type: 'locked' });
                        case LockMode.NONE:
                            return sw?.send({ broadcast: true, localID, mode: lock.mode, type: 'lock_deleted' });
                    }
                }
            },

            onSessionRefresh: async (localID, data, broadcast) => {
                logger.info('[AuthServiceProvider] Session tokens have been refreshed');
                const persistedSession = await auth.config.getPersistedSession(localID);
                if (broadcast) sw?.send({ type: 'refresh', localID, data, broadcast: true });

                if (persistedSession) {
                    const { AccessToken, RefreshTime, RefreshToken } = data;
                    /* update the persisted session tokens without re-encrypting the
                     * session blob as session refresh may happen before a full login
                     * with a partially hydrated authentication store. */
                    persistedSession.AccessToken = AccessToken;
                    persistedSession.RefreshToken = RefreshToken;
                    persistedSession.RefreshTime = RefreshTime;
                    localStorage.setItem(getSessionKey(localID), JSON.stringify(persistedSession));
                }
            },
            onSessionPersist: (encrypted) => localStorage.setItem(getSessionKey(authStore.getLocalID()), encrypted),

            onSessionFailure: () => {
                client.current.setStatus(AppStatus.ERROR);
                client.current.setBooted(false);
            },

            onNotification: (notification) =>
                createNotification({
                    ...notification,
                    key: notification.key ?? NotificationKey.AUTH,
                    type: 'error',
                    deduplicate: true,
                }),
        });

        auth.registerLockAdapter(LockMode.SESSION, sessionLockAdapterFactory(auth));
        auth.registerLockAdapter(LockMode.PASSWORD, passwordLockAdapterFactory(auth, { getEncryptedCacheKey }));

        return auth;
    }, []);

    useEffect(() => {
        const { key, selector, state, payloadVersion } = getConsumeForkParameters();
        const localState = sessionStorage.getItem(getStateKey(state));

        const run = async () => {
            if (matchConsumeFork) {
                return authService.consumeFork({ mode: 'sso', key, localState, state, selector, payloadVersion });
            } else return authService.init({ forceLock: false });
        };

        /* setup listeners on the service worker's broadcasting channel in order to
         * sync the current client if any authentication changes happened in another tab */

        const handleUnauthorized: ServiceWorkerMessageHandler<'unauthorized'> = ({ localID }) => {
            if (authStore.hasSession(localID)) authService.logout({ soft: true, broadcast: false }).catch(noop);
        };

        const handleLocked: ServiceWorkerMessageHandler<'locked'> = ({ localID, mode }) => {
            const { status } = client.current.state;

            if (authStore.hasSession(localID)) {
                if (mode !== authStore.getLockMode()) return window.location.reload();
                if (status !== AppStatusFromLockMode[mode]) return authService.lock(mode, { soft: true });
            }
        };

        const handleLockDeleted: ServiceWorkerMessageHandler<'lock_deleted'> = ({ localID }) => {
            const locked = authStore.getLocked();

            if (authStore.hasSession(localID)) {
                authStore.setLockLastExtendTime(undefined);
                authStore.setLockMode(LockMode.NONE);
                authStore.setLockToken(undefined);
                authStore.setLockTTL(undefined);
                authStore.setLocked(false);

                if (locked) window.location.reload();
            }
        };

        const handleRefresh: ServiceWorkerMessageHandler<'refresh'> = ({ localID, data }) => {
            if (authStore.hasSession(localID)) {
                authStore.setAccessToken(data.AccessToken);
                authStore.setRefreshToken(data.RefreshToken);
                authStore.setUID(data.UID);
                authStore.setRefreshTime(data.RefreshTime);
                void authService.config.onSessionRefresh?.(localID, data, false);
            }
        };

        sw?.on('unauthorized', handleUnauthorized);
        sw?.on('locked', handleLocked);
        sw?.on('lock_deleted', handleLockDeleted);
        sw?.on('refresh', handleRefresh);

        run().catch(noop);

        return () => {
            sw?.off('unauthorized', handleUnauthorized);
            sw?.off('locked', handleLocked);
            sw?.off('refresh', handleRefresh);
        };
    }, []);

    const handleUnlock = useCallback(async ({ mode, secret }: UnlockDTO) => {
        try {
            await authService.unlock(mode, secret);
        } catch (err) {
            throw new Error(getErrorMessage(err));
        }
    }, []);

    return (
        <AuthServiceContext.Provider value={authService}>
            <UnlockProvider unlock={handleUnlock}>{children}</UnlockProvider>
        </AuthServiceContext.Provider>
    );
};
