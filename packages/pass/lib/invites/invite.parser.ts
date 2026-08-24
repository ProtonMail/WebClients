import type {
    AbstractInviteResponse,
    GroupInvite,
    GroupInviteListItemResponse,
    InviteVaultData,
    KeyRotationKeyPair,
    MaybeNull,
    UserInvite,
} from '../../types';
import { type InviteDataForUser, InviteType, ShareType } from '../../types';
import { logger } from '../../utils/logger';
import { getPublicKeysForEmail } from '../auth/address';
import { PassCrypto } from '../crypto';
import { getOrganizationKey } from '../organization/organization.requests';
import { decodeVaultContent } from '../vaults/vault-proto.transformer';
import { isVaultInviteResponse } from './invite.utils';

/** Resolves the encryption key for the invite based on its target
 * type. Returns `null` if the invite data is invalid. */
export const parseInviteKey = (invite: AbstractInviteResponse): MaybeNull<KeyRotationKeyPair> => {
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
): Promise<InviteVaultData> => {
    if (!isVaultInviteResponse(invite)) throw new Error('Not a vault invite');

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
): Promise<InviteVaultData> => {
    if (!isVaultInviteResponse(invite)) throw new Error('Not a vault invite');

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
export const parseUserInvite = async (invite: InviteDataForUser): Promise<MaybeNull<UserInvite>> => {
    try {
        const inviteKey = parseInviteKey(invite);
        if (!inviteKey) return null;

        const parsed = {
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
            token: invite.InviteToken,
        } as const;

        switch (invite.TargetType) {
            case ShareType.Vault:
                const vault = await parseUserInviteVault(invite, inviteKey);
                return { ...parsed, targetType: invite.TargetType, vault };
            case ShareType.Item:
                return { ...parsed, targetType: invite.TargetType, vault: null };
            default:
                return null;
        }
    } catch (err) {
        logger.warn(`[Invite::User] Could not decrypt invite`, err);
        return null;
    }
};

/** Parses a raw group invite API response into an `Invite` object */
export const parseGroupInvite = async (invite: GroupInviteListItemResponse): Promise<MaybeNull<GroupInvite>> => {
    try {
        const inviteKey = parseInviteKey(invite);
        if (!inviteKey) return null;

        const parsed = {
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
            token: invite.InviteToken,
        } as const;

        switch (invite.TargetType) {
            case ShareType.Vault:
                const vault = await parseGroupInviteVault(invite, inviteKey);
                return { ...parsed, targetType: invite.TargetType, vault };
            case ShareType.Item:
                return { ...parsed, targetType: invite.TargetType, vault: null };
            default:
                return null;
        }
    } catch (err) {
        logger.warn(`[Invite::Group] Could not decrypt invite`, err);
        return null;
    }
};
