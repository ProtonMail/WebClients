import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto';
import type { NewUserPendingInvite, PendingInvite } from '@proton/pass/types/data/invites';
import type {
    InviteAcceptIntent,
    InviteCreateIntent,
    InviteRejectIntent,
    InviteRemoveIntent,
    InviteResendIntent,
    NewUserInvitePromoteIntent,
    NewUserInviteRemoveIntent,
} from '@proton/pass/types/data/invites.dto';

import { getPublicKeysForEmail } from '../auth/address';

export type InviteData = { invites: PendingInvite[]; newUserInvites: NewUserPendingInvite[] };

export const loadInvites = async (shareId: string): Promise<InviteData> => {
    const { Invites, NewUserInvites } = await api({
        url: `pass/v1/share/${shareId}/invite`,
        method: 'get',
    });

    return {
        invites: Invites.map(
            (invite): PendingInvite => ({
                inviteId: invite.InviteID,
                targetId: invite.TargetID,
                targetType: invite.TargetType,
                invitedEmail: invite.InvitedEmail,
                inviterEmail: invite.InviterEmail,
                remindersSent: invite.RemindersSent,
                createTime: invite.CreateTime,
                modifyTime: invite.ModifyTime,
            })
        ),
        newUserInvites: NewUserInvites.map(
            (invite): NewUserPendingInvite => ({
                newUserInviteId: invite.NewUserInviteID!,
                targetId: invite.TargetID!,
                targetType: invite.TargetType!,
                invitedEmail: invite.InvitedEmail!,
                inviterEmail: invite.InviterEmail!,
                createTime: invite.CreateTime!,
                signature: invite.Signature!,
                state: invite.State!,
            })
        ),
    };
};

export const createInvite = async ({
    email,
    invitedPublicKey,
    role,
    shareId,
}: InviteCreateIntent & { invitedPublicKey: string }) =>
    api({
        url: `pass/v1/share/${shareId}/invite`,
        method: 'post',
        data: await PassCrypto.createVaultInvite({ shareId, email, role, invitedPublicKey }),
    });

export const promoteInvite = async ({
    invitedPublicKey,
    newUserInviteId,
    shareId,
}: NewUserInvitePromoteIntent & { invitedPublicKey: string }) =>
    api({
        url: `pass/v1/share/${shareId}/invite/new_user/${newUserInviteId}/keys`,
        method: 'post',
        data: await PassCrypto.promoteInvite({ shareId, invitedPublicKey }),
    });

export const createNewUserInvite = async ({ email, role, shareId }: InviteCreateIntent) =>
    api({
        url: `pass/v1/share/${shareId}/invite/new_user`,
        method: 'post',
        data: await PassCrypto.createNewUserVaultInvite({ email, role, shareId }),
    });

export const resendInvite = async ({ shareId, inviteId }: InviteResendIntent) =>
    api({ url: `pass/v1/share/${shareId}/invite/${inviteId}/reminder`, method: 'post' });

export const removeInvite = async ({ shareId, inviteId }: InviteRemoveIntent) =>
    api({ url: `pass/v1/share/${shareId}/invite/${inviteId}`, method: 'delete' });

export const removeNewUserInvite = async ({ shareId, newUserInviteId }: NewUserInviteRemoveIntent) =>
    api({ url: `pass/v1/share/${shareId}/invite/new_user/${newUserInviteId}`, method: 'delete' });

export const acceptInvite = async ({ inviteToken, inviterEmail, invitedAddressId, inviteKeys }: InviteAcceptIntent) => {
    return (
        await api({
            url: `pass/v1/invite/${inviteToken}`,
            method: 'post',
            data: await PassCrypto.acceptVaultInvite({
                invitedAddressId,
                inviteKeys,
                inviterPublicKeys: await getPublicKeysForEmail(inviterEmail),
            }),
        })
    ).Share!;
};

export const rejectInvite = async ({ inviteToken }: InviteRejectIntent) =>
    api({
        url: `pass/v1/invite/${inviteToken}`,
        method: 'delete',
    });
