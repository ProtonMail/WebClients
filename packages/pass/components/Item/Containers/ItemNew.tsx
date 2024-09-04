import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { AliasNew } from '@proton/pass/components/Item/Alias/Alias.new';
import { CreditCardNew } from '@proton/pass/components/Item/CreditCard/CreditCard.new';
import { IdentityNew } from '@proton/pass/components/Item/Identity/Identity.new';
import { LoginNew } from '@proton/pass/components/Item/Login/Login.new';
import { NoteNew } from '@proton/pass/components/Item/Note/Note.new';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import type { ItemNewRouteParams } from '@proton/pass/components/Navigation/routing';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { itemCreationIntent } from '@proton/pass/store/actions';
import { selectDefaultVault, selectMostRecentVault, selectVaultLimits } from '@proton/pass/store/selectors';
import type { ItemCreateIntent, ItemType } from '@proton/pass/types';

const itemNewMap: { [T in ItemType]: FC<ItemNewViewProps<T>> } = {
    login: LoginNew,
    note: NoteNew,
    alias: AliasNew,
    creditCard: CreditCardNew,
    identity: IdentityNew,
};

export const ItemNew: FC = () => {
    const { getCurrentTabUrl } = usePassCore();
    const { selectItem, setFilters, filters } = useNavigation();
    const selectedShareId = filters.selectedShareId;

    const history = useHistory();
    const dispatch = useDispatch();

    const { type } = useParams<ItemNewRouteParams>();
    const { didDowngrade } = useSelector(selectVaultLimits);

    /* if user downgraded - always auto-select the default vault id */
    const defaultVault = useSelector(selectDefaultVault);
    const mostRecentVault = useSelector(selectMostRecentVault);
    const shareId = didDowngrade ? defaultVault.shareId : (selectedShareId ?? mostRecentVault);

    const ItemNewComponent = itemNewMap[type];

    const handleSubmit = (createIntent: ItemCreateIntent) => {
        dispatch(itemCreationIntent(createIntent));

        /* if the user put the item in a vault which is currently not selected,
         *  autoselect it so the following call to `selectItem` passes */
        if (selectedShareId && selectedShareId !== createIntent.shareId) {
            setFilters({ selectedShareId: createIntent.shareId });
        }

        selectItem(createIntent.shareId, createIntent.optimisticId, { mode: 'replace' });
    };

    const handleCancel = () => history.goBack();

    return (
        <ItemNewComponent
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            shareId={shareId}
            url={getCurrentTabUrl?.() ?? null}
        />
    );
};
