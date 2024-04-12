import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

import createApi from '../api/createApi';
import { getApiError } from '../api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '../errors';

export const endOfTrialIPCCall = () => {
    invokeInboxDesktopIPC({
        type: 'trialEnd',
        payload: 'trialEnded',
    });
};

export const resetEndOfTrialIPCCall = () => {
    invokeInboxDesktopIPC({
        type: 'trialEnd',
        payload: 'resetTrialEnded',
    });
};

export const listenFreeTrialSessionExpiration = (api: ReturnType<typeof createApi>) => {
    api.addEventListener((event) => {
        if (event.type === 'logout' && event.payload.error) {
            const { code } = getApiError(event.payload.error?.originalError);

            if (code === API_CUSTOM_ERROR_CODES.INBOX_DESKTOP_TRIAL_END) {
                endOfTrialIPCCall();
            }
        }
    });
};
