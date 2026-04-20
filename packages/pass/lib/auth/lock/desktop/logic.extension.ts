import type { AuthStore } from '@proton/pass/lib/auth/store';
import { NativeMessageError } from '@proton/pass/lib/native-messaging/errors';
import type { NativeMessagingService } from '@proton/pass/lib/native-messaging/native-messaging.extension';
import {
    NativeMessageErrorType,
    type NativeMessageSetupLockSecretRequest,
    NativeMessageType,
} from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

const log = (...content: any[]) => logger.debug('[DesktopLock]', ...content);

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
        log('Sending request to desktop');

        /** Encrypt, send to native messaging and decrypt response */
        const response = await nativeMessaging.sendNativeMessageRequest(request);
        log('Received response from desktop');

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
