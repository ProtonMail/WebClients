import type { Share, ShareVisibilityMap, VaultShareContent } from '../../types';
import { ShareType } from '../../types';
import { isShareVisible } from './share.predicates';

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
