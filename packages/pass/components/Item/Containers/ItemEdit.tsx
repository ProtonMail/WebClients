import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { AliasEdit } from '@proton/pass/components/Item/Alias/Alias.edit';
import { CreditCardEdit } from '@proton/pass/components/Item/CreditCard/CreditCard.edit';
import { IdentityEdit } from '@proton/pass/components/Item/Identity/Identity.edit';
import { LoginEdit } from '@proton/pass/components/Item/Login/Login.edit';
import { NoteEdit } from '@proton/pass/components/Item/Note/Note.edit';
import { useItemRoute } from '@proton/pass/components/Navigation/ItemRouteContext';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { itemEditIntent } from '@proton/pass/store/actions';
import { selectItem, selectShare } from '@proton/pass/store/selectors';
import type { ItemEditIntent, ItemType, SelectedItem, ShareType } from '@proton/pass/types';

const itemEditMap: { [T in ItemType]: FC<ItemEditViewProps<T>> } = {
    login: LoginEdit,
    note: NoteEdit,
    alias: AliasEdit,
    creditCard: CreditCardEdit,
    identity: IdentityEdit,
};

export const ItemEdit: FC = () => {
    const { prefix } = useItemRoute();
    const { getCurrentTabUrl } = usePassCore();
    const { shareId, itemId } = useParams<SelectedItem>();
    const router = useNavigation();
    const dispatch = useDispatch();

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const item = useSelector(selectItem(shareId, itemId));

    const handleSubmit = (data: ItemEditIntent) => {
        dispatch(itemEditIntent(data));
        router.selectItem(shareId, itemId, { mode: 'replace', prefix });
    };

    if (!(item && vault)) return <Redirect to={router.preserveSearch(getLocalPath())} push={false} />;

    const EditViewComponent = itemEditMap[item.data.type] as FC<ItemEditViewProps>;

    return (
        <EditViewComponent
            onCancel={() => router.selectItem(shareId, itemId, { prefix })}
            onSubmit={handleSubmit}
            revision={item}
            url={getCurrentTabUrl?.() ?? null}
            vault={vault}
        />
    );
};
