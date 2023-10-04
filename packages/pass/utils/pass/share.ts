import type { Share, ShareGetResponse, VaultShare, VaultShareContent } from '@proton/pass/types';
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

export const isVaultShare = (share: Share): share is VaultShare => share.targetType === ShareType.Vault;

export const isShareManageable = (share: Share) => share.owner || share.shareRoleId === ShareRole.ADMIN;

export const hasShareAccessChanged = (current: Share, incoming: ShareGetResponse) =>
    current.owner !== incoming.Owner ||
    current.shareRoleId !== incoming.ShareRoleID ||
    current.shared !== incoming.Shared ||
    current.targetMembers !== incoming.TargetMembers;
