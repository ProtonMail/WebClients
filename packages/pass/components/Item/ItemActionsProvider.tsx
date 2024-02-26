import { type FC, type PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Alert } from '@proton/components/index';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
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
import { selectShare } from '@proton/pass/store/selectors';
import type { BulkSelectionDTO, ItemRevision, MaybeNull, ShareType } from '@proton/pass/types';
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
    const { selectItem } = useNavigation();
    const dispatch = useDispatch();
    const bulk = useBulkSelect();

    const { closeVaultSelect, openVaultSelect, modalState } = useVaultSelectModalHandles();

    const [destinationShareId, setDestinationShareId] = useState<MaybeNull<string>>(null);
    const destination = useSelector(selectShare<ShareType.Vault>(destinationShareId));

    const destinationVaultName = destination?.content.name ?? '';

    const moveItem = useConfirm((item: ItemRevision, destinationShareId: string) => {
        const optimisticId = uniqueId();
        dispatch(itemMoveIntent({ item, shareId: destinationShareId, optimisticId }));
        selectItem(destinationShareId, optimisticId, {
            mode: 'replace',
            filters: { selectedShareId: destinationShareId },
        });
    });

    const moveManyItems = useConfirm((selected: BulkSelectionDTO, destinationShareId: string) => {
        dispatch(itemBulkMoveIntent({ selected, destinationShareId }));
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
                    onSubmit: (destinationShareId) => {
                        setDestinationShareId(destinationShareId);
                        moveItem.prompt(item, destinationShareId);
                        closeVaultSelect();
                    },
                }),
            moveMany: (selected) =>
                openVaultSelect({
                    mode: VaultSelectMode.Writable,
                    shareId: '' /* allow all vaults */,
                    onSubmit: (destinationShareId) => {
                        setDestinationShareId(destinationShareId);
                        moveManyItems.prompt(selected, destinationShareId);
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
            <ConfirmationModal
                open={moveItem.pending}
                onClose={moveItem.cancel}
                onSubmit={moveItem.confirm}
                submitText={c('Action').t`Confirm`}
                title={c('Title').t`Move item?`}
            >
                <Card className="mb-2">{c('Info').t`Moving an item to another vault will erase its history`}</Card>
                <Alert className="mb-4" type="info">
                    {
                        // translator: variable here is the name of the user's vault
                        c('Info').t`Are you sure you want to move the item to "${destinationVaultName}" ?`
                    }
                </Alert>
            </ConfirmationModal>
            <ConfirmationModal
                open={moveManyItems.pending}
                onClose={moveManyItems.cancel}
                onSubmit={moveManyItems.confirm}
                submitText={c('Action').t`Confirm`}
                title={c('Title').t`Move items?`}
            >
                <Card className="mb-2">{c('Info').t`Moving items to another vault will erase their history`}</Card>
                <Alert className="mb-4" type="info">
                    {
                        // translator: variable here is the name of the user's vault
                        c('Info').t`Are you sure you want to move items to "${destinationVaultName}" ?`
                    }
                </Alert>
            </ConfirmationModal>
        </ItemActionsContext.Provider>
    );
};

export const useItemsActions = (): ItemActionsContextType => useContext(ItemActionsContext)!;
