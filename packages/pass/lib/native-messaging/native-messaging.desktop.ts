import { AppStateManager } from '../../components/Core/AppStateManager';
import type {
    NativeMessageRequestForType,
    NativeMessageSetupLockSecretRequest,
    SendNativeMessageResponse,
} from '../../types';
import { NativeMessageErrorType, NativeMessageType } from '../../types';
import { logger } from '../../utils/logger';
import type { AuthStore } from '../auth/store';
import { clientLocked, clientReady } from '../client';
import { messageToPayload, payloadToMessage } from './crypto';

const log = (...content: any[]) => logger.debug('[NativeMessaging]', ...content);

export const sendNativeMessageResponse: SendNativeMessageResponse = async (response, messageId) => {
    const responsePayload =
        'error' in response ? { ...response, messageId } : await messageToPayload(response, messageId, 'desktop');

    return window.ctxBridge?.nmResponse(responsePayload) || Promise.resolve();
};

const listenNativeMessage = <Type extends NativeMessageType>(
    type: Type,
    authStore: AuthStore,
    callback: (request: NativeMessageRequestForType<Type>, messageId: string) => void
) => {
    return window.ctxBridge?.onNmRequest(async (payload) => {
        const { status } = AppStateManager.getState();
        const isReady = clientReady(status);
        const isLocked = clientLocked(status);

        log('Request received in view', payload.type, { isReady, isLocked });

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

        const userId = authStore?.getUserID() ?? '';

        /** Check for account mismatch before attempting decryption.
         * userIdentifier is suffixed with `-${userId}`, so we check the suffix. */
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

export const createNativeMessagingService = (
    authStore: AuthStore,
    onSetupLockSecret: (request: NativeMessageSetupLockSecretRequest, messageId: string) => Promise<void>
) => {
    listenNativeMessage(NativeMessageType.SETUP_LOCK_SECRET, authStore, (request, messageId) => {
        log('setup lock request');
        void onSetupLockSecret(request, messageId).catch(() =>
            sendNativeMessageResponse(
                { type: NativeMessageType.SETUP_LOCK_SECRET, error: NativeMessageErrorType.BIOMETRICS_FAILED },
                messageId
            )
        );
    });
};
