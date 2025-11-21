import { c } from 'ttag';

import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';

const DELEGATED_ACCESS_SIGNATURE_CONTEXT = {
    KEY_TOKEN_SIGNATURE_CONTEXT: 'account.key-token.delegated',
};

export const generateDelegatedAccessToken = () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return randomBytes.toHex();
};

export const getEncryptedDelegatedAccessToken = async ({
    token,
    signingKeys,
    encryptionKeys,
}: {
    token: string;
    signingKeys: PrivateKeyReference[];
    encryptionKeys: PublicKeyReference[];
}) => {
    const { message } = await CryptoProxy.encryptMessage({
        textData: token,
        encryptionKeys,
        signingKeys,
        signatureContext: { value: DELEGATED_ACCESS_SIGNATURE_CONTEXT.KEY_TOKEN_SIGNATURE_CONTEXT, critical: true },
    });
    return message;
};

export const getDecryptedDelegatedAccessToken = async ({
    armoredMessage,
    verificationKeys,
    decryptionKeys,
}: {
    armoredMessage: string;
    verificationKeys: PublicKeyReference[];
    decryptionKeys: PrivateKeyReference[];
}) => {
    const { data: decryptedToken, verificationStatus } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys,
        verificationKeys,
        signatureContext: {
            value: DELEGATED_ACCESS_SIGNATURE_CONTEXT.KEY_TOKEN_SIGNATURE_CONTEXT,
            required: true,
        },
    });

    if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedToken;
};
