import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { type KeyRotationKeyPair, PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

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

    return decryptData(vaultKey, base64StringToUint8Array(encryptedVaultContent), PassEncryptionTag.VaultContent);
};
