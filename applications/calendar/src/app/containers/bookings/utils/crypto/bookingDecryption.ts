import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto/lib';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';

import { bookingSecretSignatureContextValue } from './cryptoHelpers';

export const decryptBookingPageSecrets = async ({
    encryptedSecret,
    selectedCalendar,
    decryptionKeys,
    verifyingKeys,
}: {
    encryptedSecret: string;
    selectedCalendar: string;
    decryptionKeys: PrivateKeyReference[];
    verifyingKeys?: PublicKeyReference[];
}): Promise<Uint8Array<ArrayBuffer>> => {
    const decrypted = await CryptoProxy.decryptMessage({
        binaryMessage: Uint8Array.fromBase64(encryptedSecret),
        decryptionKeys,
        verificationKeys: verifyingKeys,
        signatureContext:
            verifyingKeys && verifyingKeys.length > 0
                ? { value: bookingSecretSignatureContextValue(selectedCalendar), required: true }
                : undefined,
        format: 'binary',
    });

    if (verifyingKeys && decrypted.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        // eslint-disable-next-line no-console
        console.warn({ errors: decrypted.verificationErrors });
        throw new Error('Encrypted booking secret verification failed');
    }

    return decrypted.data;
};
