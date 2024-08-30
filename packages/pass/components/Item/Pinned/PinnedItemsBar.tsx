import { type FC, type MouseEventHandler, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Icon } from '@proton/components';
import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { PINNED_ITEM_MAX_WIDTH_PX, PinnedItem } from '@proton/pass/components/Item/Pinned/PinnedItem';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { SafeItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { useResponsiveHorizontalList } from '@proton/pass/hooks/useResponsiveHorizontalList';
import { isTrashed, itemEq } from '@proton/pass/lib/items/item.predicates';
import { sortItems } from '@proton/pass/lib/items/item.utils';
import { selectPinnedItems } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './PinnedItemsBar.scss';

export const PinnedItemsBar: FC = () => {
    const { selectedItem, selectItem, filters } = useNavigation();
    const { filtered } = useItems();

    const pinnedItems = useSelector(selectPinnedItems);
    const items = useMemo(() => sortItems(filters.sort)(pinnedItems), [pinnedItems, filters.sort]);
    const list = useResponsiveHorizontalList(items, { gap: 8, maxChildWidth: PINNED_ITEM_MAX_WIDTH_PX });

    const selectItemFactory =
        (item: ItemRevision): MouseEventHandler =>
        (e) => {
            e.preventDefault();
            const { shareId, itemId } = item;

            /** If pinned item is not in the current filtered
             * item list, reset the filters accordingly */
            selectItem(shareId, itemId, {
                inTrash: isTrashed(item),
                filters: !filtered.some(itemEq(item)) ? { search: '', selectedShareId: null, type: '*' } : {},
            });
        };

    return items.length === 0 ? null : (
        <div className="pass-pinned-items-list flex flex-auto w-full shrink-0 flex-1 items-center flex-nowrap py-1 px-3 border-bottom border-norm">
            <span className="flex items-center justify-center flex-nowrap text-sm text-no-wrap shrink-0 pr-4 border-right border-norm mr-2">
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
                        onClick={selectItemFactory(item)}
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
                    {list.hidden.map((item) => (
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
                            onClick={selectItemFactory(item)}
                            label={item.data.metadata.name}
                            labelClassname="text-sm"
                        />
                    ))}
                </QuickActionsDropdown>
            )}
        </div>
    );
};
