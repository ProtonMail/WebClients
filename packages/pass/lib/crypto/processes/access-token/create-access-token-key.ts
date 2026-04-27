import { CryptoProxy } from '@proton/crypto';
import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';

export type CreateAccessTokenKeyData = {
    /** OpenPGP-encrypted+signed token key, base64 encoded — sent to the server */
    encrypted: string;
    /** Raw 32-byte token key — must be given to the user together with the token
     * so the CLI can decrypt Pass items. The server never sees this value. */
    raw: Uint8Array<ArrayBuffer>;
};

/** Mirrors the Pass CLI rust implementation:
 * encrypts a fresh raw 32-byte token key with the user's primary public key
 * and signs it with the primary private key. */
export const createAccessTokenKey = async (
    publicKey: PublicKeyReference,
    privateKey: PrivateKeyReference
): Promise<CreateAccessTokenKeyData> => {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    const encrypted = await CryptoProxy.encryptMessage({
        binaryData: raw,
        encryptionKeys: publicKey,
        signingKeys: privateKey,
        format: 'binary',
    });
    return { encrypted: encrypted.message.toBase64(), raw };
};
