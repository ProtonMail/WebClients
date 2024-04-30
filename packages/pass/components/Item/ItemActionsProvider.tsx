import { type FC, type PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { Alert } from '@proton/components/index';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { VaultSelect, VaultSelectMode, useVaultSelectModalHandles } from '@proton/pass/components/Vault/VaultSelect';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
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

    const deleteManyItems = (selected: BulkSelectionDTO) => {
        dispatch(itemBulkDeleteIntent({ selected }));
        bulk.disable();
    };

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
            deleteMany: deleteManyItems,
            restore: restoreItem,
            restoreMany: restoreManyItems,
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

            <WithVault shareId={moveItem.param?.shareId}>
                {({ content: { name } }) => (
                    <ConfirmationModal
                        open={moveItem.pending}
                        onClose={moveItem.cancel}
                        onSubmit={moveItem.confirm}
                        submitText={c('Action').t`Confirm`}
                        title={c('Title').t`Move item?`}
                    >
                        <Card className="mb-2 text-sm" type="primary">{c('Info')
                            .t`Moving an item to another vault will erase its history`}</Card>
                        <Alert className="mb-4" type="info">
                            {
                                // translator: variable here is the name of the user's vault
                                c('Info').t`Are you sure you want to move the item to "${name}" ?`
                            }
                        </Alert>
                    </ConfirmationModal>
                )}
            </WithVault>

            <WithVault shareId={moveManyItems.param?.shareId}>
                {({ content: { name } }) => (
                    <ConfirmationModal
                        open={moveManyItems.pending}
                        onClose={moveManyItems.cancel}
                        onSubmit={moveManyItems.confirm}
                        submitText={c('Action').t`Confirm`}
                        title={c('Title').t`Move items?`}
                    >
                        <Card className="mb-2 text-sm" type="primary">{c('Info')
                            .t`Moving items to another vault will erase their history`}</Card>
                        <Alert className="mb-4" type="info">
                            {
                                // translator: variable here is the name of the user's vault
                                c('Info').t`Are you sure you want to move items to "${name}" ?`
                            }
                        </Alert>
                    </ConfirmationModal>
                )}
            </WithVault>
        </ItemActionsContext.Provider>
    );
};

export const useItemsActions = (): ItemActionsContextType => useContext(ItemActionsContext)!;
