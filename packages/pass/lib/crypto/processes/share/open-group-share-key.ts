import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoVaultError } from '@proton/pass/lib/crypto/utils/errors';
import type { VaultShareKey as ShareKey, ShareKeyResponse } from '@proton/pass/types';
import type { AddressKey, DecryptedKey } from '@proton/shared/lib/interfaces';

type OpenVaultKeyProcessParams = {
    shareKey: ShareKeyResponse;
    addressKeys: DecryptedKey[];
    groupKeys: AddressKey[];
};

export const openGroupShareKey = async ({
    shareKey,
    addressKeys,
    groupKeys,
}: OpenVaultKeyProcessParams): Promise<ShareKey> => {
    const { Key, KeyRotation, UserKeyID } = shareKey;
    const privateAddressKeys = addressKeys.map(({ privateKey }) => privateKey);
    const publicGroupKeys = await Promise.all(
        groupKeys.map((key) => CryptoProxy.importPublicKey({ armoredKey: key.PrivateKey }))
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
