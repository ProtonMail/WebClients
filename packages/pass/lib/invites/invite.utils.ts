import { c, msgid } from 'ttag';

import { isItemTarget } from '@proton/pass/lib/access/access.predicates';
import { AccessTarget } from '@proton/pass/lib/access/types';
import type {
    GroupInviteListItemResponse,
    InviteDataForUser,
    InviteVaultDataForUser,
    Maybe,
    MaybeNull,
    NewUserPendingInvite,
    Share,
} from '@proton/pass/types';
import { type InviteBase, NewUserInviteState, type Result, ShareType } from '@proton/pass/types';
import { and } from '@proton/pass/utils/fp/predicates';

export type InviteBatchResult = Result<{}, { failed: string[] }>;
export type AbstractInvite = InviteDataForUser | GroupInviteListItemResponse;

export const isTargetInvite = (targetId: string) => (invite: InviteBase) => invite.targetId === targetId;
export const isItemInviteForItem = (itemId: string) => and(isItemTarget, isTargetInvite(itemId));
export const isInviteReady = (invite: NewUserPendingInvite) => invite.state === NewUserInviteState.READY;

/** Guards that the invite targets a vault and has vault data */
export const isVaultInvite = <T extends AbstractInvite>(
    invite: T
): invite is T & { VaultData: InviteVaultDataForUser } =>
    Boolean(invite.TargetType === ShareType.Vault && invite.VaultData);

/** Checks if an invite targets a vault the user already owns. Filtering
 * is necessary because there might be a slight delay between invite
 * acceptance and database replication, potentially causing accepted
 * invites to still appear in the results. This check is limited to vault
 * invites because item `TargetID`s only contain the ItemID and could
 * collide across shards. */
export const isAcceptedInvite =
    (vaultIDs: Set<string>) =>
    (invite: AbstractInvite): boolean =>
        isVaultInvite(invite) && vaultIDs.has(invite.TargetID);

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

export const isGroupInvite = (invite: Maybe<MaybeNull<InviteBase>>): invite is InviteBase =>
    invite?.invitedGroupId !== undefined && invite.invitedGroupId !== null;
