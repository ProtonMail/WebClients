import { c } from 'ttag';
import {
    OpenPGPKey,
    VERIFICATION_STATUS,
    decryptMessage,
    getMessage,
    decryptSessionKey,
    getSignature,
    OpenPGPMessage,
} from 'pmcrypto';

export const getDecryptedSessionKey = async ({
    data,
    privateKeys,
}: {
    data: string | OpenPGPMessage | Uint8Array;
    privateKeys: OpenPGPKey | OpenPGPKey[];
}) => {
    const message = await getMessage(data);
    const sessionKey = await decryptSessionKey({ message, privateKeys });
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
    armoredSignature: string;
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
    validateSignature?: boolean;
}) => {
    const [message, sessionKey] = await Promise.all([
        getMessage(armoredPassphrase),
        getDecryptedSessionKey({ data: armoredPassphrase, privateKeys }),
    ]);

    const { data: decryptedPassphrase, verified } = await decryptMessage({
        message,
        signature: await getSignature(armoredSignature),
        sessionKeys: sessionKey,
        publicKeys,
    });

    if (validateSignature && verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return { decryptedPassphrase: decryptedPassphrase as string, sessionKey, verified };
};
