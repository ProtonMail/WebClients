import { createAction } from '@reduxjs/toolkit';

import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { revoke } from '@proton/shared/lib/api/auth';
import { handleLogout } from '@proton/shared/lib/authentication/logout';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

export const signoutAction = createAction('auth/signout', (payload: { clearDeviceRecovery: boolean }) => ({ payload }));

interface State {}

export const authenticationListener = (startListening: SharedStartListening<State>) => {
    startListening({
        actionCreator: signoutAction,
        effect: async (action, listenerApi) => {
            try {
                listenerApi.unsubscribe();
                listenerApi.extra.eventManager.stop();
                await listenerApi.extra.api({ ...revoke(), silence: true });
            } finally {
                invokeInboxDesktopIPC({ type: 'userLogout' });

                handleLogout({
                    appName: listenerApi.extra.config.APP_NAME,
                    type: 'full',
                    clearDeviceRecoveryData: action.payload.clearDeviceRecovery,
                    authentication: listenerApi.extra.authentication,
                });
            }
        },
    });
};
