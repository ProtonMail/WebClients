import { PassCrypto } from '@proton/pass/crypto';
import type { ShareItem } from '@proton/pass/store';
import type { Share, ShareGetResponse, VaultShareContent } from '@proton/pass/types';
import { ShareRole, ShareType } from '@proton/pass/types';

export const getShareName = (share: Share): string => {
    switch (share.targetType) {
        case ShareType.Vault:
            const content = share.content as VaultShareContent;
            return content.name;
        case ShareType.Item:
        default:
            return 'Not defined yet';
    }
};

/* overload for subtypes */
export function isVaultShare(share: ShareItem): share is ShareItem<ShareType.Vault>;
export function isVaultShare(share: Share): share is Share<ShareType.Vault> {
    return share.targetType === ShareType.Vault;
}

export const isShareManageable = <T extends Share>(share: T) => share.owner || share.shareRoleId === ShareRole.ADMIN;

export const isActiveVault = <T extends Share>({ targetType, shareId }: T) =>
    targetType === ShareType.Vault && PassCrypto.canOpenShare(shareId);

export const isPrimaryVault = <T extends Share>({ targetType, primary }: T) =>
    targetType === ShareType.Vault && primary;

export const isWritableVault = <T extends Share>({ targetType, shareRoleId }: T) =>
    targetType === ShareType.Vault && shareRoleId !== ShareRole.READ;

export const isOwnVault = <T extends Share>({ targetType, owner }: T) => targetType === ShareType.Vault && owner;

export const hasShareAccessChanged = (current: Share, incoming: ShareGetResponse) =>
    current.owner !== incoming.Owner ||
    current.shareRoleId !== incoming.ShareRoleID ||
    current.shared !== incoming.Shared ||
    current.targetMembers !== incoming.TargetMembers;
