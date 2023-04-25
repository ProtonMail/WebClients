import { CryptoProxy } from '@proton/crypto';
import type { VaultCreateRequest } from '@proton/pass/types';
import { CONTENT_FORMAT_VERSION, EncryptionTag } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { encryptData, generateKey, getSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoVaultError } from '../../utils/errors';

type CreateVaultProcessParams = {
    content: Uint8Array;
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
    const shareKey = await getSymmetricKey(key);
    const encryptedVaultContent = await encryptData(shareKey, content, EncryptionTag.VaultContent);

    const encryptedVaultKey = await CryptoProxy.encryptMessage({
        binaryData: key,
        encryptionKeys: [userKey.privateKey],
        signingKeys: [userKey.privateKey],
        format: 'binary',
    });

    return {
        AddressID: addressId,
        ContentFormatVersion: CONTENT_FORMAT_VERSION,
        Content: uint8ArrayToBase64String(encryptedVaultContent),
        EncryptedVaultKey: uint8ArrayToBase64String(encryptedVaultKey.message),
    };
};
