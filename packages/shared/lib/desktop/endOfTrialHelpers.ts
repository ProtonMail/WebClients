import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

import type createApi from '../api/createApi';
import { getApiError } from '../api/helpers/apiErrorHelper';
import type { AuthenticationStore } from '../authentication/createAuthenticationStore';
import { handleLogout } from '../authentication/logout';
import type { APP_NAMES } from '../constants';
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
    const runEffect = async () => {
        try {
            await handleLogout({ appName, authentication, clearDeviceRecoveryData: true, type: 'full' });
        } finally {
            endOfTrialIPCCall();
        }
    };

    api.addEventListener((event) => {
        if (event.type === 'logout' && event.payload.error) {
            const { code } = getApiError(event.payload.error?.originalError);

            if (code === API_CUSTOM_ERROR_CODES.INBOX_DESKTOP_TRIAL_END) {
                runEffect();
                return true;
            }
        }

        return false;
    });
};
