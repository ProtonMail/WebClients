import { isItemTarget } from '@proton/pass/lib/access/access.predicates';
import type { NewUserPendingInvite } from '@proton/pass/types';
import { type InviteBase, NewUserInviteState, type Result } from '@proton/pass/types';
import { and } from '@proton/pass/utils/fp/predicates';

export const isTargetInvite = (targetId: string) => (invite: InviteBase) => invite.targetId === targetId;
export const isItemInviteForItem = (itemId: string) => and(isItemTarget, isTargetInvite(itemId));
export const isInviteReady = (invite: NewUserPendingInvite) => invite.state === NewUserInviteState.READY;

export type InviteBatchResult = Result<{}, { failed: string[] }>;

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
