import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { VaultSelectMode } from '@proton/pass/components/Vault/VaultSelect';
import { useItemNavigation } from '@proton/pass/hooks/items/useItemNavigation';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { isClonableItem, isItemShared, isMonitored, isTrashed } from '@proton/pass/lib/items/item.predicates';
import { getItemEntityID } from '@proton/pass/lib/items/item.utils';
import { isShareManageable, isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import {
    itemCreate,
    itemCreateDismiss,
    itemEdit,
    itemEditDismiss,
    itemPinIntent,
    itemUnpinIntent,
    setItemFlags,
} from '@proton/pass/store/actions';
import { itemPinRequest, itemUnpinRequest } from '@proton/pass/store/actions/requests';
import type { ShareItem } from '@proton/pass/store/reducers';
import {
    selectAllVaults,
    selectOptimisticFailedAction,
    selectPassPlan,
    selectRequestInFlight,
} from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';
import { BitField, ShareRole } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';

type ItemState = {
    isShared: boolean;
    isItemShared: boolean;
    isFree: boolean;
    isReadOnly: boolean;
    isTrashed: boolean;

    canHistory: boolean;
    canMove: boolean;
    canManage: boolean;
    canShare: boolean;
    canLinkShare: boolean;
    canItemShare: boolean;
    canManageAccess: boolean;
    canLeave: boolean;
    canMonitor: boolean;
    canClone: boolean;
    canTogglePinned: boolean;
};

type ItemActions = {
    onClone: () => void;
    onDelete: () => void;
    onEdit: () => void;
    onHistory: () => void;
    onManage: () => void;
    onLeave: () => void;
    onMove: () => void;
    onRetry: () => void;
    onRestore: () => void;
    onShare: () => void;
    onTrash: () => void;
    onDismiss: () => void;
    onPin: () => void;
    onToggleFlags: () => void;
};

export type ItemStateAndActions = { state: ItemState; actions: ItemActions };
type UseItemActions = (item: ItemRevision, share: ShareItem) => ItemStateAndActions;

export const useItemActions: UseItemActions = (item, share) => {
    const dispatch = useDispatch();
    const scope = useItemScope();
    const itemActions = useItemsActions();
    const inviteActions = useInviteActions();
    const { onHistory, onEdit } = useItemNavigation(item);

    const { shareId, itemId, data } = item;
    const { shareRoleId, owner } = share;

    const plan = useSelector(selectPassPlan);
    const vaults = useSelector(selectAllVaults);
    const pinInFlight = useSelector(selectRequestInFlight(itemPinRequest(shareId, itemId)));
    const unpinInFlight = useSelector(selectRequestInFlight(itemUnpinRequest(shareId, itemId)));
    const org = useOrganization();
    const optimisticItemId = useMemo(() => getItemEntityID({ itemId, shareId }), [itemId, shareId]);
    const failure = useMemoSelector(selectOptimisticFailedAction, [optimisticItemId]);
    const cloneFeatureFlag = useFeatureFlag(PassFeature.PassItemCloning);

    const itemShared = isItemShared(item);
    /** Item is considered shared if either the revision
     * or the share are flagged as being shared. */
    const shared = itemShared || share.shared;
    const free = plan === UserPassPlan.FREE;
    const readOnly = shareRoleId === ShareRole.READ;
    const isVault = isVaultShare(share);
    const hasMultipleVaults = vaults.length > 1;
    const trashed = isTrashed(item);
    const orgItemSharingDisabled = org?.settings.ItemShareMode === BitField.DISABLED;

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

    const actions = useMemo(() => {
        return {
            onEdit,
            onHistory,
            onClone: () => itemActions.clone(item),
            onDelete: () => itemActions.delete(item),
            onManage: () => inviteActions.manageItemAccess(shareId, itemId),
            onLeave: () => itemActions.leave(item),
            onMove: () => itemActions.move(item, VaultSelectMode.Writable),
            onRetry: () => failure !== undefined && dispatch(failure.action),
            onRestore: () => itemActions.restore(item),
            onShare: () => inviteActions.createItemInvite(shareId, itemId),
            onTrash: () => itemActions.trash(item),
            onDismiss: () => {
                if (failure === undefined) return;
                const itemName = item.data.metadata.name;

                if (itemCreate.intent.match(failure.action)) {
                    dispatch(itemCreateDismiss({ shareId, optimisticId: itemId, itemName }));
                }

                if (itemEdit.intent.match(failure.action)) {
                    dispatch(itemEditDismiss({ shareId, itemId, itemName }));
                }
            },
            onPin: () => dispatch((item.pinned ? itemUnpinIntent : itemPinIntent)({ shareId, itemId })),
            onToggleFlags: () => {
                const SkipHealthCheck = isMonitored(item);
                dispatch(setItemFlags.intent({ shareId, itemId, SkipHealthCheck }));
            },
        };
    }, [item, failure, scope]);

    return {
        state: {
            isShared: shared,
            isItemShared: itemShared,
            isFree: free,
            isReadOnly: readOnly,
            isTrashed: trashed,

            canHistory,
            canMove,
            canManage,
            canShare,
            canLinkShare,
            canItemShare,
            canManageAccess,
            canLeave,
            canMonitor,
            canClone,
            canTogglePinned,
        },
        actions,
    };
};
