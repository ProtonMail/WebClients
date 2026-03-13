import { messageToPayload, payloadToMessage } from '@proton/pass/lib/native-messaging/crypto';
import type { NativeMessageRequestForType, SendNativeMessageResponse } from '@proton/pass/types';
import { NativeMessageErrorType, NativeMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

const log = (...content: any[]) => logger.debug('[NativeMessaging]', ...content);

export const sendNativeMessageResponse: SendNativeMessageResponse = async (response, messageId) => {
    const responsePayload =
        'error' in response ? { ...response, messageId } : await messageToPayload(response, messageId, 'desktop');

    return window.ctxBridge?.nmResponse(responsePayload) || Promise.resolve();
};

export const listenNativeMessage = <Type extends NativeMessageType>(
    type: Type,
    isReady: boolean,
    callback: (request: NativeMessageRequestForType<Type>, messageId: string) => void
) => {
    return window.ctxBridge?.onNmRequest(async (payload) => {
        log('Request received in view', payload.type);

        /** If we receive an encrypted request while the app is locked, we return an error */
        if ('encrypted' in payload && !isReady) {
            return sendNativeMessageResponse(
                {
                    type: NativeMessageType.SETUP_LOCK_SECRET,
                    error: NativeMessageErrorType.DESKTOP_APP_LOCKED,
                },
                payload.messageId
            );
        }

        const request = await payloadToMessage(payload, 'extension');

        if (request.type === type) {
            callback(request as NativeMessageRequestForType<Type>, payload.messageId);
        }
    });
};
