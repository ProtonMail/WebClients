import type { PrivateKeyReference, PublicKeyReference } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';

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
        expectSigned: true,
        format: 'binary',
    });

    return data;
};
