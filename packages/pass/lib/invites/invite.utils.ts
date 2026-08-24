import { c, msgid } from 'ttag';

import type {
    AbstractInviteResponse,
    GroupInvite,
    GroupOwnerInvite,
    InviteVaultDataForUser,
    MaybeNull,
    NewUserPendingInvite,
    Share,
} from '../../types';
import { type InviteBase, InviteType, NewUserInviteState, type Result, ShareType } from '../../types';
import { partition } from '../../utils/array/partition';
import { and } from '../../utils/fp/predicates';
import { isItemTarget } from '../access/access.predicates';
import { AccessTarget } from '../access/types';

export type InviteBatchResult = Result<{}, { failed: string[] }>;

export const isTargetInvite = (targetId: string) => (invite: InviteBase) => invite.targetId === targetId;
export const isItemInviteForItem = (itemId: string) => and(isItemTarget, isTargetInvite(itemId));
export const isInviteReady = (invite: NewUserPendingInvite) => invite.state === NewUserInviteState.READY;

/** Guards that the invite targets a vault and has vault data */
export const isVaultInviteResponse = <T extends AbstractInviteResponse>(
    invite: T
): invite is T & { VaultData: InviteVaultDataForUser } =>
    Boolean(invite.TargetType === ShareType.Vault && invite.VaultData);

export const isGroupInvite = (invite?: MaybeNull<InviteBase>): invite is GroupInvite => Boolean(invite?.invitedGroupId);

export const partitionGroupInvites = (invites: GroupInvite[]) =>
    partition(invites, (invite): invite is GroupOwnerInvite => invite.type === InviteType.GroupOwner);

export const concatInviteResults = (results: InviteBatchResult[]): InviteBatchResult =>
    results.reduce(
        (acc, result) => {
            if (result.ok) return acc;
            else {
                return {
                    ok: false,
                    failed: acc.ok ? result.failed : acc.failed.concat(result.failed),
                    error: acc.ok
                        ? result.error
                        : (() => {
                              if (!acc.error) return result.error;
                              if (!result.error) return acc.error;
                              return acc.error.includes(result.error)
                                  ? acc.error
                                  : acc.error.concat(`. ${result.error}`);
                          })(),
                };
            }
        },
        { ok: true }
    );

export const getLimitReachedText = (share: Share, target: AccessTarget) => {
    switch (target) {
        case AccessTarget.Vault: {
            const { targetMaxMembers } = share;
            // translator: full message is "Vaults can’t contain more than 10 users.""
            return c('Success').ngettext(
                msgid`Vaults can’t contain more than ${targetMaxMembers} user.`,
                `Vaults can’t contain more than ${targetMaxMembers} users.`,
                targetMaxMembers
            );
        }

        case AccessTarget.Item: {
            // translator: full message is "Items can’t contain more than 10 users.""
            return c('Success').ngettext(
                msgid`Items can’t contain more than ${share.targetMaxMembers} user.`,
                `Items can’t contain more than ${share.targetMaxMembers} users.`,
                share.targetMaxMembers
            );
        }
    }
};
