import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { AliasEdit } from '@proton/pass/components/Item/Alias/Alias.edit';
import { CreditCardEdit } from '@proton/pass/components/Item/CreditCard/CreditCard.edit';
import { IdentityEdit } from '@proton/pass/components/Item/Identity/Identity.edit';
import { LoginEdit } from '@proton/pass/components/Item/Login/Login.edit';
import { NoteEdit } from '@proton/pass/components/Item/Note/Note.edit';
import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { useItem } from '@proton/pass/hooks/useItem';
import { itemEdit } from '@proton/pass/store/actions';
import { selectShare } from '@proton/pass/store/selectors';
import type { ItemEditIntent, ItemType, SelectedItem } from '@proton/pass/types';

const itemEditMap: { [T in ItemType]: FC<ItemEditViewProps<T>> } = {
    login: LoginEdit,
    note: NoteEdit,
    alias: AliasEdit,
    creditCard: CreditCardEdit,
    identity: IdentityEdit,
};

export const ItemEdit: FC = () => {
    const { getExtensionClientState } = usePassCore();
    const { shareId, itemId } = useParams<SelectedItem>();

    const nav = useNavigationActions();
    const scope = useItemScope();
    const dispatch = useDispatch();

    const share = useSelector(selectShare(shareId));
    const item = useItem(shareId, itemId);

    const handleSubmit = (data: ItemEditIntent) => {
        dispatch(itemEdit.intent(data));
        nav.selectItem(shareId, itemId, { mode: 'replace', scope });
    };

    if (!(item && share)) return <Redirect to={nav.preserveSearch(getLocalPath())} push={false} />;

    const EditViewComponent = itemEditMap[item.data.type] as FC<ItemEditViewProps>;

    return (
        <EditViewComponent
            onCancel={() => nav.selectItem(shareId, itemId, { scope })}
            onSubmit={handleSubmit}
            revision={item}
            url={getExtensionClientState?.()?.url ?? null}
            share={share}
        />
    );
};
