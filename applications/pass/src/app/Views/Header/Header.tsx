import { type FC, type ReactElement } from 'react';

import { Header as CoreHeader } from '@proton/components';
import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Core/routing';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import type { ItemType } from '@proton/pass/types';

type Props = { hamburger?: ReactElement };

export const Header: FC<Props> = ({ hamburger }) => {
    const { filters, setFilters, navigate } = useNavigation();
    const onNewItem = (type: ItemType) => navigate(getLocalPath(`item/new/${type}`));

    return (
        <CoreHeader className="border-bottom h-auto p-2">
            <div className="flex flex-align-items-center gap-x-2 w-full">
                {hamburger}
                <SearchBar filters={filters} onChange={(search) => setFilters({ search })} />
                <ItemQuickActions onNewItem={onNewItem} />
            </div>
        </CoreHeader>
    );
};
