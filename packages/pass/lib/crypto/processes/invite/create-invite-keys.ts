import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { type ItemKey, type KeyRotationKeyPair, PassSignatureContext, type VaultKey } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

type CreateInviteKeysProcessParams = {
    targetKeys: (VaultKey | ItemKey)[];
    invitedPublicKey: PublicKeyReference;
    inviterPrivateKey: PrivateKeyReference;
};

export const createInviteKeys = async ({
    targetKeys,
    invitedPublicKey,
    inviterPrivateKey,
}: CreateInviteKeysProcessParams): Promise<KeyRotationKeyPair[]> => {
    return Promise.all(
        targetKeys.map(
            async ({ raw: binaryData, rotation: KeyRotation }): Promise<KeyRotationKeyPair> => ({
                Key: uint8ArrayToBase64String(
                    (
                        await CryptoProxy.encryptMessage({
                            binaryData,
                            encryptionKeys: [invitedPublicKey],
                            signingKeys: [inviterPrivateKey],
                            format: 'binary',
                            signatureContext: {
                                value: PassSignatureContext.VaultInviteExistingUser,
                                critical: true,
                            },
                        })
                    ).message
                ),
                KeyRotation,
            })
        )
    );
};
