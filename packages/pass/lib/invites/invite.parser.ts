import { getPublicKeysForEmail } from '@proton/pass/lib/auth/address';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { getOrganizationKey } from '@proton/pass/lib/organization/organization.requests';
import { decodeVaultContent } from '@proton/pass/lib/vaults/vault-proto.transformer';
import type {
    GroupInviteListItemResponse,
    Invite,
    InviteVaultData,
    KeyRotationKeyPair,
    MaybeNull,
} from '@proton/pass/types';
import { type InviteDataForUser, InviteType, ShareType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import type { AbstractInvite } from './invite.utils';
import { isVaultInvite } from './invite.utils';

/** Resolves the encryption key for the invite based on its target
 * type. Returns `null` if the invite data is invalid. */
export const parseInviteKey = (invite: AbstractInvite): MaybeNull<KeyRotationKeyPair> => {
    const encryptedVault = invite.VaultData;
    if (!encryptedVault && invite.TargetType !== ShareType.Item) return null;

    return (
        (invite.TargetType === ShareType.Item
            ? invite.Keys[0]
            : invite.Keys.find((key) => key.KeyRotation === encryptedVault!.ContentKeyRotation)) ?? null
    );
};

/** Decrypts vault metadata for a user invite */
export const parseUserInviteVault = async (
    invite: InviteDataForUser,
    inviteKey: KeyRotationKeyPair
): Promise<MaybeNull<InviteVaultData>> => {
    if (!isVaultInvite(invite)) return null;

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

/** Decrypts vault metadata for a group invite */
export const parseGroupInviteVault = async (
    invite: GroupInviteListItemResponse,
    inviteKey: KeyRotationKeyPair
): Promise<MaybeNull<InviteVaultData>> => {
    if (!isVaultInvite(invite)) return null;

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

/** Parses a raw user invite API response into an `Invite` object */
export const parseUserInvite = async (invite: InviteDataForUser): Promise<MaybeNull<Invite>> => {
    try {
        const inviteKey = parseInviteKey(invite);
        if (!inviteKey) return null;

        return {
            type: InviteType.User,
            createTime: invite.CreateTime,
            invitedAddressId: invite.InvitedAddressID!,
            invitedEmail: invite.InvitedEmail,
            invitedGroupId: null,
            inviterEmail: invite.InviterEmail,
            fromNewUser: invite.FromNewUser,
            keys: invite.Keys,
            remindersSent: invite.RemindersSent,
            targetId: invite.TargetID,
            targetType: invite.TargetType,
            token: invite.InviteToken,
            vault: await parseUserInviteVault(invite, inviteKey),
        };
    } catch (err) {
        logger.warn(`[Invite::User] Could not decrypt invite`, err);
        return null;
    }
};

/** Parses a raw group invite API response into an `Invite` object */
export const parseGroupInvite = async (invite: GroupInviteListItemResponse): Promise<MaybeNull<Invite>> => {
    try {
        const inviteKey = parseInviteKey(invite);
        if (!inviteKey) return null;

        return {
            type: invite.IsGroupOwner ? InviteType.GroupOwner : InviteType.GroupOrg,
            createTime: invite.CreateTime,
            invitedAddressId: invite.InvitedAddressID!,
            invitedEmail: invite.InvitedEmail,
            invitedGroupId: invite.InvitedGroupID,
            inviterEmail: invite.InviterEmail,
            fromNewUser: false,
            keys: invite.Keys,
            remindersSent: invite.RemindersSent,
            targetId: invite.TargetID,
            targetType: invite.TargetType,
            token: invite.InviteToken,
            vault: await parseGroupInviteVault(invite, inviteKey),
        };
    } catch (err) {
        logger.warn(`[Invite::Group] Could not decrypt invite`, err);
        return null;
    }
};
