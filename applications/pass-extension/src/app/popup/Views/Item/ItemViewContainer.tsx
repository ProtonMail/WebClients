import { type VFC, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import { useItemsFilteringContext } from 'proton-pass-extension/lib/hooks/useItemsFilteringContext';
import { useNavigationContext } from 'proton-pass-extension/lib/hooks/useNavigationContext';
import { c } from 'ttag';

import { useInviteContext } from '@proton/pass/components/Invite/InviteContextProvider';
import { VaultInviteFromItemModal } from '@proton/pass/components/Invite/VaultInviteFromItemModal';
import { AliasView } from '@proton/pass/components/Item/Alias/Alias.view';
import { CreditCardView } from '@proton/pass/components/Item/CreditCard/CreditCard.view';
import { LoginView } from '@proton/pass/components/Item/Login/Login.view';
import { NoteView } from '@proton/pass/components/Item/Note/Note.view';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { VaultSelect, useVaultSelectModalHandles } from '@proton/pass/components/Vault/VaultSelect';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { getItemActionId } from '@proton/pass/lib/items/item.utils';
import {
    itemCreationDismiss,
    itemCreationIntent,
    itemDeleteIntent,
    itemEditDismiss,
    itemEditIntent,
    itemMoveIntent,
    itemRestoreIntent,
    itemTrashIntent,
} from '@proton/pass/store/actions';
import selectFailedAction from '@proton/pass/store/optimistic/selectors/select-failed-action';
import {
    selectByShareId,
    selectItemWithOptimistic,
    selectShareOrThrow,
    selectWritableSharedVaultsWithItemsCount,
    selectWritableVaultsWithItemsCount,
} from '@proton/pass/store/selectors';
import type { ItemType, SelectedItem, ShareType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

const itemTypeViewMap: { [T in ItemType]: VFC<ItemViewProps<T>> } = {
    login: LoginView,
    note: NoteView,
    alias: AliasView,
    creditCard: CreditCardView,
};

export const ItemViewContainer: VFC = () => {
    const { selectItem } = useNavigationContext();
    const filters = useItemsFilteringContext();
    const inviteContext = useInviteContext();

    const dispatch = useDispatch();
    const history = useHistory();
    const { shareId, itemId } = useParams<SelectedItem>();
    const [inviteOpen, setInviteOpen] = useState(false);
    const { closeVaultSelect, openVaultSelect, modalState } = useVaultSelectModalHandles();

    const optimisticItemId = getItemActionId({ itemId, shareId });
    const itemSelector = useMemo(() => selectItemWithOptimistic(shareId, itemId), [shareId, itemId]);
    const failedItemActionSelector = pipe(selectByShareId, selectFailedAction(optimisticItemId));

    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const item = useSelector(itemSelector);
    const failure = useSelector(failedItemActionSelector);

    if (item === undefined) return <Panel />;

    const trashed = isTrashed(item);

    const handleEdit = () => history.push(`/share/${shareId}/item/${itemId}/edit`);
    const handleRetry = () => failure !== undefined && dispatch(failure.action);
    const handleTrash = () => dispatch(itemTrashIntent({ itemId, shareId, item }));
    const handleMove = () => openVaultSelect(item.shareId, selectWritableVaultsWithItemsCount);
    const handleMoveToSharedVault = () => openVaultSelect(item.shareId, selectWritableSharedVaultsWithItemsCount);
    const handleRestore = () => dispatch(itemRestoreIntent({ item, itemId, shareId }));
    const handleDelete = () => dispatch(itemDeleteIntent({ item, itemId, shareId }));
    const handleInviteClick = () => setInviteOpen(true);
    const handleVaultManage = () => inviteContext.manageAccess(shareId);

    const handleCreateSharedVault = () => {
        inviteContext.createSharedVault({ item: { shareId, itemId } });
        setInviteOpen(false);
    };

    const handleShareVaultClick = () => {
        inviteContext.createInvite({ vault });
        setInviteOpen(false);
    };

    const handleDismiss = () => {
        if (failure === undefined) return;

        if (itemCreationIntent.match(failure.action)) {
            dispatch(itemCreationDismiss({ shareId, optimisticId: itemId, item }));
        }

        if (itemEditIntent.match(failure.action)) {
            dispatch(itemEditDismiss({ shareId, itemId, item }));
        }
    };

    const doMoveItem = (destinationShareId: string) => {
        const optimisticId = uniqueId();
        dispatch(itemMoveIntent({ item, shareId: destinationShareId, optimisticId }));

        if (filters.shareId) filters.setShareId(destinationShareId);
        selectItem(destinationShareId, optimisticId);

        closeVaultSelect();
        setInviteOpen(false);
    };

    const ItemTypeViewComponent = itemTypeViewMap[item.data.type] as VFC<ItemViewProps>;

    return (
        <>
            <ItemTypeViewComponent
                key={item.itemId}
                vault={vault}
                revision={item}
                handleEditClick={handleEdit}
                handleRetryClick={handleRetry}
                handleMoveToTrashClick={handleTrash}
                handleMoveToVaultClick={handleMove}
                handleDismissClick={handleDismiss}
                handleRestoreClick={handleRestore}
                handleDeleteClick={handleDelete}
                handleInviteClick={handleInviteClick}
                handleManageClick={handleVaultManage}
                optimistic={item.optimistic}
                failed={item.failed}
                trashed={trashed}
            />

            <VaultSelect
                downgradeMessage={c('Info')
                    .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`}
                onSubmit={doMoveItem}
                onClose={closeVaultSelect}
                {...modalState}
            />

            <VaultInviteFromItemModal
                vault={vault}
                shareId={shareId}
                itemId={itemId}
                open={inviteOpen}
                onClose={() => setInviteOpen(false)}
                handleMoveToSharedVaultClick={handleMoveToSharedVault}
                handleShareVaultClick={handleShareVaultClick}
                handleCreateSharedVaultClick={handleCreateSharedVault}
            />
        </>
    );
};
