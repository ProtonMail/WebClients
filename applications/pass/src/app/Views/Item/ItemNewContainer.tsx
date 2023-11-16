import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import { AliasNew } from '@proton/pass/components/Item/Alias/Alias.new';
import { CreditCardNew } from '@proton/pass/components/Item/CreditCard/CreditCard.new';
import { LoginNew } from '@proton/pass/components/Item/Login/Login.new';
import { NoteNew } from '@proton/pass/components/Item/Note/Note.new';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { itemCreationIntent } from '@proton/pass/store/actions';
import { selectDefaultVault, selectVaultLimits } from '@proton/pass/store/selectors';
import type { ItemCreateIntent, ItemType } from '@proton/pass/types';

const itemNewMap: { [T in ItemType]: VFC<ItemNewViewProps<T>> } = {
    login: LoginNew,
    note: NoteNew,
    alias: AliasNew,
    creditCard: CreditCardNew,
};

export const ItemNewContainer: VFC = () => {
    const history = useHistory();
    const dispatch = useDispatch();
    //TODO see for this const { url } = usePopupContext();

    const { activeShareId, itemType } = useParams<{ activeShareId: string; itemType: ItemType }>();
    // not needed we have the item from route const { selectItem } = useNavigationContext();
    // TO DO migrate this context const { shareId: selectedShareId, setShareId } = useItemsFilteringContext();

    const { didDowngrade } = useSelector(selectVaultLimits);

    /* if user downgraded - always auto-select the default vault id */
    const defaultVault = useSelector(selectDefaultVault);
    const shareId = didDowngrade ? defaultVault.shareId : activeShareId ?? defaultVault.shareId;

    const ItemNewComponent = itemNewMap[itemType];

    const handleSubmit = (createIntent: ItemCreateIntent) => {
        const action = itemCreationIntent(createIntent);
        dispatch(action);

        /* if the user put the item in a vault which is
         * currently not selected - autoselect it so the
         * following call to `selectItem` passes */

        /* TODO we might not need this we can just redirect the user to the new path
        if (selectedShareId && selectedShareId !== createIntent.shareId) {
            setShareId(createIntent.shareId);
        }

        selectItem(createIntent.shareId, action.payload.optimisticId);
        */
        // Just navigate to the new one
        history.push(`/share/${shareId}/item/${action.payload.optimisticId}`);
    };

    const handleCancel = () => history.goBack();

    return <ItemNewComponent shareId={shareId} onSubmit={handleSubmit} onCancel={handleCancel} url={null} />;
};
