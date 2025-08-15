import type { ContextSigningOptions, PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

export const decryptKeyPacket = async ({
    armoredMessage,
    decryptionKeys,
}: {
    armoredMessage?: string;
    decryptionKeys: PrivateKeyReference[];
}) => {
    const sessionKey = await CryptoProxy.decryptSessionKey({
        armoredMessage,
        decryptionKeys,
    });
    if (!sessionKey) {
        throw new Error('Missing session key');
    }
    const message = await CryptoProxy.decryptMessage({
        armoredMessage,
        sessionKeys: sessionKey,
        format: 'binary',
    });
    return { message, sessionKey };
};

export const encryptAndSignKeyPacket = async ({
    binaryData,
    sessionKey,
    encryptionKey,
    signingKey,
    signatureContext,
}: {
    sessionKey: SessionKey;
    binaryData: Uint8Array<ArrayBuffer>;
    encryptionKey: PublicKeyReference;
    signingKey: PrivateKeyReference;
    signatureContext?: ContextSigningOptions;
}) => {
    const result = await CryptoProxy.encryptSessionKey({
        ...sessionKey,
        encryptionKeys: [encryptionKey],
        format: 'binary',
    });

    const signature = await CryptoProxy.signMessage({
        binaryData,
        signingKeys: [signingKey],
        detached: true,
        signatureContext,
    });

    return {
        keyPacket: uint8ArrayToBase64String(result),
        signature,
    };
};
