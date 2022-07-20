import { c } from 'ttag';

import { CryptoProxy, PrivateKeyReference, PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';

export const getDecryptedSessionKey = async ({
    data: serializedMessage,
    privateKeys,
}: {
    data: string | Uint8Array;
    privateKeys: PrivateKeyReference | PrivateKeyReference[];
}) => {
    const messageType = serializedMessage instanceof Uint8Array ? 'binaryMessage' : 'armoredMessage';
    const sessionKey = await CryptoProxy.decryptSessionKey({
        [messageType]: serializedMessage,
        decryptionKeys: privateKeys,
    });
    if (!sessionKey) {
        throw new Error('Could not decrypt session key');
    }

    return sessionKey;
};

export const decryptPassphrase = async ({
    armoredPassphrase,
    armoredSignature,
    privateKeys,
    publicKeys,
    validateSignature = true,
}: {
    armoredPassphrase: string;
    armoredSignature?: string;
    privateKeys: PrivateKeyReference[];
    publicKeys: PublicKeyReference[];
    validateSignature?: boolean;
}) => {
    const sessionKey = await getDecryptedSessionKey({ data: armoredPassphrase, privateKeys });

    const { data: decryptedPassphrase, verified } = await CryptoProxy.decryptMessage({
        armoredMessage: armoredPassphrase,
        armoredSignature,
        sessionKeys: sessionKey,
        verificationKeys: publicKeys,
    });

    if (validateSignature && verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return { decryptedPassphrase, sessionKey, verified };
};
