import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useEffect } from 'react';
import { matchPath, useHistory } from 'react-router-dom';

import { useServiceWorker } from 'proton-pass-web/app/ServiceWorker/client/ServiceWorkerProvider';
import { type ServiceWorkerClientMessageHandler } from 'proton-pass-web/app/ServiceWorker/client/client';
import { createAuthService } from 'proton-pass-web/lib/auth';

import { useNotifications } from '@proton/components';
import useInstance from '@proton/hooks/useInstance';
import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { useCheckConnectivity, useConnectivityRef } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { UnlockProvider } from '@proton/pass/components/Lock/UnlockProvider';
import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { type AuthRouteState, isUnauthorizedPath, reloadHref } from '@proton/pass/components/Navigation/routing';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { getConsumeForkParameters, getStateKey } from '@proton/pass/lib/auth/fork';
import { AppStatusFromLockMode, LockMode, type UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import type { AuthService } from '@proton/pass/lib/auth/service';
import { authStore } from '@proton/pass/lib/auth/store';
import { type MaybeNull } from '@proton/pass/types';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { logger } from '@proton/pass/utils/logger';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useAuthSwitch } from './AuthSwitchProvider';

export const AuthServiceContext = createContext<MaybeNull<AuthService>>(null);
export const useAuthService = createUseContext(AuthServiceContext);

/** The only reason we have to wrap the AuthenticationService to a react context is
 * to be able to leverage the history object provided by `react-router-dom` and the
 * notifications handler. Ideally this could live outside of react-land by moving the
 * authentication service to an event-bus architecture.. */
export const AuthServiceProvider: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();
    const { createNotification } = useNotifications();
    const { getCurrentLocation } = useNavigationActions();
    const sw = useServiceWorker();
    const history = useHistory<MaybeNull<AuthRouteState>>();
    const config = usePassConfig();
    const online = useConnectivityRef();
    const authSwitch = useAuthSwitch();
    const checkConnectivity = useCheckConnectivity();
    const enhance = useNotificationEnhancer();

    const authService = useInstance(() =>
        createAuthService({
            app: AppStateManager,
            authSwitch,
            config,
            core,
            history,
            sw,
            getOnline: () => online.current,
            onNotification: (notification) =>
                createNotification(
                    enhance({
                        ...notification,
                        key: notification.key ?? NotificationKey.AUTH,
                        deduplicate: true,
                    })
                ),
        })
    );

    useEffect(() => {
        if (isUnauthorizedPath(getCurrentLocation())) return;

        const run = async () => {
            if (matchPath(history.location.pathname, SSO_PATHS.FORK)) {
                const { key, selector, state, payloadVersion, persistent } = getConsumeForkParameters();
                const localState = sessionStorage.getItem(getStateKey(state));

                if (!localState) {
                    logger.info('[AuthServiceProvider] Invalid fork path');
                    history.replace('/');
                    return window.location.reload();
                }

                return authService.consumeFork({
                    mode: 'web',
                    key,
                    localState,
                    state,
                    selector,
                    payloadVersion,
                    persistent,
                });
            } else {
                await checkConnectivity?.();
                return authService.init({ forcePersist: true });
            }
        };

        /** If a fork for the same UserID has been consumed in another tab - clear
         * the auth store and reload the page silently to avoid maintaing a stale
         * local session alive. This edge-case can happen when the pass web-app is
         * opened on new a localID which may trigger a re-auth for the same UserID. */
        const handleFork: ServiceWorkerClientMessageHandler<'fork'> = ({ userID, localID }) => {
            if (authStore.getUserID() === userID) {
                authStore.clear();
                reloadHref(`/u/${localID}?error=fork`);
            }
        };

        const handleUnauthorized: ServiceWorkerClientMessageHandler<'unauthorized'> = ({ localID }) => {
            if (authStore.hasSession(localID)) authService.logout({ soft: true, broadcast: false }).catch(noop);
        };

        const handleLocked: ServiceWorkerClientMessageHandler<'locked'> = ({ localID, mode }) => {
            const { status } = AppStateManager.getState();

            if (authStore.hasSession(localID)) {
                if (mode !== authStore.getLockMode()) return window.location.reload();
                if (status !== AppStatusFromLockMode[mode]) return authService.lock(mode, { soft: true });
            }
        };

        const handleLockDeleted: ServiceWorkerClientMessageHandler<'lock_deleted'> = ({ localID }) => {
            const locked = authStore.getLocked();

            if (authStore.hasSession(localID)) {
                authStore.setLockLastExtendTime(undefined);
                authStore.setLockMode(LockMode.NONE);
                authStore.setLockToken(undefined);
                authStore.setLockTTL(undefined);
                authStore.setLocked(false);
                authStore.setEncryptedOfflineKD(undefined);

                if (locked) window.location.reload();
            }
        };

        const handleSession: ServiceWorkerClientMessageHandler<'session'> = ({ localID, data }) => {
            if (authStore.hasSession(localID)) {
                logger.info(`[AuthServiceProvider] syncing session for localID[${localID}]`);
                /** edge-case scenario when we have clients syncing sessions while migration */
                if (!data.cookies && authStore.getCookieAuth()) return;
                authStore.setSession(data);
                authStore.setClientKey(undefined); /* client key may have been regenerated */
            }
        };

        sw?.on('fork', handleFork);
        sw?.on('unauthorized', handleUnauthorized);
        sw?.on('locked', handleLocked);
        sw?.on('lock_deleted', handleLockDeleted);
        sw?.on('session', handleSession);

        run().catch(noop);

        return () => {
            sw?.off('fork', handleFork);
            sw?.off('lock_deleted', handleLockDeleted);
            sw?.off('locked', handleLocked);
            sw?.off('session', handleSession);
            sw?.off('unauthorized', handleUnauthorized);
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
