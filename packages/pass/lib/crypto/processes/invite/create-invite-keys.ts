import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { InviteTargetKey } from '@proton/pass/types';
import { type KeyRotationKeyPair, PassSignatureContext } from '@proton/pass/types';

type CreateInviteKeysProcessParams = {
    targetKeys: InviteTargetKey[];
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
                Key: 
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
                    ).message.toBase64(),
                KeyRotation,
            })
        )
    );
};
