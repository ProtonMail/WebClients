import { type FC, memo, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { AliasView } from '@proton/pass/components/Item/Alias/Alias.view';
import { CreditCardView } from '@proton/pass/components/Item/CreditCard/CreditCard.view';
import { CustomView } from '@proton/pass/components/Item/Custom/Custom.view';
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
import type { ItemType, SelectedItem } from '@proton/pass/types';

const itemTypeViewMap: { [T in ItemType]: FC<ItemViewProps<T>> } = {
    login: LoginView,
    note: NoteView,
    alias: AliasView,
    creditCard: CreditCardView,
    identity: IdentityView,
    sshKey: CustomView,
    wifi: CustomView,
    custom: CustomView,
};

export const ItemView = memo(({ shareId, itemId }: SelectedItem) => {
    const scope = useItemScope();
    const { selectItem, preserveSearch } = useNavigationActions();
    const inviteActions = useInviteActions();
    const itemActions = useItemsActions();

    const dispatch = useDispatch();
    const [openSecureLinkModal, setOpenSecureLinkModal] = useState(false);

    const optimisticItemId = useMemo(() => getItemEntityID({ itemId, shareId }), [itemId, shareId]);
    const optimisticResolved = useSelector(selectIsOptimisticId(itemId));
    const failure = useMemoSelector(selectOptimisticFailedAction, [optimisticItemId]);

    const share = useSelector(selectShare(shareId));
    const item = useOptimisticItem(shareId, itemId);

    /* if vault or item cannot be found : redirect to base path */
    if (!(share && item)) {
        const to = preserveSearch(getLocalPath(scope ?? ''));
        return <Redirect to={to} push={false} />;
    }

    /* if the item is optimistic and can be resolved to a non-optimistic item : replace */
    if (optimisticResolved) {
        const to = preserveSearch(getItemRoute(shareId, item.itemId, { scope }));
        return <Redirect to={to} push={false} />;
    }

    const handleClone = () => itemActions.clone(item);
    const handleDelete = () => itemActions.delete(item);
    const handleEdit = () => selectItem(shareId, itemId, { view: 'edit', scope });
    const handleHistory = () => selectItem(shareId, itemId, { view: 'history', scope });
    const handleItemManage = () => inviteActions.manageItemAccess(shareId, itemId);
    const handleLeaveItem = () => itemActions.leave(item);
    const handleMove = () => itemActions.move(item, VaultSelectMode.Writable);
    const handleRestore = () => itemActions.restore(item);
    const handleRetry = () => failure !== undefined && dispatch(failure.action);
    const handleSecureLink = () => setOpenSecureLinkModal(true);
    const handleShareItem = () => inviteActions.createItemInvite(shareId, itemId);
    const handleTrash = () => itemActions.trash(item);

    const handleDismiss = () => {
        if (failure === undefined) return;
        const itemName = item.data.metadata.name;

        if (itemCreate.intent.match(failure.action)) {
            dispatch(itemCreateDismiss({ shareId, optimisticId: itemId, itemName }));
        }

        if (itemEdit.intent.match(failure.action)) {
            dispatch(itemEditDismiss({ shareId, itemId, itemName }));
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
                share={share}
                revision={item}
                handleCloneClick={handleClone}
                handleDeleteClick={handleDelete}
                handleDismissClick={handleDismiss}
                handleEditClick={handleEdit}
                handleHistoryClick={handleHistory}
                handleLeaveItemClick={handleLeaveItem}
                handleManageClick={handleItemManage}
                handleMoveToTrashClick={handleTrash}
                handleMoveToVaultClick={handleMove}
                handlePinClick={handlePinClick}
                handleRestoreClick={handleRestore}
                handleRetryClick={handleRetry}
                handleSecureLinkClick={handleSecureLink}
                handleShareItemClick={handleShareItem}
                handleToggleFlagsClick={handleToggleFlags}
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
