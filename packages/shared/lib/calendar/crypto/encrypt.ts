import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { stringToUtf8Array } from '@proton/crypto/lib/utils';

import type { SimpleMap } from '../../interfaces';
import type { EncryptPartResult, SignPartResult } from '../../interfaces/calendar';

export function signPart(dataToSign: string, signingKey: PrivateKeyReference): Promise<SignPartResult>;
export function signPart(
    dataToSign: string | undefined,
    signingKey: PrivateKeyReference
): Promise<SignPartResult | undefined>;

export async function signPart(
    dataToSign: string | undefined,
    signingKey: PrivateKeyReference
): Promise<SignPartResult | undefined> {
    if (!dataToSign) {
        return;
    }

    const signature = await CryptoProxy.signMessage({
        binaryData: stringToUtf8Array(dataToSign),
        signingKeys: [signingKey],
        detached: true,
    });
    return {
        data: dataToSign,
        signature,
    };
}

export function encryptPart(
    dataToEncrypt: string,
    signingKey: PrivateKeyReference,
    sessionKey: SessionKey
): Promise<EncryptPartResult>;
export function encryptPart(
    dataToEncrypt: string | undefined,
    signingKey: PrivateKeyReference,
    sessionKey: SessionKey
): Promise<EncryptPartResult | undefined>;

export async function encryptPart(
    dataToEncrypt: string | undefined,
    signingKey: PrivateKeyReference,
    sessionKey: SessionKey
): Promise<EncryptPartResult | undefined> {
    if (!dataToEncrypt) {
        return;
    }
    const { message: encryptedData, signature: binarySignature } = await CryptoProxy.encryptMessage({
        binaryData: stringToUtf8Array(dataToEncrypt),
        signingKeys: [signingKey],
        sessionKey,
        format: 'binary',
        detached: true,
    });

    return {
        dataPacket: encryptedData,
        signature: await CryptoProxy.getArmoredSignature({ binarySignature }),
    };
}

export const getEncryptedSessionKey = async ({ data, algorithm }: SessionKey, publicKey: PublicKeyReference) => {
    const encryptedSessionKey = await CryptoProxy.encryptSessionKey({
        data,
        algorithm,
        encryptionKeys: [publicKey],
        format: 'binary',
    });
    return encryptedSessionKey;
};

export const createSessionKey = async (publicKey: PublicKeyReference) =>
    CryptoProxy.generateSessionKey({ recipientKeys: publicKey });

export const getEncryptedSessionKeysMap = async (
    sessionKey: SessionKey,
    publicKeyMap: SimpleMap<PublicKeyReference> = {}
) => {
    const emails = Object.keys(publicKeyMap);
    if (!emails.length) {
        return;
    }
    const result: SimpleMap<Uint8Array<ArrayBuffer>> = {};
    await Promise.all(
        emails.map(async (email) => {
            const publicKey = publicKeyMap[email];
            if (!publicKey) {
                return;
            }
            result[email] = await getEncryptedSessionKey(sessionKey, publicKey);
        })
    );

    return result;
};
