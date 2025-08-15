import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';

export const getDecryptedSessionKey = async ({
    data: serializedMessage,
    privateKeys,
}: {
    data: string | Uint8Array<ArrayBuffer>;
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

interface DecryptionResult {
    decryptedPassphrase: string;
    sessionKey: SessionKey;
    verificationStatus: VERIFICATION_STATUS;
}

type CommonKeys<T, U> = {
    [K in keyof T & keyof U]: T[K] extends U[K] ? (U[K] extends T[K] ? K : never) : never;
}[keyof T & keyof U];

type CommonProperties<T, U> = {
    [K in CommonKeys<T, U>]: T[K];
};

export type VerificationKeysCallback = () => Promise<CommonProperties<PublicKeyReference, PrivateKeyReference>[]>;

export const decryptPassphrase = async ({
    armoredPassphrase,
    armoredSignature,
    privateKeys,
    publicKeysCallbackList,
}: {
    armoredPassphrase: string;
    armoredSignature?: string;
    privateKeys: PrivateKeyReference[];
    publicKeysCallbackList: VerificationKeysCallback[];
}): Promise<DecryptionResult> => {
    const sessionKey = await getDecryptedSessionKey({ data: armoredPassphrase, privateKeys });

    let decryptionResult!: DecryptionResult;

    if (publicKeysCallbackList.length === 0) {
        const { data, verificationStatus } = await CryptoProxy.decryptMessage({
            armoredMessage: armoredPassphrase,
            armoredSignature,
            sessionKeys: sessionKey,
            verificationKeys: [],
        });
        decryptionResult = { decryptedPassphrase: data, sessionKey, verificationStatus };
    }

    for (const verificationKeysCallback of publicKeysCallbackList) {
        const verificationKeys = await verificationKeysCallback();

        const { data, verificationStatus } = await CryptoProxy.decryptMessage({
            armoredMessage: armoredPassphrase,
            armoredSignature,
            sessionKeys: sessionKey,
            verificationKeys,
        });

        decryptionResult = { decryptedPassphrase: data, sessionKey, verificationStatus };
        if (verificationStatus === VERIFICATION_STATUS.SIGNED_AND_VALID) {
            // if the signature is valid, we return the decryption result directly, no need to fallback
            break;
        }
    }

    return decryptionResult;
};
