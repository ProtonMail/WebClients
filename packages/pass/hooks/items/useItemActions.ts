import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useInviteActions } from '../../components/Invite/InviteProvider';
import { useItemsActions } from '../../components/Item/ItemActionsProvider';
import { VaultSelectMode } from '../../components/Vault/VaultSelect';
import { isMonitored } from '../../lib/items/item.predicates';
import { getItemEntityID } from '../../lib/items/item.utils';
import {
    itemCreate,
    itemCreateDismiss,
    itemEdit,
    itemEditDismiss,
    itemPinIntent,
    itemUnpinIntent,
    setItemFlags,
} from '../../store/actions';
import { selectOptimisticFailedAction } from '../../store/selectors';
import type { ItemRevision } from '../../types';
import { useMemoSelector } from '../useMemoSelector';
import type { ItemNavigationActions } from './useItemNavigation';
import { useItemNavigation } from './useItemNavigation';

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
