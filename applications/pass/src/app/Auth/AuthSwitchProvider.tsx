import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useServiceWorker } from 'proton-pass-web/app/ServiceWorker/client/ServiceWorkerProvider';
import type { ServiceWorkerClientMessageHandler } from 'proton-pass-web/app/ServiceWorker/client/client';
import { deletePassDB } from 'proton-pass-web/lib/database';
import { getPersistedSession, getSessionKey, getSwitchableSessions } from 'proton-pass-web/lib/sessions';
import { clearUserLocalData } from 'proton-pass-web/lib/storage';

import useInstance from '@proton/hooks/useInstance';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { reloadHref } from '@proton/pass/components/Navigation/routing';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { api } from '@proton/pass/lib/api/api';
import { decodeUserData, encodeUserData } from '@proton/pass/lib/auth/store';
import { type AuthSwitchService, type SwitchableSession, createAuthSwitchService } from '@proton/pass/lib/auth/switch';
import { type MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const AuthSwitchContext = createContext<MaybeNull<AuthSwitchService>>(null);
export const SessionsContext = createContext<SwitchableSession[]>([]);

export const useAuthSwitch = createUseContext(AuthSwitchContext);
export const useSessions = () => useContext(SessionsContext);

/** Moving the auth switch feature behind a feature flag requires an additional
 * flag in local storage. Since the `PassAccountSwitchV1` flag is user-based,
 * we propagate it to all other active sessions if it's enabled in any session. */
export const AUTH_SWITCH_FLAG = 'pass::auth_switch';
export const checkAuthSwitch = () => localStorage.getItem(AUTH_SWITCH_FLAG) === '1';
export const enableAuthSwitch = () => localStorage.setItem(AUTH_SWITCH_FLAG, '1');

export const useAvailableSessions = () => {
    const sessions = useSessions();
    const authStore = useAuthStore();

    return useMemo(() => {
        const currentLocalID = authStore?.getLocalID();
        return sessions.filter(({ LocalID, PrimaryEmail, DisplayName }) =>
            Boolean(LocalID !== currentLocalID && (PrimaryEmail || DisplayName))
        );
    }, [sessions]);
};

export const AuthSwitchProvider: FC<PropsWithChildren> = ({ children }) => {
    const authStore = useAuthStore();
    const [sessions, setSessions] = useState<SwitchableSession[]>([]);
    const sw = useServiceWorker();

    const service = useInstance(() =>
        createAuthSwitchService({
            api,

            onSwitch: (LocalID: number) => {
                authStore?.clear();
                reloadHref(`/u/${LocalID}`);
            },

            getSessions: getSwitchableSessions,

            onActiveSession: ({ LocalID, PrimaryEmail, DisplayName }) => {
                /** Sync the current auth store session  */
                if (LocalID === authStore?.getLocalID()) {
                    authStore.setUserDisplayName(DisplayName);
                    authStore.setUserEmail(PrimaryEmail);
                }

                const localSession = getPersistedSession(LocalID);
                if (localSession) {
                    localSession.userData = encodeUserData(PrimaryEmail, DisplayName);
                    localStorage.setItem(getSessionKey(LocalID), JSON.stringify(localSession));
                }
            },

            onInactiveSession: (session) => {
                setSessions((prev) => prev.filter(({ UID }) => session.UID !== UID));
                deletePassDB(session.UserID).catch(noop);
                clearUserLocalData(session.LocalID);
                sw?.send({ type: 'unauthorized', localID: session.LocalID, broadcast: true });
            },

            onSessionsSynced: (data) => {
                setSessions(data);
                sw?.send({ type: 'sessions_synced', data, broadcast: true });
            },
        })
    );

    useEffect(() => {
        const onSessionsSynced: ServiceWorkerClientMessageHandler<'sessions_synced'> = ({ data }) => setSessions(data);

        /** When a new session is forked from another tab,
         * update the local switchable sessions */
        const onSession: ServiceWorkerClientMessageHandler<'session'> = ({
            data: { UID, LocalID, UserID, userData, lastUsedAt },
        }) => {
            if (UID && LocalID !== undefined && UserID && userData) {
                const { PrimaryEmail = '', DisplayName = '' } = decodeUserData(userData);
                setSessions((prev) =>
                    prev
                        .filter((session) => session.LocalID !== LocalID)
                        .concat([{ DisplayName, lastUsedAt, LocalID, PrimaryEmail, UID, UserID }])
                );
            }
        };

        const onUnauthorized: ServiceWorkerClientMessageHandler<'unauthorized'> = ({ localID }) => {
            setSessions((prev) => prev.filter((session) => session.LocalID !== localID));
        };

        sw?.on('sessions_synced', onSessionsSynced);
        sw?.on('session', onSession);
        sw?.on('unauthorized', onUnauthorized);

        return () => {
            sw?.off('sessions_synced', onSessionsSynced);
            sw?.off('session', onSession);
            sw?.off('unauthorized', onUnauthorized);
        };
    }, []);

    return (
        <AuthSwitchContext.Provider value={service}>
            <SessionsContext.Provider value={sessions}>{children}</SessionsContext.Provider>
        </AuthSwitchContext.Provider>
    );
};
