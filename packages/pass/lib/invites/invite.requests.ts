import { MAX_BATCH_ADDRESS_REQUEST, MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { getPublicKeysForEmail } from '@proton/pass/lib/auth/address';
import { PassCrypto } from '@proton/pass/lib/crypto';
import type { NewUserPendingInvite, PendingInvite } from '@proton/pass/types/data/invites';
import type {
    InviteAcceptIntent,
    InviteNewUserDTO,
    InviteRecommendationsIntent,
    InviteRejectIntent,
    InviteRemoveIntent,
    InviteResendIntent,
    InviteUserDTO,
    NewUserInvitePromoteIntent,
    NewUserInviteRemoveIntent,
} from '@proton/pass/types/data/invites.dto';
import { prop } from '@proton/pass/utils/fp/lens';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import chunk from '@proton/utils/chunk';

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

const limitExceededCatch =
    <T>(catchFn: () => T) =>
    (error: unknown) => {
        const { code } = getApiError(error);
        if (code === PassErrorCode.RESOURCE_LIMIT_EXCEEDED) throw error;
        else return catchFn();
    };

/** Returns the list of emails which could not be invited successfully  */
export const createUserInvites = async (shareId: string, users: InviteUserDTO[]): Promise<string[]> =>
    (
        await Promise.all(
            chunk(users, MAX_BATCH_PER_REQUEST).map(async (batch) =>
                api({
                    url: `pass/v1/share/${shareId}/invite/batch`,
                    method: 'post',
                    data: {
                        Invites: await Promise.all(
                            batch.map(({ email, role, publicKey }) =>
                                PassCrypto.createVaultInvite({ shareId, email, role, invitedPublicKey: publicKey })
                            )
                        ),
                    },
                })
                    .then<string[]>(() => [])
                    .catch(limitExceededCatch(() => batch.map(prop('email'))))
            )
        )
    ).flat();

export const createNewUserInvites = async (shareId: string, newUsers: InviteNewUserDTO[]) =>
    (
        await Promise.all(
            chunk(newUsers, MAX_BATCH_PER_REQUEST).map(async (batch) =>
                api({
                    url: `pass/v1/share/${shareId}/invite/new_user/batch`,
                    method: 'post',
                    data: {
                        NewUserInvites: await Promise.all(
                            batch.map(({ email, role }) =>
                                PassCrypto.createNewUserVaultInvite({ email, role, shareId })
                            )
                        ),
                    },
                })
                    .then<string[]>(() => [])
                    .catch(limitExceededCatch(() => batch.map(prop('email'))))
            )
        )
    ).flat();

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

export const resendInvite = async ({ shareId, inviteId }: InviteResendIntent) =>
    api({
        url: `pass/v1/share/${shareId}/invite/${inviteId}/reminder`,
        method: 'post',
    });

export const removeInvite = async ({ shareId, inviteId }: InviteRemoveIntent) =>
    api({
        url: `pass/v1/share/${shareId}/invite/${inviteId}`,
        method: 'delete',
    });

export const removeNewUserInvite = async ({ shareId, newUserInviteId }: NewUserInviteRemoveIntent) =>
    api({
        url: `pass/v1/share/${shareId}/invite/new_user/${newUserInviteId}`,
        method: 'delete',
    });

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

export const getInviteRecommendations = async (
    { shareId, pageSize, since, startsWith }: InviteRecommendationsIntent,
    signal?: AbortSignal
) => {
    return (
        await api({
            url: `pass/v1/share/${shareId}/invite/recommended_emails`,
            params: {
                PlanPageSize: pageSize,
                StartsWith: startsWith?.toLowerCase(),
                ...(since ? { PlanSince: since } : {}),
            },
            method: 'get',
            signal: signal,
        })
    ).Recommendation!;
};

/** Check if an address can be invited - returns allowed addresses */
export const checkInviteAddresses = async (shareId: string, emails: string[]) =>
    (
        await Promise.all(
            chunk(emails, MAX_BATCH_ADDRESS_REQUEST).map(async (batch) => {
                try {
                    const result: { Code: number; Emails: string[] } = await api({
                        url: `pass/v1/share/${shareId}/invite/check_address`,
                        method: 'post',
                        data: { Emails: batch },
                    });
                    return result.Emails;
                } catch {
                    return [];
                }
            })
        )
    ).flat();
