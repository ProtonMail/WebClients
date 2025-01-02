import type { ShareItem } from '@proton/pass/store/reducers';
import type { Share, ShareGetResponse } from '@proton/pass/types';
import { ShareRole, ShareType } from '@proton/pass/types';

/* overload for subtypes */
export function isVaultShare(share: ShareItem): share is ShareItem<ShareType.Vault>;
export function isVaultShare(share: Share): share is Share<ShareType.Vault> {
    return share.targetType === ShareType.Vault;
}

export function isItemShare(share: Share): share is Share<ShareType.Item> {
    return share.targetType === ShareType.Item;
}

export const isShareManageable = <T extends Share>(share: T) => share.owner || share.shareRoleId === ShareRole.ADMIN;

export const hasShareAccessChanged = (current: Share, incoming: ShareGetResponse) =>
    current.owner !== incoming.Owner ||
    current.shareRoleId !== incoming.ShareRoleID ||
    current.shared !== incoming.Shared ||
    current.targetMembers !== incoming.TargetMembers ||
    current.newUserInvitesReady !== incoming.NewUserInvitesReady ||
    current.targetMaxMembers !== incoming.TargetMaxMembers;
