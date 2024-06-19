import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

import createApi from '../api/createApi';
import { getApiError } from '../api/helpers/apiErrorHelper';
import { AuthenticationStore } from '../authentication/createAuthenticationStore';
import { handleLogout } from '../authentication/logout';
import { APP_NAMES } from '../constants';
import { API_CUSTOM_ERROR_CODES } from '../errors';

export const endOfTrialIPCCall = () => {
    if (hasInboxDesktopFeature('MultiAccount')) {
        invokeInboxDesktopIPC({
            type: 'trialEnd',
        });
    } else {
        invokeInboxDesktopIPC({
            type: 'trialEnd',
            payload: 'trialEnded',
        });
    }
};

export const resetEndOfTrialIPCCall = () => {
    if (!hasInboxDesktopFeature('MultiAccount')) {
        invokeInboxDesktopIPC({
            type: 'trialEnd',
            payload: 'resetTrialEnded',
        });
    }
};

export const listenFreeTrialSessionExpiration = (
    appName: APP_NAMES,
    authentication: AuthenticationStore,
    api: ReturnType<typeof createApi>
) => {
    api.addEventListener(async (event) => {
        if (event.type === 'logout' && event.payload.error) {
            const { code } = getApiError(event.payload.error?.originalError);

            if (code === API_CUSTOM_ERROR_CODES.INBOX_DESKTOP_TRIAL_END) {
                try {
                    await handleLogout({ appName, authentication, clearDeviceRecoveryData: true, type: 'full' });
                } finally {
                    endOfTrialIPCCall();
                }
            }
        }
    });
};
