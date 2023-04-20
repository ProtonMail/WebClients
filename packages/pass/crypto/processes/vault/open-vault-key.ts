import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import type { ShareKeyResponse, VaultKey } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { DecryptedKey } from '@proton/shared/lib/interfaces';

import { getSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoVaultError } from '../../utils/errors';

type OpenVaultKeyProcessParams = {
    shareKey: ShareKeyResponse;
    userKeys: DecryptedKey[];
};

export const openVaultKey = async ({
    shareKey: { Key, KeyRotation },
    userKeys,
}: OpenVaultKeyProcessParams): Promise<VaultKey> => {
    const privateUserKeys = userKeys.map(({ privateKey }) => privateKey);

    const { data: vaultKey, verified } = await CryptoProxy.decryptMessage({
        binaryMessage: base64StringToUint8Array(Key),
        decryptionKeys: privateUserKeys,
        verificationKeys: privateUserKeys,
        format: 'binary',
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        throw new PassCryptoVaultError(`Could not validate vault key signature`);
    }

    return {
        raw: vaultKey,
        key: await getSymmetricKey(vaultKey),
        rotation: KeyRotation,
    };
};
