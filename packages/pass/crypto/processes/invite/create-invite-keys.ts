import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { ItemKey, KeyRotationKeyPair, VaultKey } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

type CreateInviteKeysProcessParams = {
    targetKeys: (VaultKey | ItemKey)[];
    inviteePublicKey: PublicKeyReference;
    inviterPrivateKey: PrivateKeyReference;
};

export const createInviteKeys = async ({
    targetKeys,
    inviteePublicKey,
    inviterPrivateKey,
}: CreateInviteKeysProcessParams): Promise<KeyRotationKeyPair[]> => {
    return Promise.all(
        targetKeys.map(
            async ({ raw: binaryData, rotation: KeyRotation }): Promise<KeyRotationKeyPair> => ({
                Key: uint8ArrayToBase64String(
                    (
                        await CryptoProxy.encryptMessage({
                            binaryData,
                            encryptionKeys: [inviteePublicKey],
                            signingKeys: [inviterPrivateKey],
                            format: 'binary',
                        })
                    ).message
                ),
                KeyRotation,
            })
        )
    );
};
