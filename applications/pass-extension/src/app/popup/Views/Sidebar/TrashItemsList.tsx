import { type FC, useRef } from 'react';
import type { List } from 'react-virtualized';

import { useTrashItems } from 'proton-pass-extension/lib/hooks/useItems';
import { useNavigationContext } from 'proton-pass-extension/lib/hooks/useNavigationContext';
import { useSelectItemClick } from 'proton-pass-extension/lib/hooks/useSelectItemClick';
import { c } from 'ttag';

import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsList.Item';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { itemEq } from '@proton/pass/lib/items/item.predicates';

export const TrashItemsList: FC = () => {
    const { selectedItem } = useNavigationContext();
    const onSelectItem = useSelectItemClick();

    const {
        filtering: { search },
        searched,
        totalCount,
    } = useTrashItems();

    const listRef = useRef<List>(null);

    return searched.length === 0 ? (
        <div className="absolute-center flex flex-justify-center flex-align-items-center w-4/6">
            <span className="block text-break color-weak text-sm p-2 text-center text-break">
                {totalCount === 0 ? (
                    <span>
                        <strong>{c('Title').t`Trash empty`}</strong>
                        <br /> {c('Info').t`Deleted items will be moved here first`}
                    </span>
                ) : (
                    <span>
                        {c('Warning').t`No items in trash matching`}
                        <br />"{search}"
                    </span>
                )}
            </span>
        </div>
    ) : (
        <VirtualList
            ref={listRef}
            rowCount={searched.length}
            rowRenderer={({ style, index }) => {
                const item = searched[index];
                return (
                    <div style={style} key={item.itemId}>
                        <ItemsListItem
                            item={item}
                            id={`item-${item.shareId}-${item.itemId}`}
                            onClick={onSelectItem(item, { inTrash: true })}
                            search={search}
                            active={selectedItem && itemEq(selectedItem)(item)}
                        />
                    </div>
                );
            }}
        />
    );
};
