import { type FC, memo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { AliasView } from '@proton/pass/components/Item/Alias/Alias.view';
import { CreditCardView } from '@proton/pass/components/Item/CreditCard/CreditCard.view';
import { CustomView } from '@proton/pass/components/Item/Custom/Custom.view';
import { IdentityView } from '@proton/pass/components/Item/Identity/Identity.view';
import { LoginView } from '@proton/pass/components/Item/Login/Login.view';
import { NoteView } from '@proton/pass/components/Item/Note/Note.view';
import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { getItemRoute, getLocalPath } from '@proton/pass/components/Navigation/routing';
import { SecureLinkModal } from '@proton/pass/components/SecureLink/SecureLinkModal';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useOptimisticItem } from '@proton/pass/hooks/useItem';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { selectIsOptimisticId, selectShare } from '@proton/pass/store/selectors';
import type { ItemType, SelectedItem } from '@proton/pass/types';

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
