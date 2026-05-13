import { encryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { KeyRotationKeyPair, ShareKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';

/** Wraps every rotation of a vault's share keys with the PAT's raw symmetric
 * key so the holder of the PAT can decrypt items in that vault. Mirrors the
 * Pass CLI rust `prepare_vault_access_keys` (AES-GCM, AAD=ShareKey). */
export const createAccessTokenShareKeys = async (
    rawPatKey: Uint8Array<ArrayBuffer>,
    shareKeys: ShareKey[]
): Promise<KeyRotationKeyPair[]> => {
    const patKey = await importSymmetricKey(rawPatKey);

    return Promise.all(
        shareKeys.map(async ({ raw, rotation }) => {
            const encrypted = await encryptData(patKey, raw, PassEncryptionTag.ShareKey);
            return { KeyRotation: rotation, Key: encrypted.toBase64() };
        })
    );
};
