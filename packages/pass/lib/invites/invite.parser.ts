import { getPublicKeysForEmail } from '@proton/pass/lib/auth/address';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { getOrganizationKey } from '@proton/pass/lib/organization/organization.requests';
import { decodeVaultContent } from '@proton/pass/lib/vaults/vault-proto.transformer';
import type { GroupInviteListItemResponse, InviteVaultData, KeyRotationKeyPair, MaybeNull } from '@proton/pass/types';
import { type InviteDataForUser, ShareType } from '@proton/pass/types';

export const parseInviteVault = async (
    invite: InviteDataForUser,
    inviteKey: KeyRotationKeyPair
): Promise<MaybeNull<InviteVaultData>> => {
    if (invite.TargetType !== ShareType.Vault || !invite.VaultData) {
        return null;
    }

    const encodedVault = await PassCrypto.readVaultInvite({
        encryptedVaultContent: invite.VaultData.Content,
        invitedAddressId: invite.InvitedAddressID!,
        inviteKey: inviteKey,
        inviterPublicKeys: await getPublicKeysForEmail(invite.InviterEmail),
    });

    return {
        content: decodeVaultContent(encodedVault),
        memberCount: invite.VaultData.MemberCount,
        itemCount: invite.VaultData.ItemCount,
    };
};

export const parseGroupInviteVault = async (
    invite: GroupInviteListItemResponse,
    inviteKey: KeyRotationKeyPair
): Promise<MaybeNull<InviteVaultData>> => {
    if (invite.TargetType !== ShareType.Vault || !invite.VaultData) {
        return null;
    }

    const encodedVault = await PassCrypto.readGroupVaultInvite({
        encryptedVaultContent: invite.VaultData.Content,
        organizationKey: invite.IsGroupOwner ? null : await getOrganizationKey(),
        groupId: invite.InvitedGroupID,
        inviteKey,
        inviterPublicKeys: await getPublicKeysForEmail(invite.InviterEmail),
    });

    return {
        content: decodeVaultContent(encodedVault),
        memberCount: invite.VaultData.MemberCount,
        itemCount: invite.VaultData.ItemCount,
    };
};
