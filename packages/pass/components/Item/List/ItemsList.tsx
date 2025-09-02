import { memo, useCallback, useEffect } from 'react';
import { useStore } from 'react-redux';

import { useBulkActions } from '@proton/pass/components/Bulk/BulkSelectionActions';
import { useBulkEnabled } from '@proton/pass/components/Bulk/BulkSelectionState';
import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { ItemsListBase } from '@proton/pass/components/Item/List/ItemsListBase';
import { ItemsListHeader } from '@proton/pass/components/Item/List/ItemsListHeader';
import { ItemsListPlaceholder } from '@proton/pass/components/Item/List/ItemsListPlaceholder';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import type { ItemScope } from '@proton/pass/components/Navigation/routing';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { selectIsWritableVault } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

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
