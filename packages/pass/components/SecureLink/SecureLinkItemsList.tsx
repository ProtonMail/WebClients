import { type FC, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { DropdownButton, Icon } from '@proton/components';
import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getItemRoute, getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { secureLinksGet } from '@proton/pass/store/actions';
import { secureLinksGetRequest } from '@proton/pass/store/actions/requests';
import { selectAllSecureLinks, selectOptimisticItemsWithSecureLink } from '@proton/pass/store/selectors';
import type { SelectedItem } from '@proton/pass/types';

import { SecureLinkQuickActions } from './SecureLinkQuickActions';

export const SecureLinkItemsList: FC = () => {
    const { navigate } = useNavigation();
    const listRef = useRef<List>(null);
    const selectItem = useSelectItemAction();

    const { loading, dispatch } = useRequest(secureLinksGet, { initialRequestId: secureLinksGetRequest() });
    const secureLinkCount = useSelector(selectAllSecureLinks).length;
    const items = useSelector(selectOptimisticItemsWithSecureLink);
    const itemRoute = getItemRoute(':shareId', ':itemId', { prefix: 'secure-links' });
    const selectedItem = useRouteMatch<SelectedItem>(itemRoute)?.params;

    useEffect(() => {
        if (items.length > 0 && !selectedItem) {
            const [item] = items;
            selectItem(item, { prefix: 'secure-links', mode: 'replace' });
        }

        if (!items.length && selectedItem) navigate(getLocalPath('secure-links'));
    }, [selectedItem, items]);

    useEffect(() => dispatch(), []);

    if (items.length > 0) {
        return (
            <>
                <div className="flex flex-row grow-0 shrink-0 flex-nowrap p-3 gap-1 overflow-x-auto justify-space-between">
                    <div className="flex flex-1 gap-1 shrink-0 flex-nowrap justify-space-between">
                        <DropdownButton
                            color="weak"
                            shape="solid"
                            size="small"
                            className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold"
                        >
                            <Icon name="link" className="shrink-0" />
                            <span className="text-ellipsis hidden sm:block">
                                {c('Action').t`Secure links`} ({secureLinkCount})
                            </span>
                        </DropdownButton>
                        <SecureLinkQuickActions />
                    </div>
                </div>
                <VirtualList
                    ref={listRef}
                    rowCount={items.length}
                    rowHeight={() => 54}
                    rowRenderer={({ style, index, key }) => {
                        const item = items[index];
                        const id = getItemKey(item);

                        return (
                            <div style={style} key={key}>
                                <ItemsListItem
                                    active={selectedItem && itemEq(selectedItem)(item)}
                                    failed={item.failed}
                                    id={id}
                                    item={item}
                                    key={id}
                                    optimistic={item.optimistic}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        selectItem(item, { prefix: 'secure-links' });
                                    }}
                                />
                            </div>
                        );
                    }}
                />
            </>
        );
    }

    return (
        <div className="flex items-center justify-center color-weak text-sm text-center text-break h-full">
            {loading ? <CircleLoader size="small" /> : <strong>{c('Title').t`No shared secure links`}</strong>}
        </div>
    );
};
