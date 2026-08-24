import type { VaultShareKey, VaultUpdateRequest } from '../../../../types';
import { ContentFormatVersion, PassEncryptionTag } from '../../../../types';
import { encryptData } from '../../utils/crypto-helpers';
import { PassCryptoVaultError } from '../../utils/errors';

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
