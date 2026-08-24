import { type FC, memo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { useOptimisticItem } from '../../../hooks/useItem';
import { getItemKey } from '../../../lib/items/item.utils';
import { selectIsOptimisticId, selectShare } from '../../../store/selectors';
import type { ItemType, SelectedItem } from '../../../types';
import { useNavigationActions } from '../../Navigation/NavigationActions';
import { useItemScope } from '../../Navigation/NavigationMatches';
import { getItemRoute, getLocalPath } from '../../Navigation/routing';
import { SecureLinkModal } from '../../SecureLink/SecureLinkModal';
import type { ItemViewProps } from '../../Views/types';
import { AliasView } from '../Alias/Alias.view';
import { CreditCardView } from '../CreditCard/CreditCard.view';
import { CustomView } from '../Custom/Custom.view';
import { IdentityView } from '../Identity/Identity.view';
import { LoginView } from '../Login/Login.view';
import { NoteView } from '../Note/Note.view';

const itemTypeViewMap: { [T in ItemType]: FC<ItemViewProps<T>> } = {
    login: LoginView,
    note: NoteView,
    alias: AliasView,
    creditCard: CreditCardView,
    identity: IdentityView,
    sshKey: CustomView,
    wifi: CustomView,
    custom: CustomView,
};

export const ItemView = memo(({ shareId, itemId }: SelectedItem) => {
    const scope = useItemScope();
    const { preserveSearch } = useNavigationActions();

    const [openSecureLinkModal, setOpenSecureLinkModal] = useState(false);

    const optimisticResolved = useSelector(selectIsOptimisticId(itemId));

    const share = useSelector(selectShare(shareId));
    const item = useOptimisticItem(shareId, itemId);

    /* if vault or item cannot be found : redirect to base path */
    if (!(share && item)) {
        const to = preserveSearch(getLocalPath(scope ?? ''));
        return <Redirect to={to} push={false} />;
    }

    /* if the item is optimistic and can be resolved to a non-optimistic item : replace */
    if (optimisticResolved) {
        const to = preserveSearch(getItemRoute(shareId, item.itemId, { scope }));
        return <Redirect to={to} push={false} />;
    }

    const handleSecureLink = () => setOpenSecureLinkModal(true);

    const ItemTypeViewComponent = itemTypeViewMap[item.data.type] as FC<ItemViewProps>;

    return (
        <>
            <ItemTypeViewComponent
                key={item.itemId}
                share={share}
                revision={item}
                handleSecureLinkClick={handleSecureLink}
            />

            {openSecureLinkModal && (
                <SecureLinkModal
                    key={getItemKey(item)}
                    shareId={shareId}
                    itemId={itemId}
                    onClose={() => setOpenSecureLinkModal(false)}
                    open
                />
            )}
        </>
    );
});

ItemView.displayName = 'ItemViewMemo';
