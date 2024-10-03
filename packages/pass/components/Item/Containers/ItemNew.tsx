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
import { type ItemNewRouteParams } from '@proton/pass/components/Navigation/routing';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { itemCreationIntent } from '@proton/pass/store/actions';
import {
    selectDefaultVault,
    selectMostRecentVaultShareID,
    selectShare,
    selectVaultLimits,
} from '@proton/pass/store/selectors';
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

    const defaultVault = useSelector(selectDefaultVault);
    const mostRecentVaultShareID = useSelector(selectMostRecentVaultShareID);
    const selectedVault = useSelector(selectShare(selectedShareId));

    const shareId = (() => {
        /**  if user downgraded : always auto-select the default vault id */
        if (didDowngrade) return defaultVault?.shareId;
        /** If we have a selected share : ensure it is writable */
        if (selectedShareId && selectedVault && isWritableVault(selectedVault)) return selectedShareId;
        /** Else select the most recently used writable/own vault */
        return mostRecentVaultShareID;
    })();

    if (!shareId) history.goBack();

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

    const ItemNewComponent = itemNewMap[type];

    return (
        shareId && (
            <ItemNewComponent
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                shareId={shareId}
                url={getCurrentTabUrl?.() ?? null}
            />
        )
    );
};
