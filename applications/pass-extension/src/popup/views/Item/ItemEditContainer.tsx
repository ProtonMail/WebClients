import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { itemEditIntent, selectItemByShareIdAndId, selectShareOrThrow } from '@proton/pass/store';
import type { ItemEditIntent, ItemType, SelectedItem } from '@proton/pass/types';
import type { ShareType } from '@proton/pass/types';

import type { ItemEditProps } from '../../../shared/items';
import { useNavigationContext } from '../../hooks/useNavigationContext';
import { AliasEdit } from './Alias/Alias.edit';
import { CreditCardEdit } from './CreditCard/CreditCard.edit';
import { LoginEdit } from './Login/Login.edit';
import { NoteEdit } from './Note/Note.edit';

const itemEditMap: { [T in ItemType]: VFC<ItemEditProps<T>> } = {
    login: LoginEdit,
    note: NoteEdit,
    alias: AliasEdit,
    creditCard: CreditCardEdit,
};

export const ItemEditContainer: VFC = () => {
    const { selectItem } = useNavigationContext();
    const dispatch = useDispatch();

    const { shareId, itemId } = useParams<SelectedItem>();
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const item = useSelector(selectItemByShareIdAndId(shareId, itemId));

    const handleSubmit = (data: ItemEditIntent) => {
        dispatch(itemEditIntent(data));
        selectItem(shareId, itemId);
    };

    const handleCancel = () => selectItem(shareId, itemId);

    if (!item) {
        return <Redirect to="/" />;
    }

    const EditViewComponent = itemEditMap[item.data.type] as VFC<ItemEditProps>;

    return <EditViewComponent vault={vault} revision={item} onSubmit={handleSubmit} onCancel={handleCancel} />;
};
