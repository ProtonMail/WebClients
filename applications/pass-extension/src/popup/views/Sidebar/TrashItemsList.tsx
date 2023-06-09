import { type FC, useRef } from 'react';
import { List } from 'react-virtualized';

import { c } from 'ttag';

import { itemEq } from '@proton/pass/utils/pass/items';

import { ListItemLink } from '../../../shared/components/router';
import { ItemsListItem } from '../../components/Item/ItemsListItem';
import { VirtualList } from '../../components/List/VirtualList';
import { useItems } from '../../hooks/useItems';
import { useNavigationContext } from '../../hooks/useNavigationContext';
import { useSelectItemClick } from '../../hooks/useSelectItemClick';

export const TrashItemsList: FC = () => {
    const { selectedItem } = useNavigationContext();
    const onSelectItem = useSelectItemClick();

    const {
        trash: { result, count, totalCount },
        filtering: { search },
    } = useItems();

    const listRef = useRef<List>(null);

    return count === 0 ? (
        <div className="absolute-center flex flex-justify-center flex-align-items-center w70">
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
            rowCount={count}
            rowRenderer={({ style, index }) => {
                const item = result[index];
                return (
                    <div style={style} key={item.itemId}>
                        <ItemsListItem
                            item={item}
                            id={`item-${item.shareId}-${item.itemId}`}
                            component={ListItemLink}
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
