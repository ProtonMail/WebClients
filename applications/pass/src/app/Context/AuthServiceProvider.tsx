import { type FC, createContext, useContext, useEffect, useMemo } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { useNotifications } from '@proton/components/hooks';
import { type AuthService, createAuthService } from '@proton/pass/lib/auth/service';
import { isValidPersistedSession } from '@proton/pass/lib/auth/session';
import { AppStatus, type Maybe, SessionLockStatus } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { getBasename, getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { getConsumeForkParameters, removeHashParameters } from '@proton/shared/lib/authentication/sessionForking';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useServiceWorker } from '../ServiceWorker/ServiceWorkerProvider';
import { useApi } from './ApiProvider';
import { useAuthStore } from './AuthStoreProvider';
import { useClient } from './ClientProvider';

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

export const AuthServiceProvider: FC = ({ children }) => {
    const api = useApi();
    const authStore = useAuthStore();
    const sw = useServiceWorker();
    const client = useClient();
    const history = useHistory();
    const matchConsumeFork = useRouteMatch(SSO_PATHS.FORK);

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

                return authStore.hasSession() && session.LocalID === pathLocalID
                    ? auth.login(session)
                    : auth.resumeSession(initialLocalID, { forceLock: true });
            },

            onAuthorize: () => client.setStatus(AppStatus.AUTHORIZING),

            onAuthorized: (localID) => {
                /* on successful login redirect the user to the localID base
                 * path. FIXME: redirect to the previous URL stored in the
                 * local `f${state}` */
                history.replace(getBasename(localID) ?? '/');
                client.setStatus(AppStatus.AUTHORIZED);
            },

            onUnauthorized: (localID, broadcast) => {
                if (broadcast) sw.send({ type: 'unauthorized', localID, broadcast: true });
                localStorage.removeItem(getSessionKey(localID));
                client.setStatus(AppStatus.UNAUTHORIZED);
                history.replace('/');
            },

            onForkConsumed: () => removeHashParameters(),

            onForkInvalid: () => {
                history.replace('/');
            },

            onForkRequest: ({ url, state }) => {
                sessionStorage.setItem(getStateKey(state), JSON.stringify({}));
                window.location.replace(url);
            },

            onSessionEmpty: () => {
                history.replace('/');
                client.setStatus(AppStatus.UNAUTHORIZED);
                if (getDefaultLocalID()) auth.init().catch(noop);
            },

            onSessionLocked: (localID, broadcast) => {
                client.setStatus(AppStatus.LOCKED);
                if (broadcast) sw.send({ type: 'locked', localID, broadcast: true });
            },

            onSessionRefresh: async (localID, data, broadcast) => {
                logger.info('[AuthServiceProvider] Session tokens have been refreshed');
                if (broadcast) sw.send({ type: 'refresh', localID, data, broadcast: true });
                const persistedSession = await auth.config.getPersistedSession(localID);

                if (persistedSession) {
                    /* update the persisted session tokens without re-encrypting the
                     * session blob as session refresh may happen before a full login
                     * with a partially hydrated authentication store. */
                    persistedSession.AccessToken = data.AccessToken;
                    persistedSession.RefreshToken = data.RefreshToken;
                    persistedSession.RefreshTime = data.RefreshTime;
                    localStorage.setItem(getSessionKey(localID), JSON.stringify(persistedSession));
                }
            },
            onSessionPersist: (encrypted) => localStorage.setItem(getSessionKey(authStore.getLocalID()), encrypted),
            onSessionResumeFailure: () => client.setStatus(AppStatus.RESUMING_FAILED),
            onNotification: (text) => createNotification({ type: 'error', text, key: 'authservice' }),
        });

        return auth;
    }, []);

    useEffect(() => {
        const { key, selector, state } = getConsumeForkParameters();
        const localState = sessionStorage.getItem(getStateKey(state));

        if (matchConsumeFork) void authService.consumeFork({ mode: 'sso', key, localState, state, selector });
        else void authService.init({ forceLock: false });

        const matchLocalID = (localID?: number) => authStore.hasSession() && authStore.getLocalID() === localID;

        /* setup listeners on the service worker's broadcasting channel in order to
         * sync the current client if any authentication changes happened in another tab */
        sw.on('unauthorized', ({ localID }) => {
            if (matchLocalID(localID)) void authService.logout({ soft: true, broadcast: false });
        });

        sw.on('locked', ({ localID }) => {
            const unlocked = authStore.getLockStatus() !== SessionLockStatus.LOCKED;
            if (matchLocalID(localID) && unlocked) void authService.lock({ soft: true, broadcast: false });
        });

        sw.on('refresh', ({ localID, data }) => {
            if (matchLocalID(localID)) {
                authStore.setAccessToken(data.AccessToken);
                authStore.setRefreshToken(data.RefreshToken);
                authStore.setUID(data.UID);
                authStore.setRefreshTime(data.RefreshTime);
                void authService.config.onSessionRefresh?.(localID, data, false);
            }
        });
    }, []);

    return <AuthServiceContext.Provider value={authService}>{children}</AuthServiceContext.Provider>;
};
