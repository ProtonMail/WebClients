import { CryptoProxy, VERIFICATION_STATUS } from '@protontech/crypto';

import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { VaultShareKey as ShareKey, ShareKeyResponse } from '../../../../types';
import { importSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoVaultError } from '../../utils/errors';

type OpenVaultKeyProcessParams = {
    shareKey: ShareKeyResponse;
    addressKeys: DecryptedKey[];
    groupPublicKeys: string[];
};

export const openGroupShareKey = async ({
    shareKey,
    addressKeys,
    groupPublicKeys,
}: OpenVaultKeyProcessParams): Promise<ShareKey> => {
    const { Key, KeyRotation, UserKeyID } = shareKey;
    const privateAddressKeys = addressKeys.map(({ privateKey }) => privateKey);
    const publicGroupKeys = await Promise.all(
        groupPublicKeys.map((armoredKey) => CryptoProxy.importPublicKey({ armoredKey }))
    );

    const { data: vaultKey, verificationStatus } = await CryptoProxy.decryptMessage({
        binaryMessage: Uint8Array.fromBase64(Key),
        decryptionKeys: privateAddressKeys,
        verificationKeys: publicGroupKeys,
        format: 'binary',
        // As this message has been derived from group share, decryption needs that flag
        config: { allowForwardedMessages: true },
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
