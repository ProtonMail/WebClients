import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { useItem } from '../../../hooks/useItem';
import { itemEdit } from '../../../store/actions';
import { selectShare } from '../../../store/selectors';
import type { ItemEditIntent, ItemType, SelectedItem } from '../../../types';
import { usePassCore } from '../../Core/PassCoreProvider';
import { useNavigationActions } from '../../Navigation/NavigationActions';
import { useItemScope } from '../../Navigation/NavigationMatches';
import { getLocalPath } from '../../Navigation/routing';
import type { ItemEditViewProps } from '../../Views/types';
import { AliasEdit } from '../Alias/Alias.edit';
import { CreditCardEdit } from '../CreditCard/CreditCard.edit';
import { CustomEdit } from '../Custom/Custom.edit';
import { IdentityEdit } from '../Identity/Identity.edit';
import { LoginEdit } from '../Login/Login.edit';
import { NoteEdit } from '../Note/Note.edit';

const itemEditMap: { [T in ItemType]: FC<ItemEditViewProps<T>> } = {
    login: LoginEdit,
    note: NoteEdit,
    alias: AliasEdit,
    creditCard: CreditCardEdit,
    identity: IdentityEdit,
    sshKey: CustomEdit,
    wifi: CustomEdit,
    custom: CustomEdit,
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
