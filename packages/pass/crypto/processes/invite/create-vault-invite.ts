import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { KeyRotationKeyPair, VaultKey } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

type CreateInviteProcessParams = {
    vaultKeys: VaultKey[];
    inviteePublicKey: PublicKeyReference;
    inviterPrivateKey: PrivateKeyReference;
};

export const createVaultInvite = async ({
    vaultKeys,
    inviteePublicKey,
    inviterPrivateKey,
}: CreateInviteProcessParams): Promise<KeyRotationKeyPair[]> =>
    Promise.all(
        vaultKeys.map(
            async (vaultKey): Promise<KeyRotationKeyPair> => ({
                Key: uint8ArrayToBase64String(
                    (
                        await CryptoProxy.encryptMessage({
                            binaryData: vaultKey.raw,
                            encryptionKeys: [inviteePublicKey],
                            signingKeys: [inviterPrivateKey],
                            format: 'binary',
                        })
                    ).message
                ),
                KeyRotation: vaultKey.rotation,
            })
        )
    );
