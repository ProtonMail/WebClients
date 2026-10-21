import type { PrivateKeyReference, PublicKeyReference } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';

import type { KeyRotationKeyPair } from '../../../../types/api/pass';
import type { InviteTargetKey } from '../../../../types/crypto/pass-types';
import { PassSignatureContext } from '../../../../types/crypto/pass-types';

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
        targetKeys.map(async ({ raw: binaryData, rotation: KeyRotation }): Promise<KeyRotationKeyPair> => ({
            Key: (
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
        }))
    );
};
