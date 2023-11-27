import { type FC, createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { useNotifications } from '@proton/components/hooks';
import { preserveSearch } from '@proton/pass/components/Core/routing';
import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { type AuthService, createAuthService } from '@proton/pass/lib/auth/service';
import { isValidPersistedSession } from '@proton/pass/lib/auth/session';
import { clientReady } from '@proton/pass/lib/client';
import { bootIntent, cacheCancel, stateDestroy, stopEventPolling } from '@proton/pass/store/actions';
import { AppStatus, type Maybe, SessionLockStatus } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import {
    getBasename,
    getLocalIDFromPathname,
    stripLocalBasenameFromPathname,
} from '@proton/shared/lib/authentication/pathnameHelper';
import { getConsumeForkParameters, removeHashParameters } from '@proton/shared/lib/authentication/sessionForking';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { api, authStore } from '../../lib/core';
import { deletePassDB } from '../../lib/database';
import { onboarding } from '../../lib/onboarding';
import type { ServiceWorkerMessageHandler } from '../ServiceWorker/ServiceWorkerProvider';
import { useServiceWorker } from '../ServiceWorker/ServiceWorkerProvider';
import { store } from '../Store/store';
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
export const AuthServiceProvider: FC = ({ children }) => {
    const sw = useServiceWorker();
    const client = useClientRef();
    const history = useHistory();
    const matchConsumeFork = useRouteMatch(SSO_PATHS.FORK);

    const redirectPath = useRef(stripLocalBasenameFromPathname(preserveSearch(location.pathname)));
    const setRedirectPath = (redirect: string) => (redirectPath.current = redirect);

    const { createNotification } = useNotifications();

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
                const session = authStore.getSession();

                /* remove any in-memory lock status to force
                 * session lock revalidation on init */
                authStore.setLockStatus(undefined);

                return authStore.hasSession(pathLocalID)
                    ? auth.login(session)
                    : auth.resumeSession(initialLocalID, { forceLock: true });
            },

            onAuthorize: () => {
                client.current.setStatus(AppStatus.AUTHORIZING);
            },

            onAuthorized: (_, localID) => {
                const redirect = stripLocalBasenameFromPathname(redirectPath.current);
                history.replace((getBasename(localID) ?? '/') + redirect);
                onboarding.init().catch(noop);
                client.current.setStatus(AppStatus.AUTHORIZED);
                store.dispatch(bootIntent());
                client.current.setStatus(AppStatus.BOOTING);
            },

            onUnauthorized: (userID, localID, broadcast) => {
                store.dispatch(cacheCancel());
                store.dispatch(stopEventPolling());

                if (broadcast) sw.send({ type: 'unauthorized', localID, broadcast: true });
                if (userID) void deletePassDB(userID); /* wipe the local DB cache */

                localStorage.removeItem(getSessionKey(localID));
                client.current.setStatus(AppStatus.UNAUTHORIZED);
                history.replace('/');

                store.dispatch(stateDestroy());
                onboarding.reset();
            },

            onForkConsumed: (_, state) => {
                removeHashParameters();

                try {
                    const data = JSON.parse(sessionStorage.getItem(getStateKey(state))!);
                    if ('url' in data && typeof data.url === 'string') setRedirectPath(data.url);
                } catch {
                    setRedirectPath('/');
                }
            },

            onForkInvalid: () => {
                history.replace('/');
            },

            onForkRequest: ({ url, state }) => {
                sessionStorage.setItem(getStateKey(state), JSON.stringify({ url: redirectPath.current }));
                window.location.replace(url);
            },

            onSessionEmpty: async () => {
                history.replace('/');
                client.current.setStatus(AppStatus.UNAUTHORIZED);
                if (getDefaultLocalID() !== undefined) {
                    await auth.init.getState().pending;
                    auth.init().catch(noop);
                }
            },

            onSessionLocked: (localID, broadcast) => {
                store.dispatch(stopEventPolling());
                client.current.setStatus(AppStatus.LOCKED);
                if (broadcast) sw.send({ type: 'locked', localID, broadcast: true });
            },

            onSessionRefresh: async (localID, data, broadcast) => {
                logger.info('[AuthServiceProvider] Session tokens have been refreshed');
                if (broadcast) sw.send({ type: 'refresh', localID, data, broadcast: true });
                const persistedSession = await auth.config.getPersistedSession(localID);

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
            onSessionResumeFailure: () => client.current.setStatus(AppStatus.ERROR),
            onNotification: (text) =>
                createNotification({ type: 'error', text, key: 'authservice', deduplicate: true }),
        });

        return auth;
    }, []);

    useEffect(() => {
        const { key, selector, state } = getConsumeForkParameters();
        const localState = sessionStorage.getItem(getStateKey(state));

        if (matchConsumeFork) void authService.consumeFork({ mode: 'sso', key, localState, state, selector });
        else void authService.init({ forceLock: false });

        /* setup listeners on the service worker's broadcasting channel in order to
         * sync the current client if any authentication changes happened in another tab */

        const handleUnauthorized: ServiceWorkerMessageHandler<'unauthorized'> = ({ localID }) => {
            if (authStore.hasSession(localID)) authService.logout({ soft: true, broadcast: false }).catch(noop);
        };

        const handleLocked: ServiceWorkerMessageHandler<'locked'> = ({ localID }) => {
            const unlocked = authStore.getLockStatus() !== SessionLockStatus.LOCKED;
            if (authStore.hasSession(localID) && unlocked) void authService.lock({ soft: true, broadcast: false });
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
