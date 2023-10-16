import { type VFC, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import { useNavigationContext } from 'proton-pass-extension/lib/hooks/useNavigationContext';
import { c } from 'ttag';

import { useInviteContext } from '@proton/pass/components/Invite/InviteContextProvider';
import { AliasView } from '@proton/pass/components/Item/Alias/Alias.view';
import { CreditCardView } from '@proton/pass/components/Item/CreditCard/CreditCard.view';
import { LoginView } from '@proton/pass/components/Item/Login/Login.view';
import { NoteView } from '@proton/pass/components/Item/Note/Note.view';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { VaultSelectModal, useVaultSelectModalHandles } from '@proton/pass/components/Vault/VaultSelect.modal';
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
import { selectByShareId, selectItemWithOptimistic, selectShareOrThrow } from '@proton/pass/store/selectors';
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
    const dispatch = useDispatch();
    const history = useHistory();

    const { shareId, itemId } = useParams<SelectedItem>();
    const optimisticItemId = getItemActionId({ itemId, shareId });
    const { selectItem } = useNavigationContext();

    const { closeVaultSelect, openVaultSelect, modalState } = useVaultSelectModalHandles();

    const itemSelector = useMemo(() => selectItemWithOptimistic(shareId, itemId), [shareId, itemId]);
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const item = useSelector(itemSelector);

    const failedItemActionSelector = pipe(selectByShareId, selectFailedAction(optimisticItemId));
    const failure = useSelector(failedItemActionSelector);

    const inviteContext = useInviteContext();

    if (item === undefined) return <Panel />;

    const trashed = isTrashed(item);

    const handleEdit = () => history.push(`/share/${shareId}/item/${itemId}/edit`);
    const handleRetry = () => failure !== undefined && dispatch(failure.action);
    const handleTrash = () => dispatch(itemTrashIntent({ itemId, shareId, item }));
    const handleMove = () => openVaultSelect(item.shareId);
    const handleRestore = () => dispatch(itemRestoreIntent({ item, itemId, shareId }));
    const handleDelete = () => dispatch(itemDeleteIntent({ item, itemId, shareId }));

    const handleDismiss = () => {
        if (failure === undefined) return;

        if (itemCreationIntent.match(failure.action)) {
            dispatch(itemCreationDismiss({ shareId, optimisticId: itemId, item }));
        }

        if (itemEditIntent.match(failure.action)) {
            dispatch(itemEditDismiss({ shareId, itemId, item }));
        }
    };

    const handleVaultSelect = (destinationShareId: string) => {
        const optimisticId = uniqueId();
        dispatch(itemMoveIntent({ item, shareId: destinationShareId, optimisticId }));
        selectItem(destinationShareId, optimisticId);
        closeVaultSelect();
    };

    const handleVaultManage = () => inviteContext.manageAccess(shareId);

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
                handleManageClick={handleVaultManage}
                optimistic={item.optimistic}
                failed={item.failed}
                trashed={trashed}
            />

            <VaultSelectModal
                downgradeMessage={c('Info')
                    .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`}
                onSubmit={handleVaultSelect}
                onClose={closeVaultSelect}
                {...modalState}
            />
        </>
    );
};
