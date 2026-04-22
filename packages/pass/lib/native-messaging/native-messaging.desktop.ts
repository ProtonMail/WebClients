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
    isLocked: boolean,
    userId: string,
    callback: (request: NativeMessageRequestForType<Type>, messageId: string) => void
) => {
    return window.ctxBridge?.onNmRequest(async (payload) => {
        log('Request received in view', payload.type);

        if ('encrypted' in payload && !isReady) {
            return sendNativeMessageResponse(
                {
                    type: NativeMessageType.SETUP_LOCK_SECRET,
                    error: isLocked
                        ? NativeMessageErrorType.DESKTOP_APP_LOCKED
                        : NativeMessageErrorType.DESKTOP_APP_NOT_LOGGED_IN,
                },
                payload.messageId
            );
        }

        /** Check for account mismatch before attempting decryption.
         * userIdentifier format is `${localID}-${userId}`, so we check the suffix. */
        if ('encrypted' in payload && payload.userIdentifier && !payload.userIdentifier.endsWith(`-${userId}`)) {
            return sendNativeMessageResponse(
                { type: payload.type, error: NativeMessageErrorType.ACCOUNT_MISMATCH },
                payload.messageId
            );
        }

        const request = await payloadToMessage(payload, 'extension').catch(() => null);
        if (request === null) {
            return sendNativeMessageResponse(
                { type: payload.type, error: NativeMessageErrorType.NATIVE_MESSAGE_DECRYPTION_FAILED },
                payload.messageId
            );
        }

        if (request.type === type) {
            callback(request as NativeMessageRequestForType<Type>, payload.messageId);
        }
    });
};
