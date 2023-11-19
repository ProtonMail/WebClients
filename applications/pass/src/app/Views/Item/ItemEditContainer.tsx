import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { AliasEdit } from '@proton/pass/components/Item/Alias/Alias.edit';
import { CreditCardEdit } from '@proton/pass/components/Item/CreditCard/CreditCard.edit';
import { LoginEdit } from '@proton/pass/components/Item/Login/Login.edit';
import { NoteEdit } from '@proton/pass/components/Item/Note/Note.edit';
import type { ItemEditViewProps, ItemRouteParams } from '@proton/pass/components/Views/types';
import { itemEditIntent } from '@proton/pass/store/actions';
import { selectItemByShareIdAndId, selectShareOrThrow } from '@proton/pass/store/selectors';
import type { ItemEditIntent, ItemType, ShareType } from '@proton/pass/types';

const itemEditMap: { [T in ItemType]: VFC<ItemEditViewProps<T>> } = {
    login: LoginEdit,
    note: NoteEdit,
    alias: AliasEdit,
    creditCard: CreditCardEdit,
};

export const ItemEditContainer: VFC = () => {
    //const location = useLocation();
    // TODO const url = location.pathname;
    const { shareId, itemId } = useParams<ItemRouteParams>();
    const dispatch = useDispatch();

    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const item = useSelector(selectItemByShareIdAndId(shareId, itemId));

    const handleSubmit = (data: ItemEditIntent) => {
        dispatch(itemEditIntent(data));
        // selectItem(shareId, itemId) we gonna heve this from route
    };

    if (!item) {
        return <Redirect to="/" />;
    }

    const EditViewComponent = itemEditMap[item.data.type] as VFC<ItemEditViewProps>;

    return <EditViewComponent vault={vault} revision={item} onSubmit={handleSubmit} url={null} onCancel={() => {}} />;
};
