import { serverTime as getServerTime, updateServerTime } from '@proton/crypto/lib';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { NativeMessageError } from '@proton/pass/lib/native-messaging/errors';
import { type NativeMessage, NativeMessageErrorType, type NativeMessagePayload } from '@proton/pass/types';

export const payloadToMessage = async <Mes extends NativeMessage>(
    payload: NativeMessagePayload<Mes>,
    sender: 'desktop' | 'extension'
): Promise<Mes> => {
    if ('encrypted' in payload) {
        try {
            const { type, encrypted, serverTime } = payload;
            /** Need to update server time because extension settings page may be out of sync */
            updateServerTime(new Date(serverTime));
            const data = await PassCrypto.decryptFromNativeMessaging(encrypted, sender);
            return { type, encrypt: true, ...data } as Mes;
        } catch (error) {
            throw new NativeMessageError(NativeMessageErrorType.NATIVE_MESSAGE_DECRYPTION_FAILED);
        }
    }

    return { ...(payload as Omit<Mes, 'encrypt'>), encrypt: false } as Mes;
};

export const messageToPayload = async <Mes extends NativeMessage>(
    message: Mes,
    messageId: string,
    sender: 'desktop' | 'extension'
): Promise<NativeMessagePayload<Mes>> => {
    if (message.encrypt) {
        try {
            const { type, encrypt, ...data } = message;
            const encrypted = await PassCrypto.encryptForNativeMessaging(data, sender);
            const serverTime = getServerTime().getTime();
            const { userIdentifier } = data as { userIdentifier?: string };
            return {
                type,
                messageId,
                encrypted,
                serverTime,
                ...(userIdentifier && { userIdentifier }),
            } as NativeMessagePayload<Mes>;
        } catch (error) {
            throw new NativeMessageError(NativeMessageErrorType.NATIVE_MESSAGE_ENCRYPTION_FAILED);
        }
    }

    const { type, encrypt, ...payload } = message;
    return { type, messageId, ...payload } as NativeMessagePayload<Mes>;
};
