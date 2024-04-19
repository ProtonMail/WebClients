import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { AliasEdit } from '@proton/pass/components/Item/Alias/Alias.edit';
import { CreditCardEdit } from '@proton/pass/components/Item/CreditCard/CreditCard.edit';
import { LoginEdit } from '@proton/pass/components/Item/Login/Login.edit';
import { NoteEdit } from '@proton/pass/components/Item/Note/Note.edit';
import { useItemRoute } from '@proton/pass/components/Navigation/ItemSwitch';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { itemEditIntent } from '@proton/pass/store/actions';
import { selectItemByShareIdAndId, selectShare } from '@proton/pass/store/selectors';
import type { ItemEditIntent, ItemType, SelectedItem, ShareType } from '@proton/pass/types';

const itemEditMap: { [T in ItemType]: FC<ItemEditViewProps<T>> } = {
    login: LoginEdit,
    note: NoteEdit,
    alias: AliasEdit,
    creditCard: CreditCardEdit,
};

export const ItemEdit: FC = () => {
    const { prefix } = useItemRoute();
    const { getCurrentTabUrl } = usePassCore();
    const { shareId, itemId } = useParams<SelectedItem>();
    const { selectItem, preserveSearch } = useNavigation();
    const dispatch = useDispatch();

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const item = useSelector(selectItemByShareIdAndId(shareId, itemId));

    const handleSubmit = (data: ItemEditIntent) => {
        dispatch(itemEditIntent(data));
        selectItem(shareId, itemId, { mode: 'replace', prefix });
    };

    if (!(item && vault)) return <Redirect to={preserveSearch(getLocalPath())} push={false} />;

    const EditViewComponent = itemEditMap[item.data.type] as FC<ItemEditViewProps>;

    return (
        <EditViewComponent
            onCancel={() => selectItem(shareId, itemId, { prefix })}
            onSubmit={handleSubmit}
            revision={item}
            url={getCurrentTabUrl?.() ?? null}
            vault={vault}
        />
    );
};
