import {
    encryptMessage,
    encryptSessionKey,
    generateSessionKey,
    getPreferredAlgorithm,
    OpenPGPKey,
    SessionKey,
    signMessage,
    splitMessage,
} from 'pmcrypto';
import { SimpleMap } from '../interfaces';
import { EncryptPartResult, SignPartResult } from '../interfaces/calendar';

export function signPart(dataToSign: string, signingKey: OpenPGPKey): Promise<SignPartResult>;
export function signPart(dataToSign: string | undefined, signingKey: OpenPGPKey): Promise<SignPartResult | undefined>;

export async function signPart(
    dataToSign: string | undefined,
    signingKey: OpenPGPKey
): Promise<SignPartResult | undefined> {
    if (!dataToSign) {
        return;
    }
    const { signature } = await signMessage({
        data: dataToSign,
        privateKeys: [signingKey],
        armor: false,
        detached: true,
    });
    return {
        data: dataToSign,
        signature,
    };
}

export function encryptPart(
    dataToEncrypt: string,
    signingKey: OpenPGPKey,
    sessionKey: SessionKey
): Promise<EncryptPartResult>;
export function encryptPart(
    dataToEncrypt: string | undefined,
    signingKey: OpenPGPKey,
    sessionKey: SessionKey
): Promise<EncryptPartResult | undefined>;

export async function encryptPart(
    dataToEncrypt: string | undefined,
    signingKey: OpenPGPKey,
    sessionKey: SessionKey
): Promise<EncryptPartResult | undefined> {
    if (!dataToEncrypt) {
        return;
    }
    const { message, signature } = await encryptMessage({
        data: dataToEncrypt,
        privateKeys: [signingKey],
        sessionKey,
        armor: false,
        detached: true,
    });
    const { encrypted } = await splitMessage(message);
    return {
        dataPacket: encrypted[0],
        signature,
    };
}

export const getEncryptedSessionKey = async ({ data, algorithm }: SessionKey, publicKey: OpenPGPKey) => {
    const { message } = await encryptSessionKey({ data, algorithm, publicKeys: [publicKey] });
    const { asymmetric } = await splitMessage(message);
    return asymmetric[0];
};

export const createSessionKey = async (publicKey: OpenPGPKey) => {
    const algorithm = await getPreferredAlgorithm([publicKey]);
    const sessionKey = await generateSessionKey(algorithm);
    return {
        data: sessionKey,
        algorithm,
    };
};

export const getEncryptedSessionKeysMap = async (sessionKey: SessionKey, publicKeyMap: SimpleMap<OpenPGPKey> = {}) => {
    const emails = Object.keys(publicKeyMap);
    if (!emails.length) {
        return;
    }
    const result: SimpleMap<Uint8Array> = {};
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
