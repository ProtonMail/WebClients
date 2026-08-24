import { CryptoProxy } from '@protontech/crypto';

import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { VaultCreateRequest } from '../../../../types';
import { ContentFormatVersion, PassEncryptionTag } from '../../../../types';
import { encryptData, generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoVaultError } from '../../utils/errors';

type CreateVaultProcessParams = {
    content: Uint8Array<ArrayBuffer>;
    encryptionKey: DecryptedKey;
    signingKey: DecryptedKey;
    addressId: string;
};

export const createVault = async ({
    content,
    encryptionKey,
    signingKey,
    addressId,
}: CreateVaultProcessParams): Promise<VaultCreateRequest> => {
    if (content.length === 0) {
        throw new PassCryptoVaultError('Vault content cannot be empty');
    }

    const key = generateKey();
    const shareKey = await importSymmetricKey(key);
    const encryptedVaultContent = await encryptData(shareKey, content, PassEncryptionTag.VaultContent);

    const encryptedVaultKey = await CryptoProxy.encryptMessage({
        binaryData: key,
        encryptionKeys: [encryptionKey.privateKey],
        signingKeys: [signingKey.privateKey],
        format: 'binary',
    });

    return {
        AddressID: addressId,
        ContentFormatVersion: ContentFormatVersion.Share,
        Content: encryptedVaultContent.toBase64(),
        EncryptedVaultKey: encryptedVaultKey.message.toBase64(),
    };
};
