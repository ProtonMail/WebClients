import { c } from 'ttag';

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import chunk from '@proton/utils/chunk';

import { MIN_MAX_BATCH_PER_REQUEST } from '../../constants';
import { type InviteTargetKey, type KeyRotationKeyPair, ShareType } from '../../types';
import type { GroupInvite, Invite, NewUserPendingInvite, PendingInvite, UserInvite } from '../../types/data/invites';
import type {
    GroupInviteAcceptIntent,
    InviteAcceptIntent,
    InviteNewUserDTO,
    InviteRecommendationsIntent,
    InviteRecommendationsOrganizationIntent,
    InviteRecommendationsSuggestedIntent,
    InviteRejectIntent,
    InviteRemoveIntent,
    InviteResendIntent,
    InviteUserDTO,
    NewUserInvitePromoteIntent,
    NewUserInviteRemoveIntent,
} from '../../types/data/invites.dto';
import type { Maybe } from '../../types/utils';
import { getErrorMessage } from '../../utils/errors/get-error-message';
import { prop } from '../../utils/fp/lens';
import { truthy } from '../../utils/fp/predicates';
import { api } from '../api/api';
import { PassErrorCode } from '../api/errors';
import { getPublicKeysForEmail } from '../auth/address';
import { PassCrypto } from '../crypto';
import { getItemKeys } from '../items/item.requests';
import { getOrganizationKey } from '../organization/organization.requests';
import { parseGroupInvite, parseUserInvite } from './invite.parser';
import type { InviteBatchResult } from './invite.utils';

export type InviteData = { invites: PendingInvite[]; newUserInvites: NewUserPendingInvite[] };

export const getUserInvitesQuery = () => ({ url: `pass/v1/invite`, method: 'get' }) as const;
export const getUserInvites = () => api(getUserInvitesQuery());
export const getGroupInvitesQuery = () => ({ url: `pass/v1/invite/group`, method: 'get' }) as const;
export const getGroupInvites = () => api(getGroupInvitesQuery());

/** Retrieves all user invites */
export const resolveUserInvites = async (): Promise<UserInvite[]> => {
    const { Invites } = await getUserInvites();
    const userInvites = await Promise.all(Invites.map(parseUserInvite));
    return userInvites.filter(truthy);
};

/** Retrieves all group invites */
export const resolveGroupInvites = async (): Promise<GroupInvite[]> => {
    const { Invites } = (await getGroupInvites()).Invites;
    const groupInvites = await Promise.all(Invites.map(parseGroupInvite));
    return groupInvites.filter(truthy);
};

/** Retrieves all invites (user + groups), filters accepted, and parses */
export const allInvites = async (resolveGroups: boolean): Promise<Invite[]> => {
    const userInvites: Invite[] = await resolveUserInvites();
    const groupInvites = resolveGroups ? await resolveGroupInvites() : [];
    return userInvites.concat(groupInvites);
};

export const loadInvites = async (shareId: string): Promise<InviteData> => {
    const { Invites, NewUserInvites } = await api({
        url: `pass/v1/share/${shareId}/invite`,
        method: 'get',
    });

    return {
        invites: Invites.map((invite): PendingInvite => ({
            inviteId: invite.InviteID,
            targetId: invite.TargetID,
            targetType: invite.TargetType,
            invitedEmail: invite.InvitedEmail,
            invitedGroupId: null,
            inviterEmail: invite.InviterEmail,
            remindersSent: invite.RemindersSent,
            createTime: invite.CreateTime,
            modifyTime: invite.ModifyTime,
        })),
        newUserInvites: NewUserInvites.map((invite): NewUserPendingInvite => ({
            newUserInviteId: invite.NewUserInviteID!,
            targetId: invite.TargetID!,
            targetType: invite.TargetType!,
            invitedEmail: invite.InvitedEmail!,
            invitedGroupId: null,
            inviterEmail: invite.InviterEmail!,
            createTime: invite.CreateTime!,
            signature: invite.Signature!,
            state: invite.State!,
        })),
    };
};

const getInviteErrorMessage = (error: unknown, b2b: boolean): string => {
    if (b2b && getApiError(error).code === PassErrorCode.RESOURCE_LIMIT_EXCEEDED) {
        return c('Warning').t`Please contact us to investigate the issue`;
    }

    return getErrorMessage(error);
};

/** Returns the list of emails which could not be invited successfully  */
export const createUserInvites = async (
    shareId: string,
    itemId: Maybe<string>,
    users: InviteUserDTO[],
    b2b: boolean
): Promise<InviteBatchResult[]> => {
    const manager = PassCrypto.getShareManager(shareId);

    const targetKeys = await (async (): Promise<InviteTargetKey[]> => {
        /** If no `itemId` is supplied then we're dealing with
         * a vault invite -> encrypt the vault keys. */
        if (!itemId) return manager.getVaultShareKeys();

        /** For item sharing : encrypt the items keys */
        switch (manager.getShare().targetType) {
            case ShareType.Item:
                return manager.getItemShareKeys();
            case ShareType.Vault:
                const encryptedItemKeys = (await getItemKeys(shareId, itemId)) || [];
                return Promise.all(
                    encryptedItemKeys.map((key) =>
                        PassCrypto.openItemKey({
                            encryptedItemKey: key,
                            shareId,
                        })
                    )
                );
        }
    })();

    return Promise.all(
        chunk(users, MIN_MAX_BATCH_PER_REQUEST).map(async (batch): Promise<InviteBatchResult> =>
            api({
                url: `pass/v1/share/${shareId}/invite/batch`,
                method: 'post',
                data: {
                    Invites: await Promise.all(
                        batch.map(({ email, role, publicKey }) =>
                            PassCrypto.createInvite({
                                shareId,
                                email,
                                role,
                                invitedPublicKey: publicKey,
                                itemId,
                                targetKeys,
                            })
                        )
                    ),
                },
            })
                .then<InviteBatchResult>(() => ({ ok: true }))
                .catch((err): InviteBatchResult => ({
                    ok: false,
                    failed: batch.map(prop('email')),
                    error: getInviteErrorMessage(err, b2b),
                }))
        )
    );
};

export const createNewUserInvites = async (
    shareId: string,
    itemId: Maybe<string>,
    newUsers: InviteNewUserDTO[],
    b2b: boolean
): Promise<InviteBatchResult[]> =>
    Promise.all(
        chunk(newUsers, MIN_MAX_BATCH_PER_REQUEST).map(async (batch): Promise<InviteBatchResult> =>
            api({
                url: `pass/v1/share/${shareId}/invite/new_user/batch`,
                method: 'post',
                data: {
                    NewUserInvites: await Promise.all(
                        batch.map(({ email, role }) =>
                            PassCrypto.createNewUserInvite({
                                email,
                                role,
                                shareId,
                                itemId,
                            })
                        )
                    ),
                },
            })
                .then<InviteBatchResult>(() => ({ ok: true }))
                .catch((err): InviteBatchResult => ({
                    ok: false,
                    failed: batch.map(prop('email')),
                    error: getInviteErrorMessage(err, b2b),
                }))
        )
    );

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

export const acceptInvite = async (
    { inviteToken, inviterEmail, invitedAddressId }: InviteAcceptIntent,
    inviteKeys: KeyRotationKeyPair[]
) => {
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

export const acceptGroupInvite = async (
    { inviteToken, inviterEmail }: GroupInviteAcceptIntent,
    groupId: string,
    inviteKeys: KeyRotationKeyPair[],
    fetchOrganizationKey: boolean
) => {
    return api({
        url: `pass/v1/invite/group/${inviteToken}`,
        method: 'post',
        data: await PassCrypto.acceptGroupVaultInvite({
            organizationKey: fetchOrganizationKey ? await getOrganizationKey() : null,
            groupId,
            inviteKeys,
            inviterPublicKeys: await getPublicKeysForEmail(inviterEmail),
        }),
    });
};

export const rejectInvite = async ({ inviteToken }: InviteRejectIntent) =>
    api({
        url: `pass/v1/invite/${inviteToken}`,
        method: 'delete',
    });

export const rejectGroupInvite = async ({ inviteToken }: InviteRejectIntent) =>
    api({
        url: `pass/v1/invite/group/${inviteToken}`,
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
                StartsWith: startsWith,
                ...(since ? { PlanSince: since } : {}),
            },
            method: 'get',
            signal: signal,
        })
    ).Recommendation!;
};

export const getInviteRecommendationsSuggested = async (
    { shareId, startsWith }: InviteRecommendationsSuggestedIntent,
    signal?: AbortSignal
) => {
    return api({
        url: `pass/v1/share/${shareId}/invite/recommended_emails/suggested`,
        params: { Contains: startsWith },
        method: 'get',
        signal: signal,
    });
};

export const getInviteRecommendationsOrganization = async (
    { shareId, pageSize, since, startsWith }: InviteRecommendationsOrganizationIntent,
    signal?: AbortSignal
) => {
    return (
        await api({
            url: `pass/v1/share/${shareId}/invite/recommended_emails/organization`,
            params: { PlanPageSize: pageSize, Contains: startsWith, ...(since ? { PlanSince: since } : {}) },
            method: 'get',
            signal: signal,
        })
    ).Recommendation!;
};

/** Check if an address can be invited - returns allowed addresses */
export const checkInviteAddresses = async (shareId: string, emails: string[]) =>
    (
        await Promise.all(
            chunk(emails, MIN_MAX_BATCH_PER_REQUEST).map(async (batch) => {
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
