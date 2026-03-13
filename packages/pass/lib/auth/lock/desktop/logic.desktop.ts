import { sendNativeMessageResponse } from '@proton/pass/lib/native-messaging/native-messaging.desktop';
import type { NativeMessageSetupLockSecretRequest } from '@proton/pass/types';
import { type NativeMessageSetupLockSecretResponse, NativeMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

const log = (...content: any[]) => logger.debug('[DesktopLock]', ...content);

export const respondToDesktopLockMessage = async (request: NativeMessageSetupLockSecretRequest, messageId: string) => {
    const { userIdentifier, lockSecret } = request;
    log('Received request for user identifier', userIdentifier);

    /** Store lock secret in the os biometric storage */
    const lockSecretBinary = Uint8Array.fromBase64(lockSecret);
    await window.ctxBridge!.setSecret(userIdentifier, lockSecretBinary);

    /** Package the secret back into an encrypted native message response */
    const response: NativeMessageSetupLockSecretResponse = {
        type: NativeMessageType.SETUP_LOCK_SECRET,
        encrypt: true,
        userIdentifier,
        lockSecret,
    };

    log('Sending response for user identifier', userIdentifier);
    await sendNativeMessageResponse(response, messageId);
};
