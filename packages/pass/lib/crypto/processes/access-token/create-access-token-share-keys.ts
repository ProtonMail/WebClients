import type { PersonalAccessTokenShareKey } from '@proton/pass/lib/access-token/access-token.types';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { encryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import { uint8ArrayToB64 } from '@proton/pass/utils/buffer/sanitization';

/** Wraps every rotation of a vault's share keys with the PAT's raw symmetric
 * key so the holder of the PAT can decrypt items in that vault. Mirrors the
 * Pass CLI rust `prepare_vault_access_keys` (AES-GCM, AAD=ShareKey). */
export const createAccessTokenShareKeys = async (
    rawPatKey: Uint8Array<ArrayBuffer>,
    shareId: string
): Promise<PersonalAccessTokenShareKey[]> => {
    const patKey = await importSymmetricKey(rawPatKey);
    const shareKeys = PassCrypto.getShareManager(shareId).getVaultShareKeys();

    return Promise.all(
        shareKeys.map(async ({ raw, rotation }) => ({
            KeyRotation: rotation,
            Key: uint8ArrayToB64(await encryptData(patKey, raw, PassEncryptionTag.ShareKey)),
        }))
    );
};
