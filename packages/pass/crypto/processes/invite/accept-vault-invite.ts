import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { KeyRotationKeyPair } from '@proton/pass/types';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

type AcceptVaultInviteProcessParams = {
    inviteKeys: KeyRotationKeyPair[];
    inviteePrivateKey: PrivateKeyReference;
    inviterPublicKeys: PublicKeyReference[];
    userKey: DecryptedKey;
};

export const acceptVaultInvite = async ({
    inviteKeys,
    inviteePrivateKey,
    inviterPublicKeys,
    userKey,
}: AcceptVaultInviteProcessParams): Promise<KeyRotationKeyPair[]> =>
    Promise.all(
        inviteKeys.map(async (inviteKey): Promise<KeyRotationKeyPair> => {
            const { data: vaultKey } = await CryptoProxy.decryptMessage({
                binaryMessage: base64StringToUint8Array(inviteKey.Key),
                decryptionKeys: inviteePrivateKey,
                verificationKeys: inviterPublicKeys,
                format: 'binary',
            });

            const { message: encryptedVaultKey } = await CryptoProxy.encryptMessage({
                binaryData: vaultKey,
                encryptionKeys: userKey.privateKey,
                signingKeys: userKey.privateKey,
                format: 'binary',
            });

            return {
                Key: uint8ArrayToBase64String(encryptedVaultKey),
                KeyRotation: inviteKey.KeyRotation,
            };
        })
    );
