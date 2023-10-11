import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import { itemCreationIntent } from '@proton/pass/store/actions';
import { selectDefaultVault, selectVaultLimits } from '@proton/pass/store/selectors';
import type { ItemCreateIntent, ItemType } from '@proton/pass/types';

import type { ItemNewProps } from '../../../shared/items/types';
import { useItemsFilteringContext } from '../../hooks/useItemsFilteringContext';
import { useNavigationContext } from '../../hooks/useNavigationContext';
import { AliasNew } from './Alias/Alias.new';
import { CreditCardNew } from './CreditCard/CreditCard.new';
import { LoginNew } from './Login/Login.new';
import { NoteNew } from './Note/Note.new';

const itemNewMap: { [T in ItemType]: VFC<ItemNewProps<T>> } = {
    login: LoginNew,
    note: NoteNew,
    alias: AliasNew,
    creditCard: CreditCardNew,
};

export const ItemNewContainer: VFC = () => {
    const history = useHistory();
    const dispatch = useDispatch();

    const { itemType } = useParams<{ shareId: string; itemType: ItemType }>();
    const { selectItem } = useNavigationContext();
    const { shareId: selectedShareId, setShareId } = useItemsFilteringContext();
    const { didDowngrade } = useSelector(selectVaultLimits);

    /* if user downgraded - always auto-select the default vault id */
    const defaultVault = useSelector(selectDefaultVault);
    const shareId = didDowngrade ? defaultVault.shareId : selectedShareId ?? defaultVault.shareId;

    const ItemNewComponent = itemNewMap[itemType];

    const handleSubmit = (createIntent: ItemCreateIntent) => {
        const action = itemCreationIntent(createIntent);
        dispatch(action);

        /* if the user put the item in a vault which is
         * currently not selected - autoselect it so the
         * following call to `selectItem` passes */
        if (selectedShareId && selectedShareId !== createIntent.shareId) {
            setShareId(createIntent.shareId);
        }

        selectItem(createIntent.shareId, action.payload.optimisticId);
    };

    const handleCancel = () => history.goBack();

    return <ItemNewComponent shareId={shareId} onSubmit={handleSubmit} onCancel={handleCancel} />;
};
