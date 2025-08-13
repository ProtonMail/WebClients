import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { VaultSelectMode } from '@proton/pass/components/Vault/VaultSelect';
import type { ItemNavigationActions } from '@proton/pass/hooks/items/useItemNavigation';
import { useItemNavigation } from '@proton/pass/hooks/items/useItemNavigation';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { isMonitored } from '@proton/pass/lib/items/item.predicates';
import { getItemEntityID } from '@proton/pass/lib/items/item.utils';
import {
    itemCreate,
    itemCreateDismiss,
    itemEdit,
    itemEditDismiss,
    itemPinIntent,
    itemUnpinIntent,
    setItemFlags,
} from '@proton/pass/store/actions';
import { selectOptimisticFailedAction } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';

export type ItemActions = ItemNavigationActions & {
    onClone: () => void;
    onDelete: () => void;
    onDismiss: () => void;
    onLeave: () => void;
    onManage: () => void;
    onMove: () => void;
    onPin: () => void;
    onRestore: () => void;
    onRetry: () => void;
    onShare: () => void;
    onToggleFlags: () => void;
    onTrash: () => void;
};

type UseItemActions = (item: ItemRevision) => ItemActions;

export const useItemActions: UseItemActions = (item) => {
    const dispatch = useDispatch();
    const itemActions = useItemsActions();
    const inviteActions = useInviteActions();
    const itemNavigation = useItemNavigation(item);

    const { shareId, itemId } = item;

    const optimisticItemId = useMemo(() => getItemEntityID({ itemId, shareId }), [itemId, shareId]);
    const failure = useMemoSelector(selectOptimisticFailedAction, [optimisticItemId]);

    return useMemo(
        () => ({
            ...itemNavigation,
            onClone: () => itemActions.clone(item),
            onDelete: () => itemActions.delete(item),
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
            onLeave: () => itemActions.leave(item),
            onManage: () => inviteActions.manageItemAccess(shareId, itemId),
            onMove: () => itemActions.move(item, VaultSelectMode.Writable),
            onPin: () => dispatch((item.pinned ? itemUnpinIntent : itemPinIntent)({ shareId, itemId })),
            onRestore: () => itemActions.restore(item),
            onRetry: () => failure !== undefined && dispatch(failure.action),
            onShare: () => inviteActions.createItemInvite(shareId, itemId),
            onToggleFlags: () => {
                const SkipHealthCheck = isMonitored(item);
                dispatch(setItemFlags.intent({ shareId, itemId, SkipHealthCheck }));
            },
            onTrash: () => itemActions.trash(item),
        }),
        [item, failure, itemNavigation]
    );
};
