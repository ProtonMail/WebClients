import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import type { ServiceWorkerMessageHandler } from 'proton-pass-web/app/ServiceWorker/ServiceWorkerProvider';
import { useServiceWorker } from 'proton-pass-web/app/ServiceWorker/ServiceWorkerProvider';
import { store } from 'proton-pass-web/app/Store/store';
import { deletePassDB, getDBCache } from 'proton-pass-web/lib/database';
import { onboarding } from 'proton-pass-web/lib/onboarding';
import { settings } from 'proton-pass-web/lib/settings';
import { telemetry } from 'proton-pass-web/lib/telemetry';

import { useNotifications } from '@proton/components/hooks';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { api } from '@proton/pass/lib/api/api';
import { getConsumeForkParameters } from '@proton/pass/lib/auth/fork';
import { type AuthService, createAuthService } from '@proton/pass/lib/auth/service';
import { isValidPersistedSession, isValidSession } from '@proton/pass/lib/auth/session';
import { authStore } from '@proton/pass/lib/auth/store';
import { canOfflineUnlock } from '@proton/pass/lib/cache/utils';
import { clientOfflineUnlocked, clientReady } from '@proton/pass/lib/client';
import { bootIntent, cacheCancel, sessionLockSync, stateDestroy, stopEventPolling } from '@proton/pass/store/actions';
import { AppStatus, type Maybe, SessionLockStatus } from '@proton/pass/types';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import {
    getBasename,
    getLocalIDFromPathname,
    stripLocalBasenameFromPathname,
} from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

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
                        const cache = await getDBCache(authStore.getUserID()!);

                        if (canOfflineUnlock(cache, authStore)) client.current.setStatus(AppStatus.OFFLINE_LOCKED);
                        else if (authStore.hasSession(initialLocalID)) client.current.setStatus(AppStatus.ERROR);
                        else client.current.setStatus(AppStatus.UNAUTHORIZED);
                    } else client.current.setStatus(AppStatus.UNAUTHORIZED);

                    const redirect = stripLocalBasenameFromPathname(redirectPath.current);
                    history.replace((getBasename(initialLocalID) ?? '/') + redirect);

                    return false;
                };

                if (OFFLINE_SUPPORTED && !navigator.onLine) return handleOffline();

                /* remove any in-memory lock status/tokens to force
                 * session lock revalidation on init */
                const session = authStore.getSession();
                authStore.setLockStatus(undefined);
                authStore.setLockToken(undefined);

                const loggedIn = await (authStore.hasSession(pathLocalID) && isValidSession(session)
                    ? auth.login(session)
                    : auth.resumeSession(initialLocalID, { forceLock: true }));

                const notLocked = client.current.state.status !== AppStatus.LOCKED;
                const hasLocalID = pathLocalID !== undefined;
                const validSession = isValidSession(session) && session.LocalID === initialLocalID;
                const autoFork = !loggedIn && notLocked && hasLocalID && !validSession;
                const apiOffline = api.getState().offline;

                if (OFFLINE_SUPPORTED && apiOffline) return handleOffline();
                if (autoFork) {
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
                if (broadcast) sw.send({ type: 'unauthorized', localID, broadcast: true });
                if (userID) void deletePassDB(userID); /* wipe the local DB cache */

                onboarding.reset();
                telemetry.stop();
                void settings.clear();

                localStorage.removeItem(getSessionKey(localID));
                client.current.setStatus(AppStatus.UNAUTHORIZED);

                store.dispatch(cacheCancel());
                store.dispatch(stopEventPolling());
                store.dispatch(stateDestroy());

                history.replace('/');
                setSentryUID(undefined);
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

            onSessionLocked: (localID, broadcast) => {
                client.current.setStatus(AppStatus.LOCKED);
                if (broadcast) sw.send({ type: 'locked', localID, broadcast: true });

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
                            return sw.send({ type: 'locked', localID, broadcast: true });
                        case SessionLockStatus.NONE:
                            return sw.send({ type: 'unlocked', localID, broadcast: true });
                    }
                }
            },

            onSessionRefresh: async (localID, data, broadcast) => {
                logger.info('[AuthServiceProvider] Session tokens have been refreshed');
                const persistedSession = await auth.config.getPersistedSession(localID);
                if (broadcast) sw.send({ type: 'refresh', localID, data, broadcast: true });

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
            onSessionFailure: () => client.current.setStatus(AppStatus.ERROR),
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

        if (matchConsumeFork) {
            void authService.consumeFork({ mode: 'sso', key, localState, state, selector, payloadVersion });
        } else void authService.init({ forceLock: false });

        /* setup listeners on the service worker's broadcasting channel in order to
         * sync the current client if any authentication changes happened in another tab */

        const handleUnauthorized: ServiceWorkerMessageHandler<'unauthorized'> = ({ localID }) => {
            if (authStore.hasSession(localID)) authService.logout({ soft: true, broadcast: false }).catch(noop);
        };

        const handleLocked: ServiceWorkerMessageHandler<'locked'> = ({ localID }) => {
            const unlocked = authStore.getLockStatus() !== SessionLockStatus.LOCKED;
            if (authStore.hasSession(localID) && unlocked) void authService.lock({ soft: true, broadcast: false });
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

        sw.on('unauthorized', handleUnauthorized);
        sw.on('locked', handleLocked);
        sw.on('unlocked', handleUnlocked);
        sw.on('refresh', handleRefresh);

        return () => {
            sw.off('unauthorized', handleUnauthorized);
            sw.off('locked', handleLocked);
            sw.off('refresh', handleRefresh);
        };
    }, []);

    const probe = useActivityProbe(async () => {
        if (!authStore.hasSession()) return;

        const registeredLock = authStore.getLockStatus() === SessionLockStatus.REGISTERED;
        const ttl = authStore.getLockTTL();

        if (clientReady(client.current.state.status) && registeredLock && ttl) {
            const now = getEpoch();
            const diff = now - (authStore.getLockLastExtendTime() ?? 0);
            if (diff > ttl * 0.5) {
                logger.info('[AuthServiceProvider] Activity probe extending lock time');
                await authService.checkLock().catch(noop);
            }
        }
    });

    useVisibleEffect((visible) => probe[visible ? 'start' : 'cancel']());

    return <AuthServiceContext.Provider value={authService}>{children}</AuthServiceContext.Provider>;
};
