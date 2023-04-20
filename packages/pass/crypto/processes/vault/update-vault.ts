import { CONTENT_FORMAT_VERSION, EncryptionTag } from '@proton/pass/types';
import type { VaultKey, VaultUpdateRequest } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { encryptData } from '../../utils/crypto-helpers';
import { PassCryptoVaultError } from '../../utils/errors';

type UpdateVaultProcessParams = {
    vaultKey: VaultKey;
    content: Uint8Array;
};

export const updateVault = async ({ vaultKey, content }: UpdateVaultProcessParams): Promise<VaultUpdateRequest> => {
    if (content.length === 0) {
        throw new PassCryptoVaultError('Vault content cannot be empty');
    }

    const encryptedVaultContent = await encryptData(vaultKey.key, content, EncryptionTag.VaultContent);

    return {
        ContentFormatVersion: CONTENT_FORMAT_VERSION,
        Content: uint8ArrayToBase64String(encryptedVaultContent),
        KeyRotation: vaultKey.rotation,
    };
};
