import type { PrivateKeyReference, PublicKeyReference } from '@protontech/crypto';

import { type KeyRotationKeyPair, PassEncryptionTag } from '../../../../types';
import { decryptData, importSymmetricKey } from '../../utils/crypto-helpers';
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
}: ReadVaultInviteContentProcessParams): Promise<Uint8Array<ArrayBuffer>> => {
    const openedVaultKey = await openInviteKey({ inviteKey, invitedPrivateKey, inviterPublicKeys });
    const vaultKey = await importSymmetricKey(openedVaultKey);

    return decryptData(vaultKey, Uint8Array.fromBase64(encryptedVaultContent), PassEncryptionTag.VaultContent);
};
