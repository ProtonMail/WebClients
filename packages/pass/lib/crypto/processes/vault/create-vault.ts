import { CryptoProxy } from '@proton/crypto';
import { encryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoVaultError } from '@proton/pass/lib/crypto/utils/errors';
import type { VaultCreateRequest } from '@proton/pass/types';
import { ContentFormatVersion, PassEncryptionTag } from '@proton/pass/types';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

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
