import { c } from 'ttag';

import { type PendingInvite } from '@proton/pass/types/data/invites';
import { getPublicKeys } from '@proton/shared/lib/api/keys';

import { api } from '../../../api';
import { PassCrypto } from '../../../crypto';
import type { PublicKeysResponse, VaultInviteCreateRequest } from '../../../types';

export const createVaultInvite = async ({ shareId, email, role }: VaultInviteCreateRequest) => {
    const inviteeKeys = await api<PublicKeysResponse>(getPublicKeys({ Email: email }));
    const publicKey = inviteeKeys.Keys[0]?.PublicKey;
    if (!publicKey) throw new Error(c(`Error`).t`Could not resolve recipient's address key`);

    return api({
        url: `pass/v1/share/${shareId}/invite`,
        method: 'post',
        data: await PassCrypto.createVaultInvite({ shareId, email, role, inviteePublicKey: publicKey }),
    });
};

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
