import type { Share, VaultShare, VaultShareContent } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';

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
