import { encryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoVaultError } from '@proton/pass/lib/crypto/utils/errors';
import type { VaultShareKey, VaultUpdateRequest } from '@proton/pass/types';
import { ContentFormatVersion, PassEncryptionTag } from '@proton/pass/types';

type UpdateVaultProcessParams = {
    vaultKey: VaultShareKey;
    content: Uint8Array<ArrayBuffer>;
};

export const updateVault = async ({ vaultKey, content }: UpdateVaultProcessParams): Promise<VaultUpdateRequest> => {
    if (content.length === 0) {
        throw new PassCryptoVaultError('Vault content cannot be empty');
    }

    const encryptedVaultContent = await encryptData(vaultKey.key, content, PassEncryptionTag.VaultContent);

    return {
        ContentFormatVersion: ContentFormatVersion.Share,
        Content: encryptedVaultContent.toBase64(),
        KeyRotation: vaultKey.rotation,
    };
};
