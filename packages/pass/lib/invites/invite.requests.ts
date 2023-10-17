import { c } from 'ttag';

import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { type PendingInvite } from '@proton/pass/types/data/invites';
import type {
    InviteAcceptIntent,
    InviteCreateIntent,
    InviteRejectIntent,
    InviteRemoveIntent,
    InviteResendIntent,
} from '@proton/pass/types/data/invites.dto';

import { getPrimaryPublicKeyForEmail, getPublicKeysForEmail } from '../auth/address';

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
        data: await (async () => {
            try {
                return await PassCrypto.createVaultInvite({
                    shareId,
                    email,
                    role,
                    invitedPublicKey: await getPrimaryPublicKeyForEmail(email),
                });
            } catch {
                throw new Error(c('Error').t`Cannot send invitation to this address at the moment`);
            }
        })(),
    });

export const resendInvite = async ({ shareId, inviteId }: InviteResendIntent) =>
    api({ url: `pass/v1/share/${shareId}/invite/${inviteId}/reminder`, method: 'post' });

export const removeInvite = async ({ shareId, inviteId }: InviteRemoveIntent) =>
    api({ url: `pass/v1/share/${shareId}/invite/${inviteId}`, method: 'delete' });

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
