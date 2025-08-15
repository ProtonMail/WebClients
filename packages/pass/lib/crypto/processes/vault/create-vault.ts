import { CryptoProxy } from '@proton/crypto';
import { encryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoVaultError } from '@proton/pass/lib/crypto/utils/errors';
import type { VaultCreateRequest } from '@proton/pass/types';
import { ContentFormatVersion, PassEncryptionTag } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

type CreateVaultProcessParams = {
    content: Uint8Array<ArrayBuffer>;
    userKey: DecryptedKey;
    addressId: string;
};

export const createVault = async ({
    content,
    userKey,
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
        encryptionKeys: [userKey.privateKey],
        signingKeys: [userKey.privateKey],
        format: 'binary',
    });

    return {
        AddressID: addressId,
        ContentFormatVersion: ContentFormatVersion.Share,
        Content: uint8ArrayToBase64String(encryptedVaultContent),
        EncryptedVaultKey: uint8ArrayToBase64String(encryptedVaultKey.message),
    };
};
