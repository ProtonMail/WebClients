import type { ShareItem } from '@proton/pass/store/reducers';
import type { Share, ShareGetResponse } from '@proton/pass/types';
import { ShareFlags, ShareRole, ShareType } from '@proton/pass/types';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

/* overload for subtypes */
export function isVaultShare(share: ShareItem): share is ShareItem<ShareType.Vault>;
export function isVaultShare(share: Share): share is Share<ShareType.Vault> {
    return share.targetType === ShareType.Vault;
}

export function isItemShare(share: Share): share is Share<ShareType.Item> {
    return share.targetType === ShareType.Item;
}

export const isShareManageable = <T extends Share>(share: T) => share.owner || share.shareRoleId === ShareRole.MANAGER;
export const isShareWritable = <T extends Share>({ shareRoleId }: T) => shareRoleId !== ShareRole.READ;
export const isShareReadOnly = <T extends Share>({ shareRoleId }: T) => shareRoleId === ShareRole.READ;
export const isShareVisible = <T extends Share>(share: T) => !hasBit(share.flags, ShareFlags.HIDDEN);

/** If the `canAutofill` flag isis not present on the share item, fallback to client
 * side downgrade detection : only allow autofilling from writable shares. */
export const isAutofillableShare = <T extends Share>(share: T, writableOnly: boolean) => {
    if (typeof share.canAutofill === 'boolean') return share.canAutofill;
    if (writableOnly) return isShareWritable(share);
    return true;
};

/** These share property changes are not reflected in the
 * share events endpoint. As such, compare manually when
 * polling for all shares to detect potential updates.
 * Keep inline with `ShareSyncKeys` */
export const hasShareChanged = (current: Share, incoming: ShareGetResponse) =>
    current.owner !== incoming.Owner ||
    current.shareRoleId !== incoming.ShareRoleID ||
    current.shared !== incoming.Shared ||
    current.targetMembers !== incoming.TargetMembers ||
    current.newUserInvitesReady !== incoming.NewUserInvitesReady ||
    current.targetMaxMembers !== incoming.TargetMaxMembers ||
    current.canAutofill !== incoming.CanAutoFill;
