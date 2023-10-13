import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { useNavigationContext } from 'proton-pass-extension/lib/hooks/useNavigationContext';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';

import { AliasEdit } from '@proton/pass/components/Item/Alias/Alias.edit';
import { CreditCardEdit } from '@proton/pass/components/Item/CreditCard/CreditCard.edit';
import { LoginEdit } from '@proton/pass/components/Item/Login/Login.edit';
import { NoteEdit } from '@proton/pass/components/Item/Note/Note.edit';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { itemEditIntent } from '@proton/pass/store/actions';
import { selectItemByShareIdAndId, selectShareOrThrow } from '@proton/pass/store/selectors';
import type { ItemEditIntent, ItemType, SelectedItem, ShareType } from '@proton/pass/types';

const itemEditMap: { [T in ItemType]: VFC<ItemEditViewProps<T>> } = {
    login: LoginEdit,
    note: NoteEdit,
    alias: AliasEdit,
    creditCard: CreditCardEdit,
};

export const ItemEditContainer: VFC = () => {
    const { url } = usePopupContext();
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

    const EditViewComponent = itemEditMap[item.data.type] as VFC<ItemEditViewProps>;

    return (
        <EditViewComponent vault={vault} revision={item} onSubmit={handleSubmit} onCancel={handleCancel} url={url} />
    );
};
