/**
 * Regression check-list :
 *
 * [ ] items filter update -> noop (if `selectedItem` in `items`) | (unselect -> autoselect)
 * [ ] optimistic item creation [success] -> select `itemFromSelectedOptimisticId`
 * [ ] optimistic item creation [failure] -> noop
 * [ ] optimistic item creation [dismiss] -> unselect -> autoselect
 * [ ] optimistic item trash [success] -> unselect -> autoselect
 * [ ] optimistic item trash [failure] -> unselect -> autoselect first in `items` (won't reselect the previous trashed item)
 * [ ] optimistic item move [success] -> select `itemFromSelectedOptimisticId`
 * [ ] optimistic item move [failure] -> select `itemFromSelectedOptimisticId`
 * [ ] optimistic share delete [success|failure] -> if current filter or item matches current share : unselect -> autoselect from different share
 * [ ] event-loop share deletion -> unselect if `selectedItem` in deleted share -> autoselect from different share
 * [ ] event-loop item deletion -> unselect if deleted item is `selectedItem` -> autoselect
 * [ ] event-loop item creation -> noop
 */
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useItems } from 'proton-pass-extension/lib/hooks/useItems';
import { useNavigationContext } from 'proton-pass-extension/lib/hooks/useNavigationContext';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';
import { useShareEventEffect } from 'proton-pass-extension/lib/hooks/useShareEventEffect';

import { useInviteContext } from '@proton/pass/components/Invite/InviteContextProvider';
import { belongsToShare, itemEq } from '@proton/pass/lib/items/item.predicates';
import { popupTabStateSave } from '@proton/pass/store/actions/creators/popup';
import { selectItemIdByOptimisticId } from '@proton/pass/store/selectors';
import { invert } from '@proton/pass/utils/fp/predicates';

import type { ItemsFilteringContextType } from './ItemsFilteringContext';

export function vaultDeletionEffect(
    shareBeingDeleted: string,
    itemsFilteringVaultUtilities: Pick<ItemsFilteringContextType, 'shareId' | 'setShareBeingDeleted' | 'setShareId'>
) {
    const { shareId, setShareId, setShareBeingDeleted } = itemsFilteringVaultUtilities;
    /* used in `ItemEffects` to check wether the currently
     * selected item matches the vault being deleted */
    setShareBeingDeleted(shareBeingDeleted);

    /* reset the share filter if it matches the
     * vault being deleted */
    if (shareBeingDeleted === shareId) setShareId(null);
}

export const ItemEffects = () => {
    const dispatch = useDispatch();
    const popup = usePopupContext();
    const inviteContext = useInviteContext();

    const { selectedItem, selectItem, unselectItem, isCreating, isEditing, inTrash } = useNavigationContext();
    const {
        filtering: { search, sort, type, shareId, shareBeingDeleted, setShareId, setShareBeingDeleted },
        filtered: items,
    } = useItems({ trashed: inTrash });

    const itemFromSelectedOptimisticId = useSelector(selectItemIdByOptimisticId(selectedItem?.itemId));
    const autoselect = !(isEditing || isCreating) && popup.ready;

    const popupTabState = useMemo(
        () => ({
            domain: popup.url.subdomain ?? popup.url.domain ?? null,
            filters: { search, sort, type, selectedShareId: shareId },
            search,
            selectedItem: selectedItem ? { shareId: selectedItem.shareId, itemId: selectedItem.itemId } : null,
            tabId: popup.context!.tabId,
        }),
        [selectedItem, search, sort, type, shareId]
    );

    useShareEventEffect({
        onShareDisabled: (shareId) => {
            inviteContext.onShareDisabled(shareId);
            vaultDeletionEffect(shareId, { shareId, setShareBeingDeleted, setShareId });
        },
        onItemsDeleted: (shareId, itemIds) => {
            if (shareId === selectedItem?.shareId && itemIds.includes(selectedItem?.itemId)) {
                unselectItem();
            }
        },
    });

    useEffect(() => {
        /* if the current selected item has an optimistic id
         * and can be mapped to a non-optimistic item - select it */
        if (itemFromSelectedOptimisticId !== undefined) {
            const { shareId, itemId } = itemFromSelectedOptimisticId;
            return selectItem(shareId, itemId);
        }

        /* if the current selected item belongs to a share
         * being deleted (either optimistically or through
         * event-loop syncing) OR if it is not in the current
         * `items` sub-list (ie: item filter change, deletion
         * or event-loop) - unselect it : this will re-trigger
         * this effect */
        if (selectedItem) {
            const selectedItemShareDeleted = selectedItem.shareId === shareBeingDeleted;
            const selectedItemNotInItems = !items.some(itemEq(selectedItem));

            void ((selectedItemShareDeleted || selectedItemNotInItems) && unselectItem({ inTrash }));
            return;
        }

        /* if we can autoselect AND have no selected item (ie: initial
         * boot or if an item was unselected) AND we can autoselect :
         * -> select the first item in the current `items` sub-list excluding
         * those belonging to any current share being deleted. */
        if (autoselect) {
            const next = shareBeingDeleted ? items.find(invert(belongsToShare(shareBeingDeleted))) : items[0];

            if (next) {
                const { shareId, itemId } = next;
                selectItem(shareId, itemId, { action: 'replace', inTrash });
            }
        }
    }, [selectedItem, inTrash, items, autoselect, shareBeingDeleted, itemFromSelectedOptimisticId]);

    useEffect(() => {
        if (shareBeingDeleted) {
            /* if no items in the current `items` sub-list
             * belong to the share being deleted - reset */
            const itemsPendingDeletion = items.some(belongsToShare(shareBeingDeleted));
            if (!itemsPendingDeletion) {
                setShareBeingDeleted(null);
            }
        }
    }, [shareBeingDeleted, items]);

    useEffect(() => {
        dispatch(popupTabStateSave(popupTabState));
    }, [popupTabState]);

    return null;
};
