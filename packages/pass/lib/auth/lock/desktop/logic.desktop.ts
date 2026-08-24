import type { NativeMessageSetupLockSecretRequest } from '../../../../types';
import { type NativeMessageSetupLockSecretResponse, NativeMessageType } from '../../../../types';
import { logger } from '../../../../utils/logger';
import { sendNativeMessageResponse } from '../../../native-messaging/native-messaging.desktop';

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
