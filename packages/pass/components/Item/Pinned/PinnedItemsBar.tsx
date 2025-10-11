import { type FC, memo, useCallback, useMemo } from 'react';
import { useSelector, useStore } from 'react-redux';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import { PINNED_ITEM_MAX_WIDTH_PX, PinnedItem } from '@proton/pass/components/Item/Pinned/PinnedItem';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { SafeItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { useSelectItem } from '@proton/pass/components/Navigation/NavigationActions';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import type { ItemScope } from '@proton/pass/components/Navigation/routing';
import { getInitialFilters } from '@proton/pass/components/Navigation/routing';
import { useResponsiveHorizontalList } from '@proton/pass/hooks/useResponsiveHorizontalList';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { isTrashed, itemEq } from '@proton/pass/lib/items/item.predicates';
import { sortItems } from '@proton/pass/lib/items/item.utils';
import { isItemShare } from '@proton/pass/lib/shares/share.predicates';
import { selectPinnedItems, selectShare } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision, ItemSortFilter } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './PinnedItemsBar.scss';

type Props = {
    sort: ItemSortFilter;
    onSelect: (item: ItemRevision) => void;
};

const PinnedItemBarContent = memo(({ sort, onSelect }: Props) => {
    const selectedItem = useSelectedItem();
    const pinnedItems = useSelector(selectPinnedItems);
    const items = useMemo(() => sortItems(sort)(pinnedItems), [pinnedItems, sort]);
    const list = useResponsiveHorizontalList(items, { gap: 8, maxChildWidth: PINNED_ITEM_MAX_WIDTH_PX });

    return items.length === 0 ? null : (
        <div className="pass-pinned-items-list flex flex-auto w-full shrink-0 flex-1 items-center flex-nowrap py-1 px-3 border-bottom border-weak">
            <span className="flex items-center justify-center flex-nowrap text-sm text-no-wrap shrink-0 pr-4 border-right border-weak mr-2">
                <Icon name="pin-angled" className="ml-1 mr-2" />
                {
                    // translator: "Pinned" is followed by the number of pinned items
                    c('Title').t`Pinned (${items.length})`
                }
            </span>
            <div className="flex flex-1 flex-nowrap" ref={list.ref}>
                {list.visible.map((item) => (
                    <PinnedItem
                        active={selectedItem && itemEq(selectedItem)(item)}
                        className="mr-2"
                        item={item}
                        key={item.shareId + item.itemId}
                        onClick={onSelect}
                        pill={false}
                    />
                ))}
            </div>
            {list.hidden.length > 0 && (
                <QuickActionsDropdown
                    icon="three-dots-horizontal"
                    color="weak"
                    shape="solid"
                    size="small"
                    className="p-1 button-xs ui-violet"
                    pill={false}
                >
                    {(opened) =>
                        opened &&
                        list.hidden.map((item) => (
                            <DropdownMenuButton
                                key={item.itemId}
                                icon={
                                    <SafeItemIcon
                                        className={clsx('shrink-0', itemTypeToSubThemeClassName[item.data.type])}
                                        item={item}
                                        size={3}
                                        pill={false}
                                    />
                                }
                                className={clsx(
                                    'pass-pinned-bar--item',
                                    selectedItem && itemEq(selectedItem)(item) && 'is-active'
                                )}
                                onClick={() => onSelect(item)}
                                label={item.data.metadata.name}
                                labelClassname="text-sm"
                            />
                        ))
                    }
                </QuickActionsDropdown>
            )}
        </div>
    );
});

PinnedItemBarContent.displayName = 'PinnedItemBarContentMemo';

export const PinnedItemsBar: FC = () => {
    const store = useStore<State>();
    const selectItem = useSelectItem();
    const { filters } = useNavigationFilters();
    const filtersRef = useStatefulRef(filters);

    /** Updates navigation on item select:
     * Trashed items -> trash view with reset filters
     * Regular items -> share view with preserved/updated shareId filter */
    const onSelect = useCallback((item: ItemRevision) => {
        const { shareId, itemId } = item;
        const share = selectShare(shareId)(store.getState());
        if (!share) return;

        const trashed = isTrashed(item);
        const sharedWithMe = isItemShare(share);

        const scope = ((): ItemScope => {
            if (sharedWithMe) return 'shared-with-me';
            if (trashed) return 'trash';
            return 'share';
        })();

        const { type, selectedShareId } = filtersRef?.current ?? {};

        selectItem(shareId, itemId, {
            scope,
            filters:
                trashed || sharedWithMe
                    ? getInitialFilters()
                    : {
                          search: '',
                          selectedShareId: selectedShareId !== null ? shareId : null,
                          type: type !== '*' && type !== item.data.type ? '*' : type,
                      },
        });
    }, []);

    return <PinnedItemBarContent sort={filters.sort} onSelect={onSelect} />;
};
