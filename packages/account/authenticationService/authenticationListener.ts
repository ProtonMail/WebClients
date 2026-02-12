import { createAction } from '@reduxjs/toolkit';

import { bootstrapEvent } from '@proton/account/bootstrap/action';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { revoke } from '@proton/shared/lib/api/auth';
import { getSilentApi, getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { cleanupLastRefreshDate } from '@proton/shared/lib/api/helpers/refreshStorage';
import {
    getAllSessionsLogoutOptions,
    getSelfLogoutOptions,
    handleLogout,
} from '@proton/shared/lib/authentication/logout';
import type { ActiveSessionLite } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { invokeInboxDesktopLogout } from '@proton/shared/lib/desktop/ipc-helpers/logout';
import { isDocumentVisible } from '@proton/shared/lib/helpers/dom';
import noop from '@proton/utils/noop';

export const signoutAction = createAction(
    'auth/signout',
    (
        payload: { clearDeviceRecovery: boolean; logoutRedirectUrl?: string } & (
            | { type?: 'self' }
            | {
                  type: 'all';
                  sessions: ActiveSessionLite[];
              }
        )
    ) => ({ payload })
);

interface State {}

export const authenticationListener = (startListening: SharedStartListening<State>) => {
    startListening({
        actionCreator: signoutAction,
        effect: async (action, listenerApi) => {
            const authentication = listenerApi.extra.authentication;
            const sessions =
                action.payload.type === 'all'
                    ? getAllSessionsLogoutOptions({ authentication, sessions: action.payload.sessions })
                    : getSelfLogoutOptions({ authentication });

            try {
                listenerApi.unsubscribe();
                listenerApi.extra.eventManager.stop();

                if (action.payload.type === 'all') {
                    // NOTE: This only signs out of the sessions that exist on this subdomain. The redirect
                    // to account will sign out of all sessions after.
                    await Promise.all(
                        sessions.sessions.map((session) => {
                            return getSilentApi(getUIDApi(session.UID, listenerApi.extra.api))(revoke());
                        })
                    ).catch(noop);
                } else {
                    await getSilentApi(listenerApi.extra.api)(revoke()).catch(noop);
                }
            } finally {
                invokeInboxDesktopLogout(action.payload.type === 'all', sessions.users.at(0)?.id ?? '').catch(noop);

                handleLogout({
                    appName: listenerApi.extra.config.APP_NAME,
                    type: 'full',
                    options: {
                        clearDeviceRecovery: action.payload.clearDeviceRecovery,
                        users: sessions.users,
                        sessions: sessions.sessions,
                        type: action.payload.type === 'all' ? 'all' : 'self',
                        reason: 'signout',
                        logoutRedirectUrl: action.payload.logoutRedirectUrl,
                    },
                    authentication,
                }).catch(noop);
            }
        },
    });

    startListening({
        actionCreator: bootstrapEvent,
        effect: async (action, listenerApi) => {
            listenerApi.unsubscribe();

            const run = () => {
                if (!isDocumentVisible()) {
                    return;
                }
                cleanupLastRefreshDate();
            };

            const timeout = 10_000;
            if (globalThis.requestIdleCallback) {
                globalThis.requestIdleCallback(run, { timeout });
            } else {
                setTimeout(run, timeout);
            }
        },
    });
};
