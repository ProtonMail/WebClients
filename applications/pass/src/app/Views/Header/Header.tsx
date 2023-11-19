import { type FC } from 'react';

import { Header as CoreHeader } from '@proton/components';
import { getLocalPath, useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import type { ItemType } from '@proton/pass/types';

export const Header: FC = () => {
    const { filters, setFilters, navigate } = useNavigation();
    const onNewItem = (type: ItemType) => navigate(getLocalPath(`item/new/${type}`));

    return (
        <CoreHeader className="border-bottom h-auto p-2">
            <div className="flex flex-align-items-center gap-x-2 w-full">
                <SearchBar filters={filters} onChange={(search) => setFilters({ search })} />
                <ItemQuickActions onNewItem={onNewItem} />
            </div>
        </CoreHeader>
    );
};
