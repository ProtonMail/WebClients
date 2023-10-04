import { type PendingInvite } from '@proton/pass/types/data/invites';
import type { InviteAcceptIntent, InviteCreateIntent, InviteResendIntent } from '@proton/pass/types/data/invites.dto';

import { api } from '../../../api';
import { PassCrypto } from '../../../crypto';
import { getPrimaryPublicKeyForEmail, getPublicKeysForEmail } from './address';

export const loadInvites = async (shareId: string): Promise<PendingInvite[]> => {
    const { Invites } = await api({
        url: `pass/v1/share/${shareId}/invite`,
        method: 'get',
    });

    return Invites.map((invite) => ({
        inviteId: invite.InviteID,
        targetId: invite.TargetID,
        targetType: invite.TargetType,
        invitedEmail: invite.InvitedEmail,
        inviterEmail: invite.InviterEmail,
        remindersSent: invite.RemindersSent,
        createTime: invite.CreateTime,
        modifyTime: invite.ModifyTime,
    }));
};

export const createInvite = async ({ shareId, email, role }: InviteCreateIntent) =>
    api({
        url: `pass/v1/share/${shareId}/invite`,
        method: 'post',
        data: await PassCrypto.createVaultInvite({
            shareId,
            email,
            role,
            inviteePublicKey: await getPrimaryPublicKeyForEmail(email),
        }),
    });

export const resendInvite = async ({ shareId, inviteId }: InviteResendIntent) =>
    api({ url: `pass/v1/share/${shareId}/invite/${inviteId}/reminder`, method: 'post' });

export const acceptInvite = async ({ inviteToken, inviterEmail, inviteKeys }: InviteAcceptIntent) => {
    return (
        await api({
            url: `pass/v1/invite/${inviteToken}`,
            method: 'post',
            data: await PassCrypto.acceptVaultInvite({
                inviteKeys,
                inviterPublicKeys: await getPublicKeysForEmail(inviterEmail),
            }),
        })
    ).Share!;
};
