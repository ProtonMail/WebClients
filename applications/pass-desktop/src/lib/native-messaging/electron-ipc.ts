import type { BrowserWindow } from 'electron';

import type { MaybeNull, NativeMessagePayload, NativeMessageRequest, NativeMessageResponse } from '@proton/pass/types';

import logger from '../../utils/logger';
import { setupIpcHandler } from '../ipc';

const log = (...content: any[]) => logger.debug('[NativeMessaging]', ...content);

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
        try {
            log('Sending request to view', request.type);
            pendingResponses.set(request.messageId, sendResponse);
            getWindow()?.webContents.send('nm:request', request);
        } catch (error) {
            log('Sending to to view went wrong', error);
        }
    };

    // Transfer message from view to native messaging ipc sock
    setupIpcHandler('nm:response', (_event, response) => {
        const sendResponse = pendingResponses.get(response.messageId);
        if (sendResponse) {
            pendingResponses.delete(response.messageId);
            sendResponse(response);
        } else {
            log('No pending request for messageId', response.messageId);
        }
    });

    return { sendRequestToView };
};
