import { isShareVisible } from '@proton/pass/lib/shares/share.predicates';
import type { Share, ShareVisibilityMap, VaultShareContent } from '@proton/pass/types';
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

export const intoShareVisibilityMap = (shares: Share[]): ShareVisibilityMap =>
    Object.fromEntries(shares.map((share) => [share.shareId, isShareVisible(share)]));
