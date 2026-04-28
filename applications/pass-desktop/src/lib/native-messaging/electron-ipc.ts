import type { BrowserWindow } from 'electron';

import { NativeMessageErrorType } from '@proton/pass/types';
import type { MaybeNull, NativeMessagePayload, NativeMessageRequest, NativeMessageResponse } from '@proton/pass/types';

import logger from '../../utils/logger';
import { setupIpcHandler } from '../ipc';

const log = (...content: any[]) => logger.debug('[NativeMessaging]', ...content);
const info = (...content: any[]) => logger.info('[NativeMessaging]', ...content);

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'nm:request': IPCChannel<[NativeMessagePayload<NativeMessageRequest>], void>;
        'nm:response': IPCChannel<[NativeMessagePayload<NativeMessageResponse>], void>;
    }
}

export const setupElectronIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>) => {
    const pendingResponses = new Map<string, (response: NativeMessagePayload<NativeMessageResponse>) => void>();

    // Transfer message from native messaging ipc sock to view
    const sendRequestToView = (
        request: NativeMessagePayload<NativeMessageRequest>,
        sendResponse: (response: NativeMessagePayload<NativeMessageResponse>) => void
    ) => {
        if (!getWindow()?.webContents.getURL().startsWith(MAIN_WINDOW_WEBPACK_ENTRY)) {
            info('App not on main URL, responding not logged in');
            sendResponse({
                type: request.type,
                error: NativeMessageErrorType.DESKTOP_APP_NOT_LOGGED_IN,
                messageId: request.messageId,
            } as NativeMessagePayload<NativeMessageResponse>);
            return;
        }

        try {
            log('Sending request to view', request.type);
            pendingResponses.set(request.messageId, sendResponse);
            getWindow()?.webContents.send('nm:request', request);
        } catch (error) {
            info('Sending to to view went wrong', error);
        }
    };

    // Transfer message from view to native messaging ipc sock
    setupIpcHandler('nm:response', (_event, response) => {
        const sendResponse = pendingResponses.get(response.messageId);
        if (sendResponse) {
            pendingResponses.delete(response.messageId);
            sendResponse(response);
        } else {
            info('No pending request for messageId', response.messageId);
        }
    });

    return { sendRequestToView };
};
