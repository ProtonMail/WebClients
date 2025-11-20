import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { KeyRotationKeyPair } from '@proton/pass/types';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { openInviteKey } from './open-invite-key';

type ReencryptInviteKeysProcessParams = {
    inviteKeys: KeyRotationKeyPair[];
    invitedPrivateKey: PrivateKeyReference;
    inviterPublicKeys: PublicKeyReference[];
    userKey: DecryptedKey;
};

export const reencryptInviteKeys = async ({
    inviteKeys,
    invitedPrivateKey,
    inviterPublicKeys,
    userKey,
}: ReencryptInviteKeysProcessParams): Promise<KeyRotationKeyPair[]> =>
    Promise.all(
        inviteKeys.map(async (inviteKey): Promise<KeyRotationKeyPair> => {
            const shareKey = await openInviteKey({ inviteKey, invitedPrivateKey, inviterPublicKeys });

            const { message: encryptedVaultKey } = await CryptoProxy.encryptMessage({
                binaryData: shareKey,
                encryptionKeys: userKey.privateKey,
                signingKeys: userKey.privateKey,
                format: 'binary',
            });

            return {
                Key: encryptedVaultKey.toBase64(),
                KeyRotation: inviteKey.KeyRotation,
            };
        })
    );
