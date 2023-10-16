import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { type KeyRotationKeyPair, PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { decryptData, getSymmetricKey } from '../../utils/crypto-helpers';
import { openInviteKey } from './open-invite-key';

type ReadVaultInviteContentProcessParams = {
    inviteKey: KeyRotationKeyPair;
    encryptedVaultContent: string;
    invitedPrivateKey: PrivateKeyReference;
    inviterPublicKeys: PublicKeyReference[];
};

export const readVaultInviteContent = async ({
    inviteKey,
    encryptedVaultContent,
    invitedPrivateKey,
    inviterPublicKeys,
}: ReadVaultInviteContentProcessParams): Promise<Uint8Array> => {
    const openedVaultKey = await openInviteKey({ inviteKey, invitedPrivateKey, inviterPublicKeys });
    const vaultKey = await getSymmetricKey(openedVaultKey);

    return decryptData(vaultKey, base64StringToUint8Array(encryptedVaultContent), PassEncryptionTag.VaultContent);
};
