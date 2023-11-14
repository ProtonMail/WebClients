/* eslint-disable no-console */
import { type FC, createContext, useContext, useEffect, useMemo } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { useNotifications } from '@proton/components/hooks';
import { type AuthService, createAuthService } from '@proton/pass/lib/auth/service';
import { isValidPersistedSession } from '@proton/pass/lib/auth/session';
import { AppStatus, type Maybe } from '@proton/pass/types';
import { getBasename, getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { getConsumeForkParameters, removeHashParameters } from '@proton/shared/lib/authentication/sessionForking';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

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
            onUnauthorized: (localID) => {
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
            onSessionLocked: () => client.setStatus(AppStatus.LOCKED),

            onSessionRefresh: async (data) => {
                const localID = authStore.getLocalID();
                const persistedSession = await auth.getPersistedSession(localID);

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
        /* listen to storage changes on persisted session keys. If another
         * document has refreshed the tokens or triggered a new session persist,
         * sync the current document's `authStore` */
        const handleStorageChange = (event: StorageEvent) => {
            const currentKey = getSessionKey(authStore.getLocalID());

            if (event.key === currentKey) {
                const ps = JSON.parse(localStorage.getItem(currentKey)!);
                if (isValidPersistedSession(ps)) {
                    authStore.setAccessToken(ps.AccessToken);
                    authStore.setRefreshToken(ps.RefreshToken);
                    authStore.setRefreshTime(ps.RefreshTime);
                }
            }
        };

        const { key, selector, state } = getConsumeForkParameters();
        const localState = sessionStorage.getItem(getStateKey(state));

        if (matchConsumeFork) void authService.consumeFork({ mode: 'sso', key, localState, state, selector });
        else void authService.init({ forceLock: false });

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return <AuthServiceContext.Provider value={authService}>{children}</AuthServiceContext.Provider>;
};
