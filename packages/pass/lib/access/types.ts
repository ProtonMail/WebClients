import type { NewUserPendingInvite, PendingInvite, SelectedShare, ShareMember } from '@proton/pass/types';

/** Passing an `itemId` means operating on an item's access state,
 * regardless of whether access is via vault or item share */
export type AccessKeys = SelectedShare & { itemId?: string };
export type AccessDTO = AccessKeys & { target: AccessTarget };

/** Represents the actual target of an `AccessDTO` operation.
 * Distinct from `ShareType` to prevent confusion - e.g., we may
 * target a vault through an item's access context. Used for
 * revalidation to get fresh sharing data: for vault targets
 * we fetch the underlying share state, for item targets we
 * should fetch the item's updated sharing state */
export enum AccessTarget {
    Vault,
    Item,
}

export type AccessItem = {
    invites: PendingInvite[];
    newUserInvites: NewUserPendingInvite[];
    members: ShareMember[];
};
