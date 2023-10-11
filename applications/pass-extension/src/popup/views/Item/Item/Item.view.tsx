import { type VFC, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import type { AnyAction } from 'redux';
import { c } from 'ttag';

import { isTrashed } from '@proton/pass/lib/items/item.predicates';
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
import type { ItemRevisionWithOptimistic, ItemType, Maybe, VaultShare } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { uniqueId } from '@proton/pass/utils/string';

import { useFeatureFlag } from '../../../../shared/hooks/useFeatureFlag';
import type { ItemTypeViewProps } from '../../../../shared/items/types';
import { useNavigationContext } from '../../../hooks/useNavigationContext';
import { VaultSelectModal, useVaultSelectModalHandles } from '../../Vault/VaultSelect.modal';
import { AliasView } from '../Alias/Alias.view';
import { CreditCardView } from '../CreditCard/CreditCard.view';
import { LoginView } from '../Login/Login.view';
import { NoteView } from '../Note/Note.view';

type Props = {
    shareId: string;
    itemId: string;
    item: ItemRevisionWithOptimistic;
    vault: VaultShare;
    failureAction: Maybe<AnyAction>;
};

const itemTypeViewMap: { [T in ItemType]: VFC<ItemTypeViewProps<T>> } = {
    login: LoginView,
    note: NoteView,
    alias: AliasView,
    creditCard: CreditCardView,
};

export const ItemView: VFC<Props> = ({ item, failureAction, shareId, itemId, vault }) => {
    const dispatch = useDispatch();
    const primaryVaultDisabled = useFeatureFlag(PassFeature.PassRemovePrimaryVault);
    const history = useHistory();

    const { selectItem } = useNavigationContext();
    const { closeVaultSelect, openVaultSelect, modalState } = useVaultSelectModalHandles();

    const { optimistic, failed, revision } = useMemo(() => {
        const { optimistic, failed, ...revision } = item;
        return { optimistic, failed, revision };
    }, [item]);

    const trashed = isTrashed(revision);

    const handleEdit = useCallback(() => history.push(`/share/${shareId}/item/${itemId}/edit`), [shareId, itemId]);

    const handleRetry = useCallback(() => failureAction !== undefined && dispatch(failureAction), [failureAction]);

    const handleDismiss = useCallback(() => {
        if (failureAction !== undefined) {
            if (itemCreationIntent.match(failureAction)) {
                dispatch(itemCreationDismiss({ shareId, optimisticId: itemId, item: revision }));
            }

            if (itemEditIntent.match(failureAction)) {
                dispatch(itemEditDismiss({ shareId, itemId, item: revision }));
            }
        }
    }, [failureAction, shareId, itemId, revision]);

    const handleTrash = useCallback(() => {
        dispatch(itemTrashIntent({ itemId, shareId, item }));
    }, [itemId, shareId, item]);

    const handleMove = useCallback(() => openVaultSelect(item.shareId), [item.shareId]);

    const handleVaultSelect = useCallback(
        (destinationShareId: string) => {
            const optimisticId = uniqueId();

            dispatch(
                itemMoveIntent({
                    item: revision,
                    shareId: destinationShareId,
                    optimisticId,
                })
            );

            selectItem(destinationShareId, optimisticId);
            closeVaultSelect();
        },
        [revision]
    );

    const handleRestore = useCallback(() => {
        dispatch(itemRestoreIntent({ item, itemId, shareId }));
    }, [itemId, shareId, item]);

    const handleDelete = useCallback(() => {
        dispatch(itemDeleteIntent({ item, itemId, shareId }));
    }, [itemId, shareId, item]);

    const ItemTypeViewComponent = itemTypeViewMap[item.data.type] as VFC<ItemTypeViewProps>;

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
                optimistic={optimistic}
                failed={failed}
                trashed={trashed}
            />

            <VaultSelectModal
                downgradeMessage={
                    primaryVaultDisabled
                        ? c('Info')
                              .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`
                        : c('Info')
                              .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your primary vault. To move items between all vaults upgrade your subscription.`
                }
                onSubmit={handleVaultSelect}
                onClose={closeVaultSelect}
                {...modalState}
            />
        </>
    );
};
