import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { getLocalPath, preserveSearch } from '@proton/pass/components/Core/routing';
import { AliasEdit } from '@proton/pass/components/Item/Alias/Alias.edit';
import { CreditCardEdit } from '@proton/pass/components/Item/CreditCard/CreditCard.edit';
import { LoginEdit } from '@proton/pass/components/Item/Login/Login.edit';
import { NoteEdit } from '@proton/pass/components/Item/Note/Note.edit';
import type { ItemEditViewProps, ItemRouteParams } from '@proton/pass/components/Views/types';
import { itemEditIntent } from '@proton/pass/store/actions';
import { selectItemByShareIdAndId, selectShare } from '@proton/pass/store/selectors';
import type { ItemEditIntent, ItemType, ShareType } from '@proton/pass/types';

const itemEditMap: { [T in ItemType]: VFC<ItemEditViewProps<T>> } = {
    login: LoginEdit,
    note: NoteEdit,
    alias: AliasEdit,
    creditCard: CreditCardEdit,
};

export const ItemEdit: VFC = () => {
    const { shareId, itemId } = useParams<ItemRouteParams>();
    const { selectItem } = useNavigation();
    const dispatch = useDispatch();

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const item = useSelector(selectItemByShareIdAndId(shareId, itemId));

    const handleSubmit = (data: ItemEditIntent) => {
        dispatch(itemEditIntent(data));
        selectItem(shareId, itemId, { mode: 'replace', preserveSearch: true });
    };

    if (!(item && vault)) return <Redirect to={preserveSearch(getLocalPath('/'))} push={false} />;

    const EditViewComponent = itemEditMap[item.data.type] as VFC<ItemEditViewProps>;
    return (
        <EditViewComponent
            vault={vault}
            revision={item}
            onSubmit={handleSubmit}
            url={null}
            onCancel={() => selectItem(shareId, itemId, { mode: 'replace' })}
        />
    );
};
