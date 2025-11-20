import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoVaultError } from '@proton/pass/lib/crypto/utils/errors';
import type { VaultShareKey as ShareKey, ShareKeyResponse } from '@proton/pass/types';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

type OpenVaultKeyProcessParams = {
    shareKey: ShareKeyResponse;
    userKeys: DecryptedKey[];
};

export const openShareKey = async ({ shareKey, userKeys }: OpenVaultKeyProcessParams): Promise<ShareKey> => {
    const { Key, KeyRotation, UserKeyID } = shareKey;
    const privateUserKeys = userKeys.map(({ privateKey }) => privateKey);

    const { data: vaultKey, verificationStatus } = await CryptoProxy.decryptMessage({
        binaryMessage: Uint8Array.fromBase64(Key),
        decryptionKeys: privateUserKeys,
        verificationKeys: privateUserKeys,
        format: 'binary',
    });

    if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        throw new PassCryptoVaultError(`Could not validate vault key signature`);
    }

    return {
        raw: vaultKey,
        key: await importSymmetricKey(vaultKey),
        rotation: KeyRotation,
        userKeyId: UserKeyID,
    };
};
