import { type FC, type PropsWithChildren, createContext, useCallback, useContext, useMemo } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { c } from 'ttag';

import { useBulkActions } from '@proton/pass/components/Bulk/BulkSelectionActions';
import { ConfirmTrashAlias } from '@proton/pass/components/Item/Actions/ConfirmAliasActions';
import {
    ConfirmDeleteManyItems,
    ConfirmMoveManyItems,
    ConfirmTrashManyItems,
} from '@proton/pass/components/Item/Actions/ConfirmBulkActions';
import { ConfirmDeleteItem, ConfirmMoveItem } from '@proton/pass/components/Item/Actions/ConfirmItemActions';
import { VaultSelect, VaultSelectMode, useVaultSelectModalHandles } from '@proton/pass/components/Vault/VaultSelect';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { isAliasItem, isDisabledAlias } from '@proton/pass/lib/items/item.predicates';
import {
    itemBulkDeleteIntent,
    itemBulkMoveIntent,
    itemBulkRestoreIntent,
    itemBulkTrashIntent,
    itemDeleteIntent,
    itemMove,
    itemRestoreIntent,
    itemTrash,
} from '@proton/pass/store/actions';
import { selectAliasTrashAcknowledged, selectLoginItemByEmail } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ItemMoveIntent } from '@proton/pass/types';
import { type BulkSelectionDTO, type ItemRevision, type MaybeNull } from '@proton/pass/types';

/** Ongoing: move every item action definition to this
 * context object. This context should be loosely connected */
type ItemActionsContextType = {
    delete: (item: ItemRevision) => void;
    deleteMany: (items: BulkSelectionDTO) => void;
    move: (item: ItemRevision, mode: VaultSelectMode) => void;
    moveMany: (items: BulkSelectionDTO, shareId?: string) => void;
    restore: (item: ItemRevision) => void;
    restoreMany: (items: BulkSelectionDTO) => void;
    trash: (item: ItemRevision) => void;
    trashMany: (items: BulkSelectionDTO) => void;
};

const ItemActionsContext = createContext<MaybeNull<ItemActionsContextType>>(null);

export const ItemActionsProvider: FC<PropsWithChildren> = ({ children }) => {
    const bulk = useBulkActions();
    const dispatch = useDispatch();
    const store = useStore<State>();

    const { closeVaultSelect, openVaultSelect, modalState } = useVaultSelectModalHandles();

    const moveItem = useConfirm(useCallback((dto: ItemMoveIntent) => dispatch(itemMove.intent(dto)), []));

    const moveManyItems = useConfirm(
        useCallback((options: { selected: BulkSelectionDTO; shareId: string }) => {
            dispatch(itemBulkMoveIntent(options));
            bulk.disable();
        }, [])
    );

    const trashItem = useConfirm(
        useCallback(
            (item: ItemRevision) =>
                dispatch(
                    itemTrash.intent({
                        itemId: item.itemId,
                        shareId: item.shareId,
                        revision: item.revision,
                    })
                ),
            []
        )
    );

    const trashManyItems = useConfirm(
        useCallback((selected: BulkSelectionDTO) => {
            dispatch(itemBulkTrashIntent({ selected }));
            bulk.disable();
        }, [])
    );

    const deleteItem = useConfirm(
        useCallback((item: ItemRevision) => {
            dispatch(
                itemDeleteIntent({
                    itemId: item.itemId,
                    shareId: item.shareId,
                    item,
                })
            );
        }, [])
    );

    const deleteManyItems = useConfirm(
        useCallback((selected: BulkSelectionDTO) => {
            dispatch(itemBulkDeleteIntent({ selected }));
            bulk.disable();
        }, [])
    );

    const context = useMemo<ItemActionsContextType>(() => {
        return {
            move: (item, mode) =>
                openVaultSelect({
                    mode,
                    shareId: item.shareId,
                    onSubmit: (destinationShareId) => {
                        moveItem.prompt({ itemId: item.itemId, shareId: item.shareId, destinationShareId });
                        closeVaultSelect();
                    },
                }),

            moveMany: (selected, shareId) =>
                shareId
                    ? moveManyItems.prompt({ selected, shareId })
                    : openVaultSelect({
                          mode: VaultSelectMode.Writable,
                          shareId: '' /* allow all vaults */,
                          onSubmit: (shareId) => {
                              moveManyItems.prompt({ selected, shareId });
                              closeVaultSelect();
                          },
                      }),

            trash: (item) => {
                if (isAliasItem(item.data)) {
                    const state = store.getState();
                    const aliasEmail = item.aliasEmail!;
                    const relatedLogin = selectLoginItemByEmail(aliasEmail)(state);
                    const ack = selectAliasTrashAcknowledged(state);
                    if ((isDisabledAlias(item) || ack) && !relatedLogin) trashItem.call(item);
                    else trashItem.prompt(item);
                } else trashItem.call(item);
            },

            trashMany: trashManyItems.prompt,

            delete: deleteItem.prompt,

            deleteMany: deleteManyItems.prompt,

            restore: (item) =>
                dispatch(
                    itemRestoreIntent({
                        itemId: item.itemId,
                        shareId: item.shareId,
                        item,
                    })
                ),

            restoreMany: (selected) => {
                dispatch(itemBulkRestoreIntent({ selected }));
                bulk.disable();
            },
        };
    }, []);

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
                <ConfirmMoveItem {...moveItem.param} onCancel={moveItem.cancel} onConfirm={moveItem.confirm} />
            )}

            {moveManyItems.pending && (
                <ConfirmMoveManyItems
                    {...moveManyItems.param}
                    onConfirm={moveManyItems.confirm}
                    onCancel={moveManyItems.cancel}
                />
            )}

            {trashItem.pending && (
                <ConfirmTrashAlias onCancel={trashItem.cancel} onConfirm={trashItem.confirm} item={trashItem.param} />
            )}

            {trashManyItems.pending && (
                <ConfirmTrashManyItems
                    onCancel={trashManyItems.cancel}
                    onConfirm={trashManyItems.confirm}
                    selected={trashManyItems.param}
                />
            )}

            {deleteItem.pending && (
                <ConfirmDeleteItem
                    onCancel={deleteItem.cancel}
                    onConfirm={deleteItem.confirm}
                    item={deleteItem.param}
                />
            )}

            {deleteManyItems.pending && (
                <ConfirmDeleteManyItems
                    onCancel={deleteManyItems.cancel}
                    onConfirm={deleteManyItems.confirm}
                    selected={deleteManyItems.param}
                />
            )}
        </ItemActionsContext.Provider>
    );
};

export const useItemsActions = (): ItemActionsContextType => useContext(ItemActionsContext)!;
