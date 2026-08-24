import { memo, useCallback, useEffect } from 'react';
import { useStore } from 'react-redux';

import { useSelectItemAction } from '../../../hooks/useSelectItemAction';
import { selectIsWritableVault } from '../../../store/selectors';
import type { State } from '../../../store/types';
import type { ItemRevision } from '../../../types';
import { useBulkActions } from '../../Bulk/BulkSelectionActions';
import { useBulkEnabled } from '../../Bulk/BulkSelectionState';
import { useNavigationFilters } from '../../Navigation/NavigationFilters';
import { useSelectedItem } from '../../Navigation/NavigationItem';
import { useItemScope } from '../../Navigation/NavigationMatches';
import type { ItemScope } from '../../Navigation/routing';
import { useItems } from '../Context/ItemsProvider';
import { ItemsListBase } from './ItemsListBase';
import { ItemsListHeader } from './ItemsListHeader';
import { ItemsListPlaceholder } from './ItemsListPlaceholder';

const BulkEnabledRoutes: ItemScope[] = ['share', 'trash'];
const canBulk = (prefix?: ItemScope) => prefix && BulkEnabledRoutes.includes(prefix);

export const ItemsList = memo(() => {
    const store = useStore<State>();
    const scope = useItemScope();

    const items = useItems();
    const selectedItem = useSelectedItem();

    const bulk = useBulkActions();
    const bulkEnabled = useBulkEnabled();

    const selectItem = useSelectItemAction();
    const { filters, setFilters } = useNavigationFilters();

    const handleSelect = useCallback(
        (item: ItemRevision, metaKey: boolean) => {
            if (canBulk(scope) && (metaKey || bulkEnabled)) {
                if (selectIsWritableVault(item.shareId)(store.getState())) {
                    if (!bulkEnabled) bulk.enable();
                    bulk.toggle(item);
                }
            } else selectItem(item, { scope });
        },
        [bulkEnabled, scope]
    );

    useEffect(bulk.disable, [selectedItem, scope]);

    return (
        <>
            <ItemsListHeader />
            <ItemsListBase
                filters={filters}
                items={items.filtered}
                totalCount={items.totalCount}
                onFilter={setFilters}
                onSelect={handleSelect}
                selectedItem={selectedItem}
                placeholder={<ItemsListPlaceholder />}
            />
        </>
    );
});

ItemsList.displayName = 'ItemsListMemo';
