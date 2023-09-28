import { type PendingInvite } from '@proton/pass/types/data/invites';

import { api } from '../../../api';
import { PassCrypto } from '../../../crypto';
import type { VaultInviteCreateRequest } from '../../../types';
import { getPrimaryPublicKeyForEmail } from './address';

export const createVaultInvite = async ({ shareId, email, role }: VaultInviteCreateRequest) =>
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

export const loadPendingShareInvites = async (shareId: string): Promise<PendingInvite[]> => {
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
