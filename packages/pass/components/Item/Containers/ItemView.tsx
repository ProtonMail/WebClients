import { type FC, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { useInviteContext } from '@proton/pass/components/Invite/InviteProvider';
import { VaultInviteFromItemModal } from '@proton/pass/components/Invite/VaultInviteFromItemModal';
import { AliasView } from '@proton/pass/components/Item/Alias/Alias.view';
import { CreditCardView } from '@proton/pass/components/Item/CreditCard/CreditCard.view';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { LoginView } from '@proton/pass/components/Item/Login/Login.view';
import { NoteView } from '@proton/pass/components/Item/Note/Note.view';
import { useItemRoute } from '@proton/pass/components/Navigation/ItemSwitch';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getItemRoute, getLocalPath, maybeTrash } from '@proton/pass/components/Navigation/routing';
import { VaultSelectMode } from '@proton/pass/components/Vault/VaultSelect';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { getItemActionId } from '@proton/pass/lib/items/item.utils';
import {
    itemCreationDismiss,
    itemCreationIntent,
    itemEditDismiss,
    itemEditIntent,
    itemPinIntent,
    itemUnpinIntent,
} from '@proton/pass/store/actions';
import selectFailedAction from '@proton/pass/store/optimistic/selectors/select-failed-action';
import {
    selectIsOptimisticId,
    selectItemWithOptimistic,
    selectItemsState,
    selectShare,
} from '@proton/pass/store/selectors';
import type { ItemType, SelectedItem, ShareType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

const itemTypeViewMap: { [T in ItemType]: FC<ItemViewProps<T>> } = {
    login: LoginView,
    note: NoteView,
    alias: AliasView,
    creditCard: CreditCardView,
};

export const ItemView: FC = () => {
    const { prefix } = useItemRoute();
    const { selectItem, matchTrash: inTrash, preserveSearch } = useNavigation();
    const inviteContext = useInviteContext();
    const itemActions = useItemsActions();

    const dispatch = useDispatch();
    const { shareId, itemId } = useParams<SelectedItem>();
    const [inviteOpen, setInviteOpen] = useState(false);

    const optimisticItemId = getItemActionId({ itemId, shareId });
    const optimisticResolved = useSelector(selectIsOptimisticId(itemId));
    const itemSelector = useMemo(() => selectItemWithOptimistic(shareId, itemId), [shareId, itemId]);
    const failedItemActionSelector = pipe(selectItemsState, selectFailedAction(optimisticItemId));

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const item = useSelector(itemSelector);
    const failure = useSelector(failedItemActionSelector);

    /* if vault or item cannot be found : redirect to base path */
    if (!(vault && item)) {
        const to = preserveSearch(getLocalPath(maybeTrash('', inTrash)));
        return <Redirect to={to} push={false} />;
    }

    /* if the item is optimistic and can be resolved to a non-optimistic item : replace */
    if (optimisticResolved) {
        const to = preserveSearch(getItemRoute(shareId, item.itemId, { prefix }));
        return <Redirect to={to} push={false} />;
    }

    const handleEdit = () => selectItem(shareId, itemId, { view: 'edit', prefix });
    const handleHistory = () => selectItem(shareId, itemId, { view: 'history', inTrash, prefix });
    const handleRetry = () => failure !== undefined && dispatch(failure.action);
    const handleTrash = () => itemActions.trash(item);
    const handleMove = () => itemActions.move(item, VaultSelectMode.Writable);
    const handleMoveToSharedVault = () => itemActions.move(item, VaultSelectMode.Shared);
    const handleRestore = () => itemActions.restore(item);
    const handleDelete = () => itemActions.delete(item);
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

    const handlePinClick = () => dispatch((item.pinned ? itemUnpinIntent : itemPinIntent)({ shareId, itemId }));

    const ItemTypeViewComponent = itemTypeViewMap[item.data.type] as FC<ItemViewProps>;

    return (
        <>
            <ItemTypeViewComponent
                key={item.itemId}
                vault={vault}
                revision={item}
                handleEditClick={handleEdit}
                handleHistoryClick={handleHistory}
                handleRetryClick={handleRetry}
                handleMoveToTrashClick={handleTrash}
                handleMoveToVaultClick={handleMove}
                handleDismissClick={handleDismiss}
                handleRestoreClick={handleRestore}
                handleDeleteClick={handleDelete}
                handleInviteClick={handleInviteClick}
                handleManageClick={handleVaultManage}
                handlePinClick={handlePinClick}
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
