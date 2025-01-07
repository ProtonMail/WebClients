import { type FC, memo, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { VaultInviteFromItemModal } from '@proton/pass/components/Invite/VaultInviteFromItemModal';
import { AliasView } from '@proton/pass/components/Item/Alias/Alias.view';
import { CreditCardView } from '@proton/pass/components/Item/CreditCard/CreditCard.view';
import { IdentityView } from '@proton/pass/components/Item/Identity/Identity.view';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { LoginView } from '@proton/pass/components/Item/Login/Login.view';
import { NoteView } from '@proton/pass/components/Item/Note/Note.view';
import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { getItemRoute, getLocalPath } from '@proton/pass/components/Navigation/routing';
import { SecureLinkModal } from '@proton/pass/components/SecureLink/SecureLinkModal';
import { VaultSelectMode } from '@proton/pass/components/Vault/VaultSelect';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useOptimisticItem } from '@proton/pass/hooks/useItem';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { isMonitored } from '@proton/pass/lib/items/item.predicates';
import { getItemEntityID, getItemKey } from '@proton/pass/lib/items/item.utils';
import {
    itemCreate,
    itemCreateDismiss,
    itemEdit,
    itemEditDismiss,
    itemPinIntent,
    itemUnpinIntent,
    setItemFlags,
} from '@proton/pass/store/actions';
import { selectIsOptimisticId, selectOptimisticFailedAction, selectShare } from '@proton/pass/store/selectors';
import type { ItemType, SelectedItem, ShareType } from '@proton/pass/types';

const itemTypeViewMap: { [T in ItemType]: FC<ItemViewProps<T>> } = {
    login: LoginView,
    note: NoteView,
    alias: AliasView,
    creditCard: CreditCardView,
    identity: IdentityView,
};

export const ItemView = memo(({ shareId, itemId }: SelectedItem) => {
    const scope = useItemScope();
    const { selectItem, preserveSearch } = useNavigationActions();
    const inviteActions = useInviteActions();
    const itemActions = useItemsActions();

    const dispatch = useDispatch();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [openSecureLinkModal, setOpenSecureLinkModal] = useState(false);

    const optimisticItemId = useMemo(() => getItemEntityID({ itemId, shareId }), [itemId, shareId]);
    const optimisticResolved = useSelector(selectIsOptimisticId(itemId));
    const failure = useMemoSelector(selectOptimisticFailedAction, [optimisticItemId]);

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const item = useOptimisticItem(shareId, itemId);

    /* if vault or item cannot be found : redirect to base path */
    if (!(vault && item)) {
        const to = preserveSearch(getLocalPath(scope ?? ''));
        return <Redirect to={to} push={false} />;
    }

    /* if the item is optimistic and can be resolved to a non-optimistic item : replace */
    if (optimisticResolved) {
        const to = preserveSearch(getItemRoute(shareId, item.itemId, { scope }));
        return <Redirect to={to} push={false} />;
    }

    const handleEdit = () => selectItem(shareId, itemId, { view: 'edit', scope });
    const handleHistory = () => selectItem(shareId, itemId, { view: 'history', scope });
    const handleRetry = () => failure !== undefined && dispatch(failure.action);
    const handleTrash = () => itemActions.trash(item);
    const handleMove = () => itemActions.move(item, VaultSelectMode.Writable);
    const handleMoveToSharedVault = () => itemActions.move(item, VaultSelectMode.Shared);
    const handleRestore = () => itemActions.restore(item);
    const handleDelete = () => itemActions.delete(item);
    const handleInviteClick = () => setInviteOpen(true);
    const handleSecureLink = () => setOpenSecureLinkModal(true);
    const handleVaultManage = () => inviteActions.manageAccess(shareId);

    const handleCreateSharedVault = () => {
        inviteActions.createSharedVault({ item: { shareId, itemId } });
        setInviteOpen(false);
    };

    const handleShareVaultClick = () => {
        inviteActions.createInvite({ vault });
        setInviteOpen(false);
    };

    const handleDismiss = () => {
        if (failure === undefined) return;

        if (itemCreate.intent.match(failure.action)) {
            dispatch(itemCreateDismiss({ shareId, optimisticId: itemId, item }));
        }

        if (itemEdit.intent.match(failure.action)) {
            dispatch(itemEditDismiss({ shareId, itemId, item }));
        }
    };

    const handlePinClick = () => dispatch((item.pinned ? itemUnpinIntent : itemPinIntent)({ shareId, itemId }));

    const handleToggleFlags = () => {
        const SkipHealthCheck = isMonitored(item);
        dispatch(setItemFlags.intent({ shareId, itemId, SkipHealthCheck }));
    };

    const ItemTypeViewComponent = itemTypeViewMap[item.data.type] as FC<ItemViewProps>;

    return (
        <>
            <ItemTypeViewComponent
                key={item.itemId}
                vault={vault}
                revision={item}
                handleDeleteClick={handleDelete}
                handleDismissClick={handleDismiss}
                handleEditClick={handleEdit}
                handleHistoryClick={handleHistory}
                handleInviteClick={handleInviteClick}
                handleManageClick={handleVaultManage}
                handleMoveToTrashClick={handleTrash}
                handleMoveToVaultClick={handleMove}
                handlePinClick={handlePinClick}
                handleRestoreClick={handleRestore}
                handleRetryClick={handleRetry}
                handleSecureLinkClick={handleSecureLink}
                handleToggleFlagsClick={handleToggleFlags}
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

            {openSecureLinkModal && (
                <SecureLinkModal
                    key={getItemKey(item)}
                    shareId={shareId}
                    itemId={itemId}
                    onClose={() => setOpenSecureLinkModal(false)}
                    open
                />
            )}
        </>
    );
});

ItemView.displayName = 'ItemViewMemo';
