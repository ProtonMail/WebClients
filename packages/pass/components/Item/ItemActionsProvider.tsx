import { type FC, type PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { ConfirmDeleteAliases } from '@proton/pass/components/Item/Actions/ConfirmDeleteAliases';
import { VaultSelect, VaultSelectMode, useVaultSelectModalHandles } from '@proton/pass/components/Vault/VaultSelect';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import {
    itemBulkDeleteIntent,
    itemBulkMoveIntent,
    itemBulkRestoreIntent,
    itemBulkTrashIntent,
    itemDeleteIntent,
    itemMoveIntent,
    itemRestoreIntent,
    itemTrashIntent,
} from '@proton/pass/store/actions';
import type { BulkSelectionDTO, ItemRevision, MaybeNull } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { ConfirmMoveItem } from './Actions/ConfirmMoveItem';
import { ConfirmMoveManyItems } from './Actions/ConfirmMoveManyItems';

/** Ongoing: move every item action definition to this
 * context object. This context should be loosely connected */
type ItemActionsContextType = {
    delete: (item: ItemRevision) => void;
    deleteMany: (items: BulkSelectionDTO) => void;
    move: (item: ItemRevision, mode: VaultSelectMode) => void;
    moveMany: (items: BulkSelectionDTO) => void;
    restore: (item: ItemRevision) => void;
    restoreMany: (items: BulkSelectionDTO) => void;
    trash: (item: ItemRevision) => void;
    trashMany: (items: BulkSelectionDTO) => void;
};

const ItemActionsContext = createContext<MaybeNull<ItemActionsContextType>>(null);

export const ItemActionsProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();
    const bulk = useBulkSelect();

    const { closeVaultSelect, openVaultSelect, modalState } = useVaultSelectModalHandles();

    const moveItem = useConfirm((options: { item: ItemRevision; shareId: string }) => {
        const optimisticId = uniqueId();
        dispatch(itemMoveIntent({ ...options, optimisticId }));
    });

    const moveManyItems = useConfirm((options: { selected: BulkSelectionDTO; shareId: string }) => {
        dispatch(itemBulkMoveIntent(options));
        bulk.disable();
    });

    const trashItem = (item: ItemRevision) => {
        dispatch(itemTrashIntent({ itemId: item.itemId, shareId: item.shareId, item }));
    };

    const trashManyItems = (selected: BulkSelectionDTO) => {
        dispatch(itemBulkTrashIntent({ selected }));
        bulk.disable();
    };

    const deleteItem = (item: ItemRevision) => {
        dispatch(itemDeleteIntent({ itemId: item.itemId, shareId: item.shareId, item }));
    };

    const deleteManyItems = (options: { selected: BulkSelectionDTO }) => {
        dispatch(itemBulkDeleteIntent(options));
        bulk.disable();
    };

    const confirmDeleteAliases = useConfirm(deleteManyItems);

    const restoreItem = (item: ItemRevision) => {
        dispatch(itemRestoreIntent({ itemId: item.itemId, shareId: item.shareId, item }));
    };

    const restoreManyItems = (selected: BulkSelectionDTO) => {
        dispatch(itemBulkRestoreIntent({ selected }));
        bulk.disable();
    };

    const context = useMemo<ItemActionsContextType>(() => {
        return {
            move: (item, mode) =>
                openVaultSelect({
                    mode,
                    shareId: item.shareId,
                    onSubmit: (shareId) => {
                        moveItem.prompt({ item, shareId });
                        closeVaultSelect();
                    },
                }),
            moveMany: (selected) =>
                openVaultSelect({
                    mode: VaultSelectMode.Writable,
                    shareId: '' /* allow all vaults */,
                    onSubmit: (shareId) => {
                        moveManyItems.prompt({ selected, shareId });
                        closeVaultSelect();
                    },
                }),
            trash: trashItem,
            trashMany: trashManyItems,
            delete: deleteItem,
            deleteMany: (selected) =>
                bulk.aliasCount ? confirmDeleteAliases.prompt({ selected }) : deleteManyItems({ selected }),
            restore: restoreItem,
            restoreMany: restoreManyItems,
        };
    }, [bulk]);

    return (
        <ItemActionsContext.Provider value={context}>
            {children}
            <VaultSelect
                downgradeMessage={c('Info')
                    .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`}
                onClose={closeVaultSelect}
                {...modalState}
            />

            {moveItem.pending && (
                <ConfirmMoveItem
                    open
                    item={moveItem.param.item}
                    shareId={moveItem.param.shareId}
                    onCancel={moveItem.cancel}
                    onConfirm={moveItem.confirm}
                />
            )}

            {moveManyItems.pending && (
                <ConfirmMoveManyItems
                    open
                    selected={moveManyItems.param.selected}
                    shareId={moveManyItems.param.shareId}
                    onConfirm={moveManyItems.confirm}
                    onCancel={moveManyItems.cancel}
                />
            )}

            {confirmDeleteAliases.pending && (
                <ConfirmDeleteAliases
                    open
                    onConfirm={confirmDeleteAliases.confirm}
                    onCancel={confirmDeleteAliases.cancel}
                />
            )}
        </ItemActionsContext.Provider>
    );
};

export const useItemsActions = (): ItemActionsContextType => useContext(ItemActionsContext)!;
