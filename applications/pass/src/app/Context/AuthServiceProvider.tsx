import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useHistory, useRouteMatch } from 'react-router-dom';

import type { ServiceWorkerMessageHandler } from 'proton-pass-web/app/ServiceWorker/ServiceWorkerProvider';
import { useServiceWorker } from 'proton-pass-web/app/ServiceWorker/ServiceWorkerProvider';
import { store } from 'proton-pass-web/app/Store/store';
import { deletePassDB, getDBCache } from 'proton-pass-web/lib/database';
import { onboarding } from 'proton-pass-web/lib/onboarding';
import { settings } from 'proton-pass-web/lib/settings';
import { telemetry } from 'proton-pass-web/lib/telemetry';
import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { api } from '@proton/pass/lib/api/api';
import { isOffline, isOnline } from '@proton/pass/lib/api/utils';
import { getConsumeForkParameters } from '@proton/pass/lib/auth/fork';
import { type AuthService, createAuthService } from '@proton/pass/lib/auth/service';
import { isValidPersistedSession, isValidSession, resumeSession } from '@proton/pass/lib/auth/session';
import { authStore } from '@proton/pass/lib/auth/store';
import { canOfflineUnlock } from '@proton/pass/lib/cache/utils';
import { clientBooted, clientOfflineUnlocked, isTaggedBuild } from '@proton/pass/lib/client';
import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { bootIntent, cacheCancel, sessionLockSync, stateDestroy, stopEventPolling } from '@proton/pass/store/actions';
import { selectOfflineEnabled } from '@proton/pass/store/selectors';
import { AppStatus, type Maybe, PlanType, SessionLockStatus } from '@proton/pass/types';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    getBasename,
    getLocalIDFromPathname,
    stripLocalBasenameFromPathname,
} from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS, PASS_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { wait } from '@proton/shared/lib/helpers/promise';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { useClientRef } from './ClientProvider';

const STORAGE_PREFIX = 'ps-';
const getSessionKey = (localId?: number) => `${STORAGE_PREFIX}${localId ?? 0}`;
const getStateKey = (state: string) => `f${state}`;

const getDefaultLocalID = (): Maybe<number> => {
    const defaultKey = Object.keys(localStorage).find((key) => key.startsWith(STORAGE_PREFIX));
    if (defaultKey) return parseInt(defaultKey.replace(STORAGE_PREFIX, ''), 10);
};

export const AuthServiceContext = createContext<Maybe<AuthService>>(undefined);

export const useAuthService = (): AuthService => {
    const authService = useContext(AuthServiceContext);
    if (authService === undefined) throw new Error('authentication service not initialized');
    return authService;
};

const canResumeOffline = async (): Promise<boolean> => {
    const cache = await getDBCache(authStore.getUserID()!);
    return canOfflineUnlock(cache, authStore);
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

                const handleOffline = async () => {
                    const persistedSession = await auth.config.getPersistedSession(initialLocalID);

                    if (persistedSession) {
                        /** configure the authentication store partially in order to
                         * hydrate the userID and offline salts properties */
                        authStore.setSession(persistedSession);
                        if (await canResumeOffline()) client.current.setStatus(AppStatus.OFFLINE_LOCKED);
                        else if (authStore.hasSession(initialLocalID)) client.current.setStatus(AppStatus.ERROR);
                        else client.current.setStatus(AppStatus.UNAUTHORIZED);
                    } else client.current.setStatus(AppStatus.UNAUTHORIZED);

                    return false;
                };

                if (isOffline()) return handleOffline();

                /* remove any in-memory lock status/tokens to force
                 * session lock revalidation on init */
                const session = authStore.getSession();
                authStore.setLockStatus(undefined);
                authStore.setLockToken(undefined);

                const loggedIn = await (authStore.hasSession(pathLocalID) && isValidSession(session)
                    ? auth.login(session)
                    : auth.resumeSession(initialLocalID, { forceLock: true }));

                const locked = authStore.getLockStatus() === SessionLockStatus.LOCKED;
                const hasLocalID = pathLocalID !== undefined;
                const validSession = isValidSession(session) && session.LocalID === initialLocalID;
                const autoFork = !loggedIn && !locked && hasLocalID && !validSession;

                if (isOffline()) return handleOffline();
                if (autoFork && isOnline()) {
                    /* If the session could not be resumed from the LocalID from path,
                     * we are likely dealing with an app-switch request from another client.
                     * In this case, redirect to account through a fork request */
                    authService.requestFork({ app: APPS.PROTONPASS, host: config.SSO_URL, localID: pathLocalID });
                }

                return loggedIn;
            },

            onAuthorize: () => {
                if (clientOfflineUnlocked(client.current.state.status)) return;
                else client.current.setStatus(AppStatus.AUTHORIZING);
            },

            onAuthorized: async (_, localID) => {
                const bootedOffline = clientOfflineUnlocked(client.current.state.status);
                if (bootedOffline) client.current.setStatus(AppStatus.READY);
                else {
                    const redirect = stripLocalBasenameFromPathname(redirectPath.current);
                    history.replace((getBasename(localID) ?? '/') + redirect);
                    client.current.setStatus(AppStatus.AUTHORIZED);
                    store.dispatch(bootIntent());
                }

                onboarding.init().catch(noop);
                setSentryUID(authStore.getUID());
            },

            onUnauthorized: (userID, localID, broadcast) => {
                if (broadcast) sw?.send({ type: 'unauthorized', localID, broadcast: true });
                if (userID) void deletePassDB(userID); /* wipe the local DB cache */

                setSentryUID(undefined);
                onboarding.reset();
                telemetry.stop();
                void settings.clear();
                localStorage.removeItem(getSessionKey(localID));

                flushSync(() => client.current.setStatus(AppStatus.UNAUTHORIZED));

                store.dispatch(cacheCancel());
                store.dispatch(stopEventPolling());
                store.dispatch(stateDestroy());
                history.replace('/');
            },

            onForkConsumed: async ({ UID, AccessToken }, state) => {
                history.replace({ hash: '' }); /** removes selector from hash */

                if ((BUILD_TARGET === 'darwin' || BUILD_TARGET === 'linux') && isTaggedBuild(config)) {
                    const { plan } = await getUserAccess(withAuthHeaders(UID, AccessToken, {}));
                    if (plan.Type === PlanType.free || Boolean(plan.TrialEnd)) {
                        throw new Error(
                            c('Error').t`Please upgrade to have early access to ${PASS_APP_NAME} desktop app`
                        );
                    }
                }

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

            onSessionLocked: (localID, offline, broadcast) => {
                flushSync(() => client.current.setStatus(offline ? AppStatus.OFFLINE_LOCKED : AppStatus.LOCKED));
                if (broadcast) sw?.send({ type: 'locked', localID, offline, broadcast: true });

                store.dispatch(cacheCancel());
                store.dispatch(stopEventPolling());
                store.dispatch(stateDestroy());
                history.replace('/');
            },

            onSessionLockUpdate: (lock, broadcast) => {
                store.dispatch(sessionLockSync(lock));
                const localID = authStore.getLocalID();

                if (broadcast) {
                    switch (lock.status) {
                        case SessionLockStatus.REGISTERED:
                            return sw?.send({ type: 'locked', localID, offline: false, broadcast: true });
                        case SessionLockStatus.NONE:
                            return sw?.send({ type: 'unlocked', localID, broadcast: true });
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
            onSessionFailure: async () => {
                const offline = isOffline();
                const resumeOffline = offline && (await canResumeOffline());
                client.current.setStatus(resumeOffline ? AppStatus.OFFLINE_LOCKED : AppStatus.ERROR);
            },
            onNotification: (notification) =>
                createNotification({
                    ...notification,
                    key: notification.key ?? NotificationKey.AUTH,
                    type: 'error',
                    deduplicate: true,
                }),
        });

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

        const handleLocked: ServiceWorkerMessageHandler<'locked'> = ({ localID, offline }) => {
            const unlocked = authStore.getLockStatus() !== SessionLockStatus.LOCKED;
            if (authStore.hasSession(localID) && unlocked) {
                void authService.lock({
                    soft: true,
                    broadcast: false,
                    offline,
                });
            }
        };

        const handleUnlocked: ServiceWorkerMessageHandler<'unlocked'> = ({ localID }) => {
            const locked = authStore.getLockStatus() === SessionLockStatus.LOCKED;
            if (authStore.hasSession(localID)) {
                authStore.setLockLastExtendTime(undefined);
                authStore.setLockTTL(undefined);
                authStore.setLockStatus(SessionLockStatus.NONE);
                authStore.setLockToken(undefined);
                if (locked) void authService.login(authStore.getSession());
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
        sw?.on('unlocked', handleUnlocked);
        sw?.on('refresh', handleRefresh);

        run().catch(noop);

        return () => {
            sw?.off('unauthorized', handleUnauthorized);
            sw?.off('locked', handleLocked);
            sw?.off('refresh', handleRefresh);
        };
    }, []);

    const probe = useActivityProbe(async () => {
        if (!authStore.hasSession()) return;

        const registeredLock = authStore.getLockStatus() === SessionLockStatus.REGISTERED;
        const ttl = authStore.getLockTTL();
        const status = client.current.state.status;
        const booted = clientBooted(status);
        const offlineEnabled = selectOfflineEnabled(store.getState());
        const offlineLock = offlineEnabled && clientOfflineUnlocked(status);

        if (booted && registeredLock && ttl) {
            const now = getEpoch();
            const diff = now - (authStore.getLockLastExtendTime() ?? 0);

            if (diff > ttl) return authService.lock({ soft: true, broadcast: true, offline: offlineLock });
            if (diff > ttl * 0.5) {
                logger.info('[AuthServiceProvider] Activity probe extending lock time');
                return authService.checkLock().catch(noop);
            }
        }
    });

    useVisibleEffect((visible) => probe[visible ? 'start' : 'cancel']());

    return <AuthServiceContext.Provider value={authService}>{children}</AuthServiceContext.Provider>;
};
