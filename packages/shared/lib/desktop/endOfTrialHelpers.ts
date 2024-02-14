import { canInvokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

import createApi from '../api/createApi';
import { getApiError } from '../api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '../errors';

export const endOfTrialIPCCall = () => {
    if (canInvokeInboxDesktopIPC) {
        window.ipcInboxMessageBroker?.send('trialEnded', 'trialEnded');
    }
};

export const resetEndOfTrialIPCCall = () => {
    if (canInvokeInboxDesktopIPC) {
        window.ipcInboxMessageBroker?.send('trialEnded', 'resetTrialEnded');
    }
};

export const listenFreeTrialSessionExpiration = (api: ReturnType<typeof createApi>) => {
    api.addEventListener((event) => {
        if (event.type === 'logout' && event.payload.error) {
            const { code } = getApiError(event.payload.error);

            if (code === API_CUSTOM_ERROR_CODES.INBOX_DESKTOP_TRIAL_END) {
                endOfTrialIPCCall();
            }
        }
    });
};
