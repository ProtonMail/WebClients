import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { isClonableItem, isItemShared, isMonitored, isPinned, isTrashed } from '@proton/pass/lib/items/item.predicates';
import { isShareManageable, isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { itemPinRequest, itemUnpinRequest } from '@proton/pass/store/actions/requests';
import type { ShareItem } from '@proton/pass/store/reducers';
import { selectAllVaults, selectPassPlan, selectRequestInFlight } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';
import { BitField, ShareRole } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';

export type ItemState = {
    canClone: boolean;
    canHistory: boolean;
    canItemShare: boolean;
    canLeave: boolean;
    canLinkShare: boolean;
    canManage: boolean;
    canManageAccess: boolean;
    canMonitor: boolean;
    canMove: boolean;
    canShare: boolean;
    canTogglePinned: boolean;

    isFree: boolean;
    isItemShared: boolean;
    isReadOnly: boolean;
    isShared: boolean;
    isTrashed: boolean;
    isPinned: boolean;
    isMonitored: boolean;
};

type UseItemState = (item: ItemRevision, share: ShareItem) => ItemState;

export const useItemState: UseItemState = (item, share) => {
    const { shareId, itemId, data } = item;
    const { shareRoleId, owner } = share;

    const plan = useSelector(selectPassPlan);
    const vaults = useSelector(selectAllVaults);
    const pinInFlight = useSelector(selectRequestInFlight(itemPinRequest(shareId, itemId)));
    const unpinInFlight = useSelector(selectRequestInFlight(itemUnpinRequest(shareId, itemId)));
    const org = useOrganization();
    const cloneFeatureFlag = useFeatureFlag(PassFeature.PassItemCloning);

    return useMemo(() => {
        const itemShared = isItemShared(item);
        /** Item is considered shared if either the revision
         * or the share are flagged as being shared. */
        const shared = itemShared || share.shared;
        const free = plan === UserPassPlan.FREE;
        const readOnly = shareRoleId === ShareRole.READ;
        const isVault = isVaultShare(share);
        const hasMultipleVaults = vaults.length > 1;
        const trashed = isTrashed(item);
        const pinned = isPinned(item);
        const orgItemSharingDisabled = org?.settings.ItemShareMode === BitField.DISABLED;
        const monitored = isMonitored(item);

        const canManage = isShareManageable(share);
        const canClone = cloneFeatureFlag && canManage && isClonableItem(free)(item);
        const canHistory = isPaidPlan(plan);
        const canMove = (!shared || !readOnly) && hasMultipleVaults;
        const canShare = canManage && item.data.type !== 'alias';
        const canLinkShare = canShare;
        const canItemShare = canShare && !orgItemSharingDisabled;
        const canManageAccess = shared && !readOnly;
        const canLeave = !isVault && !owner;
        const canMonitor = !EXTENSION_BUILD && !trashed && data.type === 'login' && !readOnly;
        const canTogglePinned = !(pinInFlight || unpinInFlight);

        return {
            canClone,
            canHistory,
            canItemShare,
            canLeave,
            canLinkShare,
            canManage,
            canManageAccess,
            canMonitor,
            canMove,
            canShare,
            canTogglePinned,

            isFree: free,
            isItemShared: itemShared,
            isReadOnly: readOnly,
            isShared: shared,
            isTrashed: trashed,
            isPinned: pinned,
            isMonitored: monitored,
        };
    }, [item, share, plan, vaults, pinInFlight, unpinInFlight, org]);
};
