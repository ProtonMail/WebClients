import { CryptoProxy, type PrivateKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import type { NativeMessageData } from '@proton/pass/types';
import { PassSignatureContext } from '@proton/pass/types';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

const getSignatureContextValue = (sender: 'extension' | 'desktop'): PassSignatureContext =>
    sender === 'extension'
        ? PassSignatureContext.NativeMessagingExtensionEncryption
        : PassSignatureContext.NativeMessagingDesktopEncryption;

export const encryptForNativeMessaging = async <T extends NativeMessageData>(
    data: T,
    sender: 'extension' | 'desktop',
    primaryUserKey: PrivateKeyReference
) => {
    const result = await CryptoProxy.encryptMessage({
        textData: JSON.stringify(data),
        encryptionKeys: [primaryUserKey],
        signingKeys: [primaryUserKey],
        format: 'binary',
        signatureContext: { critical: true, value: getSignatureContextValue(sender) },
    });

    return result.message.toBase64();
};

export const decryptFromNativeMessaging = async <T extends NativeMessageData>(
    encryptedData: string,
    sender: 'extension' | 'desktop',
    userKeys: DecryptedKey<PrivateKeyReference>[]
) => {
    const keys = userKeys.map((key) => key.privateKey);

    const { data, verificationStatus, verificationErrors } = await CryptoProxy.decryptMessage({
        binaryMessage: Uint8Array.fromBase64(encryptedData),
        decryptionKeys: keys,
        verificationKeys: keys,
        signatureContext: { required: true, value: getSignatureContextValue(sender) },
    });

    if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        throw verificationErrors ?? new Error('Verification failed');
    }

    return JSON.parse(data) as T;
};
