import { NativeMessageErrorType, type NativeMessageSetupLockSecretRequest, NativeMessageType } from '../../../../types';
import { logger } from '../../../../utils/logger';
import { NativeMessageError } from '../../../native-messaging/errors';
import type { NativeMessagingService } from '../../../native-messaging/native-messaging.extension';
import type { AuthStore } from '../../store';

const info = (...content: any[]) => logger.info('[DesktopLock]', ...content);

/** Must be unique enough to distinguish 2 extensions on 2 browsers with the same user */
const getUserIdentifier = (authStore: AuthStore) => `${authStore.getLocalID()}-${authStore.getUserID()}`;

export const sendSetupLockSecretMessage = async (
    nativeMessaging: NativeMessagingService,
    authStore: AuthStore,
    lockSecret: string
) => {
    try {
        /** Create a request message containing a user key and a random secret to store in biometric storage */
        const userIdentifier = getUserIdentifier(authStore);
        const request: NativeMessageSetupLockSecretRequest = {
            type: NativeMessageType.SETUP_LOCK_SECRET,
            encrypt: true,
            lockSecret,
            userIdentifier,
        };
        info('Sending request to desktop');

        /** Encrypt, send to native messaging and decrypt response */
        const response = await nativeMessaging.sendNativeMessageRequest(request);
        info('Received response from desktop');

        /** Lock secret and user key from response must match */
        if (response.userIdentifier !== userIdentifier) {
            throw new NativeMessageError(NativeMessageErrorType.ACCOUNT_MISMATCH);
        }
        if (response.lockSecret !== lockSecret) {
            throw new NativeMessageError(NativeMessageErrorType.SETUP_LOCK_SECRET_INVALID_RESPONSE);
        }
    } catch (error) {
        if (error instanceof NativeMessageError) throw error;
        throw new NativeMessageError(NativeMessageErrorType.UNKNOWN);
    }
};

export const sendUnlockMessage = async (nativeMessaging: NativeMessagingService, authStore: AuthStore) => {
    /** Create a request message containing the user identifier */
    const userIdentifier = getUserIdentifier(authStore);
    const response = await nativeMessaging.sendNativeMessageRequest({
        type: NativeMessageType.UNLOCK,
        encrypt: false,
        userIdentifier,
    });

    return response.secret;
};
