import { CryptoProxy } from '@proton/crypto';
import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';

/** Decrypts a stored PAT key (as returned in the list endpoint's
 * `PersonalAccessTokenKey` field) back to its raw 32 bytes, verifying the
 * signature produced at creation time. */
export const openAccessTokenKey = async (
    encryptedB64: string,
    privateKey: PrivateKeyReference,
    publicKey: PublicKeyReference
): Promise<Uint8Array<ArrayBuffer>> => {
    const binaryMessage = Uint8Array.fromBase64(encryptedB64) as Uint8Array<ArrayBuffer>;
    const { data } = await CryptoProxy.decryptMessage({
        binaryMessage,
        decryptionKeys: privateKey,
        verificationKeys: publicKey,
        format: 'binary',
    });
    return data as Uint8Array<ArrayBuffer>;
};
